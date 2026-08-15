/**
 * 天道玄机 — 易学数据全量校验脚本
 *
 * 校验项：
 *  1. 六十四卦：二进制（自下而上）与《周易》上下卦结构一致、卦序 1-64 唯一且连续
 *  2. 错卦（阴阳全反）、综卦（上下颠倒）、互卦（二三四爻/三四五爻）均能在数据表中命中
 *  3. 八个自综卦（乾、坤、坎、离、颐、大过、中孚、小过）的综卦为其自身
 *  4. getTiYong 在全部 64×6 个（卦×动爻位）组合下均返回有效结果
 *  5. getLineDetails 为每个有爻辞的卦返回 6 条完整爻辞
 *  6. 八字引擎冒烟测试（四柱结构、五行计数、月令强弱表、格局判定）
 *
 * 运行：npm run verify:hexagrams
 */
import { HEXAGRAMS_DATA, GET_HEX_BY_BINARY, getMutualHexagram, getOppositeHexagram, getInverseHexagram, getTiYong, getLineDetails, TRIGRAMS } from '../src/lib/iching-data.ts';
import { calculateBazi, getShiShen } from '../src/lib/lunar-service.ts';
import { getTodayAlmanac } from '../src/lib/almanac-service.ts';
import { buildLiuYao } from '../src/lib/liuyao.ts';
import { getShengXiaoRelations, calcHeHunScore, getZhiByShengXiao } from '../src/lib/hehun-service.ts';
import { getShenSha } from '../src/lib/shensha.ts';
import { calcXiYong } from '../src/lib/xiyong.ts';
import { getTwelveLiuYue, getTodayLiuRi } from '../src/lib/fortune-flow.ts';
import { getMonthZeri, scoreDay } from '../src/lib/zeri-service.ts';

let failures = 0;
const fail = (msg: string) => { failures++; console.error(`  ✗ ${msg}`); };
const ok = (msg: string) => console.log(`  ✓ ${msg}`);

// ── 标准卦表：卦名 → [下卦, 上卦]（周易序） ──────────────────────────────
const CANONICAL: Record<number, [string, string, string]> = {
  1: ['乾', '乾', '乾'], 2: ['坤', '坤', '坤'],
  3: ['屯', '震', '坎'], 4: ['蒙', '坎', '艮'],
  5: ['需', '乾', '坎'], 6: ['讼', '坎', '乾'],
  7: ['师', '坎', '坤'], 8: ['比', '坤', '坎'],
  9: ['小畜', '乾', '巽'], 10: ['履', '兑', '乾'],
  11: ['泰', '乾', '坤'], 12: ['否', '坤', '乾'],
  13: ['同人', '离', '乾'], 14: ['大有', '乾', '离'],
  15: ['谦', '艮', '坤'], 16: ['豫', '坤', '震'],
  17: ['随', '震', '兑'], 18: ['蛊', '巽', '艮'],
  19: ['临', '兑', '坤'], 20: ['观', '坤', '巽'],
  21: ['噬嗑', '震', '离'], 22: ['贲', '离', '艮'],
  23: ['剥', '坤', '艮'], 24: ['复', '震', '坤'],
  25: ['无妄', '震', '乾'], 26: ['大畜', '乾', '艮'],
  27: ['颐', '震', '艮'], 28: ['大过', '巽', '兑'],
  29: ['坎', '坎', '坎'], 30: ['离', '离', '离'],
  31: ['咸', '艮', '兑'], 32: ['恒', '巽', '震'],
  33: ['遁', '艮', '乾'], 34: ['大壮', '乾', '震'],
  35: ['晋', '坤', '离'], 36: ['明夷', '离', '坤'],
  37: ['家人', '离', '巽'], 38: ['睽', '兑', '离'],
  39: ['蹇', '艮', '坎'], 40: ['解', '坎', '震'],
  41: ['损', '兑', '艮'], 42: ['益', '震', '巽'],
  43: ['夬', '乾', '兑'], 44: ['姤', '巽', '乾'],
  45: ['萃', '坤', '兑'], 46: ['升', '巽', '坤'],
  47: ['困', '坎', '兑'], 48: ['井', '巽', '坎'],
  49: ['革', '离', '兑'], 50: ['鼎', '巽', '离'],
  51: ['震', '震', '震'], 52: ['艮', '艮', '艮'],
  53: ['渐', '艮', '巽'], 54: ['归妹', '兑', '震'],
  55: ['丰', '离', '震'], 56: ['旅', '艮', '离'],
  57: ['巽', '巽', '巽'], 58: ['兑', '兑', '兑'],
  59: ['涣', '坎', '巽'], 60: ['节', '兑', '坎'],
  61: ['中孚', '兑', '巽'], 62: ['小过', '艮', '震'],
  63: ['既济', '离', '坎'], 64: ['未济', '坎', '离'],
};

