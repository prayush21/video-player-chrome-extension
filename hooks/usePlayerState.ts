
import { useState, useEffect, useCallback, RefObject } from 'react';

export interface PlayerState {
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  buffered: number;
  isFullscreen: boolean;
  isPipActive: boolean;
}

const usePlayerState = (
  videoRef: RefObject<HTMLVideoElement>,
  containerRef: RefObject<HTMLDivElement>
) => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    buffered: 0,
    isFullscreen: false,
    isPipActive: false,
  });

  const updatePlayerState = (newState: Partial<PlayerState>) => {
    setPlayerState(prevState => ({ ...prevState, ...newState }));
  };
  
  // Load settings from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('streamline_player_volume');
    const savedMuted = localStorage.getItem('streamline_player_muted');
    const savedRate = localStorage.getItem('streamline_player_rate');

    if (savedVolume) updatePlayerState({ volume: parseFloat(savedVolume) });
    if (savedMuted) updatePlayerState({ isMuted: savedMuted === 'true' });
    if (savedRate) updatePlayerState({ playbackRate: parseFloat(savedRate) });
    
    if (videoRef.current) {
        videoRef.current.volume = savedVolume ? parseFloat(savedVolume) : 1;
        videoRef.current.muted = savedMuted === 'true';
        videoRef.current.playbackRate = savedRate ? parseFloat(savedRate) : 1;
    }
  }, [videoRef]);

  const togglePlay = useCallback(() => {
    updatePlayerState({ isPlaying: !playerState.isPlaying });
  }, [playerState.isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      updatePlayerState({ progress: videoRef.current.currentTime });
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      updatePlayerState({ duration: videoRef.current.duration });
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      updatePlayerState({ buffered: bufferedEnd });
    }
  };

  const handleEnded = () => {
    updatePlayerState({ isPlaying: false, progress: playerState.duration });
  };
  
  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      updatePlayerState({ progress: time });
    }
  };
  
  const handleVolumeChange = (volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = volume === 0;
      updatePlayerState({ volume, isMuted: volume === 0 });
      localStorage.setItem('streamline_player_volume', volume.toString());
      localStorage.setItem('streamline_player_muted', (volume === 0).toString());
    }
  };

  const toggleMute = () => {
      const newMutedState = !playerState.isMuted;
      if (videoRef.current) {
        videoRef.current.muted = newMutedState;
        updatePlayerState({ isMuted: newMutedState });
        localStorage.setItem('streamline_player_muted', newMutedState.toString());
      }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      updatePlayerState({ playbackRate: rate });
      localStorage.setItem('streamline_player_rate', rate.toString());
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen();
        updatePlayerState({ isFullscreen: true });
    } else {
        document.exitFullscreen();
        updatePlayerState({ isFullscreen: false });
    }
  }, [containerRef]);

  const togglePip = useCallback(() => {
    if(document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      if(videoRef.current && document.pictureInPictureEnabled) {
        videoRef.current.requestPictureInPicture();
      }
    }
  }, [videoRef]);

  // Effect for play/pause
  useEffect(() => {
    playerState.isPlaying ? videoRef.current?.play() : videoRef.current?.pause();
  }, [playerState.isPlaying, videoRef]);

  // Effect for fullscreen and PiP changes
  useEffect(() => {
    const onFullscreenChange = () => {
      updatePlayerState({ isFullscreen: !!document.fullscreenElement });
    };
    const onPipChange = () => {
        updatePlayerState({ isPipActive: !!document.pictureInPictureElement });
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    videoRef.current?.addEventListener('enterpictureinpicture', onPipChange)
    videoRef.current?.addEventListener('leavepictureinpicture', onPipChange)
    
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      videoRef.current?.removeEventListener('enterpictureinpicture', onPipChange);
      videoRef.current?.removeEventListener('leavepictureinpicture', onPipChange);
    };
  }, [videoRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT') return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          handleSeek(Math.min(playerState.duration, playerState.progress + 5));
          break;
        case 'ArrowLeft':
          handleSeek(Math.max(0, playerState.progress - 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, playerState.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, playerState.volume - 0.1));
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'p':
          togglePip();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerState.progress, playerState.duration, playerState.volume, togglePlay, toggleFullscreen, toggleMute, togglePip]);

  return {
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
  };
};

export default usePlayerState;
