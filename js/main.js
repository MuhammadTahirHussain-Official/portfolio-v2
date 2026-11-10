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
  $$('.work').forEach((s) => (s.dataset.theme = 'dark'));
  $$('#wheelList a').forEach((a) => (a.dataset.tag = 'open'));

  if (!animate) {
    document.documentElement.classList.add('no-motion'); $('#pile').classList.add('is-static');
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

  /* ── 5. work: a rotating 3D point cloud that reshapes per project; the title lives on a split-flap board ── */
  (function work() {
    const stage = $('.work__stage'), src = $$('#wheelList a'), n = src.length;
    const flap = $('#flap'), ticks = $$('#ticks li'), bar = $('#wBar');
    const idx = $('#wIdx'), kind = $('#wKind'), stack = $('#wStack'), note = $('#wNote'), link = $('#wLink');
    const rnd = () => Math.random() * 2 - 1;

    // split-flap board
    const CELLS = 11, glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const cells = Array.from({ length: CELLS }, () => { const s = document.createElement('span'); s.className = 'fl is-blank'; s.textContent = '\u00a0'; flap.appendChild(s); return s; });
    let run = 0;
    function flapTo(text) {
      const me = ++run, t = text.toUpperCase().padEnd(CELLS).slice(0, CELLS); flap.setAttribute('aria-label', text);
      cells.forEach((cEl, i) => {
        let k = 0; const total = 5 + i * 2;
        (function step() {
          if (me !== run) return;
          const last = k >= total, ch = last ? t[i] : glyphs[(Math.random() * glyphs.length) | 0];
          cEl.textContent = ch === ' ' ? '\u00a0' : ch; cEl.classList.toggle('is-blank', last && t[i] === ' ');
          cEl.animate([{ transform: 'rotateX(-85deg)', opacity: .35 }, { transform: 'rotateX(0deg)', opacity: 1 }], { duration: 80, easing: 'ease-out' });
          if (!last) { k++; setTimeout(step, 46); }
        })();
      });
    }

    // point cloud
    const cv = $('#cloud'), ctx = cv.getContext('2d'); let W = 0, H = 0, dpr = 1, N = 0, P = [], inView = false;
    function sample2D(draw) {
      const G = 160, o = document.createElement('canvas'); o.width = o.height = G; const c = o.getContext('2d'); c.fillStyle = '#fff'; draw(c);
      const d = c.getImageData(0, 0, G, G).data, pts = []; for (let i = 3, k = 0; i < d.length; i += 4, k++) if (d[i] > 120) pts.push([((k % G) / G) * 2 - 1, (((k / G) | 0) / G) * 2 - 1]);
      return pts;
    }
    const wordPts = sample2D((c) => { c.font = '800 58px Arial, sans-serif'; c.textBaseline = 'middle'; c.fillText('next', 2, 82); c.fillRect(134, 56, 18, 48); });
    const planePts = sample2D((c) => { c.beginPath(); c.moveTo(154, 80); c.lineTo(10, 22); c.lineTo(50, 80); c.lineTo(10, 138); c.closePath(); c.fill(); });
    const bars = [.35, .6, .45, .85, .55, .75, 1];
    const gen = {
      bars: () => { const i = (Math.random() * 7) | 0, r = (Math.random() * 3) | 0, hgt = bars[(i + r * 2) % 7] * (1 - r * .1); return [-.95 + i * .28 + Math.random() * .2, .8 - Math.random() * hgt * 1.6, -.5 + r * .45 + Math.random() * .2]; },
      globe: (i, m) => { if (i > m * .82) { const a = Math.random() * 6.283; return [Math.cos(a) * 1.22, Math.sin(a) * .3, Math.sin(a) * 1.22]; } const y = 1 - 2 * (i + .5) / (m * .82), r = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.39996; return [Math.cos(th) * r * .86, y * .86, Math.sin(th) * r * .86]; },
      word: () => { const p = wordPts[(Math.random() * wordPts.length) | 0]; return [p[0] * 1.25, p[1] * 1.25, rnd() * .09]; },
      storm: () => { const t = Math.random(), a = t * 11 + ((Math.random() * 3) | 0) * 2.094 + rnd() * .22, r = (.07 + .9 * Math.pow(t, 1.5)) * (1 + rnd() * .07); return [Math.cos(a) * r, .9 - 1.8 * t, Math.sin(a) * r]; },
      plane: () => { const p = planePts[(Math.random() * planePts.length) | 0]; return [p[0] * 1.05, p[1] * .95 * .6 - Math.abs(p[1]) * .12, -Math.abs(p[1]) * .75 + rnd() * .02]; },
    };
    const spins = { bars: true, globe: true, storm: true, word: false, plane: false };
    let shape = null, spinA = 0, mix = 1, tiltX = 0, tiltY = 0;
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
      const want = W < 700 ? 1500 : 3000;
      if (want !== N) { N = want; P = Array.from({ length: N }, (_, i) => ({ x: rnd() * 2, y: rnd() * 2, z: rnd() * 2, vx: 0, vy: 0, vz: 0, tx: 0, ty: 0, tz: 0, c: i < N * .16 })); if (shape) morphTo(shape); }
    }
    function morphTo(name) {
      shape = name; const g = gen[name]; if (!g) return;
      for (let i = 0; i < N; i++) { const p = P[i], t = g(i, N); p.tx = t[0]; p.ty = t[1]; p.tz = t[2]; p.vx += rnd() * .09; p.vy += rnd() * .09; p.vz += rnd() * .09; }
    }
    size(); addEventListener('resize', size);
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(cv);
    gsap.ticker.add((time) => {
      if (!inView) return;
      spinA += .0055 + Math.min(Math.abs(scrollVel), 80) * .0007;
      mix += ((spins[shape] ? 1 : 0) - mix) * .04;
      const r = cv.getBoundingClientRect(), inside = mouse.y > r.top && mouse.y < r.bottom;
      tiltY += ((inside ? (mouse.x / innerWidth - .5) * .9 : 0) - tiltY) * .05; tiltX += ((inside ? (mouse.y / innerHeight - .5) * .5 : 0) - tiltX) * .05;
      const ry = Math.atan2(Math.sin(spinA), Math.cos(spinA)) * mix + Math.sin(time * .6) * .5 * (1 - mix) + tiltY, rx = -.22 + tiltX;
      const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
      const wide = W > 860, ox = W * (wide ? .52 : .5), oy = H * (wide ? .41 : .4), S = Math.min(W, H) * (wide ? .34 : .36);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      let col = null;
      for (let i = 0; i < N; i++) {
        const p = P[i];
        p.vx += (p.tx - p.x) * .05; p.vy += (p.ty - p.y) * .05; p.vz += (p.tz - p.z) * .05;
        p.vx *= .86; p.vy *= .86; p.vz *= .86; p.x += p.vx; p.y += p.vy; p.z += p.vz;
        const x1 = p.x * cy + p.z * sy, z1 = -p.x * sy + p.z * cy, y1 = p.y * cx - z1 * sx, z2 = p.y * sx + z1 * cx, f = 2.7 / (2.7 + z2), s = .7 + f * 1.5;
        if (p.c !== col) { col = p.c; ctx.fillStyle = col ? '#eceae3' : '#9aa5ff'; }
        ctx.globalAlpha = clamp(f * f * .9, .25, 1); ctx.fillRect(ox + x1 * S * f, oy + y1 * S * f, s, s);
      }
      ctx.globalAlpha = 1;
    });

    let active = -1;
    function set(a) {
      if (a === active) return; active = a; const d = src[a].dataset;
      ticks.forEach((t, i) => t.classList.toggle('is-active', i === a));
      idx.textContent = `0${a + 1} / 0${n}`; kind.textContent = d.kind; stack.textContent = d.stack; note.textContent = d.note; link.href = src[a].href;
      gsap.fromTo([kind, stack, note], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .45, stagger: .06, overwrite: true });
      flapTo(src[a].textContent); morphTo(d.shape);
    }
    ScrollTrigger.create({ trigger: stage, pin: true, start: 'top top', end: () => '+=' + (n - 1) * innerHeight * .9, onUpdate: (s) => { bar.style.transform = `scaleX(${s.progress})`; set(clamp(Math.round(s.progress * (n - 1)), 0, n - 1)); } });
    set(0);
  })();

  /* ── 6. toolkit: a small neural network. Tap a node and the signal runs forward through it. ── */
  (function net() {
    const box = $('#netbox'), cv = $('canvas', box), ctx = cv.getContext('2d');
    const layers = $$('.net__layer', box).map((l, li) => {
      const cap = document.createElement('p'); cap.className = 'net__cap'; cap.textContent = l.dataset.name; box.appendChild(cap);
      return { cap, nodes: $$('.node', l).map((el) => { el.dataset.tag = 'fire'; return { el, li, x: 0, y: 0, act: 0, wave: -1 }; }) };
    });
    const nodes = layers.flatMap((l) => l.nodes), edges = [], pulses = [];
    layers.forEach((l, i) => { if (layers[i + 1]) l.nodes.forEach((a) => layers[i + 1].nodes.forEach((b) => edges.push({ a, b }))); });
    let W = 0, H = 0, dpr = 1, vertical = false, hover = null, inView = false, wave = 0, lastFire = 0;
    function layout() {
      W = box.clientWidth; H = box.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2); cv.width = W * dpr; cv.height = H * dpr; vertical = W < 760;
      const L = layers.length;
      layers.forEach((l, i) => {
        const m = l.nodes.length;
        l.nodes.forEach((nd, k) => {
          if (vertical) { nd.x = W / 2 + (k - (m - 1) / 2) * Math.min((W - 40) / m, 110); nd.y = H * (.1 + .8 * i / (L - 1)) + (m > 1 ? (k % 2 ? 22 : -22) : 0); }
          else { nd.x = W * (.1 + .8 * i / (L - 1)); nd.y = H * .53 + (k - (m - 1) / 2) * Math.min((H * .78) / 5, 112); }
          nd.el.style.left = nd.x + 'px'; nd.el.style.top = nd.y + 'px';
        });
        const top = Math.min(...l.nodes.map((q) => q.y - q.el.offsetHeight / 2));
        l.cap.style.left = (vertical ? 16 : l.nodes[0].x) + 'px'; l.cap.style.top = Math.max(2, top - 30) + 'px';
      });
    }
    layout(); addEventListener('resize', layout); if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    const pt = (e, t) => {                                   // point on the curved edge
      const { a, b } = e, u = 1 - t, m = vertical ? (a.y + b.y) / 2 : (a.x + b.x) / 2;
      const c1x = vertical ? a.x : m, c1y = vertical ? m : a.y, c2x = vertical ? b.x : m, c2y = vertical ? m : b.y;
      return [u * u * u * a.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * b.x, u * u * u * a.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * b.y];
    };
    function fire(nd, w) {
      if (nd.wave === w) return; nd.wave = w; nd.act = 1;
      edges.forEach((e) => { if (e.a === nd) pulses.push({ e, t: 0, v: .016 + Math.random() * .012, w }); });
    }
    nodes.forEach((nd) => {
      nd.el.addEventListener('click', () => { lastFire = performance.now(); fire(nd, ++wave); });
      nd.el.addEventListener('pointerenter', () => { hover = nd; }); nd.el.addEventListener('pointerleave', () => { hover = null; });
    });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(box);
    gsap.ticker.add(() => {
      if (!inView) return;
      const now = performance.now();
      if (now - lastFire > 1700 && !hover) { lastFire = now; const first = layers[0].nodes; fire(first[(Math.random() * first.length) | 0], ++wave); }   // thinks on its own
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      for (const e of edges) {
        const hot = hover && (e.a === hover || e.b === hover), glow = Math.max(e.a.act, e.b.act) * .5;
        ctx.strokeStyle = hot ? '#2436ff' : `rgba(12,16,36,${hover ? .05 : .1 + glow * .25})`; ctx.lineWidth = hot ? 2 : 1;
        const m = vertical ? (e.a.y + e.b.y) / 2 : (e.a.x + e.b.x) / 2;
        ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y);
        vertical ? ctx.bezierCurveTo(e.a.x, m, e.b.x, m, e.b.x, e.b.y) : ctx.bezierCurveTo(m, e.a.y, m, e.b.y, e.b.x, e.b.y); ctx.stroke();
      }
      ctx.fillStyle = '#2436ff';
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]; p.t += p.v;
        if (p.t >= 1) { pulses.splice(i, 1); fire(p.e.b, p.w); p.e.b.act = 1; continue; }
        for (let k = 0; k < 4; k++) { const tt = p.t - k * .035; if (tt < 0) break; const [x, y] = pt(p.e, tt), s = 7 - k * 1.5; ctx.globalAlpha = 1 - k * .24; ctx.fillRect(x - s / 2, y - s / 2, s, s); }
      }
      ctx.globalAlpha = 1;
      for (const nd of nodes) { nd.act *= .955; nd.el.classList.toggle('is-on', nd.act > .32); }
    });
  })();

  /* ── 7. contact: a physics playground. Every chip has weight: grab it, throw it, tap empty space to blast. ── */
  (function pile() {
    const box = $('#pile'), chips = $$('.chip', box);
    if (typeof Matter === 'undefined') { box.classList.add('is-static'); return; }
    const { Engine, Bodies, Body, Composite, Constraint } = Matter;
    const engine = Engine.create({ gravity: { x: 0, y: 1.15 } }), world = engine.world;
    let W = 0, H = 0, walls = [], items = [], live = false, inView = false;
    chips.forEach((el) => { if (!el.dataset.tag) el.dataset.tag = 'grab'; el.draggable = false; });

    function buildWalls() {
      W = box.clientWidth; H = box.clientHeight; Composite.remove(world, walls);
      const o = { isStatic: true, friction: .5 };
      walls = [Bodies.rectangle(W / 2, H + 100, W + 800, 200, o), Bodies.rectangle(-100, H / 2 - 1000, 200, H + 3000, o), Bodies.rectangle(W + 100, H / 2 - 1000, 200, H + 3000, o), Bodies.rectangle(W / 2, -2100, W + 800, 200, o)];
      Composite.add(world, walls);
    }
    function spawn() {
      if (live) return; live = true; buildWalls();
      items = chips.map((el, i) => {
        const w = el.offsetWidth, h = el.offsetHeight, round = el.classList.contains('chip--round');
        const x = W * (.12 + .76 * Math.random()), y = -80 - i * (H * .16);
        const opt = { restitution: .38, friction: .35, frictionAir: .012, density: .0016, angle: (Math.random() - .5) * 1.2 };
        const body = round ? Bodies.circle(x, y, w / 2, opt) : Bodies.rectangle(x, y, w, h, { ...opt, chamfer: { radius: h / 2 - 1 } });
        el.classList.add('is-live'); return { el, body, w, h };
      });
      Composite.add(world, items.map((i) => i.body));
    }
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!live) return; buildWalls(); items.forEach(({ body }) => { if (body.position.x > W - 20 || body.position.y > H) Body.setPosition(body, { x: Math.min(body.position.x, W - 60), y: Math.min(body.position.y, H - 80) }); }); }, 200); });

    // drag & throw
    const at = (e) => { const r = box.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    chips.forEach((el) => {
      let grip = null, moved = 0, last = null;
      el.addEventListener('pointerdown', (e) => {
        const it = items.find((i) => i.el === el); if (!it) return;
        const p = at(e); moved = 0; last = p; try { el.setPointerCapture(e.pointerId); } catch {} el.classList.add('is-held');
        grip = Constraint.create({ pointA: p, bodyB: it.body, pointB: { x: p.x - it.body.position.x, y: p.y - it.body.position.y }, stiffness: .16, damping: .12, length: 0 });
        Composite.add(world, grip);
      });
      el.addEventListener('pointermove', (e) => { if (!grip) return; const p = at(e); moved += Math.hypot(p.x - last.x, p.y - last.y); last = p; grip.pointA = p; });
      const drop = () => { if (!grip) return; Composite.remove(world, grip); grip = null; el.classList.remove('is-held'); };
      el.addEventListener('pointerup', drop); el.addEventListener('pointercancel', drop);
      el.addEventListener('click', (e) => { if (moved > 8) e.preventDefault(); });   // a throw is not a click
      el.addEventListener('dragstart', (e) => e.preventDefault());
    });
    // tap empty space: shockwave
    box.addEventListener('pointerdown', (e) => {
      if (e.target !== box || !live) return; const p = at(e);
      const ring = document.createElement('i'); ring.className = 'blast'; ring.style.left = p.x + 'px'; ring.style.top = p.y + 'px'; box.appendChild(ring); setTimeout(() => ring.remove(), 720);
      const reach = Math.max(420, W * .5);
      items.forEach(({ body }) => {
        const dx = body.position.x - p.x, dy = body.position.y - p.y, d = Math.hypot(dx, dy) || 1; if (d > reach) return;
        const f = (1 - d / reach) * .09 * body.mass; Body.applyForce(body, body.position, { x: (dx / d) * f, y: (dy / d) * f - f * .35 });
        Body.setAngularVelocity(body, body.angularVelocity + (Math.random() - .5) * .3);
      });
    });

    new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (e.intersectionRatio > .35) spawn(); }, { threshold: [0, .35] }).observe(box);
    function render() {
      for (const { el, body, w, h } of items) {
        if (body.position.y > H + 400 || body.position.x < -300 || body.position.x > W + 300) { Body.setPosition(body, { x: W / 2, y: -100 }); Body.setVelocity(body, { x: 0, y: 0 }); } // never lose one
        el.style.transform = `translate3d(${(body.position.x - w / 2).toFixed(1)}px,${(body.position.y - h / 2).toFixed(1)}px,0) rotate(${body.angle.toFixed(3)}rad)`;
      }
    }
    gsap.ticker.add((time, dt) => { if (!inView || !live) return; Engine.update(engine, clamp(dt || 16.7, 8, 33)); render(); });
    window.__pile = { step(n = 1) { spawn(); for (let i = 0; i < n; i++) Engine.update(engine, 16.7); render(); } }; // console helper
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
      cur.classList.toggle('is-link', !!(t.closest && t.closest('a, button, .orbit > span, .chip')));
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
      .from('.hero__roles li, .hero__down, .nav a', { opacity: 0, y: 14, duration: .7, stagger: .05, ease: 'power3.out' }, '-=1.4')
      .add(() => { loader.remove(); ScrollTrigger.refresh(); });
  }
  const c = { v: 0 };
  gsap.to(c, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { num.textContent = String(Math.round(c.v)).padStart(2, '0'); }, onComplete: start });
  setTimeout(start, 5000);
  addEventListener('load', () => ScrollTrigger.refresh());
})();
