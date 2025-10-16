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

export const SpeedIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    data-icon="InternetSpeedMedium"
    data-icon-id=":r6m:"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
  >
    <path
      fill="white"
      fill-rule="evenodd"
      d="M19.06 6.27a9.7 9.7 0 0 0-14.12 0 10.8 10.8 0 0 0 0 14.82L3.5 22.47a12.8 12.8 0 0 1 0-17.59 11.7 11.7 0 0 1 17 0 12.8 12.8 0 0 1 0 17.59l-1.44-1.38a10.8 10.8 0 0 0 0-14.82M15 14a3 3 0 1 1-1.7-2.7l3-3 1.4 1.4-3 3q.3.6.3 1.3"
      clip-rule="evenodd"
    ></path>
  </svg>
);

export const SubtitlesIcon2: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    data-icon="SubtitlesMedium"
    data-icon-id=":rce:"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
  >
    <path
      fill="white"
      fill-rule="evenodd"
      d="M1 3a1 1 0 0 1 1-1h20a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3v3a1 1 0 0 1-1.55.83L11.7 18H2a1 1 0 0 1-1-1zm2 1v12h9.3l.25.17L17 19.13V16h4V4zm7 5H5V7h5zm9 2h-5v2h5zm-7 2H5v-2h7zm7-6h-7v2h7z"
      clip-rule="evenodd"
    ></path>
  </svg>
);

export const MaximiseIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    data-icon="FullscreenEnterMedium"
    data-icon-id=":r12e:"
    aria-hidden="true"
    data-uia="control-fullscreen-enter"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
  >
    <path
      fill="white"
      fill-rule="evenodd"
      d="M0 5c0-1.1.9-2 2-2h7v2H2v4H0zm22 0h-7V3h7a2 2 0 0 1 2 2v4h-2zM2 15v4h7v2H2a2 2 0 0 1-2-2v-4zm20 4v-4h2v4a2 2 0 0 1-2 2h-7v-2z"
      clip-rule="evenodd"
    ></path>
  </svg>
);

export const MinimiseIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    data-icon="FullscreenExitMedium"
    data-icon-id=":r135:"
    aria-hidden="true"
    data-uia="control-fullscreen-exit"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
  >
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M24 8h-5V3h-2v7h7zM0 16h5v5h2v-7H0zm7-6H0V8h5V3h2zm12 11v-5h5v-2h-7v7z"
      clip-rule="evenodd"
    ></path>
  </svg>
);

export const VolumeLowIcon2: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    data-icon="VolumeLowMedium"
    data-icon-id=":r146:"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
  >
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M11 4a1 1 0 0 0-1.7-.7L4.58 8H1a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3.59l4.7 4.7A1 1 0 0 0 11 20zM5.7 9.7 9 6.42V17.6l-3.3-3.3-.29-.29H2v-4h3.41zM16 12a6 6 0 0 0-1.76-4.24l-1.41 1.41a4 4 0 0 1 0 5.66l1.41 1.41A6 6 0 0 0 16 12"
      clip-rule="evenodd"
    ></path>
  </svg>
);

export const VolumeMediumIcon2: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    data-icon="VolumeMediumMedium"
    data-icon-id=":r14n:"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
  >
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M11 4a1 1 0 0 0-1.7-.7L4.58 8H1a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3.59l4.7 4.7A1 1 0 0 0 11 20zM5.7 9.7 9 6.42V17.6l-3.3-3.3-.29-.29H2v-4h3.41zm11.37-4.77a10 10 0 0 1 0 14.14l-1.41-1.41a8 8 0 0 0 0-11.32zm-2.83 2.83a6 6 0 0 1 0 8.48l-1.41-1.41a4 4 0 0 0 0-5.66z"
      clip-rule="evenodd"
    ></path>
  </svg>
);

export const VolumeHighIcon2: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    data-icon="VolumeHighMedium"
    data-icon-id=":r15k:"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
  >
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M24 12a14 14 0 0 0-4.1-9.9l-1.41 1.41a12 12 0 0 1 0 16.98l1.41 1.41A14 14 0 0 0 24 12M11 4a1 1 0 0 0-1.7-.7L4.58 8H1a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3.59l4.7 4.7A1 1 0 0 0 11 20zM5.7 9.7 9 6.42V17.6l-3.3-3.3-.29-.29H2v-4h3.41zM16 12a6 6 0 0 0-1.76-4.24l-1.41 1.41a4 4 0 0 1 0 5.66l1.41 1.41A6 6 0 0 0 16 12m1.07-7.07a10 10 0 0 1 0 14.14l-1.41-1.41a8 8 0 0 0 0-11.32z"
      clip-rule="evenodd"
    ></path>
  </svg>
);

