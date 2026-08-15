# 部署指南（免费方案）

「天道玄机」是纯前端静态站点（Vite 构建），**构建产物在 `dist/`**，可部署到任何静态托管服务，也可打包为桌面应用。

> ⚠️ 重要：`dist/` 在 `.gitignore` 中（不进源码仓库），因此部署前必须先在本地构建：
> ```bash
> npm install
> npm run build        # 产物生成到 dist/
> ```
> 生产构建内置密钥防泄露守卫：若检测到真实 `GEMINI_API_KEY` 会直接报错终止。

---

## 零、PWA：把网页安装为桌面应用（零依赖）

项目已内置 PWA 支持（`manifest.webmanifest` + Service Worker）：

1. 部署到任意 HTTPS 站点（如 Gitee Pages / GitHub Pages）。
2. 用 **Chrome / Edge** 打开站点 → 地址栏右侧「安装」图标（或在菜单中选「安装应用」/「添加到桌面」）。
3. 桌面即出现独立窗口的应用图标，**离线可用**（Service Worker 已缓存全部静态资源）。

---

## 一、Gitee Pages（推荐 · 国内直连 · 免费）

1. **实名认证**：登录 [gitee.com](https://gitee.com) → 头像 → 设置 → 实名认证（免费，几分钟通过）。未实名看不到 Pages 功能。
2. **构建产物**：`npm run build` 后，将产物推送到仓库的 `gh-pages` 分支：
   ```bash
   git push gitee origin/gh-pages:gh-pages
   ```
   （仓库中已维护好 `gh-pages` 分支，内含全部构建产物，无需手动提交 dist。）
3. **开启 Pages**：进入仓库 → 左侧「服务」→「Gitee Pages」→ 选择：
   - 部署分支：`gh-pages`
   - 部署目录：`/`（根目录）
   - 强制 HTTPS：勾选
4. 点「**启动**」，等待片刻，访问：
   ```
   https://xiaowei864.gitee.io/tian-dao-xuan-ji
   ```

### 更新部署（重要）
Gitee Pages **没有自动部署**。每次更新代码后：
```bash
npm run build
git push gitee origin/gh-pages:gh-pages
```
然后回到「服务 → Gitee Pages」点「**更新**」按钮。

---

## 二、GitHub Pages（备用 · 免费）

```bash
npm run build
npm run deploy        # = gh-pages -d dist，推送到 GitHub 的 gh-pages 分支
```
访问：`https://xiaowei2025cqu23phy.github.io/tian-dao-xuan-ji`

---

## 三、腾讯 EdgeOne Pages（可选 · 国内直连 · push 自动部署）

1. 打开 [腾讯 EdgeOne Pages](https://console.cloud.tencent.com/edgeone/pages)，使用微信/QQ 登录。
2. 「创建项目」→ 选择 **Gitee 仓库** `xiaowei864/tian-dao-xuan-ji`，授权连接。
3. 构建配置：
   - 构建命令：`npm run build`
   - 输出目录：`dist`
   - 框架预设：`Vite`
4. 保存后自动构建，push 代码即自动重新部署，获得 `https://xxx.edgeone.app` 域名。

---

## 四、Vercel（可选 · 免费 · push 自动部署）

1. 打开 [vercel.com](https://vercel.com)，用 GitHub/Gitee 账号登录。
2. 「Add New Project」→ Import 仓库。
3. 框架预设选 **Vite**，输出目录自动识别为 `dist`，其余默认。
4. 部署后获得 `https://xxx.vercel.app` 域名，push 自动更新。

---

## 五、桌面端（Electron）

项目内置 Electron 支持，可将「天道玄机」打包为独立 Windows 程序：

```bash
# 1. 安装依赖（如网络慢，npm 会自动使用 npmmirror 镜像下载 Electron）
npm install

# 2. 本地直接运行桌面版（先构建再启动）
npm run desktop

# 3. 打包为绿色目录（免安装，直接运行 release/win-unpacked/天道玄机.exe）
npm run desktop:pack

# 4. 打包为 Windows 安装程序（release/天道玄机 Setup x.x.x.exe）
npm run desktop:build
```

说明：
- 桌面版与网页版共用同一套 `dist/` 产物，功能完全一致。
- 打包配置见 `electron-builder.yml`（应用名、图标、安装选项）。
- 图标可在 `public/icons/` 与 `build/icon.png` 找到（由 `npm run icons` 自动生成）。
- API 密钥仍通过页面右上角【设置】配置（仅存本地），不会写入安装包。

---

## 六、双平台同步小抄

```bash
# 源码推送到两个平台
git push origin main      # GitHub
git push gitee main       # Gitee

# 构建产物同步到两个平台
npm run build
git push origin gh-pages:gh-pages   # 本地没有 gh-pages 分支时用 origin/gh-pages:gh-pages 形式
git push gitee origin/gh-pages:gh-pages
```

---

## 常见问题

| 问题 | 解决 |
| --- | --- |
| Gitee Pages 里找不到启动按钮 | 先完成实名认证；检查仓库是否为公开仓库 |
| 部署后样式/图片 404 | 本项目已配置 `base: './'`（相对路径），静态托管直接可用，无需修改 |
| 部署后还是旧内容 | Gitee Pages 需手动点「更新」；浏览器强刷（Ctrl+F5） |
| 想自定义域名 | GitHub Pages/Gitee Pages 均支持；中国大陆访问的域名需 ICP 备案 |
| API 密钥怎么配 | 前端是纯静态站点，密钥在页面右上角【设置】中填写，仅存浏览器本地，不会上传 |
