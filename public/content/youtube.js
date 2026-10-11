// youtube.com adapter. Saves the video id and details only: YouTube streams
// can't be played outside YouTube, so My List plays them through YouTube's
// embedded player.
(() => {
  if (window.__nlvpYouTubeInstalled) return;
  window.__nlvpYouTubeInstalled = true;

  const { textOf } = window.NLVP;

  const currentVideoId = () =>
    location.pathname === "/watch"
      ? new URLSearchParams(location.search).get("v")
      : null;

  const durationMs = () => {
    const player = document.querySelector("#movie_player");
    const video = player?.querySelector("video");
    // While an ad plays, the <video> holds the ad, not the real video.
    if (!video || player.classList.contains("ad-showing")) return null;
    return Number.isFinite(video.duration)
      ? Math.round(video.duration * 1000)
      : null;
  };

  window.NLVP.register({
    platform: "youtube",
    findPosts: () =>
      currentVideoId() ? [...document.querySelectorAll("ytd-watch-metadata")] : [],
    getIds: () => [currentVideoId() && `yt:${currentVideoId()}`],
    mount: (meta, btn) => {
      const bar = meta.querySelector("#top-level-buttons-computed");
      if (!bar) return false;
      bar.appendChild(btn);
      return true;
    },
    buildItem: (meta) => {
      const id = currentVideoId();
      if (!id) return null;
      const channel = textOf(meta.querySelector("ytd-channel-name a"));
      return {
        id: `yt:${id}`,
        youtubeId: id,
        sourceUrl: `https://www.youtube.com/watch?v=${id}`,
        title: textOf(meta.querySelector("h1")) || null,
        author: channel,
        authorName: channel,
        poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        durationMs: durationMs(),
      };
    },
  });
})();
