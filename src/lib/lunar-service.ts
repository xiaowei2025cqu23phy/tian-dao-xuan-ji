import { Solar } from 'lunar-javascript';

export interface PillarInfo {
  stem: string;
  branch: string;
  element: string;
  naYin: string;
  shiShen: string;
  branchShiShen: string; // 地支本气藏干的十神
}

export interface AuxStar {
  ganZhi: string;
  naYin: string;
}

export interface AuxStars {
  taiYuan: AuxStar; // 胎元
  taiXi: AuxStar;   // 胎息
  mingGong: AuxStar; // 命宫
  shenGong: AuxStar; // 身宫
}

export interface DaYunPeriod {
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  isCurrent: boolean;
}

export interface LiuNianInfo {
  ganZhi: string;
  year: number;
  age: number;
}

export interface YunInfo {
  startText: string;       // 起运说明（交运日期）
  forward: boolean;        // 顺排 / 逆排
  periods: DaYunPeriod[];  // 八步大运（不含起运前段）
  liuNian: LiuNianInfo[];  // 当前大运的流年
}

export interface BaziData {
  year: PillarInfo;
  month: PillarInfo;
  day: PillarInfo;
  hour: PillarInfo;
  fiveElements: Record<string, number>;
  dayMaster: string;
  dayMasterElement: string;
  dayMasterAnalysis: string;
  shengXiao: string;
  missingElements: string[];
  auxStars: AuxStars;
  monthCommand: {
    branch: string;
    element: string;
    strength: Record<string, string>;
    impact: string;
  };
  structure?: {
    name: string;
    description: string;
  };
  yun?: YunInfo;
}

const ELEMENT_MAP: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
  '申': '金', '酉': '金',
  '亥': '水', '子': '水'
};