console.log('\n[1/6] 六十四卦二进制与卦序校验');
// TRIGRAMS 以二进制为键，构建 卦名 → 二进制 的映射
const NAME_TO_BINARY: Record<string, string> = {};
for (const [bin, meta] of Object.entries(TRIGRAMS)) NAME_TO_BINARY[meta.name] = bin;
const keys = Object.keys(HEXAGRAMS_DATA);
if (keys.length !== 64) fail(`数据表应有 64 卦，实际 ${keys.length}`);
else ok(`数据表包含 64 卦`);

const numbers = new Set<number>();
const byNumber = new Map<number, string>();
for (const bin of keys) {
  const hex = GET_HEX_BY_BINARY(bin);
  if (!/^[01]{6}$/.test(bin)) { fail(`${hex.name}: 二进制 ${bin} 非法`); continue; }
  if (numbers.has(hex.number)) { fail(`${hex.name}: 卦序 ${hex.number} 重复`); continue; }
  numbers.add(hex.number);
  byNumber.set(hex.number, bin);
  const canon = CANONICAL[hex.number];
  if (!canon) { fail(`${hex.name}: 卦序 ${hex.number} 超出 1-64`); continue; }
  const [cName, lower, upper] = canon;
  if (cName !== hex.name) { fail(`卦序 ${hex.number} 名称不符：期望 ${cName}，实际 ${hex.name}`); continue; }
  const expected = NAME_TO_BINARY[lower] + NAME_TO_BINARY[upper];
  if (bin !== expected) {
    fail(`${hex.name}(${hex.number}): 二进制应为 ${expected}（${lower}下${upper}上），实际 ${bin}`);
  }
  if (!hex.symbol) fail(`${hex.name}: 缺少卦画符号`);
  if (hex.lines && hex.lines.length !== 6) fail(`${hex.name}: 爻辞数量为 ${hex.lines.length}，应为 6`);
}
for (let n = 1; n <= 64; n++) {
  if (!numbers.has(n)) fail(`缺少卦序 ${n}`);
}
if (failures === 0) ok('全部 64 卦的二进制、卦名与卦序一致');

console.log('\n[2/6] 错卦 / 综卦 / 互卦完备性');
const SELF_INVERSE = new Set(['111111', '000000', '010010', '101101', '100001', '011110', '110011', '001100']);
for (const bin of keys) {
  const opp = getOppositeHexagram(bin);
  if (!HEXAGRAMS_DATA[opp]) fail(`${GET_HEX_BY_BINARY(bin).name}(${bin}): 错卦 ${opp} 不在数据表中`);
  const inv = getInverseHexagram(bin);
  if (!HEXAGRAMS_DATA[inv]) fail(`${GET_HEX_BY_BINARY(bin).name}(${bin}): 综卦 ${inv} 不在数据表中`);
  const mut = getMutualHexagram(bin);
  if (!HEXAGRAMS_DATA[mut]) fail(`${GET_HEX_BY_BINARY(bin).name}(${bin}): 互卦 ${mut} 不在数据表中`);
  if (SELF_INVERSE.has(bin) && inv !== bin) fail(`${GET_HEX_BY_BINARY(bin).name}: 应为自综卦，实际综卦为 ${GET_HEX_BY_BINARY(inv).name}`);
  if (!SELF_INVERSE.has(bin) && inv === bin) fail(`${GET_HEX_BY_BINARY(bin).name}: 不属于自综卦集合却被判定为自综`);
}
if (failures === 0) ok('错卦/综卦/互卦全部命中且自综卦判定正确');

