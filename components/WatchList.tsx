import React, { useMemo, useState } from "react";
import {
  PLATFORM_LABELS,
  Platform,
  WatchListItem,
  getAuthorLabel,
  getItemTitle,
  getPlatform,
  getPosterUrls,
  getSourceUrl,
  isPlayable,
} from "../hooks/useWatchList";
import { formatTime } from "../utils/formatTime";

// Netflix-style "My List" page for videos saved from X and YouTube.

type PlayHandler = (id: string, queue: string[]) => void;

interface WatchListProps {
  items: WatchListItem[];
  onPlay: PlayHandler;
  onRemove: (id: string) => void;
  onOpenSource: () => void;
}

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

const PlayGlyph: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="wl-glyph">
    <path d="M6 4l15 8-15 8z" />
  </svg>
);

// Tries each thumbnail URL in turn. YouTube answers a missing size with a
// 120x90 grey placeholder instead of an error, so treat that as a miss too.
const PosterImage: React.FC<{
  item: WatchListItem;
  className?: string;
  lazy?: boolean;
  fallback?: React.ReactNode;
}> = ({ item, className, lazy, fallback = null }) => {
  const urls = useMemo(() => getPosterUrls(item), [item]);
  const [index, setIndex] = useState(0);
  if (index >= urls.length) return <>{fallback}</>;
  const next = () => setIndex((i) => i + 1);
  return (
    <img
      key={urls[index]}
      className={className}
      src={urls[index]}
      alt=""
      loading={lazy ? "lazy" : undefined}
      referrerPolicy="no-referrer"
      onError={next}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth <= 120) next();
      }}
    />
  );
};

const WatchListCard: React.FC<{
  item: WatchListItem;
  onPlay: () => void;
  onRemove: () => void;
}> = ({ item, onPlay, onRemove }) => {
  return (
    <div className={`wl-card ${item.watchedAt ? "is-watched" : ""}`}>
      <button
        className="wl-card-media"
        onClick={onPlay}
        title={getItemTitle(item)}
      >
        <PosterImage
          item={item}
          lazy
          fallback={
            <div className="wl-card-placeholder">{getAuthorLabel(item)}</div>
          }
        />
        <span className="wl-card-badge">
          {PLATFORM_LABELS[getPlatform(item)]}
        </span>
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
          <a href={getSourceUrl(item)} target="_blank" rel="noreferrer">
            {getAuthorLabel(item)}
          </a>
          <span> · {timeAgo(item.savedAt)}</span>
          {!isPlayable(item) && (
            <span className="wl-card-warn"> · resolving</span>
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
  onPlay: PlayHandler;
  onRemove: (id: string) => void;
}> = ({ title, items, queue, onPlay, onRemove }) => {
  if (!items.length) return null;
  return (
    <section className="wl-row">
      <h2 className="wl-row-title">
        {title} <span className="wl-row-count">{items.length}</span>
      </h2>
      <div className="wl-row-track">
        {items.map((item) => (
          <WatchListCard
            key={item.id}
            item={item}
            onPlay={() => onPlay(item.id, queue)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </div>
    </section>
  );
};

const WatchList: React.FC<WatchListProps> = ({
  items: allItems,
  onPlay,
  onRemove,
  onOpenSource,
}) => {
  const [filter, setFilter] = useState<Platform | "all">("all");
  const platforms = useMemo(
    () => [...new Set(allItems.map(getPlatform))],
    [allItems],
  );
  const activeFilter =
    filter !== "all" && platforms.includes(filter) ? filter : "all";
  const items = useMemo(
    () =>
      activeFilter === "all"
        ? allItems
        : allItems.filter((i) => getPlatform(i) === activeFilter),
    [allItems, activeFilter],
  );
  const upNext = useMemo(() => items.filter((i) => !i.watchedAt), [items]);
  const watched = useMemo(() => items.filter((i) => i.watchedAt), [items]);
  const hero = upNext[0] || items[0];
  const allIds = useMemo(() => items.map((i) => i.id), [items]);
  const upNextIds = useMemo(() => upNext.map((i) => i.id), [upNext]);

  return (
    <div className="wl-page">
      <header className="wl-header">
        <div className="wl-brand">
          <span className="wl-brand-accent">Netflix</span>-like Player
        </div>
        <button className="wl-header-btn" onClick={onOpenSource}>
          Play a file or URL
        </button>
      </header>

      {hero && (
        <section className="wl-hero">
          <PosterImage key={hero.id} item={hero} className="wl-hero-bg" />
          <div className="wl-hero-shade" />
          <div className="wl-hero-content">
            <div className="wl-hero-eyebrow">
              {hero.watchedAt
                ? "From My List"
                : upNext.length > 1
                  ? `Up next · ${upNext.length} videos, plays back to back`
                  : "Up next in My List"}
            </div>
            <h1 className="wl-hero-title">{getItemTitle(hero)}</h1>
            <div className="wl-hero-meta">
              <span className="wl-hero-author">{hero.authorName}</span>
              {getPlatform(hero) === "x" ? (
                <span>@{hero.author}</span>
              ) : (
                hero.author !== hero.authorName && <span>{hero.author}</span>
              )}
              {formatDuration(hero) && <span>{formatDuration(hero)}</span>}
              <span>saved {timeAgo(hero.savedAt)}</span>
              <span>{PLATFORM_LABELS[getPlatform(hero)]}</span>
            </div>
            {hero.text && getItemTitle(hero) !== hero.text && (
              <p className="wl-hero-text">{hero.text}</p>
            )}
            <div className="wl-hero-actions">
              <button
                className="wl-btn wl-btn-primary"
                onClick={() =>
                  onPlay(hero.id, upNextIds.length ? upNextIds : allIds)
                }
              >
                <PlayGlyph /> Play
              </button>
              <a
                className="wl-btn wl-btn-secondary"
                href={getSourceUrl(hero)}
                target="_blank"
                rel="noreferrer"
              >
                Open on {PLATFORM_LABELS[getPlatform(hero)]}
              </a>
            </div>
          </div>
        </section>
      )}

      <div className="wl-rows">
        {platforms.length > 1 && (
          <div className="wl-filters" role="group" aria-label="Filter by site">
            {(["all", ...platforms] as const).map((p) => (
              <button
                key={p}
                className={`wl-filter ${activeFilter === p ? "is-active" : ""}`}
                aria-pressed={activeFilter === p}
                onClick={() => setFilter(p)}
              >
                {p === "all" ? "All" : PLATFORM_LABELS[p]}{" "}
                {p === "all"
                  ? allItems.length
                  : allItems.filter((i) => getPlatform(i) === p).length}
              </button>
            ))}
          </div>
        )}
        <WatchListRow
          title="Up Next"
          items={upNext}
          queue={upNextIds}
          onPlay={onPlay}
          onRemove={onRemove}
        />
        <WatchListRow
          title="Watched"
          items={watched}
          queue={allIds}
          onPlay={onPlay}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
};

export default WatchList;
