/* ================================================================
   CONFIG: change your email address here, and only here.
   ================================================================ */
const CONFIG = { email: 'hello@yasmine.page' };
document.querySelectorAll('[data-email-link]').forEach(a => { a.href = 'mailto:' + CONFIG.email; });
document.querySelectorAll('[data-email-text]').forEach(a => { a.textContent = CONFIG.email; });

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- Fit the keyboard to the screen ---------------- */
const kbWrap = document.getElementById('kbWrap');
const fitKeyboard = () => { const cs = getComputedStyle(kbWrap); const room = kbWrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 12; kbWrap.style.setProperty('--s', Math.min(1, room / 656).toFixed(4)); };
fitKeyboard();
new ResizeObserver(fitKeyboard).observe(kbWrap);

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
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) { setTimeout(tick, 900); return; }
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


  // 5. Skills: heading rises in (the washing line runs on its own script below)
  gsap.from('.skills h2', { y: 50, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.skills', start: 'top 75%' } });

  // 6. Contact: headline grows into place
  gsap.from('.contact h2', { scale: .75, yPercent: 20, opacity: 0, transformOrigin: 'left bottom', ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top 90%', end: 'top 30%', scrub: true } });
}
if (document.readyState === 'complete') startMotion(); else addEventListener('load', startMotion);

/* ================================================================
   WASHING LINE
   The rope sags like a real line. Cards slide along it on their own,
   and moving the cursor across it sends ripples down the rope.
   ================================================================ */
(() => {
  const stage = document.getElementById('lineStage');
  const ropePath = document.getElementById('ropePath');
  const list = document.getElementById('cards');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { stage.classList.add('still'); return; }

  // Repeat the cards so the line never runs out
  const originals = [...list.children];
  const pitch = () => originals[0].offsetWidth + (window.innerWidth < 900 ? 14 : 44);
  let cards = [];
  // Make sure there are always enough cards to fill the line, even after the window is resized
  function fill() {
    while (list.children.length * pitch() < stage.offsetWidth + pitch() * 3) {
      originals.forEach(c => { const copy = c.cloneNode(true); copy.setAttribute('aria-hidden', 'true'); list.appendChild(copy); });
    }
    cards = [...list.children].map((el, i) => cards[i] || { el, tilt: (Math.sin(i * 12.9898) * 43758.5453 % 1) * 6 - 3, swing: 0, swingV: 0 });
  }
  fill();
  addEventListener('resize', fill);

  // Rope physics: a row of points that can move up and down
  const N = 90;
  const disp = new Float32Array(N), vel = new Float32Array(N);
  let W = 0, TOP = 40, SAG = 46;
  const resize = () => { W = stage.offsetWidth; SAG = Math.min(56, W * 0.035); TOP = window.innerWidth < 900 ? 26 : 40; };
  resize(); addEventListener('resize', resize);

  const baseY = x => TOP + SAG * 4 * (x / W) * (1 - x / W);
  const dispAt = x => {
    const f = Math.max(0, Math.min(N - 1.001, (x / W) * (N - 1))), i = Math.floor(f), t = f - i;
    return disp[i] * (1 - t) + disp[i + 1] * t;
  };
  const yAt = x => baseY(x) + dispAt(x);

  let offset = 0;
  // Cursor: push the rope near the pointer, harder the faster it moves
  let lastX = null, lastY = null;
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (lastX !== null) {
      const speed = Math.min(80, Math.hypot(x - lastX, y - lastY));
      const near = Math.abs(y - yAt(x)) < 120;
      if (near) {
        for (let i = 0; i < N; i++) {
          const px = (i / (N - 1)) * W, d = (px - x) / 70;
          vel[i] += speed * 9 * Math.exp(-d * d) * (y > yAt(x) ? 1 : -1);
        }
      }
    }
    lastX = x; lastY = y;
  });
  stage.addEventListener('pointerleave', () => { lastX = lastY = null; });

  // Drag the line left or right (it keeps sliding a little when you let go)
  let dragging = false, dragX = 0, fling = 0;
  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;                   // only a left click or a touch drags (right-click opens menus and DevTools)
    dragging = true; dragX = e.clientX; fling = 0;
    stage.setPointerCapture(e.pointerId); stage.classList.add('grabbing');
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - dragX; dragX = e.clientX;
    offset -= dx; fling = Math.max(-40, Math.min(40, -dx));
  });
  const endDrag = () => { dragging = false; stage.classList.remove('grabbing'); };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('lostpointercapture', endDrag);
  // Leaving the page (a menu, DevTools, another tab) must never leave the line stuck mid-drag or mid-ripple
  const settle = () => { endDrag(); lastX = lastY = null; fling = 0; disp.fill(0); vel.fill(0); };
  addEventListener('blur', settle);
  stage.addEventListener('contextmenu', settle);
  document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); });
  // Re-measure whenever the stage itself changes size, not only on window resize
  if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); fill(); }).observe(stage);

  let last = performance.now(), visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);

  function frame(now) {
    requestAnimationFrame(frame);                 // keep the loop alive whatever happens below
    const dt = Math.min(0.033, Math.max(0, (now - last) / 1000)); last = now;
    if (W !== stage.offsetWidth) resize();        // the window or device changed size
    // While DevTools or a resize briefly gives the line no width, skip drawing: dividing by zero would break every card
    if (W > 0 && visible && !document.hidden) {
      // Wave along the rope (two small steps for stability)
      for (let s = 0; s < 2; s++) {
        const h = dt / 2;
        for (let i = 1; i < N - 1; i++) {
          const acc = 1400 * (disp[i - 1] + disp[i + 1] - 2 * disp[i]) - 14 * disp[i] - 2.6 * vel[i];
          vel[i] += acc * h;
        }
        for (let i = 1; i < N - 1; i++) { disp[i] += vel[i] * h; disp[i] = Math.max(-60, Math.min(60, disp[i])); }
      }

      // Draw the rope
      let d = '';
      for (let i = 0; i <= 60; i++) { const x = (i / 60) * W; d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + yAt(x).toFixed(1); }
      ropePath.setAttribute('d', d);

      // Slide the cards along and hang them from the rope
      if (!dragging) { offset += dt * 34 + fling; fling *= 0.94; }
      const p = pitch(), L = cards.length * p;
      cards.forEach((c, i) => {
        let x = ((i * p - offset) % L + L) % L - p;
        const cx = x + c.el.offsetWidth / 2;
        const y = yAt(cx);
        const slope = (yAt(cx + 6) - yAt(cx - 6)) / 12;
        // cards swing a little when the rope under them moves
        const target = Math.atan(slope) * 57.3 * 0.9;
        c.swingV += ((target - c.swing) * 60 - c.swingV * 7) * dt;
        c.swing += c.swingV * dt;
        if (!Number.isFinite(c.swing) || !Number.isFinite(c.swingV)) { c.swing = 0; c.swingV = 0; }   // never let a bad frame freeze a card
        c.el.style.transform = `translate(${x.toFixed(1)}px, ${(y + 4).toFixed(1)}px) rotate(${(c.tilt + c.swing).toFixed(2)}deg)`;
      });
    }
  }
  requestAnimationFrame(frame);
})();

