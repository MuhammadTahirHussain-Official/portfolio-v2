/* Muhammad Tahir Hussain — portfolio. Vanilla JS + GSAP + Lenis + Matter, no build step.
   The project list is not written here: it is read from the GitHub API on every visit. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rnd = () => Math.random() * 2 - 1;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const animate = hasGsap && !reduce;
  const mouse = { x: -9999, y: -9999, t: 0 };
  let lenis = null, scrollVel = 0;

  const USER = 'MuhammadTahirHussain-Official';
  const EMAIL = 'mtahirhussainofficial@gmail.com';
  const LINKEDIN = 'https://www.linkedin.com/in/muhammad-tahir-hussain-5ba414403/';
  const ARROW = '<svg class="arr"><use href="#arr"/></svg>';

  /* ═════════ GitHub data ═════════
     Everything in the Work section comes from the API. To change a card, edit the repo on GitHub:
       description → the sentence shown · homepage → adds a "Live" button · topic "portfolio-hide" → hides it.
     META only supplies nicer titles / fallback text / a 3D shape for repos that have no description yet. */
  const META = {
    'PAI-Sales-DataAnalysis': { title: 'Store Sales Ecuador', desc: 'A 3M-row retail pipeline, from five raw files to a model-ready table.', shape: 'bars' },
    'cropglobe-transfer': { title: 'CropGlobe Transfer', desc: 'A pre-registered study of cross-region crop-type transfer.', shape: 'globe' },
    'Predictive-Typing-Engine-In-C-That-Predict-Your-Next-Word-': { title: 'Veryx Engine', desc: 'A next-word prediction engine written in plain C.', shape: 'word' },
    'Weather-Management-System-with-AI-assistant': { title: 'StormWatch', desc: 'A weather desk in C++17 with an LLM assistant built in.', shape: 'storm' },
    'Professional-Airline-Management-System': { title: 'Nexus Air', desc: 'A full airline, simulated with object-oriented C++.', shape: 'plane' },
    'Professional-Hospital-Management-System': { title: 'Hospital Management', desc: 'Records, search and multi-key sorting in a C console app.' },
    'Advance-arithmetic-quiz-system-with-timer-in-c': { title: 'Arithmetic Quiz', desc: 'A timed quiz with levels, progression and input timeouts.' },
    'Alien-Invasion-Game-in-Python': { title: 'Alien Invasion', desc: 'An arcade shooter built with Pygame.' },
    'Medicine-Inventory-Website': { title: 'Medicine Inventory', desc: 'A searchable stock website with a PHP backend.' },
    'My-Coding-Game-Journey': { title: 'Coding Game Journey', desc: 'Daily timed coding clashes, solved in C.' },
    'Basic-to-Advance-C-plus-plus': { title: 'Basic to Advanced C++', desc: 'C++20 from first steps upward, one CMake project per topic.' },
  };
  const HIDE = new Set(['portfolio', 'portfolio-v2', USER]);
  const SNAPSHOT = [['PAI-Sales-DataAnalysis', 'Python'], ['cropglobe-transfer', 'Jupyter Notebook'], ['Basic-to-Advance-C-plus-plus', 'C++'], ['Medicine-Inventory-Website', 'HTML'], ['My-Coding-Game-Journey', 'C'], ['Alien-Invasion-Game-in-Python', 'Python'], ['Weather-Management-System-with-AI-assistant', 'C++'], ['Professional-Airline-Management-System', 'C++'], ['Professional-Hospital-Management-System', 'C'], ['Predictive-Typing-Engine-In-C-That-Predict-Your-Next-Word-', 'C'], ['Advance-arithmetic-quiz-system-with-timer-in-c', 'C']]
    .map(([name, language]) => ({ name, language, html_url: `https://github.com/${USER}/${name}` }));
  const LANG_COLOR = { Python: '#5aa9ff', C: '#b392ff', 'C++': '#ff7ab6', 'Jupyter Notebook': '#3fe08a', HTML: '#e6edf3', JavaScript: '#ffe27a', TypeScript: '#5aa9ff', PHP: '#b392ff' };
  const LANG_GLYPH = { Python: 'py', C: 'C', 'C++': 'C++', 'Jupyter Notebook': 'ipynb', HTML: '</>', JavaScript: 'JS', TypeScript: 'TS', PHP: 'php', Java: 'java', Go: 'go', Rust: 'rs', Shell: '$_' };
  const LANG_NAME = { 'Jupyter Notebook': 'Jupyter' };

  const pretty = (n) => n.replace(/[-_]+/g, ' ').trim().replace(/\b[a-z]/g, (c) => c.toUpperCase());
  const ago = (d) => { if (!d) return ''; const s = (Date.now() - new Date(d)) / 1000; for (const [n, l] of [[31536000, 'y'], [2592000, 'mo'], [86400, 'd'], [3600, 'h'], [60, 'm']]) if (s >= n) return Math.floor(s / n) + l + ' ago'; return 'just now'; };
  const norm = (r) => {
    const m = META[r.name] || {}, home = /^https?:\/\//.test(r.homepage || '') ? r.homepage : '';
    return { name: r.name, title: m.title || pretty(r.name), desc: r.description || m.desc || `${LANG_NAME[r.language] || r.language || 'Code'} project.`, lang: r.language || '', url: r.html_url, home,
      stars: r.stargazers_count || 0, pushed: r.pushed_at || '', topics: r.topics || [], shape: m.shape || 'text:' + (LANG_GLYPH[r.language] || '{ }') };
  };
  async function loadRepos() {
    const KEY = 'mth.repos.v2'; let cached = null;
    try { cached = JSON.parse(localStorage.getItem(KEY)); } catch {}
    if (cached && Date.now() - cached.t < 10 * 60 * 1000) return { list: cached.list, src: 'cache', t: cached.t };
    try {
      const r = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!r.ok) throw new Error(r.status);
      const list = (await r.json()).filter((x) => !x.fork && !x.archived && !HIDE.has(x.name) && !(x.topics || []).includes('portfolio-hide')).map(norm);
      try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), list })); } catch {}
      return { list, src: 'live', t: Date.now() };
    } catch {
      return cached ? { list: cached.list, src: 'stale', t: cached.t } : { list: SNAPSHOT.map(norm), src: 'offline', t: 0 };
    }
  }

  /* ═════════ always-on UI (works without animation too) ═════════ */
  $('#year').textContent = new Date().getFullYear();
  const clock = $('#sClock'); const tick = () => { clock.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }; tick(); setInterval(tick, 20000);
  if (/Mac|iPhone|iPad/.test(navigator.platform || '')) $$('#openK kbd')[0].textContent = '⌘';

  // status bar: current file + line
  const sSec = $('#sSec'), sLn = $('#sLn'), tabs = $$('.bar__tabs a');
  const secIO = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; const n = e.target.dataset.sec; sSec.textContent = n; tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.sec === n)); }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main [data-sec]').forEach((s) => secIO.observe(s));
  addEventListener('scroll', () => { const max = document.documentElement.scrollHeight - innerHeight; sLn.textContent = 'Ln ' + (1 + Math.round((scrollY / Math.max(1, max)) * 999)); }, { passive: true });

  const go = (target) => { const t = typeof target === 'string' ? $(target) : target; if (!t) return; lenis ? lenis.scrollTo(t, { duration: 1.4 }) : t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };
  document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (!a || !$(a.getAttribute('href'))) return; e.preventDefault(); go(a.getAttribute('href')); });

  // split-flap board for the selected repo's title
  const flap = $('#flap'); let flapRun = 0;
  function flapTo(text) {
    const t = text.toUpperCase().slice(0, 24), n = Math.max(6, t.length), me = ++flapRun, glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    flap.setAttribute('aria-label', text); flap.style.setProperty('--n', n);
    while (flap.children.length < n) flap.appendChild(el('span', 'fl is-blank', ' '));
    while (flap.children.length > n) flap.lastChild.remove();
    [...flap.children].forEach((c, i) => {
      const final = t[i] && t[i] !== ' ' ? t[i] : ' ';
      if (reduce) { c.textContent = final; c.classList.toggle('is-blank', final === ' '); return; }
      let k = 0; const total = 4 + i;
      (function step() {
        if (me !== flapRun) return; const last = k >= total;
        c.textContent = last ? final : glyphs[(Math.random() * glyphs.length) | 0]; c.classList.toggle('is-blank', last && final === ' ');
        c.animate([{ transform: 'rotateX(-85deg)', opacity: .35 }, { transform: 'rotateX(0deg)', opacity: 1 }], { duration: 80, easing: 'ease-out' });
        if (!last) { k++; setTimeout(step, 42); }
      })();
    });
  }

  // repo list + viewer
  const reposEl = $('#repos'), vDesc = $('#vDesc'), vMeta = $('#vMeta'), vLinks = $('#vLinks');
  let repos = [], active = -1, cloud = null;
  function select(i) {
    if (i === active || !repos[i]) return; active = i; const r = repos[i];
    $$('.repo', reposEl).forEach((row, k) => row.classList.toggle('is-active', k === i));
    vDesc.textContent = r.desc; vMeta.textContent = '';
    if (r.lang) vMeta.appendChild(el('b', '', LANG_NAME[r.lang] || r.lang));
    vMeta.appendChild(el('span', '', '★ ' + r.stars)); if (r.pushed) vMeta.appendChild(el('span', '', 'pushed ' + ago(r.pushed)));
    r.topics.slice(0, 3).forEach((t) => vMeta.appendChild(el('span', '', '#' + t)));
    vLinks.textContent = '';
    const mk = (label, href, cls) => { const a = el('a', 'btn ' + cls); a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.dataset.tag = 'open'; a.innerHTML = ARROW; a.prepend(label); vLinks.appendChild(a); };
    mk('Code', r.url, 'btn--go'); if (r.home) mk('Live', r.home, '');
    flapTo(r.title); if (cloud) cloud.morph(r.shape);
  }
  function renderRepos(list) {
    repos = list; active = -1; reposEl.textContent = '';
    list.forEach((r, i) => {
      const li = el('li', 'repo is-new'); li.tabIndex = 0; li.setAttribute('role', 'button'); li.style.animationDelay = i * 45 + 'ms'; li.dataset.tag = 'select';
      const m = el('span', 'repo__m'); const dot = el('i'); dot.style.setProperty('--c', LANG_COLOR[r.lang] || '#8a94a3'); m.append(dot, LANG_NAME[r.lang] || r.lang || '—'); if (r.pushed) m.append(el('em', '', ago(r.pushed)));
      const open = el('a', 'repo__o'); open.href = r.url; open.target = '_blank'; open.rel = 'noopener'; open.setAttribute('aria-label', `Open ${r.title} on GitHub`); open.dataset.tag = 'open'; open.innerHTML = ARROW;
      li.append(el('span', 'repo__i', String(i + 1).padStart(2, '0')), el('span', 'repo__t', r.title), m, open);
      li.addEventListener('click', (e) => { if (!e.target.closest('a')) select(i); });
      li.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') select(i); });
      li.addEventListener('focus', () => select(i));
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter') window.open(r.url, '_blank', 'noopener'); });
      reposEl.appendChild(li);
    });
    select(0);
    if (hasGsap) ScrollTrigger.refresh();
  }

  // command palette
  const K = $('#k'), kIn = $('#kIn'), kList = $('#kList'); let cmds = [], shown = [], sel = 0;
  const baseCmds = [
    ['go: readme.md', 'section', () => go('#top')], ['go: work/', 'section', () => go('#work')], ['go: stack.json', 'section', () => go('#toolkit')], ['go: contact.sh', 'section', () => go('#contact')],
    ['open: GitHub profile', 'link', () => window.open(`https://github.com/${USER}`, '_blank', 'noopener')], ['open: LinkedIn', 'link', () => window.open(LINKEDIN, '_blank', 'noopener')],
    ['mail: write to Tahir', 'action', () => { location.href = 'mailto:' + EMAIL; }], ['copy: e-mail address', 'action', () => navigator.clipboard && navigator.clipboard.writeText(EMAIL)],
  ];
  cmds = baseCmds.slice();
  function drawK() {
    const q = kIn.value.trim().toLowerCase(); shown = cmds.filter((c) => c[0].toLowerCase().includes(q)).slice(0, 40); sel = clamp(sel, 0, Math.max(0, shown.length - 1)); kList.textContent = '';
    if (!shown.length) { kList.appendChild(el('li', 'none', 'no match')); return; }
    shown.forEach((c, i) => { const li = el('li', i === sel ? 'is-sel' : ''); li.append(el('span', '', c[0]), el('span', '', c[1])); li.addEventListener('click', () => runK(i)); li.addEventListener('pointermove', () => { if (sel !== i) { sel = i; drawK(); } }); kList.appendChild(li); });
    const s = $('.is-sel', kList); if (s) s.scrollIntoView({ block: 'nearest' });
  }
  const openK = () => { K.hidden = false; kIn.value = ''; sel = 0; drawK(); kIn.focus(); if (lenis) lenis.stop(); };
  const closeK = () => { K.hidden = true; if (lenis) lenis.start(); };
  const runK = (i) => { const c = shown[i]; closeK(); if (c) c[2](); };
  K.setAttribute('data-lenis-prevent', '');
  $('#openK').addEventListener('click', openK);
  K.addEventListener('click', (e) => { if (e.target === K) closeK(); });
  kIn.addEventListener('input', () => { sel = 0; drawK(); });
  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); K.hidden ? openK() : closeK(); return; }
    if (K.hidden) return;
    if (e.key === 'Escape') closeK(); else if (e.key === 'ArrowDown') { e.preventDefault(); sel++; drawK(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel--; drawK(); } else if (e.key === 'Enter') { e.preventDefault(); runK(sel); }
  });

  // hero code card
  const typed = $('#typed'); let repoCount = '…';
  const codeLines = () => [
    [['kw', 'const '], ['fn', 'tahir'], ['pu', ' = {']],
    [['pu', '  role: ['], ['st', '"AI Engineer"'], ['pu', ', '], ['st', '"Research Analyst"'], ['pu', '],']],
    [['pu', '  also: ['], ['st', '"Coder"'], ['pu', ', '], ['st', '"Problem Solver"'], ['pu', '],']],
    [['pu', '  repos: '], ['nu', String(repoCount)], ['pu', ', ships: '], ['kw', 'true'], ['pu', ',']],
    [['pu', '};']],
  ];
  let typedN = reduce || !hasGsap ? 1e9 : 0;
  function drawCode() {
    let left = typedN, done = true; typed.textContent = '';
    for (const line of codeLines()) {
      const row = el('span', 'ln');
      for (const [cls, text] of line) { if (left <= 0) { done = false; break; } const part = text.slice(0, left); left -= part.length; row.appendChild(el('span', cls, part)); if (part.length < text.length) done = false; }
      typed.appendChild(row); if (left <= 0 && !done) { row.appendChild(el('span', 'caret')); break; }
    }
    if (done) typed.lastChild.appendChild(el('span', 'caret'));
    return done;
  }
  drawCode();
  const typeCode = () => { const id = setInterval(() => { typedN += 2; if (drawCode()) clearInterval(id); }, 22); };

  // network of tools: the first layer is read from GitHub too
  let net = null;
  function setLangs(list) {
    const counts = {}; list.forEach((r) => { if (r.lang && r.lang !== 'Jupyter Notebook') counts[r.lang] = (counts[r.lang] || 0) + 1; });
    const langs = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 6); if (langs.length < 2) return;
    const layer = $('#langLayer'); layer.textContent = ''; langs.forEach((l) => layer.appendChild(el('button', 'node', l)));
    if (net) net.build();
  }

  // fetch → render
  const sync = $('#sync');
  loadRepos().then(({ list, src, t }) => {
    if (!list.length) list = SNAPSHOT.map(norm);
    renderRepos(list); setLangs(list);
    repoCount = list.length; drawCode();
    $('#sRepos').textContent = list.length + ' repos';
    const first = list.find((r) => r.pushed), sp = $('#sPush'); sp.textContent = '';
    if (first) { const a = el('a', '', first.name); a.href = first.url; a.target = '_blank'; a.rel = 'noopener'; sp.append('last push: ', a, ' · ' + ago(first.pushed)); } else sp.textContent = 'github: offline';
    const label = { live: 'synced live from GitHub just now', cache: 'synced from GitHub ' + ago(t), stale: 'GitHub unreachable · last sync ' + ago(t), offline: 'GitHub unreachable · showing a saved list' }[src];
    sync.lastElementChild.textContent = `${list.length} repositories · ${label}`; sync.classList.toggle('is-off', src === 'stale' || src === 'offline');
    cmds = baseCmds.concat(list.map((r) => ['repo: ' + r.title, r.lang || 'repo', () => window.open(r.url, '_blank', 'noopener')]));
  });

  if (!animate) {
    document.documentElement.classList.add('no-motion'); $('#pile').classList.add('is-static'); $('#loader').remove();
    $$('#sayLine').forEach((p) => p.classList.add('on'));
    return;
  }

  /* ═════════ motion ═════════ */
  gsap.registerPlugin(ScrollTrigger);
  addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = performance.now(); }, { passive: true });
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
    lenis.on('scroll', (l) => { scrollVel = l.velocity; ScrollTrigger.update(); });
    gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); window.__lenis = lenis;
  }

  /* letters that thin out under the cursor */
  const letters = [];
  $$('[data-vf]').forEach((g) => {
    const text = g.textContent; g.textContent = ''; g.setAttribute('aria-label', text);
    const group = { el: g, visible: false, items: [] };
    [...text].forEach((ch, i) => { const s = el('span', ch === ' ' ? 'sp' : 'l', ch === ' ' ? '' : ch); s.setAttribute('aria-hidden', 'true'); g.appendChild(s); if (ch !== ' ') group.items.push({ el: s, i, w: 800, intro: 0, cx: 0, cy: 0 }); });
    letters.push(group); new IntersectionObserver(([e]) => { group.visible = e.isIntersecting; }, { rootMargin: '10%' }).observe(g);
  });
  gsap.ticker.add((time) => {
    const R = Math.max(200, innerWidth * .18);
    for (const g of letters) {
      if (!g.visible) continue;
      for (const it of g.items) { const r = it.el.getBoundingClientRect(); it.cx = r.left + r.width / 2; it.cy = r.top + r.height / 2; }
      for (const it of g.items) {
        const near = Math.pow(Math.max(0, 1 - Math.hypot(it.cx - mouse.x, it.cy - mouse.y) / R), 1.5), wave = Math.pow(Math.max(0, Math.sin(time * 1.3 - it.i * .55)), 10) * .5;
        it.w += (800 - 620 * Math.max(near, wave, it.intro) - it.w) * .16; const w = Math.round(it.w);
        if (w !== it.last) { it.last = w; it.el.style.fontVariationSettings = `"wght" ${w}`; }
      }
    }
  });

  /* portrait: a lens that shows how a machine reads the photo */
  const lens = { x: 0, y: 0, r: 0, tx: 0, ty: 0, tr: 0, intro: true };
  (function ascii() {
    const fig = $('#portrait'), img = $('#portraitImg'), cv = $('#ascii'), ctx = cv.getContext('2d'), ramp = ' .:-=+*x#%@';
    let cells = [], cell = 8, dpr = 1, ok = false, inView = true;
    function build() {
      const w = fig.clientWidth, h = fig.clientHeight; if (!w || !img.naturalWidth) return;
      dpr = Math.min(devicePixelRatio || 1, 2); cell = w < 420 ? 6 : 8;
      const cols = Math.floor(w / cell), rows = Math.floor(h / cell), off = document.createElement('canvas'); off.width = cols; off.height = rows;
      const o = off.getContext('2d', { willReadFrequently: true }); o.drawImage(img, 0, 0, cols, rows);
      let data; try { data = o.getImageData(0, 0, cols, rows).data; } catch { return; }
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.font = `500 ${cell + 2}px "Geist Mono", monospace`; ctx.textBaseline = 'top'; cells = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const k = (y * cols + x) * 4; if (data[k + 3] < 70) continue; cells.push({ x: x * cell, y: y * cell, d: (data[k] * .299 + data[k + 1] * .587 + data[k + 2] * .114) / 255 }); }
      cells.forEach((c) => draw(c)); ok = true;
    }
    function draw(c, jitter) {
      const n = clamp(Math.round(c.d * (ramp.length - 1)) + 1 + (jitter ? ((Math.random() * 3) | 0) - 1 : 0), 1, ramp.length - 1);
      ctx.fillStyle = '#07090d'; ctx.fillRect(c.x, c.y, cell + .5, cell + .5);
      ctx.fillStyle = c.d > .6 ? '#e6edf3' : c.d > .22 ? '#3fe08a' : '#3f79c4'; ctx.fillText(ramp[n], c.x, c.y - 1);
    }
    img.complete ? build() : img.addEventListener('load', build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(fig);
    gsap.ticker.add((time) => {
      if (!ok || !inView) return; const r = fig.getBoundingClientRect();
      if (!lens.intro) {
        if (!fine || performance.now() - mouse.t > 3500) { lens.tx = r.width * (.5 + .2 * Math.sin(time * .7)); lens.ty = r.height * (.3 + .12 * Math.sin(time * 1.1 + 1)); lens.tr = Math.min(r.width * .17, 90); }
        else { lens.tx = mouse.x - r.left; lens.ty = mouse.y - r.top; lens.tr = mouse.x > r.left - 60 && mouse.x < r.right + 60 && mouse.y > r.top - 60 && mouse.y < r.bottom ? Math.min(r.width * .26, 150) : 0; }
        lens.x += (lens.tx - lens.x) * .14; lens.y += (lens.ty - lens.y) * .14; lens.r += (lens.tr - lens.r) * .1;
      }
      cv.style.setProperty('--mx', lens.x.toFixed(1) + 'px'); cv.style.setProperty('--my', lens.y.toFixed(1) + 'px'); cv.style.setProperty('--mr', Math.max(0, lens.r).toFixed(1) + 'px');
      for (let i = 0, n = lens.r > 2 ? 90 : 24; i < n; i++) draw(cells[(Math.random() * cells.length) | 0], true);
    });
  })();

  /* hero: a wireframe geodesic sphere turning behind the head, with signals running its edges */
  (function wire() {
    const cv = $('#wire'), ctx = cv.getContext('2d'); let S = 0, dpr = 1, inView = true;
    const t = (1 + Math.sqrt(5)) / 2, V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map((v) => { const l = Math.hypot(...v); return v.map((c) => c / l); });
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const mid = {}, m = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (mid[k] == null) { const v = [0, 1, 2].map((i) => V[a][i] + V[b][i]), l = Math.hypot(...v); mid[k] = V.push(v.map((c) => c / l)) - 1; } return mid[k]; };
    F = F.flatMap(([a, b, c]) => { const ab = m(a, b), bc = m(b, c), ca = m(c, a); return [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]]; });
    const seen = new Set(), E = []; F.forEach(([a, b, c]) => [[a, b], [b, c], [c, a]].forEach(([p, q]) => { const k = p < q ? p + '_' + q : q + '_' + p; if (!seen.has(k)) { seen.add(k); E.push([p, q]); } }));
    const pulses = Array.from({ length: 9 }, () => ({ e: (Math.random() * E.length) | 0, t: Math.random(), v: .008 + Math.random() * .012 }));
    function size() { dpr = Math.min(devicePixelRatio || 1, 2); S = cv.clientWidth; cv.width = cv.height = S * dpr; }
    size(); addEventListener('resize', size); new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(cv);
    let ry = 0, tx = 0, ty = 0; const P = V.map(() => [0, 0, 0]);
    gsap.ticker.add(() => {
      if (!inView || !S) return;
      ry += .0035 + Math.min(Math.abs(scrollVel), 60) * .0005; tx += ((mouse.y / innerHeight - .5) * .6 - tx) * .04; ty += ((mouse.x / innerWidth - .5) * .8 - ty) * .04;
      const cy = Math.cos(ry + ty), sy = Math.sin(ry + ty), cx = Math.cos(.35 + tx), sx = Math.sin(.35 + tx), R = S * .43, o = S / 2;
      V.forEach((v, i) => { const x = v[0] * cy + v[2] * sy, z = -v[0] * sy + v[2] * cy, y = v[1] * cx - z * sx, z2 = v[1] * sx + z * cx, f = 3.2 / (3.2 + z2); P[i][0] = o + x * R * f; P[i][1] = o + y * R * f; P[i][2] = z2; });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, S, S); ctx.lineWidth = 1;
      for (const [a, b] of E) { const z = (P[a][2] + P[b][2]) / 2; ctx.strokeStyle = `rgba(90,169,255,${(.07 + (1 - z) * .16).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke(); }
      for (const p of P) { if (p[2] > .2) continue; ctx.fillStyle = `rgba(230,237,243,${(.25 + (1 - p[2]) * .3).toFixed(2)})`; ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3); }
      ctx.fillStyle = '#3fe08a';
      for (const p of pulses) { p.t += p.v; if (p.t >= 1) { const end = E[p.e][1], opts = E.map((e, i) => (e[0] === end || e[1] === end ? i : -1)).filter((i) => i >= 0); p.e = opts[(Math.random() * opts.length) | 0]; p.t = 0; } const [a, b] = E[p.e], x = P[a][0] + (P[b][0] - P[a][0]) * p.t, y = P[a][1] + (P[b][1] - P[a][1]) * p.t; ctx.fillRect(x - 2.5, y - 2.5, 5, 5); }
    });
  })();

  /* statement, generated one token at a time */
  (function say() {
    const p = $('#sayLine'), meta = $('#sayMeta'), words = p.textContent.trim().split(/\s+/); p.textContent = '';
    const tks = words.map((w, i) => { const s = el('span', 'tk', w); p.append(s, i < words.length - 1 ? ' ' : ''); return s; });
    ScrollTrigger.create({ trigger: p, start: 'top 78%', end: 'bottom 48%', scrub: true, onUpdate: (s) => {
      const n = Math.ceil(s.progress * (tks.length + 1)); tks.forEach((t, i) => { t.classList.toggle('on', i < n); t.classList.toggle('cur', i === n - 1 && n <= tks.length); });
      meta.textContent = `${Math.min(n, tks.length)} / ${tks.length} tokens${n > tks.length ? ' · done' : ''}`;
    } });
  })();

  /* roles drift sideways against each other */
  $$('.roles__row').forEach((row) => { const dir = +row.dataset.dir; gsap.fromTo($('h2', row), { x: () => dir * innerWidth * .16 }, { x: () => -dir * innerWidth * .05, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: .6, invalidateOnRefresh: true } }); });

  /* work viewer: a rotating 3D point cloud that reshapes for the selected repo */
  cloud = (function cloudFn() {
    const cv = $('#cloud'), ctx = cv.getContext('2d'); let W = 0, H = 0, dpr = 1, N = 0, P = [], inView = false;
    function sample2D(draw) {
      const G = 160, o = document.createElement('canvas'); o.width = o.height = G; const c = o.getContext('2d'); c.fillStyle = '#fff'; draw(c, G);
      const d = c.getImageData(0, 0, G, G).data, pts = []; for (let i = 3, k = 0; i < d.length; i += 4, k++) if (d[i] > 120) pts.push([((k % G) / G) * 2 - 1, (((k / G) | 0) / G) * 2 - 1]);
      return pts.length ? pts : [[0, 0]];
    }
    const textCache = {}, textPts = (label) => textCache[label] || (textCache[label] = sample2D((c, G) => {
      let fs = 120; c.font = `800 ${fs}px "Geist Mono", Consolas, monospace`; const w = c.measureText(label).width; fs = Math.min(120, fs * (G - 12) / w); c.font = `800 ${fs}px "Geist Mono", Consolas, monospace`;
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, G / 2, G / 2);
    }));
    const wordPts = sample2D((c) => { c.font = '800 58px Arial, sans-serif'; c.textBaseline = 'middle'; c.fillText('next', 2, 82); c.fillRect(134, 56, 18, 48); });
    const planePts = sample2D((c) => { c.beginPath(); c.moveTo(154, 80); c.lineTo(10, 22); c.lineTo(50, 80); c.lineTo(10, 138); c.closePath(); c.fill(); });
    const bars = [.35, .6, .45, .85, .55, .75, 1];
    const gen = {
      bars: () => { const i = (Math.random() * 7) | 0, r = (Math.random() * 3) | 0, h = bars[(i + r * 2) % 7] * (1 - r * .1); return [-.95 + i * .28 + Math.random() * .2, .8 - Math.random() * h * 1.6, -.5 + r * .45 + Math.random() * .2]; },
      globe: (i, m) => { if (i > m * .82) { const a = Math.random() * 6.283; return [Math.cos(a) * 1.22, Math.sin(a) * .3, Math.sin(a) * 1.22]; } const y = 1 - 2 * (i + .5) / (m * .82), r = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.39996; return [Math.cos(th) * r * .86, y * .86, Math.sin(th) * r * .86]; },
      word: () => { const p = wordPts[(Math.random() * wordPts.length) | 0]; return [p[0] * 1.25, p[1] * 1.25, rnd() * .09]; },
      storm: () => { const t = Math.random(), a = t * 11 + ((Math.random() * 3) | 0) * 2.094 + rnd() * .22, r = (.07 + .9 * Math.pow(t, 1.5)) * (1 + rnd() * .07); return [Math.cos(a) * r, .9 - 1.8 * t, Math.sin(a) * r]; },
      plane: () => { const p = planePts[(Math.random() * planePts.length) | 0]; return [p[0] * 1.05, p[1] * .57 - Math.abs(p[1]) * .12, -Math.abs(p[1]) * .75 + rnd() * .02]; },
    };
    const spins = { bars: true, globe: true, storm: true };
    let shape = 'globe', spinA = 0, mix = 1, tiltX = 0, tiltY = 0;
    const target = (i) => { if (shape.startsWith('text:')) { const pts = textPts(shape.slice(5)), p = pts[(Math.random() * pts.length) | 0]; return [p[0] * 1.2, p[1] * 1.2, rnd() * .12]; } return (gen[shape] || gen.globe)(i, N); };
    function morph(name) { shape = name || shape; for (let i = 0; i < N; i++) { const p = P[i], t = target(i); p.tx = t[0]; p.ty = t[1]; p.tz = t[2]; p.vx += rnd() * .09; p.vy += rnd() * .09; p.vz += rnd() * .09; } }
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
      const want = innerWidth < 700 ? 1500 : 2800;
      if (want !== N) { N = want; P = Array.from({ length: N }, (_, i) => ({ x: rnd() * 2, y: rnd() * 2, z: rnd() * 2, vx: 0, vy: 0, vz: 0, tx: 0, ty: 0, tz: 0, c: i < N * .16 })); morph(); }
    }
    size(); addEventListener('resize', size); new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(cv);
    gsap.ticker.add((time) => {
      if (!inView || !W) return;
      spinA += .0055 + Math.min(Math.abs(scrollVel), 80) * .0004; mix += ((spins[shape] ? 1 : 0) - mix) * .04;
      const r = cv.getBoundingClientRect(), inside = mouse.x > r.left && mouse.x < r.right && mouse.y > r.top && mouse.y < r.bottom;
      tiltY += ((inside ? ((mouse.x - r.left) / r.width - .5) * 1.4 : 0) - tiltY) * .06; tiltX += ((inside ? ((mouse.y - r.top) / r.height - .5) * .8 : 0) - tiltX) * .06;
      const ry = Math.atan2(Math.sin(spinA), Math.cos(spinA)) * mix + Math.sin(time * .6) * .45 * (1 - mix) + tiltY, rx = -.2 + tiltX;
      const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx), ox = W / 2, oy = H * .36, S = Math.min(W * .34, H * .25);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); let col = null;
      for (let i = 0; i < N; i++) {
        const p = P[i]; p.vx += (p.tx - p.x) * .05; p.vy += (p.ty - p.y) * .05; p.vz += (p.tz - p.z) * .05; p.vx *= .86; p.vy *= .86; p.vz *= .86; p.x += p.vx; p.y += p.vy; p.z += p.vz;
        const x1 = p.x * cy + p.z * sy, z1 = -p.x * sy + p.z * cy, y1 = p.y * cx - z1 * sx, z2 = p.y * sx + z1 * cx, f = 2.7 / (2.7 + z2), s = .7 + f * 1.4;
        if (p.c !== col) { col = p.c; ctx.fillStyle = col ? '#e6edf3' : '#3fe08a'; }
        ctx.globalAlpha = clamp(f * f * .9, .25, 1); ctx.fillRect(ox + x1 * S * f, oy + y1 * S * f, s, s);
      }
      ctx.globalAlpha = 1;
    });
    return { morph };
  })();
  if (repos[active]) cloud.morph(repos[active].shape);

  /* toolkit: a small neural network. Tap a node and the signal runs forward through it. */
  net = (function netFn() {
    const box = $('#netbox'), cv = $('canvas', box), ctx = cv.getContext('2d');
    let layers = [], nodes = [], edges = [], pulses = [], W = 0, H = 0, dpr = 1, vertical = false, hover = null, inView = false, wave = 0, lastFire = 0;
    function build() {
      $$('.net__cap', box).forEach((c) => c.remove()); pulses = []; hover = null;
      layers = $$('.net__layer', box).map((l) => {
        const cap = el('p', 'net__cap', l.dataset.name); box.appendChild(cap);
        return { cap, nodes: $$('.node', l).map((n) => {
          const nd = { el: n, x: 0, y: 0, act: 0, wave: -1 }; n.dataset.tag = 'fire';
          n.onclick = () => { lastFire = performance.now(); fire(nd, ++wave); }; n.onpointerenter = () => { hover = nd; }; n.onpointerleave = () => { hover = null; };
          return nd;
        }) };
      });
      nodes = layers.flatMap((l) => l.nodes); edges = [];
      layers.forEach((l, i) => { if (layers[i + 1]) l.nodes.forEach((a) => layers[i + 1].nodes.forEach((b) => edges.push({ a, b }))); });
      layout();
    }
    function layout() {
      W = box.clientWidth; H = box.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2); cv.width = W * dpr; cv.height = H * dpr; vertical = W < 760; const L = layers.length;
      layers.forEach((l, i) => {
        const m = l.nodes.length;
        l.nodes.forEach((nd, k) => {
          if (vertical) { nd.x = W / 2 + (k - (m - 1) / 2) * Math.min((W - 40) / m, 110); nd.y = H * (.1 + .8 * i / (L - 1)) + (m > 1 ? (k % 2 ? 22 : -22) : 0); }
          else { nd.x = W * (.1 + .8 * i / (L - 1)); nd.y = H * .53 + (k - (m - 1) / 2) * Math.min((H * .8) / Math.max(m, 5), 112); }
          nd.el.style.left = nd.x + 'px'; nd.el.style.top = nd.y + 'px';
        });
        const top = Math.min(...l.nodes.map((q) => q.y - q.el.offsetHeight / 2));
        l.cap.style.left = (vertical ? 16 : l.nodes[0].x) + 'px'; l.cap.style.top = Math.max(2, top - 30) + 'px';
      });
    }
    const pt = (e, t) => {
      const { a, b } = e, u = 1 - t, m = vertical ? (a.y + b.y) / 2 : (a.x + b.x) / 2, c1x = vertical ? a.x : m, c1y = vertical ? m : a.y, c2x = vertical ? b.x : m, c2y = vertical ? m : b.y;
      return [u * u * u * a.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * b.x, u * u * u * a.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * b.y];
    };
    function fire(nd, w) { if (nd.wave === w) return; nd.wave = w; nd.act = 1; edges.forEach((e) => { if (e.a === nd) pulses.push({ e, t: 0, v: .016 + Math.random() * .012, w }); }); }
    build(); addEventListener('resize', layout); if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(box);
    gsap.ticker.add(() => {
      if (!inView || !layers.length) return; const now = performance.now();
      if (now - lastFire > 1700 && !hover) { lastFire = now; const first = layers[0].nodes; fire(first[(Math.random() * first.length) | 0], ++wave); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      for (const e of edges) {
        const hot = hover && (e.a === hover || e.b === hover), glow = Math.max(e.a.act, e.b.act);
        ctx.strokeStyle = hot ? '#3fe08a' : `rgba(230,237,243,${hover ? .04 : .07 + glow * .16})`; ctx.lineWidth = hot ? 1.6 : 1;
        const m = vertical ? (e.a.y + e.b.y) / 2 : (e.a.x + e.b.x) / 2; ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y);
        vertical ? ctx.bezierCurveTo(e.a.x, m, e.b.x, m, e.b.x, e.b.y) : ctx.bezierCurveTo(m, e.a.y, m, e.b.y, e.b.x, e.b.y); ctx.stroke();
      }
      ctx.fillStyle = '#3fe08a';
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]; p.t += p.v; if (p.t >= 1) { pulses.splice(i, 1); fire(p.e.b, p.w); p.e.b.act = 1; continue; }
        for (let k = 0; k < 4; k++) { const tt = p.t - k * .035; if (tt < 0) break; const [x, y] = pt(p.e, tt), s = 6 - k * 1.3; ctx.globalAlpha = 1 - k * .24; ctx.fillRect(x - s / 2, y - s / 2, s, s); }
      }
      ctx.globalAlpha = 1;
      for (const nd of nodes) { nd.act *= .955; nd.el.classList.toggle('is-on', nd.act > .32); }
    });
    return { build };
  })();

  /* contact: a physics playground. Grab, throw, tap empty space to blast. */
  (function pile() {
    const box = $('#pile'), chips = $$('.chip', box);
    if (typeof Matter === 'undefined') { box.classList.add('is-static'); return; }
    const { Engine, Bodies, Body, Composite, Constraint } = Matter, engine = Engine.create({ gravity: { x: 0, y: 1.15 } }), world = engine.world;
    let W = 0, H = 0, walls = [], items = [], live = false, inView = false;
    chips.forEach((c) => { if (!c.dataset.tag) c.dataset.tag = 'grab'; c.draggable = false; });
    function buildWalls() {
      W = box.clientWidth; H = box.clientHeight; Composite.remove(world, walls); const o = { isStatic: true, friction: .5 };
      walls = [Bodies.rectangle(W / 2, H + 100, W + 800, 200, o), Bodies.rectangle(-100, H / 2 - 1000, 200, H + 3000, o), Bodies.rectangle(W + 100, H / 2 - 1000, 200, H + 3000, o), Bodies.rectangle(W / 2, -2400, W + 800, 200, o)];
      Composite.add(world, walls);
    }
    function spawn() {
      if (live) return; live = true; buildWalls();
      items = chips.map((c, i) => {
        const w = c.offsetWidth, h = c.offsetHeight, round = c.classList.contains('chip--round'), x = W * (.12 + .76 * Math.random()), y = -80 - i * (H * .15);
        const opt = { restitution: .38, friction: .35, frictionAir: .012, density: .0016, angle: (Math.random() - .5) * 1.2 };
        const body = round ? Bodies.circle(x, y, w / 2, opt) : Bodies.rectangle(x, y, w, h, { ...opt, chamfer: { radius: Math.min(h / 2 - 1, c.classList.contains('chip--m') ? 10 : 999) } });
        c.classList.add('is-live'); return { el: c, body, w, h };
      });
      Composite.add(world, items.map((i) => i.body));
    }
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!live) return; buildWalls(); items.forEach(({ body }) => { if (body.position.x > W - 20 || body.position.y > H) Body.setPosition(body, { x: Math.min(body.position.x, W - 60), y: Math.min(body.position.y, H - 80) }); }); }, 200); });
    const at = (e) => { const r = box.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    chips.forEach((c) => {
      let grip = null, moved = 0, last = null;
      c.addEventListener('pointerdown', (e) => {
        const it = items.find((i) => i.el === c); if (!it) return; const p = at(e); moved = 0; last = p; try { c.setPointerCapture(e.pointerId); } catch {} c.classList.add('is-held');
        grip = Constraint.create({ pointA: p, bodyB: it.body, pointB: { x: p.x - it.body.position.x, y: p.y - it.body.position.y }, stiffness: .16, damping: .12, length: 0 }); Composite.add(world, grip);
      });
      c.addEventListener('pointermove', (e) => { if (!grip) return; const p = at(e); moved += Math.hypot(p.x - last.x, p.y - last.y); last = p; grip.pointA = p; });
      const drop = () => { if (!grip) return; Composite.remove(world, grip); grip = null; c.classList.remove('is-held'); };
      c.addEventListener('pointerup', drop); c.addEventListener('pointercancel', drop);
      c.addEventListener('click', (e) => { if (moved > 8) e.preventDefault(); }); c.addEventListener('dragstart', (e) => e.preventDefault());
    });
    box.addEventListener('pointerdown', (e) => {
      if (e.target !== box || !live) return; const p = at(e), ring = el('i', 'blast'); ring.style.left = p.x + 'px'; ring.style.top = p.y + 'px'; box.appendChild(ring); setTimeout(() => ring.remove(), 720);
      const reach = Math.max(420, W * .5);
      items.forEach(({ body }) => { const dx = body.position.x - p.x, dy = body.position.y - p.y, d = Math.hypot(dx, dy) || 1; if (d > reach) return; const f = (1 - d / reach) * .09 * body.mass; Body.applyForce(body, body.position, { x: (dx / d) * f, y: (dy / d) * f - f * .35 }); Body.setAngularVelocity(body, body.angularVelocity + (Math.random() - .5) * .3); });
    });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (e.intersectionRatio > .35) spawn(); }, { threshold: [0, .35] }).observe(box);
    function render() {
      for (const { el: c, body, w, h } of items) {
        if (body.position.y > H + 400 || body.position.x < -300 || body.position.x > W + 300) { Body.setPosition(body, { x: W / 2, y: -100 }); Body.setVelocity(body, { x: 0, y: 0 }); }
        c.style.transform = `translate3d(${(body.position.x - w / 2).toFixed(1)}px,${(body.position.y - h / 2).toFixed(1)}px,0) rotate(${body.angle.toFixed(3)}rad)`;
      }
    }
    gsap.ticker.add((time, dt) => { if (!inView || !live) return; Engine.update(engine, clamp(dt || 16.7, 8, 33)); render(); });
    window.__pile = { step(n = 1) { spawn(); for (let i = 0; i < n; i++) Engine.update(engine, 16.7); render(); } };
  })();

  /* cursor: an arrow that turns to face its direction of travel */
  if (fine) {
    const cur = $('#cursor'), svg = $('svg', cur), tag = $('#cursorTag'); let px = 0, py = 0, ang = 0, target = 0, lastMove = 0, shown = false;
    addEventListener('mousemove', (e) => {
      if (!shown) { shown = true; px = e.clientX; py = e.clientY; document.documentElement.classList.add('has-cursor'); }
      const dx = e.clientX - px, dy = e.clientY - py; if (dx * dx + dy * dy > 16) { target = Math.atan2(dy, dx) * 180 / Math.PI + 135; lastMove = performance.now(); px = e.clientX; py = e.clientY; }
      cur.style.transform = `translate3d(${e.clientX - 2}px,${e.clientY - 2}px,0)`;
      const t = e.target, tg = t.closest && t.closest('[data-tag]');
      cur.classList.toggle('is-link', !!(t.closest && t.closest('a, button, .chip, .repo, .k__list li'))); cur.classList.toggle('has-tag', !!tg); if (tg) tag.textContent = tg.dataset.tag;
    }, { passive: true });
    document.addEventListener('mouseleave', () => { shown = false; document.documentElement.classList.remove('has-cursor'); });
    gsap.ticker.add(() => { if (performance.now() - lastMove > 500) target = 0; ang += (((target - ang + 540) % 360) - 180) * .16; svg.style.rotate = ang.toFixed(1) + 'deg'; });
  }

  /* boot → intro */
  const loader = $('#loader'), log = $('#bootLog'), heroLetters = letters.filter((g) => g.el.closest('.hero')).flatMap((g) => g.items);
  heroLetters.forEach((it) => { it.intro = 1; it.w = 180; });
  const fig = $('#portrait'); lens.x = fig.clientWidth / 2; lens.y = fig.clientHeight * .3; lens.r = Math.hypot(fig.clientWidth, fig.clientHeight);
  if (lenis) lenis.stop(); scrollTo(0, 0);
  const boot = ['<i>$</i> make portfolio', '[cc] hero.o  work.o  stack.o  contact.o', '[gh] fetching repositories from github … <b>ok</b>', '[ld] linking 4 objects', '<b>✓ build succeeded</b> — 0 errors, 0 warnings'];
  let done = false;
  function start() {
    if (done) return; done = true; window.__started = true; if (lenis) lenis.start();
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to(loader, { opacity: 0, duration: .45, ease: 'power2.inOut' })
      .from('.hero__name .l', { yPercent: 55, opacity: 0, duration: .9, stagger: .03 }, '-=.2')
      .to(heroLetters, { intro: 0, duration: 1.3, stagger: .035, ease: 'power2.out' }, '<.1')
      .from('.hero__me', { yPercent: 6, opacity: 0, duration: 1.1 }, '<')
      .to(lens, { r: 0, duration: 2, ease: 'power3.inOut', onComplete: () => { lens.intro = false; } }, '<.2')
      .from('.hero__copy .cm, .code, .hero__cta > *', { opacity: 0, y: 16, duration: .7, stagger: .08 }, '-=1.6')
      .add(typeCode, '-=1.2')
      .from('.bar, .status', { opacity: 0, duration: .6 }, '-=1.4')
      .add(() => { loader.remove(); ScrollTrigger.refresh(); });
  }
  let li = 0; (function line() { if (li >= boot.length) return setTimeout(start, 260); const d = document.createElement('div'); d.innerHTML = boot[li++]; log.appendChild(d); setTimeout(line, 190 + Math.random() * 130); })();
  setTimeout(start, 5000);
  addEventListener('load', () => ScrollTrigger.refresh());
})();
