import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { PlayerState } from "./usePlayerState";

// Drives a YouTube embed (loaded with enablejsapi=1) over postMessage, the
// same protocol YouTube's iframe_api script uses (extension pages can't load
// that remote script). Exposes the same state and actions as usePlayerState
// so the Netflix-style controls work unchanged on top of YouTube.

const YT_ORIGIN = "https://www.youtube.com";

// YouTube player states
const ENDED = 0;
const PLAYING = 1;
const BUFFERING = 3;

interface YouTubeInfo {
  currentTime?: number;
  duration?: number;
  playerState?: number;
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
  videoLoadedFraction?: number;
}

const savedNumber = (key: string, fallback: number) => {
  const value = parseFloat(localStorage.getItem(key) || "");
  return Number.isFinite(value) ? value : fallback;
};

const useYouTubePlayer = (
  iframeRef: RefObject<HTMLIFrameElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
  onEnded?: () => void,
) => {
  const [playerState, setPlayerState] = useState<PlayerState>(() => ({
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: savedNumber("streamline_player_volume", 1),
    isMuted: localStorage.getItem("streamline_player_muted") === "true",
    playbackRate: savedNumber("streamline_player_rate", 1),
    buffered: 0,
    isFullscreen: false,
    isPipActive: false,
  }));
  const stateRef = useRef(playerState);
  stateRef.current = playerState;
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const readyRef = useRef(false);
  const lastStateRef = useRef<number | null>(null);

  const update = (patch: Partial<PlayerState>) =>
    setPlayerState((prev) => ({ ...prev, ...patch }));

  const command = useCallback(
    (func: string, args: unknown[] = []) => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func, args, channel: "widget" }),
        YT_ORIGIN,
      );
    },
    [iframeRef],
  );

  // Once the player is ready, apply the saved volume, mute and speed.
  const applySavedSettings = useCallback(() => {
    const { volume, isMuted, playbackRate } = stateRef.current;
    command("setVolume", [Math.round(volume * 100)]);
    command(isMuted ? "mute" : "unMute");
    if (playbackRate !== 1) command("setPlaybackRate", [playbackRate]);
  }, [command]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== YT_ORIGIN) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      let data: { event?: string; info?: unknown } | null = null;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : null;
      } catch {
        return;
      }
      if (!data) return;

      if (!readyRef.current && data.event !== "command") {
        readyRef.current = true;
        applySavedSettings();
      }

      let info: YouTubeInfo | null = null;
      if (data.event === "onStateChange" && typeof data.info === "number") {
        info = { playerState: data.info };
      } else if (
        (data.event === "infoDelivery" || data.event === "initialDelivery") &&
        data.info &&
        typeof data.info === "object"
      ) {
        info = data.info as YouTubeInfo;
      }
      if (!info) return;

      const patch: Partial<PlayerState> = {};
      if (typeof info.currentTime === "number") patch.progress = info.currentTime;
      if (typeof info.duration === "number" && info.duration > 0)
        patch.duration = info.duration;
      if (typeof info.playbackRate === "number")
        patch.playbackRate = info.playbackRate;
      if (typeof info.videoLoadedFraction === "number") {
        const duration = patch.duration ?? stateRef.current.duration;
        patch.buffered = info.videoLoadedFraction * duration;
      }
      if (typeof info.playerState === "number") {
        patch.isPlaying =
          info.playerState === PLAYING || info.playerState === BUFFERING;
        // Deliveries repeat the state; only react to the change into ENDED.
        if (info.playerState === ENDED && lastStateRef.current !== ENDED)
          onEndedRef.current?.();
        lastStateRef.current = info.playerState;
      }
      update(patch);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [iframeRef, applySavedSettings]);

  // Keep asking the embed to report state until it answers (YouTube ignores
  // "listening" sent before its player script has loaded).
  const startListening = useCallback(() => {
    readyRef.current = false;
    let attempts = 0;
    const ping = () => {
      if (readyRef.current || attempts++ > 40) return;
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
        YT_ORIGIN,
      );
      window.setTimeout(ping, 250);
    };
    ping();
  }, [iframeRef]);

  const togglePlay = useCallback(() => {
    const playing = !stateRef.current.isPlaying;
    command(playing ? "playVideo" : "pauseVideo");
    update({ isPlaying: playing });
  }, [command]);

  const handleSeek = useCallback(
    (time: number) => {
      command("seekTo", [time, true]);
      update({ progress: time });
    },
    [command],
  );

  const handleVolumeChange = useCallback(
    (volume: number) => {
      command("setVolume", [Math.round(volume * 100)]);
      command(volume === 0 ? "mute" : "unMute");
      update({ volume, isMuted: volume === 0 });
      localStorage.setItem("streamline_player_volume", volume.toString());
      localStorage.setItem("streamline_player_muted", (volume === 0).toString());
    },
    [command],
  );

  const toggleMute = useCallback(() => {
    const muted = !stateRef.current.isMuted;
    command(muted ? "mute" : "unMute");
    update({ isMuted: muted });
    localStorage.setItem("streamline_player_muted", muted.toString());
  }, [command]);

  const handlePlaybackRateChange = useCallback(
    (rate: number) => {
      command("setPlaybackRate", [rate]);
      update({ playbackRate: rate });
      localStorage.setItem("streamline_player_rate", rate.toString());
    },
    [command],
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen();
  }, [containerRef]);

  useEffect(() => {
    const onFullscreenChange = () =>
      update({ isFullscreen: !!document.fullscreenElement });
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Same keyboard shortcuts as the regular player (minus picture-in-picture).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const { progress, duration, volume } = stateRef.current;
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          handleSeek(Math.min(duration, progress + 5));
          break;
        case "ArrowLeft":
          handleSeek(Math.max(0, progress - 5));
          break;
        case "ArrowUp":
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, handleSeek, handleVolumeChange, toggleMute, toggleFullscreen]);

  return {
    playerState,
    startListening,
    togglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    handlePlaybackRateChange,
    toggleFullscreen,
  };
};

export default useYouTubePlayer;
