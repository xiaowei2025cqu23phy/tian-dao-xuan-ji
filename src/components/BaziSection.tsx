import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateBazi, BaziData } from '../lib/lunar-service';
import { FIVE_ELEMENTS_ADVICE } from '../lib/bazi-data';
import { Calendar, User, Info, Loader2, Sparkles, RefreshCw, Send, MessageSquare, BookOpen, Clock } from 'lucide-react';
import { interpretMetaphysics, getOfflineBaziAnalysis, AIConfig, ChatMessage, QUESTION_CATEGORIES } from '../services/aiService';

import { WuXingCycle } from './WuXingCycle';

export default function BaziSection({ aiConfig }: { aiConfig: AIConfig }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('12:00');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [result, setResult] = useState<BaziData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [customQuestion, setCustomQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [baseAnalysis, setBaseAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [followUp, setFollowUp] = useState('');

  const handleCalculate = async () => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      // Small tick to allow UI to show loading state
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const fullDate = new Date(`${date}T${time}`);
      if (isNaN(fullDate.getTime())) {
        throw new Error("无效的日期或时间格式");
      }

      const data = calculateBazi(fullDate, gender);
      setResult(data);
      setBaseAnalysis(getOfflineBaziAnalysis(data.dayMaster));
      setChatHistory([]);
    } catch (error) {
      console.error("Bazi calculation failed:", error);
      setError("排盘计算失败，请检查日期格式是否正确。");
    } finally {
      setLoading(false);
    }
  };

  const handleAIInterpret = async () => {
    if (!result) return;
    setAiLoading(true);
    const categoryLabel = QUESTION_CATEGORIES.find(c => c.id === selectedCategory)?.label || '综合';
    const initialPrompt = `八字格局如下：
    年：${result.year.stem}${result.year.branch} (${result.year.element})
    月：${result.month.stem}${result.month.branch} (${result.month.element}) - 月令：${result.monthCommand.branch}${result.monthCommand.element}
    日：${result.day.stem}${result.day.branch} (${result.day.element})
    时：${result.hour.stem}${result.hour.branch} (${result.hour.element})
    日主：${result.dayMaster}
    性别：${gender === 'male' ? '乾造' : '坤造'}
    月令影响：${result.monthCommand.impact}
    五行旺衰：${Object.entries(result.monthCommand.strength).map(([el, st]) => `${el}(${st})`).join('、')}
    用户关注领域：${categoryLabel}
    ${customQuestion ? `用户具体问题：${customQuestion}` : ''}
    请结合月令司令对各元素及其强弱的影响，进行深度命理分析。`;
    
    try {
      const analysis = await interpretMetaphysics(initialPrompt, aiConfig);
      if (analysis) {
        setChatHistory([
          { role: 'user', content: customQuestion || `请就${categoryLabel}进行分析` },
          { role: 'assistant', content: analysis }
        ]);
      } else {
        setChatHistory([{ role: 'assistant', content: '天机暂不可泄，建议查看下方基础解析。' }]);
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

  const getElementColor = (el: string) => {
    const colors: Record<string, string> = {
      '金': 'text-[#8a8a8a]', // Silver Gray
      '木': 'text-[#2d5a27]', // Forest Green
      '水': 'text-[#1e3a8a]', // Deep Azure
      '火': 'text-[#c23b22]', // Vermilion
      '土': 'text-[#7c512d]'  // Earth Ochre
    };
    return colors[el] || 'text-ink-black';
  };

  const getElementBg = (el: string) => {
    const colors: Record<string, string> = {
      '金': 'bg-gradient-to-t from-[#8a8a8a] to-[#d1d1d1]',
      '木': 'bg-gradient-to-t from-[#2d5a27] to-[#4ade80]',
      '水': 'bg-gradient-to-t from-[#1e3a8a] to-[#60a5fa]',
      '火': 'bg-gradient-to-t from-[#c23b22] to-[#fb7185]',
      '土': 'bg-gradient-to-t from-[#7c512d] to-[#fbbf24]'
    };
    return colors[el] || 'bg-ink-black';
  };

  return (
    <div className="space-y-12">
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Input Card - Manuscript Style */}
        <section className="md:col-span-4 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-2 h-2 border border-ink-black rotate-45" />
            <span className="text-[10px] uppercase tracking-widest opacity-60">生辰档案</span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-ink-black/30 to-transparent"></div>
          </div>
          
          <div className="scroll-surface p-8 space-y-8 relative overflow-hidden">
            <div className="lattice-corner lattice-tl opacity-10" />
            <div className="lattice-corner lattice-br opacity-10" />
            
            <div className="brush-accent absolute -right-2 -bottom-2 text-6xl">辰</div>
            
            <div className="space-y-6 relative z-10">
              {/* Question Category Selection */}
              <div>
                <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 block mb-3 font-bold">咨询范畴</label>
                <div className="grid grid-cols-2 gap-2">
                  {QUESTION_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2 py-2 border text-[9px] tracking-tighter transition-all flex items-center gap-1 ${selectedCategory === cat.id ? 'bg-ink-black text-white border-ink-black' : 'border-ink-black/20 text-ink-black/65 hover:border-ink-black/40 hover:text-ink-black'}`}
                    >
                      {cat.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-b border-ink-black/20 pb-1 focus-within:border-ink-black transition-all">
                <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 block mb-2 font-bold">出生日期</label>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 opacity-30 text-ink-black" />
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent p-1 text-sm text-ink-black focus:outline-none uppercase tracking-widest cursor-pointer"
                  />
                </div>
              </div>

              <div className="border-b border-ink-black/20 pb-1 focus-within:border-ink-black transition-all">
                <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 block mb-2 font-bold">生辰之时</label>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 opacity-30 text-ink-black" />
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-transparent p-1 text-sm text-ink-black focus:outline-none tracking-widest cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 block mb-4 font-bold">性别乾坤</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'male', label: '乾造 (男)' },
                    { key: 'female', label: '坤造 (女)' }
                  ].map(g => (
                    <button 
                      key={g.key}
                      onClick={() => setGender(g.key as any)}
                      className={`py-3 border text-[10px] tracking-widest transition-all ${gender === g.key ? 'bg-ink-black text-white border-ink-black font-bold shadow-lg' : 'border-ink-black/25 text-ink-black/75 hover:border-ink-black/50'}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Question Input */}
              <div className="pt-2">
                <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 block mb-2 font-bold">心中所惑 (可选)</label>
                <textarea
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="请输入您的具体困惑..."
                  className="w-full bg-ink-black/5 border border-ink-black/10 p-3 text-[10px] text-ink-black focus:outline-none focus:border-ink-black/30 h-20 resize-none placeholder:opacity-20"
                />
              </div>
            </div>

            <button 
              onClick={handleCalculate}
              disabled={loading || !date}
              className="w-full py-4 bg-imperial-red text-white text-[11px] tracking-[0.5em] font-bold uppercase hover:bg-ink-black transition-all disabled:opacity-20 relative group overflow-hidden shadow-xl"
            >
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    命理推演中...
                  </span>
                ) : "推演排盘"}
              </span>
              <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform" />
            </button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-imperial-red/10 border border-imperial-red/20 text-imperial-red text-[10px] italic font-serif-sc"
              >
                {error}
              </motion.div>
            )}
          </div>
        </section>

        {/* Results Section - Temple Display Style */}
        <section className="md:col-span-8 flex flex-col min-h-[500px]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-2 h-2 border border-ink-black rotate-45" />
            <span className="text-[10px] uppercase tracking-widest opacity-60">命盘结果</span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-ink-black/30 to-transparent"></div>
          </div>

          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center scroll-surface p-12 opacity-30 italic text-xs space-y-6"
              >
                <div className="w-16 h-16 border border-ink-black/20 flex items-center justify-center rotate-45">
                  <User className="w-8 h-8 rotate-[-45deg] stroke-1" />
                </div>
                <p className="tracking-[0.3em] uppercase">请输入生辰，以观天命之流向</p>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="scroll-surface p-8 md:p-12 relative space-y-12 overflow-hidden"
              >
                <div className="lattice-corner lattice-tl" />
                <div className="lattice-corner lattice-tr" />
                <div className="lattice-corner lattice-bl" />
                <div className="lattice-corner lattice-br" />

                <div className="brush-accent absolute right-10 top-20 text-9xl">天</div>
                <div className="brush-accent absolute left-10 bottom-20 text-9xl">道</div>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="text-[10px] px-2.5 py-1 bg-ink-black text-white font-bold tracking-[0.3em]">{gender === 'male' ? '乾造' : '坤造'}</span>
                  <span className="text-[10px] px-2.5 py-1 border border-ink-black/10 font-bold tracking-[0.3em]">生肖 {result.shengXiao}</span>
                  <span className="text-[10px] px-2.5 py-1 border border-ink-black/10 text-ink-black/60 font-bold tracking-[0.3em]">
                    日主 {result.dayMaster}{result.dayMasterElement}
                  </span>
                  {result.missingElements.length > 0 && (
                    <span className="text-[10px] px-2.5 py-1 border border-imperial-red/20 text-imperial-red font-bold tracking-[0.2em]">
                      缺 {result.missingElements.join('')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                      <div className="text-[180px] font-brush">命</div>
                   </div>
                   <BaziColumn label="时柱" stem={result.hour.stem} branch={result.hour.branch} elementColor={getElementColor(result.hour.element)} naYin={result.hour.naYin} shiShen={result.hour.shiShen} branchShiShen={result.hour.branchShiShen} />
                   <BaziColumn 
                      label="日柱" 
                      stem={result.day.stem} 
                      branch={result.day.branch} 
                      elementColor={getElementColor(result.day.element)} 
                      naYin={result.day.naYin}
                      shiShen={result.day.shiShen}
                      branchShiShen={result.day.branchShiShen}
                      isMaster 
                    />
                   <BaziColumn label="月柱" stem={result.month.stem} branch={result.month.branch} elementColor={getElementColor(result.month.element)} naYin={result.month.naYin} shiShen={result.month.shiShen} branchShiShen={result.month.branchShiShen} />
                   <BaziColumn label="年柱" stem={result.year.stem} branch={result.year.branch} elementColor={getElementColor(result.year.element)} naYin={result.year.naYin} shiShen={result.year.shiShen} branchShiShen={result.year.branchShiShen} />
                </div>

                {/* Energy Landscape & Wu Xing Cycle */}
                <div className="grid md:grid-cols-2 gap-12 pt-8 border-t border-ink-black/10">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-1.5 bg-imperial-red rotate-45" />
                      <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">五行能量分布 (Magnitude)</span>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {Object.entries(result.fiveElements).map(([key, value]) => {
                        const strength = result.monthCommand.strength[key];
                        const isStrong = strength === '旺' || strength === '相';
                        
                        return (
                          <div key={key} className="flex flex-col items-center group relative">
                            <div className={`w-2 h-32 bg-ink-black/[0.03] relative overflow-hidden mb-3 rounded-full transition-all ${isStrong ? 'ring-1 ring-imperial-red/30' : ''}`}>
                              <motion.div 
                                initial={{ height: 0 }} 
                                animate={{ height: `${(Number(value)/8) * 100}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`absolute bottom-0 w-full ${getElementBg(key)} ${isStrong ? 'opacity-80' : 'opacity-60'}`}
                              />
                              {/* Animated highlight stream */}
                              <motion.div
                                animate={{ y: [128, -128] }}
                                transition={{ duration: isStrong ? 1.2 : 2, repeat: Infinity, ease: "linear", delay: Math.random() }}
                                className={`absolute inset-x-0 h-1/2 bg-gradient-to-t from-transparent via-white/20 to-transparent pointer-events-none ${isStrong ? 'opacity-60' : 'opacity-40'}`}
                              />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-xs font-bold ${getElementColor(key)} tracking-widest`}>{key}</span>
                              <span className={`text-[8px] font-bold px-1 rounded-full ${isStrong ? 'bg-imperial-red text-white' : 'opacity-30'}`}>
                                {strength || '平'}
                              </span>
                            </div>
                            <div className="absolute -bottom-6 text-[8px] opacity-20 uppercase font-bold">{value}</div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="space-y-2">
                       <span className="text-[9px] uppercase tracking-widest font-bold opacity-30 block">月令司令分析</span>
                       <div className="p-4 bg-imperial-red/[0.03] border border-imperial-red/10 rounded-sm leading-relaxed">
                         <p className="text-[11px] text-ink-black/70 italic font-serif-sc mb-3">
                           {result.monthCommand.impact}
                         </p>
                         <div className="flex gap-4">
                           <div className="flex items-center gap-1.5">
                             <div className="w-1 h-1 bg-imperial-red rounded-full shadow-[0_0_5px_rgba(139,28,28,0.5)]" />
                             <span className="text-[9px] text-imperial-red font-bold">旺相：得令有力</span>
                           </div>
                           <div className="flex items-center gap-1.5 opacity-40">
                             <div className="w-1 h-1 bg-ink-black rounded-full" />
                             <span className="text-[9px] font-bold">休囚：失令渐弱</span>
                           </div>
                         </div>
                       </div>
                       <div className="p-4 bg-ink-black/[0.02] border border-ink-black/5 rounded-sm italic text-[10px] text-ink-black/40 leading-relaxed font-serif-sc">
                        能量守恒，共计八分。以此观命盘之强弱、寒暖、燥湿。高亮标识为月令所秉之气，能量更为活跃。
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-1.5 bg-imperial-red rotate-45" />
                      <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">五行生克流动 (Relational Flow)</span>
                    </div>
                    <WuXingCycle elements={result.fiveElements} strengths={result.monthCommand.strength} />
                  </div>
                </div>

                {/* Five Elements & Pattern Correlation */}
                <div className="pt-12 border-t border-ink-black/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-1.5 bg-imperial-red rotate-45" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">五行能量与格局关联 (Elemental Influence)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {Object.entries(ELEMENT_TRAITS).map(([el, trait]) => {
                      const strength = result.monthCommand.strength[el];
                      const isStrong = strength === '旺' || strength === '相';
                      return (
                        <div key={el} className={`p-4 border rounded-sm transition-all ${isStrong ? 'bg-imperial-red/[0.03] border-imperial-red/20 shadow-sm' : 'bg-ink-black/[0.01] border-ink-black/5 opacity-60'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-sm font-bold ${getElementColor(el)}`}>{el} · {trait.virtue}</span>
                            {isStrong && <Sparkles className="w-3 h-3 text-imperial-red" />}
                          </div>
                          <p className="text-[10px] leading-relaxed text-ink-black/60 font-serif-sc">
                            {trait.influence} 在此命局中呈现【{strength || '平'}】势，{isStrong ? '主导' : '辅助'}了性格中“{trait.desc}”的一面。
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 五行缺行与调候补益 */}
                {result.missingElements.length > 0 && (
                  <div className="pt-10 border-t border-ink-black/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-1.5 bg-imperial-red rotate-45" />
                      <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">五行缺行与补益 (Elemental Deficiency)</span>
                    </div>
                    <div className="p-6 bg-imperial-red/[0.02] border border-imperial-red/10 rounded-sm space-y-4">
                      <p className="text-[11px] text-ink-black/70 font-serif-sc leading-relaxed">
                        命局四柱干支本气中，<span className="text-imperial-red font-bold">{result.missingElements.map(el => `${el}行`).join('、')}</span> 未现。
                        <span className="opacity-50">（地支藏干之中或有余气，此处仅计本气。）</span>
                        五行贵在流通平衡，缺者宜以物象、方位、色彩温和补益：
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        {result.missingElements.map(el => (
                          <div key={el} className="p-4 bg-white/70 border border-ink-black/5 rounded-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${getElementBg(el)}`} />
                              <span className="text-xs font-bold text-ink-black/80">{el}行</span>
                            </div>
                            <p className="text-[10px] text-ink-black/55 leading-relaxed font-serif-sc">
                              {FIVE_ELEMENTS_ADVICE[el]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bazi Structure Analysis */}
                {result.structure && (
                  <div className="pt-12 border-t border-ink-black/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-1.5 bg-imperial-red rotate-45" />
                      <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">格局简析 (Pattern Analysis)</span>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      <div className="lg:col-span-7 space-y-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="text-5xl font-brush text-imperial-red">{result.structure.name}</div>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-imperial-red/20 to-transparent"></div>
                          </div>
                          <p className="text-sm font-serif-sc leading-relaxed text-ink-black/80 italic">
                             {result.structure.description}
                          </p>
                        </div>

                        {/* Deep Dive: Day Master vs Month Command */}
                        <div className="bg-paper shadow-sm border border-ink-black/5 p-6 space-y-6">
                          <div className="flex items-center justify-between border-b border-ink-black/5 pb-4">
                            <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">日主与月令关系深探 (Relational Deep Dive)</span>
                            <div className="flex gap-2">
                              <span className="text-[10px] px-2 py-0.5 bg-imperial-red text-white font-bold">{result.dayMaster} · {result.dayMasterElement}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-ink-black text-white font-bold">{result.monthCommand.branch}月 · {result.monthCommand.element}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-imperial-red">五行生克解析</h4>
                              <p className="text-[11px] leading-relaxed text-ink-black/70 font-serif-sc italic">
                                {result.monthCommand.impact} 
                                这一关系决定了命局的“月气”基调。日主在此时空坐标系下的能量活跃度评估为：
                              </p>
                              <div className="p-4 bg-imperial-red/[0.03] border-l-2 border-imperial-red">
                                {Object.entries(STRENGTH_DEFINITIONS).map(([key, info]) => {
                                  const isCurrent = result.monthCommand.strength[result.dayMasterElement] === key;
                                  if (!isCurrent) return null;
                                  return (
                                    <div key={key} className="space-y-2">
                                      <div className="text-sm font-bold text-imperial-red">{info.title}</div>
                                      <p className="text-[10px] text-ink-black/60 font-serif-sc leading-relaxed">
                                        {info.desc}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-ink-black/60">理论判定详述</h4>
                              <div className="space-y-3">
                                <div className="text-[10px] text-ink-black/50 space-y-1">
                                  <p className="font-bold">1. 气势之辨</p>
                                  <p className="font-serif-sc">月令为“提纲”，统领整盘五行消长。日主得令则有源，失令则耗泄。此为判定“身强身弱”之首要准绳。</p>
                                </div>
                                <div className="text-[10px] text-ink-black/50 space-y-1">
                                  <p className="font-bold">2. 格局立意</p>
                                  <p className="font-serif-sc italic">“不论身强弱，首推月令格。”</p>
                                  <p className="font-serif-sc">基于【{result.monthCommand.branch}】月中能量最盛之物与日主的相互作用关系，定下此八字的人生主线与性格轴心。</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-5 w-full p-5 bg-imperial-red/[0.02] border border-imperial-red/10 rounded-sm relative group overflow-hidden h-fit">
                        <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                          <BookOpen className="w-12 h-12" />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-imperial-red/60 block mb-3 border-b border-imperial-red/5 pb-2">格局定判逻辑 (Determination)</span>
                        <div className="space-y-4">
                          <div>
                             <p className="text-[10px] text-ink-black/60 font-bold mb-1">主线：日主与月令</p>
                             <p className="text-[10px] text-ink-black/40 leading-relaxed font-serif-sc">
                                月令为一命之主宰。格局的确定首先观察日主五行（主方）与月令司令五行（客方）之间的生克关系。
                             </p>
                          </div>
                          <div className="p-3 bg-white/40 rounded-sm border border-ink-black/5">
                             <p className="text-[10px] text-imperial-red font-bold mb-1">当前逻辑推演：</p>
                             <p className="text-[10px] text-ink-black/50 leading-relaxed font-serif-sc">
                                日主【{result.dayMaster}】生于【{result.monthCommand.branch}】月，其受月令之气影响显著。系统依据“得力取格”原则，识别此八字呈现【{result.structure?.name}】基本特质。
                             </p>
                          </div>
                          <div>
                             <p className="text-[10px] text-ink-black/60 font-bold mb-1">格局偏离与修正因素：</p>
                             <ul className="text-[9px] text-ink-black/40 list-disc list-inside space-y-1 font-serif-sc">
                               <li><strong>透出原则：</strong> 若月令中所藏之干透出于天干，则格局更显，优先取格。</li>
                               <li><strong>合化局观：</strong> 地支三合（如申子辰）能改变单一支属性，导致格局转向。</li>
                               <li><strong>从众倾向：</strong> 四柱势众者为大，若某五行极盛，可能脱离常法进入奇格。</li>
                             </ul>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-imperial-red/5">
                           <p className="text-[9px] text-imperial-red/40 italic font-serif-sc">
                             “格局定其高低，神煞观众性情。”——命理学基础。
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 大运流年 */}
                {result.yun && (
                  <div className="pt-12 border-t border-ink-black/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-1.5 bg-imperial-red rotate-45" />
                      <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">大运流年 (Fortune Cycles)</span>
                    </div>
                    <div className="space-y-6">
                      <div className="p-4 bg-ink-black/[0.02] border border-ink-black/5 rounded-sm text-[10px] leading-relaxed text-ink-black/60 font-serif-sc">
                        <span className="text-imperial-red font-bold">起运：</span>{result.yun.startText}
                        <span className="ml-2 opacity-50">大运{result.yun.forward ? '顺行' : '逆行'}，每步十年，一步一重天。</span>
                      </div>

                      <div className="overflow-x-auto custom-scrollbar pb-2">
                        <div className="flex gap-3 min-w-max">
                          {result.yun.periods.map((p, i) => (
                            <div key={i} className={`w-24 shrink-0 p-3 border rounded-sm text-center transition-all ${p.isCurrent ? 'bg-imperial-red text-white border-imperial-red shadow-lg scale-[1.04]' : 'bg-white/70 border-ink-black/10 hover:border-ink-black/30'}`}>
                              <div className={`font-brush text-xl ${p.isCurrent ? '' : 'text-ink-black'}`}>{p.ganZhi}</div>
                              <div className={`text-[9px] mt-1 font-bold ${p.isCurrent ? 'text-white/85' : 'text-ink-black/45'}`}>{p.startAge}-{p.endAge} 岁</div>
                              <div className={`text-[8px] mt-0.5 ${p.isCurrent ? 'text-white/60' : 'text-ink-black/30'}`}>{p.startYear}-{p.endYear}</div>
                              {p.isCurrent && <div className="text-[8px] mt-1 tracking-[0.3em] font-bold">今运</div>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {result.yun.liuNian.length > 0 && (
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-bold opacity-30 block mb-2">当前大运 · 流年十载</span>
                          <div className="overflow-x-auto custom-scrollbar pb-2">
                            <div className="flex gap-2 min-w-max">
                              {result.yun.liuNian.map(l => {
                                const isThisYear = l.year === new Date().getFullYear();
                                return (
                                  <div key={l.year} className={`w-16 shrink-0 p-2 border rounded-sm text-center ${isThisYear ? 'bg-ink-black text-white border-ink-black shadow-md' : 'bg-white/60 border-ink-black/5'}`}>
                                    <div className="text-xs font-bold">{l.ganZhi}</div>
                                    <div className={`text-[8px] mt-0.5 ${isThisYear ? 'text-white/75' : 'text-ink-black/35'}`}>{l.year} · {l.age}岁{isThisYear ? ' · 今' : ''}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 辅星三垣：胎元 / 命宫 / 身宫 / 胎息 */}
                <div className="pt-12 border-t border-ink-black/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-1.5 bg-imperial-red rotate-45" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">辅星三垣 (Auxiliary Stars)</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'taiYuan', label: '胎元', desc: '受胎之月，根基所系' },
                      { key: 'mingGong', label: '命宫', desc: '命之所安，立命之宫' },
                      { key: 'shenGong', label: '身宫', desc: '后天所养，行事之主' },
                      { key: 'taiXi', label: '胎息', desc: '先天之气，禀赋所藏' },
                    ].map(s => {
                      const star = result.auxStars[s.key as keyof typeof result.auxStars];
                      return (
                        <div key={s.key} className="p-4 bg-white/70 border border-ink-black/5 rounded-sm hover:border-imperial-red/30 transition-all group">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 group-hover:opacity-70 transition-opacity">{s.label}</span>
                            <span className="text-[8px] opacity-30 font-serif-sc">{s.desc}</span>
                          </div>
                          <div className="font-brush text-2xl text-imperial-red">{star.ganZhi}</div>
                          <div className="text-[9px] text-ink-black/40 mt-1 font-serif-sc">{star.naYin}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-6 pt-12 border-t border-ink-black/10">
                  <div className="bg-imperial-red/[0.03] p-6 text-sm leading-loose text-ink-black/80 border-l-4 border-imperial-red relative italic font-serif-sc">
                     <p className="opacity-40 uppercase tracking-widest text-[10px] mb-2 font-bold text-imperial-red">伏羲基础卦解</p>
                     {baseAnalysis}
                  </div>

                  {!chatHistory.length && (
                    <div className="flex gap-4">
                      <button
                        onClick={handleAIInterpret}
                        disabled={aiLoading}
                        className="flex-1 py-4 bg-imperial-red text-white text-[11px] tracking-[0.4em] font-bold uppercase transition-all hover:bg-ink-black flex items-center justify-center gap-3 group shadow-2xl"
                      >
                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 group-hover:scale-125 transition-transform" />}
                        天人合一深度解读
                      </button>
                      <button 
                        onClick={() => { setResult(null); setChatHistory([]); }}
                        className="px-6 border border-ink-black/20 hover:border-imperial-red hover:text-imperial-red transition-all"
                      >
                        <RefreshCw className="w-4 h-4 opacity-40" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <AnimatePresence>
        {chatHistory.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="scroll-surface p-8 md:p-12 relative overflow-hidden space-y-12 mt-12 bg-paper/60 backdrop-blur-sm shadow-2xl"
          >
            <div className="lattice-corner lattice-tl opacity-10" />
            <div className="lattice-corner lattice-tr opacity-10" />
            
            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <div className="vertical-text font-brush text-4xl text-ink-black tracking-[0.4em]">先生解惑</div>
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
                  placeholder="若有不明之处，请先生指点..."
                  className="flex-1 bg-transparent border-b border-ink-black/10 py-3 text-sm text-ink-black focus:outline-none focus:border-ink-black italic placeholder:opacity-20"
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
    </div>
  );
}

const STRENGTH_DEFINITIONS: Record<string, { title: string; desc: string }> = {
  '旺': { title: '禀时而旺 (Dominant)', desc: '得时而令，能量处于巅峰。如草木逢春，金石得秋，主个人意志极强，生命力旺盛。' },
  '相': { title: '得气而相 (Strong)', desc: '受月令之生，元气源源不断。如婴儿受乳，虽非主导，基层稳健，潜力巨大。' },
  '休': { title: '功成而休 (Resting)', desc: '日主能量被月令宣泄，处于释放状态。由于消耗较大，需外部关怀补足，宜平稳低调。' },
  '囚': { title: '克令而囚 (Trapped)', desc: '日主试图控制月令，无奈月令势大，反被拖累。犹如囚徒困斗，壮志未酬，资源匮乏。' },
  '死': { title: '受制而死 (Extinguished)', desc: '月令严厉克制日主，生存环境严峻。需极其坚韧的意志或强力神助（印比）方能立本。' }
};

const ELEMENT_TRAITS: Record<string, { virtue: string; desc: string; influence: string }> = {
  '木': { virtue: '仁', desc: '仁慈、博爱、恻隐之心', influence: '木旺者如春木萌芽，象征向上的生命力与温和的仁德。' },
  '火': { virtue: '礼', desc: '热情、光明、礼仪辞让', influence: '火旺者如烈日当空，象征充沛的激情、清晰的洞察与对礼节的重视。' },
  '土': { virtue: '信', desc: '诚实、宽容、稳重厚德', influence: '土旺者如厚地载物，象征极强的包容力、诚信与持之以恒的定力。' },
  '金': { virtue: '义', desc: '果断、义气、刚毅不屈', influence: '金旺者如秋霜伐木，象征是非分明的正义感、卓越的决断力与意志。' },
  '水': { virtue: '智', desc: '聪慧、应变、深谋远虑', influence: '水旺者如江河奔涌，象征极高的智慧、环境适应能力与深邃的思维深度。' }
};

const STEM_INFO: Record<string, { element: string, nature: string, desc: string, reference: string }> = {
  '甲': { element: '木', nature: '阳木', desc: '雷厉风行，参天巨木，主仁，具有极强的生命力与向上进取的精神。', reference: '《渊海子平》：甲木主仁，其性直，其情和。' },
  '乙': { element: '木', nature: '阴木', desc: '柔美灵动，花草之木，主仁，适应力强，外柔内刚，有韧性。', reference: '《三命通会》：乙木为风，为花，其质柔，其情慈。' },
  '丙': { element: '火', nature: '阳火', desc: '如日中天，太阳之火，主礼，气势磅礴，性格开朗，慷慨大方。', reference: '《渊海子平》：丙火为日，纯阳之性，威莫能附。' },
  '丁': { element: '火', nature: '阴火', desc: '星星之火，灯烛之光，主礼，内向深情，思维细腻，富有牺牲精神。', reference: '《滴天髓》：丁火柔中，内性昭融。' },
  '戊': { element: '土', nature: '阳土', desc: '厚德载物，高山之土，主信，稳重沉静，守信用，是值得信赖的伙伴。', reference: '《三命通会》：戊土为坤，厚重宽大，生万物。' },
  '己': { element: '土', nature: '阴土', desc: '田园之土，湿润肥沃，主信，富有人情味，包容性强，细心且善解人意。', reference: '《渊海子平》：己土为地，卑湿之质，稼穑之利。' },
  '庚': { element: '金', nature: '阳金', desc: '刚健笃实，斧钺之金，主义，杀伐果断，性格刚毅，注重义气与结果。', reference: '《滴天髓》：庚金带煞，刚健为最。' },
  '辛': { element: '金', nature: '阴金', desc: '璀璨夺目，珠宝之金，主义，自尊心强，气质高雅，心思敏锐且追求完美。', reference: '《三命通会》：辛金为霜，为珍宝，清润之气。' },
  '壬': { element: '水', nature: '阳水', desc: '奔腾不息，江河之水，主智，多才多艺，善于社交，具有包容力与决策力。', reference: '《渊海子平》：壬水为秋露，又为江河，通天河之精。' },
  '癸': { element: '水', nature: '阴水', desc: '润物无声，雨露之水，主智，性格温柔，想象力丰富，善于忍耐与等待。', reference: '《滴天髓》：癸水至弱，达于天津。' },
};

const BRANCH_INFO: Record<string, { element: string, nature: string, zodiac: string, hiddenStems: { stem: string, element: string, strength: string, type: string }[], desc: string, reference: string }> = {
  '子': { element: '水', nature: '阳水', zodiac: '鼠', hiddenStems: [{ stem: '癸', element: '水', strength: '100%', type: '本气' }], desc: '聪慧机敏，处事多思。', reference: '《尔雅》：岁在子曰困敦。' },
  '丑': { element: '土', nature: '阴土', zodiac: '牛', hiddenStems: [{ stem: '己', element: '土', strength: '60%', type: '本气' }, { stem: '癸', element: '水', strength: '30%', type: '中气' }, { stem: '辛', element: '金', strength: '10%', type: '余气' }], desc: '沉稳厚道，耐力十足。', reference: '《尔雅》：岁在丑曰赤奋若。' },
  '寅': { element: '木', nature: '阳木', zodiac: '虎', hiddenStems: [{ stem: '甲', element: '木', strength: '60%', type: '本气' }, { stem: '丙', element: '火', strength: '30%', type: '中气' }, { stem: '戊', element: '土', strength: '10%', type: '余气' }], desc: '胆识过人，勇于开拓。', reference: '《尔雅》：岁在寅曰摄提格。' },
  '卯': { element: '木', nature: '阴木', zodiac: '兔', hiddenStems: [{ stem: '乙', element: '木', strength: '100%', type: '本气' }], desc: '文静高雅，心地善良。', reference: '《尔雅》：岁在卯曰单阏。' },
  '辰': { element: '土', nature: '阳土', zodiac: '龙', hiddenStems: [{ stem: '戊', element: '土', strength: '60%', type: '本气' }, { stem: '乙', element: '木', strength: '30%', type: '中气' }, { stem: '癸', element: '水', strength: '10%', type: '余气' }], desc: '神秘莫测，志向远大。', reference: '《尔雅》：岁在辰曰执徐。' },
  '巳': { element: '火', nature: '阳火', zodiac: '蛇', hiddenStems: [{ stem: '丙', element: '火', strength: '60%', type: '本气' }, { stem: '庚', element: '金', strength: '30%', type: '中气' }, { stem: '戊', element: '土', strength: '10%', type: '余气' }], desc: '心思缜密，热情奔放。', reference: '《尔雅》：岁在巳曰大荒落。' },
  '午': { element: '火', nature: '阴火', zodiac: '马', hiddenStems: [{ stem: '丁', element: '火', strength: '70%', type: '本气' }, { stem: '己', element: '土', strength: '30%', type: '中气' }], desc: '积极进取，奔放活泼。', reference: '《尔雅》：岁在午曰敦牂。' },
  '未': { element: '土', nature: '阴土', zodiac: '羊', hiddenStems: [{ stem: '己', element: '土', strength: '60%', type: '本气' }, { stem: '丁', element: '火', strength: '30%', type: '中气' }, { stem: '乙', element: '木', strength: '10%', type: '余气' }], desc: '温顺平和，富有人情味。', reference: '《尔雅》：岁在未曰协洽。' },
  '申': { element: '金', nature: '阳金', zodiac: '猴', hiddenStems: [{ stem: '庚', element: '金', strength: '60%', type: '本气' }, { stem: '壬', element: '水', strength: '30%', type: '中气' }, { stem: '戊', element: '土', strength: '10%', type: '余气' }], desc: '灵活好动，机智过人。', reference: '《尔雅》：岁在申曰涒滩。' },
  '酉': { element: '金', nature: '阴金', zodiac: '鸡', hiddenStems: [{ stem: '辛', element: '金', strength: '100%', type: '本气' }], desc: '果断利落，自豪感强。', reference: '《尔雅》：岁在酉曰作噩。' },
  '戌': { element: '土', nature: '阳土', zodiac: '狗', hiddenStems: [{ stem: '戊', element: '土', strength: '60%', type: '本气' }, { stem: '辛', element: '金', strength: '30%', type: '中气' }, { stem: '丁', element: '火', strength: '10%', type: '余气' }], desc: '正直忠诚，警觉性高。', reference: '《尔雅》：岁在戌曰阉茂。' },
  '亥': { element: '水', nature: '阴水', zodiac: '猪', hiddenStems: [{ stem: '壬', element: '水', strength: '70%', type: '本气' }, { stem: '甲', element: '木', strength: '30%', type: '中气' }], desc: '心旷神怡，待人真诚。', reference: '《尔雅》：岁在亥曰大渊献。' },
};

function BaziColumn({ label, stem, branch, elementColor, isMaster, naYin, shiShen, branchShiShen }: { label: string, stem: string, branch: string, elementColor: string, isMaster?: boolean, naYin?: string, shiShen?: string, branchShiShen?: string }) {
  const [showInfo, setShowInfo] = useState(false);
  const sInfo = STEM_INFO[stem];
  const bInfo = BRANCH_INFO[branch];

  return (
    <div className={`flex flex-col items-center justify-center bg-white/40 border transition-all ${isMaster ? 'border-imperial-red shadow-2xl z-10 ring-1 ring-imperial-red/20' : 'border-ink-black/10'} p-6 relative h-full group rounded-sm`}>
      {isMaster && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-imperial-red text-white text-[10px] px-4 py-1 font-bold whitespace-nowrap tracking-widest shadow-lg rounded-sm">
          日主 MASTER
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-10">
        <span className="text-[10px] opacity-50 uppercase tracking-[0.4em] group-hover:opacity-100 transition-opacity font-bold">{label}</span>
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className={`p-1 rounded-full hover:bg-ink-black/5 transition-all ${showInfo ? 'text-imperial-red' : 'opacity-20 hover:opacity-100'}`}
        >
          <Info className="w-3 h-3" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-6">
        <span className={`text-7xl md:text-8xl font-brush ${elementColor} leading-none ink-glow select-none`}>{stem}</span>
        <div className="relative group/branch">
          <span className={`text-7xl md:text-8xl font-brush ${elementColor} leading-none ink-glow select-none`}>{branch}</span>
          <button 
            onClick={() => setShowInfo(true)}
            className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-20 hover:opacity-100 p-2 hover:text-imperial-red transition-all flex flex-col items-center gap-1 group/qibtn"
            title={`${branch} 藏干与地支详情`}
          >
            <div className="text-[8px] font-bold vertical-text opacity-40 group-hover/qibtn:opacity-100 transition-opacity">藏干详情</div>
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className={`mt-12 h-[2px] w-12 ${isMaster ? 'bg-imperial-red/40' : 'bg-ink-black/20'}`} />

      <div className="mt-4 text-center space-y-1.5">
        <div className={`text-[10px] font-bold tracking-[0.3em] ${isMaster ? 'text-imperial-red' : 'text-ink-black/60'}`}>{shiShen || '—'}</div>
        <div className="text-[9px] text-ink-black/40 font-serif-sc tracking-wider">{naYin || ''}</div>
        {branchShiShen && (
          <div className="text-[8px] text-ink-black/35 tracking-wider">
            藏{stem} · {branchShiShen}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md p-6 flex flex-col justify-start overflow-y-auto rounded-sm border border-imperial-red/20 shadow-2xl"
          >
            <button 
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 text-[9px] uppercase tracking-widest font-bold opacity-30 hover:opacity-100 p-2"
            >
              关闭 ×
            </button>
            <div className="space-y-6 pt-4">
              <div className="border-b border-ink-black/5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-brush text-imperial-red">{stem}</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">天干 ({sInfo?.nature})</span>
                </div>
                <p className="text-[11px] leading-relaxed text-ink-black/70 italic font-serif-sc mb-2">{sInfo?.desc}</p>
                <div className="bg-ink-black/[0.02] p-2 rounded text-[9px] text-ink-black/40 font-serif-sc border-l border-ink-black/10">
                  {sInfo?.reference}
                </div>
              </div>
              
              <div className="border-b border-ink-black/5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-brush text-imperial-red">{branch}</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">地支 (属{bInfo?.zodiac} · {bInfo?.nature})</span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <span className="text-[9px] uppercase tracking-widest font-bold opacity-30 block">藏干分布 (Hidden Stems)</span>
                  <div className="grid grid-cols-1 gap-1">
                    {bInfo?.hiddenStems.map((hs, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-ink-black/[0.03] p-2 rounded-sm border-l-2 border-imperial-red/20">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-brush text-imperial-red">{hs.stem}</span>
                          <span className="text-[9px] opacity-40">({hs.element})</span>
                          <span className="text-[9px] bg-imperial-red/10 text-imperial-red px-1 rounded-sm font-bold">{hs.type}</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold opacity-40">{hs.strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-ink-black/70 italic font-serif-sc mb-2">{bInfo?.desc}</p>
                <div className="bg-ink-black/[0.02] p-2 rounded text-[9px] text-ink-black/40 font-serif-sc border-l border-ink-black/10">
                  {bInfo?.reference}
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-30 block mb-2">五行关系分析</span>
                <div className="p-3 bg-imperial-red/[0.03] border border-imperial-red/10 rounded-sm italic text-[10px] leading-relaxed text-ink-black/60">
                  {sInfo?.element === bInfo?.element 
                    ? `干支同气（${sInfo?.element}），能量纯粹集中。`
                    : `干支异性（${stem}${sInfo?.element}、${branch}${bInfo?.element}），阴阳流转均衡。`
                  }
                  体现了该柱的独特【{label}】时空能量特征。
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
