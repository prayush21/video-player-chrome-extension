import {
  test,
  expect,
  playerUrl,
  readWatchList,
  trackErrors,
} from "./extension";
import {
  X_POST_ID,
  X_POST_URL,
  loadXApiData,
  routeX,
} from "./sites";

const TITLE = "A fixture post with a video for the e2e smoke test";

test("a saved video persists in chrome.storage and survives reloads", async ({
  context,
  serviceWorker,
  extensionId,
}) => {
  // Save from the X fixture page, the way a user does.
  const xPage = await context.newPage();
  await routeX(xPage);
  await xPage.goto(X_POST_URL);
  const btn = xPage.locator(".nlvp-save-btn");
  await expect(btn).toHaveText("My List");
  await loadXApiData(xPage);
  await btn.click();
  await expect(btn).toHaveText("In My List");

  expect((await readWatchList(serviceWorker)).map((i) => i.id)).toEqual([
    X_POST_ID,
  ]);

  // The content script reads the saved state back from storage after a reload.
  await xPage.reload();
  await expect(xPage.locator(".nlvp-save-btn")).toHaveText("In My List");

  // The player page shows it in My List...
  const page = await context.newPage();
  const errors = trackErrors(page);
  await page.goto(playerUrl(extensionId));
  await expect(page.getByText("1 saved video, waiting patiently.")).toBeVisible();
  await page.getByRole("button", { name: /The Curator/ }).click();
  const card = page.locator(".wl-card").filter({ hasText: TITLE });
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("@e2e_user");

  // ...and still does after a reload (the profile choice lasts for the tab).
  await page.reload();
  await expect(page.locator(".wl-card").filter({ hasText: TITLE })).toHaveCount(1);
  expect((await readWatchList(serviceWorker)).map((i) => i.id)).toEqual([
    X_POST_ID,
  ]);

  // Removing it from My List clears storage and the button on the X page.
  await page
    .locator(".wl-card")
    .filter({ hasText: TITLE })
    .getByRole("button", { name: "Remove from My List" })
    .click({ force: true }); // the remove button only shows on hover
  await expect.poll(() => readWatchList(serviceWorker)).toEqual([]);
  await expect(xPage.locator(".nlvp-save-btn")).toHaveText("My List");

  expect(errors).toEqual([]);
});
