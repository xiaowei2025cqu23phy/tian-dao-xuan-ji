import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// 构建时禁止将真实 API 密钥内联进产物（防止推送到 gh-pages 等公开渠道时泄露密钥）
const isPlaceholderKey = (key?: string) => !key || /^MY_[A-Z0-9_]+$/.test(key.trim());

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');

  if (mode === 'production' && !isPlaceholderKey(env.GEMINI_API_KEY)) {
    throw new Error(
      '[安全守卫] 检测到 .env 中存在真实的 GEMINI_API_KEY，构建产物会将其内联进 JS 并可能随部署泄露。' +
      '请删除该变量或改为占位符（如 MY_GEMINI_API_KEY）；真实密钥请在页面右上角【设置】中配置（仅保存在浏览器本地）。',
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    base: './',
    define: {
      // 仅将 .env 中的 GEMINI_API_KEY 映射为 VITE_ 变量供前端读取；
      // 生产构建已被上方安全守卫拦截，产物中不会出现真实密钥。
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // 拆分第三方依赖，减小首屏加载体积
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            motion: ['motion'],
            lunar: ['lunar-javascript'],
            'ai-vendor': ['@google/genai'],
            icons: ['lucide-react'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
