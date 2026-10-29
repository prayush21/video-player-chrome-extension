import React, { useCallback, useEffect, useState } from "react";

// "Who's watching?" screen shown when the player opens. The profiles aren't
// people, they're moods: each one is a shortcut into the app.

export type ProfileId = "binger" | "justone" | "curator" | "guest";

interface Profile {
  id: ProfileId;
  name: string;
  tagline: string;
  color: string;
  /** Needs saved videos to do anything. */
  needsList: boolean;
}

export const PROFILES: Profile[] = [
  {
    id: "binger",
    name: "The Binger",
    tagline: "Plays all of Up Next, back to back. Snacks advised.",
    color: "#e50914",
    needsList: true,
  },
  {
    id: "justone",
    name: "Just One",
    tagline: "One video, no intro. Definitely just one.",
    color: "#2f80ed",
    needsList: true,
  },
  {
    id: "curator",
    name: "The Curator",
    tagline: "Browse My List. Maybe finally remove something.",
    color: "#f2b01e",
    needsList: false,
  },
  {
    id: "guest",
    name: "Someone Else",
    tagline: "Play a file from this computer. No judgment.",
    color: "#27ae60",
    needsList: false,
  },
];

// Simple original faces, one per mood.
export const ProfileAvatar: React.FC<{
  id: ProfileId;
  className?: string;
}> = ({ id, className }) => {
  const profile = PROFILES.find((p) => p.id === id)!;
  const ink = "#fff";
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect width="100" height="100" rx="10" fill={profile.color} />
      {id === "binger" && (
        <>
          <circle cx="33" cy="40" r="7" fill={ink} />
          <circle cx="67" cy="40" r="7" fill={ink} />
          <path d="M26 60 Q50 86 74 60 Z" fill={ink} />
        </>
      )}
      {id === "justone" && (
        <>
          <circle cx="33" cy="40" r="6" fill={ink} />
          <path
            d="M60 41 h14"
            stroke={ink}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M32 66 Q50 76 68 62"
            stroke={ink}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {id === "curator" && (
        <>
          <circle cx="33" cy="42" r="10" stroke={ink} strokeWidth="5" fill="none" />
          <circle cx="67" cy="42" r="10" stroke={ink} strokeWidth="5" fill="none" />
          <path d="M43 42 h14" stroke={ink} strokeWidth="5" />
          <path
            d="M36 68 h28"
            stroke={ink}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      )}
      {id === "guest" && (
        <>
          <circle cx="36" cy="42" r="6" fill={ink} />
          <circle cx="64" cy="42" r="6" fill={ink} />
          <path
            d="M34 68 Q42 62 50 68 T66 66"
            stroke={ink}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
};

const subtitle = (count: number, loaded: boolean): string => {
  if (!loaded) return " ";
  if (count === 0) return "Your list is empty. Bold strategy.";
  if (count === 1) return "1 saved video, waiting patiently.";
  return `${count} saved videos, waiting patiently.`;
};

// The taglines normally appear on hover. On the very first visit they're all
// shown, so a new user sees what each mood is for; picking any profile
// marks the intro as seen and from then on it's hover only.
const INTRO_SEEN_KEY = "nlvp:profileIntroSeen";

const hasSeenIntro = (): boolean => {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return true;
  }
};

const markIntroSeen = () => {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {}
};

interface ProfileGateProps {
  itemCount: number;
  loaded: boolean;
  onSelect: (id: ProfileId) => void;
}

const ProfileGate: React.FC<ProfileGateProps> = ({
  itemCount,
  loaded,
  onSelect,
}) => {
  const [chosen, setChosen] = useState<ProfileId | null>(null);
  const [showTaglines] = useState(() => !hasSeenIntro());

  const choose = useCallback(
    (profile: Profile) => {
      if (chosen || (profile.needsList && itemCount === 0)) return;
      setChosen(profile.id);
      markIntroSeen();
      // Let the zoom-out play before handing over.
      window.setTimeout(() => onSelect(profile.id), 420);
    },
    [chosen, itemCount, onSelect],
  );

  // 1-4 picks a profile from the keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const profile = PROFILES[Number(e.key) - 1];
      if (profile && loaded) choose(profile);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, loaded]);

  return (
    <div
      className={`pg-page ${chosen ? "is-leaving" : ""} ${showTaglines ? "is-intro" : ""}`}
    >
      <h1 className="pg-title">Who's watching?</h1>
      <p className="pg-subtitle">{subtitle(itemCount, loaded)}</p>
      {showTaglines && (
        <p className="pg-firstrun">
          Save videos from X and YouTube with the <strong>My List</strong>{" "}
          button, then binge them here.
        </p>
      )}
      <ul className="pg-grid">
        {PROFILES.map((profile, i) => {
          const disabled = loaded && profile.needsList && itemCount === 0;
          return (
            <li
              key={profile.id}
              className={`pg-item ${chosen === profile.id ? "is-chosen" : ""}`}
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              <button
                className="pg-profile"
                onClick={() => choose(profile)}
                disabled={disabled || !loaded}
                aria-keyshortcuts={String(i + 1)}
              >
                <ProfileAvatar id={profile.id} className="pg-avatar" />
                <span className="pg-name">{profile.name}</span>
                <span className="pg-tagline">
                  {disabled ? "Save a video from X or YouTube first." : profile.tagline}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="pg-hint">
        Profiles here are moods, not people. Press 1–4 to pick.
      </p>
    </div>
  );
};

export default ProfileGate;