export const VolumeMuteIcon2: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    data-icon="VolumeOffMedium"
    data-icon-id=":r16i:"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
  >
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M11 4a1 1 0 0 0-1.7-.7L4.58 8H1a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3.59l4.7 4.7A1 1 0 0 0 11 20zM5.7 9.7 9 6.42V17.6l-3.3-3.3-.29-.29H2v-4h3.41zm9.6 0 2.29 2.3-2.3 2.3 1.42 1.4L19 13.42l2.3 2.3 1.4-1.42-2.28-2.3 2.3-2.3-1.42-1.4-2.3 2.28-2.3-2.3z"
      clip-rule="evenodd"
    ></path>
  </svg>
);

export const Forward10Icon2: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    data-icon="Forward10Medium"
    data-icon-id=":r160:"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
  >
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M6.44 3.69A10 10 0 0 1 18 4h-2v2h4a1 1 0 0 0 1-1V1h-2v1.25A12 12 0 1 0 24 12h-2A10 10 0 1 1 6.44 3.69M22 4v3h-3v2h4a1 1 0 0 0 1-1V4zm-9.4 11.58q.66.42 1.53.42a2.7 2.7 0 0 0 1.5-.42q.67-.44 1.02-1.22.35-.8.35-1.86 0-1.05-.35-1.85A2.65 2.65 0 0 0 14.13 9a2.7 2.7 0 0 0-1.53.43q-.64.44-1 1.22a4.5 4.5 0 0 0-.35 1.85q0 1.07.35 1.86.36.78 1 1.22m2.44-1.49q-.33.56-.91.56-.6 0-.92-.56-.34-.56-.34-1.59 0-1.01.34-1.58.33-.57.91-.57.6 0 .92.57.34.56.34 1.58t-.34 1.6M8.6 10.72v5.14h1.6V9.02l-3.2.8v1.32z"
      clip-rule="evenodd"
    ></path>
  </svg>
);

export const Replay10Icon2: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    data-icon="Back10Medium"
    data-icon-id=":r16m:"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
  >
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M11.02 2.05A10 10 0 1 1 2 12H0a12 12 0 1 0 5-9.75V1H3v4a1 1 0 0 0 1 1h4V4H6a10 10 0 0 1 5.02-1.95M2 4v3h3v2H1a1 1 0 0 1-1-1V4zm12.13 12q-.88 0-1.53-.42-.64-.44-1-1.22a5 5 0 0 1-.35-1.86q0-1.05.35-1.85.36-.79 1-1.22A2.7 2.7 0 0 1 14.13 9a2.65 2.65 0 0 1 2.52 1.65q.35.79.35 1.85 0 1.07-.35 1.86a3 3 0 0 1-1.01 1.22 2.7 2.7 0 0 1-1.52.42m0-1.35q.59 0 .91-.56.34-.56.34-1.59 0-1.01-.34-1.58-.33-.57-.91-.57-.6 0-.92.57-.34.56-.34 1.58t.34 1.6q.33.54.91.55m-5.53 1.2v-5.13l-1.6.42V9.82l3.2-.8v6.84z"
      clip-rule="evenodd"
    ></path>
  </svg>
);

export const PlayIcon2: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    data-icon="PlayMedium"
    data-icon-id=":r17u:"
    aria-hidden="true"
    class="svg-icon-nfplayerPlay"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
  >
    <path
      fill="currentColor"
      d="M5 2.7a1 1 0 0 1 1.48-.88l16.93 9.3a1 1 0 0 1 0 1.76l-16.93 9.3A1 1 0 0 1 5 21.31z"
    ></path>
  </svg>
);

export const PauseIcon2: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    data-icon="PauseMedium"
    data-icon-id=":r18f:"
    aria-hidden="true"
    class="svg-icon-nfplayerPause"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
  >
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M4.5 3a.5.5 0 0 0-.5.5v17c0 .28.22.5.5.5h5a.5.5 0 0 0 .5-.5v-17a.5.5 0 0 0-.5-.5zm10 0a.5.5 0 0 0-.5.5v17c0 .28.22.5.5.5h5a.5.5 0 0 0 .5-.5v-17a.5.5 0 0 0-.5-.5z"
      clip-rule="evenodd"
    ></path>
  </svg>
);
