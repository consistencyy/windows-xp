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
    // Do NOT restore old view — always go to home
    currentView = "home";
    updateBrowserView("home");
    return;
  }

  // Show loading screen for first-time open
  mockYoutube.style.display = "none";
  internetHome.style.display = "none";
  const mockWikipedia = document.getElementById("mock-wikipedia");
  if (mockWikipedia) mockWikipedia.style.display = "none";
  fakeLoading.style.display = "flex";

  setTimeout(() => {
    fakeLoading.style.display = "none";
    currentView = "home"; // Force reset
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
  // Hide all views first
  mockYoutube.style.display = "none";
  internetHome.style.display = "none";
  const mockWikipedia = document.getElementById("mock-wikipedia");
  if (mockWikipedia) mockWikipedia.style.display = "none";

  // Show the appropriate view
  if (view === "channel") {
    mockYoutube.style.display = "flex";
  } else if (view === "wikipedia") {
    if (mockWikipedia) mockWikipedia.style.display = "flex";
  } else {
    internetHome.style.display = "flex";
  }

  currentView = view;
}

// Keep existing consistency tab behavior
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

  browserWindow.classList.remove("hidden");
  browserWindow.style.display = "flex";

  // Hide all content initially, show loading screen
  fakeLoading.style.display = "flex";
  internetHome.style.display = "none";
  mockYoutube.style.display = "none";

  // Then load the channel after a delay
  setTimeout(() => {
    fakeLoading.style.display = "none";
    mockYoutube.style.display = "flex";
    internetHome.style.display = "none";
  }, 4500); // match your loading duration
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

// Handle tab click: minimize or restore
fileExplorerTab.onclick = () => {
  if (isFileExplorerMinimized) {
    fileExplorerWin.style.display = "flex";
    requestAnimationFrame(() => fileExplorerWin.classList.add("show"));
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

// Your video list (match thumbnail order)
const ytVideos = [
  {
    title: "VG Concept Pixel Art",
    caption: "A short pixel animation concept.",
    url: "https://www.youtube.com/embed/KNtCdSNIqMk?si=E2iNGArACRcTONzm"
  },
  {
    title: "Eminem If he was RESONANCE",
    caption: "Unofficial music video mashup.",
    url: "https://www.youtube.com/embed/07Qr8RwWeMc?si=owAMy-g-jop5A79J"
  },
  {
    title: "Jean Dawson — POWER FREAKS",
    caption: "Unofficial Visualizer for Jean Dawson.",
    url: "https://www.youtube.com/embed/Rlmc4TMsFGU?si=B7eWIVpseuJKff6i"
  },
  {
    title: "world$tar money - channel bumper",
    caption: "Channel bumper using Joji's iconic track.",
    url: "https://www.youtube.com/embed/jxZKUgziw9E?si=-CemHXC4h8SqA1Ji"
  },
  {
    title: "KENDRICK LAMAR - FOR SALE?",
    caption: "Unofficial music video for 'For Sale?' interlude.",
    url: "https://www.youtube.com/embed/2Eay_dH9Hv4?si=ngVgJ5vuxyHg68PY"
  },
  {
    title: "TAKE OFF.",
    caption: "Short animated experimental video.",
    url: "https://www.youtube.com/embed/s6Ca5NciGuo?si=HNr12i8Zz2whYmhI"
  },
  {
    title: "somethings always wrong with his brain",
    caption: "Dark experimental montage short.",
    url: "https://youtube.com/embed/OcRxtFL9nck?si=lXkYWr0clBCjr509"
  },
  {
    title: "WHATS YOUR DEFINITION OF LOVE?",
    caption: "Visual essay exploring the idea of love.",
    url: "https://youtube.com/embed/hw7YMhge0t0?si=NEb_17OJHn4GhGYK"
  },
  {
    title: "the burn marks on my memories never fade",
    caption: "Conceptual poetry short film.",
    url: "https://www.youtube.com/embed/tUH_49myQI0?si=1P6eOAClmVz0a7md"
  }
];

// Bind click handlers to video thumbnails
document.querySelectorAll("#yt-videos .video-thumb").forEach((thumb, index) => {
  thumb.addEventListener("click", () => {
    const video = ytVideos[index];
    ytIframe.src = video.url;
    videoTitle.textContent = video.title;
    videoCaption.textContent = video.caption;

    // Switch view
    mockYoutube.style.display = "none";
    mockVideoPlayer.style.display = "flex";
  });
});

function closeVideoPlayer() {
  ytIframe.src = ""; // Stop the video
  mockVideoPlayer.style.display = "none";
  mockYoutube.style.display = "flex";
}