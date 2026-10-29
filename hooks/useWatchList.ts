import { useCallback, useEffect, useState } from "react";
import { formatVideoTitle } from "../utils/formatVideoTitle";
import {
  LOCAL_ID_PREFIX,
  LocalFileHandle,
  deleteHandle,
  getHandle,
  isLocalId,
  putHandle,
  readVideoMeta,
} from "../utils/localFiles";
import {
  CURRENT_SCHEMA_VERSION,
  WATCHLIST_KEY,
  WATCHLIST_SCHEMA_KEY,
  migrateWatchList,
} from "../utils/storageMigration";

export type Platform = "x" | "youtube" | "local";

export const PLATFORM_LABELS: Record<Platform, string> = {
  x: "X",
  youtube: "YouTube",
  local: "On this device",
};

// Saved videos. Written by background.js (see public/content/*.js for how
// posts get saved on each site); the popup reads, updates and removes them.
export interface WatchListItem {
  id: string;
  /** Missing on items saved before 1.5, which were all from X. */
  platform?: Platform;
  candidateIds?: string[];
  author: string;
  authorName?: string;
  text?: string;
  title?: string | null;
  /** Link back to the post. Items saved from X before 1.5 use tweetUrl. */
  sourceUrl?: string;
  tweetUrl?: string;
  // How to play it: a direct file, or a YouTube embed.
  mp4?: string | null;
  youtubeId?: string | null;
  poster?: string | null;
  durationMs?: number | null;
  aspectRatio?: number[] | null;
  savedAt: number;
  watchedAt: number | null;
  resolveError?: string | null;
  /** Local files only: the original file name and size, for display. */
  fileName?: string;
  fileSize?: number;
}

interface WatchListStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

// `npm run dev` runs the page outside the extension; keep My List in
// localStorage there so the list and player can be worked on in a browser.
const devStorage: WatchListStorage = {
  async get(key) {
    try {
      return { [key]: JSON.parse(localStorage.getItem(`nlvp:${key}`) || "null") };
    } catch {
      return {};
    }
  },
  async set(items) {
    for (const [key, value] of Object.entries(items)) {
      localStorage.setItem(`nlvp:${key}`, JSON.stringify(value));
    }
  },
};

const extensionStorage =
  typeof chrome !== "undefined" ? chrome.storage?.local : undefined;

const storage: WatchListStorage | undefined =
  extensionStorage ?? (import.meta.env.DEV ? devStorage : undefined);

// Reads My List and upgrades it to the current shape (see
// utils/storageMigration.ts). Never throws on bad data.
async function readMigrated(store: WatchListStorage) {
  const [list, version] = await Promise.all([
    store.get(WATCHLIST_KEY),
    store.get(WATCHLIST_SCHEMA_KEY),
  ]);
  const storedVersion = version[WATCHLIST_SCHEMA_KEY];
  return { ...migrateWatchList(list[WATCHLIST_KEY], storedVersion), storedVersion };
}

// Writes the upgraded list back once, so storage is in the current shape.
// Re-reads right before writing to keep the window for clobbering a
// background write as small as possible.
async function persistMigration(store: WatchListStorage) {
  const latest = await readMigrated(store);
  if (latest.changed) {
    await store.set({
      [WATCHLIST_KEY]: latest.items,
      [WATCHLIST_SCHEMA_KEY]: latest.schemaVersion,
    });
  } else if (latest.storedVersion !== latest.schemaVersion) {
    await store.set({ [WATCHLIST_SCHEMA_KEY]: latest.schemaVersion });
  }
}

export const getPlatform = (item: WatchListItem): Platform =>
  item.platform || "x";

export const getSourceUrl = (item: WatchListItem): string =>
  item.sourceUrl || item.tweetUrl || "#";

// Local files have no page to link back to.
export const hasSourcePage = (item: WatchListItem): boolean =>
  getPlatform(item) !== "local";

// X handles get an "@"; YouTube stores the channel name.
export const getAuthorLabel = (item: WatchListItem): string =>
  getPlatform(item) === "x" ? `@${item.author}` : item.author;

export const isLocal = (item: WatchListItem): boolean =>
  getPlatform(item) === "local";

