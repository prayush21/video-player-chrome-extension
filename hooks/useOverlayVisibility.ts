import { RefObject, useCallback, useEffect, useRef, useState } from "react";

/**
 * Netflix-style overlay timing shared by both players: controls appear on
 * mouse move and hide after 3s of playback; the title/info card shows before
 * the first play and again after 5s paused. `firstPlayHoldMs` keeps the
 * shadows, controls and info card up that much longer on the first play, e.g.
 * so YouTube's own UI can fade out first.
 */
const useOverlayVisibility = (
  containerRef: RefObject<HTMLElement | null>,
  isPlaying: boolean,
  progress: number,
  firstPlayHoldMs = 0,
) => {
  const controlsTimeoutRef = useRef<number | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const infoHideTimerRef = useRef<number | null>(null);
  const firstPlayHoldPendingRef = useRef(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [infoOverlayVisible, setInfoOverlayVisible] = useState(true);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const hideControls = useCallback(() => {
    if (isPlaying) {
      setControlsVisible(false);
    }
  }, [isPlaying]);

  const showControls = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setControlsVisible(true);
    let delay = 3000;
    if (isPlaying && firstPlayHoldPendingRef.current) {
      firstPlayHoldPendingRef.current = false;
      delay += firstPlayHoldMs;
    }
    controlsTimeoutRef.current = window.setTimeout(hideControls, delay);
  }, [hideControls, isPlaying, firstPlayHoldMs]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", showControls);
      container.addEventListener("mouseleave", hideControls);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", showControls);
        container.removeEventListener("mouseleave", hideControls);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, hideControls]);

  useEffect(() => {
    showControls(); // show controls on initial load or state change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Handle info overlay visibility
  useEffect(() => {
    // Clear any existing pause timer
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (infoHideTimerRef.current) {
      clearTimeout(infoHideTimerRef.current);
      infoHideTimerRef.current = null;
    }

    if (isPlaying) {
      // Hide info overlay when playing
      if (hasStartedPlaying) {
        setInfoOverlayVisible(false);
      } else {
        // First play - hide overlay and mark as started
        setHasStartedPlaying(true);
        if (firstPlayHoldMs > 0) {
          infoHideTimerRef.current = window.setTimeout(
            () => setInfoOverlayVisible(false),
            firstPlayHoldMs,
          );
        } else {
          setInfoOverlayVisible(false);
        }
      }
    } else {
      // Video is paused
      if (hasStartedPlaying && progress > 0) {
        pauseTimerRef.current = window.setTimeout(() => {
          setInfoOverlayVisible(true);
        }, 5000); // 5 seconds
      }
      // If video hasn't started playing yet, keep overlay visible
      if (!hasStartedPlaying) {
        setInfoOverlayVisible(true);
      }
    }

    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, [isPlaying, hasStartedPlaying, progress, firstPlayHoldMs]);

  // For when the player switches to a new video.
  const resetOverlay = useCallback(() => {
    setHasStartedPlaying(false);
    setInfoOverlayVisible(true);
    firstPlayHoldPendingRef.current = true;
  }, []);

  return { controlsVisible, infoOverlayVisible, resetOverlay };
};

export default useOverlayVisibility;
