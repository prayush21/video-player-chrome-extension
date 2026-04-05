import React, { useRef, useState, useCallback } from "react";
import useVideoPreview from "../hooks/useVideoPreview";
import { formatTime } from "../utils/formatTime";

interface ProgressBarProps {
  progress: number;
  duration: number;
  buffered: number;
  videoSrc: string;
  onSeek: (time: number) => void;
}

const PREVIEW_WIDTH = 160;
const PREVIEW_HEIGHT = 90;
const HOVER_DWELL_MS = 150;
const HOVER_THROTTLE_MS = 140;
const HOVER_MIN_DELTA_PX = 8;

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  duration,
  buffered,
  videoSrc,
  onSeek,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const hoverDwellTimerRef = useRef<number | null>(null);
  const hoverThrottleTimerRef = useRef<number | null>(null);
  const hasTriggeredPreviewRef = useRef(false);
  const lastPreviewRequestAtRef = useRef(0);
  const lastPreviewXRef = useRef<number | null>(null);
  const pendingPreviewTimeRef = useRef<number | null>(null);
  const pendingPreviewXRef = useRef<number | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [hoverTime, setHoverTime] = useState(0);

  const { hasPreview, seekToTime, clearPreview } = useVideoPreview(
    videoSrc,
    previewCanvasRef,
  );

  const getSeekTime = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent> | MouseEvent,
  ) => {
    if (!progressBarRef.current) return 0;
    const { left, width } = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - left;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    return percentage * duration;
  };

  const getHoverInfo = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!progressBarRef.current) return { position: 0, time: 0 };
    const { left, width } = progressBarRef.current.getBoundingClientRect();
    const hoverX = e.clientX - left;
    const percentage = Math.max(0, Math.min(1, hoverX / width));

    // Clamp position so preview doesn't overflow the bar edges
    const halfPreview = PREVIEW_WIDTH / 2;
    const clampedPosition = Math.max(
      halfPreview,
      Math.min(width - halfPreview, hoverX),
    );

    return { position: clampedPosition, time: percentage * duration };
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (duration > 0) {
      onSeek(getSeekTime(e));
    }
  };

  const handleMouseDown = useCallback(() => {
    if (duration > 0) {
      setIsSeeking(true);
    }
  }, [duration]);

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      setIsSeeking(false);
      if (duration > 0) {
        onSeek(getSeekTime(e));
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    },
    [duration, onSeek],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isSeeking && duration > 0) {
        onSeek(getSeekTime(e));
      }
    },
    [isSeeking, duration, onSeek],
  );

  const clearHoverTimers = useCallback(() => {
    if (hoverDwellTimerRef.current !== null) {
      clearTimeout(hoverDwellTimerRef.current);
      hoverDwellTimerRef.current = null;
    }
    if (hoverThrottleTimerRef.current !== null) {
      clearTimeout(hoverThrottleTimerRef.current);
      hoverThrottleTimerRef.current = null;
    }
    pendingPreviewTimeRef.current = null;
    pendingPreviewXRef.current = null;
  }, []);

  const requestPreview = useCallback(
    (time: number, hoverX: number) => {
      seekToTime(time);
      hasTriggeredPreviewRef.current = true;
      lastPreviewRequestAtRef.current = Date.now();
      lastPreviewXRef.current = hoverX;
    },
    [seekToTime],
  );

  const schedulePreviewRequest = useCallback(
    (time: number, hoverX: number) => {
      pendingPreviewTimeRef.current = time;
      pendingPreviewXRef.current = hoverX;

      if (!hasTriggeredPreviewRef.current) {
        if (hoverDwellTimerRef.current === null) {
          hoverDwellTimerRef.current = window.setTimeout(() => {
            hoverDwellTimerRef.current = null;
            const nextTime = pendingPreviewTimeRef.current;
            const nextX = pendingPreviewXRef.current;
            if (nextTime !== null && nextX !== null) {
              requestPreview(nextTime, nextX);
            }
          }, HOVER_DWELL_MS);
        }
        return;
      }

      if (
        lastPreviewXRef.current !== null &&
        Math.abs(hoverX - lastPreviewXRef.current) < HOVER_MIN_DELTA_PX
      ) {
        return;
      }

      const elapsed = Date.now() - lastPreviewRequestAtRef.current;
      if (elapsed >= HOVER_THROTTLE_MS) {
        requestPreview(time, hoverX);
        return;
      }

      if (hoverThrottleTimerRef.current !== null) {
        return;
      }

      hoverThrottleTimerRef.current = window.setTimeout(() => {
        hoverThrottleTimerRef.current = null;
        const nextTime = pendingPreviewTimeRef.current;
        const nextX = pendingPreviewXRef.current;
        if (nextTime !== null && nextX !== null) {
          requestPreview(nextTime, nextX);
        }
      }, HOVER_THROTTLE_MS - elapsed);
    },
    [requestPreview],
  );

  const handleBarMouseMove = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (duration > 0) {
      const { position, time } = getHoverInfo(e);
      setHoverPosition(position);
      setHoverTime(time);
      schedulePreviewRequest(time, e.clientX);
    }
  };

  const handleBarMouseEnter = () => {
    if (duration > 0) {
      hasTriggeredPreviewRef.current = false;
      lastPreviewRequestAtRef.current = 0;
      lastPreviewXRef.current = null;
      clearHoverTimers();
      setIsHovering(true);
    }
  };

  const handleBarMouseLeave = () => {
    clearHoverTimers();
    hasTriggeredPreviewRef.current = false;
    lastPreviewRequestAtRef.current = 0;
    lastPreviewXRef.current = null;
    setIsHovering(false);
    clearPreview();
  };

  React.useEffect(() => {
    if (isSeeking) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isSeeking, handleMouseMove, handleMouseUp]);

  React.useEffect(() => {
    return () => {
      clearHoverTimers();
    };
  }, [clearHoverTimers]);

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={progressBarRef}
      onClick={handleSeek}
      onMouseDown={handleMouseDown}
      onMouseMove={handleBarMouseMove}
      onMouseEnter={handleBarMouseEnter}
      onMouseLeave={handleBarMouseLeave}
      className="progress-bar-container"
    >
      {/* Preview Tooltip */}
      {isHovering && (
        <div className="preview-tooltip" style={{ left: `${hoverPosition}px` }}>
          <div className="preview-image-container">
            <canvas
              ref={previewCanvasRef}
              width={Math.round(PREVIEW_WIDTH * (window.devicePixelRatio || 1))}
              height={Math.round(
                PREVIEW_HEIGHT * (window.devicePixelRatio || 1),
              )}
              className="preview-canvas"
              style={{
                width: PREVIEW_WIDTH,
                height: PREVIEW_HEIGHT,
                opacity: hasPreview ? 1 : 0,
              }}
            />
            {!hasPreview && <div className="preview-placeholder" />}
          </div>
          <div className="preview-time">{formatTime(hoverTime)}</div>
        </div>
      )}

      <div className="progress-bar-inner">
        {/* Buffered progress */}
        <div
          className="progress-buffered"
          style={{ width: `${bufferedPercent}%` }}
        />
        {/* Watched progress */}
        <div
          className="progress-watched"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Hover position indicator */}
        {isHovering && (
          <div
            className="progress-hover-indicator"
            style={{ left: `${hoverPosition}px` }}
          />
        )}
        {/* Scrubber handle */}
        <div
          className="progress-scrubber"
          style={{ left: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
