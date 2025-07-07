// ---- Detect WebM Support ----
function supportsWebM() {
  const video = document.createElement('video');
  return video.canPlayType('video/webm; codecs="vp8, vorbis"') !== "";
}

// ---- Load Parallax Video Layers If Supported ----
function loadParallaxVideos() {
  if (!supportsWebM()) {
    console.log("WebM not supported. Falling back to PNG backgrounds.");
    return;
  }

  const layers = [
    { id: 'parallax-back', src: 'assets/back.webm' },
    { id: 'parallax-mid',  src: 'assets/mid.webm' },
    { id: 'parallax-fore', src: 'assets/fore.webm' }
  ];

  layers.forEach(layer => {
    const container = document.getElementById(layer.id);
    if (!container) return;

    const video = document.createElement('video');
    video.src = layer.src;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.classList.add('parallax-video');
    container.appendChild(video);
  });
}

// ---- Parallax via Device Orientation ----
window.addEventListener("deviceorientation", (e) => {
  const x = e.gamma / 45; // side tilt
  const y = e.beta / 90;  // forward/back tilt

  const back = document.getElementById('parallax-back');
  const mid  = document.getElementById('parallax-mid');
  const fore = document.getElementById('parallax-fore');

  if (back) back.style.transform = `translate(${x * 10}px, ${y * 10}px) scale(1)`;
  if (mid)  mid.style.transform  = `translate(${x * 20}px, ${y * 20}px) scale(1.1)`;
  if (fore) fore.style.transform = `translate(${x * 30}px, ${y * 30}px) scale(1.2)`;
});

// ---- App Logic (unchanged) ----
function openMobileApp(id) {
  document.getElementById("app-" + id).classList.remove("hidden");
}

function closeMobileApp(id) {
  document.getElementById("app-" + id).classList.add("hidden");
}

// Request motion access on iOS
function requestMotionPermission() {
  if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response === "granted") {
          console.log("Motion permission granted");
        }
      })
      .catch(console.error);
  }
}

// ---- Init Everything ----
window.addEventListener("DOMContentLoaded", () => {
document.body.addEventListener("click", requestMotionPermission, { once: true });
  loadParallaxVideos();
});
