import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Users, Zap, Wind, Mountain, Sun, Waves, CloudRain, ShieldCheck } from 'lucide-react';

const TRIGRAM_DETAILS: Record<string, {
  name: string;
  nature: string;
  element: string;
  attribute: string;
  symbol: string;
  family: string;
  bodyPart: string;
  icon: React.ReactNode;
  relationHint: string;
  prePosition: string;
  postPosition: string;
}> = {
  '乾': { name: '乾 (Qián)', nature: '天', element: '金', attribute: '健', symbol: '刚健不息，权威统领', family: '父', bodyPart: '首', icon: <Sun className="w-4 h-4" />, relationHint: '官鬼/妻财之源', prePosition: '正南', postPosition: '西北' },
  '兑': { name: '兑 (Duì)', nature: '泽', element: '金', attribute: '说', symbol: '喜悦滋润, 欢欣交流', family: '少女', bodyPart: '口', icon: <Waves className="w-4 h-4" />, relationHint: '主交际与财源', prePosition: '东南', postPosition: '正西' },
  '离': { name: '离 (Lí)', nature: '火', element: '火', attribute: '丽', symbol: '光明灿烂，附丽而生', family: '中女', bodyPart: '目', icon: <Sun className="w-4 h-4" />, relationHint: '主明志与文书', prePosition: '正东', postPosition: '正南' },
  '震': { name: '震 (Zhèn)', nature: '雷', element: '木', attribute: '动', symbol: '奋发震动，生机勃发', family: '长男', bodyPart: '足', icon: <Zap className="w-4 h-4" />, relationHint: '主执行与变动', prePosition: '东北', postPosition: '正东' },
  '巽': { name: '巽 (Xùn)', nature: '风', element: '木', attribute: '入', symbol: '柔顺渗透，无孔不入', family: '长女', bodyPart: '股', icon: <Wind className="w-4 h-4" />, relationHint: '主柔和与财商', prePosition: '西南', postPosition: '东南' },
  '坎': { name: '坎 (Kǎn)', nature: '水', element: '水', attribute: '陷', symbol: '艰难深邃，处险而不动', family: '中男', bodyPart: '耳', icon: <CloudRain className="w-4 h-4" />, relationHint: '主智慧与困难', prePosition: '正西', postPosition: '正北' },
  '艮': { name: '艮 (Gèn)', nature: '山', element: '土', attribute: '止', symbol: '沉稳止息，厚重如山', family: '少男', bodyPart: '手', icon: <Mountain className="w-4 h-4" />, relationHint: '主守成与节点', prePosition: '西北', postPosition: '东北' },
  '坤': { name: '坤 (Kūn)', nature: '地', element: '土', attribute: '顺', symbol: '厚德载物，包容万象', family: '母', bodyPart: '腹', icon: <ShieldCheck className="w-4 h-4" />, relationHint: '主孕育与基础', prePosition: '正北', postPosition: '西南' }
};

