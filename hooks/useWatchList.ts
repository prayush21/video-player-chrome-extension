import { useCallback, useEffect, useState } from "react";

// Saved-from-X videos. Written by background.js (see x-content.js for how
// posts get saved); the popup reads, updates and removes entries.
export interface WatchListItem {
  id: string;
  candidateIds?: string[];
  author: string;
  authorName?: string;
  text?: string;
  title?: string;
  tweetUrl: string;
  mp4?: string | null;
  poster?: string | null;
  durationMs?: number | null;
  aspectRatio?: number[] | null;
  savedAt: number;
  watchedAt: number | null;
  resolveError?: string | null;
}

const WATCHLIST_KEY = "watchlist";

// Undefined when the page runs outside the extension (e.g. `npm run dev`).
const storage =
  typeof chrome !== "undefined" ? chrome.storage?.local : undefined;

export const getItemTitle = (item: WatchListItem): string => {
  if (item.title) return item.title;
  const firstLine = (item.text || "")
    .replace(/https?:\/\/\S+/g, "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return `@${item.author}'s video`;
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