console.log('\n[3/6] 体用关系全矩阵（64 卦 × 6 动爻位）');
const RELATIONS = new Set(['比和', '体克用', '体生用', '用克体', '用生体']);
for (const bin of keys) {
  for (let pos = 0; pos < 6; pos++) {
    const r = getTiYong(bin, pos);
    if (!r.ti || !r.yong || !r.tiElement || !r.yongElement) fail(`${bin}@${pos}: 体用信息缺失`);
    if (!RELATIONS.has(r.relation.split(' ')[0])) fail(`${bin}@${pos}: 生克关系异常 "${r.relation}"`);
    if (!r.relative || !r.description) fail(`${bin}@${pos}: 六亲/描述缺失`);
  }
  const none = getTiYong(bin, null);
  if (none.relative !== '无' || none.relation !== '无动爻') fail(`${bin}: 无动爻时应返回“无”`);
}
if (failures === 0) ok('体用矩阵 384 组合全部有效，无动爻分支正确');

console.log('\n[4/6] 爻辞与爻位详情');
let lineHexCount = 0;
for (const bin of keys) {
  const hex = GET_HEX_BY_BINARY(bin);
  if (!hex.lines) continue;
  lineHexCount++;
  const details = getLineDetails(hex, [0, 3]);
  if (details.length !== 6) { fail(`${hex.name}: getLineDetails 返回 ${details.length} 条`); continue; }
  for (let i = 0; i < 6; i++) {
    if (!details[i].text) fail(`${hex.name} ${['初','二','三','四','五','上'][i]}爻: 爻辞为空`);
    if (!details[i].positionContext) fail(`${hex.name} ${i}: 时位信息为空`);
    if (i === 0 || i === 3) {
      if (!details[i].analysis.includes('动爻')) fail(`${hex.name} ${i}: 动爻标注缺失`);
    }
  }
}
ok(`有爻辞的卦 ${lineHexCount} 个，爻位详情完整`);

console.log('\n[5/6] 变卦与三才卦例抽查');
// 乾 九五动 → 大有（111111 五爻动 → 111101）
const changed = GET_HEX_BY_BINARY('111111'.split('').map((c, i) => (i === 4 ? (c === '1' ? '0' : '1') : c)).join(''));
if (changed.name !== '大有') fail(`乾九五动应变大有，实际 ${changed.name}`);
// 复卦（地雷复 100000）互卦应为坤，错卦应为姤
const fuMutual = GET_HEX_BY_BINARY(getMutualHexagram('100000'));
const fuOpposite = GET_HEX_BY_BINARY(getOppositeHexagram('100000'));
if (fuOpposite.name !== '姤') fail(`复卦错卦应为姤，实际 ${fuOpposite.name}`);
if (fuMutual.name !== '坤') fail(`复卦互卦应为坤，实际 ${fuMutual.name}`);
// 谦综豫（001000 综 → 000100）；谦错履（001000 错 → 110111）；豫错小畜（000100 错 → 111011）
const qianInverse = GET_HEX_BY_BINARY(getInverseHexagram('001000'));
if (qianInverse.name !== '豫') fail(`谦卦综卦应为豫，实际 ${qianInverse.name}`);
const qianOpposite = GET_HEX_BY_BINARY(getOppositeHexagram('001000'));
if (qianOpposite.name !== '履') fail(`谦卦错卦应为履，实际 ${qianOpposite.name}`);
const yuOpposite = GET_HEX_BY_BINARY(getOppositeHexagram('000100'));
if (yuOpposite.name !== '小畜') fail(`豫卦错卦应为小畜，实际 ${yuOpposite.name}`);
ok('乾五爻变大有、复错姤、复互坤、谦综豫、谦错履、豫错小畜 均正确');

