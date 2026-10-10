// Content script for x.com / twitter.com.
// Adds a "My List" button to every post that has a video. Clicking it saves the
// video to the extension's Watch List (chrome.storage.local); clicking again removes it.
(() => {
  if (window.__nlvpContentInstalled) return;
  window.__nlvpContentInstalled = true;

  const STORAGE_KEY = "watchlist";
  const BTN_CLASS = "nlvp-save-btn";

  // statusId -> array of media found in X's API responses (see x-intercept.js)
  const mediaByStatus = new Map();
  let savedIds = new Set();

  window.addEventListener("message", (event) => {
    // Only accept messages posted by this same page (x-intercept.js).
    if (event.origin !== location.origin || !event.data) return;
    if (event.source && event.source !== window) return;
    if (event.data.source !== "nlvp-intercept") return;
    for (const m of event.data.media || []) {
      const list = mediaByStatus.get(m.statusId) || [];
      if (!list.some((x) => x.mp4 === m.mp4)) list.push(m);
      mediaByStatus.set(m.statusId, list);
    }
  });

  // ---------- helpers ----------

  const textOf = (el) => (el ? el.innerText || el.textContent || "" : "");

  const STATUS_RE = /^\/([^/]+)\/status\/(\d+)/;

  const statusLinks = (article) => {
    const seen = new Set();
    const out = [];
    // The permalink wrapping <time> is the post's own link; put it first.
    const timeLink = article
      .querySelector("a[href*='/status/'] time")
      ?.closest("a");
    const anchors = [
      timeLink,
      ...article.querySelectorAll("a[href*='/status/']"),
    ];
    for (const a of anchors) {
      if (!a) continue;
      const m = STATUS_RE.exec(new URL(a.href, location.origin).pathname);
      if (!m || seen.has(m[2])) continue;
      seen.add(m[2]);
      out.push({ handle: m[1], id: m[2] });
    }
    return out;
  };

  const findVideo = (article) =>
    article.querySelector(
      "[data-testid='videoPlayer'] video, [data-testid='videoComponent'] video, video",
    );

  const hasVideo = (article) =>
    !!article.querySelector(
      "[data-testid='videoPlayer'], [data-testid='videoComponent'], video",
    );

  const posterKey = (url) => {
    // pbs.twimg.com/amplify_video_thumb/<id>/img/<name>.jpg -> "<id>"
    const m =
      /_thumb\/(\d+)\//.exec(url || "") || /\/media\/([^.?]+)/.exec(url || "");
    return m ? m[1] : null;
  };

  const resolveMedia = (links, poster) => {
    const key = posterKey(poster);
    for (const { id } of links) {
      const list = mediaByStatus.get(id);
      if (!list || !list.length) continue;
      const byPoster = key && list.find((m) => posterKey(m.poster) === key);
      return { statusId: id, media: byPoster || list[0] };
    }
    return null;
  };

  const buildItem = (article) => {
    const links = statusLinks(article);
    if (!links.length) return null;
    const main = links[0];
    const video = findVideo(article);
    const poster =
      video?.poster ||
      article.querySelector("[data-testid='videoPlayer'] img")?.src ||
      null;
    const resolved = resolveMedia(links, poster);
    const statusId = resolved?.statusId || main.id;
    const handle = links.find((l) => l.id === statusId)?.handle || main.handle;
    const text = (
      textOf(article.querySelector("[data-testid='tweetText']")) || ""
    ).trim();
    const nameEl = article.querySelector("[data-testid='User-Name'] span");

    return {
      id: statusId,
      tweetUrl: `https://x.com/${handle}/status/${statusId}`,
      author: handle,
      authorName: textOf(nameEl).trim() || handle,
      text,
      poster: resolved?.media.poster || poster,
      mp4: resolved?.media.mp4 || null,
      durationMs: resolved?.media.durationMs || null,
      aspectRatio: resolved?.media.aspectRatio || null,
      // Other status IDs in the post (e.g. a quoted post) the video may belong to.
      candidateIds: links.map((l) => l.id),
    };
  };

  // ---------- UI ----------

  const ICON_ADD =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h11v2H4zm0 4h11v2H4zm0 4h7v2H4zm13-1v-3h2v3h3v2h-3v3h-2v-3h-3v-2z"/></svg>';
  const ICON_SAVED =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h11v2H4zm0 4h11v2H4zm0 4h7v2H4zm10.6 1.2 1.4-1.4 2 2 4-4 1.4 1.4-5.4 5.4z"/></svg>';

  const paint = (btn, saved) => {
    btn.innerHTML = `${saved ? ICON_SAVED : ICON_ADD}<span>${saved ? "In My List" : "My List"}</span>`;
    btn.classList.toggle("is-saved", saved);
    btn.setAttribute("aria-pressed", String(saved));
    btn.title = saved ? "Remove from Watch List" : "Save to Watch List";
  };

  let toastTimer = null;
  const toast = (msg) => {
    let el = document.getElementById("nlvp-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "nlvp-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  };

  const onClick = async (event, article, btn) => {
    event.preventDefault();
    event.stopPropagation();
    const item = buildItem(article);
    if (!item) return toast("Couldn't read this post.");
    btn.disabled = true;
    try {
      const res = await chrome.runtime.sendMessage({
        type: "nlvp:toggle",
        item,
      });
      if (res?.saved)
        toast("Saved to My List. Click the extension icon to watch.");
      else if (res && !res.saved) toast("Removed from My List.");
    } catch {
      toast("Extension was updated. Refresh the page to keep saving.");
    } finally {
      btn.disabled = false;
    }
  };

  const decorate = (article) => {
    if (article.querySelector(`.${BTN_CLASS}`)) return;
    if (!hasVideo(article)) return;
    const bar = [...article.querySelectorAll("[role='group']")].pop();
    if (!bar) return;
    const links = statusLinks(article);
    if (!links.length) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = BTN_CLASS;
    btn.dataset.ids = links.map((l) => l.id).join(",");
    paint(
      btn,
      links.some((l) => savedIds.has(l.id)),
    );
    btn.addEventListener("click", (e) => onClick(e, article, btn));
    bar.appendChild(btn);
  };

  const repaintAll = () => {
    for (const btn of document.querySelectorAll(`.${BTN_CLASS}`)) {
      const ids = (btn.dataset.ids || "").split(",");
      paint(
        btn,
        ids.some((id) => savedIds.has(id)),
      );
    }
  };

  let scheduled = false;
  const scan = () => {
    scheduled = false;
    for (const article of document.querySelectorAll(
      "article[data-testid='tweet']",
    )) {
      decorate(article);
    }
  };
  const scheduleScan = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(scan);
  };

  // ---------- boot ----------

  const loadSaved = (list) => {
    savedIds = new Set((list || []).map((i) => i.id));
    repaintAll();
  };

  chrome.storage.local.get(STORAGE_KEY).then((r) => loadSaved(r[STORAGE_KEY]));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[STORAGE_KEY])
      loadSaved(changes[STORAGE_KEY].newValue);
  });

  new MutationObserver(scheduleScan).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  scheduleScan();
})();
