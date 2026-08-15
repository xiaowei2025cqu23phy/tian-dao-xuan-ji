import React, { useState } from 'react';
import { CalendarDays, Sparkles, ShieldAlert, Loader2 } from 'lucide-react';
import { getTodayAlmanac, TimeSlot } from '../lib/almanac-service';
import { interpretMetaphysics, AIConfig } from '../services/aiService';

const SHI_CHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 当前小时对应的时辰地支 */
function currentShiZhi(hour: number): string {
  return SHI_CHEN[Math.floor(((hour + 1) % 24) / 2)];
}

export default function AlmanacPanel({ aiConfig }: { aiConfig: AIConfig }) {
  const [data] = useState(() => getTodayAlmanac());
  const isHuangDao = data.tianShenType === '黄道';
  const nowZhi = currentShiZhi(new Date().getHours());

  const [qianReading, setQianReading] = useState('');
  const [qianLoading, setQianLoading] = useState(false);

  const handleQianAI = async () => {
    if (qianLoading) return;
    setQianLoading(true);
    setQianReading('');
    try {
      const text = await interpretMetaphysics(
        `我今日（${data.qian.dateText}）于“天道玄机”抽得第${data.qian.number}卦【${data.qian.hexName}卦】：
        卦辞：${data.qian.judgement}
        象意：${data.qian.meaning}
        请以“天道先生”的身份，为我解读今日之签运，给出简要的当日行动建议与心境指引（150-300字）。`,
        aiConfig,
      );
      setQianReading(text || '天机不可尽泄，谨记自强不息。');
    } catch (e: any) {
      setQianReading(`神谕连接异常：${e?.message || '未知错误'}`);
    }
    setQianLoading(false);
  };

  const positions: { key: keyof typeof data.positions; label: string }[] = [
    { key: 'xi', label: '喜神' },
    { key: 'cai', label: '财神' },
    { key: 'fu', label: '福神' },
    { key: 'yangGui', label: '阳贵' },
    { key: 'yinGui', label: '阴贵' },
  ];

  const renderSlot = (slot: TimeSlot) => {
    const isNow = slot.zhi === nowZhi;
    return (
      <div
        key={slot.zhi}
        className={`p-2.5 border rounded-sm text-[9px] transition-all ${isNow ? 'bg-imperial-red/[0.06] border-imperial-red/30 shadow-sm' : 'bg-white/60 border-ink-black/5'}`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`font-bold tracking-widest ${isNow ? 'text-imperial-red' : 'text-ink-black/70'}`}>{slot.zhi}时</span>
          {isNow && <span className="text-[8px] text-imperial-red font-bold">今</span>}
        </div>
        <div className="text-[8px] text-ink-black/35 font-mono mb-1.5">{slot.range}</div>
        {slot.yi.length > 0 && (
          <div className="leading-relaxed text-[#2d5a27]">
            <span className="font-bold">宜</span> {slot.yi.join(' ')}
          </div>
        )}
        {slot.ji.length > 0 && (
          <div className="leading-relaxed text-ink-black/40 mt-0.5">
            <span className="font-bold">忌</span> {slot.ji.join(' ')}
          </div>
        )}
        <div className="text-[8px] text-ink-black/30 mt-1">
          {slot.tianShen} · {slot.tianShenType}
        </div>
      </div>
    );
  };

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
        {/* 左侧：日期主信息 + 今日卦签 */}
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

          {/* 今日卦签 */}
          <div className="p-5 bg-imperial-red/[0.02] border border-imperial-red/10 rounded-sm space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-imperial-red" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-imperial-red">今日卦签 · DAILY QIAN</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-6xl font-calligraphy text-ink-black leading-none">{data.qian.symbol}</div>
              <div className="space-y-1">
                <div className="text-xl font-brush text-ink-black">第{data.qian.number}卦 · {data.qian.hexName}</div>
                <p className="text-[11px] text-ink-black/60 font-serif-sc italic leading-relaxed">{data.qian.judgement}</p>
                <p className="text-[10px] text-ink-black/45 font-serif-sc leading-relaxed">{data.qian.meaning}</p>
              </div>
            </div>
            <button
              onClick={handleQianAI}
              disabled={qianLoading}
              className="w-full py-2.5 bg-ink-black text-white text-[10px] tracking-[0.3em] font-bold uppercase hover:bg-imperial-red transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {qianLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {qianLoading ? '解签中...' : 'AI 解今日之签'}
            </button>
            {qianReading && (
              <p className="text-[10px] text-ink-black/65 leading-relaxed font-serif-sc border-t border-imperial-red/10 pt-3 whitespace-pre-wrap">
                {qianReading}
              </p>
            )}
          </div>
        </div>

        {/* 右侧：宜忌 / 吉神凶煞 / 吉时 */}
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

          {/* 十二时辰吉时表 */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1.5 h-1.5 bg-imperial-red rotate-45" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-50">十二时辰吉凶 · TIME SLOTS</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {data.timeSlots.map(renderSlot)}
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
