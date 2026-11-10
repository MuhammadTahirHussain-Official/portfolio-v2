/* Tahir Hussain — portfolio v2. Vanilla JS + GSAP + Lenis, no build step. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const animate = hasGsap && !reduce;
  const mouse = { x: -9999, y: -9999, t: 0 };
  let lenis = null, scrollVel = 0;

  $('#year').textContent = new Date().getFullYear();
  $$('.work, .contact').forEach((s) => (s.dataset.theme = 'dark'));
  $$('#wheelList a').forEach((a) => (a.dataset.tag = 'open'));

  if (!animate) {
    document.documentElement.classList.add('no-motion');
    $('#loader').remove();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = performance.now(); }, { passive: true });

  /* ── smooth scroll ── */
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
    lenis.on('scroll', (l) => { scrollVel = l.velocity; ScrollTrigger.update(); });
    gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const el = $(a.getAttribute('href')); if (!el) return;
    e.preventDefault(); lenis ? lenis.scrollTo(el, { duration: 1.5 }) : el.scrollIntoView({ behavior: 'smooth' });
  });

  /* ── 1. letters that change weight under the cursor ── */
  const letters = [];
  $$('[data-vf]').forEach((g) => {
    const text = g.textContent; g.textContent = ''; g.setAttribute('aria-label', text);
    const group = { el: g, visible: false, items: [] };
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      if (ch === ' ') { s.className = 'sp'; g.appendChild(s); return; }
      s.className = 'l'; s.textContent = ch; s.setAttribute('aria-hidden', 'true'); g.appendChild(s);
      group.items.push({ el: s, i, w: 800, intro: 0, cx: 0, cy: 0 });
    });
    letters.push(group);
    new IntersectionObserver(([e]) => { group.visible = e.isIntersecting; }, { rootMargin: '10%' }).observe(g);
  });
  gsap.ticker.add((time) => {
    const R = Math.max(220, innerWidth * .2);
    for (const g of letters) {
      if (!g.visible) continue;
      for (const it of g.items) { const r = it.el.getBoundingClientRect(); it.cx = r.left + r.width / 2; it.cy = r.top + r.height / 2; }
      for (const it of g.items) {
        const d = Math.hypot(it.cx - mouse.x, it.cy - mouse.y);
        const near = Math.pow(Math.max(0, 1 - d / R), 1.5);
        const wave = Math.pow(Math.max(0, Math.sin(time * 1.3 - it.i * .55)), 10) * .5;   // a thin ripple that keeps travelling
        const f = Math.max(near, wave, it.intro);
        it.w += (800 - 600 * f - it.w) * .16;
        const w = Math.round(it.w);
        if (w !== it.last) { it.last = w; it.el.style.fontVariationSettings = `"wght" ${w}, "wdth" ${(75 + (w - 200) / 24).toFixed(1)}`; }
      }
    }
  });

  /* ── 2. portrait: the cursor is a lens that shows how a machine reads the photo ── */
  const lens = { x: 0, y: 0, r: 0, tx: 0, ty: 0, tr: 0, intro: true };
  (function ascii() {
    const fig = $('#portrait'), img = $('#portraitImg'), cv = $('#ascii'), ctx = cv.getContext('2d');
    const ramp = ' .:-=+*x#%@'; let cells = [], cell = 8, dpr = 1, ok = false, inView = true;
    function build() {
      const w = fig.clientWidth, h = fig.clientHeight; if (!w || !img.naturalWidth) return;
      dpr = Math.min(devicePixelRatio || 1, 2); cell = w < 420 ? 6 : 8;
      const cols = Math.floor(w / cell), rows = Math.floor(h / cell);
      const off = document.createElement('canvas'); off.width = cols; off.height = rows;
      const o = off.getContext('2d', { willReadFrequently: true }); o.drawImage(img, 0, 0, cols, rows);
      let data; try { data = o.getImageData(0, 0, cols, rows).data; } catch { return; } // file:// blocks pixel reads
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `500 ${cell + 2}px "DM Mono", monospace`; ctx.textBaseline = 'top';
      cells = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const k = (y * cols + x) * 4; if (data[k + 3] < 70) continue;
        const lum = (data[k] * .299 + data[k + 1] * .587 + data[k + 2] * .114) / 255;
        cells.push({ x: x * cell, y: y * cell, d: 1 - lum });
      }
      cells.forEach(draw); ok = true;
    }
    function draw(c, jitter) {
      const n = clamp(Math.round(c.d * (ramp.length - 1)) + (jitter ? ((Math.random() * 3) | 0) - 1 : 0), 0, ramp.length - 1);
      ctx.fillStyle = '#eceae3'; ctx.fillRect(c.x, c.y, cell + .5, cell + .5);
      ctx.fillStyle = c.d > .82 ? '#0c1024' : '#2436ff'; ctx.fillText(ramp[n], c.x, c.y - 1);
    }
    img.complete ? build() : img.addEventListener('load', build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(fig);
    gsap.ticker.add((time) => {
      if (!ok || !inView) return;
      const r = fig.getBoundingClientRect();
      if (!lens.intro) {
        const idle = !fine || performance.now() - mouse.t > 3500;
        if (idle) { // drift on its own across the face
          lens.tx = r.width * (.5 + .2 * Math.sin(time * .7)); lens.ty = r.height * (.3 + .12 * Math.sin(time * 1.1 + 1)); lens.tr = Math.min(r.width * .17, 90);
        } else {
          lens.tx = mouse.x - r.left; lens.ty = mouse.y - r.top;
          const inside = mouse.x > r.left - 60 && mouse.x < r.right + 60 && mouse.y > r.top - 60 && mouse.y < r.bottom;
          lens.tr = inside ? Math.min(r.width * .26, 150) : 0;
        }
        lens.x += (lens.tx - lens.x) * .14; lens.y += (lens.ty - lens.y) * .14; lens.r += (lens.tr - lens.r) * .1;
      }
      cv.style.setProperty('--mx', lens.x.toFixed(1) + 'px'); cv.style.setProperty('--my', lens.y.toFixed(1) + 'px'); cv.style.setProperty('--mr', Math.max(0, lens.r).toFixed(1) + 'px');
      for (let i = 0, n = lens.r > 2 ? 90 : 24; i < n; i++) draw(cells[(Math.random() * cells.length) | 0], true); // keep it alive
    });
  })();

  /* ── 3. statement, generated one token at a time ── */
  (function say() {
    const p = $('#sayLine'), words = p.textContent.trim().split(/\s+/); p.textContent = '';
    const tks = words.map((w, i) => { const s = document.createElement('span'); s.className = 'tk'; s.textContent = w; p.append(s, i < words.length - 1 ? ' ' : ''); return s; });
    ScrollTrigger.create({ trigger: p, start: 'top 78%', end: 'bottom 48%', scrub: true, onUpdate: (s) => {
      const n = Math.ceil(s.progress * (tks.length + 1));
      tks.forEach((t, i) => { t.classList.toggle('on', i < n); t.classList.toggle('cur', i === n - 1 && n <= tks.length); });
    } });
  })();

  /* ── 4. roles drift sideways against each other ── */
  $$('.roles__row').forEach((row) => {
    const dir = +row.dataset.dir;
    gsap.fromTo($('h2', row), { x: () => dir * innerWidth * .16 }, { x: () => -dir * innerWidth * .05, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: .6, invalidateOnRefresh: true } });
  });

  /* ── 5. work: a wheel of titles + particles that reshape per project ── */
  (function work() {
    const stage = $('.work__stage'), list = $('#wheelList'), items = $$('li', list), n = items.length, TH = 30;
    const idx = $('#wIdx'), kind = $('#wKind'), stack = $('#wStack'), note = $('#wNote'), link = $('#wLink');
    let radius = 0, active = -1;
    function layout() {
      radius = (items[0].offsetHeight / 2) / Math.tan((TH / 2) * Math.PI / 180);
      items.forEach((li, i) => { li.style.transform = `rotateX(${-i * TH}deg) translateZ(${radius}px)`; });
    }
    layout(); addEventListener('resize', layout);
    const sticky = (f) => { const a = f * f * f, b = (1 - f) * (1 - f) * (1 - f); return a / (a + b); }; // lingers on each title
    function set(progress) {
      const raw = progress * (n - 1), p = Math.floor(raw) + sticky(raw - Math.floor(raw));
      list.style.transform = `translateZ(${-radius}px) rotateX(${p * TH}deg)`;
      items.forEach((li, i) => { const d = Math.abs(i - p); li.style.opacity = clamp(1 - d * .72, 0, 1); li.style.pointerEvents = d < .5 ? 'auto' : 'none'; });
      const a = clamp(Math.round(p), 0, n - 1);
      if (a !== active) {
        active = a; items.forEach((li, i) => li.classList.toggle('is-active', i === a));
        const d = items[a].firstElementChild.dataset;
        idx.textContent = `0${a + 1} / 0${n}`; kind.textContent = d.kind; stack.textContent = d.stack; note.textContent = d.note; link.href = items[a].firstElementChild.href;
        gsap.fromTo([kind, stack, note], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .45, stagger: .05, overwrite: true });
        morphTo(d.shape);
      }
    }
    ScrollTrigger.create({ trigger: stage, pin: true, start: 'top top', end: () => '+=' + (n - 1) * innerHeight * .8, scrub: .5, onUpdate: (s) => set(s.progress) });

    // particle morph
    const cv = $('#morph'), ctx = cv.getContext('2d'), G = 120; let W = 0, dpr = 1, parts = [], inView = false; const shapes = {};
    const draws = {
      bars(c) { [40, 66, 52, 88, 58, 78, 104].forEach((h, i) => c.fillRect(9 + i * 15, 112 - h, 11, h)); },
      globe(c) { c.lineWidth = 2.4; c.beginPath(); c.arc(60, 60, 52, 0, 7); c.stroke(); [18, 38].forEach((rx) => { c.beginPath(); c.ellipse(60, 60, rx, 52, 0, 0, 7); c.stroke(); }); c.beginPath(); c.ellipse(60, 60, 52, 17, 0, 0, 7); c.stroke(); [[36, 46], [84, 46]].forEach(([y, hw]) => { c.beginPath(); c.moveTo(60 - hw, y); c.lineTo(60 + hw, y); c.stroke(); }); },
      word(c) { c.font = '800 42px Arial, sans-serif'; c.textBaseline = 'alphabetic'; c.fillText('next', 3, 74); c.fillRect(100, 42, 13, 34); },
      radar(c) { c.lineWidth = 2.2; [52, 35, 18].forEach((r) => { c.beginPath(); c.arc(60, 60, r, 0, 7); c.stroke(); }); c.beginPath(); c.moveTo(60, 60); c.arc(60, 60, 52, -1.5, -.55); c.closePath(); c.fill(); c.beginPath(); c.arc(32, 78, 4, 0, 7); c.fill(); },
      flight(c) { c.lineWidth = 2.6; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(10, 98); c.quadraticCurveTo(60, 2, 110, 98); c.stroke(); c.setLineDash([]); [[10, 98], [110, 98]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); }); c.beginPath(); c.moveTo(86, 58); c.lineTo(62, 40); c.lineTo(66, 62); c.closePath(); c.fill(); },
    };
    Object.keys(draws).forEach((k) => {
      const o = document.createElement('canvas'); o.width = o.height = G; const c = o.getContext('2d'); c.fillStyle = c.strokeStyle = '#fff'; draws[k](c);
      const d = c.getImageData(0, 0, G, G).data, pts = []; for (let i = 3, j = 0; i < d.length; i += 4, j++) if (d[i] > 120) pts.push([(j % G) / G, ((j / G) | 0) / G]);
      shapes[k] = pts;
    });
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; cv.width = cv.height = W * dpr;
      const count = innerWidth < 700 ? 650 : 1200;
      if (parts.length !== count) parts = Array.from({ length: count }, () => ({ x: Math.random() * W, y: Math.random() * W, vx: 0, vy: 0, tx: W / 2, ty: W / 2, c: Math.random() < .18 }));
    }
    let current = null;
    function morphTo(name) {
      current = name || current; const pts = shapes[current]; if (!pts || !W) return;
      parts.forEach((p) => { const t = pts[(Math.random() * pts.length) | 0]; p.tx = (t[0] + (Math.random() - .5) / G) * W; p.ty = (t[1] + (Math.random() - .5) / G) * W; p.vx += (Math.random() - .5) * 26; p.vy += (Math.random() - .5) * 26; });
    }
    size(); addEventListener('resize', () => { size(); morphTo(); });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(cv);
    gsap.ticker.add(() => {
      if (!inView) return;
      const r = cv.getBoundingClientRect(), mx = mouse.x - r.left, my = mouse.y - r.top;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, W);
      for (const p of parts) {
        p.vx += (p.tx - p.x) * .045; p.vy += (p.ty - p.y) * .045;
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 4900) { const f = (1 - d2 / 4900) * 2.4, d = Math.sqrt(d2) || 1; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
        p.vx *= .84; p.vy *= .84; p.x += p.vx; p.y += p.vy;
        ctx.fillStyle = p.c ? '#eceae3' : '#9aa5ff'; ctx.fillRect(p.x, p.y, 2.2, 2.2);
      }
    });
    set(0);
  })();

  /* ── 6. toolkit: tools in orbit ── */
  (function orbit() {
    const box = $('#orbit'), tags = $$(':scope > span', box), per = [4, 5, 5], k = [.42, .7, 1], speed = [.2, -.14, .1];
    const rings = k.map(() => { const r = document.createElement('i'); r.className = 'ring'; box.prepend(r); return r; });
    let rx = 0, ry = 0, hovered = null, boost = 0, inView = false, t = 0, last = 0;
    const items = []; let c = 0;
    per.forEach((count, ring) => { for (let j = 0; j < count && c < tags.length; j++, c++) items.push({ el: tags[c], ring, a: (j / count) * Math.PI * 2 + ring * .7 }); });
    function size() { rx = box.clientWidth * .5 - Math.min(110, box.clientWidth * .16); ry = box.clientHeight * .46; rings.forEach((r, i) => { r.style.width = rx * 2 * k[i] + 'px'; r.style.height = ry * 2 * k[i] + 'px'; }); }
    size(); addEventListener('resize', size);
    tags.forEach((el) => { el.addEventListener('mouseenter', () => (hovered = el)); el.addEventListener('mouseleave', () => (hovered = null)); });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(box);
    gsap.ticker.add((time) => {
      const dt = Math.min(.05, time - last); last = time; if (!inView) return;
      boost += (Math.min(Math.abs(scrollVel) / 6, 9) - boost) * .08;      // scrolling spins it up
      if (!hovered) t += dt * (1 + boost);
      for (const it of items) {
        const a = it.a + t * speed[it.ring], depth = (Math.sin(a) + 1) / 2;
        const x = Math.cos(a) * rx * k[it.ring], y = Math.sin(a) * ry * k[it.ring];
        it.el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${(.72 + depth * .4).toFixed(3)})`;
        it.el.style.opacity = (.35 + depth * .65).toFixed(2); it.el.style.zIndex = it.el === hovered ? 99 : Math.round(depth * 40) + (depth > .5 ? 50 : 0);
      }
    });
  })();

  /* ── 7. contact: a field of arrows that all turn to face the pointer; a click sends a shockwave ── */
  (function field() {
    const sec = $('#contact'), cv = $('#field'), ctx = cv.getContext('2d');
    let w, h, dpr, gap, arrows = [], inView = false; const waves = [], p = { x: 0, y: 0, tx: 0, ty: 0, last: -1e9 };
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr;
      gap = w < 700 ? 34 : 46; arrows = [];
      const cols = Math.ceil(w / gap), rows = Math.ceil(h / gap), ox = (w - (cols - 1) * gap) / 2, oy = (h - (rows - 1) * gap) / 2;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) arrows.push({ x: ox + x * gap, y: oy + y * gap, a: -Math.PI / 4, k: 0 });
      p.x = p.tx = w * .7; p.y = p.ty = h * .35;
    }
    size(); addEventListener('resize', size);
    const at = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    sec.addEventListener('pointermove', (e) => { [p.tx, p.ty] = at(e); p.last = performance.now(); }, { passive: true });
    sec.addEventListener('pointerdown', (e) => { const [x, y] = at(e); waves.push({ x, y, r: 0 }); p.tx = x; p.ty = y; p.last = performance.now(); }, { passive: true });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(cv);
    gsap.ticker.add((time) => {
      if (!inView) return;
      if (performance.now() - p.last > 2600) { p.tx = w * (.5 + .38 * Math.sin(time * .5)); p.ty = h * (.42 + .3 * Math.sin(time * .83 + 1)); } // wanders when left alone
      p.x += (p.tx - p.x) * .12; p.y += (p.ty - p.y) * .12;
      for (let i = waves.length - 1; i >= 0; i--) { waves[i].r += 15; if (waves[i].r > Math.hypot(w, h)) waves.splice(i, 1); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); ctx.lineCap = 'square';
      const reach = Math.max(260, w * .26), L = gap * .3;
      for (const a of arrows) {
        const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy);
        let da = Math.atan2(dy, dx) - a.a; da = Math.atan2(Math.sin(da), Math.cos(da)); a.a += da * .18;
        let k = Math.pow(Math.max(0, 1 - d / reach), 1.6);
        for (const wv of waves) { const q = Math.abs(Math.hypot(a.x - wv.x, a.y - wv.y) - wv.r); if (q < 70) { const f = 1 - q / 70; k = Math.max(k, f); a.a += f * .5; } }
        a.k += (k - a.k) * .2;
        const len = L * (.55 + a.k * 1.5), c = Math.cos(a.a), s = Math.sin(a.a), hx = a.x + c * len, hy = a.y + s * len, hd = len * .62;
        ctx.strokeStyle = a.k > .5 ? '#eceae3' : a.k > .12 ? '#9aa5ff' : 'rgba(154,165,255,.3)'; ctx.lineWidth = 1.4 + a.k * 2;
        ctx.beginPath(); ctx.moveTo(a.x - c * len, a.y - s * len); ctx.lineTo(hx, hy);
        ctx.moveTo(hx - Math.cos(a.a - .7) * hd, hy - Math.sin(a.a - .7) * hd); ctx.lineTo(hx, hy); ctx.lineTo(hx - Math.cos(a.a + .7) * hd, hy - Math.sin(a.a + .7) * hd); ctx.stroke();
      }
    });
  })();

  /* ── 8. cursor: an arrow that turns to face its direction of travel ── */
  if (fine) {
    const cur = $('#cursor'), svg = $('svg', cur), tag = $('#cursorTag');
    let px = 0, py = 0, ang = 0, target = 0, lastMove = 0, shown = false;
    addEventListener('mousemove', (e) => {
      if (!shown) { shown = true; px = e.clientX; py = e.clientY; document.documentElement.classList.add('has-cursor'); }
      const dx = e.clientX - px, dy = e.clientY - py;
      if (dx * dx + dy * dy > 16) { target = Math.atan2(dy, dx) * 180 / Math.PI + 135; lastMove = performance.now(); px = e.clientX; py = e.clientY; }
      cur.style.transform = `translate3d(${e.clientX - 2}px,${e.clientY - 2}px,0)`;
      const t = e.target, tg = t.closest && t.closest('[data-tag]');
      cur.classList.toggle('is-link', !!(t.closest && t.closest('a, button, .orbit > span')));
      cur.classList.toggle('has-tag', !!tg); if (tg) tag.textContent = tg.dataset.tag;
      cur.classList.toggle('on-dark', !!(t.closest && t.closest('[data-theme="dark"]')));
    }, { passive: true });
    document.addEventListener('mouseleave', () => { shown = false; document.documentElement.classList.remove('has-cursor'); });
    gsap.ticker.add(() => {
      if (performance.now() - lastMove > 500) target = 0;                 // settle back to a normal pointer
      let d = ((target - ang + 540) % 360) - 180; ang += d * .16;
      svg.style.rotate = ang.toFixed(1) + 'deg';
    });
  }

  /* ── nav colour follows the section underneath ── */
  const nav = $('.nav');
  $$('[data-theme="dark"]').forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 34px', end: 'bottom 34px', onToggle: (st) => nav.classList.toggle('is-light', st.isActive) }));

  // hero lifts away as you leave it
  gsap.to('.hero__name, .hero__portrait, .hero__roles', { y: () => -innerHeight * .06, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });

  /* ── intro ── */
  const loader = $('#loader'), num = $('#loaderNum'), heroLetters = letters.filter((g) => g.el.closest('.hero')).flatMap((g) => g.items);
  heroLetters.forEach((it) => { it.intro = 1; it.w = 200; });
  const fig = $('#portrait'); lens.x = fig.clientWidth / 2; lens.y = fig.clientHeight * .3; lens.r = Math.hypot(fig.clientWidth, fig.clientHeight);
  if (lenis) lenis.stop(); scrollTo(0, 0);
  let done = false;
  function start() {
    if (done) return; done = true; window.__started = true; num.textContent = '100';
    if (lenis) lenis.start();
    gsap.timeline({ defaults: { ease: 'power4.inOut' } })
      .to(num, { opacity: 0, duration: .3 })
      .to('.loader i', { scaleY: 0, duration: .9, stagger: .07 }, '<')
      .from('.hero__name .l', { yPercent: 60, opacity: 0, duration: .9, stagger: .035, ease: 'power3.out' }, '-=.75')
      .to(heroLetters, { intro: 0, duration: 1.4, stagger: .04, ease: 'power2.out' }, '<.1')
      .from('.hero__portrait', { yPercent: 8, opacity: 0, duration: 1.1, ease: 'power3.out' }, '<')
      .to(lens, { r: 0, duration: 2, ease: 'power3.inOut', onComplete: () => { lens.intro = false; } }, '<.2')
      .from('.hero__first, .hero__roles li, .hero__down, .nav a', { opacity: 0, y: 14, duration: .7, stagger: .05, ease: 'power3.out' }, '-=1.4')
      .add(() => { loader.remove(); ScrollTrigger.refresh(); });
  }
  const c = { v: 0 };
  gsap.to(c, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { num.textContent = String(Math.round(c.v)).padStart(2, '0'); }, onComplete: start });
  setTimeout(start, 5000);
  addEventListener('load', () => ScrollTrigger.refresh());
})();
