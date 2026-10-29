# Thumbnail Preview Optimization Plan (Agent Handoff)

## Scope

Implement only the two approved high-impact, low-risk optimizations:

1. Reduce preview request churn from hover interactions.
2. Lower preview loader overhead (`preload: auto` -> `preload: metadata`) and avoid eager thumbnail work.

Out of scope for this handoff:

- Server-side thumbnail sprites / VTT tracks
- Remote-vs-local feature gating
- Pre/main/post clip architecture changes
- Any redesign of player controls UI

## Current Baseline (for context)

### Hot path files

- `hooks/useVideoPreview.ts`
- `components/ProgressBar.tsx`

### Current behavior summary

- `ProgressBar` calls `seekToTime` on every hover `onMouseMove`.
- `useVideoPreview` creates a separate hidden `<video>` with `preload = "auto"`.
- Preview seeks are debounced at 30ms and can still fire very frequently under pointer movement.

## Delivery Model

Two agents can work in parallel with a clear dependency boundary:

- Agent A: Hover scheduling + event-rate control in `ProgressBar`
- Agent B: Preview loader/network tuning in `useVideoPreview`

Then one integration pass + verification.

---

## Agent A: Hover Scheduling and Request Rate Control

### Goal

Reduce number of `seekToTime` calls while preserving responsive preview UX.

### Files

- `components/ProgressBar.tsx`

### Tasks

- Add a short hover dwell delay before the first preview frame request.
  - Suggested target: 120-200ms.
- Throttle hover-driven preview updates.
  - Suggested target: max 1 request per 120-180ms.
- Add a minimum pointer movement threshold before issuing another preview request.
  - Suggested target: 6-10px delta on the progress bar.
- Ensure all timers are cleaned on mouse leave and unmount.
- Keep time label updates immediate; only throttle thumbnail frame requests.

### Acceptance Criteria

- On steady pointer movement across the bar, preview requests are visibly reduced.
- Tooltip time remains smooth and accurate.
- No React warnings or dangling timers on rapid enter/leave.
- Scrubbing seek behavior (actual playback seeking) remains unchanged.

### Notes

- Keep changes minimal and localized to preview scheduling.
- Do not alter player keyboard seek behavior.

---

## Agent B: Preview Loader Overhead Reduction

### Goal

Make preview video loading lighter so it competes less with main playback.

### Files

- `hooks/useVideoPreview.ts`

### Tasks

- Change hidden preview video preload mode from `auto` to `metadata`.
- Ensure preview seek requests are only attempted when metadata is available.
- Increase or make configurable the internal seek debounce window.
  - Suggested target: 100-180ms (starting point 120ms).
- Keep cache behavior intact unless a minimal safe tweak is needed.
- Preserve cross-origin fallback behavior (draw still works, cache may not).

### Acceptance Criteria

- Initial media network burst from preview pipeline is lower than baseline.
- Preview still appears after hover dwell and updates reasonably.
- No regressions in local file preview behavior.
- No TypeScript or lint issues introduced.

### Notes

- Do not remove cache logic in this pass.
- Do not change canvas dimensions in this pass.

---

## Integration Pass (Either Agent or Maintainer)

### Goal

Validate combined behavior and guard against interaction regressions.

### Tasks

- Rebase/merge Agent A and Agent B changes.
- Run build and smoke test local + remote videos.
- Verify cleanup behavior by rapidly entering/leaving progress bar.
- Validate that preview does not trigger continuous request storms.

### Verification Checklist

- `npm run build` passes.
- Local file playback:
  - play starts quickly
  - hover preview appears after dwell
  - random seek remains responsive
- Remote URL playback:
  - fewer media range requests during hover than baseline
  - main playback buffering does not worsen during hover
- No console errors in extension tab.

---

## Suggested PR Breakdown

### PR 1 (Agent A)

Title: `perf(progress-bar): throttle hover preview scheduling`

### PR 2 (Agent B)

Title: `perf(video-preview): reduce preload and seek cadence`

### PR 3 (Integration)

Title: `perf(preview): integrate scheduling and loader optimizations`

---

## Rollback Plan

If UX becomes too sluggish:

- Lower dwell delay and/or throttle interval incrementally.
- Keep `metadata` preload, but tune seek cadence.
- Revert only scheduling constants first before reverting architecture.

---

## Baseline Metrics to Capture Before/After

- Count of media requests during a 5-second hover scrub on same video.
- Time-to-first-preview on hover.
- Average delay for random seeks (+10/-10 + click jump).

Record these in PR descriptions for objective comparison.
