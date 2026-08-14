export interface LineDetail {
  text: string;
  allusion: string;
  analysis: string;
  positionContext: string;
  hexRelationship: string;
  preBagua?: string;
  postBagua?: string;
}

export interface Hexagram {
  id: string;
  name: string;
  pinyin: string;
  symbol: string;
  binary: string; // Bottom to top
  judgement: string;
  meaning: string;
  number: number;
  lines?: string[]; // 6 lines from bottom to top
  lineDetails?: LineDetail[];
}

const GENERIC_ALLUSION = "见于《易经》各家注疏，蕴含天人合一之深意。";
const GENERIC_ANALYSIS = "此爻位居卦中，反映了当下时空点的动态变化。其动转牵一发而动全身，预示着能量的转化与平衡的重塑。";

const POSITION_SENSE = [
  "初爻：事道之始，元气初基。此时宜守不宜燥，积蓄能量以待天时。",
  "二爻：居下卦之中，得位得中。象征内在修养与初步的社会认可，多为吉兆。",
  "三爻：处内外卦之交，位高而忧。处于转型期的震荡点，需谨慎防范风险。",
  "四爻：进入上卦，近君之位。此时才智已成，进退自如，需察纳雅言。",
  "五爻：全卦之主，极尊之位。象征事物的巅峰状态与统御之力，利于决策执行。",
  "上爻：事物之极，极则必反。警示功成名遂后的急流勇退，防范过犹不及。"
];

const BAGUA_META: Record<string, { pre: string, post: string, symb: string }> = {
  '111': { pre: '正南', post: '西北', symb: '天之刚健，纯阳之基' },
  '000': { pre: '正北', post: '西南', symb: '地之宽厚，万物所仰' },
  '100': { pre: '东北', post: '正东', symb: '雷之震动，奋发向上' },
  '011': { pre: '西南', post: '东南', symb: '风之入也，柔顺渗透' },
  '010': { pre: '正西', post: '正北', symb: '水之深陷，处险不惊' },
  '101': { pre: '正东', post: '正南', symb: '火之光明，依附而丽' },
  '001': { pre: '西北', post: '东北', symb: '山之静止，厚重稳固' },
  '110': { pre: '东南', post: '正西', symb: '泽之悦也，滋润喜悦' },
};

export const getLineDetails = (hex: Hexagram, movingIndexes?: number[]): LineDetail[] => {
  if (!hex.lines) return [];
  
  const bottomTrigram = hex.binary.slice(0, 3);
  const topTrigram = hex.binary.slice(3, 6);
  
  const specialDetails: Record<number, Partial<LineDetail>[]> = {
    1: [ // Qian
      { allusion: "舜耕历山，历经磨难而终得圣治。在此处【乾】卦之始，象征纯阳之气尚在潜伏。" },
      { allusion: "孔子游学，初展才华。名声渐起，在此【乾】卦之二，象征进入社会视野。" },
      { allusion: "周文王在羑里演易。虽处危境，能以忧患意识自励。对应【乾】卦刚健之性。" },
      { allusion: "子牙垂钓，意在江山。进退自如，不以得失乱心。处于【乾】卦内外卦之交。" },
      { allusion: "汉高祖入关，众望所归。得时得位，大展宏图。正值【乾】卦最尊之位。" },
      { allusion: "西楚霸王乌江自刎。盛极必衰，刚愎自用之诫。警示【乾】卦之极。" }
    ],
  };

  const details: LineDetail[] = hex.lines.map((l, i) => {
    const special = specialDetails[hex.number]?.[i] || {};
    const posName = ['初', '二', '三', '四', '五', '上'][i];
    const isUpper = i >= 3;
    const trigramBin = isUpper ? topTrigram : bottomTrigram;
    const meta = BAGUA_META[trigramBin];
    
    return {
      text: l,
      allusion: special.allusion || `此爻见于《易经》${hex.name}卦，${GENERIC_ALLUSION}`,
      positionContext: POSITION_SENSE[i],
      hexRelationship: `作为${hex.name}卦（寓意：${hex.meaning.split('。')[0]}）的${posName}爻，其时位紧扣该卦的核心逻辑。`,
      analysis: special.analysis || `${GENERIC_ANALYSIS}`,
      preBagua: meta ? `先天位：${meta.pre} | 象征：${meta.symb}` : undefined,
      postBagua: meta ? `后天位：${meta.post} | 象征：该爻位所属之卦象正在发生时位上的转化。` : undefined
    };
  });

  if (movingIndexes) {
    return details.map((detail, i) => {
      if (movingIndexes.includes(i)) {
        return {
          ...detail,
          analysis: detail.analysis + ` [此爻为动爻：意味着${hex.name}卦的整体平衡正因此处的能量激荡而发生位移，可能由原本的“${hex.meaning.split('。')[0]}”向受变卦影响的新局势转化。]`
        };
      }
      return detail;
    });
  }

  return details;
};

export const TRIGRAMS: Record<string, { name: string, element: string, nature: string }> = {
  '111': { name: '乾', element: '金', nature: '天' },
  '000': { name: '坤', element: '土', nature: '地' },
  '100': { name: '震', element: '木', nature: '雷' },
  '011': { name: '巽', element: '木', nature: '风' },
  '010': { name: '坎', element: '水', nature: '水' },
  '101': { name: '离', element: '火', nature: '火' },
  '001': { name: '艮', element: '土', nature: '山' },
  '110': { name: '兑', element: '金', nature: '泽' },
};

