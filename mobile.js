// ---- Detect WebM Support ----
function supportsWebM() {
  const video = document.createElement('video');
  return video.canPlayType('video/webm; codecs="vp8, vorbis"') !== "";
}

// ---- Request Motion Permission on iOS ----
function requestMotionPermission() {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          document.getElementById('motion-permission').classList.add('hidden');
        }
      })
      .catch(console.error);
  }
}

// ---- Load Parallax Video Layers If Supported ----
function loadParallaxVideos() {
  if (!supportsWebM()) {
    console.log("WebM not supported. Using PNG fallback for all layers.");
    return;
  }

  const container = document.getElementById('parallax-fore');
  if (!container) return;

  const video = document.createElement('video');
  video.src = 'assets/fore.webm';
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.classList.add('parallax-video');

  container.appendChild(video);
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

// ---- App Open/Close Logic ----
function openMobileApp(id) {
  document.getElementById("app-" + id).classList.remove("hidden");
}

function closeMobileApp(id) {
  document.getElementById("app-" + id).classList.add("hidden");
}

// ---- Init ----
window.addEventListener('DOMContentLoaded', () => {
  loadParallaxVideos();

  // Only show motion prompt if required (iOS)
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    document.getElementById('motion-permission').classList.remove('hidden');
  }
});