/* ================================================================
   HEADER PILL, PHONE CAROUSEL AND HOW-I-WORK STEPS
   ================================================================ */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;


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
    shots.forEach((img, i) => img.classList.toggle('show', i === shot));
    ccards.forEach(c => c.classList.toggle('on', +c.dataset.shot === shot));
    const site = SITES[shots[shot].dataset.site];
    nowLink.textContent = site.name + ' ↗'; nowLink.href = site.url;
  }
  const startAuto = () => { clearInterval(autoTimer); if (!reduce) autoTimer = setInterval(() => { if (carouselSeen && !document.hidden) showShot(shot + 1); }, 6000); };
  ccards.forEach(c => c.addEventListener('click', () => { showShot(+c.dataset.shot); startAuto(); }));
  document.querySelector('.carr.prev').addEventListener('click', () => { showShot(shot - 1); startAuto(); });
  document.querySelector('.carr.next').addEventListener('click', () => { showShot(shot + 1); startAuto(); });
  const carousel = document.getElementById('carousel');
  if (!reduce) carousel.classList.add('prefan');   // cards start tucked behind the phone
  new IntersectionObserver(([e]) => {
    carouselSeen = e.isIntersecting;
    if (e.isIntersecting) carousel.classList.remove('prefan');   // then fan out
  }, { threshold: .3 }).observe(carousel);
  showShot(0); startAuto();
})();

/* Tab title: changes when you switch away, and comes back when you return */
(() => {
  const title = document.title;
  const away = 'Come back soon! ✦';
  document.addEventListener('visibilitychange', () => { document.title = document.hidden ? away : title; });
})();