export const HEXAGRAMS_DATA: Record<string, Partial<Hexagram>> = {
  '111111': { name: '乾', pinyin: 'Qián', symbol: '䷀', judgement: '元亨利贞。', meaning: '天行健，君子以自强不息。象征刚健中正。', number: 1, lines: ['潜龙勿用。', '见龙在田，利见大人。', '君子终日乾乾，夕惕若，无咎。', '或跃在渊，无咎。', '飞龙在天，利见大人。', '亢龙有悔。'] },
  '000000': { name: '坤', pinyin: 'Kūn', symbol: '䷁', judgement: '元亨，利牝马之贞。', meaning: '地势坤，君子以厚德载物。象征顺从宽厚。', number: 2, lines: ['履霜，坚冰至。', '直方大，不习无不利。', '含章可贞，或从王事，无成有终。', '括囊，无咎无誉。', '黄裳元吉。', '龙战于野，其血玄黄。'] },
  '100010': { name: '屯', pinyin: 'Zhūn', symbol: '䷂', judgement: '元亨利贞，勿用有攸往，利建侯。', meaning: '水雷屯。刚柔始交而难生。万事开头难，宜积厚资财。', number: 3, lines: ['磐桓，利居贞，利建侯。', '屯如邅如，乘马班如，匪寇婚媾。', '即鹿无虞，惟入于林中，君子几不如舍，往吝。', '乘马班如，求婚媾，往吉，无不利。', '屯其膏，小贞吉，大贞凶。', '乘马班如，泣血涟如。'] },
  '010001': { name: '蒙', pinyin: 'Méng', symbol: '䷃', judgement: '亨。匪我求童蒙，童蒙求我。', meaning: '山水蒙。蒙以养正。启蒙阶段，宜静待明师。', number: 4, lines: ['发蒙，利用刑人，用说桎梏，以往吝。', '包蒙吉；纳妇吉；子克家。', '勿用取女，见金夫，不有躬，无攸利。', '困蒙，吝。', '童蒙，吉。', '击蒙，不利为寇，利御寇。'] },
  '111010': { name: '需', pinyin: 'Xū', symbol: '䷄', judgement: '有孚，光亨，贞吉。利涉大川。', meaning: '水天需。云上于天。守正待时，耐心等待时机成熟。', number: 5, lines: ['需于郊，利用恒，无咎。', '需于沙，小有言，终吉。', '需于泥，致寇至。', '需于血，出自穴。', '需于酒食，贞吉。', '入于穴，有不速之客三人来，敬之终吉。'] },
  '010111': { name: '讼', pinyin: 'Sòng', symbol: '䷅', judgement: '有孚，窒，惕中吉。终凶。', meaning: '天水讼。上刚下险。争端初起，宜止不宜进，和为贵。', number: 6, lines: ['不永所事，小有言，终吉。', '不克讼，归而逋其邑人三百户，无眚。', '食旧德，贞厉，终吉。或从王事，无成。', '不克讼，复即命，渝安贞，吉。', '讼，元吉。', '或锡之鞶带，终朝三褫之。'] },
  '010000': { name: '师', pinyin: 'Shī', symbol: '䷆', judgement: '贞，丈人吉，无咎。', meaning: '地水师。地中有水。统率大众，宜守正，宜有主心骨。', number: 7, lines: ['师出以律，否臧凶。', '在师中吉，无咎，王三锡命。', '师或舆尸，凶。', '师左次，无咎。', '田有禽，利执言，无咎。长子帅师，弟子舆尸，贞凶。', '大君有命，开国承家，小人勿用。'] },
  '000010': { name: '比', pinyin: 'Bǐ', symbol: '䷇', judgement: '吉。原筮元永贞，无咎。', meaning: '水地比。地上有水。亲比、和乐，宜建立良好人际关系。', number: 8, lines: ['有孚比之，无咎。有孚盈缶，终来有它吉。', '比之自内，贞吉。', '比之匪人。', '外比之，贞吉。', '显比，王用三驱，失前禽。邑人不诫，吉。', '比之无首，凶。'] },
  '111011': { name: '小畜', pinyin: 'Xiǎo Xù', symbol: '䷈', judgement: '亨。密云不雨，自我西郊。', meaning: '风天小畜。地外有风。积聚力量，暂时受阻，需耐心等待。', number: 9, lines: ['复自道，何其咎，吉。', '牵复，吉。', '舆说辐，夫妻反目。', '有孚，血去惕出，无咎。', '有孚挛如，富以其邻。', '既雨既处，尚德载，妇贞厉。月几望，君子征凶。'] },
  '110111': { name: '履', pinyin: 'Lǚ', symbol: '䷉', judgement: '履虎尾，不咥人，亨。', meaning: '天泽履。上天下泽。如履薄冰，依礼而行，防微杜渐。', number: 10, lines: ['素履往，无咎。', '履道坦坦，幽人贞吉。', '眇能视，跛能履，履虎尾，咥人，凶。武人为于大君。', '履虎尾，愬愬终吉。', '夬履，贞厉。', '视履考祥，其旋元吉。'] },
  '111000': { name: '泰', pinyin: 'Tài', symbol: '䷊', judgement: '小往大来，吉亨。', meaning: '地天泰。天地交而万物通。极其顺利，上下交融。', number: 11, lines: ['拔茅茹，以其汇，征吉。', '包荒，用冯河，不遐遗，朋亡，得尚于中行。', '无平不陂，无往不复，艰贞无咎。勿恤其孚，于食有福。', '翩翩不富，以其邻，不戒以孚。', '帝乙归妹，以祉元吉。', '城复于隍，勿用师。自邑告命，贞吝。'] },
  '000111': { name: '否', pinyin: 'Pǐ', symbol: '䷋', judgement: '否之匪人，不利君子贞。', meaning: '天地否。上下不交。沟通闭塞，时运不佳，宜隐忍。', number: 12, lines: ['拔茅茹，以其汇，贞吉，亨。', '包承。小人吉，大人否亨。', '包羞。', '有命无咎，畴离祉。', '休否，大人吉。其亡其亡，系于苞桑。', '倾否，先否后喜。'] },
  '101111': { name: '同人', pinyin: 'Tóng Rén', symbol: '䷌', judgement: '同人于野，亨。利涉大川。', meaning: '天火同人。志同道合。合作共赢，广聚人脉。', number: 13, lines: ['同人于门，无咎。', '同人于宗，吝。', '伏戎于莽，升其高陵，三岁不兴。', '乘其墉，弗克攻，吉。', '同人，先号咷而后笑，大师克相遇。', '同人于郊，无悔。'] },
  '111101': { name: '大有', pinyin: 'Dà Yǒu', symbol: '䷍', judgement: '元亨。', meaning: '火天大有。顺天依时。身居尊位，拥有丰厚，宜谦虚谨慎。', number: 14, lines: ['无交害，匪咎，艰则无咎。', '大车以载，有攸往，无咎。', '公用亨于天子，小人弗克。', '匪其彭，无咎。', '厥孚交如，威如，吉。', '自天佑之，吉无不利。'] },
  '001000': { name: '谦', pinyin: 'Qiān', symbol: '䷎', judgement: '亨，君子有终。', meaning: '地山谦。内高外下。谦逊受益，凡事不可满盈。', number: 15, lines: ['谦谦君子，用涉大川，吉。', '鸣谦，贞吉。', '劳谦君子，有终吉。', '无不利，撝谦。', '不富以其邻，利用侵伐，无不利。', '鸣谦，利用行师，征邑国。'] },
  '000100': { name: '豫', pinyin: 'Yù', symbol: '䷏', judgement: '利建侯行师。', meaning: '雷地豫。顺以动。喜悦、预备。宜顺势而为，振作士气。', number: 16, lines: ['鸣豫，凶。', '介于石，不终日，贞吉。', '盱豫，悔。迟，有悔。', '由豫，大有得。勿疑。朋盍簪。', '贞疾，恒不死。', '冥豫，成有渝，无咎。'] },
  '100110': { name: '随', pinyin: 'Suí', symbol: '䷐', judgement: '元亨利贞，无咎。', meaning: '泽雷随。随时变通。追随、顺从时势，不可固执。', number: 17, lines: ['官有渝，贞吉。出门交有功。', '系小子，失丈夫。', '系丈夫，失小子。随有求得，利居贞。', '随有获，贞凶。有孚在道，以明，何咎。', '孚于嘉，吉。', '拘系之，乃从维之。王用亨于西山。'] },
  '011001': { name: '蛊', pinyin: 'Gǔ', symbol: '䷑', judgement: '元亨，利涉大川。', meaning: '山风蛊。事有积弊。拨乱反正，需大刀阔斧改革。', number: 18, lines: ['干父之蛊，有子，考无咎，厉终吉。', '干母之蛊，不可贞。', '干父之蛊，小有悔，无大咎。', '裕父之蛊，往见吝。', '干父之蛊，用誉。', '不事王侯，高尚其事。'] },
  '110000': { name: '临', pinyin: 'Lín', symbol: '䷒', judgement: '元亨利贞。至于八月有凶。', meaning: '地泽临。以上临下。时运正旺，宜居安思危。', number: 19, lines: ['咸临，贞吉。', '咸临，吉无不利。', '甘临，无攸利。既忧之，无咎。', '至临，无咎。', '知临，大君之宜，吉。', '敦临，吉无咎。'] },
  '000011': { name: '观', pinyin: 'Guān', symbol: '䷓', judgement: '盥而不荐，有孚颙若。', meaning: '风地观。观察、感化。宜静观其变，树立典范。', number: 20, lines: ['童观，小人无咎，君子吝。', '窥观，利女贞。', '观我生，进退。', '观国之光，利用宾于王。', '观我生，君子无咎。', '观其生，君子无咎。'] },
  '100101': { name: '噬嗑', pinyin: 'Shì Kè', symbol: '䷔', judgement: '亨。利用狱。', meaning: '火雷噬嗑。如鲠在喉。需严明法度，排除阻碍。', number: 21, lines: ['屦校灭趾，无咎。', '噬肤灭鼻，无咎。', '噬腊肉，遇毒；小吝，无咎。', '噬干胏，得金矢，利艰贞，吉。', '噬干肉，得黄金，贞厉，无咎。', '何校灭耳，凶。'] },
  '101001': { name: '贲', pinyin: 'Bì', symbol: '䷕', judgement: '亨。小利有攸往。', meaning: '山火贲。文饰、装饰。注重礼节外饰，但不宜流于虚浮。', number: 22, lines: ['贲其趾，舍车而徒。', '贲其须。', '贲如濡如，永贞吉。', '贲如皤如，白马翰如，匪寇婚媾。', '贲于丘园，束帛戋戋，吝，终吉。', '白贲，无咎。'] },
  '000001': { name: '剥', pinyin: 'Bō', symbol: '䷖', judgement: '不利有攸往。', meaning: '山地剥。小人道长。防线崩溃，不宜有所作为，宜固守。', number: 23, lines: ['剥床以足，蔑贞凶。', '剥床以辨，蔑贞凶。', '剥之，无咎。', '剥床以肤，凶。', '贯鱼，以宫人宠，无不利。', '硕果不食，君子得舆，小人剥庐。'] },
  '100000': { name: '复', pinyin: 'Fù', symbol: '䷗', judgement: '亨。出入无咎，朋来无咎。', meaning: '地雷复。一阳复生。生机再现，循序渐进，不可操之过急。', number: 24, lines: ['不远复，无祗悔，元吉。', '休复，吉。', '频复，厉无咎。', '中行独复。', '敦复，无悔。', '迷复，凶，有灾眚。用行师，终有大败，以其国君，凶；至于十年，不克征。'] },
  '100111': { name: '无妄', pinyin: 'Wú Wàng', symbol: '䷘', judgement: '元亨利贞。其匪正有眚。', meaning: '天雷无妄。顺应自然。真实无欺，不可妄求外物。', number: 25, lines: ['无妄，往吉。', '不耕获，不菑畲，则利有攸往。', '无妄之灾，或系之牛，行人之得，邑人之灾。', '可贞，无咎。', '无妄之疾，勿药有喜。', '无妄，行有眚，无攸利。'] },
  '111001': { name: '大畜', pinyin: 'Dà Xù', symbol: '䷙', judgement: '利贞。不家食吉。', meaning: '山天大畜。积蓄大智。博学多识，能蓄大才以待用。', number: 26, lines: ['有厉，利已。', '舆说輹。', '良马逐，利艰贞。日闲舆卫，利有攸往。', '童牛之牿，元吉。', '豮豕之牙，吉。', '何天之衢，亨。'] },
  '100001': { name: '颐', pinyin: 'Yí', symbol: '䷚', judgement: '贞吉。观颐，自求口实。', meaning: '山雷颐。养之道。注进修养生，明察自求自足之理。', number: 27, lines: ['舍尔灵龟，观我朵颐，凶。', '颠颐，拂经，于丘颐，征凶。', '拂颐，贞凶，十年勿用，无攸利。', '颠颐吉，虎视眈眈，其欲逐逐，无咎。', '拂经，居贞吉，不可涉大川。', '由颐，厉吉，利涉大川。'] },
  '011110': { name: '大过', pinyin: 'Dà Guò', symbol: '䷛', judgement: '栋挠。利有攸往，亨。', meaning: '泽风大过。压力过大。行动虽险，但如能独立不惧，则亨通。', number: 28, lines: ['藉用白茅，无咎。', '枯杨生稊，老夫得其女妻，无不利。', '栋挠，凶。', '栋隆，吉；有它吝。', '枯杨生华，老妇得其士夫，无咎无誉。', '过涉灭顶，凶，无咎。'] },
  '010010': { name: '坎', pinyin: 'Kǎn', symbol: '䷜', judgement: '重坎。习坎，有孚。', meaning: '水上加水。重重险阻。坚守信念，虽险而通过。', number: 29, lines: ['习坎，入于坎窞，凶。', '坎有险，求小得。', '来之坎坎，险且枕，入于坎窞，勿用。', '樽酒簋贰，用缶，纳约自牖，终无咎。', '坎不盈，祗既平，无咎。', '系用徽纆，置于丛棘，三岁不得，凶。'] },
  '101101': { name: '离', pinyin: 'Lí', symbol: '䷝', judgement: '利贞亨，畜牝牛吉。', meaning: '火上加火。光明美丽。利于坚守正道，互相依附。', number: 30, lines: ['履错然，敬之无咎。', '黄离，元吉。', '日昃之离，不鼓缶而歌，则大耋之嗟，凶。', '突如其来如，焚如，死如，弃如。', '出涕沱若，戚嗟若，吉。', '王用出征，有嘉折首，获其匪丑，无咎。'] },
  '001110': { name: '咸', pinyin: 'Xián', symbol: '䷞', judgement: '亨利贞，取女吉。', meaning: '泽山咸。感应、情感。真心相交，利于婚姻合作。', number: 31, lines: ['咸其拇。', '咸其腓，凶，居吉。', '咸其股，执其随，往吝。', '贞吉悔亡，憧憧往来，朋从尔思。', '咸其脢，无悔。', '咸其辅，颊，舌。'] },
  '011100': { name: '恒', pinyin: 'Héng', symbol: '䷟', judgement: '亨无咎，利贞。', meaning: '雷风恒。长久持久。守正不移，方能长久。', number: 32, lines: ['浚恒，贞凶，无攸利。', '悔亡。', '不恒其德，或承之羞，贞吝。', '田无禽。', '恒其德，贞妇吉，夫子凶。', '振恒，凶。'] },
  '001111': { name: '遁', pinyin: 'Dùn', symbol: '䷠', judgement: '亨，小利贞。', meaning: '天山遁。退避、隐退。小人道长，君子宜退而自守。', number: 33, lines: ['遁尾，厉，勿用有攸往。', '执之用黄牛之革，莫之胜说。', '系遁，有疾厉，畜臣妾吉。', '好遁君子吉，小人否。', '嘉遁，贞吉。', '肥遁，无不利。'] },
  '111100': { name: '大壮', pinyin: 'Dà Zhuàng', symbol: '䷡', judgement: '利贞。', meaning: '雷天大壮。阳气盛长。势头强劲，宜正大光明。', number: 34, lines: ['壮于趾，征凶，有孚。', '贞吉。', '小人用壮，君子用罔，贞厉。羝羊触藩，羸其角。', '贞吉悔亡，藩决不羸，壮于大舆之輹。', '丧羊于易，无悔。', '羝羊触藩，不能退，不能遂，无攸利，艰则吉。'] },
  '000101': { name: '晋', pinyin: 'Jìn', symbol: '䷢', judgement: '康侯用锡马蕃庶。', meaning: '火地晋。如日出地。加官进爵，事事向上。', number: 35, lines: ['晋如，摧如，贞吉。罔孚，裕无咎。', '晋如，愁如，贞吉。受兹介福，于其王母。', '众允，悔亡。', '晋如鼫鼠，贞厉。', '悔亡，失得勿恤，往吉无不利。', '晋其角，维用伐邑，厉吉无咎，贞吝。'] },
  '101000': { name: '明夷', pinyin: 'Míng Yí', symbol: '䷣', judgement: '利艰贞。', meaning: '地火明夷。光明受损。身处险境，宜韬光养晦。', number: 36, lines: ['明夷于飞，垂其翼。君子于行，三日不食，有攸往，主人有言。', '明夷，夷于左股，用拯马壮，吉。', '明夷于南狩，得其大首，不可疾贞。', '入于左腹，获明夷之心，出于门庭。', '箕子之明夷，利贞。', '不明晦，初登于天，后入于地。'] },
  '101011': { name: '家人', pinyin: 'Jiā Rén', symbol: '䷤', judgement: '利女贞。', meaning: '风火家人。齐家之道。各安其位，和睦共处。', number: 37, lines: ['闲有家，悔亡。', '无攸遂，在中馈，贞吉。', '家人嗃嗃，悔厉吉；妇子嘻嘻，终吝。', '富家，大吉。', '王假有家，勿恤吉。', '有孚威如，终吉。'] },
  '110101': { name: '睽', pinyin: 'Kuí', symbol: '䷥', judgement: '小事吉。', meaning: '火泽睽。乖离、对立。求大同存小异，异中求助。', number: 38, lines: ['悔亡，丧马勿逐，自复；见恶人无咎。', '遇主于巷，无咎。', '见舆曳，其牛掣，其人天且劓，无初有终。', '睽孤，遇元夫，交孚，厉无咎。', '悔亡，厥宗噬肤，往何咎。', '睽孤，见豕负涂，载鬼一车，先张之弧，后说之弧，匪寇婚媾，往遇雨则吉。'] },
  '001010': { name: '蹇', pinyin: 'Jiǎn', symbol: '䷦', judgement: '利西南，不利东北。', meaning: '水山蹇。前有险。进退维谷，宜见险而止，求助贵人。', number: 39, lines: ['往蹇，来誉。', '王臣蹇蹇，匪躬之故。', '往蹇来反。', '往蹇来连。', '大蹇朋来。', '往蹇来硕，吉；利见大人。'] },
  '010100': { name: '解', pinyin: 'Jiě', symbol: '䷧', judgement: '利西南。无所往，其来复吉。', meaning: '雷水解。解脱困难。宜宽厚，危机已过，宜休养生息。', number: 40, lines: ['无咎。', '田获三狐，得黄矢，贞吉。', '负且乘，致寇至，贞吝。', '解而拇，朋至斯孚。', '君子维有解，吉；有孚于小人。', '公用射隼于高墉之上，获之，无不利。'] },
  '110001': { name: '损', pinyin: 'Sǔn', symbol: '䷨', judgement: '有孚，元吉，无咎。', meaning: '山泽损。损下益上。减损欲望，诚信第一。', number: 41, lines: ['巳事遄往，无咎，酌损之。', '利贞，征凶，弗损益之。', '三人行，则损一人；一人行，则得其友。', '损其疾，使遄有喜，无咎。', '或益之，十朋之龟弗克违，元吉。', '弗损益之，无咎，贞吉，利有攸往，得臣无家。'] },
  '100011': { name: '益', pinyin: 'Yì', symbol: '䷩', judgement: '利有攸往。', meaning: '风雷益。损上益下。利于增益，宜勇往直前。', number: 42, lines: ['利用为大作，元吉，无咎。', '或益之，十朋之龟弗克违，永贞吉。王用享于帝，吉。', '益之用凶事，无咎。有孚中行，告公用圭。', '中行，告公从。利用为依迁国。', '有孚惠心，勿问元吉。有孚惠我德。', '莫益之，或击之，立心勿恒，凶。'] },
  '111110': { name: '夬', pinyin: 'Guài', symbol: '䷪', judgement: '扬于王庭。', meaning: '泽天夬。决断。宜果断排除阻力，且不可自傲。', number: 43, lines: ['壮于前趾，往不胜为吝。', '惕号，莫夜有戎，勿恤。', '壮于頄，有凶。君子夬夬，独行遇雨，若濡有愠，无咎。', '臀无肤，其行次且。牵羊悔亡，闻言不信。', '苋陆夬夬，中行无咎。', '无号，终有凶。'] },
  '011111': { name: '姤', pinyin: 'Gòu', symbol: '䷫', judgement: '女壮，勿用取女。', meaning: '天风姤。邂逅、遇合。警惕隐患萌芽，防患于未然。', number: 44, lines: ['系于金柅，贞吉。有攸往，见凶，羸豕孚蹢躑。', '包有鱼，无咎，不利宾。', '臀无肤，其行次且，厉，无大咎。', '包无鱼，起凶。', '以杞包瓜，含章，有陨自天。', '姤其角，吝，无咎。'] },
  '000110': { name: '萃', pinyin: 'Cuì', symbol: '䷬', judgement: '亨。王假有庙。', meaning: '泽地萃。聚集、会聚。宜建立感召力，聚合能量。', number: 45, lines: ['有孚不终，乃乱乃萃，若号一握为笑，勿恤，往无咎。', '引吉，无咎，孚乃利用禴。', '萃如，嗟如，无攸利，往无咎，小吝。', '大吉，无咎。', '萃有位，无咎。匪孚，元永贞，悔亡。', '赍咨涕洟，无咎。'] },
  '011000': { name: '升', pinyin: 'Shēng', symbol: '䷭', judgement: '元亨。用见大人，勿恤。', meaning: '地风升。柔以时升。稳步上升，多得贵人相识。', number: 46, lines: ['允升，大吉。', '孚乃利用禴，无咎。', '升虚邑。', '王用亨于岐山，吉无咎。', '贞吉，升阶。', '冥升，利于不息之贞。'] },
  '010110': { name: '困', pinyin: 'Kùn', symbol: '䷮', judgement: '亨，贞。大人吉，无咎。', meaning: '泽水困。穷困、泽中无水。困境中宜志向坚定。', number: 47, lines: ['臀困于株木，入于幽谷，三岁不觌。', '困于酒食，朱绂方来，利用亨祀，征凶，无咎。', '困于石，据于蒺藜，入于其宫，不见其妻，凶。', '来徐徐，困于金车，吝，有终。', '劓刖，困于赤绂，乃徐有说，利用祭祀。', '困于葛藟，于臲卼，曰动悔。有悔，征吉。'] },
  '011010': { name: '井', pinyin: 'Jǐng', symbol: '䷯', judgement: '改邑不改井。', meaning: '水风井。井水之德。厚积薄发，惠及他人，资源恒定。', number: 48, lines: ['井泥不食，旧井无禽。', '井谷射鲋，瓮敝漏。', '井渫不食，为我心恻，可用汲，王明，并受其福。', '井甃，无咎。', '井冽，寒泉食。', '井收勿幕，有孚元吉。'] },
  '101110': { name: '革', pinyin: 'Gé', symbol: '䷰', judgement: '已日乃孚，元亨利贞。', meaning: '泽火革。改革变新。旧的不去新的不来，时机已至。', number: 49, lines: ['巩用黄牛之革。', '巳日乃革之，征吉，无咎。', '征凶，贞厉，革言三就，有孚。', '悔亡，有孚改命，吉。', '大人虎变，未占有孚。', '君子豹变，小人革面，征凶，居贞吉。'] },
  '011101': { name: '鼎', pinyin: 'Dǐng', symbol: '䷱', judgement: '元吉，亨。', meaning: '火风鼎。更新、定鼎。革故鼎新，稳重持大。', number: 50, lines: ['鼎颠趾，利出否，得妾以其子，无咎。', '鼎有实，我仇有疾，不我能及，吉。', '鼎耳革，其行塞，雉膏不食，方雨亏悔，终吉。', '鼎折足，覆公餗，其形渥，凶。', '鼎黄耳金铉，利贞。', '鼎玉铉，大吉，无不利。'] },
  '100100': { name: '震', pinyin: 'Zhèn', symbol: '䷲', judgement: '亨。震来虩虩，笑言哑哑。', meaning: '震上震下。震惊百里。惊动、奋起。宜自律反省。', number: 51, lines: ['震来虩虩，后笑言哑哑，吉。', '震来厉，亿丧贝，跻于九陵，勿逐，七日得。', '震苏苏，震行无眚。', '震遂泥。', '震往来厉，亿无丧，有事。', '震索索，视矍矍，征凶。震不于其躬，于其邻，无咎。婚媾有言。'] },
  '001001': { name: '艮', pinyin: 'Gèn', symbol: '䷳', judgement: '艮其背，不获其身。', meaning: '艮上艮下。止、静止。时止则止，需心气平和。', number: 52, lines: ['艮其趾，无咎，利永贞。', '艮其腓，不拯其随，其心不快。', '艮其限，列其夤，厉薰心。', '艮其身，无咎。', '艮其辅，言有序，悔亡。', '敦艮，吉。'] },
  '001011': { name: '渐', pinyin: 'Jiàn', symbol: '䷴', judgement: '女归吉，利贞。', meaning: '风山渐。循序渐进。脚踏实地，不可急于求成。', number: 53, lines: ['鸿渐于干，小子厉，有言，无咎。', '鸿渐于磐，饮食衎衎，吉。', '鸿渐于陆，夫征不复，妇孕不育，凶；利御寇。', '鸿渐于木，或得其桷，无咎。', '鸿渐于陵，妇三岁不孕，终莫之胜，吉。', '鸿渐于陆，其羽可用为仪，吉。'] },
  '110100': { name: '归妹', pinyin: 'Guī Mèi', symbol: '䷵', judgement: '征凶，无攸利。', meaning: '雷泽归妹。不正位。情感不切实际，需慎防名实不符。', number: 54, lines: ['归妹以娣，跛能履，征吉。', '眇能视，利幽人之贞。', '归妹以须，反归以娣。', '归妹愆期，迟归有时。', '帝乙归妹，其君之袂，不如其娣之袂良。月几望，吉。', '女承筐无实，士刲羊无血，无攸利。'] },
  '101100': { name: '丰', pinyin: 'Fēng', symbol: '䷶', judgement: '亨。王假之，勿忧。', meaning: '雷火丰。盛大、丰收。日中则斜，宜持满而不溢。', number: 55, lines: ['遇其配主，虽旬无咎，往有尚。', '丰其蔀，日中见斗，往得疑疾。有孚发若，吉。', '丰其沛，日中见沫，折其右肱，无咎。', '丰其蔀，日中见斗，遇其夷主，吉。', '来章，有庆誉，吉。', '丰其屋，蔀其家，窥其户，阒其无人，三岁不觌，凶。'] },
  '001101': { name: '旅', pinyin: 'Lǚ', symbol: '䷷', judgement: '小亨，旅贞吉。', meaning: '火山旅。飘零、旅行。寄人篱下，宜求小而避大。', number: 56, lines: ['旅琐琐，斯其所取灾。', '旅即次，怀其资，得童仆贞。', '旅焚其次，丧其童仆，贞厉。', '旅于处，得其资斧，我心不快。', '射雉一矢亡，终以誉命。', '鸟焚其巢，旅人先笑后号咷。丧牛于易，凶。'] }, // Fixed binary
  '011011': { name: '巽', pinyin: 'Xùn', symbol: '䷸', judgement: '小亨。利有攸往。', meaning: '巽上巽下。入、顺、风。谦逊柔顺，事多繁难但通达。', number: 57, lines: ['进退，利武人之贞。', '巽在床下，用史巫纷若，吉无咎。', '频巽，吝。', '悔亡，田获三品。', '贞吉悔亡，无不利。无初有终，先庚三日，后庚三日，吉。', '巽在床下，丧其资斧，贞凶。'] },
  '110110': { name: '兑', pinyin: 'Duì', symbol: '䷹', judgement: '亨。利贞。', meaning: '兑上兑下。喜悦、谈。外柔内刚，与人沟通。', number: 58, lines: ['和兑，吉。', '孚兑，吉，悔亡。', '来兑，凶。', '商兑，未宁，介疾有喜。', '孚于剥，有厉。', '引兑。'] },
  '010011': { name: '涣', pinyin: 'Huàn', symbol: '䷺', judgement: '亨。王假有庙。', meaning: '风水涣。涣散、开解。挽救散乱，建立凝聚力。', number: 59, lines: ['用拯马壮，吉。', '涣奔其机，悔亡。', '涣其躬，无悔。', '涣其群，元吉。涣有丘，匪夷所思。', '涣汗其大号，涣王居，无咎。', '涣其血，去逖出，无咎。'] }, // Fixed binary
  '110010': { name: '节', pinyin: 'Jié', symbol: '䷻', judgement: '亨。苦节不可贞。', meaning: '水泽节。节制。宜适度，不可过分严苛。', number: 60, lines: ['不出户庭，无咎。', '不出门庭，凶。', '不节若，则嗟若，无咎。', '安节，亨。', '甘节，吉，往有尚。', '苦节，贞凶，悔亡。'] }, // Fixed binary
  '110011': { name: '中孚', pinyin: 'Zhōng Fú', symbol: '䷼', judgement: '豚鱼吉。利涉大川。', meaning: '风泽中孚。诚信。内中赤诚，能感化万物。', number: 61, lines: ['虞吉，有它不燕。', '鸣鹤在阴，其子和之；我有好爵，吾与尔靡之。', '得敌，或鼓或罢，或泣或歌。', '月几望，马匹亡，无咎。', '有孚挛如，无咎。', '翰音登于天，贞凶。'] },
  '001100': { name: '小过', pinyin: 'Xiǎo Guò', symbol: '䷽', judgement: '亨利贞。', meaning: '雷山小过。稍微过度。小事可行，大事不宜，宜守本分。', number: 62, lines: ['飞鸟以凶。', '过其祖，遇其妣；不及其君，遇其臣；无咎。', '弗过防之，从或戕之，凶。', '无咎，弗过遇之。往厉必戒，勿用永贞。', '密云不雨，自我西郊，公弋取彼在穴。', '弗遇过之，飞鸟离之，凶，是谓灾眚。'] },
  '101010': { name: '既济', pinyin: 'Jì Jì', symbol: '䷾', judgement: '亨小，利贞。', meaning: '水火既济。大功告成。初始吉利，需防终而乱。', number: 63, lines: ['曳其轮，濡其尾，无咎。', '妇丧其茀，勿逐，七日得。', '高宗伐鬼方，三年克之，小人勿用。', '繻有衣袽，终日戒。', '东邻杀牛，不如西邻之禴祭，实受其福。', '濡其首，厉。'] },
  '010101': { name: '未济', pinyin: 'Wèi Jì', symbol: '䷿', judgement: '亨。小狐汔济。', meaning: '火水未济。尚未成功。黎明前最黑暗，宜努力坚持。', number: 64, lines: ['濡其尾，吝。', '曳其轮，贞吉。', '未济，征凶，利涉大川。', '贞吉，悔亡，震用伐鬼方，三年有赏于大国。', '贞吉，无悔，君子之光，有孚吉。', '有孚于饮酒，无咎，濡其首，有孚失是。'] },
};

