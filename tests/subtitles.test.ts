import { describe, expect, it } from "vitest";
import {
  decodeSubtitleFile,
  findCue,
  parseSubtitles,
} from "../utils/subtitles";

const SRT = `﻿1
00:00:01,000 --> 00:00:03,500
Hello there.

2
00:00:04,000 --> 00:00:06,000
<i>Two lines,</i>
second line

3
00:01:02,05 --> 00:01:04,000
Short millis
`;

describe("parseSubtitles", () => {
  it("parses SRT with a BOM, CRLF and multi-line cues", () => {
    const cues = parseSubtitles(SRT.replace(/\n/g, "\r\n"));
    expect(cues).toEqual([
      { start: 1, end: 3.5, text: "Hello there." },
      { start: 4, end: 6, text: "<i>Two lines,</i>\nsecond line" },
      { start: 62.05, end: 64, text: "Short millis" },
    ]);
  });

  it("parses WebVTT, including timestamps without hours and cue settings", () => {
    const vtt = `WEBVTT

NOTE a comment

intro
00:05.250 --> 00:07.000 align:start
From a VTT file
`;
    expect(parseSubtitles(vtt)).toEqual([
      { start: 5.25, end: 7, text: "From a VTT file" },
    ]);
  });

  it("returns nothing for files that aren't subtitles", () => {
    expect(parseSubtitles("just some text\nno timings")).toEqual([]);
  });
});

describe("findCue", () => {
  const cues = parseSubtitles(SRT);
  it.each([
    [0.5, null],
    [1, "Hello there."],
    [3.49, "Hello there."],
    [3.7, null],
    [5, "<i>Two lines,</i>\nsecond line"],
    [63, "Short millis"],
    [100, null],
  ])("at %ss -> %s", (time, text) => {
    expect(findCue(cues, time)?.text ?? null).toBe(text);
  });
});

describe("decodeSubtitleFile", () => {
  it("falls back to Windows-1252 for non-UTF-8 files", () => {
    // "café" with é as the single byte 0xE9.
    const bytes = new Uint8Array([0x63, 0x61, 0x66, 0xe9]);
    expect(decodeSubtitleFile(bytes.buffer)).toBe("café");
  });
});
