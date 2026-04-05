# Preview Optimization PR Template

## Summary

- Integrates hover scheduling controls in ProgressBar and loader/network tuning in useVideoPreview.
- Reduces preview request churn during hover while keeping tooltip time updates immediate.
- Lowers preview video loading overhead by switching to metadata preload and gating seek work until metadata is ready.

## Change Details

### Agent A: Hover scheduling and rate control

- Added first-hover dwell delay before requesting preview frames.
- Added throttle window for hover-driven preview frame requests.
- Added minimum pointer delta threshold before requesting another preview frame.
- Added timer cleanup on mouse leave and component unmount.
- Kept playback seek behavior unchanged.

### Agent B: Preview loader overhead reduction

- Changed hidden preview video preload from auto to metadata.
- Added metadata-ready gating for preview seek requests.
- Increased internal preview seek debounce interval.
- Preserved frame cache behavior and cross-origin fallback behavior.

## Verification Checklist

### Automated

- [ ] npm run build passes
- [ ] No TypeScript diagnostics in workspace

### Local file playback

- [ ] Playback starts quickly
- [ ] Hover preview appears after dwell
- [ ] Tooltip time remains smooth and accurate while hover-moving
- [ ] Random seek remains responsive
- [ ] Keyboard seek behavior remains unchanged

### Remote URL playback

- [ ] Fewer media range requests during 5-second hover scrub
- [ ] Main playback buffering does not worsen during hover
- [ ] Preview appears reliably after dwell

### Stability

- [ ] No console errors in extension tab
- [ ] Rapid enter/leave on progress bar does not leave dangling behavior
- [ ] No stuck tooltip or ghost frame updates after mouse leave

## Before vs After Metrics

| Metric                                               | Baseline | After | Delta | Notes |
| ---------------------------------------------------- | -------- | ----- | ----- | ----- |
| Media requests in 5-second hover scrub               |          |       |       |       |
| Time to first preview on hover                       |          |       |       |       |
| Average delay for random seek (+10, -10, click jump) |          |       |       |       |

## Risk Assessment

- Primary risk: preview feels too sluggish if dwell or throttle are too conservative.
- Mitigation: tune dwell and throttle constants before architectural rollback.

## Rollback Plan

1. Lower dwell delay and throttle interval constants incrementally.
2. Keep metadata preload and metadata gating intact unless required.
3. Revert scheduling constants first, then broader logic only if necessary.
