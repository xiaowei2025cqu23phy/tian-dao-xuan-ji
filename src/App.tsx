import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Moon, Sun, Settings } from 'lucide-react';
import { Lunar } from 'lunar-javascript';
import BaziSection from './components/BaziSection';
import IChingSection from './components/IChingSection';

import AISettingsModal from './components/AISettingsModal';
import { AIConfig, DEFAULT_AI_CONFIG } from './services/aiService';

// 农历十二月雅称（花月）
const POETIC_MONTHS: Record<number, string> = {
  1: '柳月', 2: '杏月', 3: '桃月', 4: '槐月', 5: '榴月', 6: '荷月',
  7: '巧月', 8: '桂月', 9: '菊月', 10: '阳月', 11: '葭月', 12: '梅月',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'bazi' | 'iching'>('bazi');
  // 依当前时刻动态推算岁次与农历月（避免硬编码过时）
  const [era] = useState(() => {
    const l = Lunar.fromDate(new Date());
    return {
      year: l.getYearInGanZhi(),
      month: l.getMonthInChinese(),
      poetic: POETIC_MONTHS[Math.abs(l.getMonth())] || '',
    };
  });
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem('ai_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_AI_CONFIG;
      }
    }
    return DEFAULT_AI_CONFIG;
  });
  const [showSettings, setShowSettings] = useState(false);

  const saveConfig = (newConfig: AIConfig) => {
    setAiConfig(newConfig);
    localStorage.setItem('ai_config', JSON.stringify(newConfig));
  };

  return (
    <div className="min-h-screen text-ink-black font-serif-sc selection:bg-amber-gold/30 relative flex flex-col items-center p-8 overflow-x-hidden taoji-pattern pb-24">
      {/* Ancient Framing */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="lattice-corner lattice-tl m-4 border-ink-black/20" />
        <div className="lattice-corner lattice-tr m-4 border-ink-black/20" />
        <div className="lattice-corner lattice-bl m-4 border-ink-black/20" />
        <div className="lattice-corner lattice-br m-4 border-ink-black/20" />
      </div>

      {/* Ink Wash Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ink-black/5 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-imperial-red/[0.04] rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Plum Blossom Poetry Accent */}
      <div className="fixed right-12 top-1/4 vertical-text font-serif-sc text-sm opacity-20 tracking-[1em] pointer-events-none select-none italic text-imperial-red font-bold">
        墙角数枝梅<br/>凌寒独自开<br/>遥知不是雪<br/>为有暗香来
      </div>

      {/* Brush Accents in Background */}
      <div className="fixed top-20 left-20 brush-accent text-[25vw] opacity-[0.05] text-ink-black">乾</div>
      <div className="fixed bottom-20 right-20 brush-accent text-[25vw] opacity-[0.05] text-imperial-red">坤</div>

      <div className="fixed inset-8 border border-ink-black/5 pointer-events-none z-50"></div>

      {/* Bagua Animated Ring Background */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bagua-ring opacity-[0.06] pointer-events-none z-0" />

      {/* Settings Panel */}
      <div className="fixed top-8 right-8 z-[60] flex items-center gap-4">
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2.5 border border-ink-black/10 bg-white/90 rounded-full hover:bg-white transition-all text-ink-black shadow-xl backdrop-blur-md flex items-center gap-2 group"
          title="AI服务配置"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span className="text-[10px] hidden sm:block font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">{aiConfig.provider}</span>
        </button>
      </div>

      <AISettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={aiConfig}
        onSave={saveConfig}
      />

      <header className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center md:items-end mb-20 px-6 md:px-12 z-10 gap-12 mt-16">
        <div className="flex flex-col text-center md:text-left relative">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="text-7xl md:text-9xl font-brush tracking-[0.2em] mb-4 text-ink-black ink-glow drop-shadow-sm"
          >
            天道玄机
          </motion.h1>
          <div className="flex items-center gap-6 text-[13px] tracking-[0.6em] opacity-60 justify-center md:justify-start font-bold text-imperial-red">
            <span>梅香透骨</span>
            <div className="w-16 h-[1px] bg-imperial-red/20" />
            <span>格物致知</span>
          </div>
        </div>
        
        <div className="text-center md:text-right border-l-0 md:border-l border-ink-black/10 pl-0 md:pl-10 space-y-2">
          <div className="text-5xl font-calligraphy text-ink-black/90">岁次 {era.year}年</div>
          <div className="text-sm opacity-50 tracking-[0.4em] font-bold text-imperial-red">{era.month}{era.poetic ? ` · ${era.poetic}` : ''}</div>
        </div>
      </header>

      <main className="w-full max-w-7xl flex-1 z-10 mb-20 px-6 md:px-12">
        {/* Tab Navigation (Classical Style) */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
          <div className="flex p-2.5 border border-ink-black/10 bg-white/50 shadow-2xl backdrop-blur-md relative group rounded-sm ring-1 ring-white/20">
            <button
               onClick={() => setActiveTab('bazi')}
               className={`w-44 md:w-64 py-5 transition-all text-[15px] tracking-[0.6em] font-bold relative z-10 ${activeTab === 'bazi' ? 'bg-ink-black text-white shadow-2xl scale-[1.02]' : 'text-ink-black/40 hover:text-ink-black/70'}`}
            >
              生辰八字
            </button>
            <button
               onClick={() => setActiveTab('iching')}
               className={`w-44 md:w-64 py-5 transition-all text-[15px] tracking-[0.6em] font-bold relative z-10 ${activeTab === 'iching' ? 'bg-ink-black text-white shadow-2xl scale-[1.02]' : 'text-ink-black/40 hover:text-ink-black/70'}`}
            >
              周易起卦
            </button>
          </div>
          
          <div className="flex items-center gap-6 opacity-40 text-[11px] tracking-[0.5em] font-bold transition-all hover:opacity-100">
            <span>格物致知</span>
            <div className="w-2 h-2 bg-imperial-red rotate-45 shadow-[0_0_10px_rgba(139,28,28,0.3)]" />
            <span>通灵演化</span>
            <div className="w-2 h-2 bg-imperial-red rotate-45 shadow-[0_0_10px_rgba(139,28,28,0.3)]" />
            <span>合万化一</span>
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {activeTab === 'bazi' ? (
              <motion.div
                key="bazi"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <BaziSection aiConfig={aiConfig} />
              </motion.div>
            ) : (
              <motion.div
                key="iching"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <IChingSection aiConfig={aiConfig} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="w-full max-w-7xl px-12 py-12 flex flex-col md:flex-row justify-between items-center gap-8 z-10 border-t border-dark-gold/10 mt-12 bg-white/20 backdrop-blur-sm">
        <div className="flex flex-wrap justify-center gap-8 text-[10px] tracking-[0.3em] font-bold uppercase opacity-50">
          <span>梅花易数 MEIHUA</span>
          <span className="hidden md:inline">·</span>
          <span>河图洛书 COSMOLOGY</span>
          <span className="hidden md:inline">·</span>
          <span>纳甲排盘 NAJIA</span>
        </div>
        <div className="text-[10px] tracking-[0.2em] opacity-40 font-bold uppercase">
          © {new Date().getFullYear()} · 天道玄机 · 顺天应人 · HEAVENLY DECRYPT
        </div>
      </footer>
    </div>
  );
}
