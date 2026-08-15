import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Zap, Wind, Mountain, Sun, Waves, CloudRain, ShieldCheck } from 'lucide-react';
import hetuUrl from '../assets/hetu.svg';
import luoshuUrl from '../assets/luoshu-classic.svg';
import baguaEarlierUrl from '../assets/bagua-earlier.svg';
import baguaLaterUrl from '../assets/bagua-later.svg';

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

/** 河图：经典黑白点阵图（一六居北水、二七居南火、三八居东木、四九居西金、五十居中土） */
export function HeTu() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="bg-white/70 border border-ink-black/10 rounded-full shadow-inner p-3">
        <img
          src={hetuUrl}
          alt="河图（一六共宗、二七同道、三八为朋、四九为友、五十同途）"
          className="w-full h-auto rounded-full select-none"
          draggable={false}
        />
      </div>
      <p className="text-center text-[9px] text-ink-black/40 mt-3 font-serif-sc tracking-widest">
        天一生水，地二生火，天三生木，地四生金，天五生土 · 地六成水，天七成火，地八成木，天九成金，地十成土
      </p>
    </div>
  );
}

/** 洛书：经典九宫幻方图（戴九履一，左三右七，二四为肩，六八为足，五居中央） */
export function Luoshu() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="bg-white/70 border border-ink-black/10 rounded-sm shadow-inner p-3">
        <img
          src={luoshuUrl}
          alt="洛书九宫图"
          className="w-full h-auto rounded-sm select-none"
          draggable={false}
        />
      </div>
      <p className="text-center text-[9px] text-ink-black/40 mt-3 font-serif-sc tracking-widest">
        戴九履一，左三右七，二四为肩，六八为足，五居中央 · 纵横斜相加皆为十五
      </p>
    </div>
  );
}

export function BaguaCircle() {
  const [mode, setMode] = useState<'pre' | 'post'>('pre');
  const [selectedTrigram, setSelectedTrigram] = useState<string | null>(null);

  // 先天八卦（南上北下，顺时针）：乾南、兑东南、离东、震东北、坤北、艮西北、坎西、巽西南
  const preHeaven = ['乾', '兑', '离', '震', '坤', '艮', '坎', '巽'];
  // 后天八卦：离南、坤西南、兑西、乾西北、坎北、艮东北、震东、巽东南
  const postHeaven = ['离', '坤', '兑', '乾', '坎', '艮', '震', '巽'];

  const currentTrigrams = mode === 'pre' ? preHeaven : postHeaven;
  const currentDetails = selectedTrigram ? TRIGRAM_DETAILS[selectedTrigram] : null;

  return (
    <div className="space-y-8">
      {/* Mode Selector */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => { setMode('pre'); setSelectedTrigram(null); }}
          className={`px-4 py-1.5 text-[10px] tracking-widest uppercase transition-all ${mode === 'pre' ? 'bg-imperial-red text-white shadow-md' : 'bg-ink-black/10 text-ink-black/75 hover:bg-ink-black/20'}`}
        >
          先天八卦
        </button>
        <button
          onClick={() => { setMode('post'); setSelectedTrigram(null); }}
          className={`px-4 py-1.5 text-[10px] tracking-widest uppercase transition-all ${mode === 'post' ? 'bg-imperial-red text-white shadow-md' : 'bg-ink-black/10 text-ink-black/75 hover:bg-ink-black/20'}`}
        >
          后天八卦
        </button>
      </div>

      {/* 经典八卦方位图（Wikimedia Commons 公共领域图） */}
      <div className="relative w-full max-w-[360px] mx-auto">
        <div className="bg-white/70 border border-ink-black/10 rounded-full shadow-inner p-3">
          <img
            src={mode === 'pre' ? baguaEarlierUrl : baguaLaterUrl}
            alt={mode === 'pre' ? '先天八卦方位图' : '后天八卦方位图'}
            className="w-full h-auto rounded-full select-none"
            draggable={false}
          />
        </div>

        {/* 卦名选择（点击查看详情） */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {currentTrigrams.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTrigram(selectedTrigram === t ? null : t)}
              className={`w-10 h-10 flex items-center justify-center font-brush text-lg border transition-all ${
                selectedTrigram === t
                  ? 'bg-imperial-red text-white border-imperial-red shadow-lg scale-110'
                  : 'bg-white/80 border-ink-black/20 text-ink-black/80 hover:border-imperial-red/50 hover:text-imperial-red'
              }`}
              title={`${t} · ${TRIGRAM_DETAILS[t].element}${TRIGRAM_DETAILS[t].nature}`}
            >
              {t}
            </button>
          ))}
        </div>
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
                  <span className="text-[9px] opacity-40 font-bold">{mode === 'pre' ? `先天 ${currentDetails.prePosition}` : `后天 ${currentDetails.postPosition}`}</span>
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
          <div className="p-10 flex flex-col items-center justify-center border border-dashed border-ink-black/10 rounded-sm">
            <Info className="w-4 h-4 text-ink-black/10 mb-2" />
            <div className="text-ink-black/25 text-[10px] italic tracking-widest uppercase">
              点击下方卦名，开启易理秘境
            </div>
            <p className="text-[9px] text-ink-black/20 mt-2 max-w-[220px] text-center">
              先天为体 (The Essence), 后天为用 (The Application)。<br/>
              五行生克衍生六亲：官鬼、妻财、父母、兄弟、子孙。
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
