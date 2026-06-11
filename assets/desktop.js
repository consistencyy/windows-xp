document.addEventListener("DOMContentLoaded", () => {
  // Skip all desktop init on mobile
  if (/Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) || window.innerWidth <= 768) return;

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

  // ==============================
  // WINDOW FOCUS MANAGEMENT
  // bringToFront() raises the clicked/opened window above all others.
  // Taskbar = 50000, Start menu = 99999 — permanently above.
  // ==============================
  let zTop = 200;

  window.bringToFront = function(el) {
    if (!el) return;
    el.style.zIndex = ++zTop;
  };

  // Wire mousedown on every managed window so clicking anywhere
  // on it promotes it instantly to the front.
  [
    "#browser-window",
    "#file-explorer-window",
    "#music-player",
    "#readme-window",
    "#resume-window",
    "#snake-window",
  ].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.addEventListener("mousedown", () => bringToFront(el), true);
  });

  // Project fwindows are multiple — wire them individually
  document.querySelectorAll(".project-fwindow").forEach(el => {
    el.addEventListener("mousedown", () => bringToFront(el), true);
  });

  const startButton = document.querySelector(".start-button");
  const startMenu = document.getElementById("start-menu");

  startButton.addEventListener("click", () => {
    startMenu.classList.toggle("visible");
  });

  // Restore Readme and desktop icon/tab interactivity after all functions are defined
  openReadme();

let browserInitialized = false;

  // CLOCK
  const clockEl      = document.querySelector(".time-clock");
  const clockDateEl  = document.querySelector(".time-date");
  const cpClockBig   = document.getElementById("cp-clock-big");
  const cpDateFull   = document.getElementById("cp-date-full");

  const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS_SHORT   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function updateClock() {
    const now = new Date();
    const h12 = now.getHours() % 12 || 12;
    const min  = now.getMinutes().toString().padStart(2, "0");
    const sec  = now.getSeconds().toString().padStart(2, "0");
    const ampm = now.getHours() >= 12 ? "PM" : "AM";
    const m = now.getMonth(), d = now.getDate(), y = now.getFullYear();
    const dow = now.getDay();

    // Taskbar clock (two lines)
    if (clockEl) clockEl.textContent = `${h12}:${min} ${ampm}`;
    if (clockDateEl) {
      clockDateEl.textContent = `${DAYS_SHORT[dow]} ${m+1}/${d}/${y}`;
    }

    // Popup big clock
    if (cpClockBig) cpClockBig.textContent = `${h12}:${min}:${sec} ${ampm}`;
    if (cpDateFull) cpDateFull.textContent = `${DAYS[dow]}, ${MONTHS[m]} ${d}, ${y}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // MUTE TOGGLE — fore.webm background video
  const foreVideo = document.getElementById("fore-video");
  const muteBtn = document.getElementById("mute-toggle");

  if (foreVideo && muteBtn) {
    // Browsers block autoplay with sound until user interaction.
    // Start muted so the video plays, then unmute on first click.
    foreVideo.muted = true;
    muteBtn.textContent = "🔇";

    muteBtn.addEventListener("click", () => {
      foreVideo.muted = !foreVideo.muted;
      muteBtn.textContent = foreVideo.muted ? "🔇" : "🔊";
    });
  }

  // ==============================
  // CLOCK / CALENDAR POPUP
  // ==============================
  const clockPopup   = document.getElementById("clock-popup");
  const taskbarClock = document.getElementById("taskbar-clock");
  const calGrid      = document.getElementById("cp-cal-grid");
  const monthLabel   = document.getElementById("cp-month-label");
  const prevMonthBtn = document.getElementById("cp-prev-month");
  const nextMonthBtn = document.getElementById("cp-next-month");

  const CAL_MONTHS = ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"];
  const CAL_DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  let calYear  = new Date().getFullYear();
  let calMonth = new Date().getMonth();

  function buildCalendar(year, month) {
    if (!calGrid || !monthLabel) return;
    monthLabel.textContent = `${CAL_MONTHS[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    calGrid.innerHTML = "";

    // Day headers
    CAL_DAYS.forEach(d => {
      const hdr = document.createElement("div");
      hdr.className = "cp-cal-day-header";
      hdr.textContent = d;
      calGrid.appendChild(hdr);
    });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "cp-cal-day other-month";
      empty.textContent = "";
      calGrid.appendChild(empty);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement("div");
      cell.className = "cp-cal-day";
      cell.textContent = d;
      if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        cell.classList.add("today");
      }
      calGrid.appendChild(cell);
    }
  }

  if (taskbarClock) {
    taskbarClock.addEventListener("click", (e) => {
      e.stopPropagation();
      if (clockPopup) {
        clockPopup.classList.toggle("visible");
        if (clockPopup.classList.contains("visible")) {
          const now = new Date();
          calYear  = now.getFullYear();
          calMonth = now.getMonth();
          buildCalendar(calYear, calMonth);
        }
      }
    });
  }

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      buildCalendar(calYear, calMonth);
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      buildCalendar(calYear, calMonth);
    });
  }

  // Close popup when clicking anywhere outside
  document.addEventListener("click", (e) => {
    if (clockPopup && clockPopup.classList.contains("visible")) {
      if (!clockPopup.contains(e.target) && e.target !== taskbarClock && !taskbarClock?.contains(e.target)) {
        clockPopup.classList.remove("visible");
      }
    }
  });

  // Close popup when start menu opens
  startButton.addEventListener("click", () => {
    if (clockPopup) clockPopup.classList.remove("visible");
  });

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
  const mpMinBtn = document.getElementById("mp-minimize-btn");
  const mpStatusText = document.getElementById("mp-status-text");
  const mpCurrentTime = document.getElementById("mp-current-time");
  const mpDuration = document.getElementById("mp-duration");
  const mpSeekFill = document.getElementById("mp-seek-fill");
  const mpPlaylist = document.getElementById("mp-playlist");

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

  // Build playlist UI
  function buildPlaylist() {
    if (!mpPlaylist) return;
    mpPlaylist.innerHTML = "";
    tracks.forEach((t, i) => {
      const item = document.createElement("div");
      item.className = "mp-playlist-item" + (i === current ? " active" : "");
      item.innerHTML = `<span class="mp-playlist-num">${i + 1}</span><span class="mp-playlist-title">${t.title}</span>`;
      item.onclick = () => { loadTrack(i); playTrack(); };
      mpPlaylist.appendChild(item);
    });
  }

  function updatePlaylistHighlight() {
    if (!mpPlaylist) return;
    mpPlaylist.querySelectorAll(".mp-playlist-item").forEach((el, i) => {
      el.classList.toggle("active", i === current);
    });
  }

  function formatTime(s) {
    if (isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (mpSeekFill) mpSeekFill.style.width = pct + "%";
    if (mpCurrentTime) mpCurrentTime.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    if (mpDuration) mpDuration.textContent = formatTime(audio.duration);
  });

  if (mpSeekFill && mpSeekFill.parentElement) {
    mpSeekFill.parentElement.addEventListener("click", (e) => {
      if (!audio.duration) return;
      const rect = mpSeekFill.parentElement.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
    });
  }

  function openPlayer() {
    bringToFront(playerWin);
    playerWin.style.display = 'flex';
    playerWin.classList.add('show');
    if (isMinimized) {
      isMinimized = false;
      return;
    }
    buildPlaylist();
    loadTrack(current);
    playTrack();
    if (musicTab) musicTab.style.display = 'inline-flex';
  }

