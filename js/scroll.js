/* scroll.js: the scrolling story view (chapters stacked on one page), with a Step view fallback */
(function () {
  'use strict';
  var E = K.el, S = K.story;
  var MODES = { scroll: 1, step: 1 };
  var mode = K.store.get('storyMode', 'scroll');
  if (!MODES[mode]) mode = 'scroll';
  S.scrollBoot = mode === 'scroll';          /* story.js skips drawing step 1 when we start in scroll mode */

  var scenes = S.scenes, chapters = [], active = -1, rafId = 0;
  var wrapStep, wrapScroll, rootEl, rail, railList, railFill, railNow, btnScroll, btnStep;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hdrH() { var h = K.$('.site-header'); return h ? h.offsetHeight : 118; }
  function setHdr() { document.documentElement.style.setProperty('--hdr', hdrH() + 'px'); }

  /* ---------- chapters ---------- */
  function makeChapters() {
    K.clear(rootEl);
    chapters = scenes.map(function (sc, i) {
      var bg = E('div', { class: 'ch-bg', 'aria-hidden': 'true', style: { '--bg': 'url(' + sc.bg + ')' } });
      var inner = E('div', { class: 'ch-inner' });
      var cue = i < scenes.length - 1
        ? E('p', { class: 'scroll-cue', 'aria-hidden': 'true' }, 'Keep scrolling ↓')
        : E('p', { class: 'scroll-cue end' }, E('a', { class: 'btn', href: '#portfolio' }, 'Try Kairo’s inventions →'));
      var el = E('section', { class: 'chapter', id: 'ch-' + sc.id, 'data-i': String(i), 'aria-label': 'Chapter ' + (i + 1) + ': ' + sc.title },
        bg, E('div', { class: 'ch-num', 'aria-hidden': 'true', text: pad(i + 1) }), inner, cue);
      rootEl.appendChild(el);
      return { i: i, id: sc.id, el: el, bg: bg, inner: inner, inst: null, built: false, near: false };
    });
  }
  function build(i) {
    var c = chapters[i]; if (!c || c.built) return;
    c.built = true;
    c.inst = S.render(i, c.inner, 'scroll');
    S.markVisited(c.id);
    var b = railList.children[i] && railList.children[i].firstChild;
    if (b) b.classList.add('seen');
  }
  function destroy(c) { if (c.inst) { c.inst.destroy(); c.inst = null; } c.built = false; }

  /* keep what the visitor is looking at in place while a chapter above it changes height */
  function keepPosition(fn) {
    var ref = active >= 0 && chapters[active] ? chapters[active].el : null;
    var before = ref ? ref.getBoundingClientRect().top : 0;
    fn();
    if (ref) {
      var after = ref.getBoundingClientRect().top;
      if (Math.abs(after - before) > 1) window.scrollTo({ top: window.scrollY + (after - before), behavior: 'instant' });
    }
  }
  function rebuild(id) {
    var c = chapters.filter(function (x) { return x.id === id; })[0];
    if (!c || !c.built) return;
    keepPosition(function () { destroy(c); build(c.i); });
  }

  /* ---------- rail (progress + chapter list) ---------- */
  function makeRail() {
    K.clear(railList);
    scenes.forEach(function (sc, i) {
      var b = E('button', { type: 'button', 'aria-label': 'Go to chapter ' + (i + 1) + ': ' + sc.short }, E('span', { class: 'rn', text: pad(i + 1) }), ' ' + sc.short);
      b.addEventListener('click', function () { goTo(i); });
      railList.appendChild(E('li', null, b));
    });
  }
  function setActive(i) {
    if (i === active) return; active = i;
    Array.prototype.forEach.call(railList.children, function (li, k) {
      if (k === i) li.firstChild.setAttribute('aria-current', 'true'); else li.firstChild.removeAttribute('aria-current');
    });
    railNow.textContent = 'Chapter ' + (i + 1) + ' of ' + scenes.length + ': ' + scenes[i].short;
    chapters.forEach(function (c) { c.el.classList.toggle('current', c.i === i); });
    document.dispatchEvent(new CustomEvent('kairo:chapter', { detail: { id: scenes[i].id } }));
  }
  function goTo(i) {
    var c = chapters[i]; if (!c) return;
    build(i);
    c.el.scrollIntoView({ behavior: K.motionOK() ? 'smooth' : 'auto', block: 'start' });
    var t = K.$('h3', c.inner); if (t) t.focus({ preventScroll: true });
  }

  /* ---------- scroll effects: progress line and gentle background drift ---------- */
  function frame() {
    rafId = 0;
    var vh = window.innerHeight, r = rootEl.getBoundingClientRect();
    var fill = Math.max(0, Math.min(1, (vh * 0.5 - r.top) / Math.max(1, r.height)));
    railFill.style.setProperty('--fill', fill.toFixed(3));
    if (K.motionOK()) {
      chapters.forEach(function (c) {
        if (!c.near) return;
        var b = c.el.getBoundingClientRect();
        var d = (b.top + b.height / 2 - vh / 2);
        c.bg.style.transform = 'translate3d(0,' + (d * -0.08).toFixed(1) + 'px,0) scale(1.18)';
      });
    }
  }
  function onScroll() { if (!rafId) rafId = requestAnimationFrame(frame); }
  function resetDrift() { chapters.forEach(function (c) { c.bg.style.transform = ''; }); onScroll(); }

  /* ---------- observers ---------- */
  var ioBuild, ioActive, ioReveal;
  function observe() {
    disconnect();
    if (!('IntersectionObserver' in window)) { chapters.forEach(function (c) { build(c.i); c.near = true; }); setActive(0); return; }
    rootEl.parentNode.classList.add('reveal-ready');
    ioBuild = new IntersectionObserver(function (en) {
      en.forEach(function (e) { var c = chapters[+e.target.getAttribute('data-i')]; c.near = e.isIntersecting; if (e.isIntersecting) build(c.i); });
      onScroll();
    }, { rootMargin: '500px 0px 500px 0px' });
    ioActive = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) setActive(+e.target.getAttribute('data-i')); });
    }, { rootMargin: '-42% 0px -52% 0px' });
    ioReveal = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ioReveal.unobserve(e.target); } });
    }, { threshold: 0.08 });
    chapters.forEach(function (c) { ioBuild.observe(c.el); ioActive.observe(c.el); ioReveal.observe(c.inner); });
  }
  function disconnect() { [ioBuild, ioActive, ioReveal].forEach(function (o) { if (o) o.disconnect(); }); ioBuild = ioActive = ioReveal = null; }

  /* ---------- mode switch ---------- */
  function setMode(m, quiet) {
    mode = m; K.store.set('storyMode', m); S.mode = m;
    btnScroll.setAttribute('aria-pressed', m === 'scroll' ? 'true' : 'false');
    btnStep.setAttribute('aria-pressed', m === 'step' ? 'true' : 'false');
    wrapScroll.hidden = m !== 'scroll'; wrapStep.hidden = m !== 'step';
    if (m === 'scroll') {
      S.clearStep();
      makeChapters(); active = -1; observe(); setActive(0); onScroll();
    } else {
      disconnect(); chapters.forEach(destroy); K.clear(rootEl); chapters = []; active = -1;
      wrapScroll.classList.remove('reveal-ready');
      S.showStep(S.state.idx || 0, false);
    }
    if (!quiet) K.toast(m === 'scroll' ? 'Scroll view' : 'Step view', m === 'scroll' ? 'The story now unfolds as you scroll down.' : 'One scene at a time, with Back and Next buttons.');
  }

  function boot() {
    wrapStep = K.$('#stepWrap'); wrapScroll = K.$('#scrollWrap'); rootEl = K.$('#scrollRoot');
    rail = K.$('#rail'); railList = K.$('#railList'); railFill = K.$('#railFill'); railNow = K.$('#railNow');
    btnScroll = K.$('#modeScroll'); btnStep = K.$('#modeStep');
    if (!rootEl) return;
    makeRail(); setHdr();
    window.addEventListener('resize', function () { setHdr(); onScroll(); });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('kairo:settings', resetDrift);
    btnScroll.addEventListener('click', function () { if (mode !== 'scroll') setMode('scroll'); });
    btnStep.addEventListener('click', function () { if (mode !== 'step') setMode('step'); });
    S.scrollGo = goTo;
    /* story state changes that other chapters depend on */
    document.addEventListener('kairo:trust', function () { if (mode === 'scroll') rebuild('truth'); });
    document.addEventListener('kairo:free', function () { if (mode === 'scroll') { rebuild('stillhour'); rebuild('epilogue'); } });
    document.addEventListener('kairo:reset', function () {
      if (mode !== 'scroll') return;
      chapters.forEach(function (c) { var was = c.built; destroy(c); if (was) build(c.i); });
      railList && Array.prototype.forEach.call(railList.querySelectorAll('button'), function (b) { b.classList.remove('seen'); });
    });
    S.mode = mode;
    if (mode === 'scroll') setMode('scroll', true);
    else { btnScroll.setAttribute('aria-pressed', 'false'); btnStep.setAttribute('aria-pressed', 'true'); wrapScroll.hidden = true; wrapStep.hidden = false; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
