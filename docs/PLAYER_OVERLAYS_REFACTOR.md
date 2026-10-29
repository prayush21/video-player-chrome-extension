# Player Overlays Component Refactor

## Overview

Created a new `PlayerOverlays` component that encapsulates all three overlay layers: video info overlay, top bar (back button), and player controls. Added click-to-play/pause functionality to the video info overlay.

## Changes Made

### 1. New Component: `PlayerOverlays.tsx`

Created a unified component that manages all overlay layers:

- **Video Info Overlay Wrapper**: Contains the video information display
- **Player Top Bar**: Contains the back button with gradient background
- **Player Controls**: Contains all playback controls (play/pause, seek, volume, etc.)

#### Click Functionality

- Clicking anywhere on the video info overlay wrapper toggles play/pause
- Uses `e.stopPropagation()` to prevent event bubbling to the video element
- Only interactive when the overlay is visible (`pointer-events: auto/none`)

### 2. Updated `VideoPlayer.tsx`

- Removed individual overlay components (VideoInfoOverlay, PlayerControls, BackIcon imports)
- Imported the new `PlayerOverlays` component
- Simplified the JSX by replacing multiple overlay divs with a single `<PlayerOverlays />` component
- All overlay state and handlers are passed as props to the unified component

### 3. Updated CSS (`index.css`)

#### New Styles

Added `.video-info-overlay-wrapper` class:

```css
.video-info-overlay-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: opacity 0.5s ease-in-out;
  z-index: 5;
  cursor: pointer; /* Indicates clickability */
}
```

#### Z-Index Layering

- Video Info Overlay Wrapper: `z-index: 5` (middle layer)
- Player Overlay (controls): `z-index: 10` (top layer)
- This ensures controls are always clickable and appear above the info overlay

#### Removed Styles

- Removed `.video-info-overlay.hidden` and `.video-info-overlay.visible` classes
- Visibility is now managed by the wrapper class instead

### 4. Updated `VideoInfoOverlay.tsx`

- Removed the conditional `visible ? "visible" : "hidden"` class application
- The component now always renders with just the `video-info-overlay` class
- Visibility is controlled by the parent wrapper in `PlayerOverlays`

## Behavior

### Click Interaction Flow

1. **Info Overlay Visible & Clicked**:

   - Click event triggers `handleInfoOverlayClick` in PlayerOverlays
   - Calls `togglePlay()` to change video state
   - Event propagation is stopped
   - VideoPlayer's useEffect detects state change and hides overlay after a delay

2. **Info Overlay Hidden & Video Clicked**:

   - Click passes through to the video element
   - Video's own onClick handler calls `togglePlay()`

3. **Controls Clicked**:
   - Controls overlay has `e.stopPropagation()` to prevent video toggle
   - Individual control buttons perform their specific actions

### Visibility Management

The existing VideoPlayer logic handles overlay visibility:

- Shows on initial load (before playing)
- Hides when video starts playing
- Reappears after 5 seconds of being paused (configurable timer)
- Clicking the info overlay to play/pause triggers this visibility logic

## Benefits

1. **Better Organization**: All overlays are now managed in a single component
2. **Improved Interaction**: Click-to-play on info overlay provides better UX
3. **Cleaner Code**: Reduced duplication and simplified VideoPlayer component
4. **Proper Layering**: Z-index hierarchy ensures controls are always accessible
5. **Maintainability**: Easier to modify overlay behavior in one place

## Testing Checklist

- [x] Build succeeds without errors
- [ ] Info overlay appears on initial load
- [ ] Clicking info overlay toggles play/pause
- [ ] Info overlay hides when video plays
- [ ] Info overlay reappears after 5 seconds of pause
- [ ] Controls remain clickable when visible
- [ ] Back button works correctly
- [ ] No click interference between overlays
