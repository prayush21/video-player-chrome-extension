// Videos from this computer saved to My List. The list entry (title, poster,
// duration) lives in chrome.storage with the X and YouTube ones; the file
// itself is never copied. All we keep is a File System Access handle, which
// can't go in chrome.storage, so it sits in IndexedDB under the entry's id.
// The file is only opened when it's played.

// The File System Access bits missing from TypeScript's DOM types.
export interface LocalFileHandle extends FileSystemFileHandle {
  queryPermission(options?: { mode?: "read" }): Promise<PermissionState>;
  requestPermission(options?: { mode?: "read" }): Promise<PermissionState>;
}

type PickerWindow = Window & {
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    types?: { description?: string; accept: Record<string, string[]> }[];
  }) => Promise<LocalFileHandle[]>;
};

export const LOCAL_ID_PREFIX = "local-";

export const isLocalId = (id: string): boolean => id.startsWith(LOCAL_ID_PREFIX);

export const isLocalFileSupported = (): boolean =>
  typeof window !== "undefined" &&
  typeof (window as PickerWindow).showOpenFilePicker === "function" &&
  typeof indexedDB !== "undefined";

// Opens the file picker. Resolves to [] if the user cancels.
export async function pickVideoFiles(): Promise<LocalFileHandle[]> {
  const picker = (window as PickerWindow).showOpenFilePicker;
  if (!picker) return [];
  try {
    return await picker.call(window, {
      multiple: true,
      types: [
        {
          description: "Videos",
          accept: {
            "video/*": [".mp4", ".m4v", ".mov", ".webm", ".mkv", ".ogv"],
          },
        },
      ],
    });
  } catch (err) {
    if ((err as DOMException).name === "AbortError") return [];
    throw err;
  }
}

// ---------- handle store ----------

const DB_NAME = "nlvp-local-files";
const STORE = "handles";

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export const putHandle = (id: string, handle: LocalFileHandle) =>
  withStore("readwrite", (s) => s.put(handle, id)).then(() => undefined);

export const getHandle = (id: string) =>
  withStore<LocalFileHandle | undefined>("readonly", (s) => s.get(id));

export const deleteHandle = (id: string) =>
  withStore("readwrite", (s) => s.delete(id)).then(() => undefined);

// ---------- access ----------

// Chrome forgets read access between sessions unless the user chose "Allow on
// every visit", so playing asks again. Must run from a click.
export async function ensureReadPermission(
  handle: LocalFileHandle,
): Promise<boolean> {
  const opts = { mode: "read" } as const;
  if ((await handle.queryPermission(opts)) === "granted") return true;
  return (await handle.requestPermission(opts)) === "granted";
}

// ---------- metadata ----------

export interface LocalVideoMeta {
  durationMs: number | null;
  aspectRatio: number[] | null;
  /** Small JPEG data URL from a frame near the start; null if it can't be decoded. */
  poster: string | null;
}

const POSTER_WIDTH = 480;

const once = (el: HTMLVideoElement, event: string, timeoutMs: number) =>
  new Promise<boolean>((resolve) => {
    const done = (ok: boolean) => {
      window.clearTimeout(timer);
      el.removeEventListener(event, onEvent);
      el.removeEventListener("error", onError);
      resolve(ok);
    };
    const onEvent = () => done(true);
    const onError = () => done(false);
    const timer = window.setTimeout(() => done(false), timeoutMs);
    el.addEventListener(event, onEvent);
    el.addEventListener("error", onError);
  });

// Reads duration and grabs a thumbnail without loading the whole file: the
// browser only fetches what it needs to decode the first frames.
export async function readVideoMeta(file: File): Promise<LocalVideoMeta> {
  const empty: LocalVideoMeta = {
    durationMs: null,
    aspectRatio: null,
    poster: null,
  };
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "metadata";
  video.src = url;
  try {
    if (!(await once(video, "loadedmetadata", 8000))) return empty;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const { videoWidth: w, videoHeight: h } = video;
    const meta: LocalVideoMeta = {
      durationMs: duration ? Math.round(duration * 1000) : null,
      aspectRatio: w && h ? [w, h] : null,
      poster: null,
    };
    if (!w || !h) return meta;

    // A frame a little way in avoids the usual black first frame.
    const seeked = once(video, "seeked", 8000);
    video.currentTime = duration ? Math.min(duration * 0.1, 10) : 0;
    if (!(await seeked)) return meta;

    const canvas = document.createElement("canvas");
    canvas.width = Math.min(POSTER_WIDTH, w);
    canvas.height = Math.round((canvas.width * h) / w);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    meta.poster = canvas.toDataURL("image/jpeg", 0.72);
    return meta;
  } catch {
    return empty;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
