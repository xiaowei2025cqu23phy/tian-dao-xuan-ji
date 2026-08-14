import { Lunar } from 'lunar-javascript';

export interface AlmanacData {
  solar: string;          // 公历日期
  week: string;           // 星期
  lunarDate: string;      // 农历干支日期
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  shengXiao: string;
  yi: string[];           // 宜
  ji: string[];           // 忌
  jiShen: string;         // 吉神宜趋
  xiongSha: string;       // 凶煞宜忌
  chong: string;          // 冲
  sha: string;            // 煞
  zhiXing: string;        // 建除十二值星
  tianShen: string;       // 值日天神（青龙等）
  tianShenType: string;   // 黄道 / 黑道
  xiu: string;            // 二十八宿
  xiuAnimal: string;      // 宿兽
  jieQi: string;          // 当日节气（若逢）
  currentJieQi: string;   // 当前所处节气
  festivals: string[];    // 农历节日
  otherFestivals: string[]; // 公历节日
  pengZu: string;         // 彭祖百忌
  positions: {
    xi: string;           // 喜神
    cai: string;          // 财神
    fu: string;           // 福神
    yangGui: string;      // 阳贵神
    yinGui: string;       // 阴贵神
  };
  xun: string;            // 旬
  xunKong: string;        // 旬空
}

const EMPTY_ARR = (v: string[] | null | undefined) => (Array.isArray(v) ? v : []);

export function getTodayAlmanac(date: Date = new Date()): AlmanacData {
  const lunar = Lunar.fromDate(date);
  const yi = EMPTY_ARR(lunar.getDayYi()).slice(0, 10);
  const ji = EMPTY_ARR(lunar.getDayJi()).slice(0, 10);
  const festivals = EMPTY_ARR(lunar.getFestivals());
  const otherFestivals = EMPTY_ARR(lunar.getOtherFestivals());

  const currentJieQi = lunar.getCurrentJieQi() || '';

  return {
    solar: `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`,
    week: `星期${lunar.getWeekInChinese()}`,
    lunarDate: `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    yearGanZhi: lunar.getYearInGanZhi(),
    monthGanZhi: lunar.getMonthInGanZhi(),
    dayGanZhi: lunar.getDayInGanZhi(),
    shengXiao: lunar.getYearShengXiao(),
    yi,
    ji,
    jiShen: lunar.getDayJiShen() || '',
    xiongSha: lunar.getDayXiongSha() || '',
    chong: lunar.getDayChongDesc(),
    sha: lunar.getDaySha(),
    zhiXing: lunar.getZhiXing() || '',
    tianShen: lunar.getDayTianShen() || '',
    tianShenType: lunar.getDayTianShenType() || '',
    xiu: lunar.getXiu() || '',
    xiuAnimal: lunar.getAnimal() || '',
    jieQi: lunar.getJieQi() || '',
    currentJieQi,
    festivals,
    otherFestivals,
    pengZu: [lunar.getPengZuGan(), lunar.getPengZuZhi()].filter(Boolean).join(' '),
    positions: {
      xi: lunar.getDayPositionXi() || '',
      cai: lunar.getDayPositionCai() || '',
      fu: lunar.getDayPositionFu() || '',
      yangGui: lunar.getDayPositionYangGui() || '',
      yinGui: lunar.getDayPositionYinGui() || '',
    },
    xun: lunar.getDayXun() || '',
    xunKong: lunar.getDayXunKong() || '',
  };
}
