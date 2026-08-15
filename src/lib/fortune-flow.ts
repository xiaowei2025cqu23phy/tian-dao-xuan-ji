import { Lunar } from 'lunar-javascript';
import { getShiShen } from './lunar-service.ts';
import type { BaziData } from './lunar-service.ts';

/**
 * 流月 / 流日：当前流月、十二流月、今日流日与命局的冲合提示
 */

export interface LiuYueInfo {
  ganZhi: string;
  jieName: string;   // 起月之节
  shiShen: string;   // 流月干相对日主
}

export interface LiuRiInfo {
  ganZhi: string;
  shiShen: string;
  relations: string[];
  desc: string;
}

const JIE_ORDER = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];

const LIU_HE: [string, string][] = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']];
const LIU_CHONG: [string, string][] = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
const SAN_HE: string[][] = [['申', '子', '辰'], ['寅', '午', '戌'], ['巳', '酉', '丑'], ['亥', '卯', '未']];

const inPair = (pairs: [string, string][], a: string, b: string) => pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** 十二流月（自当前立春月起） */
export function getTwelveLiuYue(now: Date, dayMaster: string): LiuYueInfo[] {
  const lunar = Lunar.fromDate(now);
  const table = lunar.getJieQiTable();
  const list: LiuYueInfo[] = [];
  for (const jie of JIE_ORDER) {
    const solar = table[jie];
    if (!solar) continue;
    // 取节气交节时刻之后（避免当天 0 点仍属上月）
    const t = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay(), solar.getHour(), solar.getMinute() + 1);
    const m = Lunar.fromDate(t);
    const gz = m.getMonthInGanZhiExact();
    list.push({ ganZhi: gz, jieName: jie, shiShen: getShiShen(dayMaster, gz.substring(0, 1)) });
  }
  // 若表未含完整一轮（跨年），按当前月补齐
  if (list.length < 12) {
    const current = lunar.getMonthInGanZhiExact();
    const zhiSeq = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
    const curIdx = zhiSeq.indexOf(current.substring(1, 2));
    const ganSeq = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const curGanIdx = ganSeq.indexOf(current.substring(0, 1));
    for (let i = 0; i < 12; i++) {
      const gz = ganSeq[(curGanIdx - curIdx + i + 120) % 10] + zhiSeq[i];
      list.push({ ganZhi: gz, jieName: JIE_ORDER[i], shiShen: getShiShen(dayMaster, gz.substring(0, 1)) });
    }
  }
  return list.slice(0, 12);
}

/** 当前流月 */
export function getCurrentLiuYue(now: Date, dayMaster: string): { ganZhi: string; jieName: string; shiShen: string } {
  const lunar = Lunar.fromDate(now);
  const gz = lunar.getMonthInGanZhiExact();
  const jie = lunar.getPrevJieQi();
  return { ganZhi: gz, jieName: jie ? jie.getName() : '', shiShen: getShiShen(dayMaster, gz.substring(0, 1)) };
}

/** 今日流日与命局关系 */
export function getTodayLiuRi(bazi: BaziData, now: Date): LiuRiInfo {
  const lunar = Lunar.fromDate(now);
  const gz = lunar.getDayInGanZhi();
  const gan = gz.substring(0, 1);
  const zhi = gz.substring(1, 2);
  const relations: string[] = [];
  const dayZhi = bazi.day.branch;
  const yearZhi = bazi.year.branch;

  if (inPair(LIU_CHONG, zhi, dayZhi)) relations.push(`冲日柱（${zhi}${dayZhi}相冲）`);
  if (inPair(LIU_CHONG, zhi, yearZhi)) relations.push(`冲年柱（${zhi}${yearZhi}相冲）`);
  if (inPair(LIU_HE, zhi, dayZhi)) relations.push(`合日柱（${zhi}${dayZhi}六合）`);
  if (SAN_HE.some(g => g.includes(zhi) && g.includes(dayZhi))) relations.push('合日支三合局');

  const desc =
    relations.length > 0
      ? `今日${gz}日，${relations.join('；')}。${
          relations.some(r => r.includes('冲')) ? '冲则主变动，大事宜缓，诸事多思。' : '合则主和顺，宜谋事合作。'
        }`
      : `今日${gz}日，与命局无明显冲合，平稳中度过。`;

  return { ganZhi: gz, shiShen: getShiShen(bazi.dayMaster, gan), relations, desc };
}