console.log('\n[6/6] 八字引擎冒烟测试');
const bazi = calculateBazi(new Date(2000, 0, 1, 12, 0), 'male');
const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour];
for (const p of pillars) {
  if (!/^[甲乙丙丁戊己庚辛壬癸]$/.test(p.stem)) fail(`天干非法: ${p.stem}`);
  if (!/^[子丑寅卯辰巳午未申酉戌亥]$/.test(p.branch)) fail(`地支非法: ${p.branch}`);
  if (!['金','木','水','火','土'].includes(p.element)) fail(`五行非法: ${p.element}`);
}
const total = Object.values(bazi.fiveElements).reduce((a, b) => a + b, 0);
if (total !== 8) fail(`五行计数应为 8（四柱干支各一），实际 ${total}`);
const strengthKeys = Object.keys(bazi.monthCommand.strength);
if (strengthKeys.length !== 5 || strengthKeys.some(k => !['旺','相','休','囚','死'].includes(bazi.monthCommand.strength[k]))) {
  fail(`月令旺衰表异常: ${JSON.stringify(bazi.monthCommand.strength)}`);
}
if (!bazi.structure?.name) fail('格局判定缺失');
if (!bazi.dayMasterElement || !['金','木','水','火','土'].includes(bazi.dayMasterElement)) fail(`日主五行非法: ${bazi.dayMasterElement}`);
ok(`例：2000-01-01 12:00 乾造 ${bazi.year.stem}${bazi.year.branch} ${bazi.month.stem}${bazi.month.branch} ${bazi.day.stem}${bazi.day.branch} ${bazi.hour.stem}${bazi.hour.branch} 日主${bazi.dayMaster}${bazi.dayMasterElement} 格局「${bazi.structure?.name}」`);

// 建禄格抽查：遍历 2014 寅月（立春 2/4 ~ 惊蛰 3/6），自动定位 甲日/乙日 验证建禄/月劫判定
let jianluChecked = false;
let yuejieChecked = false;
for (let d = new Date(2014, 1, 4, 10, 0); d < new Date(2014, 2, 6); d.setDate(d.getDate() + 1)) {
  const b = calculateBazi(new Date(d), 'male');
  if (b.month.branch !== '寅') continue;
  if (b.day.stem === '甲') {
    if (b.structure?.name !== '建禄格') fail(`甲日寅月应断「建禄格」，实际「${b.structure?.name}」（${b.month.stem}${b.month.branch} ${b.day.stem}日）`);
    else jianluChecked = true;
  }
  if (b.day.stem === '乙') {
    if (b.structure?.name !== '月劫格') fail(`乙日寅月应断「月劫格」，实际「${b.structure?.name}」（${b.month.stem}${b.month.branch} ${b.day.stem}日）`);
    else yuejieChecked = true;
  }
}
if (jianluChecked) ok('甲日寅月断「建禄格」验证通过');
else fail('未能定位到甲日寅月的测试日期');
if (yuejieChecked) ok('乙日寅月断「月劫格」验证通过');
else fail('未能定位到乙日寅月的测试日期');
// 阳刃格抽查：甲日卯月（2015 卯月 3/6 惊蛰 ~ 4/5 清明）
let yangrenChecked = false;
for (let d = new Date(2015, 2, 6, 10, 0); d < new Date(2015, 3, 5); d.setDate(d.getDate() + 1)) {
  const b = calculateBazi(new Date(d), 'male');
  if (b.month.branch !== '卯') continue;
  if (b.day.stem === '甲') {
    if (b.structure?.name !== '阳刃格') fail(`甲日卯月应断「阳刃格」，实际「${b.structure?.name}」（${b.month.stem}${b.month.branch} ${b.day.stem}日）`);
    else yangrenChecked = true;
  }
}
if (yangrenChecked) ok('甲日卯月断「阳刃格」验证通过');
else fail('未能定位到甲日卯月的测试日期');

console.log('\n[7/8] 十神判定校验（以甲木日主为坐标）');
const SHI_SHEN_CASES: [string, string][] = [
  ['甲', '比肩'], ['乙', '劫财'],
  ['丙', '食神'], ['丁', '伤官'],
  ['戊', '偏财'], ['己', '正财'],
  ['庚', '七杀'], ['辛', '正官'],
  ['壬', '偏印'], ['癸', '正印'],
];
for (const [stem, expected] of SHI_SHEN_CASES) {
  const got = getShiShen('甲', stem);
  if (got !== expected) fail(`甲日主 vs ${stem} 应为「${expected}」，实际「${got}」`);
}
ok('甲木日主十神全表正确');
// 阴干抽查：乙日主 vs 甲（劫财）、vs 丙（伤官）、vs 壬（正印）、vs 庚（正官）
const yinChecks: [string, string, string][] = [
  ['乙', '甲', '劫财'], ['乙', '丙', '伤官'], ['乙', '壬', '正印'], ['乙', '庚', '正官'], ['乙', '癸', '偏印'], ['乙', '乙', '比肩'],
];
for (const [dm, other, expected] of yinChecks) {
  const got = getShiShen(dm, other);
  if (got !== expected) fail(`${dm}日主 vs ${other} 应为「${expected}」，实际「${got}」`);
}
ok('阴干十神抽查正确');

