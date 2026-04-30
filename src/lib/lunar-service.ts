import { Solar, Lunar, LunarMonth, EightChar } from 'lunar-javascript';

export interface BaziData {
  year: { stem: string; branch: string; element: string };
  month: { stem: string; branch: string; element: string };
  day: { stem: string; branch: string; element: string };
  hour: { stem: string; branch: string; element: string };
  fiveElements: Record<string, number>;
  dayMaster: string;
  dayMasterAnalysis: string;
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
    case '比劫': 
      structName = dmStrength === '旺' ? '建禄格/月劫格' : '身旺格';
      structDesc = '日主得令，自坐强根，个性独立自强，富有竞争意识，宜用财官。';
      break;
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

  return {
    year: { ...year, element: year.stemElement },
    month: { ...month, element: month.stemElement },
    day: { ...day, element: day.stemElement },
    hour: { ...hour, element: hour.stemElement },
    fiveElements: fiveElementsCount,
    dayMaster: day.stem,
    dayMasterAnalysis: `日主${day.stem}，五行属${dmElement}。`,
    monthCommand: {
      branch: month.branch,
      element: ELEMENT_MAP[month.branch],
      strength: strength,
      impact: impact
    },
    structure: {
      name: structName,
      description: structDesc
    }
  };
}