export function HeTu() {
  const positions = [
    { n: 1, pos: 'row-start-5 col-start-3', type: 'black' },
    { n: 6, pos: 'row-start-5 col-start-3 translate-y-6', type: 'white' },
    { n: 2, pos: 'row-start-1 col-start-3', type: 'black' },
    { n: 7, pos: 'row-start-1 col-start-3 -translate-y-6', type: 'white' },
    { n: 3, pos: 'row-start-3 col-start-1', type: 'black' },
    { n: 8, pos: 'row-start-3 col-start-1 -translate-x-6', type: 'white' },
    { n: 4, pos: 'row-start-3 col-start-5', type: 'black' },
    { n: 9, pos: 'row-start-3 col-start-5 translate-x-6', type: 'white' },
    { n: 5, pos: 'row-start-3 col-start-3', type: 'black' },
    { n: 10, pos: 'row-start-3 col-start-3 scale-150 opacity-20', type: 'white' },
  ];

  return (
    <div className="relative w-full aspect-square max-w-[300px] mx-auto p-4 bg-white/40 rounded-full border border-ink-black/10 shadow-inner">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05]">
        <div className="text-[120px] font-brush">河图</div>
      </div>
      <div className="relative z-10 grid grid-cols-5 grid-rows-5 gap-2 h-full">
        {positions.map((p, i) => (
          <div key={i} className={`flex gap-1 ${p.pos} items-center justify-center`}>
            {Array.from({ length: p.n }).map((_, idx) => (
              <div 
                key={idx} 
                className={`w-2 h-2 rounded-full shadow-sm ${p.type === 'white' ? 'bg-white border border-ink-black/20' : 'bg-ink-black'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Luoshu() {
  const grid = [
    [4, 9, 2],
    [3, 5, 7],
    [8, 1, 6]
  ];

  return (
    <div className="relative w-full aspect-square max-w-[300px] mx-auto p-10 bg-white/40 border border-ink-black/10 shadow-inner rounded-sm">
       <div className="absolute inset-0 flex items-center justify-center opacity-[0.05]">
        <div className="text-[120px] font-brush">洛书</div>
      </div>
      <div className="grid grid-cols-3 grid-rows-3 h-full gap-4 relative z-10">
        {grid.flat().map((n, i) => (
          <div key={i} className="border border-ink-black/10 bg-white/60 flex items-center justify-center relative group shadow-sm">
            <span className="text-3xl font-brush text-ink-black/80 group-hover:text-imperial-red transition-all font-bold">{n}</span>
            <div className={`absolute inset-0 opacity-[0.02] ${n % 2 === 0 ? 'bg-imperial-red' : 'bg-amber-gold'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BaguaCircle() {
  const [mode, setMode] = useState<'pre' | 'post'>('pre');
  const [selectedTrigram, setSelectedTrigram] = useState<string | null>(null);

  const preHeaven = ['乾', '巽', '坎', '艮', '坤', '震', '离', '兑'];
  const postHeaven = ['离', '坤', '兑', '乾', '坎', '艮', '震', '巽'];
  
  const currentTrigrams = mode === 'pre' ? preHeaven : postHeaven;
  const currentDetails = selectedTrigram ? TRIGRAM_DETAILS[selectedTrigram] : null;

  return (
    <div className="space-y-8">
      {/* Mode Selector */}
      <div className="flex justify-center gap-2">
        <button 
          onClick={() => { setMode('pre'); setSelectedTrigram(null); }}
          className={`px-4 py-1 text-[10px] tracking-widest uppercase transition-all ${mode === 'pre' ? 'bg-imperial-red text-white' : 'bg-ink-black/5 text-ink-black/40 hover:bg-ink-black/10'}`}
        >
          先天八卦
        </button>
        <button 
          onClick={() => { setMode('post'); setSelectedTrigram(null); }}
          className={`px-4 py-1 text-[10px] tracking-widest uppercase transition-all ${mode === 'post' ? 'bg-imperial-red text-white' : 'bg-ink-black/5 text-ink-black/40 hover:bg-ink-black/10'}`}
        >
          后天八卦
        </button>
      </div>

      <div className="relative w-full aspect-square max-w-[320px] mx-auto flex items-center justify-center">
        {/* Animated Rings */}
        <div className="absolute inset-0 border border-ink-black/5 rounded-full animate-[spin_240s_linear_infinite]" />
        <div className="absolute inset-4 border border-ink-black/10 rounded-full animate-[spin_120s_linear_infinite_reverse]" />
        <div className="absolute inset-8 border border-ink-black/20 rounded-full animate-[spin_60s_linear_infinite]" />
        
        {/* Taiji Center */}
        <div className="w-24 h-24 border border-imperial-red/20 rounded-full flex items-center justify-center shadow-xl bg-white/60 backdrop-blur-sm z-10">
          <div className="w-12 h-12 bg-imperial-red/5 rounded-full blur-xl animate-pulse" />
          <span className="font-brush text-2xl text-ink-black ink-glow">太极</span>
        </div>

        {/* Trigrams Around the Circle */}
        {currentTrigrams.map((t, i) => {
          const angle = (i * 45) - 90;
          const radius = 110;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          
          return (
            <motion.div
              key={`${mode}-${t}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              style={{ 
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`
              }}
              onClick={() => setSelectedTrigram(selectedTrigram === t ? null : t)}
              className={`flex flex-col items-center cursor-pointer p-2 transition-all group ${selectedTrigram === t ? 'scale-125' : 'hover:scale-110'}`}
            >
              <span className={`text-2xl font-brush transition-colors ${selectedTrigram === t ? 'text-imperial-red' : 'text-ink-black group-hover:text-imperial-red/60'}`}>{t}</span>
              <div className={`w-6 h-0.5 mt-1 transition-all ${selectedTrigram === t ? 'bg-imperial-red w-8' : 'bg-ink-black/20 group-hover:bg-imperial-red/20'}`} />
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Info Panel */}
      <AnimatePresence mode="wait">
        {currentDetails ? (
          <motion.div
            key={selectedTrigram}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-white/60 border border-ink-black/5 rounded-sm shadow-sm relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-imperial-red/5 flex items-center justify-center rounded-full text-imperial-red">
                {currentDetails.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-brush text-imperial-red">{currentDetails.name}</h4>
                  <span className="text-[10px] bg-ink-black/5 px-2 py-0.5 text-ink-black/60 rounded-full">{currentDetails.element} ({currentDetails.nature})</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase tracking-widest text-ink-black/30 block">物象 / 特性</span>
                    <p className="text-[10px] text-ink-black/80">{currentDetails.symbol} / {currentDetails.attribute}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase tracking-widest text-ink-black/30 block">对应家族 / 身体</span>
                    <p className="text-[10px] text-ink-black/80">{currentDetails.family} ({currentDetails.bodyPart})</p>
                  </div>
                  <div className="col-span-2 space-y-2 border-t border-ink-black/5 pt-3 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] uppercase tracking-widest text-imperial-red/60 font-bold">六亲推导 (LIUQIN DERIVATION)</span>
                      <span className="text-[8px] opacity-30 italic">以{currentDetails.element}为体</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {([
                        { rel: '父母', el: '生我者', desc: '金 ← 土, 木 ← 水, 水 ← 金, 火 ← 木, 土 ← 火', active: (currentDetails.element === '金' ? '土' : currentDetails.element === '木' ? '水' : currentDetails.element === '水' ? '金' : currentDetails.element === '火' ? '木' : '火') },
                        { rel: '兄弟', el: '同我者', desc: '金-金, 木-木, 水-水, 火-火, 土-土', active: currentDetails.element },
                        { rel: '子孙', el: '我生者', desc: '金 → 水, 木 → 火, 水 → 木, 火 → 土, 土 → 金', active: (currentDetails.element === '金' ? '水' : currentDetails.element === '木' ? '火' : currentDetails.element === '水' ? '木' : currentDetails.element === '火' ? '土' : '金') },
                        { rel: '妻财', el: '我克者', desc: '金 → 木, 木 → 土, 水 → 火, 火 → 金, 土 → 水', active: (currentDetails.element === '金' ? '木' : currentDetails.element === '木' ? '土' : currentDetails.element === '水' ? '火' : currentDetails.element === '火' ? '金' : '水') },
                        { rel: '官鬼', el: '克我者', desc: '金 ← 火, 木 ← 金, 水 ← 土, 火 ← 水, 土 ← 木', active: (currentDetails.element === '金' ? '火' : currentDetails.element === '木' ? '金' : currentDetails.element === '水' ? '土' : currentDetails.element === '火' ? '水' : '木') },
                      ]).map(r => (
                        <div key={r.rel} className={`flex flex-col items-center p-1 border rounded-sm transition-all ${r.active === currentDetails.element ? 'bg-imperial-red/[0.03] border-imperial-red/20' : 'bg-ink-black/[0.01] border-ink-black/5'}`}>
                          <span className={`text-[9px] font-bold ${r.rel === '官鬼' ? 'text-imperial-red' : r.rel === '妻财' ? 'text-green-700' : 'text-ink-black/60'}`}>{r.rel}</span>
                          <span className="text-[7px] scale-90 opacity-40 whitespace-nowrap">{r.el}</span>
                          <span className="text-[8px] font-serif-sc mt-0.5">{r.active}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-ink-black/40 leading-relaxed italic mt-1 bg-ink-black/[0.02] p-1 border-l-2 border-imperial-red/20">
                      {currentDetails.relationHint} —— 在此格局中，凡属“{currentDetails.element === '金' ? '火' : currentDetails.element === '木' ? '金' : currentDetails.element === '水' ? '土' : currentDetails.element === '火' ? '水' : '木'}”之象皆为【官鬼】，司忧患、职权与变动；凡属“{currentDetails.element === '金' ? '木' : currentDetails.element === '木' ? '土' : currentDetails.element === '水' ? '火' : currentDetails.element === '火' ? '金' : '水'}”之象皆为【妻财】，主财富与所得。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center border border-dashed border-ink-black/10 rounded-sm">
            <Info className="w-4 h-4 text-ink-black/10 mb-2" />
            <div className="text-ink-black/20 text-[10px] italic tracking-widest uppercase">
              点击卦象图标，开启易理秘境
            </div>
            <p className="text-[9px] text-ink-black/15 mt-2 max-w-[200px] text-center">
              先天为体 (The Essence), 后天为用 (The Application)。<br/>
              五行生克衍生六亲：官鬼、妻财、父母、兄弟、子孙。
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