function loadTrack(i) {
  current = (i + tracks.length) % tracks.length;
  const t = tracks[current];
  audio.src = t.src;
  if (title) title.textContent = t.title;
  if (mpStatusText) mpStatusText.textContent = "Playing: " + t.title;

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
  updatePlaylistHighlight();
}

  function playTrack() {
    audio.play();
    if (playBtn) playBtn.classList.add('is-playing');
    if (mpStatusText) mpStatusText.textContent = "Playing: " + tracks[current].title;
  }

  function togglePlay() {
    if (audio.paused) playTrack();
    else {
      audio.pause();
      if (playBtn) playBtn.classList.remove('is-playing');
      if (mpStatusText) mpStatusText.textContent = "Paused";
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
  if (title) title.textContent = 'Track Title';
  if (mpStatusText) mpStatusText.textContent = 'Ready';
  if (playBtn) playBtn.classList.remove('is-playing');
  if (mpSeekFill) mpSeekFill.style.width = '0%';
  if (mpCurrentTime) mpCurrentTime.textContent = '0:00';
  if (mpDuration) mpDuration.textContent = '0:00';

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

  // Scale-aware dragging
  function getPlayerScale() {
    const root = document.getElementById("desktop-root");
    if (!root) return 1;
    return (new DOMMatrix(getComputedStyle(root).transform)).a || 1;
  }

  dragHandle.addEventListener("mousedown", (e) => {
    if (e.target.closest(".mp-win-btns")) return;
    const scale = getPlayerScale();
    const rect = playerWin.getBoundingClientRect();
    offsetX = (e.clientX - rect.left) / scale;
    offsetY = (e.clientY - rect.top) / scale;
    isDragging = true;
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    e.preventDefault();
  });

  function onDrag(e) {
    if (!isDragging) return;
    const scale = getPlayerScale();
    const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
    playerWin.style.left = `${(e.clientX - rootRect.left) / scale - offsetX}px`;
    playerWin.style.top  = `${(e.clientY - rootRect.top)  / scale - offsetY}px`;
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
  }

  recycleBin.ondblclick = openPlayer;
  closeBtn.onclick = closePlayer;
  if (mpMinBtn) mpMinBtn.onclick = minimizePlayer;

  musicTab.onclick = () => {
    if (isMinimized) {
      playerWin.style.display = 'flex';
      requestAnimationFrame(() => playerWin.classList.add('show'));
      isMinimized = false;
      bringToFront(playerWin);
    } else {
      minimizePlayer();
    }
  };

  if (playBtn) playBtn.onclick = togglePlay;
  if (volumeSlider) volumeSlider.oninput = () => audio.volume = volumeSlider.value;
  audio.onended = () => { loadTrack(current + 1); playTrack(); };
  if (prevBtn) prevBtn.onclick = () => { loadTrack(current - 1); playTrack(); };
  if (nextBtn) nextBtn.onclick = () => { loadTrack(current + 1); playTrack(); };

// ==============================
// CONSISTENCYY BROWSER WINDOW
// ==============================
const consistencyTab = document.getElementById("consistency-tab");
const browserWindow = document.getElementById("browser-window");
const mockYoutube = document.getElementById("mock-youtube");
const internetHome = document.getElementById("internet-home");
const fakeLoading = document.getElementById("fake-loading");
const browserHeader = document.querySelector("#browser-window .window-header");
const tabs = document.querySelectorAll(".cyt-tab");
const sections = document.querySelectorAll(".yt-section");
const backButton = document.getElementById("ie-back-button");
const wikipediaBookmark = document.getElementById("wikipedia-bookmark");

// Links bar bookmarks
if (wikipediaBookmark) {
  wikipediaBookmark.addEventListener("click", () => { updateBrowserView("wikipedia"); });
}

// Homepage bookmark tiles (duplicate IDs avoided by using -2 suffix)
const wikipediaBookmark2 = document.getElementById("wikipedia-bookmark-2");
const projectsBookmark2  = document.getElementById("projects-bookmark-2");
if (wikipediaBookmark2) {
  wikipediaBookmark2.addEventListener("click", () => { updateBrowserView("wikipedia"); });
}
if (projectsBookmark2) {
  projectsBookmark2.addEventListener("click", () => { openFileExplorer(); });
}

let browserMinimized = false;
let isDraggingBrowser = false;
let offsetXBrowser = 0;
let offsetYBrowser = 0;
let currentView = "home";
let parallaxPaused = false;

function openBrowserWindow() {
  bringToFront(browserWindow);
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
  const addrText = document.getElementById("ie-addr-text");

  // Hide all views first
  mockYoutube.style.display = "none";
  internetHome.style.display = "none";
  mockVideoPlayer.style.display = "none";
  if (mockWikipedia) mockWikipedia.style.display = "none";

  mockYoutube.classList.add("hidden");
  internetHome.classList.add("hidden");
  mockVideoPlayer.classList.add("hidden");
  if (mockWikipedia) mockWikipedia.classList.add("hidden");

  // Show the appropriate view and update address bar
  if (view === "channel") {
    mockYoutube.style.display = "flex";
    mockYoutube.classList.remove("hidden");
    if (addrText) addrText.textContent = "www.youtube.com/@Consistencyy";
  } else if (view === "wikipedia") {
    if (mockWikipedia) {
      mockWikipedia.style.display = "flex";
      mockWikipedia.classList.remove("hidden");
    }
    if (addrText) addrText.textContent = "www.wakapedia.org/wiki/Conor_McCutcheon";
  } else if (view === "video") {
    mockVideoPlayer.style.display = "flex";
    mockVideoPlayer.classList.remove("hidden");
    if (addrText) addrText.textContent = "www.youtube.com/watch?v=...";
  } else {
    internetHome.style.display = "flex";
    internetHome.classList.remove("hidden");
    if (addrText) addrText.textContent = "about:home";
  }

  currentView = view;
}

// Keep existing consistency tab behavior
if (consistencyTab) {
  consistencyTab.addEventListener("click", openBrowserWindow);
}

// Draggable Internet Explorer window — scale-aware dragging
(function() {
  const browserHeader = document.querySelector("#browser-window .window-header");
  const browserWindow = document.getElementById("browser-window");

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  function getScale() {
    const root = document.getElementById("desktop-root");
    if (!root) return 1;
    const m = new DOMMatrix(getComputedStyle(root).transform);
    return m.a || 1;
  }

  if (browserHeader && browserWindow) {
    browserHeader.addEventListener("mousedown", (e) => {
      if (e.target.closest(".window-controls")) return;
      const scale = getScale();
      const rect = browserWindow.getBoundingClientRect();
      offsetX = (e.clientX - rect.left) / scale;
      offsetY = (e.clientY - rect.top) / scale;
      isDragging = true;
      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", stopDrag);
      e.preventDefault();
    });
  }

  function onDrag(e) {
    if (!isDragging) return;
    const scale = getScale();
    const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
    const newLeft = (e.clientX - rootRect.left) / scale - offsetX;
    const newTop  = (e.clientY - rootRect.top)  / scale - offsetY;
    browserWindow.style.left = `${newLeft}px`;
    browserWindow.style.top  = `${newTop}px`;
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
  }
})();

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
  if (/Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) || window.innerWidth <= 768) return;
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
  bringToFront(readmeWin);
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

// Minimize button (new)
const readmeMinBtn = document.getElementById("readme-minimize");
if (readmeMinBtn) readmeMinBtn.onclick = minimizeReadme;

readmeTab.onclick = () => {
  if (isReadmeMinimized) {
    readmeWin.style.display = 'flex';
    requestAnimationFrame(() => readmeWin.classList.add('show'));
    isReadmeMinimized = false;
  } else {
    minimizeReadme();
  }
};

// Drag-and-drop for readme window — scale-aware
function getReadmeScale() {
  const root = document.getElementById("desktop-root");
  if (!root) return 1;
  return (new DOMMatrix(getComputedStyle(root).transform)).a || 1;
}

readmeDragHandle.addEventListener("mousedown", (e) => {
  if (e.target.closest(".readme-win-btns")) return;
  const scale = getReadmeScale();
  const winRect = readmeWin.getBoundingClientRect();
  readmeOffsetX = (e.clientX - winRect.left) / scale;
  readmeOffsetY = (e.clientY - winRect.top)  / scale;
  isReadmeDragging = true;
  document.addEventListener("mousemove", dragReadme);
  document.addEventListener("mouseup", stopDragReadme);
  e.preventDefault();
});

function dragReadme(e) {
  if (!isReadmeDragging) return;
  const scale = getReadmeScale();
  const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
  readmeWin.style.left = `${(e.clientX - rootRect.left) / scale - readmeOffsetX}px`;
  readmeWin.style.top  = `${(e.clientY - rootRect.top)  / scale - readmeOffsetY}px`;
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

// ==============================
// RESUME WINDOW
// ==============================
const resumeWin        = document.getElementById("resume-window");
const resumeIcon       = document.getElementById("resume-icon");
const resumeClose      = document.getElementById("resume-close");
const resumeMinBtn     = document.getElementById("resume-minimize");
const resumeTab        = document.getElementById("resume-tab");
const resumeDragHandle = document.getElementById("resume-drag-handle");

let isResumeDragging  = false;
let resumeOffsetX     = 0, resumeOffsetY = 0;
let isResumeMinimized = false;

function openResume() {
  bringToFront(resumeWin);
  resumeWin.style.display = "flex";
  if (resumeTab) resumeTab.style.display = "inline-flex";
  isResumeMinimized = false;
}

function closeResume() {
  resumeWin.style.display = "none";
  if (resumeTab) resumeTab.style.display = "none";
  isResumeMinimized = false;
}

function minimizeResume() {
  resumeWin.style.display = "none";
  isResumeMinimized = true;
  if (resumeTab) resumeTab.style.display = "inline-flex";
}

if (resumeClose)  resumeClose.onclick  = closeResume;
if (resumeMinBtn) resumeMinBtn.onclick = minimizeResume;

if (resumeTab) {
  resumeTab.onclick = () => {
    if (isResumeMinimized || resumeWin.style.display === "none") {
      resumeWin.style.display = "flex";
      isResumeMinimized = false;
      bringToFront(resumeWin);
    } else {
      minimizeResume();
    }
  };
}

if (resumeIcon) {
  resumeIcon.addEventListener("dblclick", openResume);
}

// Scale-aware drag for resume window
(function() {
  function getScale() {
    const root = document.getElementById("desktop-root");
    return root ? (new DOMMatrix(getComputedStyle(root).transform)).a || 1 : 1;
  }
  resumeDragHandle.addEventListener("mousedown", (e) => {
    if (e.target.closest(".readme-win-btns")) return;
    const scale = getScale();
    const rect  = resumeWin.getBoundingClientRect();
    resumeOffsetX = (e.clientX - rect.left) / scale;
    resumeOffsetY = (e.clientY - rect.top)  / scale;
    isResumeDragging = true;
    document.addEventListener("mousemove", onResumeDrag);
    document.addEventListener("mouseup",   stopResumeDrag);
    e.preventDefault();
  });
  function onResumeDrag(e) {
    if (!isResumeDragging) return;
    const scale    = getScale();
    const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
    resumeWin.style.left = `${(e.clientX - rootRect.left) / scale - resumeOffsetX}px`;
    resumeWin.style.top  = `${(e.clientY - rootRect.top)  / scale - resumeOffsetY}px`;
  }
  function stopResumeDrag() {
    isResumeDragging = false;
    document.removeEventListener("mousemove", onResumeDrag);
    document.removeEventListener("mouseup",   stopResumeDrag);
  }
})();
// ==============================
// END RESUME WINDOW
// ==============================

function openConsistency() {
  bringToFront(document.getElementById("browser-window"));
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

// ==============================
// FILE EXPLORER — My Projects
// ==============================
const fileExplorerWin = document.getElementById("file-explorer-window");
const fileExplorerTab = document.getElementById("mixed-tab");
const fileExplorerClose = document.getElementById("file-explorer-close");
const fileExplorerDragHandle = document.getElementById("file-explorer-drag-handle");
const rootView = document.getElementById("file-explorer-root");

let isFileExplorerDragging = false;
let explorerOffsetX = 0, explorerOffsetY = 0;
let isFileExplorerMinimized = false;

// Open the Projects window
function openFileExplorer() {
  bringToFront(fileExplorerWin);
  fileExplorerWin.style.display = "flex";
  fileExplorerTab.style.display = "inline-flex";
  isFileExplorerMinimized = false;
}

// Taskbar tab click — toggle minimize/restore
fileExplorerTab.onclick = () => {
  const isHidden = fileExplorerWin.style.display === "none" || fileExplorerWin.classList.contains("hidden");
  if (isHidden || isFileExplorerMinimized) {
    fileExplorerWin.style.display = "flex";
    isFileExplorerMinimized = false;
    bringToFront(fileExplorerWin);
  } else {
    fileExplorerWin.style.display = "none";
    isFileExplorerMinimized = true;
  }
};

// Close button — hides window, keeps tab
fileExplorerClose.onclick = () => {
  fileExplorerWin.style.display = "none";
  isFileExplorerMinimized = true;
};

// ==============================
// MY WORK — Tab Switcher
// ==============================
function showWorkPanel(panelId, btn) {
  document.querySelectorAll('.mywork-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.mywork-tab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.style.display = 'block';
  if (btn) btn.classList.add('active');

  // When switching to Graphic Design, always land on BDR tab
  if (panelId === 'work-gfx') {
    const firstGfxBtn = panel.querySelector('.gfx-subtab');
    showGfxPanel('gfx-bdr', firstGfxBtn);
  }

  // When switching to Motion Graphics, always land on FASTSIGNS tab
  if (panelId === 'work-motion') {
    const firstMotionBtn = panel.querySelector('.gfx-subtab');
    showMotionPanel('motion-fastsigns', firstMotionBtn);
  }
}

function showGfxPanel(panelId, btn) {
  document.querySelectorAll('.gfx-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.gfx-subtab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.style.display = 'block';
  if (btn) btn.classList.add('active');
}

function showMotionPanel(panelId, btn) {
  document.querySelectorAll('.motion-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.gfx-subtab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.style.display = 'block';
  if (btn) btn.classList.add('active');
}

// DRAGGING LOGIC — scale-aware
fileExplorerDragHandle.addEventListener("mousedown", (e) => {
  if (e.target.closest(".fwindow-controls")) return;
  const scale = (new DOMMatrix(getComputedStyle(document.getElementById("desktop-root")).transform)).a || 1;
  const rect = fileExplorerWin.getBoundingClientRect();
  explorerOffsetX = (e.clientX - rect.left) / scale;
  explorerOffsetY = (e.clientY - rect.top)  / scale;
  isFileExplorerDragging = true;
  document.addEventListener("mousemove", dragFileExplorer);
  document.addEventListener("mouseup", stopDragFileExplorer);
  e.preventDefault();
});

function dragFileExplorer(e) {
  if (!isFileExplorerDragging) return;
  const scale = (new DOMMatrix(getComputedStyle(document.getElementById("desktop-root")).transform)).a || 1;
  const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
  fileExplorerWin.style.left = `${(e.clientX - rootRect.left) / scale - explorerOffsetX}px`;
  fileExplorerWin.style.top  = `${(e.clientY - rootRect.top)  / scale - explorerOffsetY}px`;
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
    updateBrowserView("wikipedia");  // ✅ fixes the view handling
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

function closeStartMenu() {
  const startMenu = document.getElementById("start-menu");
  if (startMenu) {
    startMenu.classList.remove("visible");
  }
}

document.addEventListener("click", (event) => {
  const startMenu = document.getElementById("start-menu");
  const startButton = document.querySelector(".start-button");

  // Don't close if the click is inside the start menu or the start button
  if (
    startMenu.classList.contains("visible") &&
    !startMenu.contains(event.target) &&
    !startButton.contains(event.target)
  ) {
    closeStartMenu();
  }
});

// === START MENU BUTTONS ===
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
  openConsistency();
  closeStartMenu();
});

document.getElementById("open-photos")?.addEventListener("click", () => {
  window.open("https://www.consistency.ink/", "_blank");
  closeStartMenu();
});

document.getElementById("open-snake")?.addEventListener("click", () => {
  openSnake();
  closeStartMenu();
});

document.getElementById("open-readme")?.addEventListener("click", () => {
  openReadme();
  closeStartMenu();
});

document.getElementById("open-logout")?.addEventListener("click", () => {
  closeStartMenu();
  setTimeout(() => location.reload(), 200);
});

document.getElementById("open-profile-wikipedia")?.addEventListener("click", () => {
  const browserWindow = document.getElementById("browser-window");
  const fakeLoading = document.getElementById("fake-loading");
  const internetHome = document.getElementById("internet-home");
  const mockYoutube = document.getElementById("mock-youtube");
  const mockWikipedia = document.getElementById("mock-wikipedia");

  browserWindow.classList.remove("hidden");
  browserWindow.style.display = "flex";

  fakeLoading.style.display = "flex";
  internetHome.style.display = "none";
  mockYoutube.style.display = "none";
  if (mockWikipedia) mockWikipedia.style.display = "none";

  setTimeout(() => {
    fakeLoading.style.display = "none";
    updateBrowserView("wikipedia");
  }, 4500);

  closeStartMenu();
});
// ==========================
// END OF START MENU BUTTONS
// ==========================

// ==============================
// SNAKE GAME
// ==============================
const snakeWin     = document.getElementById("snake-window");
const snakeDrag    = document.getElementById("snake-drag-handle");
const snakeTab     = document.getElementById("snake-tab");
const snakeClose   = document.getElementById("snake-close");
const snakeMinBtn  = document.getElementById("snake-minimize");
const snakeCanvas  = document.getElementById("snake-canvas");
const snakeCtx     = snakeCanvas ? snakeCanvas.getContext("2d") : null;
const snakeScore   = document.getElementById("snake-score");
const snakeHigh    = document.getElementById("snake-high");
const snakeStatus  = document.getElementById("snake-status-text");
const snakeStart   = document.getElementById("snake-start-btn");
const snakePause   = document.getElementById("snake-pause-btn");
const snakeReset   = document.getElementById("snake-reset-btn");

const CELL = 20;
const COLS = 20;
const ROWS = 20;

let snake, dir, nextDir, food, snakeScoreVal, snakeHighVal, snakeRunning, snakePaused, snakeInterval;
let snakeMinimized = false;

function snakeInit() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  snakeScoreVal = 0;
  snakeRunning = false;
  snakePaused = false;
  if (snakeScore) snakeScore.textContent = "0";
  if (snakeStatus) snakeStatus.textContent = "Press Start";
  if (snakeStart) { snakeStart.textContent = "▶ Start"; snakeStart.disabled = false; }
  if (snakePause) { snakePause.textContent = "⏸ Pause"; snakePause.disabled = true; }
  spawnFood();
  snakeDraw();
}

function spawnFood() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
}

function snakeDraw() {
  if (!snakeCtx) return;
  // Background
  snakeCtx.fillStyle = "#001800";
  snakeCtx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

  // Grid lines (subtle)
  snakeCtx.strokeStyle = "#002800";
  snakeCtx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    snakeCtx.beginPath(); snakeCtx.moveTo(x * CELL, 0); snakeCtx.lineTo(x * CELL, ROWS * CELL); snakeCtx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    snakeCtx.beginPath(); snakeCtx.moveTo(0, y * CELL); snakeCtx.lineTo(COLS * CELL, y * CELL); snakeCtx.stroke();
  }

  // Food
  snakeCtx.fillStyle = "#ff3333";
  snakeCtx.shadowColor = "#ff0000";
  snakeCtx.shadowBlur = 8;
  snakeCtx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
  snakeCtx.shadowBlur = 0;

  // Snake
  snake.forEach((seg, i) => {
    const isHead = i === 0;
    snakeCtx.fillStyle = isHead ? "#00ff44" : `hsl(${130 - i * 2}, 100%, ${45 - i * 0.5}%)`;
    snakeCtx.shadowColor = isHead ? "#00ff44" : "transparent";
    snakeCtx.shadowBlur = isHead ? 6 : 0;
    snakeCtx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    snakeCtx.shadowBlur = 0;
  });

  // Game-over overlay
  if (!snakeRunning && snakeScoreVal > 0) {
    snakeCtx.fillStyle = "rgba(0,0,0,0.6)";
    snakeCtx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    snakeCtx.fillStyle = "#ff3333";
    snakeCtx.font = "bold 24px 'Courier New'";
    snakeCtx.textAlign = "center";
    snakeCtx.fillText("GAME OVER", COLS * CELL / 2, ROWS * CELL / 2 - 10);
    snakeCtx.fillStyle = "#fff";
    snakeCtx.font = "14px 'Courier New'";
    snakeCtx.fillText(`Score: ${snakeScoreVal}`, COLS * CELL / 2, ROWS * CELL / 2 + 14);
    snakeCtx.textAlign = "left";
  }
}

function snakeTick() {
  dir = { ...nextDir };
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // Wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return snakeGameOver();
  }
  // Self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    return snakeGameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    snakeScoreVal += 10;
    if (snakeScore) snakeScore.textContent = snakeScoreVal;
    if (!snakeHighVal || snakeScoreVal > snakeHighVal) {
      snakeHighVal = snakeScoreVal;
      if (snakeHigh) snakeHigh.textContent = snakeHighVal;
    }
    spawnFood();
  } else {
    snake.pop();
  }

  snakeDraw();
}

