// Sanity checks on the built extension in dist/ before it gets zipped or
// uploaded. Catches the mistakes that break a release without breaking the
// build: a file the manifest points at that never got copied, a version that
// doesn't match package.json, or a permission change nobody meant to ship.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const DIST = "dist";
const PERMISSIONS_LOCK = "scripts/permissions.lock.json";
const MAX_ZIP_MB = 10;

const errors = [];
const fail = (msg) => errors.push(msg);

if (!existsSync(path.join(DIST, "manifest.json"))) {
  console.error("dist/manifest.json not found. Run `npm run build` first.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(path.join(DIST, "manifest.json"), "utf8"));
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

// --- manifest basics -------------------------------------------------------
if (manifest.manifest_version !== 3) fail("manifest_version must be 3");
if (!/^\d+(\.\d+){0,3}$/.test(manifest.version)) {
  fail(`manifest version "${manifest.version}" is not 1-4 dot-separated integers`);
}
if (manifest.version !== pkg.version) {
  fail(
    `manifest version (${manifest.version}) != package.json version (${pkg.version}). ` +
      "Bump with `npm version <patch|minor|major>` so they stay in sync.",
  );
}

// --- every file the manifest references must exist ---------------------------
const referenced = new Set();
const add = (f) => f && referenced.add(f.replace(/^\//, ""));
add(manifest.background?.service_worker);
Object.values(manifest.icons || {}).forEach(add);
add(manifest.action?.default_popup);
const actionIcon = manifest.action?.default_icon;
if (typeof actionIcon === "string") add(actionIcon);
else Object.values(actionIcon || {}).forEach(add);
for (const cs of manifest.content_scripts || []) {
  (cs.js || []).forEach(add);
  (cs.css || []).forEach(add);
}
for (const war of manifest.web_accessible_resources || []) {
  (war.resources || []).filter((r) => !r.includes("*")).forEach(add);
}
for (const file of referenced) {
  if (!existsSync(path.join(DIST, file))) fail(`manifest references missing file: ${file}`);
}

// --- permissions must match the committed lock file --------------------------
// New permissions make Chrome disable the extension for existing users until
// they re-approve, and can trigger a slower store review. Make it deliberate.
const current = {
  permissions: [...(manifest.permissions || [])].sort(),
  host_permissions: [...(manifest.host_permissions || [])].sort(),
  content_script_matches: [
    ...new Set((manifest.content_scripts || []).flatMap((cs) => cs.matches || [])),
  ].sort(),
};
if (process.argv.includes("--print-permissions")) {
  console.log(JSON.stringify(current, null, 2));
  process.exit(0);
}

if (!existsSync(PERMISSIONS_LOCK)) {
  fail(`${PERMISSIONS_LOCK} is missing. Create it with: npm run permissions:update`);
} else {
  const locked = JSON.parse(readFileSync(PERMISSIONS_LOCK, "utf8"));
  if (JSON.stringify(locked) !== JSON.stringify(current)) {
    fail(
      "permissions changed vs scripts/permissions.lock.json:\n" +
        `    locked:  ${JSON.stringify(locked)}\n` +
        `    current: ${JSON.stringify(current)}\n` +
        "  If this is intended, run `npm run permissions:update` and commit the lock file.",
    );
  }
}

// --- nothing that shouldn't ship --------------------------------------------
let totalBytes = 0;
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else {
      totalBytes += stat.size;
      if (name === ".DS_Store" || name.endsWith(".map") || name.startsWith(".env")) {
        fail(`should not ship: ${path.relative(DIST, full)}`);
      }
    }
  }
};
walk(DIST);
const totalMb = totalBytes / 1024 / 1024;
if (totalMb > MAX_ZIP_MB) fail(`dist is ${totalMb.toFixed(1)} MB (limit set to ${MAX_ZIP_MB} MB)`);

if (errors.length) {
  console.error(`✗ dist/ failed ${errors.length} check(s):`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(
  `✓ dist/ OK: v${manifest.version}, ${referenced.size} referenced files present, ${totalMb.toFixed(1)} MB`,
);
