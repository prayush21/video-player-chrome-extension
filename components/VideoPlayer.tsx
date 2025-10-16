import React, { useRef, useState, useCallback, useEffect } from "react";
import usePlayerState from "../hooks/usePlayerState";
import PlayerOverlays from "./PlayerOverlays";

interface VideoPlayerProps {
  src: string;
  title: string;
  onBack: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title, onBack }) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
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
  const [infoOverlayVisible, setInfoOverlayVisible] = useState(true);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

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

  // Handle info overlay visibility
  useEffect(() => {
    // Clear any existing pause timer
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }

    if (playerState.isPlaying) {
      // Hide info overlay when playing
      if (hasStartedPlaying) {
        setInfoOverlayVisible(false);
      } else {
        // First play - hide overlay and mark as started
        setHasStartedPlaying(true);
        setInfoOverlayVisible(false);
      }
    } else {
      // Video is paused
      if (hasStartedPlaying && playerState.progress > 0) {
        // Start 30 second timer to show info overlay
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
  }, [playerState.isPlaying, hasStartedPlaying, playerState.progress]);

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={onBack} className="error-button">
          Go Back
        </button>
      </div>
    );
  }

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only toggle play if clicking on the video container itself, not controls
    if (e.target === e.currentTarget) {
      togglePlay();
    }
  };

  return (
    <div
      ref={playerContainerRef}
      className="player-container"
      onDoubleClick={toggleFullscreen}
      onClick={handleContainerClick}
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
        className="player-video"
      />

      {/* All Player Overlays (Info, Top Bar, Controls) */}
      <PlayerOverlays
        title={title}
        playerState={playerState}
        controlsVisible={controlsVisible}
        infoOverlayVisible={infoOverlayVisible}
        onBack={onBack}
        togglePlay={togglePlay}
        handleSeek={handleSeek}
        handleVolumeChange={handleVolumeChange}
        toggleMute={toggleMute}
        handlePlaybackRateChange={handlePlaybackRateChange}
        toggleFullscreen={toggleFullscreen}
        togglePip={togglePip}
      />
    </div>
  );
};

export default VideoPlayer;
