import React, { useState, useCallback, useRef, useEffect } from "react";
import VideoPlayer from "./components/VideoPlayer";
import WatchList from "./components/WatchList";
import YouTubePlayer from "./components/YouTubePlayer";
import ProfileGate, {
  PROFILES,
  ProfileAvatar,
  ProfileId,
} from "./components/ProfileGate";
import useWatchList, {
  PLATFORM_LABELS,
  getAuthorLabel,
  getItemTitle,
  getPlatform,
  isPlayable,
} from "./hooks/useWatchList";
import { formatVideoTitle } from "./utils/formatVideoTitle";

// --- Reusable Props Interface ---
interface VideoPlayerProps {
  src: string;
  title: string;
  onBack: () => void;
}

// --- Instagram Reels Style Player Components (defined in-file to avoid new files) ---
// COMMENTED OUT - Instagram Reels Player (for future use)
/*
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
      {/* Top Gradient & Header *\/}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent p-4 flex items-center pointer-events-auto">
        <button onClick={onBack} className="text-white hover:text-gray-300 transition-colors p-2 -ml-2">
          <BackIcon />
        </button>
        <h2 className="font-bold text-lg ml-2">Streamline Player</h2>
      </div>

      {/* Main Content Area *\/}
      <div className="flex-grow" />

      {/* Side & Bottom Controls *\/}
      <div className="flex items-end p-4">
        {/* Left Info *\/}
        <div className="flex-grow">
          <h3 className="font-bold text-lg">@streamline_user</h3>
          <p className="text-sm mt-1">{title}</p>
          <div className="flex items-center mt-2">
            <MusicIcon />
            <p className="text-sm ml-2 font-semibold">Original Audio - streamline_user</p>
          </div>
        </div>
        {/* Right Icons *\/}
        <div className="flex flex-col gap-4 items-center pointer-events-auto">
            <button className="flex flex-col items-center gap-1"><HeartIcon /> <span className="text-xs font-semibold">1.2M</span></button>
            <button className="flex flex-col items-center gap-1"><CommentIcon /> <span className="text-xs font-semibold">5,321</span></button>
            <button className="flex flex-col items-center gap-1"><ShareIcon /> <span className="text-xs font-semibold">Share</span></button>
            <button className="flex flex-col items-center gap-1"><BookmarkIcon /> <span className="text-xs font-semibold">Save</span></button>
            <button><MoreIcon /></button>
        </div>
      </div>
      
      {/* Progress Bar *\/}
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
          <div style={styles.errorContainer}>
              <p style={styles.errorText}>{error}</p>
              <button onClick={onBack} style={styles.errorButton} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}>
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
*/

// --- Main App Component ---

const PROFILE_KEY = "nlvp:profile";

