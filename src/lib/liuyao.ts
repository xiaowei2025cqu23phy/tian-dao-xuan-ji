import { GET_HEX_BY_BINARY, TRIGRAMS } from './iching-data.ts';

/**
 * 六爻纳甲装卦
 * 基于经典纳甲筮法：
 *  - 纳甲：内卦三爻、外卦三爻分别按所属三爻卦纳甲（如乾内甲子甲寅甲辰，乾外壬午壬申壬戌）
 *  - 六亲：以卦宫五行为坐标，论爻之纳甲地支五行的生克（父母/兄弟/子孙/妻财/官鬼）
 *  - 世应：按八宫卦序定世爻位，应爻隔两位
 *  - 六神：以起卦日天干定初爻六神，依次为青龙、朱雀、勾陈、腾蛇、白虎、玄武
 */

export interface LiuYaoLine {
  position: number;      // 0=初爻 … 5=上爻
  name: string;          // 爻名（初/二/三/四/五/上）
  ganZhi: string;        // 纳甲干支
  element: string;       // 纳甲地支五行
  liuQin: string;        // 六亲
  liuShen: string;       // 六神
  isShi: boolean;
  isYing: boolean;
  isMoving: boolean;
  type: 'yang' | 'yin';
}

export interface LiuYaoResult {
  hexName: string;
  palace: string;        // 宫名（乾宫/坤宫…）
  palaceElement: string; // 宫五行
  shiPos: number;        // 世爻位
  yingPos: number;       // 应爻位
  lines: LiuYaoLine[];
}

const ZHI_ELEMENT: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};
const GENERATES: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const CONTROLS: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

/** 三爻卦纳甲（爻位 0=初爻） */
const NAJIA: Record<string, string[]> = {
  '乾': ['甲子', '甲寅', '甲辰', '壬午', '壬申', '壬戌'],
  '坤': ['乙未', '乙巳', '乙卯', '癸丑', '癸亥', '癸酉'],
  '震': ['庚子', '庚寅', '庚辰', '庚午', '庚申', '庚戌'],
  '巽': ['辛丑', '辛亥', '辛酉', '辛未', '辛巳', '辛卯'],
  '坎': ['戊寅', '戊辰', '戊午', '戊申', '戊戌', '戊子'],
  '离': ['己卯', '己丑', '己亥', '己酉', '己未', '己巳'],
  '艮': ['丙辰', '丙午', '丙申', '丙戌', '丙子', '丙寅'],
  '兑': ['丁巳', '丁卯', '丁丑', '丁亥', '丁酉', '丁未'],
};

const PALACE_ELEMENT: Record<string, string> = {
  '乾': '金', '坎': '水', '艮': '土', '震': '木', '巽': '木', '离': '火', '坤': '土', '兑': '金',
};

/** 八宫卦序：卦名 → [宫名, 世爻位(0=初爻)]（本宫6 / 一世1 / 二世2 / 三世3 / 四世4 / 五世5 / 游魂4 / 归魂3） */
const PALACE_TABLE: Record<string, [string, number]> = {
  '乾': ['乾', 5], '姤': ['乾', 0], '遁': ['乾', 1], '否': ['乾', 2], '观': ['乾', 3], '剥': ['乾', 4], '晋': ['乾', 3], '大有': ['乾', 2],
  '坎': ['坎', 5], '节': ['坎', 0], '屯': ['坎', 1], '既济': ['坎', 2], '革': ['坎', 3], '丰': ['坎', 4], '明夷': ['坎', 3], '师': ['坎', 2],
  '艮': ['艮', 5], '贲': ['艮', 0], '大畜': ['艮', 1], '损': ['艮', 2], '睽': ['艮', 3], '履': ['艮', 4], '中孚': ['艮', 3], '渐': ['艮', 2],
  '震': ['震', 5], '豫': ['震', 0], '解': ['震', 1], '恒': ['震', 2], '升': ['震', 3], '井': ['震', 4], '大过': ['震', 3], '随': ['震', 2],
  '巽': ['巽', 5], '小畜': ['巽', 0], '家人': ['巽', 1], '益': ['巽', 2], '无妄': ['巽', 3], '噬嗑': ['巽', 4], '颐': ['巽', 3], '蛊': ['巽', 2],
  '离': ['离', 5], '旅': ['离', 0], '鼎': ['离', 1], '未济': ['离', 2], '蒙': ['离', 3], '涣': ['离', 4], '讼': ['离', 3], '同人': ['离', 2],
  '坤': ['坤', 5], '复': ['坤', 0], '临': ['坤', 1], '泰': ['坤', 2], '大壮': ['坤', 3], '夬': ['坤', 4], '需': ['坤', 3], '比': ['坤', 2],
  '兑': ['兑', 5], '困': ['兑', 0], '萃': ['兑', 1], '咸': ['兑', 2], '蹇': ['兑', 3], '谦': ['兑', 4], '小过': ['兑', 3], '归妹': ['兑', 2],
};

