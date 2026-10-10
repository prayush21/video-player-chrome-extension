import React, { useMemo } from "react";
import { WatchListItem, getItemTitle } from "../hooks/useWatchList";
import { formatTime } from "../utils/formatTime";

// Netflix-style "My List" page for videos saved from X.

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

const WatchListCard: React.FC<{
  item: WatchListItem;
  onPlay: () => void;
  onRemove: () => void;
}> = ({ item, onPlay, onRemove }) => (
  <div className={`wl-card ${item.watchedAt ? "is-watched" : ""}`}>
    <button
      className="wl-card-media"
      onClick={onPlay}
      title={getItemTitle(item)}
    >
      {item.poster ? (
        <img
          src={item.poster}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="wl-card-placeholder">@{item.author}</div>
      )}
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
        <a href={item.tweetUrl} target="_blank" rel="noreferrer">
          @{item.author}
        </a>
        <span> · {timeAgo(item.savedAt)}</span>
        {!item.mp4 && <span className="wl-card-warn"> · resolving</span>}
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
  items,
  onPlay,
  onRemove,
  onOpenSource,
}) => {
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
          {hero.poster && (
            <img
              className="wl-hero-bg"
              src={hero.poster}
              alt=""
              referrerPolicy="no-referrer"
            />
          )}
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
              <span>@{hero.author}</span>
              {formatDuration(hero) && <span>{formatDuration(hero)}</span>}
              <span>saved {timeAgo(hero.savedAt)}</span>
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
                href={hero.tweetUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open on X
              </a>
            </div>
          </div>
        </section>
      )}

      <div className="wl-rows">
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
