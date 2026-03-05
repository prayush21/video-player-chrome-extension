import React, { useState, useEffect, useRef } from "react";

interface VideoInfoOverlayProps {
  title: string;
  duration: number;
  visible: boolean;
  src: string;
  onTitleChange: (title: string) => void;
}

const VideoInfoOverlay: React.FC<VideoInfoOverlayProps> = ({
  title,
  duration,
  visible,
  src,
  onTitleChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentYear = new Date().getFullYear();

  // Sync if parent title changes (e.g. new video loaded)
  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  // Focus + select-all when editing starts
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDraftTitle(val);
    onTitleChange(val); // live update parent state as user types
  };

  const commitTitle = (save: boolean) => {
    const finalTitle = draftTitle.trim() || title;
    setDraftTitle(finalTitle);
    onTitleChange(finalTitle);
    if (save) {
      localStorage.setItem(`streamline_title_${src}`, finalTitle);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitTitle(true); // save to localStorage on Enter
    } else if (e.key === "Escape") {
      // Revert to the last committed title without saving
      setDraftTitle(title);
      onTitleChange(title);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    // Clicking away closes edit mode but does NOT save to localStorage
    commitTitle(false);
  };

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

  const displayTitle =
    draftTitle.length > 30 ? `${draftTitle.slice(0, 30)}...` : draftTitle;

  return (
    <div className="video-info-overlay">
      <div className="video-info-content">
        <p className="video-info-label">You're watching</p>
        <h1
          className={`video-info-title${isEditing ? " video-info-title--editing" : ""}`}
          onClick={handleTitleClick}
          onDoubleClick={(e) => e.stopPropagation()}
          title={isEditing ? undefined : "Click to rename"}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              className="video-title-input"
              value={draftTitle}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onClick={(e) => e.stopPropagation()}
              maxLength={80}
              aria-label="Edit video title"
            />
          ) : (
            displayTitle
          )}
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
