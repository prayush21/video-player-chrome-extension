// Shared runtime for the "My List" button on every supported site.
//
// Each platform script (content/x.js, content/youtube.js, ...) registers an
// adapter; this file does the rest: finding posts as the page changes,
// drawing the button, keeping it in sync with the saved list, toggling saves
// through background.js, and showing a toast.
//
// Adapter shape:
//   platform     "x" | "youtube"
//   findPosts()  -> Element[]  containers that may hold a video
//   getIds(post) -> string[]   ids that count as "this post is saved"
//                              (first one is the post's own id)
//   mount(post, button) -> boolean  insert the button; false = not ready yet
//   buildItem(post) -> item | null | Promise  what gets saved
(() => {
  if (window.NLVP) return;

  const STORAGE_KEY = "watchlist";
  const BTN_CLASS = "nlvp-save-btn";

  // Built with DOM calls, not innerHTML: YouTube enforces Trusted Types.
  const SVG_NS = "http://www.w3.org/2000/svg";
  const ICON_PATHS = {
    add: "M4 6h11v2H4zm0 4h11v2H4zm0 4h7v2H4zm13-1v-3h2v3h3v2h-3v3h-2v-3h-3v-2z",
    saved:
      "M4 6h11v2H4zm0 4h11v2H4zm0 4h7v2H4zm10.6 1.2 1.4-1.4 2 2 4-4 1.4 1.4-5.4 5.4z",
  };
  const icon = (name) => {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", ICON_PATHS[name]);
    svg.appendChild(path);
    return svg;
  };

  let savedIds = new Set();
  const adapters = [];

  const textOf = (el) =>
    (el ? el.innerText || el.textContent || "" : "").trim();

  const paint = (btn, saved) => {
    const label = document.createElement("span");
    label.textContent = saved ? "In My List" : "My List";
    btn.replaceChildren(icon(saved ? "saved" : "add"), label);
    btn.classList.toggle("is-saved", saved);
    btn.setAttribute("aria-pressed", String(saved));
    btn.title = saved ? "Remove from My List" : "Save to My List";
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

  const onClick = async (event, adapter, post, btn) => {
    event.preventDefault();
    event.stopPropagation();
    btn.disabled = true;
    try {
      const item = await adapter.buildItem(post);
      if (!item) return toast("Couldn't read this video.");
      const res = await chrome.runtime.sendMessage({
        type: "nlvp:toggle",
        item: { platform: adapter.platform, ...item },
      });
      if (!res) throw new Error("No response from the extension.");
      if (res.error) throw new Error(res.error);
      if (res.saved)
        toast("Saved to My List. Click the extension icon to watch.");
      else toast("Removed from My List.");
    } catch (err) {
      console.warn("My List:", err);
      const msg = String(err && err.message ? err.message : err);
      toast(
        /context invalidated|receiving end/i.test(msg)
          ? "Extension was updated. Refresh the page to keep saving."
          : `Couldn't save: ${msg}`,
      );
    } finally {
      btn.disabled = false;
    }
  };

  // Buttons remember their post's ids; single-page apps (YouTube) reuse the
  // same DOM for the next video, so ids are refreshed on every scan.
  const decorate = (adapter, post) => {
    const ids = adapter.getIds(post).filter(Boolean);
    let btn = post.querySelector(`.${BTN_CLASS}`) || post.__nlvpBtn;
    if (!ids.length) return;
    if (!btn || !btn.isConnected) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = `${BTN_CLASS} nlvp-${adapter.platform}`;
      btn.addEventListener("click", (e) => onClick(e, adapter, post, btn));
      if (!adapter.mount(post, btn)) return;
      post.__nlvpBtn = btn;
    }
    const key = ids.join(",");
    if (btn.dataset.ids !== key || !btn.firstChild) {
      btn.dataset.ids = key;
      paint(
        btn,
        ids.some((id) => savedIds.has(id)),
      );
    }
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
    for (const adapter of adapters) {
      for (const post of adapter.findPosts()) {
        try {
          decorate(adapter, post);
        } catch (err) {
          console.warn(`My List (${adapter.platform}):`, err);
        }
      }
    }
  };
  const scheduleScan = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(scan);
  };

  const loadSaved = (list) => {
    savedIds = new Set();
    for (const item of list || []) {
      savedIds.add(item.id);
      (item.candidateIds || []).forEach((id) => savedIds.add(id));
    }
    repaintAll();
  };

  let booted = false;
  const boot = () => {
    if (booted) return;
    booted = true;
    chrome.storage.local
      .get(STORAGE_KEY)
      .then((r) => loadSaved(r[STORAGE_KEY]));
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[STORAGE_KEY])
        loadSaved(changes[STORAGE_KEY].newValue);
    });
    new MutationObserver(scheduleScan).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    // Navigations inside single-page apps don't always add nodes.
    window.addEventListener("yt-navigate-finish", scheduleScan);
    window.addEventListener("popstate", scheduleScan);
  };

  window.NLVP = {
    textOf,
    toast,
    register(adapter) {
      adapters.push(adapter);
      boot();
      scheduleScan();
    },
  };
})();
