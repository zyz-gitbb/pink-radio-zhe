# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

`music-radio` — a personal music radio station built with Next.js App Router + React 19 + Tailwind CSS 4 + Drizzle ORM (SQLite). It proxies the community NeteaseCloudMusicApi for song playback, search, lyrics, QR login, and recommendations. Data is persisted in a local SQLite database (`data.db`) with automatic migration from legacy localStorage. Features a Premium Pink & Cream Beige (Sanrio watercolor) theme with fluid full-width layout, framer-motion animations, and 3D parallax lyrics. Chinese-only, PC-first.

## Commands

```bash
npm run dev    # Start dev server (requires NeteaseCloudMusicApi running on localhost:4000)
npm run build  # Production build
npm run start  # Start production server
npm run lint   # ESLint via next lint
npm run test   # Run tests (vitest)
```

## External Dependency

The app requires a local [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi) server running at `http://localhost:4000` (configured via `.env.local` → `NETEASE_API_BASE_URL`). The `NeteaseCloudMusicApi/` directory in the repo is a stale submodule stub — the actual server must be run separately.

## Architecture

### Layout hierarchy

`layout.tsx` → `ClientLayout` → `UserProvider` → `PlayerProvider` → `<DataMigrator>` + `<BackgroundStamps>` + `<Sidebar>` + `<main>` + `<Player>` + `<Toast>`

- Fixed left sidebar (240px, `w-60` / `ml-60`)
- Fixed bottom player bar (padding `pb-32` on main content)
- Full-width fluid layout (全宽流式布局)
- UI components are `"use client"`. Server-side code includes API proxy route (`src/app/api/`) and database access via Server Actions (`src/app/actions.ts`).
- Framer Motion for page transitions and spring animations.

### State management

Two React Contexts with `useReducer`:

- **PlayerContext** (`src/contexts/player-context.tsx`) — 12 action types: PLAY_SONG, SET_PLAYLIST, TOGGLE_PLAY, PAUSE, PLAY, NEXT, PREV, SET_VOLUME, SET_PROGRESS, SET_DURATION, SET_PLAY_MODE, REMOVE_SONG. Manages audio playback via a global `<audio>` element.
- **UserContext** (`src/contexts/user-context.tsx`) — login status, nickname, avatar.

### API layer

- **Proxy:** `src/app/api/netease/[...path]/route.ts` — catch-all route forwarding to the local NeteaseCloudMusicApi. Converts POST→GET, passes cookies for login state.
- **Client:** `src/lib/api.ts` — all API calls go through `getRequest()`. Handles both official Netease field names (`artists`, `album`) and community API abbreviations (`ar`, `al`) via helper functions (`getSongArtists()`, `getSongAlbum()`, `getSongCoverUrl()`).
- **Server:** `src/lib/server-api.ts` — server-side fetch functions for playlist detail, recommendations, and daily songs (used by Server Components).

### Data persistence

- **Database:** `src/db/index.ts` — Drizzle ORM + better-sqlite3 local SQLite database (`data.db`), with WAL mode enabled for concurrent read/write performance.
- **Schema:** `src/db/schema.ts` — defines 4 tables:
  - `channels` — 频道 (id, name, description, category, coverUrl, tags, createdAt, updatedAt)
  - `channel_songs` — 频道歌曲关联 (channelId, songId, songName, artistName, coverUrl, addedAt), with foreign key cascade delete
  - `categories` — 分类标签 (name, sortOrder)
  - `diaries` — 音乐手账 (content, songId, songName, artistName, coverUrl, createdAt)
- **Server Actions:** `src/app/actions.ts` — full CRUD operations for channels, categories, songs, and diaries. Includes `repairDiaryMetadata()` for fixing missing song info via Netease API.
- **Data Migration:** `src/components/data-migrator.tsx` — client component that automatically migrates legacy localStorage data (channels, categories, diaries) to SQLite on first visit.
- **User session:** Cookie-based (passed through the proxy).

### Key routes

| Route | Purpose |
|---|---|
| `/` | Channel listing with category filter |
| `/channel/[id]` | Channel detail — song list, add songs |
| `/playlist/[id]` | Netease playlist detail |
| `/radio` | Personalized recommendations |
| `/diary` | Music diary (音乐手账) |
| `/admin` | Channel CRUD management |
| `/api/netease/[...path]` | API proxy |
| `/api-test` | Debug page for raw API testing |

### Key dependencies

| Package | Purpose |
|---|---|
| `next` ^16.2.6 | App Router framework |
| `react` / `react-dom` ^19.2.6 | UI library |
| `tailwindcss` ^4.3.0 | Utility-first CSS |
| `drizzle-orm` ^0.45.2 | Type-safe SQL ORM |
| `better-sqlite3` ^12.10.0 | SQLite driver |
| `framer-motion` ^12.40.0 | Animations & transitions |
| `swr` ^2.4.1 | Data fetching & caching |
| `lucide-react` ^1.16.0 | Icons |
| `serwist` / `@serwist/next` ^9.5.11 | PWA / service worker |

### Theme / styling

Tailwind v4 with custom tokens in `src/styles/globals.css` (`@theme` block): Premium Pink & Cream Beige theme — `background #F5F1E6`, `surface #FFFFFF`, `elevated #FAF8F3`, `border #DFDAD1`, `accent #D4858A`. Fonts: DM Sans (body), Space Grotesk (mono). Features Sanrio watercolor background textures, skeleton loading shimmers, and complex CSS animations.

### Path aliases

`@/*` → `./src/*` (tsconfig.json).

## Spec

Full product spec is in `SPEC.md` at the repo root — covers feature set, 5-phase dev plan, UI guidelines, and known risks. 