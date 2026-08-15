# 部署指南（免费方案）

「天道玄机」是纯前端静态站点（Vite 构建），**构建产物在 `dist/`**，可部署到任何静态托管服务。

> ⚠️ 重要：`dist/` 在 `.gitignore` 中（不进源码仓库），因此部署前必须先在本地构建：
> ```bash
> npm install
> npm run build        # 产物生成到 dist/
> ```
> 生产构建内置密钥防泄露守卫：若检测到真实 `GEMINI_API_KEY` 会直接报错终止。

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

## 五、双平台同步小抄

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
