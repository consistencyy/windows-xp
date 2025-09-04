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
