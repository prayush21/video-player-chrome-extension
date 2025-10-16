import React from "react";
import type { PlayerState } from "../hooks/usePlayerState";
import PlayerControls from "./PlayerControls";
import VideoInfoOverlay from "./VideoInfoOverlay";
import { BackIcon } from "./icons";

interface PlayerOverlaysProps {
  title: string;
  playerState: PlayerState;
  controlsVisible: boolean;
  infoOverlayVisible: boolean;
  onBack: () => void;
  togglePlay: () => void;
  handleSeek: (time: number) => void;
  handleVolumeChange: (volume: number) => void;
  toggleMute: () => void;
  handlePlaybackRateChange: (rate: number) => void;
  toggleFullscreen: () => void;
  togglePip: () => void;
}

const PlayerOverlays: React.FC<PlayerOverlaysProps> = ({
  title,
  playerState,
  controlsVisible,
  infoOverlayVisible,
  onBack,
  togglePlay,
  handleSeek,
  handleVolumeChange,
  toggleMute,
  handlePlaybackRateChange,
  toggleFullscreen,
  togglePip,
}) => {
  const handleInfoOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Toggle play/pause when clicking anywhere on the info overlay
    e.stopPropagation();
    togglePlay();
  };

  return (
    <>
      {/* Video Info Overlay */}
      <div
        onClick={handleInfoOverlayClick}
        className={`video-info-overlay-wrapper ${
          infoOverlayVisible ? "visible" : "hidden"
        }`}
        style={{ pointerEvents: infoOverlayVisible ? "auto" : "none" }}
      >
        <VideoInfoOverlay
          title={title}
          duration={playerState.duration}
          visible={infoOverlayVisible}
        />
      </div>

      {/* Controls Overlay */}
      <div
        className={`player-overlay ${controlsVisible ? "visible" : "hidden"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient & Back Button */}
        <div className="player-top-bar">
          <button onClick={onBack} className="back-button" aria-label="Go back">
            <BackIcon />
            <span className="back-button-text">Back</span>
          </button>
        </div>

        {/* Player Controls */}
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
    </>
  );
};

export default PlayerOverlays;
