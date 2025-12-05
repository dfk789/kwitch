# Kwitch 🟢

**Watch Kick streams on Twitch** — A browser extension that integrates your Kick.com channels into the Twitch sidebar.

## Features

- 🟢 **Unified Sidebar** — See your Kick channels alongside Twitch follows
- 🔴 **Live Status** — Red dot with viewer count for live channels (just like Twitch)
- 📺 **Seamless Watching** — Click a Kick channel to watch in an embedded player on Twitch
- 💬 **Kick Chat** — Kick chat appears alongside the stream when watching
- ⚡ **Smart Caching** — Channels still display (as offline) even if Kick's API is down
- 🎨 **Twitch-Native Look** — Matches Twitch's sidebar style with green accent for Kick branding

### From Source (Development)

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Open `chrome://extensions` (or your Chromium browser's equivalent)
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `dist/` folder

## Usage

1. Click the Kwitch extension icon in your browser toolbar
2. Add Kick channel usernames to your watchlist (use exact casing from Kick URL)
3. Visit twitch.tv — your Kick channels appear in the sidebar!
4. Click any Kick channel to watch the stream embedded on Twitch
5. Use the popup settings to change where the Kick section appears in the sidebar

### Settings

- **Sidebar Position**: Choose where the Kick section appears:
  - Above Followed Channels (default)
  - Below Followed Channels
  - Below Live Channels
  - Below Viewers Also Watch

## Development

```bash
npm install          # Install dependencies
npm run dev          # Build with watch mode
npm run build        # Production build
npm run lint         # Run linter
npm run typecheck    # Type checking only
```

### Project Structure

```
kwitch/
├── src/
│   ├── background/     # Service worker (API polling)
│   ├── content/        # Twitch page injection
│   ├── popup/          # Extension popup UI
│   └── lib/            # Shared types, storage, API
├── styles/             # CSS for injected content
├── icons/              # Extension icons
└── dist/               # Built extension (load this in Chrome)
```

## Tech Stack

- TypeScript
- Chrome Extension Manifest V3
- esbuild (for bundling)
- ESLint

## Browser Support

- ✅ Chrome
- ✅ Brave
- ✅ Vivaldi
- ✅ Edge
- ⚠️ Firefox (Manifest V3 support varies)

## License

MIT
