# SVG Icon Setup Summary

## Icon Mapping

I've successfully set up your 11 SVG icon files to be used throughout the player. Here's the mapping:

### Icon Files → CSS Classes → Components

1. **play_arrow_40dp_E3E3E3_FILL0_wght400_GRAD0_opsz40.svg**

   - CSS: `.icon-play`
   - Component: `PlayIcon`
   - Used in: Play/Pause button

2. **dynamic_feed_40dp_E3E3E3_FILL0_wght400_GRAD0_opsz40.svg**

   - CSS: `.icon-pause`
   - Component: `PauseIcon`
   - Used in: Play/Pause button (when playing)
   - _Note: This is a temporary mapping. You may want to get a proper pause icon._

3. **volume_mute_40dp_E3E3E3_FILL0_wght400_GRAD0_opsz40.svg**

   - CSS: `.icon-volume-mute`
   - Component: `VolumeMuteIcon`
   - Used in: Volume control (when muted)

4. **volume_up_40dp_E3E3E3_FILL0_wght400_GRAD0_opsz40.svg**

   - CSS: `.icon-volume-up`
   - Components: `VolumeLowIcon`, `VolumeMediumIcon`, `VolumeHighIcon`
   - Used in: Volume control (all volume states)

5. **replay_10_40dp_E3E3E3_FILL0_wght400_GRAD0_opsz40.svg**

   - CSS: `.icon-replay-10`
   - Component: `Replay10Icon`
   - Used in: Rewind 10 seconds button

6. **forward_10_40dp_E3E3E3_FILL0_wght400_GRAD0_opsz40.svg**

   - CSS: `.icon-forward-10`
   - Component: `Forward10Icon`
   - Used in: Forward 10 seconds button

7. **skip_next_40dp_E3E3E3_FILL0_wght400_GRAD0_opsz40.svg**

   - CSS: `.icon-skip-next`
   - Component: `NextEpisodeIcon`
   - Used in: Next episode button

8. **subtitles_40dp_E3E3E3_FILL0_wght400_GRAD0_opsz40.svg**

   - CSS: `.icon-subtitles`
   - Component: `SubtitlesIcon`
   - Used in: Subtitles/audio button

9. **speed_40dp_E3E3E3_FILL0_wght400_GRAD0_opsz40.svg**

   - CSS: `.icon-settings`
   - Component: `SettingsIcon`
   - Used in: Settings menu (playback speed)

10. **fullscreen_40dp_E3E3E3_FILL0_wght400_GRAD0_opsz40.svg**

    - CSS: `.icon-fullscreen-enter`
    - Component: `FullscreenEnterIcon`
    - Used in: Fullscreen button (when not in fullscreen)

11. **fullscreen_exit_40dp_E3E3E3_FILL0_wght400_GRAD0_opsz40.svg**
    - CSS: `.icon-fullscreen-exit`
    - Component: `FullscreenExitIcon`
    - Used in: Fullscreen button (when in fullscreen)

## Files Modified

1. **`index.css`** - Added CSS classes for all SVG icons with background-image references
2. **`components/icons.tsx`** - Converted icon components to use CSS classes instead of inline SVG paths
3. **`components/PlayerControls.tsx`** - Updated inline icon components to use CSS-based approach

## Testing

The project has been successfully built. You can now:

1. Load the extension in Chrome
2. Test each button to verify the icons appear correctly
3. Check that hover states and interactions work as expected

## Notes

- Icons are loaded from `/public/icons/` which gets served at `/icons/` in the built app
- The base size is 24x24px, with a `.icon-lg` variant at 28x28px
- PIP (Picture-in-Picture) icons are still using inline SVG as you don't have SVG files for them
- Consider getting a proper pause icon to replace the `dynamic_feed` icon currently being used
