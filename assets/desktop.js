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

  // Restore Readme and desktop icon/tab interactivity after all functions are defined
  openReadme();

let browserInitialized = false;

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

// === App Launcher Buttons ===
document.getElementById("open-calculator")?.addEventListener("click", openCalculatorApp);
document.getElementById("calculator-tab")?.addEventListener("click", toggleCalculatorApp);

document.getElementById("open-paint")?.addEventListener("click", openPaintApp);
document.getElementById("paint-tab")?.addEventListener("click", togglePaintApp);

document.getElementById("open-snake")?.addEventListener("click", openSnakeApp);
document.getElementById("snake-tab")?.addEventListener("click", toggleSnakeApp);

document.getElementById("open-photos")?.addEventListener("click", openPhotosApp);
document.getElementById("photos-tab")?.addEventListener("click", togglePhotosApp);
document.getElementById("photos-close")?.addEventListener("click", closePhotosApp);

document.getElementById("open-videos")?.addEventListener("click", openVideosApp);
document.getElementById("videos-tab")?.addEventListener("click", toggleVideosApp);
document.getElementById("videos-close")?.addEventListener("click", closeVideosApp);

});

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
    title: "eery - Her",
    coverSrc: "assets/music2.webm",
    coverType: "video"
  },
  {
    src: "assets/music3.mp3",
    title: "The Backseat Lovers - Slowing Down",
    coverSrc: "assets/music3.webm",
    coverType: "video"
  }
];

  let current = 0;
  let isDragging = false;
  let offsetX = 0, offsetY = 0;
  let isMinimized = false;
  let hasPositioned = false;

  function openPlayer() {
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
const wikipediaBookmark = document.getElementById("wikipedia-bookmark");

if (wikipediaBookmark) {
  wikipediaBookmark.addEventListener("click", () => {
    updateBrowserView("wikipedia");
  });
}

let browserMinimized = false;
let isDraggingBrowser = false;
let offsetXBrowser = 0;
let offsetYBrowser = 0;
let currentView = "home";
let parallaxPaused = false;

function openBrowserWindow() {
  if (browserWindow.style.display === "flex") {
    minimizeBrowser();
    return;
  }

  browserWindow.classList.remove("hidden");
  browserWindow.style.display = "flex";

  if (browserMinimized) {
    browserMinimized = false;

    // Reopen last view ONLY if it's channel or video
    if (currentView === "channel" || currentView === "video") {
      updateBrowserView(currentView);
    } else {
      // Always go to home for any other minimized view
      currentView = "home";
      updateBrowserView("home");
    }

    return;
  }

  // COLD OPEN (show loading screen, go to homepage)
  fakeLoading.style.display = "flex";
  internetHome.style.display = "none";
  mockYoutube.style.display = "none";
  mockVideoPlayer.style.display = "none";
  const mockWikipedia = document.getElementById("mock-wikipedia");
  if (mockWikipedia) mockWikipedia.style.display = "none";

setTimeout(() => {
  fakeLoading.style.display = "none";
  internetHome.classList.remove("hidden"); // ← THIS is the fix
  currentView = "home";
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
  const mockWikipedia = document.getElementById("mock-wikipedia");

  // Hide all views first
  mockYoutube.style.display = "none";
  internetHome.style.display = "none";
  mockVideoPlayer.style.display = "none";
  if (mockWikipedia) mockWikipedia.style.display = "none";

  mockYoutube.classList.add("hidden");
  internetHome.classList.add("hidden");
  mockVideoPlayer.classList.add("hidden");
  if (mockWikipedia) mockWikipedia.classList.add("hidden");

  // Show the appropriate view
  if (view === "channel") {
    mockYoutube.style.display = "flex";
    mockYoutube.classList.remove("hidden");
  } else if (view === "wikipedia") {
    if (mockWikipedia) {
      mockWikipedia.style.display = "flex";
      mockWikipedia.classList.remove("hidden");
    }
  } else if (view === "video") {
    mockVideoPlayer.style.display = "flex";
    mockVideoPlayer.classList.remove("hidden");
  } else {
    internetHome.style.display = "flex";
    internetHome.classList.remove("hidden");
  }

  currentView = view;
}

// Keep existing consistency tab behavior
if (consistencyTab) {
  consistencyTab.addEventListener("click", openBrowserWindow);
}

// Draggable Internet Explorer window
browserHeader.addEventListener("mousedown", (e) => {
  // Prevent dragging if clicking inside the search input
  if (e.target.closest(".spoof-search")) return;

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
      // Switch active tab styling
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.dataset.target;

      // Hide all sections
      sections.forEach(sec => {
        sec.style.display = "none";
      });

      // Show the selected section (let CSS handle display type)
      const targetSection = document.getElementById(target);
      if (targetSection) {
        targetSection.style.display = ""; // revert to CSS default (like flex/grid)
      }
    });
  });
}

