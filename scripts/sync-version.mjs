// Runs from the npm "version" lifecycle (`npm version patch|minor|major`):
// copies the new package.json version into public/manifest.json so both are
// bumped in the same commit and tag.
import { readFileSync, writeFileSync } from "node:fs";

const MANIFEST = "public/manifest.json";
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
manifest.version = version;
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`${MANIFEST} -> ${version}`);