const LIU_SHEN = ['青龙', '朱雀', '勾陈', '腾蛇', '白虎', '玄武'];
const LIU_SHEN_START: Record<string, number> = {
  '甲': 0, '乙': 0, '丙': 1, '丁': 1, '戊': 2, '己': 3, '庚': 4, '辛': 4, '壬': 5, '癸': 5,
};

function getLiuQin(palaceEl: string, lineEl: string): string {
  if (palaceEl === lineEl) return '兄弟';
  if (GENERATES[palaceEl] === lineEl) return '子孙';  // 我生者
  if (CONTROLS[palaceEl] === lineEl) return '妻财';   // 我克者
  if (GENERATES[lineEl] === palaceEl) return '父母';  // 生我者
  return '官鬼';                                       // 克我者
}

/**
 * 装卦
 * @param binary 六爻二进制（自下而上，1=阳）
 * @param dayGan 起卦日天干（用于定六神）
 * @param movingPositions 动爻位（0=初爻）
 */
export function buildLiuYao(binary: string, dayGan: string, movingPositions: number[] = []): LiuYaoResult {
  const hex = GET_HEX_BY_BINARY(binary);
  const table = PALACE_TABLE[hex.name] || ['乾', 5];
  const [palace, shiPos] = table;
  const palaceElement = PALACE_ELEMENT[palace] || '金';
  const yingPos = (shiPos + 3) % 6;

  const lowerTri = TRIGRAMS[binary.slice(0, 3)]?.name || '乾';
  const upperTri = TRIGRAMS[binary.slice(3, 6)]?.name || '乾';
  const najia = [...NAJIA[lowerTri].slice(0, 3), ...NAJIA[upperTri].slice(3, 6)];

  const shenStart = LIU_SHEN_START[dayGan] ?? 0;
  const names = ['初', '二', '三', '四', '五', '上'];

  const lines: LiuYaoLine[] = najia.map((gz, i) => {
    const zhi = gz.substring(1, 2);
    return {
      position: i,
      name: names[i],
      ganZhi: gz,
      element: ZHI_ELEMENT[zhi] || '',
      liuQin: getLiuQin(palaceElement, ZHI_ELEMENT[zhi] || ''),
      liuShen: LIU_SHEN[(shenStart + i) % 6],
      isShi: i === shiPos,
      isYing: i === yingPos,
      isMoving: movingPositions.includes(i),
      type: binary.charAt(i) === '1' ? 'yang' : 'yin',
    };
  });

  return { hexName: hex.name, palace, palaceElement, shiPos, yingPos, lines };
}

/** 六神与六亲的可视化配色（供 UI 复用） */
export const LIU_QIN_COLORS: Record<string, string> = {
  '父母': 'text-imperial-red',
  '兄弟': 'text-[#7c512d]',
  '子孙': 'text-[#2d5a27]',
  '妻财': 'text-[#1e3a8a]',
  '官鬼': 'text-[#8a1c3c]',
};