function snakeGameOver() {
  clearInterval(snakeInterval);
  snakeRunning = false;
  snakePaused = false;
  if (snakeStatus) snakeStatus.textContent = "Game Over!";
  if (snakeStart) { snakeStart.textContent = "▶ Restart"; snakeStart.disabled = false; }
  if (snakePause) snakePause.disabled = true;
  snakeDraw();
}

function startSnakeGame() {
  snakeInit();
  snakeRunning = true;
  snakePaused = false;
  if (snakeStatus) snakeStatus.textContent = "Running";
  if (snakeStart) snakeStart.disabled = true;
  if (snakePause) { snakePause.disabled = false; snakePause.textContent = "⏸ Pause"; }
  clearInterval(snakeInterval);
  snakeInterval = setInterval(snakeTick, 120);
}

function toggleSnakePause() {
  if (!snakeRunning) return;
  if (snakePaused) {
    snakePaused = false;
    snakeInterval = setInterval(snakeTick, 120);
    if (snakeStatus) snakeStatus.textContent = "Running";
    if (snakePause) snakePause.textContent = "⏸ Pause";
  } else {
    snakePaused = true;
    clearInterval(snakeInterval);
    if (snakeStatus) snakeStatus.textContent = "Paused";
    if (snakePause) snakePause.textContent = "▶ Resume";
  }
}

