import React, { useState, useCallback, useRef, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import usePlayerState from './hooks/usePlayerState';
import { BackIcon, PlayIcon, HeartIcon, CommentIcon, ShareIcon, BookmarkIcon, MoreIcon, MusicIcon, NetflixIcon, InstagramIcon } from './components/icons';
import type { PlayerState } from './hooks/usePlayerState';

// --- Reusable Props Interface ---
interface VideoPlayerProps {
  src: string;
  title: string;
  onBack: () => void;
}

// --- Instagram Reels Style Player Components (defined in-file to avoid new files) ---

interface InstaControlsProps {
    playerState: PlayerState;
    title: string;
    onBack: () => void;
}

const InstaControls: React.FC<InstaControlsProps> = ({ playerState, title, onBack }) => {
  const { progress, duration } = playerState;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="absolute inset-0 text-white pointer-events-none flex flex-col justify-between">
      {/* Top Gradient & Header */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent p-4 flex items-center pointer-events-auto">
        <button onClick={onBack} className="text-white hover:text-gray-300 transition-colors p-2 -ml-2">
          <BackIcon />
        </button>
        <h2 className="font-bold text-lg ml-2">Streamline Player</h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow" />

      {/* Side & Bottom Controls */}
      <div className="flex items-end p-4">
        {/* Left Info */}
        <div className="flex-grow">
          <h3 className="font-bold text-lg">@streamline_user</h3>
          <p className="text-sm mt-1">{title}</p>
          <div className="flex items-center mt-2">
            <MusicIcon />
            <p className="text-sm ml-2 font-semibold">Original Audio - streamline_user</p>
          </div>
        </div>
        {/* Right Icons */}
        <div className="flex flex-col gap-4 items-center pointer-events-auto">
            <button className="flex flex-col items-center gap-1"><HeartIcon /> <span className="text-xs font-semibold">1.2M</span></button>
            <button className="flex flex-col items-center gap-1"><CommentIcon /> <span className="text-xs font-semibold">5,321</span></button>
            <button className="flex flex-col items-center gap-1"><ShareIcon /> <span className="text-xs font-semibold">Share</span></button>
            <button className="flex flex-col items-center gap-1"><BookmarkIcon /> <span className="text-xs font-semibold">Save</span></button>
            <button><MoreIcon /></button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div className="h-full bg-white" style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
};


const InstaPlayer: React.FC<VideoPlayerProps> = ({ src, title, onBack }) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');

  const { playerState, togglePlay, handleTimeUpdate, handleLoadedMetadata, handleProgress, handleEnded } = usePlayerState(videoRef, playerContainerRef);
  
  const handleError = () => {
    setError('The video could not be loaded. Please check the source URL and ensure it is a direct link to a video file.');
  };

  if (error) {
      return (
          <div className="w-full h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button onClick={onBack} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg">
                  Go Back
              </button>
          </div>
      );
  }

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div ref={playerContainerRef} className="relative w-full h-full max-w-[calc(9/16*100vh)] max-h-screen aspect-[9/16] bg-gray-800 overflow-hidden">
        <video
          ref={videoRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onProgress={handleProgress}
          onEnded={handleEnded}
          onError={handleError}
          onClick={togglePlay}
          className="w-full h-full object-cover"
          loop
          playsInline
        />
        <InstaControls 
          playerState={playerState} 
          title={title}
          onBack={onBack}
        />
        {!playerState.isPlaying && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20" onClick={togglePlay}>
                <div className="bg-black/50 p-4 rounded-full scale-150">
                    <PlayIcon />
                </div>
           </div>
        )}
      </div>
    </div>
  );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [playerMode, setPlayerMode] = useState<'netflix' | 'insta' | null>(null);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [initialUrl, setInitialUrl] = useState<string>('');
  const urlInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const src = params.get('src');
    const mode = params.get('mode');
    const pageUrl = params.get('pageUrl');

    if (src && (mode === 'netflix' || mode === 'insta')) {
      setVideoSource(src);
      setPlayerMode(mode);
      try {
        const urlObject = new URL(src);
        const pathParts = urlObject.pathname.split('/');
        setVideoTitle(pathParts[pathParts.length - 1] || 'Remote Video');
      } catch (error) {
        setVideoTitle('Remote Video');
      }
    } else if (mode === 'netflix' || mode === 'insta') {
        setPlayerMode(mode);
        if (pageUrl) {
            setInitialUrl(pageUrl);
        }
    }
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSource(url);
      setVideoTitle(file.name);
    }
  }, []);

  const handleUrlSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    const url = urlInputRef.current?.value;
    if (url) {
      setVideoSource(url);
      try {
        const urlObject = new URL(url);
        const pathParts = urlObject.pathname.split('/');
        setVideoTitle(pathParts[pathParts.length - 1] || 'Remote Video');
      } catch (error) {
        setVideoTitle('Remote Video');
      }
    }
  }, []);
  
  const resetVideoSource = useCallback(() => {
    if (videoSource?.startsWith('blob:')) {
      URL.revokeObjectURL(videoSource);
    }
    setVideoSource(null);
    setVideoTitle('');
    setPlayerMode(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Use history.pushState to clean the URL without reloading the page
    window.history.pushState({}, '', window.location.pathname);
  }, [videoSource]);

  const handlePlayDemo = () => {
    setPlayerMode('netflix');
    setVideoSource('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    setVideoTitle('Big Buck Bunny (Demo)');
  };

  const renderPlayer = () => {
    if (!videoSource || !playerMode) return null;

    if (playerMode === 'netflix') {
      return <VideoPlayer key={videoSource} src={videoSource} title={videoTitle} onBack={resetVideoSource} />;
    }
    if (playerMode === 'insta') {
        return <InstaPlayer key={videoSource} src={videoSource} title={videoTitle} onBack={resetVideoSource} />;
    }
    return null;
  };

  const renderSourceSelector = () => (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <button onClick={() => setPlayerMode(null)} className="absolute top-4 left-4 text-white hover:text-red-500 transition-colors p-2 rounded-full">
            <BackIcon />
        </button>
        <div className="flex items-center justify-center gap-4 mb-4">
            {playerMode === 'netflix' ? <NetflixIcon size={48} /> : <InstagramIcon size={48} />}
            <h1 className="text-4xl md:text-5xl font-bold">
                {playerMode === 'netflix' ? 'Netflix Player' : 'Instagram Player'}
            </h1>
        </div>
        <p className="text-lg md:text-xl text-gray-400 mb-12">Select a local file or enter a direct video URL.</p>

        <div className="space-y-8">
          <div>
            <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Play Local Video File
            </label>
            <input ref={fileInputRef} id="file-upload" type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
            <p className="text-gray-500 mt-2 text-sm">MP4, WebM, OGG, MOV, etc.</p>
          </div>

          <div className="relative flex items-center justify-center">
            <span className="flex-grow border-t border-gray-700"></span>
            <span className="px-4 text-gray-500">OR</span>
            <span className="flex-grow border-t border-gray-700"></span>
          </div>
          
          <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-4">
            <input 
              ref={urlInputRef}
              type="url" 
              placeholder="Paste a direct video URL..."
              defaultValue={initialUrl}
              className="flex-grow bg-gray-800 text-white placeholder-gray-500 px-4 py-3 rounded-lg border-2 border-gray-700 focus:border-red-500 focus:ring-red-500 focus:outline-none transition" 
              required
            />
            <button type="submit" className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-transform transform hover:scale-105">
              Play from URL
            </button>
          </form>
           <p className="text-gray-500 mt-2 text-sm">
              Note: Only direct video file URLs (e.g., .mp4) are supported.
              <br />
              Links from pages like YouTube or Vimeo will not work.
            </p>
        </div>
      </div>
    </div>
  );

  const renderModeSelector = () => (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-2">Streamline Player</h1>
        <p className="text-lg md:text-xl text-gray-400 mb-12">Choose your viewing experience.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button onClick={() => setPlayerMode('netflix')} className="group flex flex-col items-center justify-center p-8 bg-gray-800/50 hover:bg-gray-800 rounded-2xl border-2 border-gray-700 hover:border-red-500 transition-all duration-300 transform hover:scale-105">
                <NetflixIcon size={80} />
                <h2 className="text-2xl font-bold mt-6">Netflix Player</h2>
                <p className="text-gray-400 mt-2">Cinematic, widescreen experience.</p>
            </button>
            <button onClick={() => setPlayerMode('insta')} className="group flex flex-col items-center justify-center p-8 bg-gray-800/50 hover:bg-gray-800 rounded-2xl border-2 border-gray-700 hover:pink-500 transition-all duration-300 transform hover:scale-105">
                <InstagramIcon size={80} />
                <h2 className="text-2xl font-bold mt-6">Reels Player</h2>
                <p className="text-gray-400 mt-2">Vertical, short-form experience.</p>
            </button>
        </div>
        <div className="mt-12">
           <button onClick={handlePlayDemo} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-transform transform hover:scale-105">
              Play Demo Video
            </button>
            <p className="text-gray-500 mt-2 text-sm">Having trouble? Play a sample video.</p>
        </div>
      </div>
    </div>
  );

  if (videoSource) return renderPlayer();
  if (playerMode) return renderSourceSelector();
  return renderModeSelector();
};

export default App;