// Thumbnail URLs to try, best first. YouTube's 1280px maxresdefault isn't
// generated for every video, so fall back through smaller sizes; the saved
// poster (480px hqdefault) is last.
export const getPosterUrls = (item: WatchListItem): string[] => {
  const urls = item.youtubeId
    ? ["maxresdefault", "sddefault"].map(
        (size) => `https://i.ytimg.com/vi/${item.youtubeId}/${size}.jpg`,
      )
    : [];
  if (item.poster) urls.push(item.poster);
  return urls;
};

// Local files are opened from their saved handle when played.
export const isPlayable = (item: WatchListItem): boolean =>
  Boolean(item.mp4 || item.youtubeId || isLocal(item));

export const getItemTitle = (item: WatchListItem): string => {
  if (item.title) return item.title;
  const firstLine = (item.text || "")
    .replace(/https?:\/\/\S+/g, "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return `${getAuthorLabel(item)}'s video`;
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
};

function useWatchList() {
  const [items, setItems] = useState<WatchListItem[]>([]);
  const [loaded, setLoaded] = useState(!storage);

  useEffect(() => {
    if (!storage) return;
    readMigrated(storage)
      .then((result) => {
        setItems(result.items);
        if (result.changed || result.storedVersion !== result.schemaVersion) {
          persistMigration(storage).catch((err) =>
            console.warn("My List: could not save upgraded list", err),
          );
        }
      })
      .catch((err) => console.warn("My List: could not read list", err))
      .finally(() => setLoaded(true));

    const handleChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === "local" && changes[WATCHLIST_KEY]) {
        setItems(migrateWatchList(changes[WATCHLIST_KEY].newValue).items);
      }
    };
    if (!extensionStorage) return;
    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  }, []);

  const save = useCallback(async (next: WatchListItem[]) => {
    setItems(next);
    await storage?.set({
      [WATCHLIST_KEY]: next,
      [WATCHLIST_SCHEMA_KEY]: CURRENT_SCHEMA_VERSION,
    });
  }, []);

  // Always read fresh from storage so we don't clobber writes made by the
  // background worker since the last render.
  const readLatest = useCallback(async (): Promise<WatchListItem[]> => {
    if (!storage) return items;
    return (await readMigrated(storage)).items;
  }, [items]);

  const remove = useCallback(
    async (id: string) => {
      await save((await readLatest()).filter((item) => item.id !== id));
      if (isLocalId(id)) await deleteHandle(id).catch(() => {});
    },
    [readLatest, save],
  );

  // Saves picked files as pointers: a handle in IndexedDB plus a small
  // list entry. Files already in the list are skipped. Returns how many were
  // added.
  const addLocalFiles = useCallback(
    async (handles: LocalFileHandle[]): Promise<number> => {
      const latest = await readLatest();
      const known = (
        await Promise.all(
          latest.filter(isLocal).map((i) => getHandle(i.id).catch(() => undefined)),
        )
      ).filter((h): h is LocalFileHandle => Boolean(h));

      const added: WatchListItem[] = [];
      for (const handle of handles) {
        const dupes = await Promise.all(known.map((k) => k.isSameEntry(handle)));
        if (dupes.some(Boolean)) continue;
        const file = await handle.getFile();
        const meta = await readVideoMeta(file);
        const id = `${LOCAL_ID_PREFIX}${crypto.randomUUID()}`;
        await putHandle(id, handle);
        known.push(handle);
        added.push({
          id,
          platform: "local",
          author: "On this device",
          title: formatVideoTitle(file.name),
          fileName: file.name,
          fileSize: file.size,
          poster: meta.poster,
          durationMs: meta.durationMs,
          aspectRatio: meta.aspectRatio,
          savedAt: Date.now() - added.length,
          watchedAt: null,
        });
      }
      if (added.length) await save([...added, ...(await readLatest())]);
      return added.length;
    },
    [readLatest, save],
  );

  const update = useCallback(
    async (id: string, patch: Partial<WatchListItem>) =>
      save(
        (await readLatest()).map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      ),
    [readLatest, save],
  );

  // Ask the background worker to find the MP4 for a post saved without one.
  const resolve = useCallback(
    async (id: string): Promise<WatchListItem | null> => {
      if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
        return null;
      }
      const response = await chrome.runtime.sendMessage({
        type: "nlvp:resolve",
        id,
      });
      return response?.item || null;
    },
    [],
  );

  return { items, loaded, remove, update, resolve, addLocalFiles };
}

export default useWatchList;
