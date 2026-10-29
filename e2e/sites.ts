import type { Page } from "@playwright/test";
import { expect, fixture } from "./extension";

// Content scripts run on fixture pages served at the real x.com / youtube.com
// URLs via page.route, so the manifest's match patterns are exercised too.
// No request reaches the real sites (see the catch-all route in extension.ts).

export const X_POST_URL = "https://x.com/e2e_user/status/1850000000000000001";
export const X_POST_ID = "1850000000000000001";
export const X_QUOTED_ID = "1840000000000000002";
export const X_MP4 =
  "https://video.twimg.com/amplify_video/1850000000000000999/vid/1280x720/high.mp4";

export async function routeX(page: Page) {
  await page.route("https://x.com/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/i/api/")) {
      return route.fulfill({
        contentType: "application/json",
        body: fixture("x-tweet-detail.json"),
      });
    }
    if (url.pathname.includes("/status/")) {
      return route.fulfill({ contentType: "text/html", body: fixture("x-status.html") });
    }
    return route.fulfill({ status: 404, body: "" });
  });
}

export async function routeYouTube(page: Page) {
  await page.route("https://www.youtube.com/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/watch") {
      return route.fulfill({
        contentType: "text/html",
        body: fixture("youtube-watch.html"),
      });
    }
    return route.fulfill({ status: 404, body: "" });
  });
}

/** Has X's page load its API data, as the real timeline does; x-intercept.js sees it. */
export async function loadXApiData(page: Page) {
  await page.evaluate(() =>
    fetch("/i/api/graphql/e2e/TweetDetail?variables=%7B%7D").then((r) => r.text()),
  );
  await expect(page.locator("body")).toHaveAttribute("data-intercepted", "1");
}
