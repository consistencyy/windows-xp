window.onload = function () {
  var frame = document.querySelector(".crt-frame");
  var siteFrame = document.getElementById("site-frame");

  // Stage durations. Two distinct boot phases now:
  //   1. terminal-boot.html — quick 80's-style text boot log
  //   2. loading.html        — crimsonsky background + XP-style boot
  // then the CRT flash hands off to desktop.html.
  var TERMINAL_MS = 3200;
  var INTRO_MS = 7000;

  // CRT flash / wide-open transition timing.
  var TRANSITION_MS = 700;
  var BLACKOUT_MS = 200;

  // ---- Log off: flash immediately, then reboot the whole page ---
  // (desktop.html can't reach playCrtTransition directly since it lives
  // in its own iframe, so it posts a message up to us instead.)
  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "logoff") {
      playCrtTransition(function () {
        window.location.reload();
      });
    }
  });

  // ---- Stage 1: 80's terminal boot ------------------------------
  var terminalFrame = document.createElement("iframe");
  terminalFrame.id = "terminal-boot";
  terminalFrame.src = "terminal-boot.html";
  terminalFrame.title = "Booting";
  terminalFrame.style.display = "none";
  siteFrame.appendChild(terminalFrame);

  terminalFrame.onload = function () {
    terminalFrame.style.display = "block";
  };

  setTimeout(function () {
    // ---- Stage 2: crimsonsky + XP-style loading screen ----------
    var loadingFrame = document.createElement("iframe");
    loadingFrame.id = "loading";
    loadingFrame.src = "loading.html";
    loadingFrame.title = "Loading";
    loadingFrame.style.opacity = "0";
    loadingFrame.style.pointerEvents = "none";
    siteFrame.appendChild(loadingFrame);

    loadingFrame.onload = function () {
      // Quick crossfade out of the terminal into the loading screen
      // (the big CRT flash is saved for the desktop reveal).
      loadingFrame.style.transition = "opacity 250ms ease-in";
      requestAnimationFrame(function () {
        loadingFrame.style.opacity = "1";
      });
      setTimeout(function () {
        terminalFrame.remove();
      }, 300);

      setTimeout(function () {
        // ---- Stage 3: desktop, revealed via the CRT flash -------
        var desktopFrame = document.createElement("iframe");
        desktopFrame.id = "desktop";
        desktopFrame.src = "desktop.html";
        desktopFrame.title = "Desktop";
        desktopFrame.style.opacity = "0";
        desktopFrame.style.pointerEvents = "none";
        siteFrame.appendChild(desktopFrame);

        desktopFrame.onload = function () {
          playCrtTransition(function revealDesktop() {
            loadingFrame.remove();
            desktopFrame.style.opacity = "1";
            desktopFrame.style.pointerEvents = "auto";

            // Desktop stage: the CRT/VHS treatment is intro-only.
            // Dropping it here happens while the screen is still
            // blacked out by the flash, so there's no visible pop.
            var crtOverlay = document.querySelector(".crt-overlay");
            if (crtOverlay) crtOverlay.style.display = "none";

            var meta = document.createElement("meta");
            meta.name = "viewport";
            meta.content = "width=device-width,initial-scale=1,maximum-scale=1.0,user-scalable=no";
            document.head.appendChild(meta);
          });
        };
      }, INTRO_MS);
    };
  }, TERMINAL_MS);

  // Old-CRT-style "power on" wipe: screen blacks out, a bright
  // horizontal line flashes at center, then rapidly expands to fill
  // the frame, revealing whatever's underneath. Appended inside
  // .crt-frame (not body) so it's clipped by the frame's own
  // overflow: hidden, same as the rest of the site.
  function playCrtTransition(onBlackout) {
    var overlay = document.createElement("div");
    overlay.id = "crt-transition";

    var line = document.createElement("div");
    line.id = "crt-transition-line";
    overlay.appendChild(line);

    frame.appendChild(overlay);

    requestAnimationFrame(function () {
      overlay.classList.add("run");
    });

    // Swap the iframes once the overlay is fully opaque — the swap
    // itself is invisible since it happens under solid black.
    setTimeout(onBlackout, BLACKOUT_MS);

    // Clean up once the transition has fully played out.
    setTimeout(function () {
      overlay.remove();
    }, TRANSITION_MS + 50);
  }
};