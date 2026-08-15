/**
 * 生成 PWA / Electron 应用图标（太极水墨风）
 * 纯 Node 实现：手写 PNG 编码器（zlib + CRC32），像素级绘制太极图形
 * 输出：public/icons/icon-192.png, public/icons/icon-512.png, build/icon.png
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── PNG 编码 ─────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  // 每行前加 filter byte 0
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── 太极绘制 ─────────────────────────────────────────────
function drawTaiji(size) {
  const px = Buffer.alloc(size * size * 4); // 透明底
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.44;               // 太极圆半径
  const ringW = Math.max(4, size * 0.035); // 外环宽
  const R1 = R + ringW;                // 外环外径
  const half = R / 2;                  // S 半圆半径
  const eyeR = Math.max(3, size * 0.05); // 鱼眼半径

  const PAPER = [250, 247, 239];
  const INK = [28, 29, 33];
  const RED = [168, 31, 31];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d2 = dx * dx + dy * dy;
      const idx = (y * size + x) * 4;
      // 外环（朱砂）
      if (d2 <= R1 * R1 && d2 >= R * R) {
        px[idx] = RED[0]; px[idx + 1] = RED[1]; px[idx + 2] = RED[2]; px[idx + 3] = 255;
        continue;
      }
      // 太极内部
      if (d2 > R * R) continue;
      // 右上黑块：上半圆（圆心 (cx, cy-half)，半径 half）的 x > cx 部分
      const dx1 = x + 0.5 - cx;
      const dy1 = y + 0.5 - (cy - half);
      const inUp = dx1 * dx1 + dy1 * dy1 <= half * half;
      // 左下黑块：下半圆（圆心 (cx, cy+half)）的 x < cx 部分
      const dy2 = y + 0.5 - (cy + half);
      const inDown = dx1 * dx1 + dy2 * dy2 <= half * half;
      const isBlack = (inUp && dx1 >= 0) || (inDown && dx1 < 0);
      // 鱼眼：黑区内白点（圆心上半），白区内黑点（圆心下半）
      const dEyeUp = (x + 0.5 - cx) ** 2 + (y + 0.5 - (cy - half)) ** 2;
      const dEyeDown = (x + 0.5 - cx) ** 2 + (y + 0.5 - (cy + half)) ** 2;
      let color;
      if (isBlack) {
        color = dEyeUp <= eyeR * eyeR ? PAPER : INK;
      } else {
        color = dEyeDown <= eyeR * eyeR ? INK : PAPER;
      }
      px[idx] = color[0]; px[idx + 1] = color[1]; px[idx + 2] = color[2]; px[idx + 3] = 255;
    }
  }
  return px;
}

// ── 输出 ─────────────────────────────────────────────
const outDir = join(ROOT, 'public', 'icons');
mkdirSync(outDir, { recursive: true });
mkdirSync(join(ROOT, 'build'), { recursive: true });

for (const size of [192, 512]) {
  const png = encodePNG(size, size, drawTaiji(size));
  writeFileSync(join(outDir, `icon-${size}.png`), png);
  console.log(`✓ public/icons/icon-${size}.png (${png.length} bytes)`);
}
const png512 = encodePNG(512, 512, drawTaiji(512));
writeFileSync(join(ROOT, 'build', 'icon.png'), png512);
console.log('✓ build/icon.png (Electron 打包用)');
