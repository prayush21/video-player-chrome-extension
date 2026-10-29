import React, { useRef } from "react";
import PlayerOverlays from "./PlayerOverlays";
import useOverlayVisibility from "../hooks/useOverlayVisibility";
import useYouTubePlayer from "../hooks/useYouTubePlayer";

// Plays a saved YouTube video with the same Netflix-style controls as
// VideoPlayer. The embed is loaded with YouTube's own controls turned off
// (controls=0) and driven through its postMessage API; YouTube's branding
// stays visible. No picture-in-picture or hover thumbnails: both need the
// video file, which YouTube doesn't expose.

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  onBack: () => void;
  onTitleChange: (title: string) => void;
  onNext?: () => void;
  onFinished?: () => void;
}

// Keep our shadows and controls up a bit after the first play so YouTube's own
// title bar and controls fade out first.
const YOUTUBE_FIRST_PLAY_HOLD_MS = 2000;

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  title,
  onBack,
  onTitleChange,
  onNext,
  onFinished,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const {
    playerState,
    startListening,
    togglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    handlePlaybackRateChange,
    toggleFullscreen,
  } = useYouTubePlayer(iframeRef, containerRef, onFinished);

  const { controlsVisible, infoOverlayVisible } = useOverlayVisibility(
    containerRef,
    playerState.isPlaying,
    playerState.progress,
    YOUTUBE_FIRST_PLAY_HOLD_MS,
  );

  const params = new URLSearchParams({
    autoplay: "1",
    controls: "0",
    enablejsapi: "1",
    rel: "0",
    playsinline: "1",
    origin: window.location.origin,
  });

  return (
    <div
      ref={containerRef}
      className="player-container"
      onDoubleClick={toggleFullscreen}
    >
      <iframe
        ref={iframeRef}
        key={videoId}
        className="yt-player-frame"
        src={`https://www.youtube.com/embed/${videoId}?${params}`}
        title={title}
        allow="autoplay; encrypted-media; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={startListening}
      />
      {/* Mouse events don't reach the page from inside the iframe, so this
          layer catches hover (to show the controls) and click to pause. */}
      <div className="yt-player-shield" onClick={togglePlay} />

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
        videoSrc=""
        onTitleChange={onTitleChange}
        onNext={onNext}
      />
    </div>
  );
};

export default YouTubePlayer;
