document.addEventListener("DOMContentLoaded", () => {
  // SCALE DESKTOP TO FIT WINDOW WITH 4:3 ASPECT RATIO
  function scaleDesktop() {
    const root = document.getElementById("desktop-root");
    const ratio = 4 / 3;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = Math.min(w / 1024, h / 768);
    root.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
  }

  window.addEventListener("resize", scaleDesktop);
  scaleDesktop();

  // START MENU TOGGLE
  const startButton = document.querySelector(".start-button");
  const startMenu = document.getElementById("start-menu");

  startButton.addEventListener("click", () => {
    startMenu.classList.toggle("visible");
  });

  // CLOCK
  const clock = document.querySelector(".time");
  function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = now.getHours() >= 12 ? "PM" : "AM";
    clock.textContent = `${hours}:${minutes} ${ampm}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // MUSIC PLAYER FUNCTIONALITY
  const playerWin = document.getElementById("music-player");
  const dragHandle = document.getElementById("music-drag-handle");
  const recycleBin = document.querySelector(".icon.recycle-bin");
  const closeBtn = document.getElementById("close-player");
  const musicTab = document.getElementById("music-tab");
  const audio = document.getElementById("audio-player");
  const title = document.getElementById("track-title");
  const cover = document.getElementById("track-cover");
  const playBtn = document.getElementById("play-btn");
  const volumeSlider = document.getElementById("volume-slider");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

const tracks = [
  {
    src: "assets/music1.mp3",
    title: "CHRYSTAL - The Days (Notion Remix)",
    coverSrc: "assets/music1.webm",
    coverType: "video"
  },
  {
    src: "assets/music2.mp3",
    title: "LUCKI - Alternative Outro [Instrumental]",
    coverSrc: "assets/cover2.png",
    coverType: "image"
  },
  {
    src: "assets/music3.mp3",
    title: "The Backseat Lovers - Growing/Dying",
    coverSrc: "assets/cover3.png",
    coverType: "image"
  }
];

  let current = 0;
  let isDragging = false;
  let offsetX = 0, offsetY = 0;
  let isMinimized = false;
  let hasPositioned = false;

  function centerPlayerOnce() {
    if (hasPositioned) return;
    const root = document.getElementById('desktop-root');
    const rootRect = root.getBoundingClientRect();
    const playerWidth = playerWin.offsetWidth || 280;
    const playerHeight = playerWin.offsetHeight || 220;
    const left = (rootRect.width - playerWidth) / 2;
    const top = (rootRect.height - playerHeight) / 2;
    playerWin.style.left = `${left}px`;
    playerWin.style.top = `${top}px`;
    hasPositioned = true;
  }

  function openPlayer() {
    centerPlayerOnce();
    playerWin.style.display = 'flex';
    playerWin.classList.add('show');
    if (isMinimized) {
      isMinimized = false;
      return;
    }
    loadTrack(current);
    playTrack();
    if (musicTab) musicTab.style.display = 'inline-flex';
  }

function loadTrack(i) {
  current = (i + tracks.length) % tracks.length;
  const t = tracks[current];
  audio.src = t.src;
  title.textContent = t.title;

  const img = document.getElementById("track-cover-img");
  const video = document.getElementById("track-cover-video");

  if (t.coverType === "image") {
    img.src = t.coverSrc;
    img.style.display = "block";
    video.style.display = "none";
    video.pause();
  } else {
    video.src = t.coverSrc;
    video.style.display = "block";
    img.style.display = "none";
    video.play();
  }
}

  function playTrack() {
    audio.play();
    playBtn.textContent = '⏸';
  }

  function togglePlay() {
    if (audio.paused) playTrack();
    else {
      audio.pause();
      playBtn.textContent = '▶';
    }
  }

  function minimizePlayer() {
    playerWin.classList.remove('show');
    playerWin.style.display = 'none';
    isMinimized = true;
  }

function closePlayer() {
  audio.pause();
  audio.currentTime = 0;
  audio.src = '';
  current = 0;
  title.textContent = 'Track Title';

  const img = document.getElementById("track-cover-img");
  const video = document.getElementById("track-cover-video");

  img.src = 'assets/cover-placeholder.png';
  img.style.display = 'block';
  video.src = '';
  video.style.display = 'none';

  playerWin.classList.remove('show');
  playerWin.style.display = 'none';
  isMinimized = false;
  hasPositioned = false;

  if (musicTab) musicTab.style.display = 'none';
}

  // Dragging logic
  dragHandle.addEventListener("mousedown", (e) => {
    const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
    const winRect = playerWin.getBoundingClientRect();
    offsetX = e.clientX - winRect.left;
    offsetY = e.clientY - winRect.top;
    isDragging = true;

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
  });

  function onDrag(e) {
    if (!isDragging) return;
    const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
    const newLeft = e.clientX - rootRect.left - offsetX;
    const newTop = e.clientY - rootRect.top - offsetY;
    playerWin.style.left = `${newLeft}px`;
    playerWin.style.top = `${newTop}px`;
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
  }

  recycleBin.ondblclick = openPlayer;
  closeBtn.onclick = closePlayer;
  musicTab.onclick = () => {
    if (isMinimized) {
      playerWin.style.display = 'flex';
      requestAnimationFrame(() => playerWin.classList.add('show'));
      isMinimized = false;
    } else {
      minimizePlayer();
    }
  };

  playBtn.onclick = togglePlay;
  volumeSlider.oninput = () => audio.volume = volumeSlider.value;
  audio.onended = () => nextBtn.click();
  prevBtn.onclick = () => { loadTrack(current - 1); playTrack(); };
  nextBtn.onclick = () => { loadTrack(current + 1); playTrack(); };
});
// ==============================
// CONSISTENCYY BROWSER WINDOW
// ==============================
const consistencyTab = document.getElementById("consistency-tab");
const browserWindow = document.getElementById("browser-window");
const mockYoutube = document.getElementById("mock-youtube");
const internetHome = document.getElementById("internet-home");
const fakeLoading = document.getElementById("fake-loading");
const browserHeader = document.querySelector("#browser-window .window-header");
const tabs = document.querySelectorAll(".yt-tab");
const sections = document.querySelectorAll(".yt-section");
const backButton = document.getElementById("ie-back-button");

let browserMinimized = false;
let isDraggingBrowser = false;
let offsetXBrowser = 0;
let offsetYBrowser = 0;
let currentView = "home";
let parallaxPaused = false;

function openBrowserWindow() {
  browserWindow.classList.remove("hidden");
  browserWindow.style.display = "flex";

  if (browserMinimized) {
    browserMinimized = false;
    updateBrowserView(currentView);
    return;
  }

  mockYoutube.style.display = "none";
  internetHome.style.display = "none";
  fakeLoading.style.display = "flex";

  setTimeout(() => {
    fakeLoading.style.display = "none";
    updateBrowserView("home");
  }, 4500);
}

function closeBrowser() {
  browserWindow.style.display = "none";
  mockYoutube.classList.add("hidden");
  internetHome.classList.add("hidden");
  fakeLoading.style.display = "none";
  browserMinimized = false;
  currentView = "home";
}

function minimizeBrowser() {
  browserWindow.style.display = "none";
  browserMinimized = true;
}

function updateBrowserView(view) {
  mockYoutube.style.display = "none";
  internetHome.style.display = "none";

  if (view === "channel") {
    mockYoutube.style.display = "flex";
  } else {
    internetHome.style.display = "flex";
  }

  currentView = view;
}

if (consistencyTab) {
  consistencyTab.addEventListener("click", openBrowserWindow);
}

// Draggable Internet Explorer window
browserHeader.addEventListener("mousedown", (e) => {
  const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
  const winRect = browserWindow.getBoundingClientRect();
  offsetXBrowser = e.clientX - winRect.left;
  offsetYBrowser = e.clientY - winRect.top;
  isDraggingBrowser = true;

  document.addEventListener("mousemove", onDragBrowser);
  document.addEventListener("mouseup", stopDragBrowser);
});

function onDragBrowser(e) {
  if (!isDraggingBrowser) return;
  const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
  const newLeft = e.clientX - rootRect.left - offsetXBrowser;
  const newTop = e.clientY - rootRect.top - offsetYBrowser;
  browserWindow.style.left = `${newLeft}px`;
  browserWindow.style.top = `${newTop}px`;
}

function stopDragBrowser() {
  isDraggingBrowser = false;
  document.removeEventListener("mousemove", onDragBrowser);
  document.removeEventListener("mouseup", stopDragBrowser);
}

// Tab switch logic for YouTube mock
if (tabs.length) {
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.target;
      sections.forEach(sec => {
        sec.style.display = sec.id === target ? "grid" : "none";
      });
    });
  });
}

// Bookmark launcher example (e.g. YouTube channel tab)
function openChannel() {
  updateBrowserView("channel");
}

if (backButton) {
  backButton.addEventListener("click", () => updateBrowserView("home"));
}

// ==============================
// PARALLAX EFFECT (pauses on browser hover)
// ==============================
const desktopRoot = document.getElementById("desktop-root");

browserWindow.addEventListener("mouseenter", () => parallaxPaused = true);
browserWindow.addEventListener("mouseleave", () => parallaxPaused = false);

document.addEventListener("mousemove", (e) => {
  if (parallaxPaused) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x = (e.clientX / vw - 0.5) * 2;
  const y = (e.clientY / vh - 0.5) * 2;

  const back = document.querySelector('.parallax.back');
  const mid  = document.querySelector('.parallax.mid');
  const fore = document.querySelector('.parallax.fore');

  if (back) back.style.transform = `translate(${x * 10}px, ${y * 10}px) scale(1)`;
  if (mid)  mid.style.transform  = `translate(${x * 20}px, ${y * 20}px) scale(1.1)`;
  if (fore) fore.style.transform = `translate(${x * 30}px, ${y * 30}px) scale(1.2)`;
});
