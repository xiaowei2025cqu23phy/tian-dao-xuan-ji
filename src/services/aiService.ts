import { GoogleGenAI } from "@google/genai";
import { TEN_STEMS_ANALYSIS } from "../lib/bazi-data";
import { GET_HEX_BY_BINARY } from "../lib/iching-data";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type AIProvider = 'gemini' | 'openai' | 'deepseek' | 'qwen' | 'zhipu' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'gemini',
  apiKey: '', // Will fallback to process.env if empty
  model: 'gemini-1.5-flash',
};

export const AI_PROVIDERS = [
  { id: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-1.5-flash' },
  { id: 'openai', label: 'ChatGPT (OpenAI)', defaultModel: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
  { id: 'deepseek', label: 'DeepSeek', defaultModel: 'deepseek-chat', baseUrl: 'https://api.deepseek.com' },
  { id: 'qwen', label: '阿里通义千问 (Qwen)', defaultModel: 'qwen-plus', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { id: 'zhipu', label: '智谱清言 (GLM)', defaultModel: 'glm-4-flash', baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
  { id: 'custom', label: '自定义 (OpenAI兼容)', defaultModel: '', baseUrl: '' },
];

export const QUESTION_CATEGORIES = [
  { id: 'general', label: '综合运势 General', icon: 'Sparkles' },
  { id: 'career', label: '事业前程 Career', icon: 'Briefcase' },
  { id: 'love', label: '情感婚姻 Love', icon: 'Heart' },
  { id: 'wealth', label: '财运求财 Wealth', icon: 'Coins' },
  { id: 'health', label: '身体健康 Health', icon: 'Activity' },
] as const;

export type QuestionCategory = typeof QUESTION_CATEGORIES[number]['id'];

const SYSTEM_PROMPT = `你是一位深谙中华传统易经与八字命理的命理大师，人称“天道先生”。
你说话富有哲理，温婉含蓄，又不失威严。
请根据用户提供的八字格局或卦象结果，给出兼具文学美感与生活指导意义的深度解析。
解析应包含：
1. 格局/卦象简评 (简短有力的古风辞藻)
2. 哲学深层解析 (探寻事物发展的规律)
3. 现实生活建议 (针对修身、持家或事业的忠告)
如果您在进行对话，请保持角色并根据之前的上下文提供连续的建议。
语气要平和、慈悲。使用中文。`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function callOpenAICompatibleAPI(messages: ChatMessage[], config: AIConfig) {
  const { apiKey, baseUrl, model } = config;
  const usedApiKey = apiKey || (
    config.provider === 'deepseek' ? process.env.DEEPSEEK_API_KEY :
    config.provider === 'openai' ? process.env.OPENAI_API_KEY :
    undefined
  );

  if (!usedApiKey) {
    throw new Error(`未设置 ${config.provider} API 密钥`);
  }

  const effectiveBaseUrl = baseUrl || 'https://api.openai.com/v1';

  try {
    const response = await fetch(`${effectiveBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${usedApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error(`${config.provider} API Error:`, error);
    throw error;
  }
}

export async function interpretMetaphysics(
  promptOrMessages: string | ChatMessage[], 
  config: AIConfig = DEFAULT_AI_CONFIG
) {
  const messages: ChatMessage[] = typeof promptOrMessages === 'string' 
    ? [{ role: 'user', content: promptOrMessages }]
    : promptOrMessages;

  if (config.provider !== 'gemini') {
    return callOpenAICompatibleAPI(messages, config);
  }

  // Gemini logic
  try {
    const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("未设置 Gemini API 密钥");
    
    const genAI = new GoogleGenAI({ apiKey: geminiKey });
    
    const response = await genAI.models.generateContent({
      model: config.model || 'gemini-3-flash-preview',
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Interpretation Error:", error);
    throw error;
  }
}

export function getOfflineBaziAnalysis(dayMaster: string) {
  return TEN_STEMS_ANALYSIS[dayMaster] || "天机自得，顺应自然。";
}

export function getOfflineIChingAnalysis(binary: string) {
  const hex = GET_HEX_BY_BINARY(binary);
  return `${hex.name}：${hex.judgement}\n${hex.meaning}`;
}
