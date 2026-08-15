import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Copy, Check } from 'lucide-react';

export interface PosterProps {
  title: string;
  symbol: string;
  lines: string[];
  footer: string;
}

/** 在 canvas 上绘制水墨风分享海报，返回 dataURL */
export function renderPoster({ title, symbol, lines, footer }: PosterProps): string {
  const W = 800;
  const H = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 宣纸底
  ctx.fillStyle = '#faf7ef';
  ctx.fillRect(0, 0, W, H);
  // 纸纹点
  ctx.fillStyle = 'rgba(28,29,33,0.03)';
  for (let x = 12; x < W; x += 26) {
    for (let y = 12; y < H; y += 26) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // 墨晕
  const grad = ctx.createRadialGradient(W * 0.85, H * 0.12, 10, W * 0.85, H * 0.12, 320);
  grad.addColorStop(0, 'rgba(168,31,31,0.04)');
  grad.addColorStop(1, 'rgba(168,31,31,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // 边框
  ctx.strokeStyle = 'rgba(168,31,31,0.55)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(26, 26, W - 52, H - 52);
  ctx.strokeStyle = 'rgba(28,29,33,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(38, 38, W - 76, H - 76);
  // 四角点
  ctx.fillStyle = 'rgba(168,31,31,0.7)';
  [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  const serif = '"Noto Serif SC","Ma Shan Zheng",serif';
  ctx.textAlign = 'center';

  // 标题
  ctx.fillStyle = '#a81f1f';
  ctx.font = `bold 46px ${serif}`;
  ctx.fillText(title, W / 2, 140);
  // 分隔线
  ctx.strokeStyle = 'rgba(168,31,31,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 90, 172);
  ctx.lineTo(W / 2 + 90, 172);
  ctx.stroke();

  // 卦画/符号
  ctx.fillStyle = '#1c1d21';
  ctx.font = `180px ${serif}`;
  ctx.fillText(symbol, W / 2, 440);

  // 正文（自动换行）
  ctx.fillStyle = 'rgba(28,29,33,0.82)';
  ctx.font = `26px ${serif}`;
  const maxWidth = W - 180;
  let y = 540;
  const lineHeight = 44;
  const wrap = (text: string) => {
    const chars = text.split('');
    let line = '';
    const out: string[] = [];
    chars.forEach(c => {
      if (ctx.measureText(line + c).width > maxWidth) {
        out.push(line);
        line = c;
      } else {
        line += c;
      }
    });
    if (line) out.push(line);
    return out;
  };
  lines.forEach(t => {
    wrap(t).forEach(l => {
      if (y < 880) {
        ctx.fillText(l, W / 2, y);
        y += lineHeight;
      }
    });
    y += 8;
  });

  // 页脚
  ctx.fillStyle = 'rgba(28,29,33,0.4)';
  ctx.font = `18px ${serif}`;
  ctx.fillText(footer, W / 2, 930);
  ctx.fillText('天道玄机 · 顺天应人', W / 2, 962);

  return canvas.toDataURL('image/png');
}

/** 复制分享文案（成功返回 true） */
export async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function SharePosterModal({ open, onClose, props }: { open: boolean; onClose: () => void; props: PosterProps }) {
  const [dataUrl, setDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setDataUrl(renderPoster(props));
      setCopied(false);
    }
  }, [open, props]);

  const shareText = [props.title, ...props.lines, props.footer, '—— 天道玄机 · 顺天应人'].join('\n');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-ink-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-paper p-6 max-w-sm w-full border border-imperial-red/20 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-3 right-3 p-1.5 opacity-40 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-4 text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold">分享海报 · SHARE</div>
            {dataUrl && <img src={dataUrl} alt="分享海报" className="w-full border border-ink-black/10 shadow-lg" />}
            <div className="flex gap-2 mt-4">
              <a
                href={dataUrl}
                download="tian-dao-xuan-ji.png"
                className="flex-1 py-2.5 bg-imperial-red text-white text-[10px] tracking-widest font-bold uppercase flex items-center justify-center gap-2 hover:bg-ink-black transition-all"
              >
                <Download className="w-3.5 h-3.5" /> 保存图片
              </a>
              <button
                onClick={async () => {
                  const ok = await copyShareText(shareText);
                  if (ok) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1600);
                  }
                }}
                className="flex-1 py-2.5 border border-ink-black/25 text-ink-black/80 text-[10px] tracking-widest font-bold uppercase flex items-center justify-center gap-2 hover:border-imperial-red/50 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#2d5a27]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '已复制' : '复制文案'}
              </button>
            </div>
            <p className="text-center text-[8px] opacity-30 mt-3 font-serif-sc">长按图片亦可保存 · 命理文化分享请理性看待</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
