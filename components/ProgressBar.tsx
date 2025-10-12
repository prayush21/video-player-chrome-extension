import React, { useRef, useState, useCallback } from "react";

interface ProgressBarProps {
  progress: number;
  duration: number;
  buffered: number;
  onSeek: (time: number) => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  duration,
  buffered,
  onSeek,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  const getSeekTime = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent> | MouseEvent
  ) => {
    if (!progressBarRef.current) return 0;
    const { left, width } = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - left;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    return percentage * duration;
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
    [duration, onSeek]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isSeeking && duration > 0) {
        onSeek(getSeekTime(e));
      }
    },
    [isSeeking, duration, onSeek]
  );

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
      className="w-full h-1 bg-gray-600/40 cursor-pointer group/progress relative rounded-full overflow-hidden hover:h-1.5 transition-all"
    >
      <div className="relative h-full">
        {/* Buffered progress */}
        <div
          className="absolute h-full bg-gray-400/30 rounded-full"
          style={{ width: `${bufferedPercent}%` }}
        />
        {/* Watched progress */}
        <div
          className="absolute h-full bg-red-600 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Scrubber handle */}
        <div
          className="absolute h-3 w-3 bg-red-600 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
          style={{ left: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
