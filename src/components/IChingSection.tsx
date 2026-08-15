import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Hash, Clock, Sparkles, Loader2, RefreshCw, Send, MessageSquare, BookOpen, Info, History, ArrowRight } from 'lucide-react';
import { interpretMetaphysics, AIConfig, QUESTION_CATEGORIES, ChatMessage } from '../services/aiService';
import { GET_HEX_BY_BINARY, Hexagram, getMutualHexagram, getTiYong, HEXAGRAMS_DATA, getLineDetails, LineDetail, getOppositeHexagram, getInverseHexagram } from '../lib/iching-data';
import { Lunar } from 'lunar-javascript';
import { HeTu, Luoshu, BaguaCircle } from './CosmologyVisuals';

type Line = {
  value: number; // 6, 7, 8, 9
  isMoving: boolean;
  type: 'yang' | 'yin';
};

type DivinationHistoryItem = {
  id: string;
  timestamp: number;
  question: string;
  category: string;
  lines: Line[];
  hexagram: { 
    original: Hexagram; 
    changed?: Hexagram;
    mutual: Hexagram;
    opposite?: Hexagram;
    inverse?: Hexagram;
    tiYong: { ti: string, yong: string, tiElement: string, yongElement: string, relative: string, relation: string, description: string }
  };
};

