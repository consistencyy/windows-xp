/* ════════════════════════════════════════════════════════════
   XPTheater — fullscreen, Winamp/MilkDrop-style visualizer for the
   Media Player. Opened by the player's maximize button (desktop) or by
   tapping the artwork (mobile).

   Uses the audio analyser from XPViz (visualizer.js), so no second
   audio graph is created.

   Performance notes
   - Renders at a reduced internal resolution and lets the browser
     upscale; "Auto" quality adjusts that scale to hold ~60fps.
   - All per-frame buffers are preallocated; colors come from a
     256-entry lookup table built once per palette change.
   - Feedback effects use one reusable offscreen canvas.
   - The small in-window visualizer pauses while this is open.
   ════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const STORE_KEY = "xpTheater.v1";
  const TAU = Math.PI * 2;

  const PRESETS = [
    { id: "song",      name: "Per song" },
    { id: "spectrum",  name: "Spectrum" },
    { id: "tunnel",    name: "Tunnel" },
    { id: "warp",      name: "Warp" },
    { id: "plasma",    name: "Plasma Scope" },
    { id: "bloom",     name: "Kaleido Bloom" },
    { id: "ridge",     name: "Ridgeline" }
  ];

  const PALETTES = [
    { id: "art",    name: "From song", stops: null },
    { id: "winamp", name: "Winamp",    stops: ["#003300", "#00c000", "#a8ff00", "#ffe600", "#ff3000"] },
    { id: "luna",   name: "Luna",      stops: ["#001a66", "#0058ee", "#3a93ff", "#8fd14f", "#ffffff"] },
    { id: "neon",   name: "Neon",      stops: ["#14003a", "#6a00ff", "#ff00c8", "#00f0ff", "#ffffff"] },
    { id: "ember",  name: "Ember",     stops: ["#1a0000", "#a01000", "#ff4a00", "#ffb000", "#fff4c0"] },
    { id: "ice",    name: "Ice",       stops: ["#000a20", "#0040a0", "#00a0ff", "#9ff0ff", "#ffffff"] },
    { id: "mono",   name: "Mono",      stops: ["#0a0a0a", "#5a5a5a", "#c8c8c8", "#ffffff"] }
  ];

  const QUALITY = {
    low:  { scale: 0.5,  stars: 350,  bands: 40, rows: 28, cols: 64 },
    med:  { scale: 0.75, stars: 700,  bands: 64, rows: 40, cols: 96 },
    high: { scale: 1.0,  stars: 1100, bands: 96, rows: 56, cols: 128 }
  };

  const reducedMotion = !!(window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const DEFAULTS = {
    preset: "song",
    palette: "art",
    gain: 1.2,
    trails: 0.6,
    speed: 1,
    crt: true,
    video: true,
    videoLevel: 0.45,
    flash: !reducedMotion,
    mirror: false,
    cycle: false,
    quality: "auto",
    fps: false
  };

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      return Object.assign({}, DEFAULTS, saved);
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }
  function saveSettings(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
    // let the small screens pick up the change right away
    document.dispatchEvent(new CustomEvent("xpt:settings"));
  }

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const fmtTime = (s) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    return m + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  };

  /* ── Color lookup tables ─────────────────────────────── */
  const lutCanvas = document.createElement("canvas");
  lutCanvas.width = 256; lutCanvas.height = 1;
  const lutCtx = lutCanvas.getContext("2d", { willReadFrequently: true });

  function buildLut(stops) {
    const gr = lutCtx.createLinearGradient(0, 0, 256, 0);
    stops.forEach((c, i) => {
      try { gr.addColorStop(i / (stops.length - 1), c); } catch (e) { gr.addColorStop(i / (stops.length - 1), "#4a9eff"); }
    });
    lutCtx.clearRect(0, 0, 256, 1);
    lutCtx.fillStyle = gr;
    lutCtx.fillRect(0, 0, 256, 1);
    const d = lutCtx.getImageData(0, 0, 256, 1).data;
    const css = new Array(256);
    const rgba = new Array(256);
    for (let i = 0; i < 256; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      css[i] = `rgb(${r},${g},${b})`;
      rgba[i] = `rgba(${r},${g},${b},`;
    }
    const at = (t) => css[clamp((t * 255) | 0, 0, 255)];
    const atA = (t, a) => rgba[clamp((t * 255) | 0, 0, 255)] + a + ")";
    return { css, at, atA, stops };
  }

  /* ════════════════════════════════════════════════════════════
     DOM
     ════════════════════════════════════════════════════════════ */
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function buildDom() {
    const root = el("div", "xpt");
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "Full screen visualizer");
    root.tabIndex = -1;

    root.innerHTML = `
      <div class="xpt-stage">
      <div class="xpt-art" aria-hidden="true">
        <img class="xpt-art-img" alt="">
        <video class="xpt-art-video" muted loop playsinline></video>
      </div>
      <canvas class="xpt-canvas" aria-hidden="true"></canvas>
      <div class="xpt-crt" aria-hidden="true"></div>
      <div class="xpt-toast" aria-live="polite"></div>
      <div class="xpt-fps" aria-hidden="true"></div>

      <div class="xpt-hud">
        <div class="xpt-top">
          <div class="xpt-lcd" aria-hidden="true">
            <span class="xpt-lcd-state">&#9632;</span>
            <span class="xpt-lcd-time">0:00</span>
            <div class="xpt-marquee"><span class="xpt-marquee-text"></span></div>
            <span class="xpt-lcd-preset"></span>
          </div>
          <div class="xpt-top-btns">
            <button type="button" class="xpt-winbtn xpt-settings-btn" aria-expanded="false" aria-controls="xpt-panel" title="Visualizer settings (S)">&#9881;</button>
            <button type="button" class="xpt-winbtn xpt-close" title="Exit full screen (Esc)">&#10005;</button>
          </div>
        </div>

        <aside class="xpt-panel" id="xpt-panel" hidden>
          <div class="xpt-panel-title">
            <span>Visualizer settings</span>
            <button type="button" class="xpt-winbtn xpt-panel-close" title="Close settings">&#10005;</button>
          </div>
          <div class="xpt-panel-body">
            <fieldset class="xpt-group">
              <legend>Preset</legend>
              <div class="xpt-presets" role="radiogroup" aria-label="Preset"></div>
            </fieldset>

            <fieldset class="xpt-group">
              <legend>Colors</legend>
              <div class="xpt-palettes" role="radiogroup" aria-label="Colors"></div>
            </fieldset>

            <fieldset class="xpt-group">
              <legend>Motion</legend>
              <label class="xpt-slider"><span>Sensitivity</span>
                <input type="range" data-key="gain" min="0.4" max="2.6" step="0.05"><output></output></label>
              <label class="xpt-slider"><span>Trails</span>
                <input type="range" data-key="trails" min="0" max="1" step="0.01"><output></output></label>
              <label class="xpt-slider"><span>Speed</span>
                <input type="range" data-key="speed" min="0.25" max="2" step="0.05"><output></output></label>
            </fieldset>

            <fieldset class="xpt-group xpt-checks">
              <legend>Effects</legend>
              <label><input type="checkbox" data-key="video"> Show music video</label>
              <label class="xpt-slider"><span>Video</span>
                <input type="range" data-key="videoLevel" min="0.1" max="1" step="0.01" aria-label="Music video brightness"><output></output></label>
              <label><input type="checkbox" data-key="crt"> CRT screen</label>
              <label><input type="checkbox" data-key="flash"> Flash on beat</label>
              <label><input type="checkbox" data-key="mirror"> Mirror</label>
              <label><input type="checkbox" data-key="cycle"> Change preset every 30s</label>
            </fieldset>

            <fieldset class="xpt-group">
              <legend>Performance</legend>
              <label class="xpt-select"><span>Quality</span>
                <select data-key="quality">
                  <option value="auto">Auto</option>
                  <option value="low">Low</option>
                  <option value="med">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label class="xpt-inline"><input type="checkbox" data-key="fps"> Show frame rate</label>
            </fieldset>

            <div class="xpt-keys">
              <div><kbd>Space</kbd> Play or pause</div>
              <div><kbd>&larr;</kbd><kbd>&rarr;</kbd> Previous or next song</div>
              <div><kbd>&uarr;</kbd><kbd>&darr;</kbd> Change preset</div>
              <div><kbd>C</kbd> Change colors</div>
              <div><kbd>H</kbd> Hide controls</div>
              <div><kbd>Esc</kbd> Exit</div>
            </div>
            <button type="button" class="xpt-reset">Restore defaults</button>
          </div>
        </aside>

        <div class="xpt-bar">
          <div class="xpt-bar-btns">
            <button type="button" class="mp-ctrl-btn xpt-prev" title="Previous (&larr;)"><span class="mp-icon-prev"></span></button>
            <button type="button" class="mp-ctrl-btn mp-play-btn xpt-play" title="Play / Pause (Space)">
              <span class="mp-play-icon">
                <span class="mp-play-shape"></span>
                <span class="mp-pause-bar mp-pause-bar-1"></span>
                <span class="mp-pause-bar mp-pause-bar-2"></span>
              </span>
            </button>
            <button type="button" class="mp-ctrl-btn xpt-next" title="Next (&rarr;)"><span class="mp-icon-next"></span></button>
          </div>
          <span class="mp-time xpt-cur">0:00</span>
          <div class="mp-seek-track xpt-seek" role="slider" aria-label="Seek" tabindex="0"
               aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <div class="mp-seek-fill xpt-seek-fill"></div>
          </div>
          <span class="mp-time xpt-dur">0:00</span>
          <label class="xpt-vol" title="Volume">
            <span aria-hidden="true">&#128264;</span>
            <input type="range" class="mp-vol-slider xpt-vol-input" min="0" max="1" step="0.01" aria-label="Volume">
          </label>
        </div>
      </div>
      </div>`;
    document.body.appendChild(root);
    return root;
  }

  /* ════════════════════════════════════════════════════════════
     THEATER
     ════════════════════════════════════════════════════════════ */
  let dom = null;          // root element, built on first open
  let q = {};              // cached element refs
  let opts = null;         // current player binding
  let settings = loadSettings();
  let open = false;
  let raf = 0;

  // render state
  let canvas = null, main = null;
  let W = 0, H = 0, cssW = 0, cssH = 0;
  let scale = 0.75, dpr = 1;
  let lastNow = 0, frameNo = 0;
  let presetStart = 0, cycleStart = 0;

  // perf
  let fpsAcc = 0, fpsFrames = 0, fpsShown = 0;
  let slowMs = 0, fastMs = 0;

  // ui idle
  let idleTimer = 0, hudHover = false, hudForcedHidden = false;
  let toastTimer = 0;

  function $(s) { return dom.querySelector(s); }

  function ensureDom() {
    if (dom) return;
    dom = buildDom();
    q = {
      stage: $(".xpt-stage"),
      canvas: $(".xpt-canvas"),
      art: $(".xpt-art"),
      artImg: $(".xpt-art-img"),
      artVid: $(".xpt-art-video"),
      crt: $(".xpt-crt"),
      toast: $(".xpt-toast"),
      fps: $(".xpt-fps"),
      hud: $(".xpt-hud"),
      lcdState: $(".xpt-lcd-state"),
      lcdTime: $(".xpt-lcd-time"),
      marquee: $(".xpt-marquee"),
      marqueeText: $(".xpt-marquee-text"),
      lcdPreset: $(".xpt-lcd-preset"),
      settingsBtn: $(".xpt-settings-btn"),
      close: $(".xpt-close"),
      panel: $(".xpt-panel"),
      panelClose: $(".xpt-panel-close"),
      presets: $(".xpt-presets"),
      palettes: $(".xpt-palettes"),
      reset: $(".xpt-reset"),
      prev: $(".xpt-prev"),
      play: $(".xpt-play"),
      next: $(".xpt-next"),
      cur: $(".xpt-cur"),
      dur: $(".xpt-dur"),
      seek: $(".xpt-seek"),
      seekFill: $(".xpt-seek-fill"),
      vol: $(".xpt-vol-input")
    };

    canvas = q.canvas;
    main = createRenderer(canvas, {
      tier,
      colors: () => opts && opts.viz && opts.viz.getColors()
    });

    // preset + palette buttons
    PRESETS.forEach((p, i) => {
      const b = el("button", "xpt-chip", `<span class="xpt-chip-key">${i + 1}</span>${p.name}`);
      b.type = "button";
      b.setAttribute("role", "radio");
      b.dataset.preset = p.id;
      b.onclick = () => setPreset(p.id);
      q.presets.appendChild(b);
    });
    PALETTES.forEach((p) => {
      const b = el("button", "xpt-swatch");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.dataset.palette = p.id;
      b.title = p.name;
      b.innerHTML = `<span class="xpt-swatch-chip"></span><span class="xpt-swatch-name">${p.name}</span>`;
      b.onclick = () => setPalette(p.id);
      q.palettes.appendChild(b);
    });

    // settings inputs
    dom.querySelectorAll("[data-key]").forEach((inp) => {
      const key = inp.dataset.key;
      const evt = inp.type === "range" ? "input" : "change";
      inp.addEventListener(evt, () => {
        settings[key] = inp.type === "checkbox" ? inp.checked
          : inp.type === "range" ? parseFloat(inp.value)
          : inp.value;
        saveSettings(settings);
        applySettings(key);
      });
    });

    q.reset.onclick = () => {
      settings = Object.assign({}, DEFAULTS);
      saveSettings(settings);
      syncControls();
      applySettings("*");
      toast("Defaults restored");
    };

    q.settingsBtn.onclick = () => togglePanel();
    q.panelClose.onclick = () => togglePanel(false);
    q.close.onclick = () => close();

    q.prev.onclick = () => opts && opts.prev && opts.prev();
    q.next.onclick = () => opts && opts.next && opts.next();
    q.play.onclick = () => opts && opts.toggle && opts.toggle();

    // seeking: click or drag, plus arrow keys when focused
    const seekTo = (clientX) => {
      const a = opts && opts.audio;
      if (!a || !a.duration) return;
      const r = q.seek.getBoundingClientRect();
      a.currentTime = clamp((clientX - r.left) / r.width, 0, 1) * a.duration;
    };
    q.seek.addEventListener("pointerdown", (e) => {
      q.seek.setPointerCapture(e.pointerId);
      seekTo(e.clientX);
      const move = (ev) => seekTo(ev.clientX);
      const up = () => {
        q.seek.removeEventListener("pointermove", move);
        q.seek.removeEventListener("pointerup", up);
        q.seek.removeEventListener("pointercancel", up);
      };
      q.seek.addEventListener("pointermove", move);
      q.seek.addEventListener("pointerup", up);
      q.seek.addEventListener("pointercancel", up);
    });
    q.seek.addEventListener("keydown", (e) => {
      const a = opts && opts.audio;
      if (!a || !a.duration) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        a.currentTime = clamp(a.currentTime + (e.key === "ArrowLeft" ? -5 : 5), 0, a.duration);
      }
    });

    q.vol.addEventListener("input", () => {
      if (!opts) return;
      opts.audio.volume = parseFloat(q.vol.value);
      if (opts.volumeInput) opts.volumeInput.value = q.vol.value;
    });

    // idle-hide controls
    q.hud.addEventListener("pointerenter", () => { hudHover = true; });
    q.hud.addEventListener("pointerleave", () => { hudHover = false; });
    ["pointermove", "pointerdown", "wheel"].forEach((ev) =>
      dom.addEventListener(ev, wake, { passive: true }));

    // tap the picture (not the controls) on touch screens to show/hide controls
    canvas.addEventListener("click", () => {
      if (dom.classList.contains("is-idle")) wake();
      else if (matchMedia("(hover: none)").matches) goIdle();
    });
    canvas.addEventListener("dblclick", () => close());

    // listen on document so shortcuts still work if focus drops to <body>
    document.addEventListener("keydown", (e) => { if (open) onKey(e); }, true);

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    window.addEventListener("resize", () => { if (open) resize(); });
  }

  /* ── Settings ─────────────────────────────────────────── */
  function syncControls() {
    dom.querySelectorAll("[data-key]").forEach((inp) => {
      const v = settings[inp.dataset.key];
      if (inp.type === "checkbox") inp.checked = !!v;
      else inp.value = v;
      const out = inp.parentElement.querySelector("output");
      if (out) out.textContent = formatSetting(inp.dataset.key, v);
    });
    q.presets.querySelectorAll(".xpt-chip").forEach((b) => {
      const on = b.dataset.preset === settings.preset;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-checked", on);
    });
    q.palettes.querySelectorAll(".xpt-swatch").forEach((b) => {
      const on = b.dataset.palette === settings.palette;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-checked", on);
      const pal = PALETTES.find((p) => p.id === b.dataset.palette);
      const stops = pal.stops || artStopsFrom(opts && opts.viz && opts.viz.getColors());
      b.querySelector(".xpt-swatch-chip").style.background =
        `linear-gradient(90deg, ${stops.slice(1).join(", ")})`;
    });
    updateLcdPreset();
  }

  function formatSetting(key, v) {
    if (key === "gain" || key === "speed") return Number(v).toFixed(2) + "×";
    if (key === "trails" || key === "videoLevel") return Math.round(v * 100) + "%";
    return "";
  }

  function applySettings(key) {
    syncControls();
    if (key === "crt" || key === "*") dom.classList.toggle("no-crt", !settings.crt);
    if (key === "video" || key === "*") { dom.classList.toggle("no-video", !settings.video); lastArt = null; updateArt(); }
    if (key === "videoLevel" || key === "*") q.stage.style.setProperty("--xpt-video", settings.videoLevel);
    if (key === "fps" || key === "*") q.fps.hidden = !settings.fps;
    if (key === "quality" || key === "*") { scale = startScale(); resize(); }
    if ((key === "palette" || key === "*") && main) main.invalidateLut();
    if (key === "cycle") cycleStart = performance.now();
  }

  function startScale() {
    return settings.quality === "auto" ? QUALITY.med.scale : (QUALITY[settings.quality] || QUALITY.med).scale;
  }
  function tier() {
    if (settings.quality !== "auto") return QUALITY[settings.quality] || QUALITY.med;
    return scale < 0.6 ? QUALITY.low : scale > 0.9 ? QUALITY.high : QUALITY.med;
  }

  function setPreset(id, announce = true) {
    if (!PRESETS.some((p) => p.id === id)) return;
    settings.preset = id;
    saveSettings(settings);
    presetStart = performance.now();
    cycleStart = presetStart;
    syncControls();
    if (main) main.clear();
    if (announce) toast(PRESETS.find((p) => p.id === id).name);
  }
  function stepPreset(dir) {
    const i = PRESETS.findIndex((p) => p.id === settings.preset);
    setPreset(PRESETS[(i + dir + PRESETS.length) % PRESETS.length].id);
  }
  function setPalette(id) {
    settings.palette = id;
    saveSettings(settings);
    if (main) main.invalidateLut();
    syncControls();
    toast(PALETTES.find((p) => p.id === id).name + " colors");
  }
  function stepPalette() {
    const i = PALETTES.findIndex((p) => p.id === settings.palette);
    setPalette(PALETTES[(i + 1) % PALETTES.length].id);
  }

  function trackViz() {
    return (opts && opts.viz && opts.viz.getTrackViz && opts.viz.getTrackViz()) || "";
  }
  function currentPresetId() {
    return resolvePreset(settings.preset, trackViz());
  }
  function updateLcdPreset() {
    if (!q.lcdPreset) return;
    const id = currentPresetId();
    const name = (PRESETS.find((x) => x.id === id) || PRESETS[1]).name.toUpperCase();
    q.lcdPreset.textContent = settings.preset === "song" ? "SONG: " + name : name;
  }

  /* ── HUD ──────────────────────────────────────────────── */
  function toast(msg) {
    q.toast.textContent = msg;
    q.toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => q.toast.classList.remove("is-on"), 1300);
  }

  function wake() {
    if (hudForcedHidden) return;
    dom.classList.remove("is-idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(goIdle, 2600);
  }
  function goIdle() {
    const focusInHud = q.hud.contains(document.activeElement) &&
      document.activeElement.matches("input, select");
    if (hudHover || focusInHud) { idleTimer = setTimeout(goIdle, 1500); return; }
    dom.classList.add("is-idle");
  }

  function togglePanel(force) {
    const show = force != null ? force : q.panel.hidden;
    const hadFocus = q.panel.contains(document.activeElement);
    q.panel.hidden = !show;
    if (!show && hadFocus) q.settingsBtn.focus({ preventScroll: true });
    q.settingsBtn.setAttribute("aria-expanded", show);
    if (show) q.panel.querySelector(".xpt-chip.is-on, .xpt-chip").focus({ preventScroll: true });
    wake();
  }

  function updateTitle() {
    const title = (opts && opts.getTitle && opts.getTitle()) || "";
    if (q.marqueeText.textContent === title) return;
    q.marqueeText.textContent = title;
    // scroll only when the title doesn't fit
    requestAnimationFrame(() => {
      const over = q.marqueeText.scrollWidth - q.marquee.clientWidth;
      q.marquee.classList.toggle("is-scrolling", over > 0);
      q.marquee.style.setProperty("--xpt-scroll", `-${Math.max(0, over + 24)}px`);
      q.marquee.style.setProperty("--xpt-scroll-time", `${Math.max(6, over / 18 + 4)}s`);
    });
  }

  function updateTransport() {
    const a = opts.audio;
    const playing = !a.paused;
    q.play.classList.toggle("is-playing", playing);
    q.lcdState.innerHTML = playing ? "&#9654;" : a.currentTime > 0 ? "&#10074;&#10074;" : "&#9632;";
    q.lcdTime.textContent = fmtTime(a.currentTime);
    q.cur.textContent = fmtTime(a.currentTime);
    q.dur.textContent = fmtTime(a.duration);
    const pct = a.duration ? (a.currentTime / a.duration) * 100 : 0;
    q.seekFill.style.width = pct + "%";
    q.seek.setAttribute("aria-valuenow", Math.round(pct));
    q.vol.value = a.volume;
  }

  /* ── Music video / cover behind the visualizer ── */
  let lastArt = null;
  function updateArt() {
    if (!opts || !q.art) return;
    const art = (opts.viz.getArt && opts.viz.getArt()) || { src: "" };
    const src = settings.video ? art.src : "";
    if (lastArt === src) return;
    lastArt = src;
    const { artImg: img, artVid: vid } = q;
    if (!src) {
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
      img.removeAttribute("src");
      q.art.classList.remove("has-img", "has-video");
      return;
    }
    if (art.video) {
      img.removeAttribute("src");
      q.art.classList.remove("has-img");
      q.art.classList.add("has-video");
      vid.src = src;
      vid.play().catch(() => {});
    } else {
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
      q.art.classList.remove("has-video");
      q.art.classList.add("has-img");
      img.src = src;
    }
  }
  function clearArt() {
    if (!q.artVid) return;
    q.artVid.pause();
    q.artVid.removeAttribute("src");
    q.artVid.load();
    lastArt = null;
  }

  const audioEvents = ["play", "pause", "timeupdate", "loadedmetadata", "volumechange", "emptied", "loadstart"];
  function onAudio(e) {
    if (e.type !== "timeupdate" && e.type !== "volumechange") { updateArt(); syncControls(); }
    if (e.type === "play" || e.type === "loadedmetadata" || e.type === "emptied") updateTitle();
    updateTransport();
  }

  /* ── Keyboard ─────────────────────────────────────────── */
  function onKey(e) {
    const tag = e.target.tagName;
    const inField = tag === "INPUT" || tag === "SELECT";
    const k = e.key;

    if (k === "Escape") {
      e.preventDefault();
      if (!q.panel.hidden) togglePanel(false);
      else close();
      return;
    }
    if (inField && (k.startsWith("Arrow") || k === " ")) return; // let the control handle it
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    switch (k) {
      case " ":
        if (tag === "BUTTON") return; // Space already clicks the focused button
        e.preventDefault(); opts.toggle && opts.toggle(); break;
      case "ArrowLeft":  e.preventDefault(); opts.prev && opts.prev(); break;
      case "ArrowRight": e.preventDefault(); opts.next && opts.next(); break;
      case "ArrowUp":    e.preventDefault(); stepPreset(-1); break;
      case "ArrowDown":  e.preventDefault(); stepPreset(1); break;
      case "c": case "C": stepPalette(); break;
      case "s": case "S": togglePanel(); break;
      case "h": case "H":
        hudForcedHidden = !hudForcedHidden;
        dom.classList.toggle("is-idle", hudForcedHidden);
        if (!hudForcedHidden) wake();
        toast(hudForcedHidden ? "Controls hidden. Press H to show" : "Controls shown");
        break;
      default:
        if (k >= "1" && k <= String(PRESETS.length)) setPreset(PRESETS[+k - 1].id);
        else return;
    }
    wake();
  }

  /* ── Fullscreen ───────────────────────────────────────── */
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  function requestFs() {
    const fn = dom.requestFullscreen || dom.webkitRequestFullscreen;
    if (!fn) return;
    try {
      const p = fn.call(dom, { navigationUI: "hide" });
      if (p && p.catch) p.catch(() => { /* stays as a full-window overlay */ });
    } catch (e) { /* ignore */ }
  }
  function onFsChange() {
    // user pressed Esc / F11 to leave native fullscreen → close the theater too
    if (open && !fsElement() && dom.dataset.wasFs === "1") close();
    if (open && fsElement() === dom) dom.dataset.wasFs = "1";
  }

  /* ── Sizing ───────────────────────────────────────────── */
  function resize() {
    if (!canvas) return;
    // Desktop: letterbox to the same 4:3 frame as #desktop-root (1024×768,
    // scaled with the same min() fit), so it lines up with the desktop exactly.
    // Mobile: use the whole screen.
    const vw = dom.clientWidth || window.innerWidth;
    const vh = dom.clientHeight || window.innerHeight;
    if (opts && opts.letterbox) {
      const k = Math.min(vw / 1024, vh / 768);
      cssW = Math.round(1024 * k);
      cssH = Math.round(768 * k);
    } else {
      cssW = vw;
      cssH = vh;
    }
    const st = q.stage.style;
    st.width = cssW + "px";
    st.height = cssH + "px";
    st.left = Math.round((vw - cssW) / 2) + "px";
    st.top = Math.round((vh - cssH) / 2) + "px";
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(160, Math.round(cssW * dpr * scale));
    const h = Math.max(90, Math.round(cssH * dpr * scale));
    if (w === W && h === H) return;
    W = w; H = h;
    main.setSize(w, h);
  }

  /* ════════════════════════════════════════════════════════════
     RENDERER — one instance per canvas (fullscreen + each small screen).
     All look settings come from the shared settings object.
     ════════════════════════════════════════════════════════════ */
  const LEGACY_VIZ = { bars: "spectrum", scope: "plasma", ambience: "bloom" };
  function resolvePreset(id, trackViz) {
    if (id !== "song") return id;
    const v = LEGACY_VIZ[trackViz] || trackViz;
    return PRESETS.some((p) => p.id === v && v !== "song") ? v : "spectrum";
  }
  function artStopsFrom(c) {
    c = c && c.length ? c : ["#4a9eff", "#c8e6ff"];
    return ["#03030c", c[0], c[1] || c[0], c[1] || c[0], "#ffffff"];
  }

  function createRenderer(canvas, cfg) {
    cfg = cfg || {};
    const ctx = canvas.getContext("2d", { alpha: false });
    const buf = document.createElement("canvas");
    const bctx = buf.getContext("2d", { alpha: false });
    let W = canvas.width, H = canvas.height;
    buf.width = W; buf.height = H;
    const tier = () => (cfg.tier ? cfg.tier() : QUALITY.med);

    let lut = null, lutKey = "";
    let t = 0;
    let bass = 0, mid = 0, treb = 0, level = 0;
    let beat = 0, lastBeat = 0;
    const bassHist = new Float32Array(48);
    let bassHistI = 0;
    let peaks = new Float32Array(128);
    let bandVals = new Float32Array(128);
    let stars = null;
    let ridge = null, ridgeHead = 0, ridgeTick = 0;
    let barGrad = null, barGradKey = "", gapPattern = null, gapKey = "";

    // returns true when the colors changed
    function refreshLut() {
      const pal = PALETTES.find((p) => p.id === settings.palette) || PALETTES[0];
      const stops = pal.stops || artStopsFrom(cfg.colors && cfg.colors());
      const key = stops.join("|");
      if (key === lutKey) return false;
      lutKey = key;
      lut = buildLut(stops);
      barGradKey = "";
      return true;
    }

    /* ════════════════════════════════════════════════════════════
       ANALYSIS
       ════════════════════════════════════════════════════════════ */
    function avgRange(f, a, b) {
      a = a | 0; b = Math.max(a + 1, b | 0);
      let s = 0;
      for (let i = a; i < b; i++) s += f[i];
      return s / ((b - a) * 255);
    }

    function analyze(f, now, dt) {
      const n = f.length, g = settings.gain;
      const rb = clamp(avgRange(f, 1, n * 0.012) * g, 0, 1.5);
      const rm = clamp(avgRange(f, n * 0.012, n * 0.1) * g * 1.3, 0, 1.5);
      const rt = clamp(avgRange(f, n * 0.1, n * 0.45) * g * 2.2, 0, 1.5);
      const k = 1 - Math.pow(0.7, dt / 16.7);
      bass += (rb - bass) * k;
      mid += (rm - mid) * k;
      treb += (rt - treb) * k;
      level = (bass * 0.5 + mid * 0.35 + treb * 0.15);

      // beat: bass jumps well above its recent average
      let avg = 0;
      for (let i = 0; i < bassHist.length; i++) avg += bassHist[i];
      avg /= bassHist.length;
      bassHist[bassHistI] = rb;
      bassHistI = (bassHistI + 1) % bassHist.length;
      if (rb > avg * 1.32 && rb > 0.28 && now - lastBeat > 230) {
        beat = 1;
        lastBeat = now;
      }
      beat *= Math.pow(0.88, dt / 16.7);
    }

    // log-spaced band values (0..1+) into bandVals[0..count)
    function computeBands(f, count, lo, hi) {
      const n = f.length;
      const a0 = Math.max(1, n * lo), a1 = n * hi;
      const ratio = a1 / a0;
      const g = settings.gain;
      for (let b = 0; b < count; b++) {
        const from = a0 * Math.pow(ratio, b / count);
        const to = a0 * Math.pow(ratio, (b + 1) / count);
        let v = avgRange(f, from, Math.max(from + 1, to));
        // expand the dynamic range, then lift the highs so the right side isn't flat
        v = Math.pow(v, 1.6) * g * 1.25 * (1 + (b / count) * 1.1);
        bandVals[b] = v > 1.1 ? 1.1 : v;
      }
    }

    /* ════════════════════════════════════════════════════════════
       DRAW HELPERS
       ════════════════════════════════════════════════════════════ */
    function fade(amount) {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(0,0,0,${amount})`;
      ctx.fillRect(0, 0, W, H);
    }

    // MilkDrop-style feedback: redraw last frame zoomed/rotated and slightly dimmer
    function feedback(zoom, rot, keep, dx = 0, dy = 0) {
      bctx.globalCompositeOperation = "copy";
      bctx.drawImage(canvas, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalAlpha = keep;
      ctx.translate(W / 2 + dx, H / 2 + dy);
      ctx.rotate(rot);
      ctx.scale(zoom, zoom);
      ctx.drawImage(buf, -W / 2, -H / 2);
      ctx.restore();
    }

    function keepFromTrails(min, max) {
      return min + (max - min) * settings.trails;
    }

    function mirror() {
      const half = Math.floor(W / 2);
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(canvas, 0, 0, half, H, 0, 0, half, H);
      ctx.restore();
    }

    /* ════════════════════════════════════════════════════════════
       PRESETS
       ════════════════════════════════════════════════════════════ */

    // 1 · Spectrum — classic Winamp analyzer with peak caps, scope and reflection
    function drawSpectrum(f, w, dt) {
      fade(1 - settings.trails * 0.75);
      const T = tier();
      const count = T.bands;
      computeBands(f, count, 0.002, 0.72);
      if (peaks.length < count) peaks = new Float32Array(count);

      const padX = W * 0.06;
      const floor = H * 0.72;
      const maxH = H * 0.56;
      const gap = Math.max(1, W / count * 0.22);
      const bw = (W - padX * 2 - gap * (count - 1)) / count;
      const segH = Math.max(2, Math.round(H / 110));

      const gk = `${W}x${H}|${lutKey}`;
      if (gk !== barGradKey) {
        barGradKey = gk;
        barGrad = ctx.createLinearGradient(0, floor, 0, floor - maxH);
        for (let i = 0; i <= 8; i++) barGrad.addColorStop(i / 8, lut.at(0.28 + (i / 8) * 0.72));
      }
      if (gapKey !== String(segH)) {
        gapKey = String(segH);
        const pc = document.createElement("canvas");
        pc.width = 1; pc.height = segH + 1;
        const pg = pc.getContext("2d");
        pg.fillStyle = "#000";
        pg.fillRect(0, segH, 1, 1);
        gapPattern = ctx.createPattern(pc, "repeat");
      }

      ctx.fillStyle = barGrad;
      const fall = 0.0009 * dt * H * settings.speed;
      for (let b = 0; b < count; b++) {
        const h = Math.min(1, bandVals[b]) * maxH;
        const x = padX + b * (bw + gap);
        ctx.fillRect(x, floor - h, bw, h);
        peaks[b] = Math.max(peaks[b] - fall, h);
      }
      // segment gaps in one pass (LED look)
      ctx.fillStyle = gapPattern;
      ctx.fillRect(0, floor - maxH - segH, W, maxH + segH);

      ctx.fillStyle = lut.at(1);
      for (let b = 0; b < count; b++) {
        const x = padX + b * (bw + gap);
        ctx.fillRect(x, floor - peaks[b] - segH * 1.6, bw, Math.max(2, segH * 0.8));
      }

      // floor line
      ctx.fillStyle = lut.atA(0.6, 0.5);
      ctx.fillRect(padX, floor + 1, W - padX * 2, Math.max(1, H / 400));

      // reflection
      const reflH = Math.min(H - floor - 2, maxH * 0.45);
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.translate(0, floor * 2 + 4);
      ctx.scale(1, -1);
      ctx.drawImage(canvas, 0, floor - reflH, W, reflH, 0, floor - reflH, W, reflH);
      ctx.restore();

      // oscilloscope strip along the top
      const sy = H * 0.1, sh = H * 0.07;
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = lut.at(0.85);
      ctx.lineWidth = Math.max(1, H / 360);
      ctx.beginPath();
      const n = w.length, step = Math.max(1, Math.floor(n / (W * 0.6)));
      for (let i = 0; i < n; i += step) {
        const x = padX + (i / n) * (W - padX * 2);
        const y = sy + ((w[i] - 128) / 128) * sh;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 2 · Tunnel — feedback zoom with a waveform ring that warps on the beat
    function drawTunnel(f, w, dt) {
      const sp = settings.speed;
      feedback(1.018 + bass * 0.05 * sp + beat * 0.02, (0.0025 + mid * 0.006) * sp * (dt / 16.7), keepFromTrails(0.78, 0.965));

      const cx = W / 2, cy = H / 2;
      const m = Math.min(W, H);
      const sides = 5 + (((t / 6) | 0) % 4);
      const pts = 180;
      const R = m * (0.1 + bass * 0.07 + beat * 0.03);
      const n = w.length;

      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round";
      for (let ring = 0; ring < 2; ring++) {
        const rot = t * (ring ? -0.4 : 0.3) * sp;
        ctx.beginPath();
        for (let i = 0; i <= pts; i++) {
          const a = (i / pts) * TAU;
          // polygon-ish radius
          const seg = TAU / sides;
          const local = (((a + rot) % seg) + seg) % seg; // always 0..seg
          const poly = Math.cos(Math.PI / sides) / Math.cos(local - Math.PI / sides);
          const wv = (w[((i / pts) * (n - 1)) | 0] - 128) / 128;
          const r = R * (ring ? 0.62 : 1) * poly * (1 + wv * (0.35 + treb * 0.4));
          const x = cx + Math.cos(a + rot) * r;
          const y = cy + Math.sin(a + rot) * r;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = lut.at(ring ? 0.95 : 0.55 + 0.35 * Math.sin(t * 0.5));
        ctx.lineWidth = Math.max(1.5, m / (ring ? 260 : 170));
        ctx.stroke();
      }
      // core glow
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.6);
      core.addColorStop(0, lut.atA(1, 0.35 + beat * 0.5));
      core.addColorStop(1, lut.atA(0.5, 0));
      ctx.fillStyle = core;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.globalCompositeOperation = "source-over";
    }

    // 3 · Warp — starfield that surges with the bass, spectrum ring at the center
    const STAR_BUCKETS = 8;
    function drawWarp(f, w, dt) {
      const T = tier();
      const count = T.stars;
      if (!stars || stars.length !== count * 4) {
        stars = new Float32Array(count * 4); // x, y, z, prevZ
        for (let i = 0; i < count; i++) resetStar(i, true);
      }
      fade(1 - keepFromTrails(0.35, 0.88));

      const cx = W / 2, cy = H / 2;
      const fov = Math.min(W, H) * 0.9;
      const v = (0.004 + bass * 0.03 + beat * 0.035) * settings.speed * (dt / 16.7);
      const drift = Math.sin(t * 0.25) * 0.2;

      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (let bkt = 0; bkt < STAR_BUCKETS; bkt++) {
        ctx.beginPath();
        const zLo = bkt / STAR_BUCKETS, zHi = (bkt + 1) / STAR_BUCKETS;
        for (let i = 0; i < count; i++) {
          const o = i * 4;
          const z = stars[o + 2];
          if (bkt === 0) { // advance once per frame (in the first bucket pass)
            stars[o + 3] = z;
            stars[o + 2] = z - v;
            if (stars[o + 2] <= 0.02) { resetStar(i, false); continue; }
          }
          const nz = 1 - stars[o + 2]; // 0 far → 1 near
          if (nz < zLo || nz >= zHi) continue;
          const x = stars[o] + drift * stars[o + 2];
          const y = stars[o + 1];
          const sx = cx + (x / stars[o + 2]) * fov, sy = cy + (y / stars[o + 2]) * fov;
          const px = cx + (x / stars[o + 3]) * fov, py = cy + (y / stars[o + 3]) * fov;
          if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) continue;
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = lut.at(0.35 + zLo * 0.65);
        ctx.lineWidth = Math.max(1, (0.5 + zLo * 2.2) * (H / 540));
        ctx.stroke();
      }

      // spectrum ring
      const bars = 72;
      computeBands(f, bars / 2, 0.003, 0.6);
      const R = Math.min(W, H) * (0.09 + bass * 0.03);
      ctx.lineWidth = Math.max(1.5, H / 300);
      ctx.strokeStyle = lut.at(0.9);
      ctx.beginPath();
      for (let i = 0; i < bars; i++) {
        const bi = i < bars / 2 ? i : bars - 1 - i;
        const val = Math.min(1, bandVals[bi]);
        const a = (i / bars) * TAU - Math.PI / 2 + t * 0.1;
        const r2 = R + val * Math.min(W, H) * 0.16;
        ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.92, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = lut.atA(1, 0.6 + beat * 0.4);
      ctx.lineWidth = Math.max(1, H / 400);
      ctx.stroke();
    }
    function resetStar(i, anyDepth) {
      const o = i * 4;
      const ang = Math.random() * TAU;
      const rad = 0.05 + Math.random() * 1.4;
      stars[o] = Math.cos(ang) * rad * (W / H);
      stars[o + 1] = Math.sin(ang) * rad;
      stars[o + 2] = anyDepth ? 0.05 + Math.random() * 0.95 : 1;
      stars[o + 3] = stars[o + 2];
    }

    // 4 · Plasma Scope — glowing Lissajous figures in a slowly swirling feedback
    function drawPlasma(f, w, dt) {
      const sp = settings.speed;
      feedback(0.985 - bass * 0.01, Math.sin(t * 0.21) * 0.012 * sp, keepFromTrails(0.8, 0.975),
        Math.sin(t * 0.37) * W * 0.002, Math.cos(t * 0.29) * H * 0.002);

      const cx = W / 2, cy = H / 2;
      const m = Math.min(W, H);
      const n = w.length;
      const R = m * (0.3 + bass * 0.12);
      const step = Math.max(1, Math.floor(n / 700));

      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round";
      const layers = [
        { off: n >> 4, rot: t * 0.3 * sp, col: 0.55 + 0.4 * Math.sin(t * 0.4), wid: 2.2 },
        { off: n >> 3, rot: -t * 0.2 * sp + 1, col: 0.9, wid: 1.2 }
      ];
      for (const L of layers) {
        const c = Math.cos(L.rot), s = Math.sin(L.rot);
        ctx.beginPath();
        for (let i = 0; i < n - L.off; i += step) {
          const a = (w[i] - 128) / 128, b = (w[i + L.off] - 128) / 128;
          const x = cx + (a * c - b * s) * R;
          const y = cy + (a * s + b * c) * R;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = lut.at(L.col);
        ctx.lineWidth = Math.max(1, (m / 360) * L.wid);
        ctx.stroke();
      }
      // horizontal waveform band
      ctx.beginPath();
      for (let i = 0; i < n; i += step) {
        const x = (i / n) * W;
        const y = cy + ((w[i] - 128) / 128) * H * 0.18;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = lut.atA(0.4, 0.35);
      ctx.lineWidth = Math.max(1, m / 500);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    // 5 · Kaleido Bloom — 6-fold mirrored spectrum petals over a spinning feedback
    let petal = null;
    function drawBloom(f, w, dt) {
      const sp = settings.speed;
      feedback(1.012 + bass * 0.02, 0.006 * sp * (dt / 16.7) * (1 + mid), keepFromTrails(0.7, 0.93));

      const cx = W / 2, cy = H / 2;
      const m = Math.min(W, H);
      const pts = 48;
      computeBands(f, pts, 0.003, 0.55);
      const inner = m * (0.04 + bass * 0.03);
      const span = m * 0.42;
      const wedge = Math.PI / 6;

      // one half-petal path, reused 12 times
      petal = new Path2D();
      petal.moveTo(inner, 0);
      for (let i = 0; i < pts; i++) {
        const d = i / (pts - 1);
        const r = inner + d * span;
        const a = Math.min(1, bandVals[i]) * wedge * 0.95;
        petal.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      petal.lineTo(inner + span, 0);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.15 * sp);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = Math.max(1, m / 420);
      const fillC = lut.atA(0.45 + 0.3 * Math.sin(t * 0.3), (0.06 + beat * 0.08).toFixed(3));
      const strokeC = lut.at(0.92);
      for (let k = 0; k < 6; k++) {
        for (let side = 0; side < 2; side++) {
          ctx.save();
          ctx.rotate(k * (TAU / 6));
          if (side) ctx.scale(1, -1);
          ctx.fillStyle = fillC;
          ctx.fill(petal);
          ctx.strokeStyle = strokeC;
          ctx.stroke(petal);
          ctx.restore();
        }
      }
      // center
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, inner * 2.2);
      g.addColorStop(0, lut.atA(1, 0.9));
      g.addColorStop(1, lut.atA(0.6, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, inner * 2.2 * (1 + beat * 0.4), 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    }

    // 6 · Ridgeline — spectrum history as stacked, occluding mountain lines
    function drawRidge(f, w, dt) {
      const T = tier();
      const rows = T.rows, cols = T.cols;
      if (!ridge || ridge.length !== rows || ridge[0].length !== cols) {
        ridge = Array.from({ length: rows }, () => new Float32Array(cols));
        ridgeHead = 0;
      }
      ridgeTick += dt * settings.speed;
      if (ridgeTick >= 50) {
        ridgeTick %= 50;
        computeBands(f, cols / 2, 0.003, 0.6);
        const row = ridge[ridgeHead];
        const half = cols / 2;
        for (let c = 0; c < cols; c++) {
          // symmetric: lows in the middle, highs toward the edges
          const bi = c < half ? half - 1 - c : c - half;
          const v = Math.min(1, bandVals[bi]);
          row[c] = v * v * (0.35 + 0.65 * Math.exp(-Math.pow((c - half + 0.5) / (cols * 0.28), 2)));
        }
        ridgeHead = (ridgeHead + 1) % rows;
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      const lw = Math.max(1, H / 420);
      ctx.lineWidth = lw;
      ctx.lineJoin = "round";
      for (let j = 0; j < rows; j++) {
        // oldest (back) first
        const row = ridge[(ridgeHead + j) % rows];
        const d = j / (rows - 1);               // 0 back → 1 front
        const y0 = H * (0.2 + 0.68 * Math.pow(d, 1.25));
        const width = W * (0.42 + 0.5 * d);
        const x0 = (W - width) / 2;
        const amp = H * (0.07 + 0.2 * d) * (1 + beat * 0.15 * d);

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        for (let c = 0; c < cols; c++) {
          ctx.lineTo(x0 + (c / (cols - 1)) * width, y0 - row[c] * amp);
        }
        ctx.lineTo(x0 + width, y0);
        // occlude the rows behind
        ctx.fillStyle = "#000";
        ctx.fill();
        ctx.strokeStyle = lut.atA(0.3 + d * 0.7, (0.25 + d * 0.75).toFixed(3));
        ctx.stroke();
      }
      // horizon glow
      const g = ctx.createLinearGradient(0, H * 0.02, 0, H * 0.36);
      g.addColorStop(0, lut.atA(0.5, 0));
      g.addColorStop(0.6, lut.atA(0.6, (0.1 + level * 0.1).toFixed(3)));
      g.addColorStop(1, lut.atA(0.5, 0));
      ctx.fillStyle = g;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillRect(0, H * 0.02, W, H * 0.34);
      ctx.globalCompositeOperation = "source-over";
    }

    const DRAW = {
      spectrum: drawSpectrum,
      tunnel: drawTunnel,
      warp: drawWarp,
      plasma: drawPlasma,
      bloom: drawBloom,
      ridge: drawRidge
    };


    function clear() {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
    }

    return {
      setSize(w, h) {
        if (w === W && h === H && buf.width === w && buf.height === h) return;
        W = w; H = h;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        buf.width = w; buf.height = h;
        barGradKey = ""; gapKey = "";
        stars = null; ridge = null;
        clear();
      },
      clear,
      reset() {
        peaks.fill(0);
        bassHist.fill(0);
        beat = 0; bass = mid = treb = level = 0;
      },
      invalidateLut() { lutKey = ""; },
      refreshLut,
      levels: () => ({ bass, beat, level }),
      draw(now, dt, f, w, presetId) {
        t += (dt / 1000) * settings.speed;
        if (!lut) refreshLut();
        analyze(f, now, dt);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        (DRAW[presetId] || drawSpectrum)(f, w, dt);
        if (settings.mirror) mirror();
        if (settings.flash && beat > 0.05) {
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = lut.atA(0.9, (beat * 0.1).toFixed(3));
          ctx.fillRect(0, 0, W, H);
          ctx.globalCompositeOperation = "source-over";
        }
      }
    };
  }

  /* ════════════════════════════════════════════════════════════
     LOOP
     ════════════════════════════════════════════════════════════ */
  function frame(now) {
    raf = 0;
    if (!open) return;
    raf = requestAnimationFrame(frame);

    const dt = Math.min(50, lastNow ? now - lastNow : 16.7);
    lastNow = now;
    frameNo++;

    if (frameNo % 30 === 0 && main.refreshLut() && settings.palette === "art") syncControls();
    if (settings.cycle && now - cycleStart > 30000) stepPreset(1);

    const { f, w } = opts.viz.sample(now);
    main.draw(now, dt, f, w, currentPresetId());

    if (settings.video && lastArt && !reducedMotion) {
      const lv = main.levels();
      q.stage.style.setProperty("--xpt-pulse", Math.min(1, lv.bass * 0.7 + lv.beat * 0.3).toFixed(3));
    }

    perf(dt);
  }

  function perf(dt) {
    fpsAcc += dt;
    fpsFrames++;
    if (fpsAcc >= 500) {
      fpsShown = Math.round((fpsFrames * 1000) / fpsAcc);
      if (settings.fps) q.fps.textContent = `${fpsShown} fps · ${W}×${H}`;
      fpsAcc = 0;
      fpsFrames = 0;
    }
    if (settings.quality !== "auto" || document.hidden) return;
    // Auto quality: step the render scale down when frames run long, back up when there's headroom.
    if (dt > 24) { slowMs += dt; fastMs = 0; }
    else if (dt < 18) { fastMs += dt; slowMs = Math.max(0, slowMs - dt * 0.5); }
    if (slowMs > 1500 && scale > 0.4) {
      scale = Math.max(0.4, scale - 0.1);
      slowMs = 0;
      resize();
    } else if (fastMs > 6000 && scale < 0.9) {
      scale = Math.min(0.9, scale + 0.05);
      fastMs = 0;
      resize();
    }
  }

  /* ════════════════════════════════════════════════════════════
     OPEN / CLOSE
     ════════════════════════════════════════════════════════════ */
  function openTheater(binding) {
    if (!binding || !binding.audio || !binding.viz) return;
    ensureDom();
    if (open) close(true);
    opts = binding;
    open = true;

    dom.hidden = false;
    dom.dataset.wasFs = "0";
    dom.classList.toggle("xpt--full", !opts.letterbox);
    document.documentElement.classList.add("xpt-open");
    requestFs();

    opts.viz.suspend(true);
    opts.viz.setDetail(true);
    audioEvents.forEach((ev) => opts.audio.addEventListener(ev, onAudio));

    scale = startScale();
    W = H = 0;
    main.invalidateLut();
    main.refreshLut();
    applySettings("*");
    resize();
    updateTitle();
    lastArt = null;
    updateArt();
    updateTransport();
    presetStart = cycleStart = performance.now();
    lastNow = 0;
    main.reset();
    hudForcedHidden = false;
    togglePanel(false);
    wake();
    dom.focus({ preventScroll: true });
    // resize again once the fullscreen transition has settled
    setTimeout(() => open && resize(), 250);

    raf = requestAnimationFrame(frame);
  }

  function close(silent) {
    if (!open) return;
    open = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(idleTimer);

    if (fsElement() === dom) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      try { const p = exit && exit.call(document); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
    }
    dom.hidden = true;
    dom.classList.remove("is-idle");
    document.documentElement.classList.remove("xpt-open");

    audioEvents.forEach((ev) => opts.audio.removeEventListener(ev, onAudio));
    clearArt();
    opts.viz.setDetail(false);
    opts.viz.suspend(false);
    const back = opts.trigger;
    opts = null;
    if (!silent && back && back.focus) back.focus({ preventScroll: true });
  }

  window.XPTheater = {
    open: openTheater,
    close: () => close(),
    isOpen: () => open,
    // shared with the small in-window screens
    createRenderer,
    resolvePreset,
    getSettings: () => settings,
    presets: PRESETS.map((p) => ({ id: p.id, name: p.name })),
    palettes: PALETTES.map((p) => ({ id: p.id, name: p.name })),
    // change look settings from outside (e.g. the mobile player's buttons)
    updateSettings(patch) {
      Object.assign(settings, patch || {});
      saveSettings(settings);
      if (dom) {
        if (main) main.invalidateLut();
        applySettings("preset");
      }
    }
  };
})();
