// This function will be injected into the page to find a video source
function findFirstVideoSource() {
  const video = document.querySelector("video");
  // Ensure the src is an absolute URL
  if (video && video.src) {
    return new URL(video.src, document.baseURI).href;
  }
  return null;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "play-with-streamline-netflix",
    title: "Play with Streamline Player (Netflix)",
    contexts: ["video", "link", "page"],
  });
  chrome.contextMenus.create({
    id: "play-with-streamline-insta",
    title: "Play with Streamline Player (Reels)",
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
  if (fallbackUrl && !src) {
    playerUrl.searchParams.set("pageUrl", fallbackUrl);
  }
  chrome.tabs.create({ url: playerUrl.href });
};

// Handle clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  // Open player with Netflix mode by default when clicking the icon
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
  if (info.menuItemId.startsWith("play-with-streamline-")) {
    const playerMode = info.menuItemId.includes("insta") ? "insta" : "netflix";

    const videoUrl = info.srcUrl || info.linkUrl;

    if (videoUrl) {
      openPlayerTab(videoUrl, playerMode);
    } else {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: findFirstVideoSource,
        },
        (injectionResults) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            openPlayerTab(null, playerMode, info.pageUrl); // Fallback on error
            return;
          }
          const firstVideoSrc =
            injectionResults &&
            injectionResults[0] &&
            injectionResults[0].result;
          if (firstVideoSrc) {
            openPlayerTab(firstVideoSrc, playerMode);
          } else {
            openPlayerTab(null, playerMode, info.pageUrl);
          }
        }
      );
    }
  }
});
