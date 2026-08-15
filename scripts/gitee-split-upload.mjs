/**
 * 拆分安装包为分卷并上传到 Gitee 发行版（每卷小体积，规避长连接中断）
 * 用法: node scripts/gitee-split-upload.mjs <token> <releaseId> <exePath> <partSizeMB>
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { createHash } from 'node:crypto';

const [token, releaseId, exePath, sizeMbRaw = '8'] = process.argv.slice(2);
if ((!token || !releaseId) && token !== 'skip') {
  console.error('用法: node scripts/gitee-split-upload.mjs <token|skip> <releaseId> <exePath> [partSizeMB]');
  process.exit(1);
}
const SKIP_UPLOAD = token === 'skip';
const sizeMb = parseInt(sizeMbRaw, 10) || 8;
const partSize = sizeMb * 1024 * 1024;

const data = await readFile(exePath);
const total = data.length;
const name = basename(exePath);
console.log(`文件 ${name} (${(total / 1048576).toFixed(1)} MB)，分卷 ${sizeMb}MB/卷，共 ${Math.ceil(total / partSize)} 卷`);

// SHA256 校验
const sha = createHash('sha256').update(data).digest('hex');
console.log(`SHA256: ${sha}`);

// 拆分
const outDir = join(dirname(exePath), 'gitee-parts');
await mkdir(outDir, { recursive: true });
const partFiles = [];
for (let i = 0; i < Math.ceil(total / partSize); i++) {
  const part = data.subarray(i * partSize, Math.min((i + 1) * partSize, total));
  const fn = `${name}.part${String(i + 1).padStart(2, '0')}.bin`;
  await writeFile(join(outDir, fn), part);
  partFiles.push(fn);
  console.log(`拆分 ${fn} (${(part.length / 1048576).toFixed(1)} MB)`);
}

// 校验文件 + 合并脚本
const shaFile = join(outDir, 'SHA256.txt');
await writeFile(shaFile, `${sha}  ${name}\n`);
const copyCmd = partFiles.map(f => `"${f}"`).join('+');
const bat = `@echo off
chcp 65001 >nul
cd /d %~dp0
echo 正在合并分卷为安装包，请稍候...
copy /b ${copyCmd} "${name}" >nul
echo.
echo 合并完成！请核对校验值：
certutil -hashfile "${name}" SHA256
echo 期望: ${sha}
echo.
pause
`;
await writeFile(join(outDir, '合并安装包.bat'), bat, 'utf8');
console.log(`已生成 ${outDir}\\SHA256.txt 与 合并安装包.bat`);

// 上传（每卷带重试）
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function uploadOne(fileName) {
  const buf = await readFile(join(outDir, fileName));
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const form = new FormData();
      form.append('access_token', token);
      form.append('file', new Blob([buf]), fileName);
      const res = await fetch(
        `https://gitee.com/api/v5/repos/xiaowei864/tian-dao-xuan-ji/releases/${releaseId}/attach_files`,
        { method: 'POST', body: form },
      );
      const text = await res.text();
      if (res.ok) {
        console.log(`✓ 上传成功 ${fileName} (${(buf.length / 1048576).toFixed(1)} MB)`);
        return true;
      }
      console.log(`  第${attempt}次失败 HTTP ${res.status}: ${text.slice(0, 120)}`);
    } catch (e) {
      console.log(`  第${attempt}次失败: ${e.message}`);
    }
    await sleep(3000 * attempt);
  }
  return false;
}

let failed = 0;
if (SKIP_UPLOAD) {
  console.log('（skip 模式：仅拆分，未上传）');
  console.log(`分卷目录: ${outDir}`);
  console.log('上传方法：生成新令牌后运行 node scripts/gitee-split-upload.mjs <token> <releaseId> <exePath>');
  process.exit(0);
}
for (const f of partFiles) {
  const ok = await uploadOne(f);
  if (!ok) failed++;
  await sleep(1500);
}
await uploadOne('SHA256.txt');
await uploadOne('合并安装包.bat');

if (failed === 0) {
  console.log('✅ 全部分卷上传完成');
  process.exit(0);
} else {
  console.log(`❌ ${failed} 卷上传失败，请重跑脚本（已上传的卷会重复，可忽略）`);
  process.exit(1);
}
