import type { BaziData } from './lunar-service.ts';

/**
 * 喜用神与幸运元素
 * 身强身弱简化判定（月令旺衰 + 同类帮扶计数）→ 喜用 / 忌神 → 幸运数字/颜色/方位/宝石
 */

export interface XiYongResult {
  strength: '身强' | '身弱' | '中和';
  strengthDesc: string;
  xiYong: string[];        // 喜用五行
  jiShen: string[];        // 忌神五行
  luckyNumbers: string[];  // 幸运数字（河图数）
  luckyColors: string[];   // 幸运色
  luckyDirections: string[]; // 幸运方位
  luckyGems: string[];     // 宜佩戴
  advice: string;
}

const GENERATES: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const CONTROLS: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
const ELEMENTS = ['金', '木', '水', '火', '土'];

const ELEMENT_LUCK: Record<string, { numbers: string[]; colors: string[]; directions: string[]; gems: string }> = {
  '木': { numbers: ['3', '8'], colors: ['青绿', '翠绿'], directions: ['东方'], gems: '绿玉、翡翠、绿幽灵' },
  '火': { numbers: ['2', '7'], colors: ['朱红', '紫'], directions: ['南方'], gems: '红玛瑙、石榴石、红纹石' },
  '土': { numbers: ['5', '10'], colors: ['黄', '棕'], directions: ['中央', '本地'], gems: '黄玉、蜜蜡、黄水晶' },
  '金': { numbers: ['4', '9'], colors: ['白', '银', '金'], directions: ['西方'], gems: '白金、白水晶、黄金饰品' },
  '水': { numbers: ['1', '6'], colors: ['黑', '蓝'], directions: ['北方'], gems: '黑曜石、蓝宝石、海蓝宝' },
};

export function calcXiYong(bazi: BaziData): XiYongResult {
  const dmEl = bazi.dayMasterElement;
  const monthStrength = bazi.monthCommand.strength[dmEl] || '平'; // 旺相休囚死
  const strengthScore: Record<string, number> = { '旺': 2, '相': 1, '休': 0, '囚': -1, '死': -2 };

  // 同类帮扶计数：四柱天干十神 + 地支本气十神中属比劫/印枭者
  let sameCount = 0;
  const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour];
  const helpTen = new Set(['比肩', '劫财', '偏印', '正印']);
  pillars.forEach(p => {
    if (helpTen.has(p.shiShen)) sameCount++;
    if (helpTen.has(p.branchShiShen)) sameCount++;
  });

  const score = sameCount + (strengthScore[monthStrength] || 0);
  let strength: XiYongResult['strength'];
  let strengthDesc: string;
  if (score >= 5) {
    strength = '身强';
    strengthDesc = `日主${bazi.dayMaster}${dmEl}得令${monthStrength === '旺' || monthStrength === '相' ? '，月令生扶' : ''}，同类帮扶 ${sameCount} 位，气势强旺，宜克泄耗以平衡。`;
  } else if (score <= 3) {
    strength = '身弱';
    strengthDesc = `日主${bazi.dayMaster}${dmEl}失令${monthStrength === '死' || monthStrength === '囚' ? '，月令制约' : ''}，同类帮扶仅 ${sameCount} 位，日主偏弱，宜印比生扶。`;
  } else {
    strength = '中和';
    strengthDesc = `日主${bazi.dayMaster}${dmEl}帮扶 ${sameCount} 位、月令${monthStrength}，五行相对平衡，宜以流通调候为要。`;
  }

  // 喜忌：身强喜克泄耗（财/官杀/食伤），身弱喜生扶（印/比劫），中和喜食伤与财以流通
  // 相克环隔两步即相生：印 = CONTROLS[CONTROLS[dmEl]]（如金→木→土，土生金）
  const yin = CONTROLS[CONTROLS[dmEl]];       // 生我（印）
  const bi = dmEl;                            // 同我（比劫）
  const cai = CONTROLS[dmEl];                 // 我克（财）
  const guan = GENERATES[CONTROLS[dmEl]];     // 克我（官杀）
  const shi = GENERATES[dmEl];                // 我生（食伤）

  let xiYong: string[];
  let jiShen: string[];
  if (strength === '身强') {
    xiYong = [cai, shi, guan];
    jiShen = [yin, bi];
  } else if (strength === '身弱') {
    xiYong = [yin, bi];
    jiShen = [guan, shi];
  } else {
    xiYong = [shi, cai];
    jiShen = [yin];
  }
  // 去重（身弱时比劫即日主五行，属喜用，不可过滤）
  xiYong = [...new Set(xiYong)];
  jiShen = [...new Set(jiShen)];

  const numbers = xiYong.flatMap(el => ELEMENT_LUCK[el]?.numbers || []);
  const colors = xiYong.flatMap(el => ELEMENT_LUCK[el]?.colors || []);
  const directions = xiYong.flatMap(el => ELEMENT_LUCK[el]?.directions || []);
  const gems = xiYong.map(el => ELEMENT_LUCK[el]?.gems || '').filter(Boolean);

  const advice = `以${xiYong.join('、')}为喜用。日常可多用${colors.join('、')}色，居行多择${directions.join('、')}方位，数字${numbers.join('、')}于己相宜，佩戴${gems.join('、')}助气。${jiShen.length ? `忌神为${jiShen.join('、')}，宜避其过盛。` : ''}`;

  return {
    strength,
    strengthDesc,
    xiYong,
    jiShen,
    luckyNumbers: numbers,
    luckyColors: colors,
    luckyDirections: directions,
    luckyGems: gems,
    advice,
  };
}
