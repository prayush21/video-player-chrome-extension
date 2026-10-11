import { describe, expect, it } from "vitest";
import { formatTime } from "../utils/formatTime";
import { formatVideoTitle } from "../utils/formatVideoTitle";
import {
  getAuthorLabel,
  getItemTitle,
  getPosterUrls,
  getSourceUrl,
  WatchListItem,
} from "../hooks/useWatchList";

describe("formatVideoTitle", () => {
  it.each([
    ["my_cool_video.mp4", "My Cool Video"],
    ["Big.Buck.Bunny.1080p.mp4", "Big Buck Bunny 1080p"],
    ["eq7rvM79MON8djEX.mp4", "eq7rvM79MON8djEX"],
    ["my%20clip.webm?x=1#t=3", "My Clip"],
    ["", "Untitled Video"],
    [".mp4", "Untitled Video"],
  ])("%s -> %s", (input, expected) => {
    expect(formatVideoTitle(input)).toBe(expected);
  });
});

describe("formatTime", () => {
  it("formats minutes and hours", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(75)).toBe("01:15");
    expect(formatTime(3725)).toBe("1:02:05");
  });

  it("guards bad input", () => {
    expect(formatTime(NaN)).toBe("00:00");
    expect(formatTime(-5)).toBe("00:00");
  });
});

describe("getItemTitle", () => {
  const base: WatchListItem = {
    id: "1",
    author: "someone",
    tweetUrl: "https://x.com/someone/status/1",
    savedAt: 0,
    watchedAt: null,
  };

  it("prefers a user-edited title", () => {
    expect(getItemTitle({ ...base, title: "Mine", text: "Post" })).toBe("Mine");
  });

  it("uses the first non-link line of the post", () => {
    expect(
      getItemTitle({ ...base, text: "https://t.co/abc\n  Hello world \nmore" }),
    ).toBe("Hello world");
  });

  it("truncates long text", () => {
    const title = getItemTitle({ ...base, text: "a".repeat(100) });
    expect(title).toHaveLength(80);
    expect(title.endsWith("...")).toBe(true);
  });

  it("falls back to the author", () => {
    expect(getItemTitle({ ...base, text: "https://t.co/only-a-link" })).toBe(
      "@someone's video",
    );
  });
});

describe("multi-platform helpers", () => {
  const legacyX: WatchListItem = {
    id: "1",
    author: "someone",
    tweetUrl: "https://x.com/someone/status/1",
    savedAt: 0,
    watchedAt: null,
  };

  it("keeps items saved before 1.5 working as X items", () => {
    expect(getSourceUrl(legacyX)).toBe("https://x.com/someone/status/1");
    expect(getAuthorLabel(legacyX)).toBe("@someone");
  });

  it("tries larger YouTube thumbnails before the saved poster", () => {
    const yt = {
      ...legacyX,
      platform: "youtube" as const,
      youtubeId: "abc",
      poster: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
    };
    expect(getPosterUrls(yt)).toEqual([
      "https://i.ytimg.com/vi/abc/maxresdefault.jpg",
      "https://i.ytimg.com/vi/abc/sddefault.jpg",
      "https://i.ytimg.com/vi/abc/hqdefault.jpg",
    ]);
    expect(getPosterUrls({ ...legacyX, poster: "p.jpg" })).toEqual(["p.jpg"]);
  });

  it("labels YouTube channels without an @", () => {
    const yt = { ...legacyX, platform: "youtube" as const, author: "Blender" };
    expect(getAuthorLabel(yt)).toBe("Blender");
    expect(getItemTitle(yt)).toBe("Blender's video");
  });
});
