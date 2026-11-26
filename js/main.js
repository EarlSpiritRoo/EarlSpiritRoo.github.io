/* ================================================================
   CONFIG: change your email address here, and only here.
   ================================================================ */
const CONFIG = { email: 'hello@yasmine.page' };
document.querySelectorAll('[data-email-link]').forEach(a => { a.href = 'mailto:' + CONFIG.email; });
document.querySelectorAll('[data-email-text]').forEach(a => { a.textContent = CONFIG.email; });

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const reduceMotion = motionPreference.matches || sessionStorage.getItem('portfolio-motion') === 'paused';
const motionToggle = document.getElementById('motionToggle');
if (motionToggle && !motionPreference.matches) {
  motionToggle.hidden = false;
  motionToggle.textContent = reduceMotion ? 'Resume animations' : 'Pause animations';
  motionToggle.addEventListener('click', () => { sessionStorage.setItem('portfolio-motion', reduceMotion ? 'running' : 'paused'); location.reload(); });
}
if (reduceMotion) document.documentElement.classList.add('motion-paused');

/* ---------------- Fit the keyboard to the screen ---------------- */
const kbWrap = document.getElementById('kbWrap');
const fitKeyboard = () => { const cs = getComputedStyle(kbWrap); const room = kbWrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 12; kbWrap.style.setProperty('--s', Math.min(1, room / 656).toFixed(4)); };
fitKeyboard();
if ('ResizeObserver' in window) new ResizeObserver(fitKeyboard).observe(kbWrap);
else addEventListener('resize', fitKeyboard);

/* ---------------- Keys press themselves: Y A S M I N E, then Enter ---------------- */
const kb = document.getElementById('kb');
const order = [...kb.querySelectorAll('.row-top'), ...kb.querySelectorAll('.row-bottom'), kb.querySelector('.enter')];
let step = 0, pointerInside = false;
const paused = () => pointerInside || document.hidden || kb.contains(document.activeElement);
const releaseAll = () => order.forEach(k => k.classList.remove('auto'));
function tick() {
  if (paused()) { releaseAll(); setTimeout(tick, 400); return; }
  const key = order[step];
  key.classList.add('auto');
  setTimeout(() => key.classList.remove('auto'), 200);
  step = (step + 1) % order.length;
  setTimeout(tick, step === 0 ? 1700 : 340);
}
kb.addEventListener('pointerenter', () => { pointerInside = true; releaseAll(); });
kb.addEventListener('pointerleave', () => { pointerInside = false; });

/* ================================================================
   SCROLL ANIMATIONS (GSAP)
   Everything is visible without JavaScript; GSAP only animates in.
   ================================================================ */
