import { calculateBazi } from './lunar-service.ts';
import type { BaziData } from './lunar-service.ts';

/**
 * 合婚服务：生肖关系（六合/三合/六冲/相刑/相害）+ 八字合婚综合评定
 */

export const SHENG_XIAO_LIST = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

const ZHI_BY_SX: Record<string, string> = {
  '鼠': '子', '牛': '丑', '虎': '寅', '兔': '卯', '龙': '辰', '蛇': '巳',
  '马': '午', '羊': '未', '猴': '申', '鸡': '酉', '狗': '戌', '猪': '亥',
};

const LIU_HE: [string, string][] = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']];
const LIU_CHONG: [string, string][] = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
const XIANG_HAI: [string, string][] = [['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']];
const SAN_HE_GROUPS: string[][] = [['申', '子', '辰'], ['寅', '午', '戌'], ['巳', '酉', '丑'], ['亥', '卯', '未']];
const XIANG_XING_GROUPS: string[][] = [['寅', '巳', '申'], ['丑', '戌', '未']];

export interface ShengXiaoRelation {
  type: '六合' | '三合' | '六冲' | '相刑' | '相害';
  score: number;
  desc: string;
}

const RELATION_DESC: Record<ShengXiaoRelation['type'], { score: number; desc: string }> = {
  '六合': { score: 15, desc: '六合贵人，情投意合，缘深福厚，相处如沐春风。' },
  '三合': { score: 10, desc: '三合之局，气类相投，默契十足，互助有成。' },
  '六冲': { score: -10, desc: '六冲相克，聚少离多，观念相左，需多包容磨合。' },
  '相刑': { score: -6, desc: '相刑之局，易生口角摩擦，宜以柔克刚、以退为进。' },
  '相害': { score: -6, desc: '相害相侵，暗藏嫌隙，需坦诚沟通、彼此信任。' },
};

function inPair(pairs: [string, string][], a: string, b: string): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** 生肖（地支）关系判定：可能同时存在多个关系 */
export function getShengXiaoRelations(zhiA: string, zhiB: string): ShengXiaoRelation[] {
  if (zhiA === zhiB) return [];
  const rels: ShengXiaoRelation[] = [];
  if (inPair(LIU_HE, zhiA, zhiB)) rels.push({ type: '六合', ...RELATION_DESC['六合'] });
  if (SAN_HE_GROUPS.some(g => g.includes(zhiA) && g.includes(zhiB))) rels.push({ type: '三合', ...RELATION_DESC['三合'] });
  if (inPair(LIU_CHONG, zhiA, zhiB)) rels.push({ type: '六冲', ...RELATION_DESC['六冲'] });
  if (XIANG_XING_GROUPS.some(g => g.includes(zhiA) && g.includes(zhiB))) rels.push({ type: '相刑', ...RELATION_DESC['相刑'] });
  if (inPair(XIANG_HAI, zhiA, zhiB)) rels.push({ type: '相害', ...RELATION_DESC['相害'] });
  return rels;
}

export function getZhiByShengXiao(sx: string): string {
  return ZHI_BY_SX[sx] || '';
}

export interface HeHunScore {
  total: number;             // 0-100 综合评分
  items: { label: string; score: number; desc: string }[];
  verdict: string;           // 总评语
}

const GENERATES: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const CONTROLS: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

/** 日主天干生克关系（以 A 的日主为坐标看 B） */
function dayMasterRelation(elA: string, elB: string): { score: number; label: string } {
  if (elA === elB) return { score: 5, label: '日主比和，同气相求' };
  if (GENERATES[elA] === elB) return { score: 8, label: `${elA}生${elB}，A 旺而滋养 B` };
  if (GENERATES[elB] === elA) return { score: 8, label: `${elB}生${elA}，B 旺而滋养 A` };
  if (CONTROLS[elA] === elB) return { score: 0, label: `${elA}克${elB}，A 略压 B` };
  return { score: 0, label: `${elB}克${elA}，B 略压 A` };
}

/** 八字合婚综合评分（A 视角，对称处理） */
export function calcHeHunScore(a: BaziData, b: BaziData): HeHunScore {
  const items: { label: string; score: number; desc: string }[] = [];

  // 1. 生肖关系（双向取最吉/最凶）
  const relsA = getShengXiaoRelations(a.year.branch, b.year.branch);
  const relsB = getShengXiaoRelations(b.year.branch, a.year.branch);
  const rels = [...new Map([...relsA, ...relsB].map(r => [r.type, r])).values()];
  if (rels.length > 0) {
    rels.forEach(r => items.push({ label: `生肖·${r.type}`, score: r.score, desc: r.desc }));
  } else {
    items.push({ label: '生肖·平平', score: 2, desc: '生肖无显著冲合，相处平淡安稳。' });
  }

  // 2. 日主生克
  const dm = dayMasterRelation(a.dayMasterElement, b.dayMasterElement);
  items.push({ label: '日主关系', score: dm.score, desc: dm.label });

  // 3. 五行互补：A 缺的行在 B 中较旺，反之亦然
  let complement = 0;
  const compDesc: string[] = [];
  const bCount = b.fiveElements;
  a.missingElements.forEach(el => {
    if (bCount[el] >= 2) {
      complement += 5;
      compDesc.push(`B 之${el}旺，可补 A 之缺`);
    }
  });
  const aCount = a.fiveElements;
  b.missingElements.forEach(el => {
    if (aCount[el] >= 2) {
      complement += 5;
      compDesc.push(`A 之${el}旺，可补 B 之缺`);
    }
  });
  items.push({
    label: '五行互补',
    score: complement,
    desc: compDesc.length > 0 ? compDesc.join('；') : '五行各自完备，互不补益亦不冲克。',
  });

  // 4. 月令合拍：两人月支是否相合/相冲
  const monthRels = getShengXiaoRelations(a.month.branch, b.month.branch);
  const good = monthRels.some(r => r.type === '六合' || r.type === '三合');
  const bad = monthRels.some(r => r.type === '六冲');
  if (good) {
    items.push({ label: '月令相合', score: 6, desc: '双方月令有合，大环境气场相投。' });
  } else if (bad) {
    items.push({ label: '月令相冲', score: -5, desc: '双方月令相冲，成长节奏与家庭背景或有差异，需磨合。' });
  } else {
    items.push({ label: '月令平顺', score: 2, desc: '双方月令无冲合，节奏平缓。' });
  }

  let total = 50 + items.reduce((s, i) => s + i.score, 0);
  total = Math.max(30, Math.min(98, total));

  const verdict =
    total >= 85 ? '天作之合，情投意合，宜携手共进。' :
    total >= 70 ? '良缘佳配，同心同德，细微处多加体谅更佳。' :
    total >= 55 ? '中平之缘，互补多于默契，贵在用心经营。' :
    '磨合之缘，分歧较多，宜以诚相待、以柔化刚。';

  return { total, items, verdict };
}
