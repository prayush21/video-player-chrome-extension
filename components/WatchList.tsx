import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PLATFORM_LABELS,
  Platform,
  WatchListItem,
  getAuthorLabel,
  getItemTitle,
  getPlatform,
  getPosterUrls,
  getSourceUrl,
  hasSourcePage,
  isPlayable,
} from "../hooks/useWatchList";
import { formatTime } from "../utils/formatTime";
import { ProfileAvatar, ProfileId } from "./ProfileGate";

// Netflix-style "My List" page for videos saved from X and YouTube, laid out
// like the 2025 Netflix TV home: centred pill nav, an inset hero that follows
// the tile you're on, and big rounded tiles.

type PlayHandler = (id: string, queue: string[]) => void;

interface WatchListProps {
  items: WatchListItem[];
  profile: ProfileId;
  onPlay: PlayHandler;
  onRemove: (id: string) => void;
  onOpenSource: () => void;
  /** Present when the browser can save local files to the list. */
  onAddFiles?: () => void;
  onSwitchProfile: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const timeAgo = (timestamp: number): string => {
  const seconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const formatDuration = (item: WatchListItem): string | null =>
  item.durationMs ? formatTime(item.durationMs / 1000) : null;

const isNew = (item: WatchListItem) =>
  !item.watchedAt && Date.now() - item.savedAt < DAY_MS;

const matchesQuery = (item: WatchListItem, query: string) =>
  `${getItemTitle(item)} ${item.author} ${item.authorName || ""} ${item.text || ""} ${item.fileName || ""}`
    .toLowerCase()
    .includes(query);

const PlayGlyph: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="wl-glyph">
    <path d="M6 4l15 8-15 8z" />
  </svg>
);

const SearchGlyph: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="wl-glyph">
    <path
      d="M10.5 3a7.5 7.5 0 015.9 12.1l4.7 4.8-1.4 1.4-4.8-4.7A7.5 7.5 0 1110.5 3zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z"
      fillRule="evenodd"
    />
  </svg>
);

const Chevron: React.FC<{ dir: "left" | "right" }> = ({ dir }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="wl-glyph">
    <path
      d={dir === "left" ? "M15 4l-8 8 8 8" : "M9 4l8 8-8 8"}
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Tries each thumbnail URL in turn. YouTube answers a missing size with a
// 120x90 grey placeholder instead of an error, so treat that as a miss too.
// Images fade in once decoded so nothing pops.
const PosterImage: React.FC<{
  item: WatchListItem;
  className?: string;
  lazy?: boolean;
  fallback?: React.ReactNode;
}> = ({ item, className = "", lazy, fallback = null }) => {
  const urls = useMemo(() => getPosterUrls(item), [item]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  if (index >= urls.length) return <>{fallback}</>;
  const next = () => {
    setLoaded(false);
    setIndex((i) => i + 1);
  };
  return (
    <img
      key={urls[index]}
      className={`wl-img ${loaded ? "is-loaded" : ""} ${className}`}
      src={urls[index]}
      alt=""
      loading={lazy ? "lazy" : undefined}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={next}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth <= 120) next();
        else setLoaded(true);
      }}
    />
  );
};

// Keeps the previous hero artwork underneath while the next one fades in,
// so switching the featured video crossfades instead of blinking.
const HeroBackdrop: React.FC<{ item: WatchListItem }> = ({ item }) => {
  const [layers, setLayers] = useState<WatchListItem[]>([item]);
  useEffect(() => {
    setLayers((prev) =>
      prev[prev.length - 1].id === item.id
        ? prev
        : [prev[prev.length - 1], item],
    );
  }, [item]);
  return (
    <>
      {layers.map((layer) => (
        <PosterImage key={layer.id} item={layer} className="wl-hero-bg" />
      ))}
    </>
  );
};

