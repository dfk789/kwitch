# Kwitch 🟢

**Watch Kick streams on Twitch** — A browser extension that integrates your Kick.com followed channels into the Twitch sidebar.

## Features

- 🟢 **Unified Sidebar** — See Kick channels alongside Twitch follows
- 🎨 **Visual Distinction** — Green border for Kick, B&W when offline
- 📺 **Seamless Watching** — Watch Kick streams without leaving Twitch
- 💬 **Kick Chat** — Chat replaces Twitch chat when watching Kick

## Installation

### From Source (Development)

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Open `chrome://extensions` (or your Chromium browser's equivalent)
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `dist/` folder

## Usage

1. Click the Kwitch icon in your browser toolbar
2. Add Kick channel names to your watchlist
3. Visit twitch.tv — your Kick follows appear in the sidebar!
4. Click a Kick channel to watch on the Twitch page

## Development

```bash
npm install          # Install dependencies
npm run dev          # Build with watch mode
npm run build        # Production build
npm run lint         # Run linter
npm run typecheck    # Type checking only
```

## Tech Stack

- TypeScript
- Chrome Extension Manifest V3
- Vite (for bundling)
- ESLint + Prettier

## Browser Support

- ✅ Chrome
- ✅ Brave
- ✅ Vivaldi
- ✅ Edge
- ⚠️ Firefox (Manifest V3 support varies)

## License

MIT