const MiniHexagram = ({ binary, color = '#2a2622' }: { binary: string, color?: string }) => {
  return (
    <div className="flex flex-col-reverse gap-[2px] w-8">
      {binary.split('').map((bit, i) => (
        <div key={i} className="h-0.5 flex justify-between w-full">
          {bit === '1' ? (
            <div className="w-full h-full opacity-80" style={{ backgroundColor: color }} />
          ) : (
            <>
              <div className="w-[42%] h-full opacity-80" style={{ backgroundColor: color }} />
              <div className="w-[42%] h-full opacity-80" style={{ backgroundColor: color }} />
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default function IChingSection({ aiConfig }: { aiConfig: AIConfig }) {
  const [method, setMethod] = useState<'coin' | 'number' | 'time' | 'manual'>('coin');
  const [lines, setLines] = useState<Line[]>([]);
  const [numInputs, setNumInputs] = useState({ n1: '', n2: '', n3: '' });
  const [timeInfo, setTimeInfo] = useState('');
  const [status, setStatus] = useState<'idle' | 'tossing' | 'calculating' | 'finished'>('idle');
  const [view, setView] = useState<'divination' | 'theory' | 'history'>('divination');
  const [theoryTab, setTheoryTab] = useState<'hetu' | 'luoshu' | 'bagua' | 'hexagrams'>('bagua');
  const [selectedGalleryHex, setSelectedGalleryHex] = useState<Hexagram | null>(null);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);
  const [selectedLineIdx, setSelectedLineIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<DivinationHistoryItem[]>([]);
  
  const [hexagram, setHexagram] = useState<{ 
    original: Hexagram; 
    changed?: Hexagram;
    mutual: Hexagram;
    opposite: Hexagram;
    inverse: Hexagram;
    tiYong: { ti: string, yong: string, tiElement: string, yongElement: string, relative: string, relation: string, description: string }
  } | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [customQuestion, setCustomQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [followUp, setFollowUp] = useState('');

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('iching_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
  }, []);

  const saveToHistory = (item: DivinationHistoryItem) => {
    const newHistory = [item, ...history].slice(0, 50); // Keep last 50
    setHistory(newHistory);
    localStorage.setItem('iching_history', JSON.stringify(newHistory));
  };

  const loadFromHistory = (item: DivinationHistoryItem) => {
    setLines(item.lines);
    
    // Fallback for legacy history items missing opposite/inverse
    const hex = { ...item.hexagram };
    if (!hex.opposite || !hex.inverse) {
      const bin = item.lines.map(l => (l.type === 'yang' ? '1' : '0')).join('');
      hex.opposite = hex.opposite || GET_HEX_BY_BINARY(getOppositeHexagram(bin));
      hex.inverse = hex.inverse || GET_HEX_BY_BINARY(getInverseHexagram(bin));
    }
    
    setHexagram(hex as any);
    setSelectedCategory(item.category);
    setCustomQuestion(item.question);
    setChatHistory([]);
    setView('divination');
    setStatus('finished');
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('iching_history');
  };

  const tossCoins = async () => {
    if (lines.length >= 6) return;
    setStatus('tossing');
    await new Promise(r => setTimeout(r, 600));

    const c1 = Math.random() > 0.5 ? 3 : 2;
    const c2 = Math.random() > 0.5 ? 3 : 2;
    const c3 = Math.random() > 0.5 ? 3 : 2;
    const sum = c1 + c2 + c3;

    const newLine: Line = {
      value: sum,
      isMoving: sum === 6 || sum === 9,
      type: (sum === 7 || sum === 9) ? 'yang' : 'yin'
    };

    const newLines = [...lines, newLine];
    setLines(newLines);
    setStatus('idle');

    if (newLines.length === 6) {
      calculateResult(newLines);
    }
  };

  const handleNumberDivination = () => {
    // Sanitize: accept only finite positive integers (rejects negative/zero/NaN)
    const raw = [numInputs.n1, numInputs.n2, numInputs.n3];
    const parsed = raw.map(v => {
      const n = Math.abs(parseInt(v.trim(), 10));
      return Number.isFinite(n) && n > 0 ? n : 0;
    });
    const [n1, n2, n3] = parsed;
    
    if (!n1 || !n2 || !n3) return;

    setStatus('calculating');
    
    // Traditional Calculation: 
    // Upper = n1 % 8 (if 0, use 8)
    // Lower = n2 % 8 (if 0, use 8)
    // Moving = n3 % 6 (if 0, use 6)
    
    const upperIdx = (n1 % 8) || 8;
    const lowerIdx = (n2 % 8) || 8;
    const movingLinePos = (n3 % 6) || 6; // 1-indexed from bottom

    // Trigram binary (Bottom to top mapping) — 先天八卦数序：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8
    const trigramMap: Record<number, string> = {
      1: '111', // Qian 乾
      2: '011', // Dui 兑
      3: '101', // Li 离
      4: '100', // Zhen 震
      5: '110', // Xun 巽
      6: '010', // Kan 坎
      7: '001', // Gen 艮
      8: '000', // Kun 坤
    };

    const lowerBin = trigramMap[lowerIdx];
    const upperBin = trigramMap[upperIdx];
    if (!lowerBin || !upperBin) return;
    const fullBinary = lowerBin + upperBin;

    const newLines: Line[] = fullBinary.split('').map((char, i) => ({
      value: char === '1' ? 7 : 8,
      type: char === '1' ? 'yang' : 'yin',
      isMoving: (i + 1) === movingLinePos
    }));

    setLines(newLines);
    calculateResult(newLines);
  };

  const handleTimeDivination = () => {
    const now = new Date();
    const lunar = Lunar.fromDate(now);

    // 梅花易数「年月日时」起卦（古法）：
    // 年数 = 农历年地支序数（子=1 … 亥=12）；月数 = 农历月（闰月取同序数）；
    // 日数 = 农历日；时数 = 时辰序数（子时=1 … 亥时=12）。
    // 上卦 = (年+月+日) mod 8（0 取 8）；下卦 = (年+月+日+时) mod 8；动爻 = (年+月+日+时) mod 6（0 取 6）。
    const yearNum = lunar.getYearZhiIndex() + 1;
    const monthNum = Math.abs(lunar.getMonth());
    const dayNum = lunar.getDay();
    const timeNum = lunar.getTimeZhiIndex() + 1;

    const n1 = yearNum + monthNum + dayNum; // 上卦数（万物）
    const n2 = n1 + timeNum;                // 下卦数（地理）
    const n3 = n2;                          // 动爻数（人机）

    setNumInputs({ n1: n1.toString(), n2: n2.toString(), n3: n3.toString() });
    setTimeInfo(
      `农历${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}日 ${lunar.getTimeZhi()}时 · ` +
      `年${yearNum}+月${monthNum}+日${dayNum}=${n1}，加时${timeNum}=${n2}`
    );

    const upperIdx = (n1 % 8) || 8;
    const lowerIdx = (n2 % 8) || 8;
    const movingLinePos = (n3 % 6) || 6;

    const trigramMap: Record<number, string> = {
      1: '111', 2: '011', 3: '101', 4: '100',
      5: '110', 6: '010', 7: '001', 8: '000',
    };

    const lowerBin = trigramMap[lowerIdx];
    const upperBin = trigramMap[upperIdx];
    if (!lowerBin || !upperBin) return;
    const fullBinary = lowerBin + upperBin;

    const newLines: Line[] = fullBinary.split('').map((char, i) => ({
      value: char === '1' ? 7 : 8,
      type: char === '1' ? 'yang' : 'yin',
      isMoving: (i + 1) === movingLinePos
    }));

    setLines(newLines);
    calculateResult(newLines);
  };

  const toggleManualLine = (idx: number) => {
    const newLines = [...lines];
    if (newLines[idx]) {
      newLines[idx].type = newLines[idx].type === 'yang' ? 'yin' : 'yang';
    } else {
      // Fill gaps if any
      for (let i = 0; i < 6; i++) {
        if (!newLines[i]) {
          newLines[i] = { value: 7, type: 'yang', isMoving: false };
        }
      }
      newLines[idx].type = newLines[idx].type === 'yang' ? 'yin' : 'yang';
    }
    setLines(newLines);
    if (newLines.length === 6) calculateResult(newLines);
  };

  const toggleMovingLine = (idx: number) => {
    const newLines = [...lines];
    if (newLines[idx]) {
      newLines[idx].isMoving = !newLines[idx].isMoving;
      setLines(newLines);
      calculateResult(newLines);
    }
  };

  const calculateResult = (finalLines: Line[]) => {
    setStatus('calculating');
    const originalBinary = finalLines.map(l => (l.type === 'yang' ? '1' : '0')).join('');
    const originalHex = GET_HEX_BY_BINARY(originalBinary);

    // Mutual
    const mutualBin = getMutualHexagram(originalBinary);
    const mutualHex = GET_HEX_BY_BINARY(mutualBin);

    // Opposite (Cuo)
    const oppositeBin = getOppositeHexagram(originalBinary);
    const oppositeHex = GET_HEX_BY_BINARY(oppositeBin);

    // Inverse (Zong)
    const inverseBin = getInverseHexagram(originalBinary);
    const inverseHex = GET_HEX_BY_BINARY(inverseBin);

    // Ti-Yong
    const movingLineIdx = finalLines.findIndex(l => l.isMoving);
    const tiYong = getTiYong(originalBinary, movingLineIdx === -1 ? null : movingLineIdx);

    let changedHex: Hexagram | undefined;
    if (finalLines.some(l => l.isMoving)) {
      const changedBinary = finalLines.map(l => {
        if (!l.isMoving) return l.type === 'yang' ? '1' : '0';
        return l.type === 'yang' ? '0' : '1';
      }).join('');
      changedHex = GET_HEX_BY_BINARY(changedBinary);
    }

    const res = { 
      original: originalHex, 
      changed: changedHex,
      mutual: mutualHex,
      opposite: oppositeHex,
      inverse: inverseHex,
      tiYong
    };
    
    setHexagram(res);
    setStatus('finished');

    // Save to history
    saveToHistory({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      question: customQuestion,
      category: selectedCategory,
      lines: finalLines,
      hexagram: res
    });
  };

  const handleAIInterpret = async () => {
    if (!hexagram) return;
    setAiLoading(true);
    const categoryLabel = QUESTION_CATEGORIES.find(c => c.id === selectedCategory)?.label || '综合';
    const movingLines = lines.map((l, i) => {
      if (l.isMoving && hexagram.original.lines) {
        return {
          pos: ['初', '二', '三', '四', '五', '上'][i],
          text: hexagram.original.lines[i]
        };
      }
      return null;
    }).filter(Boolean);

    const initialPrompt = `起卦结果：
    【本卦】：${hexagram.original.name}（${hexagram.original.binary}） - ${hexagram.original.meaning}
    【互卦】：${hexagram.mutual.name} - ${hexagram.mutual.meaning}
    【错卦】：${hexagram.opposite.name} - ${hexagram.opposite.meaning}
    【综卦】：${hexagram.inverse.name} - ${hexagram.inverse.meaning}
    ${hexagram.changed ? `【变卦】：${hexagram.changed.name} - ${hexagram.changed.meaning}` : '【变卦】：无变爻'}
    【体用六亲】：体卦-${hexagram.tiYong.ti}（${hexagram.tiYong.tiElement}），用卦-${hexagram.tiYong.yong}（${hexagram.tiYong.yongElement}），体用关系：${hexagram.tiYong.relation}，六亲对应：${hexagram.tiYong.relative}
    【卦辞义理】：${hexagram.tiYong.description}
    【动爻及爻辞】：
    ${movingLines.length > 0 
      ? movingLines.map(ml => `${ml?.pos}爻：${ml?.text}`).join('\n    ') 
      : '无动爻，以本卦卦辞为主'}
      
    【用户需求】：
    咨询范畴：${categoryLabel}
    具体事由：${customQuestion || '未提供具体事由，请进行一般性占断'}
    
    【解读指令】：
    请作为易学大师，结合以上卦象、体用、动爻及爻辞进行“天道神谕”解读。要求：
    1. 哲学深层解析：分析卦象背后蕴含的阴阳消长逻辑、时位关系及其反映的本质规律。
    2. 深度占断分析：针对用户咨询的范畴（${categoryLabel}），分析当前的处境、阻力与机遇。
    3. 现实生活建议：给出具体、可操作的现实建议，涵盖“退守”或“进取”的时机把控。
    
    语言风格：古雅庄重且不失通俗易懂，字数要求300-500字左右。`;
    
    try {
      const analysis = await interpretMetaphysics(initialPrompt, aiConfig);
      if (analysis) {
        setChatHistory([
          { role: 'user', content: customQuestion || `请就${categoryLabel}进行起卦分析` },
          { role: 'assistant', content: analysis }
        ]);
      } else {
        setChatHistory([{ role: 'assistant', content: '无法连接神谕，请查看下方基础卦解。' }]);
      }
    } catch (error: any) {
      setChatHistory([{ role: 'assistant', content: `神谕连接异常: ${error.message || '未知错误'}` }]);
    }
    setAiLoading(false);
  };

  const handleFollowUp = async () => {
    if (!followUp.trim() || aiLoading) return;
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: followUp }];
    setAiLoading(true);
    setFollowUp('');
    try {
      const response = await interpretMetaphysics(newHistory, aiConfig);
      if (response) {
        setChatHistory([...newHistory, { role: 'assistant', content: response }]);
      }
    } catch (error: any) {
      setChatHistory([...newHistory, { role: 'assistant', content: `神谕后续连接异常: ${error.message || '未知错误'}` }]);
    }
    setAiLoading(false);
  };

  const reset = () => {
    setLines([]);
    setHexagram(null);
    setChatHistory([]);
    setStatus('idle');
    setTimeInfo('');
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={() => setView('divination')}
          className={`px-6 py-2.5 text-xs tracking-widest border transition-all ${view === 'divination' ? 'bg-ink-black text-white border-ink-black shadow-lg' : 'bg-white/80 border-ink-black/40 text-ink-black/85 shadow-sm hover:border-ink-black/70 hover:text-ink-black'}`}
        >
          起卦占算
        </button>
        <button 
          onClick={() => setView('theory')}
          className={`px-6 py-2.5 text-xs tracking-widest border transition-all ${view === 'theory' ? 'bg-ink-black text-white border-ink-black shadow-lg' : 'bg-white/80 border-ink-black/40 text-ink-black/85 shadow-sm hover:border-ink-black/70 hover:text-ink-black'}`}
        >
          易理图解
        </button>
        <button 
          onClick={() => setView('history')}
          className={`px-6 py-2.5 text-xs tracking-widest border transition-all flex items-center gap-2 ${view === 'history' ? 'bg-ink-black text-white border-ink-black shadow-lg' : 'bg-white/80 border-ink-black/40 text-ink-black/85 shadow-sm hover:border-ink-black/70 hover:text-ink-black'}`}
        >
          <History className="w-3 h-3" />
          历次占算
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'divination' ? (
          <motion.div 
            key="divination" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="grid md:grid-cols-12 gap-8 items-start"
          >
            {/* Interaction Side */}
            <section className="md:col-span-4 space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] border border-ink-black/40 px-2 py-0.5 whitespace-nowrap">起卦法门</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-ink-black/40 to-transparent"></div>
              </div>

              <div className="scroll-surface p-6 space-y-6">
                <div>
                  <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 block mb-3 font-bold">咨询范畴</label>
                  <div className="grid grid-cols-3 gap-1">
                    {QUESTION_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-1 py-2 border text-[9px] tracking-tighter transition-all flex items-center gap-1 overflow-hidden whitespace-nowrap ${selectedCategory === cat.id ? 'bg-ink-black/10 border-ink-black text-ink-black font-bold' : 'border-ink-black/20 text-ink-black/65 hover:border-ink-black/40 hover:text-ink-black'}`}
                      >
                        {cat.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 block mb-2 font-bold">心中所求</label>
                  <textarea
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="请输入您求签的具体事由..."
                    className="w-full bg-ink-black/5 border border-ink-black/10 p-3 text-[10px] text-ink-black focus:outline-none focus:border-ink-black/30 h-20 resize-none placeholder:opacity-20"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  {(['coin', 'number', 'time', 'manual'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => { setMethod(m); reset(); }}
                      className={`w-full px-4 py-3 border text-[10px] tracking-widest uppercase transition-all flex items-center justify-between ${method === m ? 'bg-ink-black text-white border-ink-black font-bold shadow-md' : 'border-ink-black/25 text-ink-black/80 hover:border-ink-black/50'}`}
                    >
                      <span className="flex items-center gap-2">
                        {m === 'coin' && <Coins className="w-3 h-3" />}
                        {m === 'number' && <Hash className="w-3 h-3" />}
                        {m === 'time' && <Clock className="w-3 h-3" />}
                        {m === 'manual' && <RefreshCw className="w-3 h-3" />}
                        {m === 'coin' ? '金钱卦' : m === 'number' ? '数字卦' : m === 'time' ? '时间卦' : '自选卦'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="scroll-surface border border-ink-black/10 p-8 flex flex-col items-center justify-center space-y-8 min-h-[300px] relative overflow-hidden">
                <div className="lattice-corner lattice-tl scale-75 opacity-10" />
                <div className="lattice-corner lattice-br scale-75 opacity-10" />
                
                {method === 'coin' && (
                  <div className="relative z-10 space-y-12 flex flex-col items-center">
                    <div className="flex gap-6 justify-center">
                      {[1, 2, 3].map(i => (
                        <motion.div
                          key={i}
                          animate={status === 'tossing' ? { 
                            rotateY: [0, 180, 360, 540, 720],
                            y: [0, -60, 0],
                            rotateZ: [0, 15, -15, 0]
                          } : {}}
                          transition={{ duration: 0.6, repeat: status === 'tossing' ? Infinity : 0 }}
                          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] via-[#f2e9d9] to-[#8a8a8a] border-[3px] border-ink-black/10 flex items-center justify-center shadow-2xl relative overflow-hidden"
                        >
                          <div className="absolute inset-2 border border-ink-black/5 rounded-full" />
                          <span className="text-ink-black/80 font-brush text-2xl relative z-10">通</span>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="text-center space-y-6">
                      <p className="text-[11px] opacity-50 uppercase tracking-[0.4em] font-bold">
                        {lines.length < 6 ? `当前位：${['初象', '二象', '三象', '四象', '五象', '上象'][lines.length]}` : '大成卦已成'}
                      </p>
                      <button
                        onClick={tossCoins}
                        disabled={lines.length >= 6 || status === 'tossing'}
                        className="px-12 py-4 bg-ink-black text-white text-[11px] tracking-[0.4em] font-bold uppercase hover:bg-imperial-red transition-all disabled:opacity-20 shadow-2xl rounded-sm group relative overflow-hidden"
                      >
                        <span className="relative z-10">{status === 'tossing' ? '演化中...' : lines.length >= 6 ? '起卦完毕' : '掷钱起卦'}</span>
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}

                {method === 'number' && (
                  <div className="relative z-10 space-y-6 w-full">
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-1">
                          <label className="text-[9px] opacity-40 uppercase tracking-widest block font-bold">
                            {i === 1 ? '上卦数 (万物)' : i === 2 ? '下卦数 (地理)' : '对应神数 (人机)'}
                          </label>
                          <input
                            type="number"
                            value={numInputs[`n${i}` as keyof typeof numInputs]}
                            onChange={(e) => setNumInputs({ ...numInputs, [`n${i}`]: e.target.value })}
                            placeholder="输入任意正整数"
                            className="w-full bg-ink-black/5 border border-ink-black/10 p-3 text-xs focus:outline-none focus:border-imperial-red transition-all"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleNumberDivination}
                      className="w-full py-4 bg-ink-black text-white text-[11px] tracking-[0.3em] font-bold uppercase hover:bg-imperial-red transition-all shadow-xl"
                    >
                      确认启卦
                    </button>
                  </div>
                )}

                {method === 'time' && (
                  <div className="relative z-10 text-center space-y-8">
                    <div className="space-y-2">
                       <Clock className="w-12 h-12 mx-auto text-ink-black opacity-20" />
                       <div className="text-[10px] italic opacity-40 leading-relaxed font-serif-sc">
                          以当前天时演化卦象<br/>感应宇宙此时此刻之波动
                       </div>
                       {timeInfo && (
                         <div className="mx-auto max-w-[260px] p-3 bg-ink-black/[0.03] border border-imperial-red/10 text-[9px] leading-relaxed text-ink-black/60 font-serif-sc">
                           {timeInfo}
                         </div>
                       )}
                    </div>
                    <button
                      onClick={handleTimeDivination}
                      className="px-12 py-4 bg-ink-black text-white text-[11px] tracking-[0.4em] font-bold uppercase hover:bg-imperial-red transition-all shadow-2xl"
                    >
                      捕捉天时
                    </button>
                  </div>
                )}

                {method === 'manual' && (
                  <div className="relative z-10 text-center space-y-6">
                    <p className="text-[10px] opacity-40 italic font-serif-sc">
                      点击右侧卦线切换阴阳<br/>手动构建心中所属之卦
                    </p>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => {
                          const initialLines = Array(6).fill(null).map(() => ({ value: 7, type: 'yang', isMoving: false }));
                          setLines(initialLines as any);
                          calculateResult(initialLines as any);
                        }}
                        className="text-[9px] px-3 py-1 border border-ink-black/20 hover:border-imperial-red transition-all uppercase tracking-widest"
                      >
                         初始化
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Visual Side */}
            <section className="md:col-span-8 flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[10px] border border-ink-black/40 px-2 py-0.5 whitespace-nowrap">卦象演化</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-ink-black/40 to-transparent"></div>
              </div>

              <div className="flex-1 scroll-surface border border-ink-black/10 p-8 flex flex-col items-center relative overflow-hidden">
                <div className="lattice-corner lattice-tl" />
                <div className="lattice-corner lattice-tr" />
                <div className="lattice-corner lattice-bl" />
                <div className="lattice-corner lattice-br" />
                
                <div className="brush-accent absolute left-4 bottom-4 text-8xl opacity-10">易</div>
                
                <div className="w-full flex justify-between items-start mb-12 relative z-10">
                   {hexagram ? (
                     <>
                       <div className="space-y-1">
                          <div className="text-4xl tracking-widest font-calligraphy text-ink-black">{hexagram.original.name}卦</div>
                          <div className="text-[10px] opacity-40 uppercase tracking-widest font-bold">序位：{hexagram.original.number} | 音：{hexagram.original.pinyin}</div>
                       </div>
                       <div className="text-right">
                          <div className="text-xs text-ink-black font-bold mb-1">本卦</div>
                          <div className="text-[10px] opacity-60 italic max-w-[200px] leading-relaxed">{hexagram.original.judgement}</div>
                       </div>
                     </>
                   ) : (
                     <div className="w-full text-center py-12 opacity-30 text-xs tracking-[0.3em] uppercase italic">祈请天地之机，方见卦象...</div>
                   )}
                </div>

                {/* Hexagram Representation */}
                <div className="flex flex-col-reverse gap-4 my-8 relative z-10">
                   {[0,1,2,3,4,5].map(i => {
                      const line = lines[i];
                      return (
                        <div key={i} className="relative h-2.5 w-56 transition-all group">
                          {line ? (
                            <motion.div 
                              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                              className={`flex justify-between w-full h-full cursor-pointer transition-transform ${method === 'manual' ? 'hover:scale-y-150' : 'hover:scale-y-110'}`}
                              onClick={() => {
                                if (method === 'manual') {
                                  toggleManualLine(i);
                                } else {
                                  setActiveLineIdx(activeLineIdx === i ? null : i);
                                }
                              }}
                            >
                               {line.type === 'yang' ? (
                                 <div className={`w-full h-full ${line.isMoving ? 'bg-imperial-red shadow-[0_0_15px_rgba(139,28,28,0.2)]' : 'bg-ink-black/80'}`} />
                               ) : (
                                 <>
                                  <div className={`w-[45%] h-full ${line.isMoving ? 'bg-imperial-red shadow-[0_0_15px_rgba(139,28,28,0.2)]' : 'bg-ink-black/80'}`} />
                                  <div className={`w-[45%] h-full ${line.isMoving ? 'bg-imperial-red shadow-[0_0_15px_rgba(139,28,28,0.2)]' : 'bg-ink-black/80'}`} />
                                 </>
                               )}
                               
                               <button 
                                 onClick={(e) => { e.stopPropagation(); toggleMovingLine(i); }}
                                 className={`absolute -right-8 transition-all ${line.isMoving ? 'text-imperial-red scale-110 opacity-100' : 'text-ink-black/10 opacity-0 group-hover:opacity-40'} text-sm font-bold`}
                               >
                                 {line.isMoving ? '变' : '动'}
                               </button>

                               {activeLineIdx === i && hexagram?.original?.lines?.[i] && (
                                 <motion.div 
                                   initial={{ opacity: 0, y: -8 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 bg-white/95 backdrop-blur-sm border border-imperial-red/20 p-4 shadow-xl z-50 w-72 flex flex-col gap-3"
                                 >
                                    <div className="flex items-center justify-between border-b border-imperial-red/10 pb-1">
                                      <div className="text-[9px] uppercase tracking-widest text-imperial-red font-bold">
                                        {['初', '二', '三', '四', '五', '上'][i]}爻辞
                                      </div>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedLineIdx(i); }}
                                        className="text-[8px] px-1.5 py-0.5 border border-imperial-red/30 text-imperial-red hover:bg-imperial-red hover:text-white transition-all uppercase tracking-tighter font-bold"
                                      >
                                        阅读更多 READ MORE
                                      </button>
                                    </div>
                                    <p className="text-[11px] text-ink-black/70 leading-relaxed font-serif-sc italic">
                                      {hexagram.original.lines[i]}
                                    </p>
                                 </motion.div>
                               )}
                            </motion.div>
                          ) : (
                            <div 
                              className={`w-full h-[1px] bg-ink-black/10 mt-1 ${method === 'manual' ? 'cursor-pointer hover:bg-imperial-red/20' : ''}`}
                              onClick={() => method === 'manual' && toggleManualLine(i)}
                            />
                          )}
                        </div>
                      )
                   })}
                </div>

                <AnimatePresence>
                  {hexagram && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mt-8 w-full pt-8 border-t border-ink-black/5 space-y-4 relative z-10"
                    >
                      {/* Analysis Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-imperial-red/[0.02] border border-imperial-red/10 p-3 group hover:bg-imperial-red/[0.04] transition-all relative">
                           <div className="flex justify-between items-center mb-1">
                             <span className="text-[8px] uppercase tracking-widest opacity-40 font-bold">变卦 (Bian)</span>
                             <span className="text-[8px] border border-imperial-red/20 px-1 text-imperial-red">后期/结局</span>
                           </div>
                           <div className="flex items-end justify-between">
                             <span className="text-xl font-brush text-imperial-red">{hexagram.changed?.name || '无'}</span>
                             {hexagram.changed && <MiniHexagram binary={hexagram.changed.binary} color="#8b1c1c" />}
                           </div>
                           <p className="text-[8px] text-ink-black/40 mt-1 line-clamp-1">{hexagram.changed?.meaning || '保持现状'}</p>
                           
                           {/* Explanation Tooltip */}
                           <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col p-2 z-20 pointer-events-none">
                             <span className="text-[7px] text-imperial-red font-bold uppercase tracking-tighter mb-1">演化逻辑 DERIVATION</span>
                             <p className="text-[8px] text-ink-black/80 leading-tight">由本卦动爻(6/9)阴阳翻转产生。代表事物的发展、结果与终局。体用关系中，若变卦克体则终局不利。</p>
                           </div>
                        </div>

                        <div className="bg-ink-black/[0.02] border border-ink-black/5 p-3 group hover:bg-ink-black/[0.04] transition-all relative">
                           <div className="flex justify-between items-center mb-1">
                             <span className="text-[8px] uppercase tracking-widest opacity-40 font-bold">互卦 (Hu)</span>
                             <span className="text-[8px] border border-ink-black/10 px-1 text-ink-black/20">过程/隐机</span>
                           </div>
                           <div className="flex items-end justify-between">
                             <span className="text-xl font-brush text-ink-black">{hexagram.mutual.name}</span>
                             <MiniHexagram binary={hexagram.mutual.binary} />
                           </div>
                           <p className="text-[8px] text-ink-black/40 mt-1 line-clamp-1">{hexagram.mutual.meaning}</p>

                           <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col p-2 z-20 pointer-events-none">
                             <span className="text-[7px] text-ink-black/60 font-bold uppercase tracking-tighter mb-1">演化逻辑 DERIVATION</span>
                             <p className="text-[8px] text-ink-black/80 leading-tight">取本卦二三四爻为下，三四五爻为上。代表事物内在的复杂交互、中间过程或不为人知的隐忧。</p>
                           </div>
                        </div>

                        <div className="bg-ink-black/[0.02] border border-ink-black/5 p-3 group hover:bg-ink-black/[0.04] transition-all relative">
                           <div className="flex justify-between items-center mb-1">
                             <span className="text-[8px] uppercase tracking-widest opacity-40 font-bold">错卦 (Cuo)</span>
                             <span className="text-[8px] border border-ink-black/10 px-1 text-ink-black/20">对立/观察</span>
                           </div>
                           <div className="flex items-end justify-between">
                             <span className="text-xl font-brush text-ink-black">{hexagram.opposite?.name}</span>
                             {hexagram.opposite && <MiniHexagram binary={hexagram.opposite.binary} />}
                           </div>
                           <p className="text-[8px] text-ink-black/40 mt-1 line-clamp-1">{hexagram.opposite?.meaning}</p>

                           <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col p-2 z-20 pointer-events-none">
                             <span className="text-[7px] text-ink-black/60 font-bold uppercase tracking-tighter mb-1">演化逻辑 DERIVATION</span>
                             <p className="text-[8px] text-ink-black/80 leading-tight">将本卦六爻阴阳全反。从对立面观察，寻求“旁观者清”的平衡，揭示事物由于阴阳极致转化而呈现的另一种可能性。</p>
                           </div>
                        </div>

                        <div className="bg-ink-black/[0.02] border border-ink-black/5 p-3 group hover:bg-ink-black/[0.04] transition-all relative">
                           <div className="flex justify-between items-center mb-1">
                             <span className="text-[8px] uppercase tracking-widest opacity-40 font-bold">综卦 (Zong)</span>
                             <span className="text-[8px] border border-ink-black/10 px-1 text-ink-black/20">反向/立场</span>
                           </div>
                           <div className="flex items-end justify-between">
                             <span className="text-xl font-brush text-ink-black">{hexagram.inverse?.name}</span>
                             {hexagram.inverse && <MiniHexagram binary={hexagram.inverse.binary} />}
                           </div>
                           <p className="text-[8px] text-ink-black/40 mt-1 line-clamp-1">{hexagram.inverse?.meaning}</p>

                           <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col p-2 z-20 pointer-events-none">
                             <span className="text-[7px] text-ink-black/60 font-bold uppercase tracking-tighter mb-1">演化逻辑 DERIVATION</span>
                             <p className="text-[8px] text-ink-black/80 leading-tight">将本卦上下颠倒旋转。代表从对方的立场、相反的视角看待当前局势，反映事物作为命运共同体的一体两面。</p>
                           </div>
                        </div>
                      </div>

                        <div className="bg-white/60 border-2 border-ink-black/5 p-6 space-y-6 shadow-xl relative overflow-hidden">
                          <div className="lattice-corner lattice-tl opacity-5" />
                          <div className="lattice-corner lattice-tr opacity-5" />
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink-black/10 pb-4 gap-4">
                             <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                 <h3 className="text-sm font-bold tracking-widest uppercase text-ink-black/60">体用生克决</h3>
                                 <span className="text-[10px] font-bold text-imperial-red bg-imperial-red/5 px-2 py-0.5 border border-imperial-red/10 animate-pulse">
                                   〔 {hexagram.tiYong.relative} 〕
                                 </span>
                               </div>
                               <p className="text-[10px] text-ink-black/40 font-serif-sc italic">The Interaction of Essence and Application</p>
                             </div>
                             <div className="flex items-center gap-3">
                               <div className="text-right">
                                 <div className="text-[11px] font-bold text-imperial-red uppercase tracking-widest">{hexagram.tiYong.relation}</div>
                                 <div className="text-[9px] text-ink-black/30 font-medium">SHENG KE STATUS</div>
                               </div>
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                                 hexagram.tiYong.relation.includes('大吉') ? 'bg-orange-500' : 
                                 hexagram.tiYong.relation.includes('吉') ? 'bg-green-600' : 
                                 hexagram.tiYong.relation.includes('凶') ? 'bg-red-700' : 'bg-gray-500'
                               }`}>
                                 {hexagram.tiYong.relation.includes('吉') ? '祥' : hexagram.tiYong.relation.includes('凶') ? '煞' : '平'}
                               </div>
                             </div>
                          </div>
                          
                          <div className="flex items-center justify-between py-6 px-4 bg-ink-black/[0.02] border border-ink-black/5 rounded-sm relative">
                             {/* Ti */}
                             <motion.div 
                               whileHover={{ scale: 1.05 }}
                               className="flex flex-col items-center gap-3 z-10"
                             >
                               <span className="text-[8px] uppercase tracking-[0.2em] opacity-40 font-bold mb-1">主方 / 我 / 体 (TI)</span>
                               <div className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center bg-white shadow-2xl transition-colors duration-500 ${
                                 hexagram.tiYong.tiElement === '金' ? 'border-yellow-600 shadow-yellow-600/10' :
                                 hexagram.tiYong.tiElement === '木' ? 'border-green-700 shadow-green-700/10' :
                                 hexagram.tiYong.tiElement === '水' ? 'border-blue-800 shadow-blue-800/10' :
                                 hexagram.tiYong.tiElement === '火' ? 'border-red-700 shadow-red-700/10' :
                                 'border-amber-900 shadow-amber-900/10'
                               }`}>
                                 <span className="text-3xl font-brush mb-1">{hexagram.tiYong.ti}</span>
                                 <div className="flex gap-1">
                                   <div className={`w-1 h-3 rounded-full ${
                                     hexagram.tiYong.tiElement === '金' ? 'bg-yellow-600' :
                                     hexagram.tiYong.tiElement === '木' ? 'bg-green-700' :
                                     hexagram.tiYong.tiElement === '水' ? 'bg-blue-800' :
                                     hexagram.tiYong.tiElement === '火' ? 'bg-red-700' :
                                     'bg-amber-900'
                                   }`} />
                                   <span className="text-[10px] font-bold">{hexagram.tiYong.tiElement}</span>
                                 </div>
                               </div>
                               <span className="text-[9px] font-bold tracking-widest text-ink-black/30">主体/现状</span>
                             </motion.div>

                             {/* Interaction Visual */}
                             <div className="flex-1 flex flex-col items-center justify-center gap-2 relative">
                                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-ink-black/20 to-transparent -translate-y-1/2" />
                                
                                <div className="bg-white px-3 py-1 border border-ink-black/10 rounded-full shadow-sm z-10 flex items-center gap-2">
                                  <span className="text-[10px] text-imperial-red font-bold">{hexagram.tiYong.relative}</span>
                                  <div className="w-[1px] h-3 bg-ink-black/10" />
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-ink-black/40 uppercase tracking-tighter">Interaction</span>
                                    {hexagram.tiYong.relation.includes('生') ? (
                                      <RefreshCw className="w-3 h-3 text-green-600 animate-spin-slow" />
                                    ) : hexagram.tiYong.relation.includes('克') ? (
                                      <Sparkles className="w-3 h-3 text-red-600 animate-pulse" />
                                    ) : (
                                      <div className="w-3 h-3 border border-ink-black/40 rounded-full" />
                                    )}
                                  </div>
                                </div>

                                <motion.div 
                                  animate={hexagram.tiYong.relative === '比和' ? { scale: [1, 1.1, 1] } : { x: [-10, 10, -10] }}
                                  transition={{ repeat: Infinity, duration: 3 }}
                                  className="text-lg opacity-20"
                                >
                                  {hexagram.tiYong.relation.includes('生') ? '⚡' : hexagram.tiYong.relation.includes('克') ? '⚔️' : '☯️'}
                                </motion.div>
                             </div>

                             {/* Yong */}
                             <motion.div 
                               whileHover={{ scale: 1.05 }}
                               className="flex flex-col items-center gap-3 z-10"
                             >
                               <span className="text-[8px] uppercase tracking-[0.2em] opacity-40 font-bold mb-1">客方 / 事 / 用 (YONG)</span>
                               <div className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center bg-white shadow-2xl transition-colors duration-500 ${
                                 hexagram.tiYong.yongElement === '金' ? 'border-yellow-600 shadow-yellow-600/10' :
                                 hexagram.tiYong.yongElement === '木' ? 'border-green-700 shadow-green-700/10' :
                                 hexagram.tiYong.yongElement === '水' ? 'border-blue-800 shadow-blue-800/10' :
                                 hexagram.tiYong.yongElement === '火' ? 'border-red-700 shadow-red-700/10' :
                                 'border-amber-900 shadow-amber-900/10'
                               }`}>
                                 <span className="text-3xl font-brush mb-1">{hexagram.tiYong.yong}</span>
                                 <div className="flex gap-1">
                                   <div className={`w-1 h-3 rounded-full ${
                                     hexagram.tiYong.yongElement === '金' ? 'bg-yellow-600' :
                                     hexagram.tiYong.yongElement === '木' ? 'bg-green-700' :
                                     hexagram.tiYong.yongElement === '水' ? 'bg-blue-800' :
                                     hexagram.tiYong.yongElement === '火' ? 'bg-red-700' :
                                     'bg-amber-900'
                                   }`} />
                                   <span className="text-[10px] font-bold">{hexagram.tiYong.yongElement}</span>
                                 </div>
                               </div>
                               <span className="text-[9px] font-bold tracking-widest text-ink-black/30">目标/环境</span>
                             </motion.div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-ink-black/5">
                            <div className="space-y-3">
                               <div className="flex items-center gap-2">
                                 <Info className="w-3 h-3 text-imperial-red" />
                                 <span className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-60">占断玄机 INTERPRETATION</span>
                               </div>
                               <p className="text-[11px] text-ink-black/70 leading-relaxed italic border-l-2 border-imperial-red/20 pl-3">
                                 {hexagram.tiYong.description}
                               </p>
                            </div>
                            
                            <div className="space-y-3">
                               <div className="flex items-center gap-2">
                                 <BookOpen className="w-3 h-3 text-ink-black" />
                                 <span className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-60">六亲法度 THE SYSTEM</span>
                               </div>
                               <div className="bg-ink-black/[0.03] p-3 rounded-sm">
                                 <p className="text-[10px] text-ink-black/60 leading-tight">
                                   以体卦“{hexagram.tiYong.tiElement}”为坐标：<br/>
                                   <span className="text-imperial-red font-bold">【{hexagram.tiYong.relative}】</span> 揭示了此事的本质联系。
                                   在“{hexagram.tiYong.tiElement}”与“{hexagram.tiYong.yongElement}”的博弈中，展现了事物的{hexagram.tiYong.relation.split(' ')[0]}态势。
                                 </p>
                               </div>
                            </div>
                          </div>

                          {lines.some(l => l.isMoving) && hexagram.original.lines && (
                           <div className="pt-3 border-t border-ink-black/5 space-y-2">
                             <span className="text-[9px] uppercase tracking-widest opacity-40 block">动爻解析</span>
                             {lines.map((l, i) => l.isMoving && (
                               <motion.div 
                                 key={i} 
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 className="relative pl-6 border-l-2 border-imperial-red/20 group hover:border-imperial-red/50 transition-all font-sans"
                               >
                                 <div className="absolute -left-[1px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-imperial-red flex items-center justify-center">
                                   <div className="w-1 h-1 rounded-full bg-imperial-red animate-ping" />
                                 </div>
                                 
                                 <div className="space-y-3">
                                   <div className="flex flex-wrap items-center gap-3">
                                     <span className="text-[12px] font-bold font-brush text-imperial-red">第{['初', '二', '三', '四', '五', '上'][i]}爻 · {l.value === 6 ? '老阴' : '老阳'}动</span>
                                     <div className="flex items-center gap-2 px-2 py-0.5 bg-ink-black/5 rounded-full">
                                       <span className="text-[9px] text-ink-black/40 uppercase">位:</span>
                                       <span className="text-[9px] font-bold text-ink-black/60">
                                          {i === 0 ? '初起' : i === 4 ? '尊位' : i === 5 ? '穷尽' : '中轴'}
                                       </span>
                                     </div>
                                     <div className="flex items-center gap-1 text-imperial-red border-l border-imperial-red/10 pl-3">
                                       <span className="text-[11px] font-bold">{l.type === 'yang' ? '⚊' : '⚋'}</span>
                                       <ArrowRight className="w-3 h-3 opacity-40 mx-2" />
                                       <span className="text-[11px] font-bold">{l.type === 'yang' ? '⚋' : '⚊'}</span>
                                     </div>
                                   </div>

                                   <div className="grid sm:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                       <p className="text-[12px] font-serif-sc font-bold text-ink-black/80">
                                         {typeof hexagram.original.lines?.[i] === 'string' ? hexagram.original.lines?.[i] : (hexagram.original.lines?.[i] as any)?.text}
                                       </p>
                                       <p className="text-[10px] text-ink-black/50 leading-relaxed italic">
                                         此爻发动，预示局势于此点发生彻底的质变，打破原有本卦的宁静。
                                       </p>
                                     </div>
                                     
                                     <div className="p-3 bg-imperial-red/[0.03] border border-imperial-red/10 rounded-sm">
                                       <span className="text-[8px] uppercase tracking-widest text-imperial-red/60 block mb-1 font-bold">变易逻辑</span>
                                       <p className="text-[10px] text-ink-black/80 leading-relaxed truncate">
                                         从《{hexagram.original.name}》向《{hexagram.changed?.name}》演化。
                                       </p>
                                       <div className="mt-1 text-[9px] text-imperial-red italic">
                                         建议：由“{l.type === 'yang' ? '刚健' : '柔顺'}”转向“{l.type === 'yang' ? '谦让' : '果决'}”。
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               </motion.div>
                             ))}
                           </div>
                         )}
                      </div>

                      {hexagram.changed && (
                        <div className="bg-imperial-red/[0.02] border-2 border-imperial-red/10 p-6 space-y-6 shadow-xl relative overflow-hidden mt-6">
                          <div className="lattice-corner lattice-tl opacity-5" />
                          <div className="lattice-corner lattice-tr opacity-5" />
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-imperial-red/20 pb-4 gap-4">
                             <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                 <h3 className="text-sm font-bold tracking-widest uppercase text-imperial-red/80">变卦深度解析 (Transformed Hexagram Analysis)</h3>
                                 <Sparkles className="w-4 h-4 text-imperial-red animate-pulse" />
                               </div>
                               <p className="text-[10px] text-ink-black/40 font-serif-sc italic">The Evolution of Fate and Terminal Direction</p>
                             </div>
                             <div className="flex items-center gap-3">
                               <div className="text-right">
                                 <div className="text-[11px] font-bold text-imperial-red uppercase tracking-widest">变卦（之卦）：{hexagram.changed.name}卦</div>
                                 <div className="text-[9px] text-ink-black/30 font-medium">FINAL OUTCOME / TRANSFORMED</div>
                               </div>
                               <div className="w-10 h-10 rounded-full flex items-center justify-center text-imperial-red border border-imperial-red/30 text-xl font-brush bg-white shadow-inner">
                                 {hexagram.changed.symbol}
                               </div>
                             </div>
                          </div>

                          <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-4">
                              <div>
                                <span className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 block mb-2">演化生成逻辑 DERIVATION PROCESS</span>
                                <div className="bg-white/60 p-4 border border-ink-black/5 rounded-sm space-y-3">
                                  <p className="text-[11px] text-ink-black/70 leading-relaxed font-serif-sc">
                                    此变卦衍生于本卦“{hexagram.original.name}”的<span className="text-imperial-red font-bold">{lines.filter(l => l.isMoving).length}</span>个发动之爻。
                                    在易学逻辑中，“极则必反，动则有变”，这些爻位代表了当前局势中最关键的质变点。
                                  </p>
                                  <div className="pt-2 border-t border-ink-black/5 flex flex-col gap-1">
                                    {lines.map((l, i) => l.isMoving && (
                                      <div key={i} className="flex justify-between items-center text-[9px]">
                                        <span className="text-ink-black/50">第{['初', '二', '三', '四', '五', '上'][i]}爻：{l.type === 'yang' ? '⚊' : '⚋'}</span>
                                        <ArrowRight className="w-2 h-2 text-imperial-red/50" />
                                        <span className="font-bold text-imperial-red">{l.type === 'yang' ? '⚋ (变阴)' : '⚊ (变阳)'}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-ink-black/50 italic leading-relaxed">
                                    当这些局部的微观变动汇聚，整卦的阴阳态势随之重塑，最终定格为“{hexagram.changed.name}”。
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-ink-black/[0.03] border border-ink-black/5 rounded-sm">
                                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 block mb-2">变卦卦辞 JUDGEMENT</span>
                                  <p className="text-[12px] font-serif-sc leading-relaxed italic text-ink-black/80">{hexagram.changed.judgement}</p>
                                  <div className="mt-2 pt-2 border-t border-ink-black/5">
                                    <span className="text-[8px] uppercase tracking-tighter text-ink-black/30 block mb-1">结果定性</span>
                                    <p className="text-[10px] text-ink-black/60">{hexagram.changed.meaning.split('。')[0]}，此谓之“果”。</p>
                                  </div>
                                </div>
                                <div className="p-4 bg-ink-black/[0.03] border border-ink-black/5 rounded-sm">
                                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 block mb-2">变卦大象 IMAGERY</span>
                                  <p className="text-[12px] font-serif-sc leading-relaxed italic text-ink-black/80">{hexagram.changed.meaning}</p>
                                  <div className="mt-2 pt-2 border-t border-ink-black/5">
                                    <span className="text-[8px] uppercase tracking-tighter text-ink-black/30 block mb-1">应效之道</span>
                                    <p className="text-[10px] text-ink-black/60">取其“{hexagram.changed.meaning.match(/象曰：(.*)/)?.[1]?.split('，')?.[1]}”之势而行。</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="relative group">
                                <div className="absolute inset-0 bg-imperial-red/5 blur-xl group-hover:bg-imperial-red/10 transition-all opacity-0 group-hover:opacity-100" />
                                <div className="relative p-5 border-l-4 border-imperial-red bg-white/80 space-y-3 shadow-sm">
                                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-imperial-red block">卦义贯通与补正 SYNTHESIS & ADJUSTMENT</span>
                                  <div className="space-y-2">
                                    <p className="text-[11px] text-ink-black/80 leading-relaxed">
                                      如果说本卦“{hexagram.original.name}”是此事的<span className="font-bold">起始诱因</span>与<span className="font-bold">当前现状</span>，
                                      那么变卦“{hexagram.changed.name}”则是此事的<span className="font-bold">最终归宿</span>与<span className="font-bold">局势转折</span>点。
                                    </p>
                                    <p className="text-[11px] text-ink-black/70 leading-relaxed bg-ink-black/5 p-3 italic">
                                      <span className="font-bold text-imperial-red">“补正关系”：</span>
                                      本卦揭示了“{hexagram.original.meaning.split('。')[0]}”的宏观环境，
                                      而变卦则由于动爻的介入，对原有的轨迹进行了深刻的修正，将其引导向“{hexagram.changed.meaning.split('。')[0]}”的逻辑。
                                      这种转化意味着：事态并非一成不变，其吉凶深度取决于动爻所映射的个体行为。
                                    </p>
                                  </div>
                                  <div className="pt-2 border-t border-ink-black/5 text-[10px] font-bold text-imperial-red flex items-center gap-2">
                                    <BookOpen className="w-3 h-3" />
                                    行动指南：由【{hexagram.original.name}】的守拙，跃迁至【{hexagram.changed.name}】的{hexagram.changed.meaning.split('，')[1]?.replace('。', '') || '应对'}之道。
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                        {/* Comprehensive Evaluation Section */}
                        <div className="bg-ink-black border-2 border-imperial-red/30 p-6 space-y-6 shadow-2xl relative overflow-hidden mt-8 group">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-imperial-red to-transparent" />
                          <div className="lattice-corner lattice-tl opacity-20" />
                          <div className="lattice-corner lattice-tr opacity-20" />
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h3 className="text-sm font-bold tracking-widest uppercase text-white/60">卦象吉凶综合评判</h3>
                              <p className="text-[10px] text-white/30 font-serif-sc italic">Comprehensive Divination Synthesis</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className={`text-sm font-bold uppercase tracking-widest ${
                                  hexagram.tiYong.relation.includes('大吉') ? 'text-orange-400' :
                                  hexagram.tiYong.relation.includes('吉') ? 'text-green-400' :
                                  hexagram.tiYong.relation.includes('凶') ? 'text-red-400' : 'text-white/80'
                                }`}>
                                  {hexagram.tiYong.relation.includes('吉') ? (hexagram.tiYong.relation.includes('大') ? '大吉大利' : '中平偏吉') : 
                                   hexagram.tiYong.relation.includes('凶') ? '时运不济' : '中正平稳'}
                                </div>
                                <div className="text-[9px] text-white/20 font-medium">SYNTHESIZED RATING</div>
                              </div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-8 relative">
                            <div className="space-y-4">
                              <div className="relative">
                                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/40 block mb-3">评判依据 (Criteria Analysis)</span>
                                <div className="space-y-3">
                                  {[
                                    { label: '本卦 (Origin)', value: hexagram.original.name, sub: hexagram.original.meaning.split('。')[0], status: 'base' },
                                    { label: '变卦 (Outcome)', value: hexagram.changed?.name || '无', sub: hexagram.changed?.meaning.split('。')[0] || '局势平稳', status: hexagram.changed ? 'change' : 'stable' },
                                    { label: '互卦 (Process)', value: hexagram.mutual.name, sub: hexagram.mutual.meaning.split('。')[0], status: 'internal' },
                                    { label: '五行 (Element)', value: hexagram.tiYong.relative, sub: hexagram.tiYong.relation, status: 'energy' }
                                  ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 border-l border-white/10 pl-3 py-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-imperial-red mt-1" />
                                      <div>
                                        <div className="text-[10px] text-white/40 font-bold">{item.label}：<span className="text-white/80">{item.value}</span></div>
                                        <p className="text-[9px] text-white/20 leading-tight">{item.sub}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="bg-white/[0.03] p-5 border border-white/10 rounded-sm relative">
                              <div className="absolute -top-3 -right-3">
                                <motion.div 
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                  className="text-3xl opacity-10"
                                >
                                  ☯️
                                </motion.div>
                              </div>
                              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-imperial-red block mb-3">乾坤定论 (The Verdict)</span>
                              <div className="space-y-4">
                                <p className="text-[11px] text-white/70 font-serif-sc leading-relaxed">
                                  综合考量本卦的“{hexagram.original.name}”卦辞与变卦“{hexagram.changed?.name || '静止'}”的趋势，目前处于<span className="text-white font-bold">【{hexagram.tiYong.relation.split(' ')[0]}】</span>之势。
                                  互卦“{hexagram.mutual.name}”提示此事在发展中存在“{hexagram.mutual.meaning.split('。')[0]}”的内部动因。
                                </p>
                                <div className="p-3 bg-white/[0.02] border-l border-imperial-red">
                                  <span className="text-[9px] text-white/30 uppercase block mb-1">决策导向</span>
                                  <p className="text-[10px] text-imperial-red font-bold leading-relaxed">
                                    {hexagram.tiYong.relation.includes('吉') 
                                      ? `主方力量（${hexagram.tiYong.tiElement}）占据上风，应顺势而为。变卦指示最终落点为“${hexagram.changed?.name}”，切记“${hexagram.changed?.meaning.split('。')[0]}”之诫。`
                                      : `当前生克关系处于“${hexagram.tiYong.relative}”，意味着挑战与机遇并存。需借助综卦“${hexagram.inverse.name}”的视角反向思量。`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                      {!chatHistory.length && (
                        <div className="flex gap-4 pt-4">
                          <button
                            onClick={handleAIInterpret}
                            disabled={aiLoading}
                            className="flex-1 py-5 bg-ink-black text-white text-[11px] tracking-[0.4em] font-bold flex items-center justify-center gap-3 hover:bg-imperial-red transition-all shadow-2xl rounded-sm"
                          >
                            {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            开启深度卦解
                          </button>
                          <button onClick={reset} className="px-6 border border-ink-black/20 hover:border-imperial-red transition-all text-ink-black/40 hover:text-imperial-red group">
                             <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </motion.div>
        ) : view === 'theory' ? (
          <motion.div 
            key="theory" 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.98 }}
            className="scroll-surface p-8 min-h-[600px] relative"
          >
            <div className="lattice-corner lattice-tl" />
            <div className="lattice-corner lattice-tr" />
            
            <div className="flex flex-col md:flex-row gap-12">
               <div className="md:w-1/3 space-y-8">
                  <div className="flex flex-col gap-2">
                    {([
                      { id: 'bagua', label: '先天八卦', icon: <Info className="w-4 h-4"/> },
                      { id: 'hexagrams', label: '六十四卦', icon: <BookOpen className="w-4 h-4"/> },
                      { id: 'hetu', label: '河图', icon: <Info className="w-4 h-4"/> },
                      { id: 'luoshu', label: '洛书', icon: <Hash className="w-4 h-4"/> },
                    ] as const).map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setTheoryTab(tab.id)}
                        className={`w-full px-5 py-5 flex items-center gap-4 border text-[12px] tracking-widest transition-all ${theoryTab === tab.id ? 'bg-ink-black text-white border-ink-black shadow-lg' : 'border-ink-black/25 text-ink-black/80 hover:bg-ink-black/5'}`}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="text-ink-black/60 leading-loose border-t border-ink-black/10 pt-6">
                    <h4 className="text-ink-black font-brush text-2xl mb-4">易理浅析</h4>
                    <p className="font-serif-sc">
                      {theoryTab === 'bagua' && "八卦乃万物之象。乾为天，坤为地，震为雷，巽为风，坎为水，离为火，艮为山，兑为泽。"}
                      {theoryTab === 'hexagrams' && "六十四卦由八卦两两相重而成，演化世间万物运行之规律。每一爻动，皆显机缘之变。"}
                      {theoryTab === 'hetu' && "河图为五行之源。一六水居北，二七火居南，三八木居东，四九金居西，五十土居中。"}
                      {theoryTab === 'luoshu' && "洛书为后天之用。戴九履一，左三右七，二四为肩，六八为足，五居中央。"}
                    </p>
                  </div>
               </div>

               <div className="flex-1 flex items-center justify-center bg-paper/10 border border-ink-black/5 rounded-lg p-12 ink-wash-gradient">
                  <AnimatePresence mode="wait">
                    {theoryTab === 'bagua' && <motion.div key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><BaguaCircle /></motion.div>}
                    {theoryTab === 'hexagrams' && (
                      <motion.div key="hex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-[500px] overflow-y-auto px-2 py-4 custom-scrollbar">
                          {Object.keys(HEXAGRAMS_DATA).sort((a, b) => (HEXAGRAMS_DATA[a].number || 0) - (HEXAGRAMS_DATA[b].number || 0)).map(bin => {
                            const hex = GET_HEX_BY_BINARY(bin);
                            return (
                              <button
                                key={bin}
                                onClick={() => setSelectedGalleryHex(hex)}
                                className="flex flex-col items-center p-3 border border-ink-black/5 bg-white/20 hover:bg-white/60 hover:border-imperial-red transition-all group rounded-sm"
                              >
                                <span className="text-3xl font-calligraphy mb-1 group-hover:scale-110 transition-transform">{hex.symbol}</span>
                                <span className="text-[10px] whitespace-nowrap opacity-60 font-bold">{hex.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                    {theoryTab === 'hetu' && <motion.div key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><HeTu /></motion.div>}
                    {theoryTab === 'luoshu' && <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Luoshu /></motion.div>}
                  </AnimatePresence>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="scroll-surface p-8 min-h-[600px] relative overflow-hidden"
          >
            <div className="lattice-corner lattice-tl" />
            <div className="lattice-corner lattice-tr" />
            
            <div className="flex items-center justify-between mb-12 border-b border-ink-black/10 pb-6">
              <div className="flex items-center gap-4">
                <History className="w-6 h-6 text-ink-black/40" />
                <h2 className="text-3xl font-brush text-ink-black">历次占算</h2>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 hover:text-imperial-red font-bold transition-all"
                >
                  清空历史 CLEAR ALL
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-32 space-y-4">
                 <Sparkles className="w-12 h-12 mx-auto text-ink-black/10" />
                 <p className="text-[11px] opacity-30 tracking-[0.3em] font-bold uppercase italic">尚无占算记录，天机未显...</p>
                 <button 
                  onClick={() => setView('divination')}
                  className="text-[10px] text-imperial-red font-bold underline hover:opacity-70 transition-opacity"
                 >
                   前往启卦
                 </button>
              </div>
            ) : (
              <div className="grid gap-4 max-w-4xl mx-auto">
                {history.map(item => (
                  <motion.div
                    key={item.id}
                    layoutId={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="group bg-white/40 border border-ink-black/5 p-6 flex items-center gap-8 cursor-pointer hover:border-imperial-red/30 transition-all hover:bg-white/80 hover:shadow-xl"
                  >
                    <div className="text-4xl font-calligraphy text-ink-black group-hover:scale-110 transition-transform">
                      {item.hexagram.original.symbol}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-brush">{item.hexagram.original.name}卦</span>
                          {item.hexagram.changed && <span className="text-[10px] bg-imperial-red/5 text-imperial-red px-2 py-0.5">之{item.hexagram.changed.name}卦</span>}
                        </div>
                        <span className="text-[9px] opacity-30 font-bold font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-60 leading-relaxed italic truncate max-w-md">
                        {item.question || `${QUESTION_CATEGORIES.find(c => c.id === item.category)?.label || '综合'}分析`}
                      </p>
                    </div>

                    <div className="text-right opacity-0 group-hover:opacity-40 transition-opacity">
                      <span className="text-[10px] uppercase tracking-widest font-bold">查看详情 REVEAL →</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {chatHistory.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="scroll-surface p-8 md:p-12 relative overflow-hidden space-y-12 mt-12 bg-paper/60 backdrop-blur-sm"
          >
            <div className="lattice-corner lattice-tl" />
            <div className="lattice-corner lattice-tr" />
            
            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <div className="vertical-text font-brush text-4xl text-ink-black tracking-[0.4em]">易理解惑</div>
                <div className="flex-1 border-b border-ink-black/10 h-[1px]"></div>
              </div>

              {/* Chat View */}
              <div className="space-y-10 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-6 rounded-sm border ${msg.role === 'user' ? 'bg-ink-black/5 border-ink-black/20 italic text-sm' : 'bg-white/40 border-ink-black/10 text-xl leading-relaxed shadow-sm'}`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 text-[10px] opacity-30 uppercase tracking-widest mb-4 border-b border-ink-black/5 pb-2 font-bold">
                          <MessageSquare className="w-3 h-3" /> 天道神谕
                        </div>
                      )}
                      <div className="font-serif-sc whitespace-pre-wrap text-ink-black">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-paper border border-ink-black/10 p-6 animate-pulse">
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 bg-ink-black/40 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-ink-black/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-ink-black/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Follow up Input */}
              <div className="pt-8 border-t border-ink-black/20 flex gap-6">
                <input
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
                  placeholder="卦象奥义深邃，若有疑惑请追问..."
                  className="flex-1 bg-transparent border-b border-ink-black/10 py-3 text-sm text-ink-black focus:outline-none focus:border-ink-black/40 italic placeholder:opacity-20"
                />
                <button
                  onClick={handleFollowUp}
                  disabled={aiLoading || !followUp.trim()}
                  className="p-4 bg-ink-black text-white hover:bg-imperial-red transition-all disabled:opacity-20 shadow-xl"
                >
                  <Send className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setChatHistory([])}
                  className="p-4 border border-ink-black/10 hover:border-imperial-red transition-all opacity-40 hover:opacity-100 text-ink-black"
                  title="清空"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedLineIdx !== null && hexagram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ink-black/40 backdrop-blur-sm"
            onClick={() => setSelectedLineIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-paper p-8 max-w-lg w-full border border-imperial-red/20 shadow-2xl relative ink-wash-gradient"
              onClick={e => e.stopPropagation()}
            >
              <div className="lattice-corner lattice-tl" />
              <div className="lattice-corner lattice-br" />
              
              <button 
                onClick={() => setSelectedLineIdx(null)}
                className="absolute top-6 right-6 text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 font-bold"
              >
                关闭 CLOSE
              </button>

              <div className="space-y-8">
                 <div className="flex items-baseline gap-4 border-b border-ink-black/10 pb-4">
                    <h2 className="text-4xl font-brush text-imperial-red">{hexagram.original.name}卦</h2>
                    <span className="text-xl font-brush opacity-60">· {['初', '二', '三', '四', '五', '上'][selectedLineIdx]}爻</span>
                 </div>

                 {(() => {
                   const movingIndexes = lines.map((l, idx) => l.isMoving ? idx : -1).filter(idx => idx !== -1);
                   const details = getLineDetails(hexagram.original, movingIndexes)[selectedLineIdx];
                   
                   return (
                     <div className="space-y-6">
                       <div>
                         <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-2">爻辞原文 (Canonical Text)</span>
                         <p className="text-sm font-serif-sc leading-relaxed bg-imperial-red/[0.03] p-4 border border-imperial-red/5 italic">
                           {details?.text}
                         </p>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                           <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-2">爻位时位 (Position Context)</span>
                           <p className="text-[12px] leading-relaxed text-ink-black/70 font-serif-sc p-3 bg-ink-black/[0.02] border-l border-ink-black/10">
                             {details?.positionContext}
                           </p>
                         </div>
                         <div>
                           <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-2">卦象关联 (Hex Relationship)</span>
                           <p className="text-[12px] leading-relaxed text-ink-black/70 font-serif-sc p-3 bg-ink-black/[0.02] border-l border-ink-black/10">
                             {details?.hexRelationship}
                           </p>
                         </div>
                       </div>

                       <div className="p-4 bg-ink-black/[0.02] border border-ink-black/5 rounded-sm space-y-4 mb-4">
                         <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 block">先天与后天八卦方位 (Bagua Context)</span>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="p-3 bg-imperial-red/[0.02] border-l-2 border-imperial-red/20 space-y-1">
                             <span className="text-[8px] font-bold text-imperial-red uppercase tracking-wider">先天八卦 (Pre-heaven)</span>
                             <p className="text-[11px] text-ink-black/70 font-serif-sc leading-relaxed truncate">{details?.preBagua}</p>
                           </div>
                           <div className="p-3 bg-ink-black/[0.04] border-l-2 border-ink-black/20 space-y-1">
                             <span className="text-[8px] font-bold text-ink-black/60 uppercase tracking-wider">后天八卦 (Post-heaven)</span>
                             <p className="text-[11px] text-ink-black/70 font-serif-sc leading-relaxed truncate">{details?.postBagua}</p>
                           </div>
                         </div>
                       </div>

                       <div>
                         <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-2">易学典故 (Classical Allusion)</span>
                         <p className="text-[12px] leading-relaxed text-ink-black/70 font-serif-sc p-3 bg-ink-black/[0.02] border-l border-ink-black/10">
                           {details?.allusion}
                         </p>
                       </div>

                       <div>
                         <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-2">时位与变动影响 (Analysis & Impact)</span>
                         <div className="text-[12px] leading-relaxed text-ink-black/70 font-serif-sc space-y-2">
                           {details?.analysis.split('[').map((part, i) => (
                             i === 0 ? <p key={i}>{part}</p> : 
                             <div key={i} className="p-3 bg-imperial-red/5 border-l-2 border-imperial-red text-imperial-red italic mt-2">
                               <span className="font-bold not-italic block mb-1 text-[10px] uppercase tracking-wider">【动爻影响 · Transformation】</span>
                               {part}
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>
                   );
                 })()}

                 <div className="pt-4 text-center">
                    <p className="text-[9px] uppercase tracking-[0.4em] opacity-20 font-bold">
                       天地盈虚 · 与时消息
                    </p>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedGalleryHex && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-black/40 backdrop-blur-sm"
            onClick={() => setSelectedGalleryHex(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-paper p-8 max-w-2xl w-full border border-ink-black/20 shadow-2xl relative scroll-surface ink-wash-gradient"
              onClick={e => e.stopPropagation()}
            >
              <div className="lattice-corner lattice-tl" />
              <div className="lattice-corner lattice-br" />
              
              <button 
                onClick={() => setSelectedGalleryHex(null)}
                className="absolute top-6 right-6 text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 font-bold"
              >
                关闭 CLOSE
              </button>

              <div className="flex gap-12 items-start">
                <div className="flex flex-col items-center gap-6">
                   <div className="text-8xl font-calligraphy text-ink-black mb-4">{selectedGalleryHex.symbol}</div>
                   <div className="flex flex-col-reverse gap-2">
                     {selectedGalleryHex.binary.split('').map((char, i) => (
                       <div key={i} className="flex justify-between w-32 h-1.5 gap-1">
                          {char === '1' ? (
                            <div className="w-full h-full bg-ink-black/80" />
                          ) : (
                            <>
                              <div className="w-[45%] h-full bg-ink-black/80" />
                              <div className="w-[45%] h-full bg-ink-black/80" />
                            </>
                          )}
                       </div>
                     ))}
                   </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-4xl font-brush mb-2">{selectedGalleryHex.name}卦</h2>
                    <p className="text-xs opacity-50 font-bold uppercase tracking-widest">
                       {selectedGalleryHex.pinyin} | 第{selectedGalleryHex.number}卦
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-ink-black/[0.03] border border-ink-black/5">
                      <span className="text-[10px] uppercase tracking-widest opacity-40 block mb-2">卦辞</span>
                      <p className="text-sm font-serif-sc leading-relaxed">{selectedGalleryHex.judgement}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-widest opacity-40 block">六爻爻辞 (点击爻辞展开)</span>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedGalleryHex.lines?.map((line, i) => (
                          <div key={i} className="border-l-2 border-imperial-red/10 pl-4 py-1 hover:border-imperial-red/40 transition-colors cursor-help group">
                            <span className="text-[10px] font-bold text-imperial-red/60 group-hover:text-imperial-red block mb-1">
                              {['初', '二', '三', '四', '五', '上'][i]}爻
                            </span>
                            <p className="text-[11px] leading-relaxed text-ink-black/70 font-serif-sc italic">
                              {line}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