// Bookmark launcher example (e.g. YouTube channel tab)
function openChannel() {
  updateBrowserView("channel");
}

if (backButton) {
  backButton.addEventListener("click", () => {
    // If watching a video, stop playback
    if (currentView === "video") {
      ytIframe.src = ""; // unload the video
      mockVideoPlayer.style.display = "none"; // hide video player
    }

    // Always go back to homepage
    updateBrowserView("home");
  });
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

const fileExplorer = document.getElementById("file-explorer-window");

if (fileExplorer) {
  fileExplorer.addEventListener("mouseenter", () => parallaxPaused = true);
  fileExplorer.addEventListener("mouseleave", () => parallaxPaused = false);
}

// README WINDOW FUNCTIONALITY
const readmeWin = document.getElementById("readme-window");
const readmeIcon = document.querySelector(".icon.mixed-media");
const readmeClose = document.getElementById("readme-close");
const readmeTab = document.getElementById("readme-tab");
const readmeDragHandle = document.getElementById("readme-drag-handle");

let isReadmeDragging = false;
let readmeOffsetX = 0, readmeOffsetY = 0;
let isReadmeMinimized = false;
let hasReadmePositioned = false;


function openReadme() {
  readmeWin.style.display = "flex";
  if (readmeTab) readmeTab.style.display = "inline-flex";
}

function closeReadme() {
  readmeWin.style.display = "none";
  if (readmeTab) readmeTab.style.display = "none";
  isReadmeMinimized = false;
  hasReadmePositioned = false;
}

function minimizeReadme() {
  readmeWin.style.display = "none";
  isReadmeMinimized = true;
}

readmeClose.onclick = closeReadme;

readmeTab.onclick = () => {
  if (isReadmeMinimized) {
    readmeWin.style.display = 'flex';
    requestAnimationFrame(() => readmeWin.classList.add('show'));
    isReadmeMinimized = false;
  } else {
    minimizeReadme();
  }
};

// Drag-and-drop for readme window
readmeDragHandle.addEventListener("mousedown", (e) => {
  const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
  const winRect = readmeWin.getBoundingClientRect();
  readmeOffsetX = e.clientX - winRect.left;
  readmeOffsetY = e.clientY - winRect.top;
  isReadmeDragging = true;

  document.addEventListener("mousemove", dragReadme);
  document.addEventListener("mouseup", stopDragReadme);
});

function dragReadme(e) {
  if (!isReadmeDragging) return;
  const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
  const newLeft = e.clientX - rootRect.left - readmeOffsetX;
  const newTop = e.clientY - rootRect.top - readmeOffsetY;
  readmeWin.style.left = `${newLeft}px`;
  readmeWin.style.top = `${newTop}px`;
}

function stopDragReadme() {
  isReadmeDragging = false;
  document.removeEventListener("mousemove", dragReadme);
  document.removeEventListener("mouseup", stopDragReadme);
}

// ✅ Double-click on the desktop icon opens readme
if (readmeIcon) {
  readmeIcon.ondblclick = openReadme;
}

function openConsistency() {
  const browserWindow = document.getElementById("browser-window");
  const fakeLoading = document.getElementById("fake-loading");
  const internetHome = document.getElementById("internet-home");
  const mockYoutube = document.getElementById("mock-youtube");
  const mockWikipedia = document.getElementById("mock-wikipedia");

  browserWindow.classList.remove("hidden");
  browserWindow.style.display = "flex";

  // Hide everything
  fakeLoading.style.display = "flex";
  internetHome.style.display = "none";
  mockYoutube.style.display = "none";
  if (mockWikipedia) mockWikipedia.style.display = "none";

  internetHome.classList.add("hidden");
  mockYoutube.classList.add("hidden");
  if (mockWikipedia) mockWikipedia.classList.add("hidden");

  setTimeout(() => {
    fakeLoading.style.display = "none";
    mockYoutube.style.display = "flex";
    mockYoutube.classList.remove("hidden");
  }, 3200);
}

// FILE EXPLORER FUNCTIONALITY
const fileExplorerWin = document.getElementById("file-explorer-window");
const prodIcon = document.querySelector(".icon.my-computer");
const motionIcon = document.querySelector(".icon.my-network");
const designIcon = document.querySelector(".icon.note-pad");
const fileExplorerTab = document.getElementById("mixed-tab");
const fileExplorerClose = document.getElementById("file-explorer-close");
const fileExplorerDragHandle = document.getElementById("file-explorer-drag-handle");

const rootView = document.getElementById("file-explorer-root");
const categoryViews = {
  design: document.getElementById("category-design"),
  motion: document.getElementById("category-motion"),
  film: document.getElementById("category-film"),
};

let isFileExplorerDragging = false;
let explorerOffsetX = 0, explorerOffsetY = 0;
let isFileExplorerMinimized = false;
let hasFileExplorerPositioned = false;

// Show file explorer window (initial or restore)
function openFileExplorer() {
  fileExplorerWin.style.display = "flex";
  fileExplorerTab.style.display = "inline-flex";
}

fileExplorerTab.onclick = () => {
  const isHidden = fileExplorerWin.style.display === "none" || fileExplorerWin.classList.contains("hidden");

  if (isHidden || isFileExplorerMinimized) {
    fileExplorerWin.style.display = "flex";
    fileExplorerWin.classList.add("show");
    isFileExplorerMinimized = false;
  } else {
    fileExplorerWin.style.display = "none";
    isFileExplorerMinimized = true;
  }
};

// Close button
fileExplorerClose.onclick = () => {
  fileExplorerWin.style.display = "none";
  // DO NOT hide tab — keep it visible so user can reopen
  isFileExplorerMinimized = true; // act like minimize
  // Keep position so it's restored where it was
  backToRoot();
};

// Open category folder
function openCategory(category) {
  rootView.style.display = "none";
  Object.values(categoryViews).forEach(view => view.style.display = "none");
  const view = categoryViews[category];
  if (view) view.style.display = "flex";
}

// Go back to root folder
function backToRoot() {
  rootView.style.display = "flex";
  Object.values(categoryViews).forEach(view => view.style.display = "none");
}

// Project Navigation State
const projectMap = {
  design: ['design-1', 'design-2', 'design-3'],
  motion: ['motion-1', 'motion-2', 'motion-3'],
  film: ['film-1', 'film-2', 'film-3']
};

let currentProject = null;
let currentCategory = null;

function openProject(projectId) {
  // Hide everything else
  rootView.style.display = "none";
  Object.values(categoryViews).forEach(v => v.style.display = "none");

  // ✅ This now works reliably
  document.querySelectorAll(".project-view").forEach(v => v.style.display = "none");

  const projectView = document.getElementById(`project-${projectId}`);
  if (projectView) projectView.style.display = "flex";

  currentProject = projectId;
  currentCategory = Object.keys(projectMap).find(cat => projectMap[cat].includes(projectId));
}

function closeProject(projectId) {
  const view = document.getElementById(`project-${projectId}`);
  if (view) view.style.display = "none";
}

function backToCategory() {
  if (!currentCategory || !currentProject) return;

  // ✅ Actually hide the current project view
  const view = document.getElementById(`project-${currentProject}`);
  if (view) view.style.display = "none";

  // ✅ Show the category view again
  openCategory(currentCategory);

  currentProject = null;
}

// DRAGGING LOGIC
fileExplorerDragHandle.addEventListener("mousedown", (e) => {
  const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
  const winRect = fileExplorerWin.getBoundingClientRect();
  explorerOffsetX = e.clientX - winRect.left;
  explorerOffsetY = e.clientY - winRect.top;
  isFileExplorerDragging = true;

  document.addEventListener("mousemove", dragFileExplorer);
  document.addEventListener("mouseup", stopDragFileExplorer);
});

function dragFileExplorer(e) {
  if (!isFileExplorerDragging) return;
  const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
  const newLeft = e.clientX - rootRect.left - explorerOffsetX;
  const newTop = e.clientY - rootRect.top - explorerOffsetY;
  fileExplorerWin.style.left = `${newLeft}px`;
  fileExplorerWin.style.top = `${newTop}px`;
}

function stopDragFileExplorer() {
  isFileExplorerDragging = false;
  document.removeEventListener("mousemove", dragFileExplorer);
  document.removeEventListener("mouseup", stopDragFileExplorer);
}

document.querySelector(".icon.my-files")?.addEventListener("onclick", openFileExplorer);


// INITIALIZE: You can trigger this from your desktop icon too
// Example: document.querySelector(".icon.my-files").ondblclick = openFileExplorer;

const ProjectIcon = document.querySelector(".icon.Projects");
const ieIcon = document.querySelector(".icon.internet-explorer");
const projectsBookmark = document.getElementById("projects-bookmark");

if (projectsBookmark) {
  projectsBookmark.addEventListener("click", () => {
    openFileExplorer();       // ✅ Brings up file explorer
  });
}

if (ProjectIcon) {
  ProjectIcon.addEventListener("dblclick", openFileExplorer);
}

if (ieIcon) {
  ieIcon.addEventListener("dblclick", openBrowserWindow);
}

// ==============================
// YouTube Video Player Logic
// ==============================

const mockVideoPlayer = document.getElementById("mock-video-player");
const ytIframe = document.getElementById("yt-iframe");
const videoTitle = document.getElementById("video-title");
const videoCaption = document.getElementById("video-caption");
const videoDate = document.getElementById("video-date"); // <== Make sure this exists!

// Full video list with upload dates
const ytVideos = [
  {
    title: "VG Concept Pixel Art",
    caption: "A short pixel animation concept.",
    url: "https://www.youtube.com/embed/KNtCdSNIqMk?si=E2iNGArACRcTONzm",
    date: "March 5, 2024"
  },
  {
    title: "Eminem If he was RESONANCE",
    caption: "Unofficial music video mashup.",
    url: "https://www.youtube.com/embed/07Qr8RwWeMc?si=owAMy-g-jop5A79J",
    date: "April 2, 2024"
  },
  {
    title: "Jean Dawson — POWER FREAKS",
    caption: "Unofficial Visualizer for Jean Dawson.",
    url: "https://www.youtube.com/embed/Rlmc4TMsFGU?si=B7eWIVpseuJKff6i",
    date: "March 19, 2024"
  },
  {
    title: "world$tar money - channel bumper",
    caption: "Channel bumper using Joji's iconic track.",
    url: "https://www.youtube.com/embed/jxZKUgziw9E?si=-CemHXC4h8SqA1Ji",
    date: "February 28, 2024"
  },
  {
    title: "KENDRICK LAMAR - FOR SALE?",
    caption: "Unofficial music video for 'For Sale?' interlude.",
    url: "https://www.youtube.com/embed/2Eay_dH9Hv4?si=ngVgJ5vuxyHg68PY",
    date: "March 12, 2024"
  },
  {
    title: "TAKE OFF.",
    caption: "Short animated experimental video.",
    url: "https://www.youtube.com/embed/s6Ca5NciGuo?si=HNr12i8Zz2whYmhI",
    date: "April 9, 2024"
  },
  {
    title: "somethings always wrong with his brain",
    caption: "Dark experimental montage short.",
    url: "https://youtube.com/embed/OcRxtFL9nck?si=lXkYWr0clBCjr509",
    date: "March 25, 2024"
  },
  {
    title: "WHATS YOUR DEFINITION OF LOVE?",
    caption: "Visual essay exploring the idea of love.",
    url: "https://youtube.com/embed/hw7YMhge0t0?si=NEb_17OJHn4GhGYK",
    date: "February 14, 2024"
  },
  {
    title: "the burn marks on my memories never fade",
    caption: "Conceptual poetry short film.",
    url: "https://www.youtube.com/embed/tUH_49myQI0?si=1P6eOAClmVz0a7md",
    date: "March 8, 2024"
  },
  {
    title: "Resonance nights",
    caption: "Conceptual poetry short film.",
    url: "https://www.youtube.com/embed/MGcQOrnC9Tk",
    date: "April 11, 2024"
  },
  {
    title: "Take Off (Cooking)",
    caption: "Experimental cooking short.",
    url: "https://www.youtube.com/embed/Sov7rcHr3tM",
    date: "April 1, 2024"
  },
  {
    title: "Spacing Out",
    caption: "Dreamy motion test.",
    url: "https://www.youtube.com/embed/4S5iAtoSi2E",
    date: "March 29, 2024"
  },
  {
    title: "Medicine - Daughter [MV/Cover]",
    caption: "Cover of 'Medicine' by Daughter.",
    url: "https://www.youtube.com/embed/k_G4np3jvZU?si=nmD3c326qB64t-2-",
    date: "February 8, 2024"
  },
  {
    title: "MGMT - Little Dark Age (Prødigy Remix) MUSIC VIDEO",
    caption: "A remix of 'Little Dark Age' by MGMT.",
    url: "https://www.youtube.com/embed/yUKtuTdMKUY?si=wI-QF7DVja9H1-MP",
    date: "January 30, 2024"
  },
  {
    title: "mounika - cut my hair (music video)",
    caption: "A music video for 'cut my hair' by mounika.",
    url: "https://www.youtube.com/embed/tUH_49myQI0?si=StU1veBB6mc2A3ab",
    date: "March 3, 2024"
  }
];

// Universal click handler
function bindVideoThumbnails() {
  const thumbs = document.querySelectorAll(".video-thumb");

  thumbs.forEach((thumb) => {
    const index = thumb.dataset.index;
    if (index !== undefined && ytVideos[index]) {
      thumb.addEventListener("click", () => {
        const video = ytVideos[index];

        ytIframe.src = video.url;
        videoTitle.textContent = video.title;
        videoCaption.textContent = video.caption;
        if (videoDate) {
          videoDate.textContent = video.date || "Unknown date";
        }

        mockYoutube.style.display = "none";
        updateBrowserView("video");
      });
    }
  });
}

// Make sure it's triggered after content is present
bindVideoThumbnails();

function closeVideoPlayer() {
  ytIframe.src = ""; // Stop the video
  updateBrowserView("channel"); // Switch back to channel view
}

const conorIcon = document.getElementById("conor-icon");

if (conorIcon) {
  conorIcon.addEventListener("dblclick", () => {
    const browserWindow = document.getElementById("browser-window");
    const fakeLoading = document.getElementById("fake-loading");
    const internetHome = document.getElementById("internet-home");
    const mockYoutube = document.getElementById("mock-youtube");
    const mockWikipedia = document.getElementById("mock-wikipedia"); // class is wikipedia-mock, but ID is correct

    browserWindow.classList.remove("hidden");
    browserWindow.style.display = "flex";

    // Hide everything else initially
    fakeLoading.style.display = "flex";
    internetHome.style.display = "none";
    mockYoutube.style.display = "none";
    if (mockWikipedia) mockWikipedia.style.display = "none";

    // After delay, show Wikipedia mock
    setTimeout(() => {
      fakeLoading.style.display = "none";
      if (mockWikipedia) mockWikipedia.style.display = "flex";
      mockYoutube.style.display = "none";
      internetHome.style.display = "none";
    }, 4500); // match loading duration
  });
}

// Enable clicking playlist tiles to open in new tab
document.querySelectorAll(".playlist-link").forEach(tile => {
  tile.addEventListener("click", () => {
    const url = tile.getAttribute("data-url");
    if (url) window.open(url, "_blank");
  });
});

// Enable Search functionality
const searchInput = document.getElementById("internet-search-input");
const searchBtn = document.getElementById("internet-search-btn");

if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      window.open(url, "_blank");
    }
  });

  // Optional: Pressing Enter triggers search
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchBtn.click();
  });
}