console.log('\n[8/8] 大运 / 纳音 / 生肖 / 黄历校验');
const bz2 = calculateBazi(new Date(1990, 5, 15, 14, 0), 'female'); // 1990-06-15 14:00 坤造
for (const [label, p] of [['年', bz2.year], ['月', bz2.month], ['日', bz2.day], ['时', bz2.hour]] as const) {
  if (!p.naYin || p.naYin.length < 2) fail(`${label}柱纳音缺失: ${p.naYin}`);
  if (!p.shiShen) fail(`${label}柱十神缺失`);
}
if (!bz2.shengXiao) fail('生肖缺失');
if (!bz2.yun) {
  fail('大运排盘缺失');
} else {
  if (bz2.yun.periods.length < 8) fail(`大运应不少于 8 步，实际 ${bz2.yun.periods.length}`);
  let prevAge = 0;
  let currentCount = 0;
  for (const p of bz2.yun.periods) {
    if (!/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/.test(p.ganZhi)) fail(`大运干支非法: ${p.ganZhi}`);
    if (p.startAge <= prevAge) fail(`大运年龄未递增: ${p.startAge} <= ${prevAge}`);
    prevAge = p.endAge;
    if (p.isCurrent) currentCount++;
  }
  if (currentCount !== 1) fail(`当前大运应唯一，实际 ${currentCount} 个`);
  if (bz2.yun.liuNian.length !== 10) fail(`当前大运流年应为 10 个，实际 ${bz2.yun.liuNian.length}`);
  ok(`坤造 1990-06-15 14:00：生肖${bz2.shengXiao}，起运「${bz2.yun.startText}」，8 步大运完整，当前大运 ${bz2.yun.periods.find(p => p.isCurrent)?.ganZhi}`);
}
const almanac = getTodayAlmanac(new Date());
if (!almanac.dayGanZhi || !almanac.lunarDate) fail('黄历日期信息缺失');
if (!Array.isArray(almanac.yi) || !Array.isArray(almanac.ji)) fail('黄历宜忌缺失');
if (!almanac.chong || !almanac.sha) fail('黄历冲煞缺失');
const posKeys = Object.keys(almanac.positions);
if (posKeys.length !== 5 || posKeys.some(k => !almanac.positions[k as keyof typeof almanac.positions])) fail('黄历神煞方位缺失');
if (!almanac.zhiXing || !almanac.tianShen || !almanac.tianShenType) fail('黄历值星/天神缺失');
ok(`今日黄历：${almanac.lunarDate} ${almanac.dayGanZhi}日，宜[${almanac.yi.slice(0, 3).join('、')}${almanac.yi.length > 3 ? '…' : ''}]，${almanac.tianShen}(${almanac.tianShenType})`);

