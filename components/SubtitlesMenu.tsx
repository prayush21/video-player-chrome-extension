import React, { useEffect, useRef, useState } from "react";
import { SubtitlesIcon2 } from "./icons";

// "Subtitles" popover in the player controls: load an .srt/.vtt from disk,
// switch it on or off, and nudge its timing if it's out of sync.

export interface SubtitlesControl {
  fileName: string | null;
  enabled: boolean;
  /** Seconds added to every cue; positive shows captions later. */
  offset: number;
  error: string;
  onLoad: (file: File) => void;
  onToggle: (enabled: boolean) => void;
  onOffsetChange: (offset: number) => void;
}

const OFFSET_STEP = 0.5;

const formatOffset = (offset: number) =>
  `${offset > 0 ? "+" : ""}${offset.toFixed(1)}s`;

const Check: React.FC<{ on: boolean }> = ({ on }) => (
  <span className="subs-check" aria-hidden="true">
    {on ? "✓" : ""}
  </span>
);

const SubtitlesMenu: React.FC<{ subtitles: SubtitlesControl }> = ({
  subtitles,
}) => {
  const { fileName, enabled, offset, error, onLoad, onToggle, onOffsetChange } =
    subtitles;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="subs-menu" ref={rootRef}>
      <button
        className={`control-btn ${fileName && enabled ? "is-on" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Subtitles"
        aria-expanded={open}
        title="Subtitles (C)"
      >
        <SubtitlesIcon2 />
      </button>

      {open && (
        <div className="subs-panel" role="dialog" aria-label="Subtitles">
          <h3 className="subs-heading">Subtitles</h3>
          <button className="subs-option" onClick={() => onToggle(false)}>
            <Check on={!fileName || !enabled} /> Off
          </button>
          {fileName && (
            <button
              className="subs-option"
              onClick={() => onToggle(true)}
              title={fileName}
            >
              <Check on={enabled} />
              <span className="subs-file">{fileName}</span>
            </button>
          )}
          <button
            className="subs-option subs-add"
            onClick={() => inputRef.current?.click()}
          >
            <span className="subs-check" aria-hidden="true">
              +
            </span>
            {fileName ? "Load a different file" : "Add from file (.srt, .vtt)"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".srt,.vtt"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onLoad(file);
              e.target.value = "";
            }}
          />

          {error && <p className="subs-error">{error}</p>}

          {fileName && (
            <div className="subs-sync">
              <span>Out of sync?</span>
              <div className="subs-sync-controls">
                <button
                  onClick={() => onOffsetChange(offset - OFFSET_STEP)}
                  aria-label="Show subtitles earlier"
                  title="Earlier"
                >
                  −
                </button>
                <output>{formatOffset(offset)}</output>
                <button
                  onClick={() => onOffsetChange(offset + OFFSET_STEP)}
                  aria-label="Show subtitles later"
                  title="Later"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <p className="subs-hint">
            Or drop a subtitle file onto the video. Press C to toggle.
          </p>
        </div>
      )}
    </div>
  );
};

export default SubtitlesMenu;
