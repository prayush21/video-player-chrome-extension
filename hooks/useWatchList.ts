import { useCallback, useEffect, useState } from "react";

export type Platform = "x" | "youtube";

export const PLATFORM_LABELS: Record<Platform, string> = {
  x: "X",
  youtube: "YouTube",
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
}

const WATCHLIST_KEY = "watchlist";

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

export const getPlatform = (item: WatchListItem): Platform =>
  item.platform || "x";

export const getSourceUrl = (item: WatchListItem): string =>
  item.sourceUrl || item.tweetUrl || "#";

// X handles get an "@"; YouTube stores the channel name.
export const getAuthorLabel = (item: WatchListItem): string =>
  getPlatform(item) === "x" ? `@${item.author}` : item.author;

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

export const isPlayable = (item: WatchListItem): boolean =>
  Boolean(item.mp4 || item.youtubeId);

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
    storage.get(WATCHLIST_KEY).then((result) => {
      setItems((result[WATCHLIST_KEY] as WatchListItem[]) || []);
      setLoaded(true);
    });

    const handleChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === "local" && changes[WATCHLIST_KEY]) {
        setItems(changes[WATCHLIST_KEY].newValue || []);
      }
    };
    if (!extensionStorage) return;
    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  }, []);

  const save = useCallback(async (next: WatchListItem[]) => {
    setItems(next);
    await storage?.set({ [WATCHLIST_KEY]: next });
  }, []);

  // Always read fresh from storage so we don't clobber writes made by the
  // background worker since the last render.
  const readLatest = useCallback(async (): Promise<WatchListItem[]> => {
    if (!storage) return items;
    const result = await storage.get(WATCHLIST_KEY);
    return (result[WATCHLIST_KEY] as WatchListItem[]) || [];
  }, [items]);

  const remove = useCallback(
    async (id: string) =>
      save((await readLatest()).filter((item) => item.id !== id)),
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

  return { items, loaded, remove, update, resolve };
}

export default useWatchList;
