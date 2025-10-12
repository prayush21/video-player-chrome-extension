import React from "react";
import {
  VolumeMuteIcon,
  VolumeLowIcon,
  VolumeMediumIcon,
  VolumeHighIcon,
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
    if (isMuted || volume === 0) return <VolumeMuteIcon />;
    if (volume < 0.33) return <VolumeLowIcon />;
    if (volume < 0.66) return <VolumeMediumIcon />;
    return <VolumeHighIcon />;
  };

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value));
  };

  return (
    <div className="flex items-center group/volume relative">
      <button
        onClick={onToggleMute}
        className="p-2 hover:bg-white/10 rounded-full transition-colors"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {getVolumeIcon()}
      </button>
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-10 h-32 p-2 bg-black/90 backdrop-blur-md rounded-lg opacity-0 group-hover/volume:opacity-100 transition-opacity pointer-events-none group-hover/volume:pointer-events-auto shadow-xl">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeSliderChange}
          className="w-32 h-2 appearance-none cursor-pointer origin-center -rotate-90 translate-x-12 translate-y-12 bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-gray-600/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
          aria-label="Volume"
        />
      </div>
    </div>
  );
};

export default VolumeControl;