const luckyBtn = document.getElementById("internet-lucky-btn");

if (luckyBtn && searchInput) {
  luckyBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
      const luckyURL = `https://www.google.com/search?btnI=I&q=${encodeURIComponent(query)}`;
      window.open(luckyURL, "_blank");
    }
  });
}

const spoofSearch = document.querySelector(".spoof-search");

if (spoofSearch) {
  spoofSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = spoofSearch.value.trim();
      if (query) {
        const searchURL = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(searchURL, "_blank");
      }
    }
  });
}

// === Calculator App ===
function openCalculatorApp() {
  document.getElementById("calculator-app").classList.remove("hidden");
  document.getElementById("calculator-tab").style.display = "inline-flex";
}
function toggleCalculatorApp() {
  const app = document.getElementById("calculator-app");
  app.classList.toggle("hidden");
}

// === Paint App ===
function openPaintApp() {
  document.getElementById("paint-app").classList.remove("hidden");
  document.getElementById("paint-tab").style.display = "inline-flex";
}
function togglePaintApp() {
  const app = document.getElementById("paint-app");
  app.classList.toggle("hidden");
}
function closePaintApp() {
  document.getElementById("paint-app").classList.add("hidden");
  document.getElementById("paint-tab").style.display = "none";
}

// === Snake App ===
function openSnakeApp() {
  document.getElementById("snake-app").classList.remove("hidden");
  document.getElementById("snake-start-overlay").classList.remove("hidden");
  document.getElementById("snake-tab").style.display = "inline-flex";
}
function toggleSnakeApp() {
  const app = document.getElementById("snake-app");
  app.classList.toggle("hidden");
}
function closeSnakeApp() {
  document.getElementById("snake-app").classList.add("hidden");
  document.getElementById("snake-tab").style.display = "none";
}
function closeSnakeModal() {
  document.getElementById("snake-lose-modal").classList.add("hidden");
}

