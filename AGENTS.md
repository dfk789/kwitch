# AGENTS.md — Kwitch Extension

> **This document is authoritative.** If any other doc conflicts, AGENTS.md wins.

## Project Overview

**Kwitch** is a Chromium browser extension that displays Kick.com followed channels alongside Twitch.tv followed channels. When on twitch.tv, users see their Kick follows integrated into the sidebar with visual distinction (green border), and can watch Kick streams directly on the Twitch page.

## Architecture

```
kwitch/
├── manifest.json           # Extension manifest (v3)
├── src/
│   ├── background/
│   │   └── service-worker.ts   # Polls Kick API, manages channel state
│   ├── content/
│   │   ├── inject-sidebar.ts   # Injects Kick channels into Twitch sidebar
│   │   └── inject-player.ts    # Replaces Twitch player with Kick embed
│   ├── popup/
│   │   ├── popup.html          # Extension popup UI
│   │   ├── popup.ts            # Popup logic
│   │   └── popup.css           # Popup styles
│   ├── options/
│   │   ├── options.html        # Options page
│   │   └── options.ts          # Options logic
│   └── lib/
│       ├── kick-api.ts         # Kick API client
│       ├── storage.ts          # Chrome storage wrapper
│       └── types.ts            # Shared TypeScript types
├── assets/
│   └── icons/                  # Extension icons
├── styles/
│   └── content.css             # Injected styles for Twitch
├── dist/                       # Built extension (gitignored)
├── docs/
│   └── tasks/                  # Task-specific documentation
├── STATUS.md                   # Active task tracking
├── CODE_STANDARDS.md           # Coding standards
└── README.md                   # Project overview
```

## Key Decisions (Locked)

1. **Manifest V3** - Required for modern Chromium extensions
2. **TypeScript** - Type safety throughout
3. **Manual channel list first** - Auth complexity deferred
4. **Progressive embed fallback** - Try iframe → popout → new tab
5. **Polling interval**: 60 seconds default, configurable

## Development Workflow

1. Claim work in `STATUS.md` before starting
2. Keep `STATUS.md` updated during execution
3. Follow `CODE_STANDARDS.md` for all code

## Build & Load

```bash
npm install
npm run build        # Build to dist/
npm run dev          # Watch mode
```

Load `dist/` as unpacked extension in chrome://extensions (enable Developer Mode).

## API Endpoints Used

### Kick

- Channel info: `https://kick.com/api/v2/channels/{slug}`
- Player embed: `https://kick.com/player/{slug}`
- Chat embed: `https://kick.com/popout/{slug}/chat`

### Twitch (DOM injection targets)

- Sidebar container: `.side-nav-section`
- Channel card: `.side-nav-card`
