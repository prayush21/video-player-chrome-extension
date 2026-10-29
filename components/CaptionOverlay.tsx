import React from "react";
import type { SubtitleCue } from "../utils/subtitles";

// Draws the current caption above the video. SRT text can carry <i>, <b>
// and <u>; those are kept, any other tag (e.g. <font>) is dropped. Nothing
// is injected as HTML.

const renderCueText = (text: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const style = { i: false, b: false, u: false };
  text.split(/(<\/?[a-z][^>]*>)/i).forEach((part, index) => {
    const tag = /^<(\/?)([ibu])\b/i.exec(part);
    if (tag) {
      style[tag[2].toLowerCase() as "i" | "b" | "u"] = !tag[1];
      return;
    }
    if (!part || part.startsWith("<")) return;
    nodes.push(
      <span
        key={index}
        style={{
          fontStyle: style.i ? "italic" : undefined,
          fontWeight: style.b ? 700 : undefined,
          textDecoration: style.u ? "underline" : undefined,
        }}
      >
        {part}
      </span>,
    );
  });
  return nodes;
};

const CaptionOverlay: React.FC<{
  cue: SubtitleCue | null;
  raised: boolean;
}> = ({ cue, raised }) => (
  <div
    className={`caption-overlay ${raised ? "is-raised" : ""}`}
    aria-live="polite"
  >
    {cue && <div className="caption-text">{renderCueText(cue.text)}</div>}
  </div>
);

export default CaptionOverlay;