function openSnake() {
  bringToFront(snakeWin);
  snakeWin.style.display = "flex";
  if (snakeTab) snakeTab.style.display = "inline-flex";
  snakeMinimized = false;
  if (!snakeRunning && snakeScoreVal === undefined) snakeInit();
}

function closeSnakeWindow() {
  clearInterval(snakeInterval);
  snakeRunning = false;
  snakeMinimized = false;
  snakeWin.style.display = "none";
  if (snakeTab) snakeTab.style.display = "none";
}

function minimizeSnake() {
  snakeWin.style.display = "none";
  snakeMinimized = true;
  if (snakeTab) snakeTab.style.display = "inline-flex";
}

if (snakeClose)  snakeClose.onclick  = closeSnakeWindow;
if (snakeMinBtn) snakeMinBtn.onclick = minimizeSnake;

if (snakeTab) {
  snakeTab.onclick = () => {
    if (snakeMinimized || snakeWin.style.display === "none") {
      snakeWin.style.display = "flex";
      snakeMinimized = false;
      bringToFront(snakeWin);
    } else {
      minimizeSnake();
    }
  };
}

if (snakeStart)  snakeStart.onclick  = startSnakeGame;
if (snakePause)  snakePause.onclick  = toggleSnakePause;
if (snakeReset)  snakeReset.onclick  = () => { clearInterval(snakeInterval); snakeInit(); };

