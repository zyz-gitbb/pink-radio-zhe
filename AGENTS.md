# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

`music-radio` — a personal music radio station built with Next.js App Router + React 19 + Tailwind CSS 4 + Drizzle ORM (SQLite). It proxies the community NeteaseCloudMusicApi for song playback, search, lyrics, QR login, and recommendations. Data is stored locally using SQLite and localStorage. Features a Premium Pink & Cream Beige (Sanrio watercolor) theme with fluid full-width layout, framer-motion animations, and 3D parallax lyrics. Chinese-only, PC-first.

## Commands

```bash
npm run dev    # Start dev server (requires NeteaseCloudMusicApi running on localhost:4000)
npm run build  # Production build
npm run start  # Start production server
npm run lint   # ESLint via next lint
```

No test framework is configured yet.

## External Dependency

The app requires a local [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi) server running at `http://localhost:4000` (configured via `.env.local` → `NETEASE_API_BASE_URL`). The `NeteaseCloudMusicApi/` directory in the repo is a stale submodule stub — the actual server must be run separately.

## Architecture

### Layout hierarchy

`layout.tsx` → `ClientLayout` → `UserProvider` → `PlayerProvider` → `<Sidebar>` + `<main>` + `<Player>`

- Full-width fluid layout (全宽流式布局) with bottom player.
- Everything is `"use client"` for UI components. Server-side code includes the API proxy route and local SQLite database access (Drizzle ORM).
- Implements Framer Motion for page transitions and spring animations.

### State management

Two React Contexts with `useReducer`:

- **PlayerContext** (`src/contexts/player-context.tsx`) — 12 action types: PLAY_SONG, SET_PLAYLIST, TOGGLE_PLAY, PAUSE, PLAY, NEXT, PREV, SET_VOLUME, SET_PROGRESS, SET_DURATION, SET_PLAY_MODE, REMOVE_SONG. Manages audio playback via a global `<audio>` element.
- **UserContext** (`src/contexts/user-context.tsx`) — login status, nickname, avatar.

### API layer

- **Proxy:** `src/app/api/netease/[...path]/route.ts` — catch-all route forwarding to the local NeteaseCloudMusicApi. Converts POST→GET, passes cookies for login state.
- **Client:** `src/lib/api.ts` — all API calls go through `getRequest()`. Handles both official Netease field names (`artists`, `album`) and community API abbreviations (`ar`, `al`) via helper functions (`getSongArtists()`, `getSongAlbum()`, `getSongCoverUrl()`).

### Data persistence

- **Database:** Local SQLite database managed by Drizzle ORM (`better-sqlite3`) for persistent data.
- **Local Storage:** Used for client-side preferences and caching.
- **User session:** Cookie-based (passed through the proxy).

### Key routes

| Route | Purpose |
|---|---|
| `/` | Channel listing with category filter |
| `/channel/[id]` | Channel detail — song list, add songs |
| `/playlist/[id]` | Netease playlist detail |
| `/radio` | Personalized recommendations |
| `/admin` | Channel CRUD management |
| `/api/netease/[...path]` | API proxy |
| `/api-test` | Debug page for raw API testing |

### Theme / styling

Tailwind v4 with custom tokens in `src/styles/globals.css` (`@theme` block): Premium Pink & Cream Beige theme (`background #F5F1E6`, `surface #FFFFFF`, `accent #D4858A`). Fonts: DM Sans, Space Grotesk. Features Sanrio watercolor background textures, skeleton loading shimmers, and complex CSS animations.

### Path aliases

`@/*` → `./src/*` (tsconfig.json).

## Spec

Full product spec is in `SPEC.md` at the repo root — covers feature set, 5-phase dev plan, UI guidelines, and known risks. 