// === Photos App ===
function openPhotosApp() {
  document.getElementById("photos-app").classList.remove("hidden");
  document.getElementById("photos-tab").style.display = "inline-flex";
}
function togglePhotosApp() {
  document.getElementById("photos-app").classList.toggle("hidden");
}
function closePhotosApp() {
  document.getElementById("photos-app").classList.add("hidden");
  document.getElementById("photos-tab").style.display = "none";
}

// === Videos App ===
function openVideosApp() {
  document.getElementById("videos-app").classList.remove("hidden");
  document.getElementById("videos-tab").style.display = "inline-flex";
}
function toggleVideosApp() {
  document.getElementById("videos-app").classList.toggle("hidden");
}
function closeVideosApp() {
  document.getElementById("videos-app").classList.add("hidden");
  document.getElementById("videos-tab").style.display = "none";
}
// 
// === PAINT TAB FUNCTIONALITY ===
const paintTab = document.getElementById("paint-tab");
const paintApp = document.getElementById("paint-app");

paintTab.onclick = () => {
  paintApp.classList.toggle("hidden");
};

function openPaintApp() {
  paintApp.classList.remove("hidden");
  paintTab.style.display = "inline-flex";
}

function closePaintApp() {
  paintApp.classList.add("hidden");
  paintTab.style.display = "none";
}

