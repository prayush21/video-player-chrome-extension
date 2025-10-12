# 🎬 Streamline Player

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

**Prerequisites:** Node.js 16+

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
├── components/          # React components
│   ├── VideoPlayer.tsx  # Netflix-style player
│   ├── PlayerControls.tsx
│   ├── ProgressBar.tsx
│   ├── VolumeControl.tsx
│   ├── SettingsMenu.tsx
│   └── icons.tsx
├── hooks/              # Custom React hooks
│   └── usePlayerState.ts
├── utils/              # Utility functions
│   └── formatTime.ts
├── App.tsx             # Main app component
├── background.js       # Chrome extension background script
├── manifest.json       # Extension manifest
└── index.html          # Entry point
```

## 🎨 Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Chrome Extensions API** - Browser integration

## 🐛 Known Issues

- Some video URLs may not work due to CORS restrictions
- DRM-protected content is not supported

## 📝 License

MIT License - feel free to use this project however you'd like!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
