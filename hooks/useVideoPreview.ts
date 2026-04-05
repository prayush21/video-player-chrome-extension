import { useRef, useCallback, useEffect, useState, RefObject } from "react";

// Display size of the preview canvas (CSS pixels)
const CANVAS_CSS_WIDTH = 160;
const CANVAS_CSS_HEIGHT = 90;
const PREVIEW_SEEK_DEBOUNCE_MS = 120;
const HAVE_METADATA_READY_STATE = 1;

// Round time to 1-second intervals for cache keys
const getCacheKey = (time: number) => Math.round(time);

const useVideoPreview = (
  videoSrc: string,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) => {
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const seekTimeoutRef = useRef<number | null>(null);
  const lastRequestedTime = useRef<number>(-1);
  const pendingSeekTimeRef = useRef<number | null>(null);
  const metadataReadyRef = useRef(false);
  const frameCacheRef = useRef<Map<number, ImageData>>(new Map());
  const [hasPreview, setHasPreview] = useState(false);

  // Compute device-pixel-ratio-aware buffer dimensions
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const bufferWidth = Math.round(CANVAS_CSS_WIDTH * dpr);
  const bufferHeight = Math.round(CANVAS_CSS_HEIGHT * dpr);

  // Draw an ImageData onto the canvas
  const drawCachedFrame = useCallback(
    (imageData: ImageData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.putImageData(imageData, 0, 0);
      setHasPreview(true);
    },
    [canvasRef],
  );

  // Initialize offscreen video
  useEffect(() => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = videoSrc;

    previewVideoRef.current = video;
    frameCacheRef.current = new Map();
    metadataReadyRef.current = false;
    pendingSeekTimeRef.current = null;

    const handleLoadedMetadata = () => {
      metadataReadyRef.current = true;

      const pendingTime = pendingSeekTimeRef.current;
      if (pendingTime === null || !isFinite(video.duration)) return;

      pendingSeekTimeRef.current = null;
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }

      seekTimeoutRef.current = window.setTimeout(() => {
        if (
          isFinite(pendingTime) &&
          pendingTime >= 0 &&
          pendingTime <= video.duration
        ) {
          if (typeof video.fastSeek === "function") {
            video.fastSeek(pendingTime);
          } else {
            video.currentTime = pendingTime;
          }
        }
      }, PREVIEW_SEEK_DEBOUNCE_MS);
    };

    const handleSeeked = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx && video.videoWidth > 0) {
        // Scale canvas buffer for Retina / high-DPI
        canvas.width = bufferWidth;
        canvas.height = bufferHeight;

        // Maintain aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight;
        let drawWidth = bufferWidth;
        let drawHeight = bufferWidth / aspectRatio;

        if (drawHeight > bufferHeight) {
          drawHeight = bufferHeight;
          drawWidth = bufferHeight * aspectRatio;
        }

        const offsetX = (bufferWidth - drawWidth) / 2;
        const offsetY = (bufferHeight - drawHeight) / 2;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, bufferWidth, bufferHeight);
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

        // Frame is now visible on canvas
        setHasPreview(true);

        // Try to cache the frame (may fail on tainted/cross-origin canvas)
        try {
          const key = getCacheKey(video.currentTime);
          const imageData = ctx.getImageData(0, 0, bufferWidth, bufferHeight);
          frameCacheRef.current.set(key, imageData);

          // Cap cache size at 100 frames (~1.5 MB)
          if (frameCacheRef.current.size > 100) {
            const firstKey = frameCacheRef.current.keys().next().value;
            if (firstKey !== undefined) frameCacheRef.current.delete(firstKey);
          }
        } catch {
          // Canvas is tainted by cross-origin video — caching disabled,
          // but live drawImage still works fine for each seek.
        }
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);
      video.pause();
      video.removeAttribute("src");
      video.load();
      previewVideoRef.current = null;
      frameCacheRef.current.clear();
      metadataReadyRef.current = false;
      pendingSeekTimeRef.current = null;
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
    };
  }, [videoSrc, canvasRef, bufferWidth, bufferHeight]);

  const seekToTime = useCallback(
    (time: number) => {
      const video = previewVideoRef.current;
      if (!video) return;

      // Avoid seeking to the same time repeatedly
      if (Math.abs(lastRequestedTime.current - time) < 0.5) return;
      lastRequestedTime.current = time;

      // Check cache first — instant render, no seek needed
      const key = getCacheKey(time);
      const cached = frameCacheRef.current.get(key);
      if (cached) {
        drawCachedFrame(cached);
        return;
      }

      // Avoid seek work until metadata is available.
      if (
        !metadataReadyRef.current ||
        video.readyState < HAVE_METADATA_READY_STATE ||
        !isFinite(video.duration)
      ) {
        pendingSeekTimeRef.current = time;
        return;
      }

      // Debounce rapid seeks
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }

      seekTimeoutRef.current = window.setTimeout(() => {
        if (video && isFinite(time) && time >= 0 && time <= video.duration) {
          // Use fastSeek for speed (nearest keyframe), fall back to currentTime
          if (typeof video.fastSeek === "function") {
            video.fastSeek(time);
          } else {
            video.currentTime = time;
          }
        }
      }, PREVIEW_SEEK_DEBOUNCE_MS);
    },
    [drawCachedFrame],
  );

  const clearPreview = useCallback(() => {
    lastRequestedTime.current = -1;
    pendingSeekTimeRef.current = null;
    setHasPreview(false);
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }
  }, []);

  return {
    hasPreview,
    seekToTime,
    clearPreview,
  };
};

export default useVideoPreview;