export const GET_HEX_BY_BINARY = (bin: string): Hexagram => {
  const data = HEXAGRAMS_DATA[bin];
  if (!data) {
    return {
      id: bin, name: '未名卦', pinyin: '', symbol: '䷏', binary: bin, judgement: '古籍不详', meaning: '未知之象', number: 0
    };
  }
  return {
    ...data,
    id: bin,
    binary: bin,
  } as Hexagram;
};

export const getMutualHexagram = (bin: string): string => {
  // Mutual Hexagram (Hu Gua) consists of lines 2, 3, 4 and lines 3, 4, 5
  // bin is indexed 0 to 5 (bottom to top)
  const lines = bin.split('');
  const bottom = lines[1] + lines[2] + lines[3];
  const top = lines[2] + lines[3] + lines[4];
  return bottom + top;
};

export const getChangedHexagram = (bin: string, movingIndexes: number[]): string => {
  const lines = bin.split('');
  movingIndexes.forEach(idx => {
    lines[idx] = lines[idx] === '1' ? '0' : '1';
  });
  return lines.join('');
};

export const getOppositeHexagram = (bin: string): string => {
  return bin.split('').map(b => (b === '1' ? '0' : '1')).join('');
};

export const getInverseHexagram = (bin: string): string => {
  return bin.split('').reverse().join('');
};

