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

  const back = document.getElementById('parallax-back');
  const mid  = document.getElementById('parallax-mid');
  const fore = document.getElementById('parallax-fore');

  // More aggressive translations
  if (back) back.style.transform = `translate(${x * 15}px, ${y * 15}px) scale(1.1)`;
  if (mid)  mid.style.transform  = `translate(${x * 25}px, ${y * 25}px) scale(1.1)`;
  if (fore) fore.style.transform = `translate(${x * 35}px, ${y * 35}px) scale(1.2)`;
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
  // Only show motion permission prompt if required (iOS)
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    document.getElementById('motion-permission').classList.remove('hidden');
  }
});