// Inline styles to replace Tailwind CSS
const styles = {
  errorContainer: {
    width: "100%",
    height: "100vh",
    backgroundColor: "#000000",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    textAlign: "center" as const,
  },
  errorText: {
    color: "#ef4444",
    marginBottom: "1rem",
  },
  errorButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    fontWeight: 600,
    borderRadius: "0.5rem",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  mainContainer: {
    minHeight: "100vh",
    backgroundColor: "#000000",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: "42rem",
    textAlign: "center" as const,
  },
  contentWrapperWide: {
    width: "100%",
    maxWidth: "56rem",
    textAlign: "center" as const,
  },
  backButton: {
    position: "absolute" as const,
    top: "1rem",
    left: "1rem",
    color: "#ffffff",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "0.5rem",
    borderRadius: "9999px",
    transition: "color 0.2s",
  },
  iconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    marginBottom: "1rem",
  },
  logoSmall: {
    width: "3rem",
    height: "3rem",
    objectFit: "contain",
  },
  title: {
    fontSize: "2.25rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  titleLarge: {
    fontSize: "3rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1.125rem",
    color: "#9ca3af",
    marginBottom: "3rem",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2rem",
  },
  preferencePanel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    flexWrap: "wrap" as const,
    padding: "0.25rem 0",
  },
  preferenceControlsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5rem",
    flexWrap: "wrap" as const,
    width: "100%",
  },
  preferenceControlItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
  preferenceInlineLabel: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#f3f4f6",
    whiteSpace: "nowrap" as const,
  },
  preferenceTextBlock: {
    textAlign: "left" as const,
  },
  preferenceTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#f3f4f6",
  },
  preferenceDescription: {
    marginTop: "0.2rem",
    fontSize: "0.8rem",
    color: "#9ca3af",
  },
  toggleSwitch: {
    width: "3rem",
    height: "1.75rem",
    borderRadius: "9999px",
    border: "1px solid #4b5563",
    backgroundColor: "#374151",
    display: "inline-flex",
    alignItems: "center",
    padding: "0.15rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  toggleSwitchActive: {
    backgroundColor: "#b20710",
    border: "1px solid #dc2626",
  },
  toggleKnob: {
    width: "1.35rem",
    height: "1.35rem",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    transition: "transform 0.2s ease",
    transform: "translateX(0)",
  },
  toggleKnobActive: {
    transform: "translateX(1.2rem)",
  },
  uploadLabel: {
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem 2rem",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    fontWeight: 600,
    borderRadius: "0.5rem",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    transition: "all 0.2s",
    border: "none",
  },
  uploadIcon: {
    width: "1.5rem",
    height: "1.5rem",
    marginRight: "0.75rem",
  },
  helpText: {
    color: "#6b7280",
    marginTop: "0.5rem",
    fontSize: "0.875rem",
  },
  dividerContainer: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dividerLine: {
    flexGrow: 1,
    borderTop: "1px solid #374151",
  },
  dividerText: {
    padding: "0 1rem",
    color: "#6b7280",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  formRow: {
    display: "flex",
    flexDirection: "row" as const,
    gap: "1rem",
  },
  input: {
    flexGrow: 1,
    backgroundColor: "#1f2937",
    color: "#ffffff",
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    border: "2px solid #374151",
    outline: "none",
    transition: "border-color 0.2s",
  },
  submitButton: {
    padding: "0.75rem 2rem",
    backgroundColor: "#4b5563",
    color: "#ffffff",
    fontWeight: 600,
    borderRadius: "0.5rem",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  modeButton: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    backgroundColor: "rgba(31, 41, 55, 0.5)",
    borderRadius: "1rem",
    border: "2px solid #374151",
    transition: "all 0.3s",
    cursor: "pointer",
    maxWidth: "28rem",
  },
  modeTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginTop: "1.5rem",
  },
  logoLarge: {
    width: "5rem",
    height: "5rem",
    objectFit: "contain",
  },
  modeDescription: {
    color: "#9ca3af",
    marginTop: "0.5rem",
  },
  demoButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#059669",
    color: "#ffffff",
    fontWeight: 600,
    borderRadius: "0.5rem",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  demoContainer: {
    marginTop: "3rem",
  },
  modeContainer: {
    display: "flex",
    justifyContent: "center",
  },
};

