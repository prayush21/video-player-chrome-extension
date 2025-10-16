import React from "react";
import type { PlayerState } from "../hooks/usePlayerState";
import ProgressBar from "./ProgressBar";
import VolumeControl from "./VolumeControl";
import SettingsMenu from "./SettingsMenu";
import { formatTime } from "../utils/formatTime";
import {
  PlayIcon,
  PauseIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  PipEnterIcon,
  PipExitIcon,
  Replay10Icon,
  Forward10Icon,
  SubtitlesIcon2,
  MaximiseIcon,
  MinimiseIcon,
  Forward10Icon2,
  Replay10Icon2,
  PauseIcon2,
  PlayIcon2,
} from "./icons";

interface PlayerControlsProps {
  playerState: PlayerState;
  togglePlay: () => void;
  handleSeek: (time: number) => void;
  handleVolumeChange: (volume: number) => void;
  toggleMute: () => void;
  handlePlaybackRateChange: (rate: number) => void;
  toggleFullscreen: () => void;
  togglePip: () => void;
  title?: string;
}

const NextEpisodeIcon: React.FC = () => (
  <span className="icon-svg icon-skip-next icon-lg" aria-hidden="true" />
);

const SubtitlesIcon: React.FC = () => (
  <span className="icon-svg icon-subtitles" aria-hidden="true" />
);

const PlayerControls: React.FC<PlayerControlsProps> = ({
  playerState,
  togglePlay,
  handleSeek,
  handleVolumeChange,
  toggleMute,
  handlePlaybackRateChange,
  toggleFullscreen,
  togglePip,
  title = "Video Title",
}) => {
  const {
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    playbackRate,
    buffered,
    isFullscreen,
    isPipActive,
  } = playerState;

  const seekBackward = () => handleSeek(Math.max(0, progress - 10));
  const seekForward = () => handleSeek(Math.min(duration, progress + 10));

  return (
    <div className="controls-container">
      {/* Progress Bar */}
      <div
        style={{ marginBottom: "1rem", display: "flex", alignItems: "center" }}
      >
        <div style={{ flex: 1 }}>
          <ProgressBar
            progress={progress}
            duration={duration}
            buffered={buffered}
            onSeek={handleSeek}
          />
        </div>
        <div className="time-display" style={{ marginLeft: "1rem" }}>
          <span className="time-remaining">
            {formatTime(duration - progress)}
          </span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="controls-row">
        {/* Left Controls */}
        <div className="controls-group">
          <button
            onClick={togglePlay}
            className="control-btn"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <PauseIcon2 /> : <PlayIcon2 />}
          </button>
          <button
            onClick={seekBackward}
            className="control-btn"
            aria-label="Rewind 10 seconds"
          >
            <Replay10Icon2 />
          </button>
          <button
            onClick={seekForward}
            className="control-btn"
            aria-label="Forward 10 seconds"
          >
            <Forward10Icon2 />
          </button>
          <button
            className="control-btn"
            aria-label="Next episode"
            title="Next episode"
          >
            <NextEpisodeIcon />
          </button>
          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
          />
        </div>

        {/* Center - Title */}
        <div className="title-container">
          <h2 className="video-title">{title}</h2>
        </div>

        {/* Right Controls */}
        <div className="controls-group">
          <button
            className="control-btn"
            aria-label="Subtitles and audio"
            title="Subtitles and audio"
          >
            <SubtitlesIcon2 />
          </button>
          <SettingsMenu
            currentRate={playbackRate}
            onRateChange={handlePlaybackRateChange}
          />
          <button
            onClick={togglePip}
            className="control-btn"
            aria-label={
              isPipActive ? "Exit Picture-in-Picture" : "Picture-in-Picture"
            }
          >
            {isPipActive ? <PipExitIcon /> : <PipEnterIcon />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="control-btn"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <MinimiseIcon /> : <MaximiseIcon />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;
