import fs from "node:fs";
import path from "node:path";
import { test, expect, trackErrors, playerUrl, DIST } from "./extension";

const manifest = JSON.parse(
  fs.readFileSync(path.join(DIST, "manifest.json"), "utf8"),
);

test("service worker registers and the extension id resolves", async ({
  serviceWorker,
  extensionId,
}) => {
  expect(extensionId).toMatch(/^[a-p]{32}$/);
  expect(serviceWorker.url()).toBe(
    `chrome-extension://${extensionId}/${manifest.background.service_worker}`,
  );

  // The worker ran its top level without throwing and sees the built manifest.
  const info = await serviceWorker.evaluate(() => ({
    id: chrome.runtime.id,
    version: chrome.runtime.getManifest().version,
    hasContextMenus: typeof chrome.contextMenus?.create === "function",
  }));
  expect(info).toEqual({
    id: extensionId,
    version: manifest.version,
    hasContextMenus: true,
  });

  // registerYouTubeEmbedReferer() ran at startup.
  await expect
    .poll(() =>
      serviceWorker.evaluate(async () =>
        (await chrome.declarativeNetRequest.getSessionRules()).map((r) => r.id),
      ),
    )
    .toEqual([1]);
});

test("player page renders with no console or page errors", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  const errors = trackErrors(page);

  // background.js opens the player as chrome-extension://<id>/index.html.
  await page.goto(playerUrl(extensionId));
  await expect(page).toHaveTitle("Streamline Player");
  await expect(
    page.getByRole("heading", { name: "Who's watching?" }),
  ).toBeVisible();
  // My List loaded from chrome.storage (empty on a fresh profile).
  await expect(page.getByText("Your list is empty. Bold strategy.")).toBeVisible();

  // Profiles that need saved videos are disabled; the others work.
  await expect(page.getByRole("button", { name: /The Binger/ })).toBeDisabled();
  await page.getByRole("button", { name: /Someone Else/ }).click();
  await expect(
    page.getByRole("heading", { name: "Bring your own video." }),
  ).toBeVisible();

  // The bundled CSS was applied (not an unstyled page).
  const bg = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  expect(bg).not.toBe("rgba(0, 0, 0, 0)");

  expect(errors).toEqual([]);
});

async function openSourceView(page: import("@playwright/test").Page, id: string) {
  await page.goto(playerUrl(id));
  await page.getByRole("button", { name: /Someone Else/ }).click();
  await expect(
    page.getByRole("heading", { name: "Bring your own video." }),
  ).toBeVisible();
}

const currentTime = (page: import("@playwright/test").Page) =>
  page.locator("video.player-video").evaluate((v: HTMLVideoElement) => v.currentTime);

/**
 * The clip must be bundled whatever the browser; whether it can be decoded
 * depends on the Chromium build (the clips are H.264/AAC). If this build has
 * no H.264 decoder the playback half is skipped, visibly, not passed.
 */
async function requireClip(page: import("@playwright/test").Page, clip: string) {
  const served = await page.evaluate(async (url) => {
    const res = await fetch(url);
    return { ok: res.ok, type: res.headers.get("content-type"), size: (await res.arrayBuffer()).byteLength };
  }, clip);
  expect(served.ok, `${clip} is missing from dist/`).toBe(true);
  expect(served.type).toBe("video/mp4");
  expect(served.size).toBeGreaterThan(100_000);

  const h264 = await page.evaluate(() =>
    document
      .createElement("video")
      .canPlayType('video/mp4; codecs="avc1.640028, mp4a.40.2"'),
  );
  test.skip(
    h264 === "",
    "This Chromium build cannot decode H.264/AAC, so the bundled clips can't play here.",
  );
}

test("bundled demo clip plays", async ({ context, extensionId }) => {
  const page = await context.newPage();
  const errors = trackErrors(page);
  await openSourceView(page, extensionId);
  await requireClip(page, "/clips/demo-sintel-trailer.mp4");

  // Skip the intro so the <video> holds the demo clip itself.
  const introSwitch = page.getByRole("button", { name: "Show Intro" });
  await expect(introSwitch).toHaveAttribute("aria-pressed", "true");
  await introSwitch.click();
  await expect(introSwitch).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "Play demo video" }).click();
  const video = page.locator("video.player-video");
  await expect(video).toHaveAttribute("src", "/clips/demo-sintel-trailer.mp4");

  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect.poll(() => currentTime(page), { timeout: 15_000 }).toBeGreaterThan(1);
  await expect(page.locator(".error-container")).toHaveCount(0);

  const state = await video.evaluate((v: HTMLVideoElement) => ({
    paused: v.paused,
    error: v.error?.code ?? null,
    duration: v.duration,
    width: v.videoWidth,
  }));
  expect(state.paused).toBe(false);
  expect(state.error).toBeNull();
  expect(state.duration).toBeGreaterThan(10);
  expect(state.width).toBeGreaterThan(0);

  expect(errors).toEqual([]);
});

test("demo clip with the intro plays the bundled ta-dum first", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  const errors = trackErrors(page);
  await openSourceView(page, extensionId);
  await requireClip(page, "/clips/netflix-roll.mp4");

  await page.getByRole("button", { name: "Play demo video" }).click();
  const video = page.locator("video.player-video");
  await expect(video).toHaveAttribute("src", "/clips/netflix-roll.mp4");

  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect.poll(() => currentTime(page), { timeout: 15_000 }).toBeGreaterThan(0.5);
  await expect(page.locator(".error-container")).toHaveCount(0);
  expect(errors).toEqual([]);
});