export const getTiYong = (bin: string, movingLineIdx: number | null): { ti: string, yong: string, tiElement: string, yongElement: string, relative: string, relation: string, description: string } => {
  if (movingLineIdx === null) return { ti: '无', yong: '无', tiElement: '无', yongElement: '无', relative: '无', relation: '无动爻', description: '无动爻不分体用' };
  
  const bottom = bin.slice(0, 3);
  const top = bin.slice(3, 6);
  
  const isTopYong = movingLineIdx >= 3;
  const tiBin = isTopYong ? bottom : top;
  const yongBin = isTopYong ? top : bottom;
  
  const ti = TRIGRAMS[tiBin];
  const yong = TRIGRAMS[yongBin];
  
  const relationMap: Record<string, Record<string, { label: string, relative: string, desc: string }>> = {
    '金': { 
      '金': { label: '比和 (吉)', relative: '兄弟', desc: '金见金，同气相求，协力齐心。' }, 
      '木': { label: '体克用 (小吉)', relative: '妻财', desc: '金克木，我克者为财，事虽繁杂但可掌控。' }, 
      '水': { label: '体生用 (中吉)', relative: '子孙', desc: '金生水，我生者为泄，当下虽有损耗，长远有利。' }, 
      '火': { label: '用克体 (凶)', relative: '官鬼', desc: '火克金，受外部环境压制，宜退避守正。' }, 
      '土': { label: '用生体 (大吉)', relative: '父母', desc: '土生金，得外部相助或贵人提携。' } 
    },
    '木': { 
      '金': { label: '用克体 (凶)', relative: '官鬼', desc: '金克木，外部压力巨大，恐有损折。' }, 
      '木': { label: '比和 (吉)', relative: '兄弟', desc: '木见木，势头强劲，宜积极进取。' }, 
      '水': { label: '用生体 (大吉)', relative: '父母', desc: '水生木，如鱼得水，事半功倍。' }, 
      '火': { label: '体生用 (中吉)', relative: '子孙', desc: '木生火，才华得以施展，但需防精力过度。' }, 
      '土': { label: '体克用 (小吉)', relative: '妻财', desc: '木克土，虽然劳碌，但能收获成果。' } 
    },
    '水': { 
      '金': { label: '用生体 (大吉)', relative: '父母', desc: '金生水，源头充沛，运势极佳。' }, 
      '木': { label: '体生用 (中吉)', relative: '子孙', desc: '水生木，滋润万物，付出总有回报。' }, 
      '水': { label: '比和 (吉)', relative: '兄弟', desc: '水见水，奔流不息，顺势而为。' }, 
      '火': { label: '体克用 (小吉)', relative: '妻财', desc: '水克火，虽有挑战但胜算在握。' }, 
      '土': { label: '用克体 (凶)', relative: '官鬼', desc: '土克水，被束缚或阻碍，宜静待时机。' } 
    },
    '火': { 
      '金': { label: '体克用 (小吉)', relative: '妻财', desc: '火克金，磨砺而出，奋斗可得成就。' }, 
      '木': { label: '用生体 (大吉)', relative: '父母', desc: '木生火，得时得助，光明正大。' }, 
      '水': { label: '用克体 (凶)', relative: '官鬼', desc: '水克火，受环境克制，需防突发变故。' }, 
      '火': { label: '比和 (吉)', relative: '兄弟', desc: '火见火，光辉灿烂，前途明亮。' }, 
      '土': { label: '体生用 (中吉)', relative: '子孙', desc: '火生土，化育之象，利于稳健经营。' } 
    },
    '土': { 
      '金': { label: '体生用 (中吉)', relative: '子孙', desc: '土生金，孕育财富或提拔后辈。' }, 
      '木': { label: '用克体 (凶)', relative: '官鬼', desc: '木克土，根基受损，需防内部变动。' }, 
      '水': { label: '体克用 (小吉)', relative: '妻财', desc: '土克水，有能力统筹局面，稳扎稳打。' }, 
      '火': { label: '用生体 (大吉)', relative: '父母', desc: '火生土，得长辈或上级大力支持。' }, 
      '土': { label: '比和 (吉)', relative: '兄弟', desc: '土见土，厚实稳重，利于守成。' } 
    },
  };
  
  const rel = relationMap[ti.element]?.[yong.element] || { label: '平平', relative: '比和', desc: '五行气息平和。' };
  
  return {
    ti: ti.name,
    yong: yong.name,
    tiElement: ti.element,
    yongElement: yong.element,
    relative: rel.relative,
    relation: rel.label,
    description: rel.desc
  };
};
