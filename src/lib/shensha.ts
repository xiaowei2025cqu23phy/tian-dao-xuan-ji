import { LunarUtil } from 'lunar-javascript';
import type { BaziData } from './lunar-service.ts';

/**
 * 八字神煞：以日干/日支（部分以年支）为坐标，查命中神煞及其所在柱
 * 数据依据经典命理歌诀整理
 */

export interface ShenShaHit {
  name: string;
  pillar: string;      // 所在柱（年/月/日/时）
  desc: string;
}

const PILLAR_NAMES = ['年', '月', '日', '时'];

// 天乙贵人（以日干查）：甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎
const TIAN_YI: Record<string, string[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳'],
  '辛': ['午', '寅'],
};

// 文昌贵人（以日干查）：甲乙已午报君知，丙戊申宫丁己鸡，庚猪辛鼠壬逢虎，癸人见卯入云梯
const WEN_CHANG: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '戊': '申', '丁': '酉', '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
};

// 羊刃（以日干查，阳干取帝旺）
const YANG_REN: Record<string, string> = { '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子' };

// 禄神（以日干查，即临官）
const LU_SHEN: Record<string, string> = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };

// 三合局 → 桃花 / 驿马 / 华盖 / 将星（以日支查）
const SAN_HE: Record<string, string[]> = {
  '申': ['子', '辰'], '子': ['申', '辰'], '辰': ['申', '子'],
  '寅': ['午', '戌'], '午': ['寅', '戌'], '戌': ['寅', '午'],
  '巳': ['酉', '丑'], '酉': ['巳', '丑'], '丑': ['巳', '酉'],
  '亥': ['卯', '未'], '卯': ['亥', '未'], '未': ['亥', '卯'],
};
const TAO_HUA: Record<string, string> = { '申': '酉', '子': '酉', '辰': '酉', '寅': '卯', '午': '卯', '戌': '卯', '巳': '午', '酉': '午', '丑': '午', '亥': '子', '卯': '子', '未': '子' };
const YI_MA: Record<string, string> = { '申': '寅', '子': '寅', '辰': '寅', '寅': '申', '午': '申', '戌': '申', '巳': '亥', '酉': '亥', '丑': '亥', '亥': '巳', '卯': '巳', '未': '巳' };
const HUA_GAI: Record<string, string> = { '申': '辰', '子': '辰', '辰': '辰', '寅': '戌', '午': '戌', '戌': '戌', '巳': '丑', '酉': '丑', '丑': '丑', '亥': '未', '卯': '未', '未': '未' };
const JIANG_XING: Record<string, string> = { '申': '子', '子': '子', '辰': '子', '寅': '午', '午': '午', '戌': '午', '巳': '酉', '酉': '酉', '丑': '酉', '亥': '卯', '卯': '卯', '未': '卯' };

// 魁罡日柱
const KUI_GANG: Record<string, string> = { '庚辰': '魁罡', '庚戌': '魁罡', '壬辰': '魁罡', '戊戌': '魁罡' };

// 孤辰 / 寡宿（以年支查）
const GU_CHEN: Record<string, string> = { '亥': '寅', '子': '寅', '丑': '寅', '寅': '巳', '卯': '巳', '辰': '巳', '巳': '申', '午': '申', '未': '申', '申': '亥', '酉': '亥', '戌': '亥' };
const GUA_SU: Record<string, string> = { '亥': '戌', '子': '戌', '丑': '戌', '寅': '丑', '卯': '丑', '辰': '丑', '巳': '辰', '午': '辰', '未': '辰', '申': '未', '酉': '未', '戌': '未' };

function findZhi(bazi: BaziData, zhi: string): string {
  const pillars = [bazi.year.branch, bazi.month.branch, bazi.day.branch, bazi.hour.branch];
  const idx = pillars.indexOf(zhi);
  return idx >= 0 ? PILLAR_NAMES[idx] : '';
}

