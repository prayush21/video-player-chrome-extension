import {
  test,
  expect,
  readWatchList,
  trackErrors,
} from "./extension";
import {
  X_MP4,
  X_POST_ID,
  X_POST_URL,
  X_QUOTED_ID,
  loadXApiData,
  routeX,
  routeYouTube,
} from "./sites";

test.describe("x.com content script", () => {
  test("injects the My List button into the post's action bar", async ({
    context,
  }) => {
    const page = await context.newPage();
    const errors = trackErrors(page);
    await routeX(page);
    await page.goto(X_POST_URL);

    const btn = page.locator("article [role='group'] .nlvp-save-btn.nlvp-x");
    await expect(btn).toHaveCount(1);
    await expect(btn).toHaveText("My List");
    await expect(btn).toHaveAttribute("aria-pressed", "false");
    await expect(btn).toHaveAttribute("title", "Save to My List");
    // Ids: the post's own permalink first, then the quoted post.
    await expect(btn).toHaveAttribute("data-ids", `${X_POST_ID},${X_QUOTED_ID}`);
    // content.css was injected too.
    await expect(btn).toHaveCSS("border-radius", "9999px");

    expect(errors).toEqual([]);
  });

  test("saves the MP4 that x-intercept.js captured from X's API", async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    await routeX(page);
    await page.goto(X_POST_URL);
    const btn = page.locator(".nlvp-save-btn");
    await expect(btn).toHaveText("My List");

    await loadXApiData(page);
    await btn.click();
    await expect(btn).toHaveText("In My List");
    await expect(btn).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#nlvp-toast")).toHaveText(
      "Saved to My List. Click the extension icon to watch.",
    );

    const list = await readWatchList(serviceWorker);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: X_POST_ID,
      platform: "x",
      author: "e2e_user",
      authorName: "E2E Fixture User",
      sourceUrl: X_POST_URL,
      text: "A fixture post with a video for the e2e smoke test",
      mp4: X_MP4, // highest-bitrate MP4 variant
      durationMs: 52000,
      candidateIds: [X_POST_ID, X_QUOTED_ID],
      watchedAt: null,
    });

    // Clicking again removes it.
    await btn.click();
    await expect(btn).toHaveText("My List");
    await expect(page.locator("#nlvp-toast")).toHaveText("Removed from My List.");
    expect(await readWatchList(serviceWorker)).toEqual([]);
  });
});

test.describe("youtube.com content script", () => {
  test("injects the My List button and saves the video", async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    const errors = trackErrors(page);
    await routeYouTube(page);
    await page.goto("https://www.youtube.com/watch?v=e2eFixture1");

    const btn = page.locator(
      "ytd-watch-metadata #top-level-buttons-computed .nlvp-save-btn.nlvp-youtube",
    );
    await expect(btn).toHaveCount(1);
    await expect(btn).toHaveText("My List");
    await expect(btn).toHaveAttribute("data-ids", "yt:e2eFixture1");

    await btn.click();
    await expect(btn).toHaveText("In My List");
    await expect(page.locator("#nlvp-toast")).toContainText("Saved to My List");

    const list = await readWatchList(serviceWorker);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: "yt:e2eFixture1",
      platform: "youtube",
      youtubeId: "e2eFixture1",
      sourceUrl: "https://www.youtube.com/watch?v=e2eFixture1",
      title: "E2E Fixture Video Title",
      author: "E2E Fixture Channel",
      poster: "https://i.ytimg.com/vi/e2eFixture1/hqdefault.jpg",
    });

    // YouTube is a single-page app: the same metadata element is reused for
    // the next video, and the button must follow the new id.
    await page.evaluate(() => {
      history.pushState({}, "", "/watch?v=e2eFixture2");
      window.dispatchEvent(new Event("yt-navigate-finish"));
    });
    await expect(btn).toHaveAttribute("data-ids", "yt:e2eFixture2");
    await expect(btn).toHaveText("My List");
    await expect(page.locator(".nlvp-save-btn")).toHaveCount(1);

    expect(errors).toEqual([]);
  });
});
