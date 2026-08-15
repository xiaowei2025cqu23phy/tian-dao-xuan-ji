import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, CalendarCheck, Sparkles, ShieldAlert } from 'lucide-react';
import { getMonthZeri, MATTERS, ZeriItem } from '../lib/zeri-service';

const WEEK_HEAD = ['日', '一', '二', '三', '四', '五', '六'];

function scoreStyle(item: ZeriItem): { bg: string; text: string; border: string } {
  if (item.isTop) return { bg: 'bg-imperial-red', text: 'text-white', border: 'border-imperial-red' };
  if (item.score >= 60 && item.suitable) return { bg: 'bg-[#2d5a27]/10', text: 'text-[#2d5a27]', border: 'border-[#2d5a27]/30' };
  if (item.score >= 40) return { bg: 'bg-amber-gold/10', text: 'text-[#7c512d]', border: 'border-amber-gold/25' };
  return { bg: 'bg-ink-black/[0.02]', text: 'text-ink-black/30', border: 'border-ink-black/5' };
}

export default function ZeririSection() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [matter, setMatter] = useState('嫁娶');
  const [selected, setSelected] = useState<ZeriItem | null>(null);

  const items = useMemo(() => getMonthZeri(year, month, matter), [year, month, matter]);
  const topList = items.filter(i => i.suitable).sort((a, b) => b.score - a.score).slice(0, 3);
  const weekStart = new Date(year, month - 1, 1).getDay();

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelected(null);
  };

  return (
    <div className="space-y-10">
      {/* 头部 */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="w-14 h-14 rounded-full bg-imperial-red/5 border border-imperial-red/20 flex items-center justify-center">
          <CalendarCheck className="w-6 h-6 text-imperial-red" />
        </div>
        <div>
          <h2 className="font-brush text-4xl text-ink-black tracking-[0.2em]">择吉日</h2>
          <p className="text-[11px] opacity-40 tracking-[0.3em] font-bold uppercase mt-2">AUSPICIOUS DAYS · 趋吉避凶</p>
        </div>

        {/* 事项选择 */}
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
          {Object.keys(MATTERS).map(m => (
            <button
              key={m}
              onClick={() => { setMatter(m); setSelected(null); }}
              className={`px-4 py-2 text-[11px] tracking-widest border transition-all ${matter === m ? 'bg-imperial-red text-white border-imperial-red shadow-md' : 'bg-white/80 border-ink-black/30 text-ink-black/75 hover:border-imperial-red/50'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 月份导航 */}
      <div className="flex items-center justify-center gap-6">
        <button onClick={() => shiftMonth(-1)} className="p-2 border border-ink-black/25 hover:border-ink-black/60 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-2xl font-brush tracking-widest text-ink-black">{year} 年 {month} 月</div>
        <button onClick={() => shiftMonth(1)} className="p-2 border border-ink-black/25 hover:border-ink-black/60 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 吉日榜 */}
      {topList.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {topList.map((t, i) => (
            <div key={t.dateText} className={`px-4 py-2 rounded-sm border flex items-center gap-3 ${i === 0 ? 'bg-imperial-red/[0.06] border-imperial-red/30' : 'bg-white/70 border-ink-black/10'}`}>
              <span className={`text-[10px] font-bold ${i === 0 ? 'text-imperial-red' : 'text-ink-black/50'}`}>{['上吉', '次吉', '三吉'][i]}</span>
              <span className="text-sm font-bold text-ink-black">{t.dateText.replace(/-/g, '.')}</span>
              <span className="text-[10px] text-ink-black/45 font-serif-sc">{t.lunarText}</span>
              <span className="text-[10px] font-bold text-imperial-red">{t.score}分</span>
            </div>
          ))}
        </div>
      )}

      {/* 日历 */}
      <div className="scroll-surface p-6 md:p-8 relative overflow-hidden">
        <div className="lattice-corner lattice-tl opacity-10" />
        <div className="lattice-corner lattice-br opacity-10" />
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEK_HEAD.map(w => (
            <div key={w} className="text-center text-[10px] tracking-widest font-bold opacity-40 py-1">周{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: weekStart }).map((_, i) => <div key={`e${i}`} />)}
          {items.map(item => {
            const s = scoreStyle(item);
            return (
              <button
                key={item.dateText}
                onClick={() => setSelected(item)}
                className={`p-2 border rounded-sm text-left transition-all hover:scale-[1.04] hover:shadow-md ${s.bg} ${s.border} ${selected?.dateText === item.dateText ? 'ring-2 ring-imperial-red/40' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${s.text}`}>{item.dateText.split('-')[2]}</span>
                  {item.isTop && <Sparkles className="w-3 h-3 text-imperial-red" />}
                </div>
                <div className={`text-[9px] mt-0.5 ${s.text} opacity-70 font-serif-sc`}>{item.lunarDay}</div>
                <div className={`text-[8px] ${s.text} opacity-50 font-mono`}>{item.ganZhi}</div>
                <div className={`mt-1 text-[9px] font-bold ${item.suitable ? (item.isTop ? 'text-white' : 'text-[#2d5a27]') : 'text-ink-black/30'}`}>
                  {item.score}分
                </div>
              </button>
            );
          })}
        </div>

        {/* 图例 */}
        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-ink-black/5 text-[9px] opacity-60">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-imperial-red rounded-sm" /> 上吉（本月最佳）</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#2d5a27]/15 border border-[#2d5a27]/40 rounded-sm" /> 适宜</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-gold/15 border border-amber-gold/30 rounded-sm" /> 平</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-ink-black/5 border border-ink-black/10 rounded-sm" /> 不宜</span>
        </div>
      </div>

      {/* 选中日详情 */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="scroll-surface p-8 relative overflow-hidden"
          >
            <div className="lattice-corner lattice-tl" />
            <div className="lattice-corner lattice-tr" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-black/10 pb-5 mb-5">
              <div className="flex items-center gap-5">
                <div className="font-brush text-5xl text-ink-black">{selected.dateText.split('-')[2]}</div>
                <div className="space-y-1">
                  <div className="text-sm font-bold tracking-widest">{selected.dateText} · {selected.ganZhi}日</div>
                  <div className="text-[10px] opacity-50 font-serif-sc">{selected.lunarText}</div>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-sm border text-sm font-bold ${selected.suitable ? 'bg-[#2d5a27]/10 text-[#2d5a27] border-[#2d5a27]/30' : 'bg-ink-black/[0.03] text-ink-black/40 border-ink-black/10'}`}>
                {selected.score} 分 · {selected.suitable ? '宜' : '慎'}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-[11px]">
              <div className="p-4 bg-imperial-red/[0.03] border border-imperial-red/10 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-imperial-red" />
                  <span className="font-bold text-imperial-red text-[10px] tracking-widest">所宜（含事项命中）</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.length > 0 ? selected.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-white border border-imperial-red/20 text-ink-black/70">{t}</span>
                  )) : <span className="opacity-40 italic">当日宜项未直接命中，详见全宜</span>}
                </div>
              </div>
              <div className="p-4 bg-ink-black/[0.02] border border-ink-black/5 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-ink-black/50" />
                  <span className="font-bold text-ink-black/50 text-[10px] tracking-widest">所忌</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.ji.length > 0 ? selected.ji.map(j => (
                    <span key={j} className="px-2 py-0.5 bg-white border border-ink-black/10 text-ink-black/50">{j}</span>
                  )) : <span className="opacity-40 italic">无大忌</span>}
                </div>
              </div>
              <div className="p-4 bg-white/60 border border-ink-black/5 rounded-sm space-y-1.5 text-[10px]">
                <div className="flex justify-between"><span className="opacity-40">值日天神</span><span className={selected.tianShenType === '黄道' ? 'text-imperial-red font-bold' : 'font-bold'}>{selected.tianShen}（{selected.tianShenType}）</span></div>
                <div className="flex justify-between"><span className="opacity-40">建除值星</span><span className="font-bold">{selected.zhiXing}</span></div>
                <div className="flex justify-between"><span className="opacity-40">综合评分</span><span className="font-bold">{selected.score} / 100</span></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[9px] opacity-40 tracking-[0.3em] font-bold uppercase">
        择日依据黄历宜忌、黄道黑道、建除十二值与冲月综合评定 · 仅供参考
      </p>
    </div>
  );
}
