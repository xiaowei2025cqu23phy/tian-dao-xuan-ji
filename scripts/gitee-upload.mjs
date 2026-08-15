/**
 * 上传文件到 Gitee 发行版附件（Node fetch 流式 multipart）
 * 用法: node scripts/gitee-upload.mjs <token> <releaseId> <filePath>
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname, basename } from 'node:path';

const [token, releaseId, filePath] = process.argv.slice(2);
if (!token || !releaseId || !filePath) {
  console.error('用法: node scripts/gitee-upload.mjs <token> <releaseId> <filePath>');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fullPath = join(root, filePath);
const data = await readFile(fullPath);
console.log(`读取 ${basename(fullPath)} (${(data.length / 1048576).toFixed(1)} MB)`);

const form = new FormData();
form.append('access_token', token);
form.append('file', new Blob([data]), basename(fullPath));

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 600000);

try {
  const res = await fetch(
    `https://gitee.com/api/v5/repos/xiaowei864/tian-dao-xuan-ji/releases/${releaseId}/attach_files`,
    { method: 'POST', body: form, signal: controller.signal },
  );
  clearTimeout(timer);
  const text = await res.text();
  console.log(`HTTP ${res.status}`);
  console.log(text.slice(0, 600));
  if (res.ok) {
    console.log('✅ 附件上传成功');
    process.exit(0);
  }
  process.exit(1);
} catch (e) {
  clearTimeout(timer);
  console.error('上传失败:', e.message);
  process.exit(1);
}