// === CALCULATOR TAB FUNCTIONALITY ===
const calculatorTab = document.getElementById("calculator-tab");
const calculatorApp = document.getElementById("calculator-app");

calculatorTab.onclick = () => {
  calculatorApp.classList.toggle("hidden");
};

function openCalculatorApp() {
  calculatorApp.classList.remove("hidden");
  calculatorTab.style.display = "inline-flex";
}

function closeCalculatorApp() {
  calculatorApp.classList.add("hidden");
  calculatorTab.style.display = "none";
}


// === SNAKE TAB FUNCTIONALITY ===
const snakeTab = document.getElementById("snake-tab");
const snakeApp = document.getElementById("snake-app");

snakeTab.onclick = () => {
  snakeApp.classList.toggle("hidden");
};

function openSnakeApp() {
  snakeApp.classList.remove("hidden");
  snakeTab.style.display = "inline-flex";
  resetSnakeGame();
  document.getElementById("snake-start-overlay").classList.remove("hidden");
  isSnakeReady = false;
}

function closeSnakeApp() {
  snakeApp.classList.add("hidden");
  snakeTab.style.display = "none";
  clearInterval(gameInterval);
}

function closeSnakeModal() {
  document.getElementById("snake-lose-modal").classList.remove("show");
  closeSnakeApp();
}

