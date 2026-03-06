# CLAUDE.md

## Project Overview

A React-based IPTV web player that fetches a public M3U8 playlist from [Free-TV/IPTV](https://github.com/Free-TV/IPTV) and lets users browse channels by nation, favorite channels/nations, and watch live HLS streams in-browser.

## Tech Stack

- **React 19** with TypeScript (strict ESNext target, `react-jsx` transform)
- **Vite 6** — dev server on port 3000 (`0.0.0.0`), base path `./`
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **hls.js** — HLS stream playback (with native HLS fallback for Safari)
- **motion/react** (`motion` package) — animations and `AnimatePresence`
- **lucide-react** — icons
- **clsx + tailwind-merge** — conditional class merging via `cn()` helper

## Project Structure

```
src/
  main.tsx            # React entry point
  App.tsx             # Root component — state management, M3U8 parsing, layout
  types.ts            # Channel, ChannelGroup, Nation interfaces
  index.css           # Global styles (custom-scrollbar, etc.)
  components/
    ChannelList.tsx   # Sidebar — nation list + channel list with search & favorites
    VideoPlayer.tsx   # HLS video player with custom controls overlay
.github/workflows/
  deploy.yml          # GitHub Actions → GitHub Pages (builds on push to main)
vite.config.ts        # Vite config with Tailwind and React plugins
tsconfig.json         # TypeScript config
```

## Key Architecture Decisions

### Data Flow
- App fetches `https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8` on mount
- `parseM3U8()` in App.tsx parses `#EXTINF` lines; `group-title` field split on `;` gives `nation;category`
- Nations are extracted, deduped, sorted alphabetically, then favorite nations bubble to top
- Channel selection → `playingChannel` state drives VideoPlayer; persisted to `localStorage` as `legacy_iptv_last_channel`

### State Management
All state lives in `App.tsx` — no external state library. Key state:
- `allChannels` — full parsed channel list
- `nations` / `selectedNation` — navigation level (nation → channels)
- `channels` — channels for currently selected nation
- `selectedChannel` / `playingChannel` — highlighted vs. actively streaming channel
- `favoriteUrls` / `favoriteNationIds` — persisted in localStorage

### VideoPlayer
- Uses `hls.js` (`Hls.isSupported()`) with `lowLatencyMode: true`
- Falls back to native `<video src>` for Safari (`canPlayType('application/vnd.apple.mpegurl')`)
- Auto-hides controls after 3 seconds of inactivity
- Keyboard shortcuts: `Space` (play/pause), `M` (mute), `F` (fullscreen)
- Current branch (`feature/embed-youtube-twitch-streams-*`) is adding YouTube/Twitch embed support

### Sidebar Navigation
- Two-level: nation list → channel list (back button to return)
- `ChannelList` handles search filtering at both levels
- Favorites: star icon on nations + channels; favorites nation (`id: 'favorites'`) shows favorited channels across all nations
- Scrolls to top on nation change

### Responsive Layout
- Mobile breakpoint: `window.innerWidth < 1024` (lg)
- Mobile: sidebar slides in as overlay with backdrop; auto-closes on channel select
- Desktop: sidebar is fixed 320px width alongside main content

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build to ./dist
npm run preview  # Preview production build
npm run lint     # TypeScript type check (tsc --noEmit)
npm run clean    # rm -rf dist
```

## Styling Conventions

- Tailwind utility classes everywhere; no CSS modules
- Color palette: `zinc-*` for backgrounds/text, `emerald-*` for accents/active states, `amber-500` for favorites stars
- Dark mode: `dark:` variants throughout (system-preference based)
- `cn()` helper defined locally in both `VideoPlayer.tsx` and `ChannelList.tsx` using `clsx` + `twMerge`

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `legacy_iptv_last_channel` | Last playing channel (JSON) |
| `legacy_iptv_favorites` | Favorite channel URLs (JSON array) |
| `legacy_iptv_favorite_nations` | Favorite nation IDs (JSON array) |

## Deployment

GitHub Actions deploys `./dist` to GitHub Pages on every push to `main`. Uses Node 20 + `npm install` + `npm run build`.

## Notes

- The `@/` path alias resolves to the project root (not `src/`)