const App: React.FC = () => {
  const BRANDING_CLIP_PATHS = {
    netflix: {
      pre: "/clips/netflix-roll.mp4",
      post: "/clips/netflix-roll.mp4",
    },
    hbo: {
      pre: "/clips/hbo-roll.mp4",
      post: "/clips/hbo-roll.mp4",
    },
  } as const;

  type BrandingTheme = keyof typeof BRANDING_CLIP_PATHS;

  const [playerMode, setPlayerMode] = useState<"netflix" | "insta" | null>(
    "netflix",
  );
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [initialUrl, setInitialUrl] = useState<string>("");
  const [includeBrandingClips, setIncludeBrandingClips] = useState<boolean>(
    () => {
      try {
        const savedPreference = localStorage.getItem(
          "streamline_include_branding_clips",
        );
        if (savedPreference === null) return true;
        return savedPreference === "true";
      } catch {
        return true;
      }
    },
  );
  const [brandingTheme, setBrandingTheme] = useState<BrandingTheme>(() => {
    try {
      const savedTheme = localStorage.getItem("streamline_branding_theme");
      if (savedTheme === "netflix" || savedTheme === "hbo") {
        return savedTheme;
      }
      return "netflix";
    } catch {
      return "netflix";
    }
  });
  const watchList = useWatchList();
  const [view, setView] = useState<"list" | "source">("list");
  // Ids of the My List videos being played back to back, and the current one.
  const [queue, setQueue] = useState<string[]>([]);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [autoAdvanced, setAutoAdvanced] = useState(false);
  const [notice, setNotice] = useState("");
  // Opening straight into a video (?src= or ?item=) skips "Who's watching?".
  const [profile, setProfile] = useState<ProfileId | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("item") || params.get("src")) return "curator";
    try {
      const saved = sessionStorage.getItem(PROFILE_KEY);
      return PROFILES.some((p) => p.id === saved) ? (saved as ProfileId) : null;
    } catch {
      return null;
    }
  });
  const urlInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const src = params.get("src");
    const mode = params.get("mode");
    const pageUrl = params.get("pageUrl");
    const includeBrandingParam = params.get("includeBranding");
    const brandingThemeParam = params.get("brandingTheme");

    if (includeBrandingParam !== null) {
      const shouldIncludeBranding = !["0", "false", "off"].includes(
        includeBrandingParam.toLowerCase(),
      );
      setIncludeBrandingClips(shouldIncludeBranding);
    }

    if (brandingThemeParam === "netflix" || brandingThemeParam === "hbo") {
      setBrandingTheme(brandingThemeParam);
    }

    // Only support netflix mode for now
    if (src && mode === "netflix") {
      setVideoSource(src);
      setPlayerMode("netflix");
      try {
        const urlObject = new URL(src);
        const pathParts = urlObject.pathname.split("/");
        setVideoTitle(
          formatVideoTitle(pathParts[pathParts.length - 1]) || "Remote Video",
        );
      } catch (error) {
        setVideoTitle("Remote Video");
      }
    } else if (mode === "netflix") {
      setPlayerMode("netflix");
      if (pageUrl) {
        setInitialUrl(pageUrl);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "streamline_include_branding_clips",
      includeBrandingClips.toString(),
    );
  }, [includeBrandingClips]);

  useEffect(() => {
    localStorage.setItem("streamline_branding_theme", brandingTheme);
  }, [brandingTheme]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setVideoSource(url);
        setVideoTitle(formatVideoTitle(file.name));
      }
    },
    [],
  );

  const handleUrlSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    const url = urlInputRef.current?.value;
    if (url) {
      setVideoSource(url);
      try {
        const urlObject = new URL(url);
        const pathParts = urlObject.pathname.split("/");
        setVideoTitle(
          formatVideoTitle(pathParts[pathParts.length - 1]) || "Remote Video",
        );
      } catch (error) {
        setVideoTitle("Remote Video");
      }
    }
  }, []);

  const resetVideoSource = useCallback(() => {
    if (videoSource?.startsWith("blob:")) {
      URL.revokeObjectURL(videoSource);
    }
    setVideoSource(null);
    setVideoTitle("");
    setCurrentItemId(null);
    setQueue([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Use history.pushState to clean the URL without reloading the page
    window.history.pushState({}, "", window.location.pathname);
  }, [videoSource]);

  const playFromList = useCallback(
    async (id: string, playQueue: string[]) => {
      setNotice("");
      let item = watchList.items.find((i) => i.id === id);
      if (!item) return;
      if (!isPlayable(item)) {
        setNotice("Finding the video file...");
        item = (await watchList.resolve(id)) || item;
      }
      const source = item.youtubeId
        ? `https://www.youtube.com/watch?v=${item.youtubeId}`
        : item.mp4;
      if (!source) {
        setNotice(
          `Couldn't find a playable file for ${getAuthorLabel(item)}'s post. It may be deleted or private. Try "Open on ${PLATFORM_LABELS[getPlatform(item)]}".`,
        );
        return;
      }
      setNotice("");
      setQueue(playQueue.includes(id) ? playQueue : [id, ...playQueue]);
      setCurrentItemId(id);
      setVideoTitle(getItemTitle(item));
      setVideoSource(source);
    },
    [watchList],
  );

  // ?item=<id> plays a saved video straight away (one tab per video).
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (!watchList.loaded || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    const id = new URLSearchParams(window.location.search).get("item");
    if (id) playFromList(id, [id]);
  }, [watchList.loaded, playFromList]);

  const currentItem = currentItemId
    ? watchList.items.find((i) => i.id === currentItemId)
    : undefined;

  const nextItemId =
    (currentItemId && queue[queue.indexOf(currentItemId) + 1]) || null;

  const playNext = useCallback(() => {
    if (!nextItemId) return;
    setAutoAdvanced(true);
    playFromList(nextItemId, queue);
  }, [nextItemId, playFromList, queue]);

  const handleListItemFinished = useCallback(() => {
    if (!currentItemId) return;
    watchList.update(currentItemId, { watchedAt: Date.now() });
    playNext();
  }, [currentItemId, playNext, watchList]);

  const handleListItemTitleChange = useCallback(
    (title: string) => {
      setVideoTitle(title);
      if (currentItemId) watchList.update(currentItemId, { title });
    },
    [currentItemId, watchList],
  );

  const handlePlayDemo = () => {
    setVideoSource(
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    );
    setVideoTitle("Big Buck Bunny (Demo)");
  };

  // The "Who's watching?" choice lasts for this tab, so a reload skips it.
  const selectProfile = useCallback(
    (id: ProfileId) => {
      setProfile(id);
      try {
        sessionStorage.setItem(PROFILE_KEY, id);
      } catch {}
      const unwatched = watchList.items.filter((i) => !i.watchedAt);
      const queueIds = (unwatched.length ? unwatched : watchList.items).map(
        (i) => i.id,
      );
      if (id === "binger" && queueIds.length) {
        playFromList(queueIds[0], queueIds);
      } else if (id === "justone" && queueIds.length) {
        playFromList(queueIds[0], [queueIds[0]]);
      } else {
        setView(id === "guest" ? "source" : "list");
      }
    },
    [playFromList, watchList.items],
  );

  const switchProfile = useCallback(() => {
    setProfile(null);
    setView("list");
    try {
      sessionStorage.removeItem(PROFILE_KEY);
    } catch {}
  }, []);

  const selectedBrandingClips = BRANDING_CLIP_PATHS[brandingTheme];
  // "Just One" means no ta-dum.
  const introEnabled = includeBrandingClips && profile !== "justone";

  const renderPlayer = () => {
    if (!videoSource || !playerMode) return null;

    if (currentItem?.youtubeId) {
      return (
        <YouTubePlayer
          key={currentItem.youtubeId}
          videoId={currentItem.youtubeId}
          title={videoTitle}
          onBack={resetVideoSource}
          onTitleChange={handleListItemTitleChange}
          onNext={nextItemId ? playNext : undefined}
          onFinished={handleListItemFinished}
        />
      );
    }

    if (playerMode === "netflix") {
      const isListPlayback = Boolean(currentItemId);
      // In a My List queue, only play the intro before the first video and
      // the outro after the last one.
      const showPreRoll = introEnabled && !(isListPlayback && autoAdvanced);
      const showPostRoll = introEnabled && !(isListPlayback && nextItemId);
      return (
        <VideoPlayer
          key={videoSource}
          src={videoSource}
          title={videoTitle}
          onBack={resetVideoSource}
          onTitleChange={
            isListPlayback ? handleListItemTitleChange : setVideoTitle
          }
          preRollSrc={showPreRoll ? selectedBrandingClips.pre : undefined}
          postRollSrc={showPostRoll ? selectedBrandingClips.post : undefined}
          autoStart={isListPlayback}
          onNext={nextItemId ? playNext : undefined}
          onFinished={isListPlayback ? handleListItemFinished : undefined}
        />
      );
    }
    // Instagram Reels player commented out for now
    // if (playerMode === 'insta') {
    //     return <InstaPlayer key={videoSource} src={videoSource} title={videoTitle} onBack={resetVideoSource} />;
    // }
    return null;
  };

  const renderSourceSelector = () => (
    <div className="wl-page">
      <header className="wl-header is-scrolled">
        <button
          className="wl-avatar-btn"
          onClick={switchProfile}
          title="Switch profile"
          aria-label="Switch profile"
        >
          <ProfileAvatar id={profile || "guest"} className="wl-avatar" />
        </button>
        <nav className="wl-nav">
          {watchList.items.length > 0 && (
            <button className="wl-nav-pill" onClick={() => setView("list")}>
              My List
            </button>
          )}
          <button className="wl-nav-pill is-active">Play a file</button>
        </nav>
        <img
          className="wl-brand"
          src="/n-player-wordmark.png"
          alt="N Player"
          draggable={false}
        />
      </header>

      <div className="src-panel">
        <h1 className="src-title">
          <span style={{ color: "#e50914" }}>Netflix</span>-like Video Player
        </h1>
        <p className="src-subtitle">
          Pick a file from this computer or paste a direct video link.
        </p>

        <label htmlFor="file-upload" className="src-drop">
          <svg viewBox="0 0 24 24" className="wl-glyph" aria-hidden="true">
            <path
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <strong>Choose a video file</strong>
          <small>MP4, WebM, OGG, MOV and friends</small>
        </label>
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          style={{ display: "none" }}
          accept="video/*"
          onChange={handleFileChange}
        />

        <div className="src-or">OR</div>

        <form onSubmit={handleUrlSubmit} className="src-form">
          <input
            ref={urlInputRef}
            type="url"
            placeholder="Paste a direct video URL (.mp4, .webm...)"
            defaultValue={initialUrl}
            className="src-input"
            required
          />
          <button type="submit" className="wl-btn wl-btn-primary">
            Play
          </button>
        </form>

        <div className="src-prefs">
          <div className="src-pref">
            <span>Show Intro</span>
            <button
              type="button"
              className="src-switch"
              onClick={() => setIncludeBrandingClips((prev) => !prev)}
              aria-pressed={includeBrandingClips}
              aria-label="Show Intro"
              title={
                includeBrandingClips
                  ? "Intro/outro enabled"
                  : "Intro/outro disabled"
              }
            >
              <span />
            </button>
          </div>
          <div className="src-pref">
            <span>Intro Theme</span>
            <select
              value={brandingTheme}
              onChange={(e) =>
                setBrandingTheme(e.target.value as BrandingTheme)
              }
              className="src-select"
              aria-label="Choose Intro Theme"
            >
              <option value="netflix">Netflix</option>
              <option value="hbo">HBO</option>
            </select>
          </div>
        </div>

        {watchList.items.length === 0 && (
          <p className="src-help">
            Tip: on X and YouTube, videos get a <strong>My List</strong>{" "}
            button. Save while you scroll, then click this extension's icon to
            binge them here.
          </p>
        )}
        <p className="src-help">
          Only direct video file links work here. For YouTube, save the video
          to My List instead.
        </p>
        <div className="src-demo">
          <button className="wl-btn wl-btn-secondary" onClick={handlePlayDemo}>
            Play Demo Video
          </button>
        </div>
      </div>
    </div>
  );

  const renderModeSelector = () => (
    <div style={styles.mainContainer}>
      <div style={styles.contentWrapperWide}>
        <h1
          style={{
            ...styles.titleLarge,
            fontSize: window.innerWidth >= 768 ? "3.75rem" : "2.25rem",
            marginBottom: "0.5rem",
          }}
        >
          Streamline Player
        </h1>
        <p
          style={{
            ...styles.subtitle,
            fontSize: window.innerWidth >= 768 ? "1.25rem" : "1.125rem",
          }}
        >
          Choose your viewing experience.
        </p>
        <div style={styles.modeContainer}>
          <button
            onClick={() => setPlayerMode("netflix")}
            style={styles.modeButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1f2937";
              e.currentTarget.style.borderColor = "#dc2626";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(31, 41, 55, 0.5)";
              e.currentTarget.style.borderColor = "#374151";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <img
              src="/n-player-logo.png"
              alt="N Player logo"
              style={styles.logoLarge}
            />
            <h2 style={styles.modeTitle}>Netflix Player</h2>
            <p style={styles.modeDescription}>
              Cinematic, widescreen experience.
            </p>
          </button>
          {/* Instagram Reels Player - Coming Soon */}
          {/* <button onClick={() => setPlayerMode('insta')} style={styles.modeButton}>
                <InstagramIcon size={80} />
                <h2 style={styles.modeTitle}>Reels Player</h2>
                <p style={styles.modeDescription}>Vertical, short-form experience.</p>
            </button> */}
        </div>
        <div style={styles.demoContainer}>
          <button
            onClick={handlePlayDemo}
            style={styles.demoButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#047857";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#059669";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Play Demo Video
          </button>
          <p style={styles.helpText}>Having trouble? Play a sample video.</p>
        </div>
      </div>
    </div>
  );

  if (videoSource) return renderPlayer();
  if (!profile) {
    return (
      <ProfileGate
        itemCount={watchList.items.length}
        loaded={watchList.loaded}
        onSelect={selectProfile}
      />
    );
  }
  if (view === "list" && watchList.items.length > 0) {
    return (
      <>
        <WatchList
          items={watchList.items}
          profile={profile}
          onPlay={playFromList}
          onRemove={watchList.remove}
          onOpenSource={() => setView("source")}
          onSwitchProfile={switchProfile}
        />
        {notice && <div className="wl-notice">{notice}</div>}
      </>
    );
  }
  return renderSourceSelector();
};

export default App;
