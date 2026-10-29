import { describe, expect, it } from "vitest";
import {
  CURRENT_SCHEMA_VERSION,
  migrateWatchList,
} from "../utils/storageMigration";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// 1.3.0 had no My List and no "storage" permission: nothing is stored.
const V130_STORED: unknown = undefined;

// 1.4.0: X-only entries as written by background.js at commit 2aacba5.
// No platform, link in tweetUrl, no schema version key.
const V140_STORED = [
  {
    id: "1845000000000000001",
    candidateIds: ["1845000000000000001", "1844999999999999999"],
    author: "nasa",
    authorName: "NASA",
    text: "Liftoff! https://t.co/abc",
    tweetUrl: "https://x.com/nasa/status/1845000000000000001",
    mp4: "https://video.twimg.com/ext_tw_video/1/pu/vid/1280x720/a.mp4",
    poster: "https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/a.jpg",
    durationMs: 61000,
    aspectRatio: [16, 9],
    savedAt: 1760130000000,
    watchedAt: null,
  },
  {
    id: "1845000000000000002",
    candidateIds: ["1845000000000000002"],
    author: "someone",
    tweetUrl: "https://x.com/someone/status/1845000000000000002",
    mp4: null,
    savedAt: 1760120000000,
    watchedAt: 1760125000000,
    resolveError: "Couldn't find a playable file for this post.",
  },
];

// Current (1.5.0): X, YouTube and local entries, schema version 2.
const CURRENT_STORED = [
  {
    id: "yt-dQw4w9WgXcQ",
    platform: "youtube",
    author: "Rick Astley",
    title: "Never Gonna Give You Up",
    sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    poster: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    durationMs: 213000,
    savedAt: 1761000000000,
    watchedAt: null,
  },
  {
    id: "local-3f1c2a7e-0000-4000-8000-000000000000",
    platform: "local",
    author: "On this device",
    title: "Holiday",
    fileName: "holiday.mp4",
    fileSize: 12345678,
    poster: "data:image/jpeg;base64,AAAA",
    durationMs: 90000,
    aspectRatio: [16, 9],
    savedAt: 1760900000000,
    watchedAt: 1760950000000,
  },
  {
    id: "1845000000000000003",
    platform: "x",
    candidateIds: ["1845000000000000003"],
    author: "nasa",
    text: "Docking",
    sourceUrl: "https://x.com/nasa/status/1845000000000000003",
    mp4: "https://video.twimg.com/b.mp4",
    savedAt: 1760800000000,
    watchedAt: null,
    resolveError: null,
  },
];

describe("migrateWatchList", () => {
  it("handles a 1.3.0 install (nothing stored) without writing", () => {
    const r = migrateWatchList(V130_STORED, undefined);
    expect(r.items).toEqual([]);
    expect(r.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(r.changed).toBe(false);
  });

  it("upgrades 1.4.0 entries, keeping every field and every entry", () => {
    const input = clone(V140_STORED);
    const r = migrateWatchList(input, undefined);
    expect(r.items).toHaveLength(2);
    r.items.forEach((item, i) => {
      expect(item).toEqual({ ...V140_STORED[i], platform: "x" });
    });
    expect(r.changed).toBe(true);
    expect(r.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    // Pure: input is not mutated.
    expect(input).toEqual(V140_STORED);
  });

  it("leaves already-current data unchanged", () => {
    const r = migrateWatchList(clone(CURRENT_STORED), CURRENT_SCHEMA_VERSION);
    expect(r.items).toEqual(CURRENT_STORED);
    expect(r.changed).toBe(false);
  });

  it("is idempotent", () => {
    for (const [stored, version] of [
      [V140_STORED, undefined],
      [CURRENT_STORED, 2],
      [[null, { id: 5, savedAt: "2026-01-01", text: 3 }, "x"], 1],
    ] as const) {
      const once = migrateWatchList(clone(stored), version);
      const twice = migrateWatchList(clone(once.items), once.schemaVersion);
      expect(twice.items).toEqual(once.items);
      expect(twice.changed).toBe(false);
      expect(twice.schemaVersion).toBe(once.schemaVersion);
    }
  });

  it("infers the platform for entries missing it", () => {
    const r = migrateWatchList([
      { id: "local-abc", author: "On this device", savedAt: 1, watchedAt: null },
      { id: "yt-x", youtubeId: "x", author: "Chan", savedAt: 1, watchedAt: null },
      { id: "123", author: "a", savedAt: 1, watchedAt: null },
    ]);
    expect(r.items.map((i) => i.platform)).toEqual(["local", "youtube", "x"]);
  });

  it("returns [] for empty, missing or non-array data and never throws", () => {
    for (const bad of [undefined, null, "", "garbage", 42, true, {}, { items: 1 }]) {
      const r = migrateWatchList(bad, "nope");
      expect(r.items).toEqual([]);
      // Don't overwrite something we don't understand on our own.
      expect(r.changed).toBe(false);
    }
    expect(migrateWatchList([]).changed).toBe(false);
  });

  it("drops only entries that can't be kept, and repairs bad fields", () => {
    const r = migrateWatchList([
      null,
      "string",
      42,
      [],
      { noId: true },
      { id: "" },
      { id: 1845000000000000000 },
      {
        id: "keep-me",
        author: null,
        text: { not: "a string" },
        title: 7,
        candidateIds: ["a", 2, null, "b"],
        durationMs: "long",
        aspectRatio: ["16", 9],
        fileSize: "big",
        savedAt: "2026-10-01T00:00:00Z",
        watchedAt: "never",
        extraFromNewerBuild: { keep: true },
      },
    ]);
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toMatchObject({
      id: "1845000000000000000",
      author: "",
      platform: "x",
      savedAt: 0,
      watchedAt: null,
    });
    expect(r.items[1]).toEqual({
      id: "keep-me",
      platform: "x",
      author: "",
      candidateIds: ["a", "b"],
      savedAt: Date.parse("2026-10-01T00:00:00Z"),
      watchedAt: null,
      extraFromNewerBuild: { keep: true },
    });
    expect(r.changed).toBe(true);
  });

  it("keeps the first (newest) of duplicate ids", () => {
    const r = migrateWatchList([
      { id: "a", platform: "x", author: "new", savedAt: 2, watchedAt: null },
      { id: "a", platform: "x", author: "old", savedAt: 1, watchedAt: null },
      { id: "b", platform: "x", author: "b", savedAt: 0, watchedAt: null },
    ]);
    expect(r.items.map((i) => i.author)).toEqual(["new", "b"]);
  });

  it("preserves data and version from a newer build (rollback)", () => {
    const stored = [
      { id: "tt-1", platform: "tiktok", author: "x", savedAt: 1, watchedAt: null, extra: 1 },
    ];
    const r = migrateWatchList(clone(stored), 3);
    expect(r.items).toEqual(stored);
    expect(r.changed).toBe(false);
    expect(r.schemaVersion).toBe(3);
  });
});
