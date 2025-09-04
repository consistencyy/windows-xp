// Scroll reveal via IntersectionObserver
const io = new IntersectionObserver((entries)=>{
entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
},{threshold:.16});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));


// Smooth scroll for anchor links
Array.from(document.querySelectorAll('a[href^="#"]')).forEach(a=>{
a.addEventListener('click',e=>{
const href=a.getAttribute('href');
const target=href && document.querySelector(href);
if(target){ e.preventDefault(); target.scrollIntoView({behavior:'smooth',block:'start'});}
})
})


// Year in footer
const yEl=document.getElementById('y'); if(yEl) yEl.textContent=new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('#primary-navigation');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    menu.classList.toggle('open', !isOpen);
  });

  // close after tapping a link (mobile nicety)
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
    });
  });
});
// Interactive tilt for service cards (desktop / precision pointers only)
(function(){
  const cards = Array.from(document.querySelectorAll('.card.service'));
  if (!cards.length) return;

  // Skip on touch/coarse pointers (prevents jitter while scrolling)
  const isCoarse = window.matchMedia('(pointer:coarse)').matches;
  if (isCoarse) return;

  const MAX = 12;        // max tilt degrees
  const DAMP = 24;       // easing factor (higher = smoother/laggier)

  const lerp = (a, b, t) => a + (b - a) * t;

  cards.forEach(card => {
    let rx = 0, ry = 0;  // rendered rotation
    let tx = 0, ty = 0;  // target rotation
    let raf = null;

    const rect = () => card.getBoundingClientRect();

    function onMove(e){
      const r = rect();
      const x = (e.clientX - r.left) / r.width;   // 0..1
      const y = (e.clientY - r.top)  / r.height;  // 0..1

      // set CSS variables for the glow hotspot
      card.style.setProperty('--mx', (x * 100) + '%');
      card.style.setProperty('--my', (y * 100) + '%');

      // map to -MAX..MAX and invert X for natural feel
      tx = lerp(-MAX, MAX, x);
      ty = lerp( MAX,-MAX, y);

      if (!raf) raf = requestAnimationFrame(update);
    }

    function onLeave(){
      tx = 0; ty = 0;                   // settle back to flat
      if (!raf) raf = requestAnimationFrame(update);
    }

    function update(){
      rx += (ty - rx) / DAMP;           // ease toward target
      ry += (tx - ry) / DAMP;
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      if (Math.abs(rx - ty) > 0.01 || Math.abs(ry - tx) > 0.01){
        raf = requestAnimationFrame(update);
      } else {
        raf = null;
      }
    }

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
})();