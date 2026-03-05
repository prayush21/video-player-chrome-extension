/**
 * Formats a raw filename/URL-path-segment into a human-readable title.
 *
 * Steps:
 *  1. Strip the file extension.
 *  2. Replace common separators (-, _, .) with spaces.
 *  3. Collapse multiple spaces.
 *  4. Title-case every word.
 *
 * Examples:
 *   "my_cool_video.mp4"          → "My Cool Video"
 *   "Big.Buck.Bunny.1080p.mp4"   → "Big Buck Bunny 1080p"
 *   "eq7rvM79MON8djEX.mp4"       → "eq7rvM79MON8djEX"  (hash — unchanged, no separators)
 */
export function formatVideoTitle(raw: string): string {
  if (!raw) return "Untitled Video";

  // Decode URI encoding (%20, etc.)
  let name = decodeURIComponent(raw);

  // Strip query string / fragments that may be appended to path segments
  name = name.split("?")[0].split("#")[0];

  // Strip file extension (last .xxx up to 5 chars)
  name = name.replace(/\.[a-zA-Z0-9]{1,5}$/, "");

  // Replace separators with spaces
  name = name.replace(/[-_.]+/g, " ").trim();

  // Collapse multiple spaces
  name = name.replace(/\s{2,}/g, " ");

  if (!name) return "Untitled Video";

  // Title-case: only apply when there are actual word boundaries (spaces)
  // so random-hash filenames are left as-is
  if (name.includes(" ")) {
    name = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return name;
}
