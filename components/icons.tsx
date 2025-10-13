import React from "react";

const Icon: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "icon-size-base",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    {children}
  </svg>
);

// CSS-based SVG icon components
export const PlayIcon: React.FC = () => (
  <span className="icon-svg icon-play" aria-hidden="true" />
);
export const PauseIcon: React.FC = () => (
  <span className="icon-svg icon-pause" aria-hidden="true" />
);
export const VolumeMuteIcon: React.FC = () => (
  <span className="icon-svg icon-volume-mute" aria-hidden="true" />
);
export const VolumeLowIcon: React.FC = () => (
  <span className="icon-svg icon-volume-up" aria-hidden="true" />
);
export const VolumeMediumIcon: React.FC = () => (
  <span className="icon-svg icon-volume-up" aria-hidden="true" />
);
export const VolumeHighIcon: React.FC = () => (
  <span className="icon-svg icon-volume-up" aria-hidden="true" />
);
export const SettingsIcon: React.FC = () => (
  <span className="icon-svg icon-settings" aria-hidden="true" />
);
export const FullscreenEnterIcon: React.FC = () => (
  <span className="icon-svg icon-fullscreen-enter" aria-hidden="true" />
);
export const FullscreenExitIcon: React.FC = () => (
  <span className="icon-svg icon-fullscreen-exit" aria-hidden="true" />
);
export const Replay10Icon: React.FC = () => (
  <span className="icon-svg icon-replay-10" aria-hidden="true" />
);
export const Forward10Icon: React.FC = () => (
  <span className="icon-svg icon-forward-10" aria-hidden="true" />
);

// PIP icons - now using CSS-based SVG icons
export const PipEnterIcon: React.FC = () => (
  <span className="icon-svg icon-pip-enter" aria-hidden="true" />
);
export const PipExitIcon: React.FC = () => (
  <span className="icon-svg icon-pip-exit" aria-hidden="true" />
);
export const BackIcon: React.FC = () => (
  <span className="icon-svg icon-back" aria-hidden="true" />
);

// --- New Icons ---
export const HeartIcon: React.FC = () => (
  <Icon>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </Icon>
);
export const CommentIcon: React.FC = () => (
  <Icon>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </Icon>
);
export const ShareIcon: React.FC = () => (
  <Icon>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </Icon>
);
export const BookmarkIcon: React.FC = () => (
  <Icon>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
    />
  </Icon>
);
export const MoreIcon: React.FC = () => (
  <Icon>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 12h.01M12 12h.01M19 12h.01"
    />
  </Icon>
);
export const MusicIcon: React.FC = () => (
  <Icon className="icon-size-small">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-13c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
    />
  </Icon>
);

export const NetflixIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.49989 20.25V3.75L15.4999 20.25V3.75"
      stroke="#E50914"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.75 3.75H20.25"
      stroke="#E50914"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const InstagramIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="5"
      stroke="url(#paint0_linear_1_2)"
      strokeWidth="2"
    />
    <path
      d="M16 11.37C16.1234 12.0123 15.9866 12.6735 15.6131 13.225C15.2396 13.7765 14.6562 14.1843 14 14.36C13.3438 14.5357 12.6477 14.4704 12.0333 14.177C11.419 13.8837 10.9254 13.3826 10.65 12.77C10.3746 12.1574 10.3421 11.4658 10.5583 10.8248C10.7745 10.1838 11.2222 9.63895 11.82 9.30005C12.4178 8.96115 13.1205 8.85507 13.78 9.00005C14.4395 9.14503 15.0134 9.53385 15.4 10.1C15.7866 10.6661 16.0023 11.3718 16 12.1L16 11.37Z"
      stroke="url(#paint1_linear_1_2)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 7H17.01"
      stroke="url(#paint2_linear_1_2)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="paint0_linear_1_2"
        x1="3"
        y1="3"
        x2="23"
        y2="5"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FEDA75" />
        <stop offset="0.2" stopColor="#FA7E1E" />
        <stop offset="0.4" stopColor="#D62976" />
        <stop offset="0.8" stopColor="#962FBF" />
        <stop offset="1" stopColor="#4F5BD5" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_1_2"
        x1="10.5"
        y1="9"
        x2="16"
        y2="10"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FEDA75" />
        <stop offset="0.2" stopColor="#FA7E1E" />
        <stop offset="0.4" stopColor="#D62976" />
        <stop offset="0.8" stopColor="#962FBF" />
        <stop offset="1" stopColor="#4F5BD5" />
      </linearGradient>
      <linearGradient
        id="paint2_linear_1_2"
        x1="17"
        y1="7"
        x2="17.01"
        y2="7"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FEDA75" />
        <stop offset="1" stopColor="#D62976" />
      </linearGradient>
    </defs>
  </svg>
);
