# 🎬 Netflix-like Video Player

A high-fidelity video player Chrome extension with a sleek Netflix-inspired UI. Play local video files or video URLs directly in your browser with a premium viewing experience.

## ✨ Features

- **Netflix-Style Interface**: Beautiful, intuitive controls that hide automatically
- **Instagram Reels Mode**: Vertical video player with social media-style UI
- **Flexible Video Sources**: Support for local files and remote URLs
- **Advanced Controls**:
  - Play/Pause with keyboard shortcuts
  - 10-second skip forward/backward
  - Volume control with vertical slider
  - Playback speed adjustment (0.5x to 2x)
  - Picture-in-Picture mode
  - Fullscreen support
  - Progress bar with seek functionality
- **My List for X and YouTube**: Save videos while you browse and binge them back to back
- **Context Menu Integration**: Right-click on videos or links to open in Streamline Player

## 🚀 Installation

### Option 1: Load Unpacked (Development)

1. **Clone and Build**:

   ```bash
   git clone <repository-url>
   cd streamline-player
   npm install
   npm run build
   ```

2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)
   - Click **"Load unpacked"**
   - Select the `dist` folder
   - The extension icon should appear in your toolbar! 🎉

### Option 2: Chrome Web Store (Coming Soon)

## 🎮 Usage

### Method 1: Click Extension Icon

- Click the Streamline Player icon in your Chrome toolbar
- If on a page with video, it will be detected automatically
- Otherwise, manually enter a video URL or upload a local file

### Method 2: Context Menu

- Right-click on any video, link, or page
- Select "Play with Streamline Player (Netflix)" or "Play with Streamline Player (Reels)"
- Video opens in a new tab with the selected player style

### Keyboard Shortcuts

- `Space` - Play/Pause
- `Left Arrow` - Rewind 10 seconds
- `Right Arrow` - Forward 10 seconds
- `F` - Toggle fullscreen
- `M` - Mute/Unmute
- Double-click video - Toggle fullscreen

## 🛠️ Development

**Prerequisites:** Node.js 20+ (see `.nvmrc`)

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Development mode**:

   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## 📦 Project Structure

```
streamline-player/
├── App.tsx               # Popup/player page: source picker, My List, player
├── components/           # React components (VideoPlayer, WatchList, controls…)
├── hooks/                # usePlayerState, useVideoPreview, useWatchList
├── utils/                # formatTime, formatVideoTitle
├── public/               # Copied to dist/ as-is
│   ├── manifest.json     # Extension manifest (version kept in sync with package.json)
│   ├── background.js     # MV3 service worker (context menu, My List storage)
│   ├── content/          # "My List" button: common.js + one adapter per site
│   │                     # (x.js + x-intercept.js, youtube.js)
│   ├── icons/ clips/
├── scripts/              # verify-dist, package, sync-version, permissions.lock.json
├── tests/                # Vitest unit tests
└── docs/                 # Design notes and RELEASING.md
```

Useful scripts: `npm run release:check` (typecheck + tests + build + verify),
`npm run package` (zip to `release/`). See [docs/RELEASING.md](docs/RELEASING.md).

## 🎨 Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Chrome Extensions API** - Browser integration

## 🐛 Known Issues

- Some video URLs may not work due to CORS restrictions
- DRM-protected content is not supported

## � Privacy

Streamline Player respects your privacy. We do not collect, store, or share any personal data. For more details, please see our [Privacy Policy](PRIVACY_POLICY.md).

## �📝 License

MIT License - feel free to use this project however you'd like!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
