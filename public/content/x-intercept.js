// Runs in the page's own JS world on x.com / twitter.com (manifest "world": "MAIN").
//
// X plays videos through Media Source Extensions, so the <video> element only
// ever has a blob: URL that can't be opened anywhere else. The real MP4 URLs
// arrive in X's own API responses (video_info.variants). This script watches
// those responses as the timeline loads and forwards any video media it sees to
// the content script (x-content.js) via window.postMessage. No extra requests.
(() => {
  if (window.__nlvpInterceptInstalled) return;
  window.__nlvpInterceptInstalled = true;

  const API_PATTERN = /\/(i\/api\/)?graphql\/|\/i\/api\/|api\.(x|twitter)\.com/;

  const pickBestMp4 = (variants) => {
    const mp4s = (variants || []).filter(
      (v) => v && v.url && (v.content_type || "").includes("mp4"),
    );
    if (!mp4s.length) return null;
    mp4s.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    return mp4s[0].url;
  };

  const statusIdFrom = (url) => {
    const m = /\/status(?:es)?\/(\d+)/.exec(url || "");
    return m ? m[1] : null;
  };

  // Walk any JSON payload and collect media objects that carry video_info.
  const collect = (root) => {
    const found = [];
    const stack = [root];
    let guard = 0;
    while (stack.length && guard++ < 200000) {
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;
      if (Array.isArray(node)) {
        for (const child of node) stack.push(child);
        continue;
      }
      if (node.video_info && Array.isArray(node.video_info.variants)) {
        const mp4 = pickBestMp4(node.video_info.variants);
        const statusId = statusIdFrom(node.expanded_url);
        if (mp4 && statusId) {
          found.push({
            statusId,
            mediaKey: node.media_key || null,
            mp4,
            poster: node.media_url_https || null,
            durationMs: node.video_info.duration_millis || null,
            aspectRatio: node.video_info.aspect_ratio || null,
          });
        }
      }
      for (const key in node) {
        const value = node[key];
        if (value && typeof value === "object") stack.push(value);
      }
    }
    return found;
  };

  const handleText = (text) => {
    if (!text || text.indexOf("video_info") === -1) return;
    try {
      const media = collect(JSON.parse(text));
      if (media.length) {
        window.postMessage(
          { source: "nlvp-intercept", media },
          location.origin,
        );
      }
    } catch {
      // Not JSON, ignore.
    }
  };

  // XMLHttpRequest
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    try {
      if (API_PATTERN.test(String(url))) {
        this.addEventListener("load", () => {
          try {
            if (this.responseType === "" || this.responseType === "text") {
              handleText(this.responseText);
            } else if (this.responseType === "json" && this.response) {
              handleText(JSON.stringify(this.response));
            }
          } catch {
            // ignore
          }
        });
      }
    } catch {
      // ignore
    }
    return origOpen.call(this, method, url, ...rest);
  };

  // fetch
  const origFetch = window.fetch;
  window.fetch = function (input, init) {
    const promise = origFetch.call(this, input, init);
    try {
      const url = typeof input === "string" ? input : input && input.url;
      if (API_PATTERN.test(String(url))) {
        promise
          .then((res) => res.clone().text())
          .then(handleText)
          .catch(() => {});
      }
    } catch {
      // ignore
    }
    return promise;
  };
})();
