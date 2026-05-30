# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`music-radio` — a personal music radio station built with Next.js App Router + React 19 + Tailwind CSS 4. It proxies the community NeteaseCloudMusicApi for song playback, search, lyrics, QR login, and recommendations. All data is stored in localStorage (no database). Chinese-only, PC-first, dark cyberpunk theme.

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

- Fixed left sidebar (240px, `ml-60`)
- Fixed bottom player bar (80px, `pb-28` on content)
- Everything is `"use client"` — no SSR data fetching. The only server-side code is the API proxy route.

### State management

Two React Contexts with `useReducer`:

- **PlayerContext** (`src/contexts/player-context.tsx`) — 12 action types: PLAY_SONG, SET_PLAYLIST, TOGGLE_PLAY, PAUSE, PLAY, NEXT, PREV, SET_VOLUME, SET_PROGRESS, SET_DURATION, SET_PLAY_MODE, REMOVE_SONG. Manages audio playback via a global `<audio>` element.
- **UserContext** (`src/contexts/user-context.tsx`) — login status, nickname, avatar.

### API layer

- **Proxy:** `src/app/api/netease/[...path]/route.ts` — catch-all route forwarding to the local NeteaseCloudMusicApi. Converts POST→GET, passes cookies for login state.
- **Client:** `src/lib/api.ts` — all API calls go through `getRequest()`. Handles both official Netease field names (`artists`, `album`) and community API abbreviations (`ar`, `al`) via helper functions (`getSongArtists()`, `getSongAlbum()`, `getSongCoverUrl()`).

### Data persistence

- **Channels:** `src/lib/storage.ts` — localStorage CRUD with a custom `channels-changed` DOM event for cross-component sync.
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

Tailwind v4 with custom tokens in `src/styles/globals.css` (`@theme` block): `background #09090b`, `surface #18181b`, `elevated #27272a`, `border #3f3f46`, `accent #ef4444`. Fonts: Inter, JetBrains Mono. Custom scrollbar utilities in globals.css.

### Path aliases

`@/*` → `./src/*` (tsconfig.json).

## Spec

Full product spec is in `SPEC.md` at the repo root — covers feature set, 5-phase dev plan, UI guidelines, and known risks.
