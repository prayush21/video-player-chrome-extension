import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  test as base,
  chromium,
  expect,
  type BrowserContext,
  type Page,
  type Worker,
} from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "..");
export const DIST = path.join(ROOT, "dist");
export const FIXTURES = path.join(here, "fixtures");

if (!fs.existsSync(path.join(DIST, "manifest.json"))) {
  throw new Error(
    "dist/manifest.json not found. Run `npm run build` first (or use `npm run e2e`, which builds).",
  );
}

// Any image request to these hosts gets a local PNG instead of the network,
// so posters on fixture pages and in My List load without errors.
const IMAGE_HOSTS = new Set(["pbs.twimg.com", "i.ytimg.com"]);
const PLACEHOLDER_PNG = fs.readFileSync(path.join(DIST, "icons/icon48.png"));

export const fixture = (name: string) =>
  fs.readFileSync(path.join(FIXTURES, name), "utf8");

type Fixtures = {
  context: BrowserContext;
  serviceWorker: Worker;
  extensionId: string;
};

export const test = base.extend<Fixtures>({
  // A fresh profile per test: chrome.storage, sessionStorage and
  // localStorage start empty, like a new install.
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      // "chromium" = full Chromium in the new headless mode, which (unlike
      // the headless shell) can load extensions. Set HEADED=1 to watch.
      channel: "chromium",
      headless: !process.env.HEADED,
      args: [
        `--disable-extensions-except=${DIST}`,
        `--load-extension=${DIST}`,
      ],
    });

    // No real network: every http(s) request is aborted unless a more
    // specific route (registered later, so it wins) serves a fixture.
    await context.route(/^https?:\/\//, (route) => {
      const url = new URL(route.request().url());
      if (IMAGE_HOSTS.has(url.hostname)) {
        return route.fulfill({ contentType: "image/png", body: PLACEHOLDER_PNG });
      }
      return route.abort("internetdisconnected");
    });

    await use(context);
    await context.close();
  },

  serviceWorker: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent("serviceworker");
    await use(worker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host);
  },
});

export { expect };

/** Collects console errors and uncaught exceptions for a page. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Reads chrome.storage.local["watchlist"] from the service worker. */
export async function readWatchList(worker: Worker) {
  return worker.evaluate(async () => {
    const r = await chrome.storage.local.get("watchlist");
    return (r.watchlist || []) as Array<Record<string, unknown>>;
  });
}

export const playerUrl = (extensionId: string, query = "") =>
  `chrome-extension://${extensionId}/index.html${query}`;
