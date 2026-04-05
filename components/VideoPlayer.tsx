import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import usePlayerState from "../hooks/usePlayerState";
import PlayerOverlays from "./PlayerOverlays";

interface VideoPlayerProps {
  src: string;
  title: string;
  onBack: () => void;
  onTitleChange: (title: string) => void;
  preRollSrc?: string;
  postRollSrc?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  onBack,
  onTitleChange,
  preRollSrc,
  postRollSrc,
}) => {
  type PlaybackPhase = "pre" | "main" | "post" | "done";
  type ClipPhase = Exclude<PlaybackPhase, "done">;

  const CLIP_PHASES: ClipPhase[] = ["pre", "main", "post"];

  const getInitialPhase = useCallback(
    (): PlaybackPhase => (preRollSrc ? "pre" : "main"),
    [preRollSrc],
  );

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const [error, setError] = useState<string>("");
  const [playbackPhase, setPlaybackPhase] =
    useState<PlaybackPhase>(getInitialPhase);
  const [activeSrc, setActiveSrc] = useState<string>(preRollSrc || src);
  const [segmentDurations, setSegmentDurations] = useState<
    Record<ClipPhase, number>
  >({
    pre: 0,
    main: 0,
    post: 0,
  });

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

  const hasPreRoll = Boolean(preRollSrc);
  const hasPostRoll = Boolean(postRollSrc);

  const getPhaseSrc = useCallback(
    (phase: ClipPhase): string => {
      if (phase === "pre") return preRollSrc || src;
      if (phase === "post") return postRollSrc || src;
      return src;
    },
    [preRollSrc, postRollSrc, src],
  );

  const phaseOrder = useMemo(
    () =>
      CLIP_PHASES.filter(
        (phase) =>
          phase === "main" || (phase === "pre" ? hasPreRoll : hasPostRoll),
      ),
    [hasPreRoll, hasPostRoll],
  );

  const effectiveDurations = useMemo(() => {
    const currentClipDuration = playerState.duration || 0;
    return {
      pre:
        playbackPhase === "pre"
          ? Math.max(segmentDurations.pre, currentClipDuration)
          : segmentDurations.pre,
      main:
        playbackPhase === "main"
          ? Math.max(segmentDurations.main, currentClipDuration)
          : segmentDurations.main,
      post:
        playbackPhase === "post"
          ? Math.max(segmentDurations.post, currentClipDuration)
          : segmentDurations.post,
    };
  }, [playerState.duration, playbackPhase, segmentDurations]);

  const getPhaseStartOffset = useCallback(
    (phase: ClipPhase) => {
      if (phase === "pre") return 0;
      if (phase === "main") return hasPreRoll ? effectiveDurations.pre : 0;
      return (
        (hasPreRoll ? effectiveDurations.pre : 0) + effectiveDurations.main
      );
    },
    [effectiveDurations.main, effectiveDurations.pre, hasPreRoll],
  );

  const getCompositeDuration = useCallback(
    () =>
      (hasPreRoll ? effectiveDurations.pre : 0) +
      effectiveDurations.main +
      (hasPostRoll ? effectiveDurations.post : 0),
    [
      effectiveDurations.main,
      effectiveDurations.post,
      effectiveDurations.pre,
      hasPostRoll,
      hasPreRoll,
    ],
  );

  const resolveVirtualTime = useCallback(
    (time: number): { phase: ClipPhase; localTime: number } => {
      const preDuration = hasPreRoll ? effectiveDurations.pre : 0;
      const mainDuration = effectiveDurations.main;

      if (hasPreRoll && time < preDuration) {
        return { phase: "pre", localTime: time };
      }

      const mainStart = preDuration;
      const mainEnd = mainStart + mainDuration;
      if (mainDuration <= 0 || !hasPostRoll || time < mainEnd) {
        return {
          phase: "main",
          localTime: Math.max(0, time - mainStart),
        };
      }

      return {
        phase: "post",
        localTime: Math.max(0, time - mainEnd),
      };
    },
    [effectiveDurations.main, effectiveDurations.pre, hasPostRoll, hasPreRoll],
  );

  const composedPlayerState = useMemo(() => {
    if (playbackPhase === "done") {
      return playerState;
    }

    const phase = playbackPhase as ClipPhase;
    const phaseOffset = getPhaseStartOffset(phase);
    const compositeDuration = getCompositeDuration();
    const progress = Math.min(
      compositeDuration,
      phaseOffset + Math.max(0, playerState.progress),
    );
    const buffered = Math.min(
      compositeDuration,
      phaseOffset + Math.max(0, playerState.buffered),
    );

    return {
      ...playerState,
      progress,
      buffered,
      duration:
        compositeDuration > 0 ? compositeDuration : playerState.duration,
    };
  }, [getCompositeDuration, getPhaseStartOffset, playbackPhase, playerState]);

  useEffect(() => {
    const loadClipDuration = (clipSrc: string) => {
      return new Promise<number>((resolve) => {
        const probeVideo = document.createElement("video");
        probeVideo.preload = "metadata";
        probeVideo.src = clipSrc;

        const cleanup = () => {
          probeVideo.removeEventListener("loadedmetadata", onLoadedMetadata);
          probeVideo.removeEventListener("error", onError);
          probeVideo.removeAttribute("src");
          probeVideo.load();
        };

        const onLoadedMetadata = () => {
          const duration = Number.isFinite(probeVideo.duration)
            ? probeVideo.duration
            : 0;
          cleanup();
          resolve(duration);
        };

        const onError = () => {
          cleanup();
          resolve(0);
        };

        probeVideo.addEventListener("loadedmetadata", onLoadedMetadata);
        probeVideo.addEventListener("error", onError);
      });
    };

    let cancelled = false;

    const preloadDurations = async () => {
      const [preDuration, mainDuration, postDuration] = await Promise.all([
        hasPreRoll ? loadClipDuration(preRollSrc || src) : Promise.resolve(0),
        loadClipDuration(src),
        hasPostRoll ? loadClipDuration(postRollSrc || src) : Promise.resolve(0),
      ]);

      if (cancelled) return;

      setSegmentDurations({
        pre: preDuration,
        main: mainDuration,
        post: postDuration,
      });
    };

    preloadDurations();

    return () => {
      cancelled = true;
    };
  }, [hasPostRoll, hasPreRoll, postRollSrc, preRollSrc, src]);

  useEffect(() => {
    const nextPhase = getInitialPhase();
    setPlaybackPhase(nextPhase);
    setActiveSrc(nextPhase === "pre" ? preRollSrc || src : src);
    pendingSeekRef.current = null;
    setHasStartedPlaying(false);
    setInfoOverlayVisible(true);
    setError("");
  }, [src, preRollSrc, postRollSrc, getInitialPhase]);

  useEffect(() => {
    if (playerState.isPlaying) {
      videoRef.current?.play().catch(() => {
        // Browser autoplay policy may block seamless transition until user interacts.
      });
    }
  }, [activeSrc, playerState.isPlaying]);

  const handleSequenceEnded = useCallback(() => {
    if (playbackPhase === "done") {
      handleEnded();
      return;
    }

    const currentIndex = phaseOrder.indexOf(playbackPhase as ClipPhase);
    const nextPhase = phaseOrder[currentIndex + 1];

    if (nextPhase) {
      pendingSeekRef.current = 0;
      setPlaybackPhase(nextPhase);
      setActiveSrc(getPhaseSrc(nextPhase));
      return;
    }

    setPlaybackPhase("done");
    handleEnded();
  }, [getPhaseSrc, handleEnded, phaseOrder, playbackPhase]);

  const handleCompositeSeek = useCallback(
    (virtualTime: number) => {
      const compositeDuration = getCompositeDuration();
      const clampedTime = Math.max(0, Math.min(compositeDuration, virtualTime));
      const { phase, localTime } = resolveVirtualTime(clampedTime);

      if (playbackPhase === phase) {
        handleSeek(localTime);
        return;
      }

      pendingSeekRef.current = localTime;
      setPlaybackPhase(phase);
      setActiveSrc(getPhaseSrc(phase));
    },
    [
      getCompositeDuration,
      getPhaseSrc,
      handleSeek,
      playbackPhase,
      resolveVirtualTime,
    ],
  );

  const handleCompositeLoadedMetadata = useCallback(() => {
    handleLoadedMetadata();

    const video = videoRef.current;
    if (!video || playbackPhase === "done") return;

    const phase = playbackPhase as ClipPhase;
    const currentDuration = Number.isFinite(video.duration)
      ? video.duration
      : 0;

    setSegmentDurations((prevDurations) => ({
      ...prevDurations,
      [phase]: Math.max(prevDurations[phase], currentDuration),
    }));

    if (pendingSeekRef.current !== null) {
      const targetTime = Math.max(
        0,
        Math.min(
          currentDuration || pendingSeekRef.current,
          pendingSeekRef.current,
        ),
      );
      video.currentTime = targetTime;
      pendingSeekRef.current = null;
    }
  }, [handleLoadedMetadata, playbackPhase]);

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

  const handleError = useCallback(() => {
    if (playbackPhase === "pre") {
      // If intro clip is missing, continue with main content.
      setPlaybackPhase("main");
      setActiveSrc(src);
      return;
    }

    if (playbackPhase === "post") {
      // If outro clip is missing, treat playback as complete.
      setPlaybackPhase("done");
      handleEnded();
      return;
    }

    setError(
      "The video could not be loaded. Please check the source URL and ensure it is a direct link to a video file.",
    );
  }, [playbackPhase, src, handleEnded]);

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
        src={activeSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleCompositeLoadedMetadata}
        onProgress={handleProgress}
        onEnded={handleSequenceEnded}
        onError={handleError}
        onClick={togglePlay}
        className="player-video"
      />

      {/* All Player Overlays (Info, Top Bar, Controls) */}
      <PlayerOverlays
        title={title}
        playerState={composedPlayerState}
        controlsVisible={controlsVisible}
        infoOverlayVisible={infoOverlayVisible}
        onBack={onBack}
        togglePlay={togglePlay}
        handleSeek={handleCompositeSeek}
        handleVolumeChange={handleVolumeChange}
        toggleMute={toggleMute}
        handlePlaybackRateChange={handlePlaybackRateChange}
        toggleFullscreen={toggleFullscreen}
        togglePip={togglePip}
        videoSrc={activeSrc}
        onTitleChange={onTitleChange}
      />
    </div>
  );
};

export default VideoPlayer;