const WatchListCard: React.FC<{
  item: WatchListItem;
  featured: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onFeature: () => void;
}> = ({ item, featured, onPlay, onRemove, onFeature }) => {
  // Feature the tile in the hero after a short dwell, so sweeping the mouse
  // across a row doesn't flicker the hero.
  const timer = useRef<number>();
  const startDwell = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(onFeature, 280);
  };
  const cancelDwell = () => window.clearTimeout(timer.current);
  useEffect(() => cancelDwell, []);

  return (
    <div
      className={`wl-card ${item.watchedAt ? "is-watched" : ""} ${featured ? "is-featured" : ""}`}
      onMouseEnter={startDwell}
      onMouseLeave={cancelDwell}
      onFocus={onFeature}
    >
      <button
        className="wl-card-media"
        onClick={onPlay}
        title={getItemTitle(item)}
      >
        <PosterImage
          item={item}
          lazy
          fallback={
            <div className="wl-card-placeholder">
              <span>{getAuthorLabel(item)}</span>
            </div>
          }
        />
        <span className="wl-card-badge">
          {PLATFORM_LABELS[getPlatform(item)]}
        </span>
        {isNew(item) && <span className="wl-card-tag">Recently Added</span>}
        <span className="wl-card-play">
          <PlayGlyph />
        </span>
        {formatDuration(item) && (
          <span className="wl-card-duration">{formatDuration(item)}</span>
        )}
        {item.watchedAt && <span className="wl-card-progress" />}
      </button>
      <div className="wl-card-body">
        <div className="wl-card-title">{getItemTitle(item)}</div>
        <div className="wl-card-meta">
          {hasSourcePage(item) ? (
            <a
              className="wl-card-author"
              href={getSourceUrl(item)}
              target="_blank"
              rel="noreferrer"
              title={getAuthorLabel(item)}
            >
              {getAuthorLabel(item)}
            </a>
          ) : (
            <span className="wl-card-author" title={getAuthorLabel(item)}>
              {getAuthorLabel(item)}
            </span>
          )}
          <span className="wl-card-when">&nbsp;· {timeAgo(item.savedAt)}</span>
          {!isPlayable(item) && (
            <span className="wl-card-warn wl-card-when"> · resolving</span>
          )}
        </div>
      </div>
      <button
        className="wl-card-remove"
        onClick={onRemove}
        aria-label="Remove from My List"
        title="Remove from My List"
      >
        ×
      </button>
    </div>
  );
};

const WatchListRow: React.FC<{
  title: string;
  items: WatchListItem[];
  queue: string[];
  featuredId?: string;
  onPlay: PlayHandler;
  onRemove: (id: string) => void;
  onFeature: (id: string) => void;
}> = ({ title, items, queue, featuredId, onPlay, onRemove, onFeature }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const page = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (track) {
      track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: "smooth" });
    }
  };
  return (
    <section className="wl-row">
      <h2 className="wl-row-title">
        {title} <span className="wl-row-count">{items.length}</span>
      </h2>
      <div className="wl-row-frame">
        <button
          className="wl-row-arrow is-left"
          onClick={() => page(-1)}
          aria-label={`Scroll ${title} left`}
          tabIndex={-1}
        >
          <Chevron dir="left" />
        </button>
        <div className="wl-row-track" ref={trackRef}>
          {items.map((item) => (
            <WatchListCard
              key={item.id}
              item={item}
              featured={item.id === featuredId}
              onPlay={() => onPlay(item.id, queue)}
              onRemove={() => onRemove(item.id)}
              onFeature={() => onFeature(item.id)}
            />
          ))}
        </div>
        <button
          className="wl-row-arrow is-right"
          onClick={() => page(1)}
          aria-label={`Scroll ${title} right`}
          tabIndex={-1}
        >
          <Chevron dir="right" />
        </button>
      </div>
    </section>
  );
};