console.log('\n[9/8] 辅星 / 藏干十神 / 吉时 / 卦签 / 六爻纳甲 / 合婚');
// 辅星三垣
if (!bz2.auxStars.taiYuan.ganZhi || !bz2.auxStars.taiYuan.naYin) fail('胎元缺失');
if (!bz2.auxStars.mingGong.ganZhi) fail('命宫缺失');
if (!bz2.auxStars.shenGong.ganZhi) fail('身宫缺失');
if (!bz2.auxStars.taiXi.ganZhi) fail('胎息缺失');
ok(`辅星：胎元${bz2.auxStars.taiYuan.ganZhi}(${bz2.auxStars.taiYuan.naYin}) 命宫${bz2.auxStars.mingGong.ganZhi} 身宫${bz2.auxStars.shenGong.ganZhi} 胎息${bz2.auxStars.taiXi.ganZhi}`);
// 藏干十神
for (const [label, p] of [['年', bz2.year], ['月', bz2.month], ['日', bz2.day], ['时', bz2.hour]] as const) {
  if (!p.branchShiShen) fail(`${label}柱地支藏干十神缺失`);
}
ok('四柱地支藏干十神完整');
// 吉时与卦签
if (almanac.timeSlots.length !== 12) fail(`吉时表应为 12 时辰，实际 ${almanac.timeSlots.length}`);
if (!almanac.timeSlots.every(t => t.zhi && t.range && Array.isArray(t.yi))) fail('吉时表结构异常');
if (!almanac.qian.hexName || !almanac.qian.judgement || almanac.qian.number < 1 || almanac.qian.number > 64) fail('今日卦签异常');
ok(`吉时表 12 时辰完整；今日卦签：第${almanac.qian.number}卦 ${almanac.qian.hexName}「${almanac.qian.judgement}」`);
// 六爻纳甲
const qianLiuYao = buildLiuYao('111111', '甲', []);
const NAJIA_QIAN = ['甲子', '甲寅', '甲辰', '壬午', '壬申', '壬戌'];
if (qianLiuYao.lines.map(l => l.ganZhi).join(',') !== NAJIA_QIAN.join(',')) fail(`乾卦纳甲错误: ${qianLiuYao.lines.map(l => l.ganZhi).join(',')}`);
if (qianLiuYao.palace !== '乾' || qianLiuYao.palaceElement !== '金') fail(`乾卦应属乾宫金，实际 ${qianLiuYao.palace}宫${qianLiuYao.palaceElement}`);
if (qianLiuYao.shiPos !== 5 || qianLiuYao.yingPos !== 2) fail(`乾卦世应在五二爻，实际世${qianLiuYao.shiPos}应${qianLiuYao.yingPos}`);
const qianLiuQins = qianLiuYao.lines.map(l => l.liuQin);
if (qianLiuQins.join(',') !== '子孙,妻财,父母,官鬼,兄弟,父母') fail(`乾宫金六亲错误: ${qianLiuQins.join(',')}`);
if (qianLiuYao.lines[0].liuShen !== '青龙') fail(`甲日乾卦初爻六神应为青龙，实际 ${qianLiuYao.lines[0].liuShen}`);
const gouLiuYao = buildLiuYao('011111', '甲', [1]);
if (gouLiuYao.lines[0].ganZhi !== '辛丑') fail(`姤卦初爻纳甲应为辛丑，实际 ${gouLiuYao.lines[0].ganZhi}`);
if (gouLiuYao.palace !== '乾' || gouLiuYao.shiPos !== 0 || gouLiuYao.yingPos !== 3) fail(`姤卦应属乾宫一世卦（世初应四），实际 ${gouLiuYao.palace}宫世${gouLiuYao.shiPos}应${gouLiuYao.yingPos}`);
if (!gouLiuYao.lines[1].isMoving) fail('姤卦二爻动标记缺失');
const zhenLiuYao = buildLiuYao('100100', '庚', []);
if (zhenLiuYao.lines[0].ganZhi !== '庚子') fail(`震卦初爻纳甲应为庚子，实际 ${zhenLiuYao.lines[0].ganZhi}`);
if (zhenLiuYao.lines[0].liuShen !== '白虎') fail(`庚日震卦初爻六神应为白虎，实际 ${zhenLiuYao.lines[0].liuShen}`);
if (zhenLiuYao.lines[5].liuShen !== '腾蛇') fail(`庚日震卦上爻六神应为腾蛇，实际 ${zhenLiuYao.lines[5].liuShen}`);
ok('六爻纳甲：乾/姤/震卦纳甲、六亲、世应、六神全部正确');
// 合婚
const sx1 = getShengXiaoRelations('子', '丑');
if (!sx1.some(r => r.type === '六合')) fail('子丑应六合');
const sx2 = getShengXiaoRelations('子', '午');
if (!sx2.some(r => r.type === '六冲')) fail('子午应六冲');
const sx3 = getShengXiaoRelations('申', '辰');
if (!sx3.some(r => r.type === '三合')) fail('申辰应三合');
const sx4 = getShengXiaoRelations('寅', '巳');
if (!sx4.some(r => r.type === '相害')) fail('寅巳应相害');
ok(`生肖关系：子丑六合、子午六冲、申辰三合、寅巳相害 验证通过（${getZhiByShengXiao('鼠')}）`);
const hehunScore = calcHeHunScore(bz2, calculateBazi(new Date(1992, 7, 8, 20, 0), 'male'));
if (hehunScore.total < 30 || hehunScore.total > 98) fail(`合婚评分越界: ${hehunScore.total}`);
if (hehunScore.items.length < 4) fail(`合婚明细不足: ${hehunScore.items.length}`);
ok(`八字合婚评分 ${hehunScore.total} 分，明细 ${hehunScore.items.length} 项：「${hehunScore.verdict}」`);