// Keyboard input — only when snake window is visible
document.addEventListener("keydown", (e) => {
  if (snakeWin.style.display === "none") return;
  const map = {
    ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
  };
  const newDir = map[e.key];
  if (newDir) {
    // Prevent reversing direction
    if (newDir.x !== -dir.x || newDir.y !== -dir.y) {
      nextDir = newDir;
    }
    e.preventDefault();
  }
  if (e.key === " ") { toggleSnakePause(); e.preventDefault(); }
});

// Dragging for snake window
(function() {
  let isDragging = false, offX = 0, offY = 0;
  function getScale() {
    const root = document.getElementById("desktop-root");
    return root ? (new DOMMatrix(getComputedStyle(root).transform)).a || 1 : 1;
  }
  snakeDrag.addEventListener("mousedown", (e) => {
    if (e.target.closest(".snake-title-btns")) return;
    const scale = getScale();
    const rect = snakeWin.getBoundingClientRect();
    offX = (e.clientX - rect.left) / scale;
    offY = (e.clientY - rect.top)  / scale;
    isDragging = true;
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    e.preventDefault();
  });
  function onDrag(e) {
    if (!isDragging) return;
    const scale = getScale();
    const rootRect = document.getElementById("desktop-root").getBoundingClientRect();
    snakeWin.style.left = `${(e.clientX - rootRect.left) / scale - offX}px`;
    snakeWin.style.top  = `${(e.clientY - rootRect.top)  / scale - offY}px`;
  }
  function stopDrag() { isDragging = false; document.removeEventListener("mousemove", onDrag); document.removeEventListener("mouseup", stopDrag); }
})();