export function getShenSha(bazi: BaziData): ShenShaHit[] {
  const hits: ShenShaHit[] = [];
  const { dayMaster: dm, day: dayPillar, year, month, hour } = bazi;

  // 天乙贵人
  const ty = TIAN_YI[dm];
  if (ty) {
    ty.forEach(z => {
      const p = findZhi(bazi, z);
      if (p) hits.push({ name: '天乙贵人', pillar: p, desc: '最吉之神，逢凶化吉，贵人扶持，利官近贵。' });
    });
  }

  // 文昌贵人
  const wc = WEN_CHANG[dm];
  if (wc) {
    const p = findZhi(bazi, wc);
    if (p) hits.push({ name: '文昌贵人', pillar: p, desc: '聪明好学，文思敏捷，利考试功名、文书写作。' });
  }

  // 羊刃
  const yr = YANG_REN[dm];
  if (yr) {
    const p = findZhi(bazi, yr);
    if (p) hits.push({ name: '羊刃', pillar: p, desc: '刚烈果决，气势强盛；喜制伏，忌重逢。' });
  }

  // 禄神
  const ls = LU_SHEN[dm];
  if (ls) {
    const p = findZhi(bazi, ls);
    if (p) hits.push({ name: '禄神', pillar: p, desc: '衣食之禄，自食其力，身旺有根。' });
  }

  // 桃花 / 驿马 / 华盖 / 将星（以日支查）
  const dayZhi = dayPillar.branch;
  const th = TAO_HUA[dayZhi];
  if (th) {
    const p = findZhi(bazi, th);
    if (p && p !== '日') hits.push({ name: '桃花', pillar: p, desc: '人缘魅力，艺术审美；亦主情缘波动，宜正用。' });
  }
  const ym = YI_MA[dayZhi];
  if (ym) {
    const p = findZhi(bazi, ym);
    if (p && p !== '日') hits.push({ name: '驿马', pillar: p, desc: '奔波变动，外出发展，走动得利，动中求财。' });
  }
  const hg = HUA_GAI[dayZhi];
  if (hg) {
    const p = findZhi(bazi, hg);
    if (p && p !== '日') hits.push({ name: '华盖', pillar: p, desc: '聪慧孤高，近玄学艺术；性情清高，宜修心养性。' });
  }
  const jx = JIANG_XING[dayZhi];
  if (jx) {
    const p = findZhi(bazi, jx);
    if (p && p !== '日') hits.push({ name: '将星', pillar: p, desc: '领导才能，统御之象，临事有主见，威望自生。' });
  }

  // 魁罡（日柱）
  const dgz = `${dayPillar.stem}${dayPillar.branch}`;
  if (KUI_GANG[dgz]) hits.push({ name: '魁罡', pillar: '日', desc: '聪明果断，性情刚烈，有领导魄力；忌见财官混杂。' });

  // 孤辰 / 寡宿（年支查，出现在其他柱）
  const gc = GU_CHEN[year.branch];
  if (gc) {
    const p = findZhi(bazi, gc);
    if (p && p !== '年') hits.push({ name: '孤辰', pillar: p, desc: '自立之象，性格孤高，宜多交游以解孤。' });
  }
  const gs = GUA_SU[year.branch];
  if (gs) {
    const p = findZhi(bazi, gs);
    if (p && p !== '年') hits.push({ name: '寡宿', pillar: p, desc: '清静寡合，独处自安；宜主动合群。' });
  }

  // 空亡（日柱所在旬的空亡地支，看其余三柱）
  const dayGanZhi = `${dayPillar.stem}${dayPillar.branch}`;
  const XUN_KONG: Record<number, string[]> = { 0: ['戌', '亥'], 1: ['申', '酉'], 2: ['午', '未'], 3: ['辰', '巳'], 4: ['寅', '卯'], 5: ['子', '丑'] };
  const jiaZiIndex = LunarUtil.getJiaZiIndex(dayGanZhi); // 0-59
  const kong = XUN_KONG[Math.floor(jiaZiIndex / 10)];
  if (kong) {
    kong.forEach(z => {
      const p = findZhi(bazi, z);
      if (p && p !== '日') hits.push({ name: '空亡', pillar: p, desc: `${dayGanZhi}日属${['甲子','甲戌','甲申','甲午','甲辰','甲寅'][Math.floor(jiaZiIndex / 10)]}旬，空亡${kong.join('')}；空亡之地主虚，逢冲填实反吉。` });
    });
  }

  return hits;
}