// ==========================
// START MENU APP LAUNCHERS
// ==========================
function closeStartMenu() {
  document.getElementById("start-menu").classList.remove("visible");
}

document.getElementById("open-paint").addEventListener("click", () => {
  openPaintApp();
  closeStartMenu();
});

document.getElementById("open-calculator").addEventListener("click", () => {
  openCalculatorApp();
  closeStartMenu();
});

document.getElementById("open-snake").addEventListener("click", () => {
  openSnakeApp();
  closeStartMenu();
});

["paint-tab", "calculator-tab", "snake-tab", "photos-tab", "videos-tab"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
});

// ==========================
// MAKE WINDOWS DRAGGABLE
// ==========================
function makeDraggable(windowEl) {
  const header = windowEl.querySelector('.app-header-bar');
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - windowEl.offsetLeft;
    offsetY = e.clientY - windowEl.offsetTop;
    windowEl.style.zIndex = 1001;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    windowEl.style.left = `${e.clientX - offsetX}px`;
    windowEl.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

makeDraggable(document.getElementById("paint-app"));
makeDraggable(document.getElementById("calculator-app"));
makeDraggable(document.getElementById("snake-app"));

// ==========================
// MS PAINT FUNCTIONALITY
// ==========================
const paintCanvas = document.getElementById("paint-canvas");
const paintCtx = paintCanvas.getContext("2d");
let painting = false;
let isErasing = false;

document.getElementById("toggle-eraser").addEventListener("click", () => {
  isErasing = !isErasing;
  document.getElementById("toggle-eraser").textContent = isErasing ? "✏️ Draw" : "🧽 Eraser";
});

function startPaint(e) {
  painting = true;
  paintCtx.beginPath();
  paintCtx.moveTo(e.offsetX, e.offsetY);
}

function drawPaint(e) {
  if (!painting) return;
  paintCtx.lineTo(e.offsetX, e.offsetY);
  paintCtx.strokeStyle = isErasing ? "#FFFFFF" : document.getElementById("paint-color").value;
  paintCtx.lineWidth = document.getElementById("paint-size").value;
  paintCtx.lineCap = "round";
  paintCtx.stroke();
}

function stopPaint() {
  painting = false;
}

function clearPaint() {
  paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
}

paintCanvas.addEventListener("mousedown", startPaint);
paintCanvas.addEventListener("mousemove", drawPaint);
paintCanvas.addEventListener("mouseup", stopPaint);
paintCanvas.addEventListener("mouseout", stopPaint);

// ==========================
// CALCULATOR FUNCTIONALITY
// ==========================
const calcDisplay = document.getElementById("calc-display");
const calcButtons = document.querySelectorAll("#calculator-app .calc-grid button");

let currentCalc = "";

calcButtons.forEach(button => {
  button.addEventListener("click", () => {
    const val = button.textContent;

    switch (val) {
      case "=":
        try {
          currentCalc = eval(currentCalc).toString();
        } catch {
          currentCalc = "Error";
        }
        break;

      case "C":
        currentCalc = "";
        break;

      case "←":
        currentCalc = currentCalc.slice(0, -1);
        break;

      case "+/-":
        if (currentCalc) {
          if (currentCalc.startsWith("-")) {
            currentCalc = currentCalc.slice(1);
          } else {
            currentCalc = "-" + currentCalc;
          }
        }
        break;

      case "%":
        try {
          currentCalc = (parseFloat(currentCalc) / 100).toString();
        } catch {
          currentCalc = "Error";
        }
        break;

      default:
        currentCalc += val;
    }

    calcDisplay.value = currentCalc;
  });
});

// ==========================
// SNAKE GAME FUNCTIONALITY
// ==========================
const snakeCanvas = document.getElementById("snake-canvas");
const ctx = snakeCanvas.getContext("2d");

let snake, food, dx, dy, gameInterval;
let gameOver = false;
let isSnakeReady = false;

function resetSnakeGame() {
  clearInterval(gameInterval);
  gameOver = false;
  isSnakeReady = false;
  snake = [{ x: 150, y: 150 }];
  dx = 10;
  dy = 0;
  placeFood();
  drawSnake();
}

function placeFood() {
  food = {
    x: Math.floor(Math.random() * 30) * 10,
    y: Math.floor(Math.random() * 30) * 10
  };
}

function updateSnake() {
  if (gameOver) return;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  if (
    head.x < 0 || head.x >= 300 ||
    head.y < 0 || head.y >= 300 ||
    snake.some(seg => seg.x === head.x && seg.y === head.y)
  ) {
    gameOver = true;
    clearInterval(gameInterval);
    document.getElementById("snake-lose-modal").classList.add("show");
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    placeFood();
  } else {
    snake.pop();
  }

  drawSnake();
}

function drawSnake() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 300, 300);

  ctx.fillStyle = "lime";
  snake.forEach(seg => ctx.fillRect(seg.x, seg.y, 10, 10));

  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, 10, 10);
}

