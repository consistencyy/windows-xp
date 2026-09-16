/* ════════════════════════════════════════════════════════════
   XPViz — audio-reactive visualizer + CRT screen for the Media Player.
   Expects markup:
     <div class="crt-screen">
       <div class="crt-tube">
         <img class="crt-art crt-art-img"> <video class="crt-art crt-art-video">
         <canvas class="crt-viz"></canvas>
       </div>
       <div class="crt-overlay"></div>
     </div>
   ════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  let sharedCtx = null;
  function getCtx() {
    if (sharedCtx) return sharedCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { sharedCtx = new AC(); } catch (e) { sharedCtx = null; }
    return sharedCtx;
  }

  const DEFAULT_COLORS = ["#4a9eff", "#c8e6ff"];
  const reducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isVideo = (src) => /\.(webm|mp4|mov|ogv)(\?|$)/i.test(src || "");

  function normalize(list) {
    return (list || []).map((t) => ({
      title: t.title || "Untitled",
      audio: t.audio || t.src || "",
      art: t.art || t.coverSrc || "",
      viz: t.viz || "bars",
      colors: Array.isArray(t.colors) && t.colors.length ? t.colors : null
    }));
  }

  /* ── Color helpers ─────────────────────────────────── */
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  const hsl = (h, s, l) => `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

  // Pull a vivid main color from the art, then build a lighter highlight from it.
  function extractColors(el) {
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 32;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(el, 0, 0, 32, 32);
      const d = g.getImageData(0, 0, 32, 32).data;
      let best = null, bestScore = -1;
      for (let i = 0; i < d.length; i += 4) {
        const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
        const score = s * (1 - Math.abs(l - 0.55) * 1.6);
        if (score > bestScore) { bestScore = score; best = [h, s, l]; }
      }
      if (!best || bestScore < 0.08) return null; // grayscale art → keep defaults
      const [h, s] = best;
      return [hsl(h, Math.max(s, 0.65), 0.6), hsl((h + 25) % 360, Math.max(s * 0.7, 0.4), 0.85)];
    } catch (e) {
      return null; // cross-origin art taints the canvas; fall back to defaults
    }
  }

  function create({ audio, wrap, placeholder }) {
    if (!audio || !wrap) return null;
    const tube = wrap.querySelector(".crt-tube");
    const img = wrap.querySelector(".crt-art-img");
    const vid = wrap.querySelector(".crt-art-video");
    const canvas = wrap.querySelector(".crt-viz");
    const g = canvas.getContext("2d");

    let analyser = null, freq = null, wave = null;
    let raf = 0, running = false;
    let style = "bars", colors = DEFAULT_COLORS;
    let silentFrames = 0, switchFrames = 0, fadeFrames = 0;
    let peaks = new Array(16).fill(0);
    let spin = 0;
    let W = 0, H = 0;

    function connect() {
      if (analyser) return;
      const ac = getCtx();
      if (!ac) return;
      try {
        const src = ac.createMediaElementSource(audio);
        analyser = ac.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.78;
        src.connect(analyser);
        analyser.connect(ac.destination);
        freq = new Uint8Array(analyser.frequencyBinCount);
        wave = new Uint8Array(analyser.fftSize);
      } catch (e) {
        analyser = null;
      }
    }

    function sizeCanvas() {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return false;
      if (w !== W || h !== H) {
        W = canvas.width = w;   // 1:1 CSS pixels — a little chunky on purpose
        H = canvas.height = h;
      }
      return true;
    }

    /* ── Audio sampling (with a fake signal when real data isn't available) ── */
    function sample(now) {
      let live = false;
      if (analyser && !audio.paused) {
        analyser.getByteFrequencyData(freq);
        analyser.getByteTimeDomainData(wave);
        let sum = 0;
        for (let i = 0; i < 32; i++) sum += freq[i];
        silentFrames = sum === 0 ? silentFrames + 1 : 0;
        live = silentFrames < 90;
      }
      if (live) return { f: freq, w: wave };

      // Fallback: opening the page from file:// (or an old browser) blocks
      // real analysis, so animate a plausible stand-in instead of freezing.
      const t = now / 1000;
      const amp = audio.paused ? 0 : 1;
      const f = new Uint8Array(256), w = new Uint8Array(512);
      const beat = Math.pow(Math.max(0, Math.sin(t * 4.2)), 6);
      for (let i = 0; i < 256; i++) {
        const fall = 1 - i / 256;
        f[i] = amp * Math.max(0, 255 * fall * (0.45 + 0.35 * Math.sin(t * 2.3 + i * 0.35) * Math.sin(t * 0.7 + i * 0.05) + 0.4 * beat * fall));
      }
      for (let i = 0; i < 512; i++) {
        w[i] = 128 + amp * 60 * (Math.sin(i * 0.06 + t * 5) * 0.6 + Math.sin(i * 0.23 - t * 3) * 0.3) * (0.6 + beat);
      }
      return { f, w };
    }

    function bandLevel(f, from, to) {
      let s = 0;
      for (let i = from; i < to; i++) s += f[i];
      return s / ((to - from) * 255);
    }

    /* ── Styles ───────────────────────────────────────── */
    function drawBars(f) {
      g.clearRect(0, 0, W, H);
      const n = 16, gap = 2, pad = 10;
      const bw = (W - pad * 2 - gap * (n - 1)) / n;
      const seg = 4, segGap = 1.5;
      const grad = g.createLinearGradient(0, H, 0, 0);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
      for (let b = 0; b < n; b++) {
        // log-ish mapping so the low end doesn't hog the whole display
        const from = Math.floor(Math.pow(b / n, 1.8) * 150) + 1;
        const to = Math.max(from + 1, Math.floor(Math.pow((b + 1) / n, 1.8) * 150) + 1);
        const v = Math.min(1, bandLevel(f, from, to) * 1.25);
        const maxH = H - pad * 2;
        const h = v * maxH;
        const x = pad + b * (bw + gap);
        g.fillStyle = grad;
        for (let y = 0; y < h; y += seg + segGap) {
          g.fillRect(x, H - pad - y - seg, bw, seg);
        }
        peaks[b] = Math.max(peaks[b] - 1.2, h);
        g.fillStyle = colors[1];
        g.fillRect(x, H - pad - peaks[b] - seg - 2, bw, 2);
      }
    }

    function fadeTrails(amount) {
      g.globalCompositeOperation = "destination-out";
      g.fillStyle = `rgba(0,0,0,${amount})`;
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "source-over";
    }

    function drawScope(w) {
      fadeTrails(0.3);
      g.lineWidth = 2;
      g.strokeStyle = colors[0];
      g.shadowColor = colors[0];
      g.shadowBlur = 8;
      g.beginPath();
      const step = w.length / W;
      for (let x = 0; x < W; x++) {
        const v = (w[Math.floor(x * step)] - 128) / 128;
        const y = H / 2 + v * H * 0.42;
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
      g.shadowBlur = 0;
      // faint graticule, like an oscilloscope face
      g.strokeStyle = "rgba(255,255,255,0.06)";
      g.lineWidth = 1;
      g.beginPath();
      for (let i = 1; i < 4; i++) {
        g.moveTo(0, (H / 4) * i + 0.5); g.lineTo(W, (H / 4) * i + 0.5);
        g.moveTo((W / 4) * i + 0.5, 0); g.lineTo((W / 4) * i + 0.5, H);
      }
      g.stroke();
    }

    function drawAmbience(f, bass) {
      fadeTrails(0.28);
      const cx = W / 2, cy = H / 2;
      const rays = 48;
      const base = Math.min(W, H) * (0.12 + bass * 0.08);
      spin += 0.004 + bass * 0.02;
      g.globalCompositeOperation = "lighter";
      g.lineCap = "round";
      for (let i = 0; i < rays; i++) {
        const mirror = i < rays / 2 ? i : rays - 1 - i; // symmetric
        const v = f[4 + mirror * 3] / 255;
        const a = (i / rays) * Math.PI * 2 + spin;
        const len = base + v * Math.min(W, H) * 0.3;
        g.strokeStyle = i % 2 ? colors[0] : colors[1];
        g.globalAlpha = 0.15 + v * 0.45;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * base * 0.6, cy + Math.sin(a) * base * 0.6);
        g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        g.stroke();
      }
      g.globalAlpha = 0.5 + bass * 0.5;
      g.fillStyle = colors[1];
      g.beginPath();
      g.arc(cx, cy, base * 0.45, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }

    function drawStatic() {
      const id = g.createImageData(W, H);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 200;
      }
      g.putImageData(id, 0, 0);
    }

    function frame(now) {
      raf = 0;
      if (!running) return;
      if (wrap.offsetParent === null || !sizeCanvas()) { schedule(); return; }

      if (switchFrames > 0) {
        switchFrames--;
        drawStatic();
        if (switchFrames === 0) g.clearRect(0, 0, W, H);
        schedule();
        return;
      }

      const { f, w } = sample(now);
      const bass = bandLevel(f, 1, 8);
      if (!reducedMotion) wrap.style.setProperty("--pulse", bass.toFixed(3));

      if (style === "scope") drawScope(w);
      else if (style === "ambience") drawAmbience(f, bass);
      else drawBars(f);

      if (audio.paused) {
        fadeFrames--;
        if (fadeFrames <= 0) { running = false; wrap.style.setProperty("--pulse", "0"); return; }
      }
      schedule();
    }

    function schedule() { if (!raf) raf = requestAnimationFrame(frame); }
    function start() { running = true; fadeFrames = 40; schedule(); }

    audio.addEventListener("play", () => {
      connect();
      if (sharedCtx && sharedCtx.state === "suspended") sharedCtx.resume();
      wrap.classList.add("is-live");
      start();
    });
    audio.addEventListener("pause", () => { fadeFrames = 40; wrap.classList.remove("is-live"); });

    function showArt(src) {
      const useVideo = isVideo(src);
      const target = useVideo ? vid : img;
      const onReady = () => {
        const c = extractColors(target);
        if (c && !currentTrack.colors) setColors(c);
      };
      if (useVideo) {
        img.style.display = "none";
        vid.style.display = "block";
        vid.src = src;
        vid.addEventListener("loadeddata", onReady, { once: true });
        vid.play().catch(() => {});
      } else {
        vid.pause();
        vid.removeAttribute("src");
        vid.style.display = "none";
        img.style.display = "block";
        img.addEventListener("load", onReady, { once: true });
        img.src = src;
      }
    }

    function setColors(c) {
      colors = c;
      wrap.style.setProperty("--viz-main", c[0]);
      wrap.style.setProperty("--viz-hi", c[1]);
    }

    let currentTrack = {};
    function setTrack(t) {
      currentTrack = t || {};
      style = currentTrack.viz || "bars";
      setColors(currentTrack.colors || DEFAULT_COLORS);
      peaks.fill(0);
      silentFrames = 0;
      showArt(currentTrack.art || placeholder);

      // channel-change moment: a quick burst of static + tube flicker
      g.clearRect(0, 0, W, H);
      if (!reducedMotion) {
        switchFrames = 8;
        tube.classList.remove("crt-switch");
        void tube.offsetWidth;
        tube.classList.add("crt-switch");
        running = true;
        fadeFrames = 40;
        schedule();
      }
    }

    function reset() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      g.clearRect(0, 0, W, H);
      wrap.classList.remove("is-live");
      wrap.style.setProperty("--pulse", "0");
      currentTrack = {};
      setColors(DEFAULT_COLORS);
      showArt(placeholder);
    }

    img.src = placeholder;
    return { setTrack, reset };
  }

  window.XPViz = { create, normalize };
})();