const WatchList: React.FC<WatchListProps> = ({
  items: allItems,
  profile,
  onPlay,
  onRemove,
  onOpenSource,
  onAddFiles,
  onSwitchProfile,
}) => {
  const [filter, setFilter] = useState<Platform | "all">("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const platforms = useMemo(
    () => [...new Set(allItems.map(getPlatform))],
    [allItems],
  );
  const activeFilter =
    filter !== "all" && platforms.includes(filter) ? filter : "all";
  const needle = query.trim().toLowerCase();
  const items = useMemo(
    () =>
      allItems.filter(
        (i) =>
          (activeFilter === "all" || getPlatform(i) === activeFilter) &&
          (!needle || matchesQuery(i, needle)),
      ),
    [allItems, activeFilter, needle],
  );
  const upNext = useMemo(() => items.filter((i) => !i.watchedAt), [items]);
  const watched = useMemo(() => items.filter((i) => i.watchedAt), [items]);
  const hero =
    items.find((i) => i.id === featuredId) || upNext[0] || items[0];
  const allIds = useMemo(() => items.map((i) => i.id), [items]);
  const upNextIds = useMemo(() => upNext.map((i) => i.id), [upNext]);
  const heroQueue = hero && !hero.watchedAt ? upNextIds : allIds;

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const heroTag = !hero
    ? null
    : hero.watchedAt
      ? "Watch Again"
      : isNew(hero)
        ? "Recently Added"
        : upNext.length > 1
          ? `${upNext.length} in a row`
          : "Up Next";

  return (
    <div
      className="wl-page"
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 8)}
    >
      {hero && (
        <div className="wl-ambient" aria-hidden="true">
          <HeroBackdrop item={hero} />
        </div>
      )}

      <header className={`wl-header ${scrolled ? "is-scrolled" : ""}`}>
        <button
          className="wl-avatar-btn"
          onClick={onSwitchProfile}
          title="Switch profile"
          aria-label="Switch profile"
        >
          <ProfileAvatar id={profile} className="wl-avatar" />
        </button>

        <nav className="wl-nav" aria-label="Filter My List">
          <div className={`wl-search ${searchOpen ? "is-open" : ""}`}>
            <button
              className="wl-nav-icon"
              onClick={() => {
                if (searchOpen) setQuery("");
                setSearchOpen((o) => !o);
              }}
              aria-label={searchOpen ? "Close search" : "Search My List"}
            >
              <SearchGlyph />
            </button>
            <input
              ref={searchRef}
              className="wl-search-input"
              type="search"
              placeholder="Titles, channels, people"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setQuery("");
                  setSearchOpen(false);
                }
              }}
              tabIndex={searchOpen ? 0 : -1}
            />
          </div>
          {(["all", ...(platforms.length > 1 ? platforms : [])] as const).map(
            (p) => (
              <button
                key={p}
                className={`wl-nav-pill ${activeFilter === p ? "is-active" : ""}`}
                aria-pressed={activeFilter === p}
                onClick={() => setFilter(p)}
              >
                {p === "all" ? "My List" : PLATFORM_LABELS[p]}
              </button>
            ),
          )}
          {onAddFiles && (
            <button className="wl-nav-pill" onClick={onAddFiles}>
              + Add file
            </button>
          )}
          <button className="wl-nav-pill" onClick={onOpenSource}>
            Play a file
          </button>
        </nav>

        <img
          className="wl-brand"
          src="/n-player-wordmark.png"
          alt="N Player"
          draggable={false}
        />
      </header>

      {hero ? (
        <section className="wl-hero">
          <HeroBackdrop item={hero} />
          <div className="wl-hero-shade" />
          <div className="wl-hero-content" key={hero.id}>
            <div className="wl-hero-eyebrow">
              <span className="wl-hero-eyebrow-mark">
                {PLATFORM_LABELS[getPlatform(hero)]}
              </span>
              {hero.watchedAt ? "From My List" : "Up next in My List"}
            </div>
            <h1 className="wl-hero-title" title={getItemTitle(hero)}>
              {getItemTitle(hero)}
            </h1>
            <div className="wl-hero-meta">
              <span
                className="wl-hero-author is-trunc"
                title={hero.authorName || getAuthorLabel(hero)}
              >
                {hero.authorName || getAuthorLabel(hero)}
              </span>
              {getPlatform(hero) === "x" && (
                <span className="is-trunc" title={`@${hero.author}`}>
                  @{hero.author}
                </span>
              )}
              {getPlatform(hero) === "local" && hero.fileName && (
                <span className="is-trunc" title={hero.fileName}>
                  {hero.fileName}
                </span>
              )}
              {formatDuration(hero) && <span>{formatDuration(hero)}</span>}
              <span>Saved {timeAgo(hero.savedAt)}</span>
            </div>
            {hero.text && getItemTitle(hero) !== hero.text && (
              <p className="wl-hero-text">{hero.text}</p>
            )}
            <div className="wl-hero-actions">
              <button
                className="wl-btn wl-btn-primary"
                onClick={() => onPlay(hero.id, heroQueue)}
              >
                <PlayGlyph /> Play
              </button>
              {hasSourcePage(hero) && (
                <a
                  className="wl-btn wl-btn-secondary"
                  href={getSourceUrl(hero)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on {PLATFORM_LABELS[getPlatform(hero)]}
                </a>
              )}
            </div>
          </div>
          {heroTag && (
            <span className="wl-hero-tag" key={heroTag}>
              {heroTag}
            </span>
          )}
        </section>
      ) : (
        <div className="wl-empty">
          Nothing matches “{query}”. Your list is judging you a little.
        </div>
      )}

      <div className="wl-rows">
        <WatchListRow
          title="Your Next Watch"
          items={upNext}
          queue={upNextIds}
          featuredId={hero?.id}
          onPlay={onPlay}
          onRemove={onRemove}
          onFeature={setFeaturedId}
        />
        <WatchListRow
          title="Watch Again"
          items={watched}
          queue={allIds}
          featuredId={hero?.id}
          onPlay={onPlay}
          onRemove={onRemove}
          onFeature={setFeaturedId}
        />
      </div>
    </div>
  );
};

export default WatchList;
