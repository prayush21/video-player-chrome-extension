import React from "react";
import {
  VolumeMuteIcon,
  VolumeLowIcon,
  VolumeMediumIcon,
  VolumeHighIcon,
  VolumeLowIcon2,
  VolumeMediumIcon2,
  VolumeHighIcon2,
  VolumeMuteIcon2,
} from "./icons";

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}) => {
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeMuteIcon2 />;
    if (volume < 0.33) return <VolumeLowIcon2 />;
    if (volume < 0.66) return <VolumeMediumIcon2 />;
    return <VolumeHighIcon2 />;
  };

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value));
  };

  return (
    <div className="volume-control">
      <button
        onClick={onToggleMute}
        className="control-btn"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {getVolumeIcon()}
      </button>
      <div className="volume-slider-container">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeSliderChange}
          className="volume-slider"
          aria-label="Volume"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${
              (isMuted ? 0 : volume) * 100
            }%, rgba(75, 85, 99, 0.5) ${
              (isMuted ? 0 : volume) * 100
            }%, rgba(75, 85, 99, 0.5) 100%)`,
          }}
        />
      </div>
    </div>
  );
};

export default VolumeControl;
