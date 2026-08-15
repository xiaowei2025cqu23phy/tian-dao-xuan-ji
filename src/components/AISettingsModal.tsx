import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Shield, Key, Cpu, Globe } from 'lucide-react';
import { AIConfig, AI_PROVIDERS, DEFAULT_AI_CONFIG } from '../services/aiService';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
}

export default function AISettingsModal({ isOpen, onClose, config, onSave }: AISettingsModalProps) {
  const [localConfig, setLocalConfig] = useState<AIConfig>(config);

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-ink-black/10 w-full max-w-lg shadow-2xl relative overflow-hidden"
      >
        <div className="lattice-corner lattice-tl opacity-10" />
        <div className="lattice-corner lattice-tr opacity-10" />
        
        <div className="p-6 border-b border-ink-black/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-imperial-red" />
            <div>
              <h2 className="text-sm font-bold tracking-widest text-ink-black uppercase">AI服务配置 (AI Settings)</h2>
              <p className="text-[10px] text-ink-black/40 font-serif-sc">自定义大模型服务与API密钥</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-ink-black/5 rounded-full transition-colors">
            <X className="w-4 h-4 text-ink-black/40" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-ink-black/60 uppercase tracking-widest block mb-2 flex items-center gap-2">
                <Cpu className="w-3 h-3" /> 模型服务商 (Provider)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AI_PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setLocalConfig({ 
                      ...localConfig, 
                      provider: p.id, 
                      model: p.defaultModel,
                      baseUrl: p.baseUrl 
                    })}
                    className={`px-3 py-2 border text-[10px] tracking-tight transition-all text-left flex flex-col gap-0.5 ${localConfig.provider === p.id ? 'bg-ink-black text-white border-ink-black shadow-md' : 'border-ink-black/10 text-ink-black/40 hover:border-ink-black/20'}`}
                  >
                    <span className="font-bold">{p.label.split(' ')[0]}</span>
                    <span className="opacity-60 text-[8px]">{p.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-ink-black/60 uppercase tracking-widest block mb-1 flex items-center gap-2">
                  <Key className="w-3 h-3" /> API 密钥 (API Key)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={localConfig.apiKey}
                    onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                    placeholder="输入您的 API Key..."
                    className="w-full bg-ink-black/[0.03] border border-ink-black/10 p-3 text-xs focus:outline-none focus:border-imperial-red/40 transition-all font-mono"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Shield className="w-3 h-3 text-ink-black/20" />
                  </div>
                </div>
                <p className="text-[9px] text-ink-black/30 mt-1 italic">提示：密钥仅保存在本地浏览器缓存中，不会上传至服务器。</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-black/60 uppercase tracking-widest block mb-1">模型名称 (Model Name)</label>
                <input
                  type="text"
                  value={localConfig.model}
                  onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                  placeholder="例如: gpt-4o, deepseek-chat..."
                  className="w-full bg-ink-black/[0.03] border border-ink-black/10 p-3 text-xs focus:outline-none focus:border-imperial-red/40 transition-all"
                />
              </div>

              {localConfig.provider === 'custom' && (
                <div>
                  <label className="text-[10px] font-bold text-ink-black/60 uppercase tracking-widest block mb-1 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> 接口地址 (Base URL)
                  </label>
                  <input
                    type="text"
                    value={localConfig.baseUrl || ''}
                    onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                    placeholder="https://api.your-provider.com/v1"
                    className="w-full bg-ink-black/[0.03] border border-ink-black/10 p-3 text-xs focus:outline-none focus:border-imperial-red/40 transition-all"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-ink-black/5 bg-ink-black/[0.02] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-ink-black/10 text-ink-black/60 text-[10px] tracking-widest uppercase hover:bg-white transition-all font-bold"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-ink-black text-white text-[10px] tracking-widest uppercase hover:bg-imperial-red transition-all shadow-xl font-bold"
          >
            保存配置
          </button>
        </div>
      </motion.div>
    </div>
  );
}
