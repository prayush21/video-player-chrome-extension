// Subtitle files the player can load from disk: SubRip (.srt) and WebVTT
// (.vtt). Both are blocks of "start --> end" followed by caption lines.

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

// 00:01:02,500 / 00:01:02.500 / 01:02.500 (VTT allows dropping the hours).
const TIMESTAMP = /(?:(\d+):)?(\d{1,2}):(\d{2})[,.](\d{1,3})/;

const toSeconds = (stamp: string): number | null => {
  const m = TIMESTAMP.exec(stamp);
  if (!m) return null;
  const [, h = "0", min, s, ms] = m;
  return (
    Number(h) * 3600 + Number(min) * 60 + Number(s) + Number(ms.padEnd(3, "0")) / 1000
  );
};

export const parseSubtitles = (raw: string): SubtitleCue[] => {
  const cues: SubtitleCue[] = [];
  const blocks = raw
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block.split("\n");
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex === -1) continue; // index-only, WEBVTT header, NOTE...
    const [from, to] = lines[timingIndex].split("-->");
    const start = toSeconds(from);
    const end = toSeconds(to);
    const text = lines
      .slice(timingIndex + 1)
      .join("\n")
      .trim();
    if (start === null || end === null || !text) continue;
    cues.push({ start, end, text });
  }
  return cues.sort((a, b) => a.start - b.start);
};

/** The caption showing at `time`, if any. Cues are sorted by start. */
export const findCue = (
  cues: SubtitleCue[],
  time: number,
): SubtitleCue | null => {
  let lo = 0;
  let hi = cues.length - 1;
  let candidate = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= time) {
      candidate = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  // Overlapping cues are rare; look back a few in case an earlier one is
  // still on screen.
  for (let i = candidate; i >= 0 && i > candidate - 4; i--) {
    if (time < cues[i].end) return cues[i];
  }
  return null;
};

// Most .srt files are UTF-8, but plenty of older ones are Windows-1252
// (accented letters turn into "�" if read as UTF-8).
export const decodeSubtitleFile = (buffer: ArrayBuffer): string => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
};

export const isSubtitleFile = (file: File) => /\.(srt|vtt)$/i.test(file.name);
