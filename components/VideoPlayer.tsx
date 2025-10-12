import React, { useRef, useState, useCallback, useEffect } from "react";
import usePlayerState from "../hooks/usePlayerState";
import PlayerControls from "./PlayerControls";
import { BackIcon } from "./icons";

interface VideoPlayerProps {
  src: string;
  title: string;
  onBack: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title, onBack }) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const [error, setError] = useState<string>("");

  const {
    playerState,
    togglePlay,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleProgress,
    handleEnded,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    handlePlaybackRateChange,
    toggleFullscreen,
    togglePip,
  } = usePlayerState(videoRef, playerContainerRef);

  const [controlsVisible, setControlsVisible] = useState(true);

  const hideControls = useCallback(() => {
    if (playerState.isPlaying) {
      setControlsVisible(false);
    }
  }, [playerState.isPlaying]);

  const showControls = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setControlsVisible(true);
    controlsTimeoutRef.current = window.setTimeout(hideControls, 3000);
  }, [hideControls]);

  const handleError = () => {
    setError(
      "The video could not be loaded. Please check the source URL and ensure it is a direct link to a video file."
    );
  };

  useEffect(() => {
    const container = playerContainerRef.current;
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
  }, [playerState.isPlaying]);

  if (error) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      ref={playerContainerRef}
      className="w-full h-screen bg-black flex items-center justify-center relative group"
      onDoubleClick={toggleFullscreen}
    >
      <video
        ref={videoRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onProgress={handleProgress}
        onEnded={handleEnded}
        onError={handleError}
        onClick={togglePlay}
        className="max-w-full max-h-full"
      />
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Top Gradient & Back Button */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black via-black/60 to-transparent px-8 pt-6 pb-20">
          <button
            onClick={onBack}
            className="text-white hover:bg-white/10 transition-colors p-2 rounded-full flex items-center gap-2 group/back"
            aria-label="Go back"
          >
            <BackIcon />
            <span className="text-sm font-medium opacity-0 group-hover/back:opacity-100 transition-opacity">
              Back
            </span>
          </button>
        </div>
        <PlayerControls
          playerState={playerState}
          togglePlay={togglePlay}
          handleSeek={handleSeek}
          handleVolumeChange={handleVolumeChange}
          toggleMute={toggleMute}
          handlePlaybackRateChange={handlePlaybackRateChange}
          toggleFullscreen={toggleFullscreen}
          togglePip={togglePip}
          title={title}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
