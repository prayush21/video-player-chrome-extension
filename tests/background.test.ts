// Loads public/background.js (the MV3 service worker) in a sandbox with a
// fake `chrome` API. A throw at load time would kill the whole extension, so
// this is the cheapest guard we have against shipping a broken worker.
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { beforeEach, describe, expect, it } from "vitest";

type Listener = (...args: any[]) => any;

function loadBackground(fetchImpl: (url: string) => Promise<unknown> = async () => ({
  ok: false,
  status: 404,
})) {
  const store: Record<string, unknown> = {};
  const listeners: Record<string, Listener[]> = {};
  const sessionRules: any[] = [];
  const event = (name: string) => ({
    addListener: (fn: Listener) => (listeners[name] ||= []).push(fn),
  });

  const chrome = {
    runtime: {
      id: "abcdefghijklmnop",
      onInstalled: event("onInstalled"),
      onMessage: event("onMessage"),
      getURL: (p: string) => `chrome-extension://test/${p}`,
      lastError: undefined,
    },
    action: { onClicked: event("action.onClicked") },
    contextMenus: { create: () => {}, onClicked: event("contextMenus.onClicked") },
    scripting: { executeScript: () => {} },
    tabs: { create: () => {} },
    declarativeNetRequest: {
      updateSessionRules: async ({ addRules }: { addRules: any[] }) => {
        sessionRules.splice(0, sessionRules.length, ...addRules);
      },
    },
    storage: {
      local: {
        get: async (key: string) => ({ [key]: store[key] }),
        set: async (obj: Record<string, unknown>) => Object.assign(store, obj),
      },
    },
  };

  const context = vm.createContext({
    chrome,
    console,
    URL,
    fetch: fetchImpl,
  });
  vm.runInContext(readFileSync("public/background.js", "utf8"), context);

  const sendMessage = (message: unknown) =>
    new Promise((resolve) => {
      const keepOpen = listeners.onMessage[0](message, {}, resolve);
      expect(keepOpen).toBe(true);
    });

  return { context, listeners, store, sessionRules, sendMessage };
}

describe("background.js", () => {
  let bg: ReturnType<typeof loadBackground>;
  beforeEach(() => {
    bg = loadBackground();
  });

  it("registers its listeners", () => {
    for (const name of [
      "onInstalled",
      "onMessage",
      "action.onClicked",
      "contextMenus.onClicked",
    ]) {
      expect(bg.listeners[name], name).toHaveLength(1);
    }
  });

  it("identifies YouTube embeds from extension pages only", () => {
    expect(bg.sessionRules).toHaveLength(1);
    const [rule] = bg.sessionRules;
    expect(rule.condition.initiatorDomains).toEqual(["abcdefghijklmnop"]);
    expect(rule.condition.resourceTypes).toEqual(["sub_frame"]);
    expect(rule.action.requestHeaders[0]).toMatchObject({
      header: "referer",
      value: "https://abcdefghijklmnop.chromiumapp.org/",
    });
  });

  it("picks the highest-bitrate MP4", () => {
    const url = bg.context.pickBestMp4([
      { url: "a.m3u8", content_type: "application/x-mpegURL" },
      { url: "low.mp4", content_type: "video/mp4", bitrate: 100 },
      { url: "high.mp4", content_type: "video/mp4", bitrate: 900 },
    ]);
    expect(url).toBe("high.mp4");
  });

  it("recognises x.com and twitter.com URLs only", () => {
    expect(bg.context.isXUrl("https://x.com/a/status/1")).toBe(true);
    expect(bg.context.isXUrl("https://mobile.twitter.com/a")).toBe(true);
    expect(bg.context.isXUrl("https://notx.com/a")).toBe(false);
    expect(bg.context.isXUrl("not a url")).toBe(false);
  });

  it("toggles an item in and out of the watch list", async () => {
    const item = { id: "42", author: "a", mp4: "https://video.twimg.com/v.mp4" };

    expect(await bg.sendMessage({ type: "nlvp:toggle", item })).toEqual({
      saved: true,
    });
    const saved = bg.store.watchlist as any[];
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ id: "42", watchedAt: null });

    expect(await bg.sendMessage({ type: "nlvp:toggle", item })).toEqual({
      saved: false,
    });
    expect(bg.store.watchlist).toEqual([]);
  });
});

describe("background.js resolvers", () => {
  it("treats YouTube items as playable without resolving", async () => {
    const fetched: string[] = [];
    const bg = loadBackground(async (url) => {
      fetched.push(url);
      return { ok: false, status: 500 };
    });
    const item = { id: "yt:abc", platform: "youtube", youtubeId: "abc" };
    expect(bg.context.isPlayable(item)).toBe(true);
    await bg.sendMessage({ type: "nlvp:toggle", item });
    expect(fetched).toEqual([]);
  });

  it("reports X items it can't find a file for", async () => {
    const bg = loadBackground();
    const resolved = await bg.context.resolveItem({ id: "123" });
    expect(resolved.resolveError).toMatch(/Couldn't find/);
  });
});
