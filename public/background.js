// This function will be injected into the page to find a video source
function findFirstVideoSource() {
  // Skip blob: sources (X, YouTube, etc. stream through MediaSource); a blob URL
  // can't be opened from another page, so the player would just show an error.
  for (const video of document.querySelectorAll("video")) {
    const src = video.currentSrc || video.src;
    if (src && !src.startsWith("blob:")) {
      return new URL(src, document.baseURI).href;
    }
  }
  return null;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "play-with-streamline",
    title: "Play with Streamline Player",
    contexts: ["video", "link", "page"],
  });
});

// Helper function to open player in new tab
const openPlayerTab = (src, mode, fallbackUrl = "") => {
  const playerUrl = new URL(chrome.runtime.getURL("index.html"));
  if (src) {
    playerUrl.searchParams.set("src", src);
  }
  playerUrl.searchParams.set("mode", mode);
  if (fallbackUrl && !src && !isXUrl(fallbackUrl)) {
    playerUrl.searchParams.set("pageUrl", fallbackUrl);
  }
  chrome.tabs.create({ url: playerUrl.href });
};

// Handle clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: findFirstVideoSource,
    },
    (injectionResults) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        openPlayerTab(null, "netflix", tab.url); // Fallback on error
        return;
      }
      const firstVideoSrc =
        injectionResults && injectionResults[0] && injectionResults[0].result;
      if (firstVideoSrc) {
        openPlayerTab(firstVideoSrc, "netflix");
      } else {
        openPlayerTab(null, "netflix", tab.url);
      }
    }
  );
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "play-with-streamline") {
    const videoUrl = info.srcUrl || info.linkUrl;

    if (videoUrl) {
      openPlayerTab(videoUrl, "netflix");
    } else {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: findFirstVideoSource,
        },
        (injectionResults) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            openPlayerTab(null, "netflix", info.pageUrl); // Fallback on error
            return;
          }
          const firstVideoSrc =
            injectionResults &&
            injectionResults[0] &&
            injectionResults[0].result;
          if (firstVideoSrc) {
            openPlayerTab(firstVideoSrc, "netflix");
          } else {
            openPlayerTab(null, "netflix", info.pageUrl);
          }
        }
      );
    }
  }
});

// ---------------------------------------------------------------------------
// Watch List: videos saved from X (see x-content.js). Stored in
// chrome.storage.local under "watchlist", newest first.
// ---------------------------------------------------------------------------

const WATCHLIST_KEY = "watchlist";

function isXUrl(url) {
  try {
    const host = new URL(url).hostname;
    return /(^|\.)(x|twitter)\.com$/.test(host);
  } catch {
    return false;
  }
}

async function getWatchList() {
  const result = await chrome.storage.local.get(WATCHLIST_KEY);
  return result[WATCHLIST_KEY] || [];
}

async function setWatchList(list) {
  await chrome.storage.local.set({ [WATCHLIST_KEY]: list });
}

function pickBestMp4(variants) {
  const mp4s = (variants || [])
    .map((v) => ({
      url: v.url || v.src,
      type: v.content_type || v.type || "",
      bitrate: v.bitrate || 0,
    }))
    .filter((v) => v.url && v.type.includes("mp4"));
  mp4s.sort((a, b) => b.bitrate - a.bitrate);
  return mp4s[0] ? mp4s[0].url : null;
}

// Same token scheme X's embed widget uses for the public syndication endpoint.
function syndicationToken(id) {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");
}

function videoFromTweetJson(tweet) {
  if (!tweet) return null;
  const media = (tweet.mediaDetails || []).find(
    (m) => m.video_info && m.video_info.variants,
  );
  if (!media) return null;
  const mp4 = pickBestMp4(media.video_info.variants);
  if (!mp4) return null;
  return {
    id: tweet.id_str,
    author: tweet.user && tweet.user.screen_name,
    authorName: tweet.user && tweet.user.name,
    text: tweet.text,
    mp4,
    poster: media.media_url_https,
    durationMs: media.video_info.duration_millis || null,
    aspectRatio: media.video_info.aspect_ratio || null,
  };
}

// Fallback for when the page script didn't see the API response for a post
// (e.g. saved before the timeline finished loading). Checks the post itself,
// then any quoted post.
async function resolveFromSyndication(id) {
  const url = `https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${syndicationToken(id)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`syndication ${res.status}`);
  const tweet = await res.json();
  return videoFromTweetJson(tweet) || videoFromTweetJson(tweet.quoted_tweet);
}

async function resolveItem(item) {
  const ids = [item.id, ...(item.candidateIds || [])].filter(
    (id, i, arr) => id && arr.indexOf(id) === i,
  );
  for (const id of ids) {
    try {
      const found = await resolveFromSyndication(id);
      if (found) {
        return {
          ...item,
          mp4: found.mp4,
          poster: item.poster || found.poster,
          durationMs: item.durationMs || found.durationMs,
          aspectRatio: item.aspectRatio || found.aspectRatio,
          text: item.text || found.text,
          resolveError: null,
        };
      }
    } catch (err) {
      console.warn("Watch List: could not resolve", id, err);
    }
  }
  return { ...item, resolveError: "Couldn't find a playable file for this post." };
}

async function updateItem(id, patch) {
  const list = await getWatchList();
  const next = list.map((i) => (i.id === id ? { ...i, ...patch } : i));
  await setWatchList(next);
  return next.find((i) => i.id === id);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message.type === "nlvp:toggle") {
      const item = message.item;
      const list = await getWatchList();
      const ids = new Set([item.id, ...(item.candidateIds || [])]);
      if (list.some((i) => ids.has(i.id))) {
        await setWatchList(list.filter((i) => !ids.has(i.id)));
        return { saved: false };
      }
      const entry = { ...item, savedAt: Date.now(), watchedAt: null };
      await setWatchList([entry, ...list]);
      // Resolve the MP4 in the background if the page didn't hand us one.
      if (!entry.mp4) {
        resolveItem(entry).then((resolved) => updateItem(entry.id, resolved));
      }
      return { saved: true };
    }

    if (message.type === "nlvp:resolve") {
      const list = await getWatchList();
      const item = list.find((i) => i.id === message.id);
      if (!item) return { item: null };
      const resolved = await resolveItem(item);
      return { item: await updateItem(item.id, resolved) };
    }

    return undefined;
  })().then(sendResponse, (err) => sendResponse({ error: String(err) }));
  return true; // keep the channel open for the async response
});
