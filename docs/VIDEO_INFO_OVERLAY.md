# Video Info Overlay Feature

## Overview

Added a Netflix-style video information overlay that displays at the beginning of videos and reappears after 30 seconds of being paused.

## Implementation Details

### New Component: `VideoInfoOverlay.tsx`

Created a new component that displays:

- "You're watching" label
- Video title (from filename)
- Current year
- "No Rating" placeholder
- Video duration in "Xh Ym" format
- Lorem ipsum description

### Modified Files

#### 1. `components/VideoPlayer.tsx`

- Imported and integrated `VideoInfoOverlay` component
- Added state management for overlay visibility:
  - `infoOverlayVisible`: Controls overlay display
  - `hasStartedPlaying`: Tracks if video has started playing
- Added `pauseTimerRef` to manage 30-second timer
- Implemented overlay visibility logic:
  - Shows on initial load (before video starts)
  - Hides when video starts playing
  - Reappears after 30 seconds of being paused
  - Clears timer when video resumes playing

#### 2. `index.css`

Added comprehensive styling for the video info overlay:

- Gradient background (dark on left, fading to transparent on right)
- Large, bold title styling (3.5rem)
- Meta information layout (year, rating, duration)
- Description text styling
- Responsive design for tablets and mobile devices
- Smooth fade transitions

### Features

#### Display Logic

1. **Initial State**: Overlay is visible when video is loaded
2. **On Play**: Overlay fades out when video starts playing
3. **On Pause**: 30-second timer starts
4. **After 30s Pause**: Overlay fades back in
5. **Resume Play**: Timer is cleared and overlay fades out again

#### Information Displayed

- **Title**: Uses the video filename
- **Year**: Current year (2025)
- **Rating**: "No Rating" placeholder
- **Duration**: Calculated from video duration, formatted as "Xh Ym" or "Xm"
- **Description**: Lorem ipsum placeholder text

#### Styling

- Positioned absolutely over video
- Gradient background for readability
- Large, cinematic typography
- Smooth fade animations
- Responsive layout for different screen sizes
- Z-index: 1 (above video, below controls)

### Future Enhancements

- Extract actual metadata from video files
- Add genre tags
- Include cast/director information
- Support for custom descriptions
- Add IMDb/Rotten Tomatoes ratings integration
