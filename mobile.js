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

// ---- Parallax via Device Orientation ----
window.addEventListener("deviceorientation", (e) => {
  const x = e.gamma / 45;
  const y = e.beta / 90;

  const back = document.querySelector('.back');
  const mid  = document.querySelector('.mid');
  const fore = document.querySelector('.fore');

  if (back) back.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
  if (mid)  mid.style.transform  = `translate(${x * 20}px, ${y * 20}px)`;
  if (fore) fore.style.transform = `translate(${x * 30}px, ${y * 30 + 80}px)`;
});

// ---- App Open/Close Logic ----
function openMobileApp(id) {
  const app = document.getElementById("app-" + id);
  if (app) {
    app.classList.remove("hidden");
    setTimeout(() => app.classList.add("show"), 10); // allow for transition
  }
}

function closeMobileApp(id) {
  const app = document.getElementById("app-" + id);
  if (app) {
    app.classList.remove("show");
    setTimeout(() => app.classList.add("hidden"), 300); // match CSS duration
  }
}

// ---- Init ----
window.addEventListener('DOMContentLoaded', () => {
  // Only show motion permission prompt if required (iOS)
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    document.getElementById('motion-permission').classList.remove('hidden');
  }
});

function openProjectCategory(cat) {
  const root = document.getElementById("mobile-projects-root");
  const target = document.getElementById("mobile-cat-" + cat);

  root.classList.add("slide-out");
  setTimeout(() => {
    root.classList.add("hidden");
    root.classList.remove("slide-out");

    target.classList.remove("hidden");
    target.classList.add("category-section", "slide-in");

    setTimeout(() => {
      target.classList.remove("slide-in");
    }, 300);
  }, 300);
}

function backToProjectRoot() {
  const root = document.getElementById("mobile-projects-root");
  document.querySelectorAll("[id^=mobile-cat-]").forEach(cat => {
    cat.classList.add("slide-out");

    setTimeout(() => {
      cat.classList.add("hidden");
      cat.classList.remove("slide-out");

      root.classList.remove("hidden");
      root.classList.add("category-section", "slide-in");

      setTimeout(() => {
        root.classList.remove("slide-in");
      }, 300);
    }, 300);
  });
}

