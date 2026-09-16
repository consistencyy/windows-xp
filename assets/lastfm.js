/* ════════════════════════════════════════════════════════════
   Last.fm "Recently played" panel for the Media Player.
   Reads window.LASTFM from playlist.js and fills every
   element with [data-lastfm] (desktop + mobile).
   ════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const cfg = window.LASTFM || {};
  const panels = Array.from(document.querySelectorAll("[data-lastfm]"));
  if (!cfg.user || !cfg.apiKey || !panels.length) return;

  const COUNT = Math.min(Math.max(parseInt(cfg.count, 10) || 4, 1), 10);
  const REFRESH_MS = 90 * 1000;
  // Last.fm serves this grey star when a track has no cover art
  const BLANK_ART = "2a96cbd8b46e442fc41c2b86b821562f";
  const profileUrl = "https://www.last.fm/user/" + encodeURIComponent(cfg.user);

  let timer = 0;

  const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  function ago(uts) {
    const s = Math.max(0, Date.now() / 1000 - Number(uts));
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    const d = Math.floor(s / 86400);
    return d === 1 ? "yesterday" : d + "d ago";
  }

  function artOf(t) {
    const imgs = t.image || [];
    const pick = (imgs.find((i) => i.size === "medium") || imgs[imgs.length - 1] || {})["#text"];
    return pick && !pick.includes(BLANK_ART) ? pick : "";
  }

  function rowHtml(t) {
    const live = t["@attr"] && t["@attr"].nowplaying === "true";
    const artist = (t.artist && (t.artist["#text"] || t.artist.name)) || "";
    const art = artOf(t);
    const when = live
      ? '<span class="lfm-live"><span class="lfm-eq"><i></i><i></i><i></i></span>Listening now</span>'
      : (t.date ? ago(t.date.uts) : "");
    return `
      <a class="lfm-row${live ? " is-live" : ""}" href="${esc(t.url)}" target="_blank" rel="noopener">
        ${art ? `<img class="lfm-art" src="${esc(art)}" alt="" loading="lazy">`
              : '<span class="lfm-art lfm-art--blank" aria-hidden="true">\u266A</span>'}
        <span class="lfm-text">
          <span class="lfm-title">${esc(t.name)}</span>
          <span class="lfm-artist">${esc(artist)}</span>
        </span>
        <span class="lfm-when">${when}</span>
      </a>`;
  }

  function render(tracks) {
    const html = tracks.length
      ? tracks.map(rowHtml).join("")
      : '<div class="lfm-msg">Nothing played yet.</div>';
    panels.forEach((p) => {
      p.hidden = false;
      const list = p.querySelector(".lfm-list");
      if (list) list.innerHTML = html;
      const link = p.querySelector(".lfm-profile");
      if (link) link.href = profileUrl;
    });
  }

  function showError() {
    panels.forEach((p) => {
      const list = p.querySelector(".lfm-list");
      // keep the last good list if we have one; otherwise stay hidden
      if (list && !list.children.length) p.hidden = true;
    });
  }

  async function load() {
    const url = "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks" +
      "&user=" + encodeURIComponent(cfg.user) +
      "&api_key=" + encodeURIComponent(cfg.apiKey) +
      "&limit=" + COUNT + "&format=json";
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.error || !data.recenttracks) throw new Error(data.message || "Bad response");
      let tracks = data.recenttracks.track || [];
      if (!Array.isArray(tracks)) tracks = [tracks];
      tracks = tracks.slice(0, COUNT); // "now playing" can add one extra
      render(tracks); // re-rendering also refreshes the "5m ago" labels
    } catch (e) {
      console.warn("Last.fm:", e.message);
      showError();
    }
  }

  function tick() {
    clearTimeout(timer);
    if (document.visibilityState === "visible") load();
    timer = setTimeout(tick, REFRESH_MS);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });

  tick();
})();
