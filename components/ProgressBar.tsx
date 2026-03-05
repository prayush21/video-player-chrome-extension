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

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  duration,
  buffered,
  videoSrc,
  onSeek,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
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

  const handleBarMouseMove = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (duration > 0) {
      const { position, time } = getHoverInfo(e);
      setHoverPosition(position);
      setHoverTime(time);
      seekToTime(time);
    }
  };

  const handleBarMouseEnter = () => {
    if (duration > 0) {
      setIsHovering(true);
    }
  };

  const handleBarMouseLeave = () => {
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