document.addEventListener("keydown", (e) => {
  if (document.getElementById("snake-app").classList.contains("hidden")) return;

  if (!isSnakeReady) {
    isSnakeReady = true;
    document.getElementById("snake-start-overlay").classList.add("hidden");
    gameInterval = setInterval(updateSnake, 100);
    return;
  }

  if (gameOver) return;

  switch (e.key) {
    case "ArrowUp":
      if (dy === 0) { dx = 0; dy = -10; }
      break;
    case "ArrowDown":
      if (dy === 0) { dx = 0; dy = 10; }
      break;
    case "ArrowLeft":
      if (dx === 0) { dx = -10; dy = 0; }
      break;
    case "ArrowRight":
      if (dx === 0) { dx = 10; dy = 0; }
      break;
  }
});

// === ADDITIONAL START MENU BUTTONS ===
document.getElementById("open-my-files")?.addEventListener("click", () => {
  openFileExplorer();
  closeStartMenu();
});

document.getElementById("open-browser")?.addEventListener("click", () => {
  openBrowserWindow();
  closeStartMenu();
});

document.getElementById("open-media-player")?.addEventListener("click", () => {
  openPlayer();
  closeStartMenu();
});

document.getElementById("open-youtube")?.addEventListener("click", () => {
  openConsistency();  // Shows mock YT channel view
  closeStartMenu();
});

