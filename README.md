# 🎵 我的音乐电台 (Music Radio)

基于 Next.js App Router 和网易云音乐 API 构建的个人高颜值音乐电台。采用“高级粉奶油”手账风设计，支持策展频道、个性化电台、歌词律动、以及独创的**音乐手账**功能。

## ✨ 核心特性 (Features)

### 🎨 极致视觉体验
- **手账风美学设计**：高级粉奶油配色（`#F5F1E6` 背景 + `#D4858A` 强调色），配合三丽鸥水彩纹理，打造沉浸式治愈系界面。
- **环境光效背景 (Ambient Background)**：自动提取当前播放歌曲的封面图，通过极高的模糊半径与 Framer Motion 驱动的微呼吸动效，在底层生成随音乐变幻的自适应环境光。
- **丝滑交互动效**：全站由 Framer Motion 驱动，从平滑的路由切换、播放器展开、一直到骨架屏霓虹加载和 3D 视差歌词特效。

### 📻 混合电台模式
- **策展频道系统 (Channels)**：基于 SQLite 本地数据库管理的私人音乐频道，支持自定义分类、添加歌曲和封面配置，拥有完整的后台管理界面。
- **个性化推荐 (Radio)**：无缝接入网易云音乐 API 的“每日推荐”与“相似歌曲”算法，自动为你发掘好歌。

### 🎧 沉浸式核心播放器
- **全局浮动控制条**：无缝跨页面的自定义 `<audio>` 播放器，完美接管播放控制。
- **歌词与网易云热评**：内置智能 LRC 歌词解析器实现滚动高亮，同时支持右侧抽屉式展示网易云热门实时评论。

### 📖 独具匠心：音乐手账 (Music Diary)
- **听歌日记**：随时为当前播放的歌曲写下一段心情记录。
- **数据永久留存**：所有手账数据（包含歌曲信息和时间戳）会通过 Server Actions 被持久化存储在本地 SQLite 数据库中，成为你私人的音乐记忆库。

### ⚡ 现代化技术栈
- **前端框架**：Next.js 15+ (App Router), React 19
- **原子化样式**：Tailwind CSS v4
- **动画引擎**：Framer Motion
- **数据库与持久化**：Drizzle ORM + better-sqlite3 (服务端本地 SQLite)，搭配无缝的 `DataMigrator` 数据迁移模块。
- **PWA 原生体验**：接入 `@serwist/next`，支持离线缓存和将网页安装为桌面级 PWA 应用。

---

## 🛠️ 快速启动 (Getting Started)

### 1. 启动网易云 API 后端代理
本电台重度依赖 [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi) 来获取歌曲、歌词及评论。
```bash
# 克隆 API 服务
git clone https://github.com/Binaryify/NeteaseCloudMusicApi.git
cd NeteaseCloudMusicApi
npm install
# 必须指定在 4000 端口启动
set PORT=4000 && npx NeteaseCloudMusicApi
```

### 2. 启动前端项目
回到电台项目的根目录执行：
```bash
# 安装依赖
npm install

# 初始化并同步本地 SQLite 数据库
npx drizzle-kit push

# 启动开发服务器
npm run dev
```
启动成功后，访问 `http://localhost:3000` 即可开始体验！

---

## 📂 项目结构导览
- **`src/app/`**: Next.js App 路由（包含 `/radio` 推荐页、`/admin` 频道管理、`/diary` 日记页及 `/api/netease` 反向代理路由）。
- **`src/components/`**: 核心 UI 组件库，如全能播放器 (`Player.tsx`)、手账抽屉 (`music-diary.tsx`)、动态背景 (`ambient-background.tsx`)。
- **`src/db/`**: 本地 SQLite 数据库的 Schema 定义表，包含 `channels`（频道）、`diaries`（手账）等。
- **`src/contexts/`**: React Context 全局状态管理，其中的 `PlayerContext` 精确控制了多达 12 种播放器底层状态。
