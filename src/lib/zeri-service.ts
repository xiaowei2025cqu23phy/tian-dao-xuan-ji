import { Lunar } from 'lunar-javascript';

/**
 * 择吉日：按事项类型对日期评分（宜忌命中 + 黄道/黑道 + 建除值星 + 吉神 + 冲月）
 */

export interface ZeriItem {
  dateText: string;      // 公历
  lunarText: string;     // 农历
  lunarDay: string;      // 农历日
  ganZhi: string;        // 日干支
  score: number;         // 0-100
  suitable: boolean;     // 是否适合所选事项
  isTop: boolean;        // 本月上吉
  tags: string[];        // 命中的宜项
  ji: string[];          // 忌项
  tianShen: string;
  tianShenType: string;
  zhiXing: string;
}

export const MATTERS: Record<string, string[]> = {
  '嫁娶': ['嫁娶', '结婚', '纳采', '订盟', '会亲友'],
  '开市': ['开市', '交易', '立券', '纳财', '挂匾'],
  '入宅': ['入宅', '移徙', '安床', '修造', '竖柱'],
  '出行': ['出行', '解除'],
  '动土': ['动土', '修造', '拆卸', '上梁'],
  '安葬': ['安葬', '破土', '入殓', '移柩'],
  '祈福': ['祈福', '祭祀', '求嗣', '开光'],
  '签约': ['交易', '立券', '纳财', '会亲友'],
  '祭祀': ['祭祀', '祈福', '开光'],
};

// 建除十二值星：除危定执成开为黄道，建满平收闭破为黑道
const ZHI_XING_HUANG_DAO = ['除', '危', '定', '执', '成', '开'];
const ZHI_XING_HEI_DAO = ['建', '满', '平', '收', '闭', '破'];

const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const LIU_CHONG: [string, string][] = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
const inPair = (pairs: [string, string][], a: string, b: string) => pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export function scoreDay(date: Date, matter: string): ZeriItem {
  const lunar = Lunar.fromDate(date);
  const yi = lunar.getDayYi() || [];
  const ji = lunar.getDayJi() || [];
  const keywords = MATTERS[matter] || ['嫁娶'];

  const hitYi = yi.filter(y => keywords.some(k => y.includes(k)));
  const hitJi = ji.filter(j => keywords.some(k => j.includes(k)));

  const tianShen = lunar.getDayTianShen() || '';
  const tianShenType = lunar.getDayTianShenType() || '';
  const zhiXing = lunar.getZhiXing() || '';
  const jiShen = lunar.getDayJiShen() || '';

  let score = 40;
  score += Math.min(30, hitYi.length * 10);
  if (hitJi.length > 0) score -= 60;
  if (tianShenType === '黄道') score += 15;
  else if (tianShenType === '黑道') score -= 10;
  if (ZHI_XING_HUANG_DAO.includes(zhiXing)) score += 10;
  else if (ZHI_XING_HEI_DAO.includes(zhiXing)) score -= 10;
  if (jiShen) score += 5;
  // 日支冲月支（月建）
  const monthZhi = lunar.getMonthZhi();
  const dayZhi = lunar.getDayZhi();
  if (inPair(LIU_CHONG, monthZhi, dayZhi)) score -= 10;
  // 诸事不宜硬伤
  const hardAvoid = ji.some(j => j.includes('诸事不宜') || j.includes('大事勿用'));
  if (hardAvoid) score -= 60;

  score = Math.max(0, Math.min(100, score));

  return {
    dateText: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
    lunarText: `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    lunarDay: lunar.getDayInChinese(),
    ganZhi: lunar.getDayInGanZhi(),
    score,
    suitable: score >= 60 && hitJi.length === 0 && !hardAvoid,
    isTop: false,
    tags: hitYi,
    ji: hitJi,
    tianShen,
    tianShenType,
    zhiXing: `${zhiXing}日`,
  };
}

export function getMonthZeri(year: number, month: number, matter: string): ZeriItem[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const items: ZeriItem[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    items.push(scoreDay(new Date(year, month - 1, d), matter));
  }
  // 标出本月上吉（适合事项的前 3 名）
  const top = items.filter(i => i.suitable).sort((a, b) => b.score - a.score).slice(0, 3);
  top.forEach(t => {
    const hit = items.find(i => i.dateText === t.dateText);
    if (hit) hit.isTop = true;
  });
  return items;
}