// Draw initial state
if (snakeCtx) snakeInit();
// ==============================
// END SNAKE GAME
// ==============================

// === PROJECT FWINDOW LOGIC ===
const projectWindows = document.querySelectorAll(".project-fwindow");
const projectsTab = document.getElementById("projects-tab");

let lastOpenedProjectId = null;

function openProjectFWindow(id) {
  // Close all other project windows
  // bringToFront called after win is identified below
  projectWindows.forEach(win => {
    win.classList.remove("show");
    win.classList.add("hidden");
  });

  const win = document.getElementById(id);
  if (!win) return;

  win.classList.remove("hidden");
  win.classList.add("show");
  bringToFront(win);

  lastOpenedProjectId = id;

  if (projectsTab) {
    projectsTab.style.display = "flex";
  }
}

function closeProjectFWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.remove("show");
  win.classList.add("hidden");

  if (projectsTab) {
    projectsTab.style.display = "none";
  }

  lastOpenedProjectId = null;
}

if (projectsTab) {
  projectsTab.onclick = () => {
    const anyVisible = Array.from(projectWindows).some(win => win.classList.contains("show"));
    if (anyVisible) {
      projectWindows.forEach(win => win.classList.remove("show"));
      projectWindows.forEach(win => win.classList.add("hidden"));
    } else if (lastOpenedProjectId) {
      const win = document.getElementById(lastOpenedProjectId);
      if (win) {
        win.classList.remove("hidden");
        win.classList.add("show");
      }
    }
  };
}

// When closing File Explorer, also close any open project fwindows
fileExplorerClose.addEventListener("click", () => {
  projectWindows.forEach(win => {
    win.classList.remove("show");
    win.classList.add("hidden");
  });
  if (projectsTab) {
    projectsTab.style.display = "none";
  }
  lastOpenedProjectId = null;
});

function switchProjectFWindow(nextId) {
  // Close all open project windows
  projectWindows.forEach(win => {
    win.classList.remove("show");
    win.classList.add("hidden");
  });

  const win = document.getElementById(nextId);
  if (!win) return;

  win.classList.remove("hidden");
  win.classList.add("show");

  // Keep the Projects tab open
  if (projectsTab) {
    projectsTab.style.display = "flex";
  }

  lastOpenedProjectId = nextId;
}
// Event listeners for project windows

// ══════════════════════════════════════════════
// MOBILE VIEW
// ══════════════════════════════════════════════
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

if (isMobileDevice()) {
  document.getElementById("mobile-view").style.display = "flex";
  document.getElementById("desktop-root").style.display = "none";
  initMobile();
}

