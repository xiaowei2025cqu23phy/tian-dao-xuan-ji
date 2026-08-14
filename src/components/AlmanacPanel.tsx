import React, { useState } from 'react';
import { CalendarDays, Sparkles, ShieldAlert } from 'lucide-react';
import { getTodayAlmanac } from '../lib/almanac-service';

export default function AlmanacPanel() {
  const [data] = useState(() => getTodayAlmanac());
  const isHuangDao = data.tianShenType === '黄道';

  const positions: { key: keyof typeof data.positions; label: string }[] = [
    { key: 'xi', label: '喜神' },
    { key: 'cai', label: '财神' },
    { key: 'fu', label: '福神' },
    { key: 'yangGui', label: '阳贵' },
    { key: 'yinGui', label: '阴贵' },
  ];

  return (
    <section className="scroll-surface w-full max-w-7xl px-6 md:px-12 py-10 md:py-12 relative overflow-hidden z-10">
      <div className="lattice-corner lattice-tl opacity-10" />
      <div className="lattice-corner lattice-tr opacity-10" />
      <div className="lattice-corner lattice-bl opacity-10" />
      <div className="lattice-corner lattice-br opacity-10" />

      <div className="flex items-center gap-4 mb-8">
        <div className="w-2 h-2 border border-ink-black rotate-45" />
        <span className="text-[10px] uppercase tracking-widest opacity-60">今日黄历 · DAILY ALMANAC</span>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-ink-black/30 to-transparent" />
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* 左侧：日期主信息 */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-start gap-4">
            <div className="text-6xl font-brush text-imperial-red leading-none">{data.dayGanZhi}</div>
            <div className="space-y-1 pt-1">
              <div className="text-lg font-bold tracking-widest">{data.lunarDate}</div>
              <div className="text-[10px] opacity-50 tracking-[0.3em] font-bold uppercase">
                {data.solar} · {data.week}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] px-2.5 py-1 bg-ink-black text-white tracking-widest font-bold">生肖 {data.shengXiao}</span>
            <span className="text-[10px] px-2.5 py-1 bg-imperial-red/10 text-imperial-red border border-imperial-red/20 tracking-widest font-bold">
              年柱 {data.yearGanZhi}
            </span>
            <span className="text-[10px] px-2.5 py-1 bg-ink-black/5 border border-ink-black/10 tracking-widest font-bold">
              月柱 {data.monthGanZhi}
            </span>
            {data.jieQi && (
              <span className="text-[10px] px-2.5 py-1 bg-amber-gold/15 text-amber-gold border border-amber-gold/30 tracking-widest font-bold">
                ✦ 今日节气：{data.jieQi}
              </span>
            )}
            {data.festivals.map(f => (
              <span key={f} className="text-[10px] px-2.5 py-1 bg-imperial-red text-white tracking-widest font-bold">{f}</span>
            ))}
            {data.otherFestivals.map(f => (
              <span key={f} className="text-[10px] px-2.5 py-1 bg-ink-black/10 tracking-widest font-bold">{f}</span>
            ))}
          </div>

          <div className="p-4 bg-ink-black/[0.02] border border-ink-black/5 rounded-sm text-[10px] leading-relaxed text-ink-black/50 font-serif-sc">
            {data.currentJieQi ? `时值「${data.currentJieQi}」节气，天时流转，顺时而动。` : '天时平顺，宜静观其变。'}
          </div>
        </div>

        {/* 右侧：宜忌与吉神凶煞 */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-5 bg-imperial-red/[0.03] border border-imperial-red/10 rounded-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-imperial-red" />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-imperial-red">今日所宜</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.yi.length > 0 ? data.yi.map(y => (
                  <span key={y} className="text-[10px] px-2 py-1 bg-white border border-imperial-red/15 text-ink-black/70">{y}</span>
                )) : <span className="text-[10px] opacity-40 italic">诸事平和，无所不宜</span>}
              </div>
            </div>
            <div className="p-5 bg-ink-black/[0.02] border border-ink-black/5 rounded-sm">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-3.5 h-3.5 text-ink-black/50" />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink-black/50">今日所忌</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.ji.length > 0 ? data.ji.map(j => (
                  <span key={j} className="text-[10px] px-2 py-1 bg-white border border-ink-black/10 text-ink-black/50">{j}</span>
                )) : <span className="text-[10px] opacity-40 italic">无大忌，从容行事</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
            <div className="p-3 border border-ink-black/5 bg-white/50">
              <span className="block opacity-40 tracking-widest font-bold mb-1.5">吉神宜趋</span>
              <span className="text-imperial-red font-serif-sc leading-relaxed">{data.jiShen || '—'}</span>
            </div>
            <div className="p-3 border border-ink-black/5 bg-white/50">
              <span className="block opacity-40 tracking-widest font-bold mb-1.5">凶煞宜忌</span>
              <span className="font-serif-sc leading-relaxed">{data.xiongSha || '—'}</span>
            </div>
            <div className="p-3 border border-ink-black/5 bg-white/50">
              <span className="block opacity-40 tracking-widest font-bold mb-1.5">冲煞</span>
              <span className="font-serif-sc leading-relaxed">冲{data.chong} · 煞{data.sha}</span>
            </div>
            <div className="p-3 border border-ink-black/5 bg-white/50">
              <span className="block opacity-40 tracking-widest font-bold mb-1.5">值星 / 天神</span>
              <span className="font-serif-sc leading-relaxed">
                {data.zhiXing}日 · {data.tianShen}
                <span className={`ml-1 font-bold ${isHuangDao ? 'text-imperial-red' : 'text-ink-black/40'}`}>
                  ({data.tianShenType})
                </span>
              </span>
            </div>
            <div className="p-3 border border-ink-black/5 bg-white/50">
              <span className="block opacity-40 tracking-widest font-bold mb-1.5">二十八宿</span>
              <span className="font-serif-sc leading-relaxed">{data.xiu}宿 · {data.xiuAnimal}</span>
            </div>
            <div className="p-3 border border-ink-black/5 bg-white/50">
              <span className="block opacity-40 tracking-widest font-bold mb-1.5">旬空</span>
              <span className="font-serif-sc leading-relaxed">{data.xun} · {data.xunKong}</span>
            </div>
            <div className="p-3 border border-ink-black/5 bg-white/50">
              <span className="block opacity-40 tracking-widest font-bold mb-1.5">彭祖百忌</span>
              <span className="font-serif-sc leading-relaxed">{data.pengZu || '—'}</span>
            </div>
            <div className="p-3 border border-ink-black/5 bg-white/50">
              <span className="block opacity-40 tracking-widest font-bold mb-1.5">神煞方位</span>
              <span className="font-serif-sc leading-relaxed">
                {positions.map(p => `${p.label}${data.positions[p.key] || '?'}`).join(' · ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-5 border-t border-ink-black/5 flex items-center gap-3 text-[9px] opacity-40 tracking-[0.3em] font-bold uppercase">
        <CalendarDays className="w-3 h-3" />
        <span>黄历数据依据中华传统历法推算 · 仅供参考</span>
      </div>
    </section>
  );
}
