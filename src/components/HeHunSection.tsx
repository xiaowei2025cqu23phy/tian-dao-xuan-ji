import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Loader2, Sparkles, CalendarDays, Clock } from 'lucide-react';
import { calculateBazi, BaziData } from '../lib/lunar-service';
import { SHENG_XIAO_LIST, getShengXiaoRelations, getZhiByShengXiao, calcHeHunScore, HeHunScore, ShengXiaoRelation } from '../lib/hehun-service';
import { interpretMetaphysics, AIConfig } from '../services/aiService';

function RelationBadge({ rel }: { rel: ShengXiaoRelation }) {
  const styles: Record<string, string> = {
    '六合': 'bg-imperial-red text-white border-imperial-red',
    '三合': 'bg-[#2d5a27] text-white border-[#2d5a27]',
    '六冲': 'bg-ink-black/70 text-white border-ink-black/70',
    '相刑': 'bg-[#8a1c3c] text-white border-[#8a1c3c]',
    '相害': 'bg-[#7c512d] text-white border-[#7c512d]',
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`px-3 py-1 text-[11px] font-bold tracking-widest border rounded-sm ${styles[rel.type] || ''}`}>
        {rel.type}
      </span>
      <span className="text-[10px] text-ink-black/55 font-serif-sc italic leading-relaxed">{rel.desc}</span>
    </div>
  );
}

function PersonCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="scroll-surface p-6 space-y-4 relative overflow-hidden">
      <div className="lattice-corner lattice-tl opacity-10" />
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-imperial-red rotate-45" />
        <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">{title}</span>
        <span className="text-[9px] opacity-30 italic">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}