function startMotion() {
  if (reduceMotion) return;
  if (!window.gsap || !window.ScrollTrigger) { setTimeout(tick, 900); return; }
  gsap.registerPlugin(ScrollTrigger);

  // 1. Hero: headline lines rise up, then the keys drop in one by one
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro.from('.intro h1 .line > span', { yPercent: 110, duration: .9, stagger: .12 })
       .from('.anim-sub', { y: 20, opacity: 0, duration: .6 }, '-=.4')
       .from(order, { y: -80, opacity: 0, rotation: () => gsap.utils.random(-8, 8), duration: .7, ease: 'back.out(1.6)', stagger: .07 }, '-=.3')
       .add(() => setTimeout(tick, 400));

  // 2. About: words light up as you scroll through the sentence
  const about = document.getElementById('aboutText');
  about.innerHTML = about.textContent.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
  gsap.fromTo('#aboutText .w', { opacity: .15 }, { opacity: 1, stagger: .05, ease: 'none',
    scrollTrigger: { trigger: '#aboutText', start: 'top 80%', end: 'bottom 45%', scrub: true } });

  // Fact cards pop in; numbers count
  gsap.from('.fact, .edu div', { y: 60, opacity: 0, duration: .8, ease: 'back.out(1.4)', stagger: .1,
    scrollTrigger: { trigger: '.facts', start: 'top 85%' } });
  document.querySelectorAll('.count').forEach(el => {
    const to = +el.dataset.to, from = +(el.dataset.from || 0), obj = { v: from };
    gsap.to(obj, { v: to, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(obj.v); },
      scrollTrigger: { trigger: '.facts', start: 'top 85%' } });
  });

  // 3. "Sites I work on" slides sideways as you scroll

  // 4. Projects
  const projects = gsap.utils.toArray('.project');
  const mm = gsap.matchMedia();

  // Desktop: devices fly in, drift as you scroll, and each page shrinks as the next covers it
  mm.add('(min-width: 900px)', () => {
    projects.forEach((p, i) => {
      const flip = p.classList.contains('flip');
      const tl = gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 75%' }, defaults: { ease: 'power3.out' } });
      tl.from(p.querySelectorAll('.tags, h3, .pj-intro, .tiles li, .visit'), { y: 40, opacity: 0, duration: .7, stagger: .06 })
        .from(p.querySelector('.laptop'), { x: flip ? -120 : 120, rotationY: flip ? 12 : -12, opacity: 0, duration: 1 }, 0)
        .from(p.querySelector('.lbase'), { x: flip ? -120 : 120, opacity: 0, duration: 1 }, 0)
        .from(p.querySelector('.phone'), { y: 160, rotation: 6, opacity: 0, duration: 1.1, ease: 'back.out(1.3)' }, .2);
      gsap.fromTo(p.querySelector('.laptop'), { yPercent: 8 }, { yPercent: -6, ease: 'none',
        scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo(p.querySelector('.phone'), { yPercent: 22 }, { yPercent: -22, ease: 'none',
        scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
      const next = projects[i + 1];
      if (next && matchMedia('(min-height: 700px)').matches) {
        gsap.to(p.querySelector('.inner'), { scale: .9, opacity: .35, ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } });
      }
    });
  });

  // Phones: each site fills the screen. The laptop shows first, then swaps to a big phone as you scroll.
  mm.add('(max-width: 899px)', () => {
    document.documentElement.classList.add('js-motion');
    gsap.set('.project .laptop, .project .phone, .project .inner', { clearProps: 'transform' });
    projects.forEach(p => {
      gsap.from(p.querySelectorAll('.tags, h3, .pj-intro, .tiles li, .visit'), { y: 30, opacity: 0, duration: .6, stagger: .05, ease: 'power3.out',
        scrollTrigger: { trigger: p, start: 'top 70%' } });
      const laptop = p.querySelector('.laptop'), phone = p.querySelector('.phone');
      gsap.timeline({ scrollTrigger: { trigger: p, start: 'top top', end: 'bottom bottom', scrub: .6 } })
        .to({}, { duration: .3 })
        .to(laptop, { opacity: 0, scale: .82, duration: .35, ease: 'power2.in' })
        .fromTo(phone, { opacity: 0, scale: .82, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: .4, ease: 'power2.out' }, '-=.15')
        .to({}, { duration: .25 });
    });
    return () => document.documentElement.classList.remove('js-motion');
  });

  // 4b. "Every screen": words rise one by one, then the cards fan out from behind the phone
  gsap.from('.screens h2 .w', { yPercent: 110, opacity: 0, rotation: 4, duration: .8, ease: 'power3.out', stagger: .08,
    scrollTrigger: { trigger: '.screens', start: 'top 70%' } });


  // 5. Skills: heading rises in
  gsap.from('.skills h2', { y: 50, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.skills', start: 'top 75%' } });

  // 6. Contact: headline grows into place
  gsap.from('.contact h2', { scale: .75, yPercent: 20, opacity: 0, transformOrigin: 'left bottom', ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top 90%', end: 'top 30%', scrub: true } });
}
if (document.readyState === 'complete') startMotion(); else addEventListener('load', startMotion);

/* ================================================================
   HEADER PILL, PHONE CAROUSEL AND HOW-I-WORK STEPS
   ================================================================ */
(() => {
  const reduce = reduceMotion;


  /* Phone carousel: tap a card (or use the arrows) to show that screen in the phone */
  const SITES = {
    marions:      { name: 'Marion’s Kitchen', url: 'https://marionskitchen.com' },
    cookdinehost: { name: 'Cook Dine Host',   url: 'https://cookdinehost.com' },
    mako:         { name: 'MAKO Kitchenware', url: 'https://makokitchenware.com' }
  };
  const shots = [...document.querySelectorAll('.pscreen img')], ccards = document.querySelectorAll('.ccard'), nowLink = document.getElementById('nowLink');
  let shot = 0, autoTimer = null, carouselSeen = false;
  function showShot(k) {
    shot = (k + shots.length) % shots.length;
    shots.forEach((img, i) => { img.classList.toggle('show', i === shot); img.setAttribute('aria-hidden', String(i !== shot)); });
    ccards.forEach(c => { const active = +c.dataset.shot === shot; c.classList.toggle('on', active); c.setAttribute('aria-pressed', String(active)); });
    const site = SITES[shots[shot].dataset.site];
    nowLink.textContent = site.name + ' ↗'; nowLink.href = site.url;
  }
  const startAuto = () => { clearInterval(autoTimer); if (!reduce) autoTimer = setInterval(() => { if (carouselSeen && !document.hidden && !carousel.contains(document.activeElement) && !carousel.matches(':hover')) showShot(shot + 1); }, 6000); };
  ccards.forEach(c => c.addEventListener('click', () => { showShot(+c.dataset.shot); startAuto(); }));
  document.querySelector('.carr.prev').addEventListener('click', () => { showShot(shot - 1); startAuto(); });
  document.querySelector('.carr.next').addEventListener('click', () => { showShot(shot + 1); startAuto(); });
  const carousel = document.getElementById('carousel');
  if (!reduce) carousel.classList.add('prefan');   // cards start tucked behind the phone
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => {
    carouselSeen = e.isIntersecting;
    if (e.isIntersecting) carousel.classList.remove('prefan');   // then fan out
  }, { threshold: .3 }).observe(carousel);
  else { carouselSeen = true; carousel.classList.remove('prefan'); }
  showShot(0); startAuto();
})();

/* Tab title: changes when you switch away, and comes back when you return */
(() => {
  const title = document.title;
  const away = 'Come back soon! ✦';
  document.addEventListener('visibilitychange', () => { document.title = document.hidden ? away : title; });
})();