function initMobile() {

  // Clock
  function mobUpdateClock() {
    const now = new Date();
    const h = now.getHours() % 12 || 12;
    const m = now.getMinutes().toString().padStart(2, "0");
    const ampm = now.getHours() >= 12 ? "PM" : "AM";
    const t = `${h}:${m} ${ampm}`;
    const tEl = document.getElementById("mob-time");
    const tbEl = document.getElementById("mob-taskbar-time");
    if (tEl) tEl.textContent = t;
    if (tbEl) tbEl.textContent = t;
  }
  setInterval(mobUpdateClock, 1000);
  mobUpdateClock();

  // IE search
  const mobSearchBtn = document.getElementById("mob-search-btn");
  const mobSearchInput = document.getElementById("mob-search-input");
  if (mobSearchBtn && mobSearchInput) {
    mobSearchBtn.onclick = () => {
      const q = mobSearchInput.value.trim();
      if (q) window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");
    };
    mobSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") mobSearchBtn.click();
    });
  }

  // Mobile Media Player
  const mobTracks = [
    { src:"assets/music1.mp3", title:"CHRYSTAL - The Days (Notion Remix)", coverSrc:"assets/music1.webm", coverType:"video" },
    { src:"assets/music2.mp3", title:"eery - Her",                          coverSrc:"assets/music2.webm", coverType:"video" },
    { src:"assets/music3.mp3", title:"The Backseat Lovers - Slowing Down",   coverSrc:"assets/music3.webm", coverType:"video" }
  ];

  let mobCurrent = 0;
  const mobAudio     = document.getElementById("mob-audio");
  const mobCoverImg  = document.getElementById("mob-cover-img");
  const mobCoverVid  = document.getElementById("mob-cover-video");
  const mobTrackTitle= document.getElementById("mob-track-title");
  const mobPlayBtn   = document.getElementById("mob-play");
  const mobPrevBtn   = document.getElementById("mob-prev");
  const mobNextBtn   = document.getElementById("mob-next");
  const mobVolSlider = document.getElementById("mob-vol");
  const mobPlaylistEl= document.getElementById("mob-playlist");

  function mobBuildPlaylist() {
    if (!mobPlaylistEl) return;
    mobPlaylistEl.innerHTML = "";
    mobTracks.forEach((t, i) => {
      const el = document.createElement("div");
      el.className = "mob-playlist-item" + (i === mobCurrent ? " active" : "");
      el.innerHTML = `<span class="mob-playlist-num">${i+1}</span><span>${t.title}</span>`;
      el.onclick = () => { mobLoadTrack(i); mobPlayTrack(); };
      mobPlaylistEl.appendChild(el);
    });
  }

  function mobLoadTrack(i) {
    mobCurrent = (i + mobTracks.length) % mobTracks.length;
    const t = mobTracks[mobCurrent];
    if (mobAudio) mobAudio.src = t.src;
    if (mobTrackTitle) mobTrackTitle.textContent = t.title;
    if (t.coverType === "video" && mobCoverVid) {
      mobCoverVid.src = t.coverSrc; mobCoverVid.style.display = "block";
      if (mobCoverImg) mobCoverImg.style.display = "none";
      mobCoverVid.play();
    } else if (mobCoverImg) {
      mobCoverImg.src = t.coverSrc; mobCoverImg.style.display = "block";
      if (mobCoverVid) mobCoverVid.style.display = "none";
    }
    document.querySelectorAll(".mob-playlist-item").forEach((el, idx) => {
      el.classList.toggle("active", idx === mobCurrent);
    });
  }

  function mobPlayTrack() {
    if (mobAudio) { mobAudio.play(); if (mobPlayBtn) mobPlayBtn.textContent = "⏸"; }
  }

  function mobTogglePlay() {
    if (!mobAudio) return;
    if (mobAudio.paused) mobPlayTrack();
    else { mobAudio.pause(); if (mobPlayBtn) mobPlayBtn.textContent = "▶"; }
  }

  if (mobPlayBtn)   mobPlayBtn.onclick   = mobTogglePlay;
  if (mobPrevBtn)   mobPrevBtn.onclick   = () => { mobLoadTrack(mobCurrent - 1); mobPlayTrack(); };
  if (mobNextBtn)   mobNextBtn.onclick   = () => { mobLoadTrack(mobCurrent + 1); mobPlayTrack(); };
  if (mobVolSlider) mobVolSlider.oninput = () => { if (mobAudio) mobAudio.volume = mobVolSlider.value; };
  if (mobAudio)     mobAudio.onended     = () => { mobLoadTrack(mobCurrent + 1); mobPlayTrack(); };

  document.getElementById("mob-sheet-player")?.addEventListener("mob-open", () => {
    mobBuildPlaylist();
    if (!mobAudio.src) mobLoadTrack(0);
  });

  // Mobile Snake
  const mobCanvas  = document.getElementById("mob-snake-canvas");
  const mobCtx     = mobCanvas ? mobCanvas.getContext("2d") : null;
  const mobScoreEl = document.getElementById("mob-snake-score");
  const mobBestEl  = document.getElementById("mob-snake-best");
  const mobStatEl  = document.getElementById("mob-snake-status");
  const MCELL = 15, MCOLS = 20, MROWS = 20;

  let mSnake, mDir, mNextDir, mFood, mScore, mBest = 0, mRunning, mInterval;

  function mobSnakeInit() {
    mSnake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    mDir = {x:1,y:0}; mNextDir = {x:1,y:0};
    mScore = 0;
    mRunning = false;
    if (mobScoreEl) mobScoreEl.textContent = "0";
    if (mobStatEl)  mobStatEl.textContent  = "Tap Start";
    mobSpawnFood(); mobSnakeDraw();
  }

  function mobSpawnFood() {
    do { mFood = {x:Math.floor(Math.random()*MCOLS), y:Math.floor(Math.random()*MROWS)}; }
    while (mSnake.some(s => s.x===mFood.x && s.y===mFood.y));
  }

  function mobSnakeDraw() {
    if (!mobCtx) return;
    mobCtx.fillStyle = "#001800"; mobCtx.fillRect(0,0,MCOLS*MCELL,MROWS*MCELL);
    mobCtx.fillStyle = "#ff3333"; mobCtx.shadowColor="#ff0000"; mobCtx.shadowBlur=6;
    mobCtx.fillRect(mFood.x*MCELL+2, mFood.y*MCELL+2, MCELL-4, MCELL-4);
    mobCtx.shadowBlur = 0;
    mSnake.forEach((seg, i) => {
      mobCtx.fillStyle = i===0 ? "#00ff44" : `hsl(${130-i*2},100%,${45-i*0.5}%)`;
      mobCtx.shadowColor = i===0 ? "#00ff44" : "transparent"; mobCtx.shadowBlur = i===0 ? 5 : 0;
      mobCtx.fillRect(seg.x*MCELL+1, seg.y*MCELL+1, MCELL-2, MCELL-2);
    });
    mobCtx.shadowBlur = 0;
    if (!mRunning && mScore > 0) {
      mobCtx.fillStyle="rgba(0,0,0,0.6)"; mobCtx.fillRect(0,0,MCOLS*MCELL,MROWS*MCELL);
      mobCtx.fillStyle="#ff3333"; mobCtx.font="bold 20px 'Courier New'"; mobCtx.textAlign="center";
      mobCtx.fillText("GAME OVER", MCOLS*MCELL/2, MROWS*MCELL/2-8);
      mobCtx.fillStyle="#fff"; mobCtx.font="13px 'Courier New'";
      mobCtx.fillText(`Score: ${mScore}`, MCOLS*MCELL/2, MROWS*MCELL/2+12);
      mobCtx.textAlign="left";
    }
  }

  function mobSnakeTick() {
    mDir = {...mNextDir};
    const head = {x: mSnake[0].x+mDir.x, y: mSnake[0].y+mDir.y};
    if (head.x<0||head.x>=MCOLS||head.y<0||head.y>=MROWS||mSnake.some(s=>s.x===head.x&&s.y===head.y)) {
      clearInterval(mInterval); mRunning=false;
      if (mScore>mBest){mBest=mScore; if(mobBestEl)mobBestEl.textContent=mBest;}
      if (mobStatEl) mobStatEl.textContent="Game Over!";
      mobSnakeDraw(); return;
    }
    mSnake.unshift(head);
    if (head.x===mFood.x && head.y===mFood.y) {
      mScore+=10; if(mobScoreEl)mobScoreEl.textContent=mScore; mobSpawnFood();
    } else { mSnake.pop(); }
    mobSnakeDraw();
  }

  const mobStartBtn = document.getElementById("mob-snake-start");
  const mobResetBtn = document.getElementById("mob-snake-reset");

  if (mobStartBtn) mobStartBtn.onclick = () => {
    mobSnakeInit(); mRunning=true;
    if(mobStatEl)mobStatEl.textContent="Running";
    mobStartBtn.textContent="Running..."; mobStartBtn.disabled=true;
    clearInterval(mInterval); mInterval=setInterval(mobSnakeTick,130);
  };
  if (mobResetBtn) mobResetBtn.onclick = () => { clearInterval(mInterval); mobSnakeInit(); if(mobStartBtn){mobStartBtn.textContent="▶ Start";mobStartBtn.disabled=false;} };

  // D-pad controls
  const dirMap = { dpad_up:{x:0,y:-1}, dpad_left:{x:-1,y:0}, dpad_right:{x:1,y:0}, dpad_down:{x:0,y:1} };
  ["up","left","right","down"].forEach(d => {
    const btn = document.getElementById(`dpad-${d}`);
    if (btn) btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const nd = dirMap[`dpad_${d}`];
      if (nd.x !== -mDir.x || nd.y !== -mDir.y) mNextDir = nd;
    }, { passive: false });
  });

  if (mobCtx) mobSnakeInit();
}

