// Zips dist/ into release/netflix-like-player-<version>.zip, ready for the
// Chrome Web Store dashboard or the release workflow.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const { version } = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
const out = path.resolve("release", `netflix-like-player-${version}.zip`);
mkdirSync("release", { recursive: true });
rmSync(out, { force: true });
execFileSync("zip", ["-r", "-X", "-q", out, ".", "-x", "*.DS_Store"], {
  cwd: "dist",
  stdio: "inherit",
});
console.log(`Packaged ${path.relative(process.cwd(), out)}`);