document.getElementById("open-projects")?.addEventListener("click", () => {
  openFileExplorer();
  closeStartMenu();
});

document.getElementById("open-readme")?.addEventListener("click", () => {
  openReadme();
  closeStartMenu();
});

// Placeholder: Later implementation
document.getElementById("open-latest-work")?.addEventListener("click", () => {
  alert("Latest Work feature not implemented yet.");
  closeStartMenu();
});

document.getElementById("open-profile-wikipedia")?.addEventListener("click", () => {
  const browserWindow = document.getElementById("browser-window");
  const fakeLoading = document.getElementById("fake-loading");
  const internetHome = document.getElementById("internet-home");
  const mockYoutube = document.getElementById("mock-youtube");
  const mockWikipedia = document.getElementById("mock-wikipedia");

  browserWindow.classList.remove("hidden");
  browserWindow.style.display = "flex";

  // Hide everything else
  fakeLoading.style.display = "flex";
  internetHome.style.display = "none";
  mockYoutube.style.display = "none";
  if (mockWikipedia) mockWikipedia.style.display = "none";

  setTimeout(() => {
    fakeLoading.style.display = "none";
    if (mockWikipedia) mockWikipedia.style.display = "flex";
    updateBrowserView("wikipedia");
  }, 4500);

  closeStartMenu();
});

// ==========================
// PHOTOS APP FUNCTIONALITY
// ==========================
const photosApp = document.getElementById("photos-app");
const photosTab = document.getElementById("photos-tab");
const photosCloseBtn = document.getElementById("photos-close");
const photosDragHandle = document.getElementById("photos-drag");

let isPhotosMinimized = false;

document.getElementById("open-photos")?.addEventListener("click", () => {
  photosApp.classList.remove("hidden");
  photosTab.style.display = "inline-flex";
  closeStartMenu();
});

photosTab.onclick = () => {
  if (isPhotosMinimized) {
    photosApp.classList.remove("hidden");
    isPhotosMinimized = false;
  } else {
    photosApp.classList.add("hidden");
    isPhotosMinimized = true;
  }
};

photosCloseBtn.onclick = () => {
  photosApp.classList.add("hidden");
  photosTab.style.display = "none";
  isPhotosMinimized = false;
};

// ==========================
// VIDEOS APP FUNCTIONALITY
// ==========================
const videosApp = document.getElementById("videos-app");
const videosTab = document.getElementById("videos-tab");
const videosCloseBtn = document.getElementById("videos-close");
const videosDragHandle = document.getElementById("videos-drag");

let isVideosMinimized = false;

document.getElementById("open-videos")?.addEventListener("click", () => {
  videosApp.classList.remove("hidden");
  videosTab.style.display = "inline-flex";
  closeStartMenu();
});

videosTab.onclick = () => {
  if (isVideosMinimized) {
    videosApp.classList.remove("hidden");
    isVideosMinimized = false;
  } else {
    videosApp.classList.add("hidden");
    isVideosMinimized = true;
  }
};

videosCloseBtn.onclick = () => {
  videosApp.classList.add("hidden");
  videosTab.style.display = "none";
  isVideosMinimized = false;
};

// ==========================
// DRAGGABLE WINDOWS
// ==========================
function makeWindowDraggable(appWindow, dragHandle) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  dragHandle.addEventListener("mousedown", (e) => {
    const rect = appWindow.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    isDragging = true;

    document.addEventListener("mousemove", dragWindow);
    document.addEventListener("mouseup", stopDragging);
  });

  function dragWindow(e) {
    if (!isDragging) return;
    appWindow.style.left = `${e.clientX - offsetX}px`;
    appWindow.style.top = `${e.clientY - offsetY}px`;
  }

  function stopDragging() {
    isDragging = false;
    document.removeEventListener("mousemove", dragWindow);
    document.removeEventListener("mouseup", stopDragging);
  }
}

makeWindowDraggable(photosApp, photosDragHandle);
makeWindowDraggable(videosApp, videosDragHandle);
