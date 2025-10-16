import React from "react";

interface VideoInfoOverlayProps {
  title: string;
  duration: number;
  visible: boolean;
}

const VideoInfoOverlay: React.FC<VideoInfoOverlayProps> = ({
  title,
  duration,
  visible,
}) => {
  const currentYear = new Date().getFullYear();

  // Format duration to "Xh Ym" format
  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) {
      return "0s";
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <div className="video-info-overlay">
      <div className="video-info-content">
        <p className="video-info-label">You're watching</p>
        <h1 className="video-info-title">
          {title.length > 30 ? `${title.slice(0, 30)}...` : title}
        </h1>
        <div className="video-info-meta">
          <span className="video-info-year">{currentYear}</span>
          <span className="video-info-separator">·</span>
          <span className="video-info-rating">No Rating</span>
          <span className="video-info-separator">·</span>
          <span className="video-info-duration">
            {formatDuration(duration)}
          </span>
        </div>
        <p className="video-info-description">No description available.</p>
      </div>
    </div>
  );
};

export default VideoInfoOverlay;
