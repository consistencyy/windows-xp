// Optional: rotating Win-era boot/status lines + fake boot time.
// If you prefer zero JS, you can delete this file entirely—the loader animates in pure CSS.

let x = 1;
let int = setInterval(() => {
    if (x == document.querySelector(".loader").offsetWidth) x = 0
    x += 1
    document.querySelectorAll(".loader span")[0].style.marginLeft = x + "px"
}, 10);

const statusEl = document.querySelector('.status');
const lines = [
  'Loading personal settings…',
  'Making modern things look retro…',
  'Loading pixelated background…',
  'Applying for funding…',
  'Fixing things last minute…',
  'Preparing desktop…'
];

let i = 0;
function tick(){
  statusEl.textContent = lines[i % lines.length];
  i++;
}
tick();

const id = setInterval(tick, 1200);

// If you want to auto-continue to your homepage, uncomment below and set the delay.
// setTimeout(() => { window.location.href = '/home'; }, 4200);