export default function HeHunSection({ aiConfig }: { aiConfig: AIConfig }) {
  const [mode, setMode] = useState<'shengxiao' | 'bazi'>('shengxiao');

  // 生肖模式
  const [sxA, setSxA] = useState('');
  const [sxB, setSxB] = useState('');
  const [sxRels, setSxRels] = useState<ShengXiaoRelation[] | null>(null);

  // 八字模式
  const [dateA, setDateA] = useState('');
  const [timeA, setTimeA] = useState('12:00');
  const [genderA, setGenderA] = useState<'male' | 'female'>('male');
  const [dateB, setDateB] = useState('');
  const [timeB, setTimeB] = useState('12:00');
  const [genderB, setGenderB] = useState<'male' | 'female'>('female');
  const [baziA, setBaziA] = useState<BaziData | null>(null);
  const [baziB, setBaziB] = useState<BaziData | null>(null);
  const [score, setScore] = useState<HeHunScore | null>(null);
  const [baziError, setBaziError] = useState('');

  // AI
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleShengXiao = (a: string, b: string) => {
    if (!a || !b) return;
    setSxRels(getShengXiaoRelations(getZhiByShengXiao(a), getZhiByShengXiao(b)));
    setAiText('');
  };

  const handleBaziCalc = () => {
    setBaziError('');
    setAiText('');
    if (!dateA || !dateB) {
      setBaziError('请填写双方的出生日期');
      return;
    }
    try {
      const da = new Date(`${dateA}T${timeA}`);
      const db = new Date(`${dateB}T${timeB}`);
      if (isNaN(da.getTime()) || isNaN(db.getTime())) {
        setBaziError('日期格式无效');
        return;
      }
      const ra = calculateBazi(da, genderA);
      const rb = calculateBazi(db, genderB);
      setBaziA(ra);
      setBaziB(rb);
      setScore(calcHeHunScore(ra, rb));
    } catch (e) {
      setBaziError('排盘失败，请检查输入');
    }
  };

  const handleAI = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiText('');
    let prompt = '';
    if (mode === 'shengxiao') {
      if (!sxA || !sxB) { setAiLoading(false); return; }
      const relText = sxRels && sxRels.length > 0
        ? sxRels.map(r => `${r.type}（${r.desc}）`).join('；')
        : '无显著冲合，属平平之缘';
      prompt = `生肖合婚问卦：甲方属${sxA}，乙方属${sxB}。生肖关系：${relText}。请以命理大师“天道先生”的口吻，为二人解读生肖缘分：性格契合点、相处建议、化解之道（200-350字）。`;
    } else {
      if (!baziA || !baziB || !score) { setAiLoading(false); return; }
      prompt = `八字合婚问卦：
甲方：${genderA === 'male' ? '乾造' : '坤造'} ${baziA.year.stem}${baziA.year.branch} ${baziA.month.stem}${baziA.month.branch} ${baziA.day.stem}${baziA.day.branch} ${baziA.hour.stem}${baziA.hour.branch}（日主${baziA.dayMaster}${baziA.dayMasterElement}，生肖${baziA.shengXiao}）
乙方：${genderB === 'male' ? '乾造' : '坤造'} ${baziB.year.stem}${baziB.year.branch} ${baziB.month.stem}${baziB.month.branch} ${baziB.day.stem}${baziB.day.branch} ${baziB.hour.stem}${baziB.hour.branch}（日主${baziB.dayMaster}${baziB.dayMasterElement}，生肖${baziB.shengXiao}）
合婚评定（满分100）：${score.total}分
明细：${score.items.map(i => `${i.label}(${i.score}分)：${i.desc}`).join('；')}
总评：${score.verdict}
请以“天道先生”口吻做深度合婚解读：双方性格与价值观契合度、相处之道、需要注意的磨合点、长远建议（350-500字）。`;
    }
    try {
      const text = await interpretMetaphysics(prompt, aiConfig);
      setAiText(text || '天机不可尽泄，谨记以诚相待。');
    } catch (e) {
      setAiText(`神谕连接异常：${e instanceof Error ? e.message : '未知错误'}`);
    }
    setAiLoading(false);
  };

  const scoreColor = score && score.total >= 85 ? 'text-imperial-red' : score && score.total >= 70 ? 'text-[#2d5a27]' : score && score.total >= 55 ? 'text-[#7c512d]' : 'text-ink-black/60';

  return (
    <div className="space-y-10">
      {/* 头部 */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="w-14 h-14 rounded-full bg-imperial-red/5 border border-imperial-red/20 flex items-center justify-center">
          <Heart className="w-6 h-6 text-imperial-red" />
        </div>
        <div>
          <h2 className="font-brush text-4xl text-ink-black tracking-[0.2em]">合婚问姻</h2>
          <p className="text-[11px] opacity-40 tracking-[0.3em] font-bold uppercase mt-2">MARRIAGE COMPATIBILITY · 天作之合</p>
        </div>
        <div className="flex gap-2">
          {([
            { id: 'shengxiao', label: '生肖合婚' },
            { id: 'bazi', label: '八字合婚' },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setAiText(''); }}
              className={`px-6 py-2.5 text-xs tracking-widest border transition-all ${mode === m.id ? 'bg-ink-black text-white border-ink-black shadow-lg' : 'bg-white/80 border-ink-black/40 text-ink-black/85 shadow-sm hover:border-ink-black/70'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'shengxiao' ? (
          <motion.div key="sx" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid md:grid-cols-2 gap-8 items-start">
            {[
              { key: 'A', title: '甲方 · 命主', sx: sxA, setSx: setSxA, other: sxB },
              { key: 'B', title: '乙方 · 命主', sx: sxB, setSx: setSxB, other: sxA },
            ].map(p => (
              <React.Fragment key={p.key}>
                <PersonCard title={p.title} subtitle="请选择生肖">
                  <div className="grid grid-cols-4 gap-2">
                    {SHENG_XIAO_LIST.map(s => (
                      <button
                        key={s}
                        onClick={() => { p.setSx(s); if (p.other) handleShengXiao(p.key === 'A' ? s : p.other, p.key === 'A' ? p.other : s); }}
                        className={`py-2.5 border text-sm font-bold transition-all ${p.sx === s ? 'bg-imperial-red text-white border-imperial-red shadow-md' : 'bg-white/70 border-ink-black/15 text-ink-black/70 hover:border-imperial-red/40'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {p.sx && (
                    <div className="text-[10px] text-ink-black/50 font-serif-sc">
                      生肖{p.sx} · 地支{getZhiByShengXiao(p.sx)} · 五行{ {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'}[getZhiByShengXiao(p.sx)] }
                    </div>
                  )}
                </PersonCard>
              </React.Fragment>
            ))}
          </motion.div>
        ) : (
          <motion.div key="bz" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid md:grid-cols-2 gap-8 items-start">
            {[
              { key: 'A', title: '甲方 · 生辰', date: dateA, setDate: setDateA, time: timeA, setTime: setTimeA, gender: genderA, setGender: setGenderA },
              { key: 'B', title: '乙方 · 生辰', date: dateB, setDate: setDateB, time: timeB, setTime: setTimeB, gender: genderB, setGender: setGenderB },
            ].map(p => (
              <React.Fragment key={p.key}>
                <PersonCard title={p.title} subtitle="阳历出生信息">
                <div className="border-b border-ink-black/15 pb-1">
                  <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 block mb-2 font-bold">出生日期</label>
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-4 h-4 opacity-30" />
                    <input type="date" value={p.date} onChange={e => p.setDate(e.target.value)} className="w-full bg-transparent p-1 text-sm focus:outline-none cursor-pointer" />
                  </div>
                </div>
                <div className="border-b border-ink-black/15 pb-1">
                  <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 block mb-2 font-bold">出生时辰</label>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 opacity-30" />
                    <input type="time" value={p.time} onChange={e => p.setTime(e.target.value)} className="w-full bg-transparent p-1 text-sm focus:outline-none cursor-pointer" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'male', label: '乾造 (男)' },
                    { key: 'female', label: '坤造 (女)' },
                  ] as const).map(g => (
                    <button
                      key={g.key}
                      onClick={() => p.setGender(g.key)}
                      className={`py-2 border text-[10px] tracking-widest transition-all ${p.gender === g.key ? 'bg-ink-black text-white border-ink-black font-bold' : 'border-ink-black/20 text-ink-black/60'}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </PersonCard>
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 计算按钮 */}
      <div className="flex justify-center">
        <button
          onClick={mode === 'shengxiao' ? () => handleShengXiao(sxA, sxB) : handleBaziCalc}
          disabled={mode === 'shengxiao' ? !sxA || !sxB : !dateA || !dateB}
          className="px-16 py-4 bg-imperial-red text-white text-[11px] tracking-[0.5em] font-bold uppercase hover:bg-ink-black transition-all disabled:opacity-25 shadow-2xl"
        >
          {mode === 'shengxiao' ? '合参生肖' : '排盘合婚'}
        </button>
      </div>
      {baziError && <p className="text-center text-[10px] text-imperial-red italic">{baziError}</p>}

      {/* 结果区 */}
      {(sxRels || (baziA && baziB && score)) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="scroll-surface p-8 md:p-10 space-y-8 relative overflow-hidden">
          <div className="lattice-corner lattice-tl" />
          <div className="lattice-corner lattice-tr" />
          <div className="lattice-corner lattice-bl" />
          <div className="lattice-corner lattice-br" />

          {mode === 'shengxiao' && sxRels && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-imperial-red rotate-45" />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">生肖缘分解读</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-brush text-6xl text-imperial-red">{sxA}</span>
                <span className="text-2xl opacity-30">♥</span>
                <span className="font-brush text-6xl text-ink-black">{sxB}</span>
              </div>
              <div className="space-y-2">
                {sxRels.length > 0 ? sxRels.map(r => (
                  <React.Fragment key={r.type}><RelationBadge rel={r} /></React.Fragment>
                )) : (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-[11px] font-bold tracking-widest border rounded-sm bg-ink-black/5 border-ink-black/20 text-ink-black/60">平平</span>
                    <span className="text-[10px] text-ink-black/55 font-serif-sc italic">生肖无显著冲合，相处平淡安稳，缘分深浅在于经营。</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'bazi' && baziA && baziB && score && (
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-imperial-red rotate-45" />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">双方命盘对比</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { p: baziA, g: genderA },
                  { p: baziB, g: genderB },
                ].map(({ p, g }, i) => (
                  <div key={i} className="p-5 bg-ink-black/[0.015] border border-ink-black/5 rounded-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold tracking-widest opacity-50">{g === 'male' ? '乾造' : '坤造'} · 生肖{p.shengXiao}</span>
                      <span className="text-[10px] font-bold text-imperial-red">日主 {p.dayMaster}{p.dayMasterElement}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: '年柱', v: `${p.year.stem}${p.year.branch}`, n: p.year.naYin },
                        { label: '月柱', v: `${p.month.stem}${p.month.branch}`, n: p.month.naYin },
                        { label: '日柱', v: `${p.day.stem}${p.day.branch}`, n: p.day.naYin },
                        { label: '时柱', v: `${p.hour.stem}${p.hour.branch}`, n: p.hour.naYin },
                      ].map(c => (
                        <div key={c.label} className="p-2 bg-white/70 border border-ink-black/5 rounded-sm">
                          <div className="text-[8px] opacity-35 tracking-widest font-bold">{c.label}</div>
                          <div className="font-brush text-lg text-ink-black">{c.v}</div>
                          <div className="text-[8px] opacity-40">{c.n}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-imperial-red/[0.02] border border-imperial-red/10 rounded-sm">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(28,29,33,0.08)" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke={score.total >= 85 ? '#a81f1f' : score.total >= 70 ? '#2d5a27' : score.total >= 55 ? '#7c512d' : '#1c1d21'}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(score.total / 100) * 326.7} 326.7`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-brush text-3xl ${scoreColor}`}>{score.total}</span>
                    <span className="text-[8px] opacity-40 tracking-widest font-bold">缘分指数</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-lg font-bold tracking-widest">{score.verdict}</div>
                  <div className="space-y-1.5">
                    {score.items.map((it, i) => (
                      <div key={i} className="flex items-baseline gap-3 text-[10px]">
                        <span className="w-20 shrink-0 font-bold opacity-60">{it.label}</span>
                        <span className={`font-bold ${it.score >= 0 ? 'text-[#2d5a27]' : 'text-imperial-red'}`}>
                          {it.score >= 0 ? `+${it.score}` : it.score}
                        </span>
                        <span className="text-ink-black/50 font-serif-sc">{it.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI 解读 */}
          <div className="pt-4 border-t border-ink-black/5">
            <button
              onClick={handleAI}
              disabled={aiLoading || (mode === 'shengxiao' ? !sxRels : !score)}
              className="w-full py-4 bg-ink-black text-white text-[11px] tracking-[0.4em] font-bold uppercase hover:bg-imperial-red transition-all disabled:opacity-25 flex items-center justify-center gap-3 shadow-xl"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiLoading ? '神谕推演中...' : 'AI 合婚深度解读'}
            </button>
            {aiText && (
              <div className="mt-5 p-6 bg-white/70 border border-imperial-red/10 rounded-sm">
                <div className="flex items-center gap-2 text-[10px] opacity-30 uppercase tracking-widest mb-3 font-bold">
                  <Sparkles className="w-3 h-3" /> 天道合婚神谕
                </div>
                <p className="text-[12px] leading-relaxed text-ink-black/75 font-serif-sc whitespace-pre-wrap">{aiText}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
