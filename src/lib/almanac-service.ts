import { Lunar } from 'lunar-javascript';
import { GET_HEX_BY_BINARY, HEXAGRAMS_DATA } from './iching-data.ts';

export interface TimeSlot {
  zhi: string;           // 时辰地支
  ganZhi: string;        // 时辰干支
  range: string;         // 时间范围
  yi: string[];          // 该时辰所宜
  ji: string[];          // 该时辰所忌
  tianShen: string;      // 值日天神
  tianShenType: string;  // 黄道/黑道
}

export interface DailyQian {
  hexName: string;
  symbol: string;
  judgement: string;
  meaning: string;
  number: number;
  binary: string;
  dateText: string;      // 签日（公历）
}

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
  timeSlots: TimeSlot[];  // 十二时辰宜忌
  qian: DailyQian;        // 今日卦签
}

const EMPTY_ARR = (v: string[] | null | undefined) => (Array.isArray(v) ? v : []);

export function getTodayAlmanac(date: Date = new Date()): AlmanacData {
  const lunar = Lunar.fromDate(date);
  const yi = EMPTY_ARR(lunar.getDayYi()).slice(0, 10);
  const ji = EMPTY_ARR(lunar.getDayJi()).slice(0, 10);
  const festivals = EMPTY_ARR(lunar.getFestivals());
  const otherFestivals = EMPTY_ARR(lunar.getOtherFestivals());

  const currentJieQi = lunar.getCurrentJieQi() || '';

  // 十二时辰（lunar.getTimes() 首项为 0 点子时，取其后 12 个时辰）
  const timeSlots: TimeSlot[] = lunar.getTimes().slice(1, 13).map(t => ({
    zhi: t.getZhi() || '',
    ganZhi: t.getGanZhi(),
    range: `${t.getMinHm()}-${t.getMaxHm()}`,
    yi: EMPTY_ARR(t.getYi()).slice(0, 5),
    ji: EMPTY_ARR(t.getJi()).slice(0, 5),
    tianShen: t.getTianShen() || '',
    tianShenType: t.getTianShenType() || '',
  }));

  // 今日卦签：以公历日期为种子，当日恒定
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const allHex = Object.keys(HEXAGRAMS_DATA)
    .map(bin => GET_HEX_BY_BINARY(bin))
    .sort((a, b) => a.number - b.number);
  const qianHex = allHex[seed % allHex.length];

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
    timeSlots,
    qian: {
      hexName: qianHex.name,
      symbol: qianHex.symbol,
      judgement: qianHex.judgement,
      meaning: qianHex.meaning,
      number: qianHex.number,
      binary: qianHex.binary,
      dateText: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
    },
  };
}