console.log('\n[10/8] 神煞 / 喜用神 / 流月流日 / 择吉日');
// 神煞：1990-06-15 坤造（庚午年 辛亥日），辛日干 → 天乙贵人 午/寅（午在年、月柱 ✓）
const ss = getShenSha(bz2);
if (!ss.some(s => s.name === '天乙贵人')) fail('辛日主应见天乙贵人（午/寅）');
if (ss.some(s => s.name === '空亡' && !s.pillar)) fail('空亡标注异常');
ok(`神煞命中 ${ss.length} 个：${ss.slice(0, 6).map(s => `${s.name}(${s.pillar})`).join('、')}${ss.length > 6 ? '…' : ''}`);
// 喜用神
const xy = calcXiYong(bz2);
if (!['身强', '身弱', '中和'].includes(xy.strength)) fail(`喜用神强度判定异常: ${xy.strength}`);
if (xy.xiYong.length === 0 || xy.luckyNumbers.length === 0 || xy.luckyColors.length === 0) fail('喜用神幸运元素缺失');
ok(`喜用神：${xy.strength}，喜${xy.xiYong.join('、')}，幸运数字${xy.luckyNumbers.join('、')}，色${xy.luckyColors.join('、')}，方位${xy.luckyDirections.join('、')}`);
// 流月流日
const ly12 = getTwelveLiuYue(new Date(2026, 0, 15), bz2.dayMaster);
if (ly12.length !== 12) fail(`十二流月应为 12 个，实际 ${ly12.length}`);
if (ly12[0].ganZhi.substring(1, 2) !== '寅') fail(`十二流月应从寅月起，实际首月 ${ly12[0].ganZhi}`);
if (!ly12.every(m => m.ganZhi.length === 2 && m.shiShen)) fail('流月结构异常');
const lr = getTodayLiuRi(bz2, new Date(2026, 0, 15));
if (!lr.ganZhi || !lr.shiShen || !lr.desc) fail('流日信息缺失');
ok(`十二流月完整（首月${ly12[0].ganZhi}·${ly12[0].jieName}）；今日流日 ${lr.ganZhi}：${lr.relations.length > 0 ? lr.relations.join('；') : '无冲合'}`);
// 择吉日
const daysInFeb2026 = 28;
const zeri = getMonthZeri(2026, 2, '嫁娶');
if (zeri.length !== daysInFeb2026) fail(`择日应返回 ${daysInFeb2026} 天，实际 ${zeri.length}`);
if (zeri.some(z => z.score < 0 || z.score > 100)) fail('择日评分越界');
const suitable = zeri.filter(z => z.suitable).length;
if (suitable < 1) fail('2026-02 应存在适宜嫁娶之日');
const top = zeri.filter(z => z.isTop);
if (top.length !== Math.min(3, suitable)) fail(`上吉应 3 个或等于适宜数，实际 ${top.length}`);
const single = scoreDay(new Date(2026, 1, 14), '嫁娶');
if (!single.ganZhi || !single.lunarText) fail('单日评分异常');
ok(`择吉日：2026-02 嫁娶宜日 ${suitable} 天，上吉 ${top.length} 天（最高 ${Math.max(...zeri.map(z => z.score))} 分）`);

console.log('\n========================================');
if (failures === 0) {
  console.log('✅ 全部校验通过');
  process.exit(0);
} else {
  console.log(`❌ 共 ${failures} 项失败`);
  process.exit(1);
}