const SEASONAL_STRENGTH: Record<string, Record<string, string>> = {
  '寅': { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死' },
  '卯': { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死' },
  '巳': { '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '死' },
  '午': { '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '死' },
  '申': { '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '死' },
  '酉': { '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '死' },
  '亥': { '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '死' },
  '子': { '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '死' },
  '辰': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' },
  '戌': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' },
  '丑': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' },
  '未': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' },
};

// 天干临官（建禄）之地与阳干帝旺（阳刃）之地
const LU_INDEX: Record<string, string> = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
const REN_INDEX: Record<string, string> = { '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子' };

const STEM_YIN_YANG: Record<string, 'yang' | 'yin'> = {
  '甲': 'yang', '丙': 'yang', '戊': 'yang', '庚': 'yang', '壬': 'yang',
  '乙': 'yin', '丁': 'yin', '己': 'yin', '辛': 'yin', '癸': 'yin',
};
const STEM_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};
const GENERATES: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const CONTROLS: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
const SHENG_XIAO: Record<string, string> = { '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔', '辰': '龙', '巳': '蛇', '午': '马', '未': '羊', '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪' };

/** 十神：以日主为坐标，判定其它天干与日主的关系 */
export function getShiShen(dayMaster: string, otherStem: string): string {
  if (otherStem === dayMaster) return '比肩';
  const dmEl = STEM_ELEMENT[dayMaster];
  const oEl = STEM_ELEMENT[otherStem];
  const samePolarity = STEM_YIN_YANG[dayMaster] === STEM_YIN_YANG[otherStem];
  if (dmEl === oEl) return samePolarity ? '比肩' : '劫财';
  if (GENERATES[dmEl] === oEl) return samePolarity ? '食神' : '伤官';   // 我生
  if (CONTROLS[dmEl] === oEl) return samePolarity ? '偏财' : '正财';   // 我克
  if (GENERATES[oEl] === dmEl) return samePolarity ? '偏印' : '正印';  // 生我
  return samePolarity ? '七杀' : '正官';                                // 克我
}

export function calculateBazi(date: Date, gender: 'male' | 'female'): BaziData {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  const getStemBranch = (sb: string) => ({
    stem: sb.substring(0, 1),
    branch: sb.substring(1, 2),
    get stemElement() { return ELEMENT_MAP[this.stem]; },
    get branchElement() { return ELEMENT_MAP[this.branch]; }
  });

  const year = getStemBranch(eightChar.getYear());
  const month = getStemBranch(eightChar.getMonth());
  const day = getStemBranch(eightChar.getDay());
  const hour = getStemBranch(eightChar.getTime());

  const elements = [
    ELEMENT_MAP[year.stem], ELEMENT_MAP[year.branch],
    ELEMENT_MAP[month.stem], ELEMENT_MAP[month.branch],
    ELEMENT_MAP[day.stem], ELEMENT_MAP[day.branch],
    ELEMENT_MAP[hour.stem], ELEMENT_MAP[hour.branch]
  ];

  const fiveElementsCount: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  elements.forEach(e => { if (e) fiveElementsCount[e]++; });

  const missingElements = Object.keys(fiveElementsCount).filter(k => fiveElementsCount[k] === 0);

  const dmElement = ELEMENT_MAP[day.stem];
  const strength = SEASONAL_STRENGTH[month.branch] || {};
  const dmStrength = strength[dmElement] || '平';

  const impact = `月令为【${month.branch}${ELEMENT_MAP[month.branch]}】，日主${day.stem}${dmElement}处于“${dmStrength}”之地。`;

  // Basic Structure Analysis
  const monthElement = ELEMENT_MAP[month.branch];
  let structName = '正格';
  let structDesc = '';

  const getRelation = (dm: string, other: string) => {
    const relations: Record<string, Record<string, string>> = {
      '木': { '木': '比劫', '火': '食伤', '土': '财星', '金': '官杀', '水': '印枭' },
      '火': { '火': '比劫', '土': '食伤', '金': '财星', '水': '官杀', '木': '印枭' },
      '土': { '土': '比劫', '金': '食伤', '水': '财星', '木': '官杀', '火': '印枭' },
      '金': { '金': '比劫', '水': '食伤', '木': '财星', '火': '官杀', '土': '印枭' },
      '水': { '水': '比劫', '木': '食伤', '火': '财星', '土': '官杀', '金': '印枭' },
    };
    return relations[dm][other];
  };

  const relation = getRelation(dmElement, monthElement);
  switch (relation) {
    case '比劫': {
      // 月令与日主同气：区分建禄、阳刃与月劫（旧逻辑中“身旺格”分支因同气必旺而不可达）
      if (month.branch === LU_INDEX[day.stem]) {
        structName = '建禄格';
        structDesc = '月支为日主临官建禄之地，日主得令自立，根基稳固，精力充沛，宜顺势立业，忌过刚独断。';
      } else if (month.branch === REN_INDEX[day.stem]) {
        structName = '阳刃格';
        structDesc = '月支为日主帝旺阳刃之地，气势极盛，性格刚烈果决，宜以财官制刃，防过刚易折、锋芒毕露。';
      } else {
        structName = '月劫格';
        structDesc = '日主与月令比劫同气，得令有助，个性独立自强，富有竞争意识，宜用财官。';
      }
      break;
    }
    case '食伤':
      structName = '食伤格';
      structDesc = '日主生月令，才华横溢，感性多情，具有艺术天赋或创新能力，宜注意能量泄耗。';
      break;
    case '财星':
      structName = '财星格';
      structDesc = '日主克月令，务实进取，重视效率与结果，具有较强的经营管理能力。';
      break;
    case '官杀':
      structName = '官杀格';
      structDesc = '月令克日主，责任心强，注重名誉与纪律，或处境压力较大，需印比护身。';
      break;
    case '印枭':
      structName = '印绶格';
      structDesc = '月令生日主，深思熟虑，学识渊博，易得长辈提拔依靠，或性格稍显被动。';
      break;
  }

  // ── 大运排盘（起运与八步大运 + 当前大运流年） ──────────────────────────
  let yunInfo: YunInfo | undefined;
  try {
    const yun = eightChar.getYun(gender === 'male' ? 1 : 2);
    const startSolar = yun.getStartSolar();
    const birthYear = date.getFullYear();
    // 虚岁 = 当前公历年 - 出生年 + 1（简化展示口径）
    const currentAge = new Date().getFullYear() - birthYear + 1;
    const periods: DaYunPeriod[] = [];
    let current: DaYunPeriod | undefined;
    yun.getDaYun().slice(1).forEach(d => {
      const p: DaYunPeriod = {
        ganZhi: d.getGanZhi(),
        startYear: d.getStartYear(),
        endYear: d.getEndYear(),
        startAge: d.getStartAge(),
        endAge: d.getEndAge(),
        isCurrent: currentAge >= d.getStartAge() && currentAge <= d.getEndAge(),
      };
      if (p.isCurrent) current = p;
      periods.push(p);
    });
    let liuNian: LiuNianInfo[] = [];
    if (current) {
      const daYun = yun.getDaYun().slice(1).find(d => d.getStartAge() === current!.startAge);
      if (daYun) {
        liuNian = daYun.getLiuNian().map(l => ({
          ganZhi: l.getGanZhi(),
          year: l.getYear(),
          age: l.getAge(),
        }));
      }
    }
    yunInfo = {
      startText: `出生后约 ${yun.getStartYear()} 年 ${yun.getStartMonth()} 个月起运，交运于 ${startSolar.getYear()} 年 ${startSolar.getMonth()} 月 ${startSolar.getDay()} 日（${yun.isForward() ? '顺行' : '逆行'}）。`,
      forward: yun.isForward(),
      periods,
      liuNian,
    };
  } catch (e) {
    // 大运排盘失败不影响主功能
    yunInfo = undefined;
  }

  return {
    year: { ...year, element: year.stemElement, naYin: eightChar.getYearNaYin(), shiShen: getShiShen(day.stem, year.stem), branchShiShen: eightChar.getYearShiShenZhi()[0] || '' },
    month: { ...month, element: month.stemElement, naYin: eightChar.getMonthNaYin(), shiShen: getShiShen(day.stem, month.stem), branchShiShen: eightChar.getMonthShiShenZhi()[0] || '' },
    day: { ...day, element: day.stemElement, naYin: eightChar.getDayNaYin(), shiShen: '日主', branchShiShen: eightChar.getDayShiShenZhi()[0] || '' },
    hour: { ...hour, element: hour.stemElement, naYin: eightChar.getTimeNaYin(), shiShen: getShiShen(day.stem, hour.stem), branchShiShen: eightChar.getTimeShiShenZhi()[0] || '' },
    fiveElements: fiveElementsCount,
    dayMaster: day.stem,
    dayMasterElement: dmElement,
    dayMasterAnalysis: `日主${day.stem}，五行属${dmElement}。`,
    shengXiao: SHENG_XIAO[year.branch] || '',
    missingElements,
    auxStars: {
      taiYuan: { ganZhi: eightChar.getTaiYuan(), naYin: eightChar.getTaiYuanNaYin() },
      taiXi: { ganZhi: eightChar.getTaiXi(), naYin: eightChar.getTaiXiNaYin() },
      mingGong: { ganZhi: eightChar.getMingGong(), naYin: eightChar.getMingGongNaYin() },
      shenGong: { ganZhi: eightChar.getShenGong(), naYin: eightChar.getShenGongNaYin() },
    },
    monthCommand: {
      branch: month.branch,
      element: ELEMENT_MAP[month.branch],
      strength: strength,
      impact: impact
    },
    structure: {
      name: structName,
      description: structDesc
    },
    yun: yunInfo
  };
}
