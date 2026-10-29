// x.com / twitter.com adapter. Video MP4 URLs come from X's own API
// responses, captured by x-intercept.js (page world) and posted here.
(() => {
  if (window.__nlvpXInstalled) return;
  window.__nlvpXInstalled = true;

  const { textOf } = window.NLVP;

  // statusId -> array of media found in X's API responses (see x-intercept.js)
  const mediaByStatus = new Map();

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
    const text = textOf(article.querySelector("[data-testid='tweetText']"));
    const nameEl = article.querySelector("[data-testid='User-Name'] span");

    return {
      id: statusId,
      sourceUrl: `https://x.com/${handle}/status/${statusId}`,
      author: handle,
      authorName: textOf(nameEl) || handle,
      text,
      poster: resolved?.media.poster || poster,
      mp4: resolved?.media.mp4 || null,
      durationMs: resolved?.media.durationMs || null,
      aspectRatio: resolved?.media.aspectRatio || null,
      // Other status IDs in the post (e.g. a quoted post) the video may belong to.
      candidateIds: links.map((l) => l.id),
    };
  };

  window.NLVP.register({
    platform: "x",
    findPosts: () =>
      [...document.querySelectorAll("article[data-testid='tweet']")].filter(
        hasVideo,
      ),
    getIds: (article) => statusLinks(article).map((l) => l.id),
    mount: (article, btn) => {
      // The action bar is the group holding the bookmark button; fall back to
      // the last group in case X renames it.
      const bar =
        article
          .querySelector("[data-testid='bookmark'], [data-testid='removeBookmark']")
          ?.closest("[role='group']") ||
        [...article.querySelectorAll("[role='group']")].pop();
      if (!bar) return false;
      bar.appendChild(btn);
      return true;
    },
    buildItem,
  });
})();
