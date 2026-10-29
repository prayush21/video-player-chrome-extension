// Upgrades My List data in chrome.storage.local to the current shape.
//
// History of the "watchlist" key (always a plain array, newest first):
//   1.3.0  (schema 0)  No My List at all; nothing in chrome.storage.
//   1.4.0  (schema 1)  X-only entries: { id, candidateIds?, author,
//                      authorName?, text?, title?, tweetUrl, mp4?, poster?,
//                      durationMs?, aspectRatio?, savedAt, watchedAt,
//                      resolveError? }. No `platform` field.
//   1.5.0  (schema 2)  Adds `platform` ("x" | "youtube" | "local"),
//                      `sourceUrl`, `youtubeId`, `fileName`, `fileSize`.
//
// The list stays a bare array so content scripts (public/content/common.js)
// and an older build after a rollback can still read it. The version lives
// in its own key, WATCHLIST_SCHEMA_KEY.
//
// The migration is pure, idempotent and never throws. It keeps every entry
// that has a usable id, keeps unknown fields untouched (data written by a
// newer build survives a rollback), and only removes fields whose type would
// crash the UI.

import type { Platform, WatchListItem } from "../hooks/useWatchList";

export const WATCHLIST_KEY = "watchlist";
export const WATCHLIST_SCHEMA_KEY = "watchlistSchemaVersion";
export const CURRENT_SCHEMA_VERSION = 2;

const KNOWN_PLATFORMS: readonly Platform[] = ["x", "youtube", "local"];

export interface MigrationResult {
  items: WatchListItem[];
  schemaVersion: number;
  /** True when `items` differs from what was stored and should be written back. */
  changed: boolean;
}

type Raw = Record<string, unknown>;

const isObject = (value: unknown): value is Raw =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const toId = (value: unknown): string | null => {
  if (typeof value === "string") return value.trim() ? value : null;
  // Tweet ids are strings everywhere we write them, but don't lose an entry
  // over a number that slipped through.
  if (isFiniteNumber(value)) return String(value);
  return null;
};

const inferPlatform = (raw: Raw, id: string): Platform => {
  if (id.startsWith("local-")) return "local";
  if (typeof raw.youtubeId === "string" && raw.youtubeId) return "youtube";
  return "x";
};

// Optional string fields: drop the field (not the entry) if it's the wrong type.
const STRING_FIELDS = [
  "authorName",
  "text",
  "sourceUrl",
  "tweetUrl",
  "fileName",
] as const;
// Optional fields that may also be null.
const NULLABLE_STRING_FIELDS = [
  "title",
  "mp4",
  "youtubeId",
  "poster",
  "resolveError",
] as const;

function migrateItem(value: unknown): WatchListItem | null {
  if (!isObject(value)) return null;
  const id = toId(value.id);
  if (!id) return null;

  // Start from a copy so unknown fields are preserved.
  const item: Raw = { ...value, id };

  if (item.platform === undefined || item.platform === null || item.platform === "") {
    item.platform = inferPlatform(value, id);
  } else if (!KNOWN_PLATFORMS.includes(item.platform as Platform)) {
    // Possibly written by a newer build; leave it for that build to read.
    if (typeof item.platform !== "string") item.platform = inferPlatform(value, id);
  }

  if (typeof item.author !== "string") {
    item.author = isFiniteNumber(item.author) ? String(item.author) : "";
  }

  for (const key of STRING_FIELDS) {
    if (key in item && typeof item[key] !== "string") delete item[key];
  }
  for (const key of NULLABLE_STRING_FIELDS) {
    if (key in item && item[key] !== null && typeof item[key] !== "string") {
      delete item[key];
    }
  }

  if ("candidateIds" in item) {
    if (Array.isArray(item.candidateIds)) {
      const ids = item.candidateIds.filter(
        (c): c is string => typeof c === "string" && c !== "",
      );
      if (ids.length !== item.candidateIds.length) item.candidateIds = ids;
    } else {
      delete item.candidateIds;
    }
  }

  if ("durationMs" in item && item.durationMs !== null && !isFiniteNumber(item.durationMs)) {
    delete item.durationMs;
  }
  if ("fileSize" in item && !isFiniteNumber(item.fileSize)) delete item.fileSize;
  if (
    "aspectRatio" in item &&
    item.aspectRatio !== null &&
    !(Array.isArray(item.aspectRatio) && item.aspectRatio.every(isFiniteNumber))
  ) {
    delete item.aspectRatio;
  }

  if (!isFiniteNumber(item.savedAt)) {
    const parsed = typeof item.savedAt === "string" ? Date.parse(item.savedAt) : NaN;
    item.savedAt = Number.isFinite(parsed) ? parsed : 0;
  }
  if (item.watchedAt !== null && !isFiniteNumber(item.watchedAt)) {
    const parsed = typeof item.watchedAt === "string" ? Date.parse(item.watchedAt) : NaN;
    item.watchedAt = Number.isFinite(parsed) ? parsed : null;
  }

  return item as unknown as WatchListItem;
}

// Order-insensitive deep equality for plain JSON values.
function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => jsonEqual(v, b[i]));
  }
  if (isObject(a) && isObject(b)) {
    const ka = Object.keys(a);
    if (ka.length !== Object.keys(b).length) return false;
    return ka.every((k) => k in b && jsonEqual(a[k], b[k]));
  }
  return false;
}

/**
 * Upgrades whatever is stored under WATCHLIST_KEY to the current shape.
 * `storedVersion` is the value of WATCHLIST_SCHEMA_KEY (missing on 1.4.0).
 */
export function migrateWatchList(
  stored: unknown,
  storedVersion?: unknown,
): MigrationResult {
  const version = isFiniteNumber(storedVersion) ? storedVersion : undefined;
  const raw = Array.isArray(stored) ? stored : [];

  const items: WatchListItem[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const item = migrateItem(entry);
    if (!item) continue;
    // Duplicate ids can't be told apart by remove/update; keep the newest.
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
  }

  // Data from a newer build: keep its version so we don't claim to have
  // downgraded it. Otherwise it is now current.
  const schemaVersion =
    version !== undefined && version > CURRENT_SCHEMA_VERSION
      ? version
      : CURRENT_SCHEMA_VERSION;

  // Only write back when there was something stored to upgrade; never
  // replace a non-array value we don't understand with [] on our own.
  const changed = Array.isArray(stored) && !jsonEqual(stored, items);

  return { items, schemaVersion, changed };
}