// Sheet open/close (used by inline onclick too)
function mobOpenSheet(id) {
  document.querySelectorAll(".mob-sheet").forEach(s => s.classList.add("hidden"));
  const sheet = document.getElementById(id);
  if (sheet) {
    sheet.classList.remove("hidden");
    sheet.dispatchEvent(new Event("mob-open"));
  }
  const bd = document.getElementById("mob-backdrop");
  if (bd) bd.classList.remove("hidden");

  // Build player playlist on open
  if (id === "mob-sheet-player") {
    const mobPlaylistEl = document.getElementById("mob-playlist");
    const mobTracks = [
      { title:"CHRYSTAL - The Days (Notion Remix)" },
      { title:"eery - Her" },
      { title:"The Backseat Lovers - Slowing Down" }
    ];
    if (mobPlaylistEl && mobPlaylistEl.children.length === 0) {
      mobTracks.forEach((t, i) => {
        const el = document.createElement("div");
        el.className = "mob-playlist-item";
        el.innerHTML = `<span class="mob-playlist-num">${i+1}</span><span>${t.title}</span>`;
        mobPlaylistEl.appendChild(el);
      });
    }
  }
}

function mobCloseSheet(id) {
  const sheet = document.getElementById(id);
  if (sheet) sheet.classList.add("hidden");
  const bd = document.getElementById("mob-backdrop");
  if (bd) bd.classList.add("hidden");
}

function mobCloseAll() {
  document.querySelectorAll(".mob-sheet").forEach(s => s.classList.add("hidden"));
  const bd = document.getElementById("mob-backdrop");
  if (bd) bd.classList.add("hidden");
}

// ══════════════════════════════════════════════
// MOBILE LIGHTBOX
// Wired via event delegation so it works for
// any .mob-lightbox-trigger image/video, even
// those inside sheets opened after page load.
// ══════════════════════════════════════════════
(function initMobLightbox() {
  const lightbox    = document.getElementById("mob-lightbox");
  const lbInner     = document.getElementById("mob-lightbox-inner");
  const lbClose     = document.getElementById("mob-lightbox-close");
  if (!lightbox || !lbInner || !lbClose) return;

  function openLightbox(src, type) {
    lbInner.innerHTML = "";
    if (type === "video") {
      const vid = document.createElement("video");
      vid.src = src;
      vid.controls = true;
      vid.autoplay = true;
      vid.loop = true;
      vid.playsInline = true;
      lbInner.appendChild(vid);
    } else {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      lbInner.appendChild(img);
    }
    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lbInner.innerHTML = "";
    document.body.style.overflow = "";
  }

  // Delegate clicks on the document so it catches
  // triggers inside any sheet regardless of open state
  document.addEventListener("click", function(e) {
    const trigger = e.target.closest(".mob-lightbox-trigger");
    if (trigger) {
      e.stopPropagation();
      const src  = trigger.dataset.lightboxSrc;
      const type = trigger.dataset.lightboxType || "image";
      if (src) openLightbox(src, type);
    }
  }, true);

  lbClose.addEventListener("click", closeLightbox);

  // Tap the dark backdrop (not the media itself) to close.
  // lbInner fills the whole viewport, so we check if the tap landed
  // directly on the lightbox overlay or on lbInner background.
  lightbox.addEventListener("click", function(e) {
    if (e.target === lightbox || e.target === lbInner) closeLightbox();
  });

  // Swipe DOWN to dismiss — but only for a genuine single-finger swipe,
  // never during a pinch (two fingers). A pinch always has e.touches.length > 1.
  let touchStartY = 0;
  let touchStartX = 0;
  let isPinching   = false;

  lightbox.addEventListener("touchstart", (e) => {
    if (e.touches.length > 1) {
      // Two or more fingers -> pinch gesture starting, not a swipe
      isPinching = true;
      return;
    }
    isPinching   = false;
    touchStartY  = e.touches[0].clientY;
    touchStartX  = e.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener("touchmove", (e) => {
    if (e.touches.length > 1) isPinching = true; // fingers added mid-gesture
  }, { passive: true });

  lightbox.addEventListener("touchend", (e) => {
    if (isPinching) { isPinching = false; return; } // never dismiss after a pinch
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dx = e.changedTouches[0].clientX - touchStartX;
    // Only dismiss if the swipe is clearly downward (dy > 80) and more vertical than horizontal
    if (dy > 80 && dy > Math.abs(dx) * 1.5) closeLightbox();
  }, { passive: true });
})();

