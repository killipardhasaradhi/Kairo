/* core.js: shared helpers, settings, clues + notebook, toasts, modal, audio, landing hero */
(function () {
  'use strict';
  var K = window.K = {};

  /* ---------- tiny DOM helpers ---------- */
  K.$ = function (s, r) { return (r || document).querySelector(s); };
  K.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  K.el = function (tag, attrs) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (p) { e.style.setProperty(p, v[p]); });
        else e.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) K._add(e, arguments[i]);
    return e;
  };
  K._add = function (parent, kid) {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { K._add(parent, k); }); return; }
    parent.appendChild(kid.nodeType ? kid : document.createTextNode(String(kid)));
  };
  /* Build SVG from a *static, trusted* string written in this codebase. */
  K.svg = function (markup) {
    var t = document.createElement('template');
    t.innerHTML = markup.trim();
    return t.content.firstChild;
  };
  K.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };

  /* ---------- storage (fails quietly) ---------- */
  K.store = {
    get: function (k, d) { try { var v = localStorage.getItem('kairo:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('kairo:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del: function (k) { try { localStorage.removeItem('kairo:' + k); } catch (e) { /* ignore */ } }
  };

  /* ---------- settings ---------- */
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  K.settings = {
    theme: K.store.get('theme', 'night'),
    sound: false,                                    /* always off at load: sound is opt-in */
    reduce: K.store.get('reduce', mq.matches),
    sparkle: K.store.get('sparkle', true),
    chaos: K.store.get('chaos', false)
  };
  K.motionOK = function () { return !K.settings.reduce; };

  function setPressed(btn, on, label) {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    K.$('.tool-label', btn).textContent = label;
  }
  K.applySettings = function () {
    var s = K.settings, root = document.documentElement;
    root.setAttribute('data-theme', s.theme);
    root.classList.toggle('reduce-motion', !!s.reduce);
    document.body.classList.toggle('chaos', !!s.chaos);
    var meta = K.$('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', s.theme === 'night' ? '#070a1f' : '#2a2862');
    var t = K.$('#tgTheme'); setPressed(t, s.theme === 'twilight', s.theme === 'night' ? 'Night' : 'Twilight');
    K.$('span[aria-hidden]', t).textContent = s.theme === 'night' ? '🌙' : '🌅';
    var so = K.$('#tgSound'); setPressed(so, s.sound, s.sound ? 'Sound on' : 'Sound off');
    K.$('span[aria-hidden]', so).textContent = s.sound ? '🔊' : '🔇';
    setPressed(K.$('#tgMotion'), s.reduce, s.reduce ? 'Motion reduced' : 'Motion on');
    setPressed(K.$('#tgSparkle'), s.sparkle, s.sparkle ? 'Sparkle on' : 'Sparkle off');
    setPressed(K.$('#tgChaos'), s.chaos, s.chaos ? 'Chaos on' : 'Chaos off');
    document.dispatchEvent(new CustomEvent('kairo:settings'));
  };

  /* ---------- toasts ---------- */
  K.toast = function (title, sub) {
    var box = K.$('#toasts');
    var t = K.el('div', { class: 'toast' }, K.el('strong', { text: title }), sub ? K.el('small', { text: sub }) : null);
    box.appendChild(t);
    while (box.children.length > 2) box.removeChild(box.firstChild);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 4200);
  };

  /* ---------- modal ---------- */
  var modal, lastFocus;
  K.modal = function (title, nodes) {
    modal = modal || K.$('#modal');
    lastFocus = document.activeElement;
    K.$('#modalTitle').textContent = title;
    var body = K.clear(K.$('#modalBody'));
    K._add(body, nodes);
    if (typeof modal.showModal === 'function') { if (!modal.open) modal.showModal(); } else { modal.setAttribute('open', ''); }
    K.$('#modalX').focus();
  };
  K.closeModal = function () {
    modal = modal || K.$('#modal');
    if (modal.open) { if (modal.close) modal.close(); else modal.removeAttribute('open'); }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  /* ---------- audio (synthesised, no files; opt-in with mute) ---------- */
  var ctx = null;
  function ac() {
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (C) { try { ctx = new C(); } catch (e) { ctx = null; } } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, delay, slideTo) {
    var c = ac(); if (!c) return;
    var t0 = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  K.sound = {
    play: function (name) {
      if (!K.settings.sound) return;
      if (name === 'click') { tone(880, 0.07, 'triangle', 0.07); tone(1320, 0.06, 'sine', 0.04, 0.03); }
      else if (name === 'clue') { tone(660, 0.12, 'sine', 0.1); tone(990, 0.18, 'sine', 0.1, 0.09); tone(1320, 0.3, 'sine', 0.08, 0.18); }
      else if (name === 'knock') { for (var i = 0; i < 3; i++) tone(140, 0.12, 'square', 0.16, i * 0.32, 60); }
      else if (name === 'bell') { [220, 330, 440, 663].forEach(function (f, j) { tone(f, 2.6, 'sine', 0.12 / (j + 1), 0, f * 0.995); }); }
      else if (name === 'tick') { tone(1800, 0.03, 'square', 0.03); }
      else if (name === 'egg') { [523, 659, 784, 1046].forEach(function (f, j) { tone(f, 0.35, 'sine', 0.1, j * 0.12); }); }
    }
  };

  /* ---------- clues ---------- */
  K.clues = [
    { id: 'clock',   sym: '⏱', name: 'The backward-ticking lantern clock', where: 'Prologue: the lantern', scene: 'prologue',
      desc: 'The handless clock inside Kairo’s lantern ticks the wrong way.',
      theory: 'Something is wrong with time.',
      meaning: 'The timeline is broken and the lantern is answering it. The message inside came from another attempt by Kairo.',
      links: ['star', 'vanish', 'bell13', 'forward'] },
    { id: 'vanish',  sym: '🌠', name: 'The vanishing star', where: 'Prologue: the night sky', scene: 'prologue',
      desc: 'A star disappeared the moment the ticking turned backward.',
      theory: 'Whatever this is, it reaches beyond the lantern.',
      meaning: 'The timeline has changed, and the consequences reach past Stillhour. At the end, the stars return as a doorway.',
      links: ['clock', 'forward'] },
    { id: 'bird',    sym: '🕊', name: 'The paper bird', where: 'Chapter 1: Stillhour', scene: 'stillhour',
      desc: 'A paper bird says, “You came back earlier this time.”',
      theory: 'Someone thinks Kairo has been here before.',
      meaning: 'Kairo has made earlier attempts and forgotten every one of them.',
      links: ['book', 'drawings', 'knocks', 'mirror'] },
    { id: 'drawings', sym: '🖼', name: 'Drawings of the future', where: 'Chapter 2: the clockmaker’s workshop', scene: 'workshop',
      desc: 'Pinned drawings show places and events that have not happened yet.',
      theory: 'Does the clockmaker know the future, or is he hiding something?',
      meaning: 'They are traces of previous attempts, left behind by earlier versions of Kairo.',
      links: ['star', 'bird', 'knocks'] },
    { id: 'star',    sym: '☆', name: 'The star with one missing point', where: 'Workshop, library, and the lantern', scene: 'workshop',
      desc: 'The same star appears in every drawing, in the book, and on the lantern. One point is always missing.',
      theory: 'A hidden group? A warning? A signature?',
      meaning: 'An earlier Kairo left it on purpose as a reminder. It survived when memories did not.',
      links: ['drawings', 'book', 'clock'] },
    { id: 'knocks',  sym: '🚪', name: 'Three knocks behind the wall', where: 'Chapter 2: the workshop wall', scene: 'workshop',
      desc: 'Knock. Knock. Knock. Then a whisper: “You remembered the signal.”',
      theory: 'Someone is trapped behind the wall, or trying to reach Kairo.',
      meaning: 'A signal crossing the broken timeline. In the epilogue, the knocks return from the other side of the sky.',
      links: ['bird', 'drawings'] },
    { id: 'book',    sym: '📕', name: 'KAIRO — FINAL LOOP', where: 'Chapter 3: Library of Unwritten Days', scene: 'library',
      desc: 'A book of warnings in Kairo’s own handwriting. Kairo has never read it.',
      theory: 'Kairo recorded an earlier investigation.',
      meaning: 'Previous versions of Kairo reached this exact page and left records behind.',
      links: ['star', 'bird', 'warnings'] },
    { id: 'warnings', sym: '⚖', name: 'The contradictory warnings', where: 'Chapter 3: inside the Final Loop book', scene: 'library',
      desc: '“Trust the clockmaker.” And on the next page: “Never trust him.”',
      theory: 'At least one of them has to be lying.',
      meaning: 'Different versions of Kairo wrote them after different attempts, each holding different fragments of the truth.',
      links: ['book', 'darkeyes', 'mirror', 'bell13'] },
    { id: 'mirror',  sym: '🪞', name: 'The independent mirror', where: 'Chapter 4: the Mirror Room', scene: 'mirror',
      desc: 'Kairo’s reflection turned its head. Kairo did not.',
      theory: 'A trap, or a doorway to another timeline.',
      meaning: 'Kairo was meeting another version of themself.',
      links: ['darkeyes', 'bird', 'warnings'] },
    { id: 'darkeyes', sym: '👁', name: 'The dark eyes of the other Kairo', where: 'Chapter 4: the Mirror Room', scene: 'mirror',
      desc: 'The stranger looks exhausted. Its eyes are dark and it guards something.',
      theory: 'Is this Kairo gone bad?',
      meaning: 'This version has lost nearly every memory except the urge to stop another reset. It is frightened, not evil.',
      links: ['mirror', 'warnings'] },
    { id: 'bell13',  sym: '🔔', name: 'The thirteenth bell', where: 'The lantern’s warning, then the Clock Tower', scene: 'tower',
      desc: '“Do not ring the thirteenth bell.” A clock has twelve marks. This bell is the missing one.',
      theory: 'Ringing it might trigger something terrible.',
      meaning: 'The bell is the missing minute that can be opened. Ringing it releases the memory that holds the loop together.',
      links: ['clock', 'warnings'] },
    { id: 'forward', sym: '✨', name: 'The forward-ticking lantern', where: 'Epilogue', scene: 'epilogue',
      desc: 'Thirteen marks. The clock ticks forward at last.',
      theory: 'Something changed after the bell rang.',
      meaning: 'The loop has ended and time can advance. A new message and a doorway in the stars hint at what comes next.',
      links: ['clock', 'vanish'] }
  ];
  K.clueById = {};
  K.clues.forEach(function (c) { K.clueById[c.id] = c; });

  K.found = K.store.get('found', []);
  K.conn = K.store.get('conn', {});          /* id -> [ids connected] */
  K.truth = K.store.get('truth', false);

  K.hasClue = function (id) { return K.found.indexOf(id) !== -1; };
  K.addClue = function (id, quiet) {
    if (!K.clueById[id] || K.hasClue(id)) return false;
    K.found.push(id);
    K.store.set('found', K.found);
    K.renderNotebook();
    if (!quiet) {
      var c = K.clueById[id];
      K.toast('Clue added: ' + c.name, 'Found: ' + c.where);
      K.sound.play('clue');
      var fab = K.$('#lanternFab');
      fab.classList.remove('pulse'); void fab.offsetWidth; if (K.motionOK()) fab.classList.add('pulse');
    }
    document.dispatchEvent(new CustomEvent('kairo:clue', { detail: id }));
    return true;
  };
  K.connect = function (a, b) {
    var A = K.clueById[a];
    if (!A || A.links.indexOf(b) === -1) return false;
    if (!K.hasClue(a) || !K.hasClue(b)) return false;
    K.conn[a] = K.conn[a] || []; K.conn[b] = K.conn[b] || [];
    if (K.conn[a].indexOf(b) === -1) K.conn[a].push(b);
    if (K.conn[b].indexOf(a) === -1) K.conn[b].push(a);
    K.store.set('conn', K.conn);
    return true;
  };
  K.revealTruth = function () { K.truth = true; K.store.set('truth', true); K.renderNotebook(); };

  K.renderNotebook = function () {
    var n = K.found.length, total = K.clues.length;
    K.$('#navBadge').textContent = n;
    K.$('#fabCount').textContent = n;
    K.$('#nbCount').textContent = n + ' of ' + total + ' clues found';
    K.$('#nbFill').style.width = Math.round(n / total * 100) + '%';
    K.$('#nbMeter').setAttribute('aria-valuenow', n);
    var list = K.clear(K.$('#nbList'));
    if (!n) {
      list.appendChild(K.el('div', { class: 'nb-empty' },
        K.el('p', { text: 'Nothing here yet.' }),
        K.el('p', { text: 'Explore a story scene and click the glowing ★ clues, or open a memory card in the Memory Archive.' }),
        K.el('a', { class: 'btn small', href: '#story', text: 'Start investigating' })));
      return;
    }
    K.clues.forEach(function (c) {
      if (!K.hasClue(c.id)) return;
      var mine = K.conn[c.id] || [];
      var others = K.found.filter(function (o) { return o !== c.id; });
      var sel = K.el('select', { id: 'sel-' + c.id, 'aria-label': 'Connect ' + c.name + ' with another clue' },
        K.el('option', { value: '', text: 'Choose a clue…' }),
        others.map(function (o) { return K.el('option', { value: o, text: K.clueById[o].name }); }));
      sel.addEventListener('change', function () {
        var v = sel.value; if (!v) return;
        var card = sel.closest('.clue-card');
        if (K.connect(c.id, v)) {
          K.toast('Connected!', c.name + ' ↔ ' + K.clueById[v].name);
          K.sound.play('clue');
          K.renderNotebook();
        } else {
          K.toast('No link yet', 'Those two clues do not seem to belong together. Try another.');
          if (K.motionOK()) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
          sel.value = '';
        }
      });
      list.appendChild(K.el('article', { class: 'clue-card' },
        K.el('h4', null, K.el('span', { class: 'sym', 'aria-hidden': 'true', text: c.sym }), c.name),
        K.el('p', { class: 'where', text: 'Found: ' + c.where }),
        K.el('p', { text: c.desc }),
        K.el('p', { class: 'theory', text: 'My theory: ' + c.theory }),
        K.truth ? K.el('p', { class: 'meaning', text: 'Meaning: ' + c.meaning }) : null,
        mine.length
          ? K.el('p', { class: 'conn yes', text: 'Connected to: ' + mine.map(function (m) { return K.clueById[m].name; }).join('; ') })
          : K.el('p', { class: 'conn', text: 'Not connected to another clue yet.' }),
        others.length ? K.el('div', null, K.el('label', { for: 'sel-' + c.id, text: 'Connect with…' }), sel) : null
      ));
    });
  };

  /* ---------- hero: tilt, shadow that moves first, egg star ---------- */
  function starPath(r, inner, missing) {
    var pts = [];
    for (var i = 0; i < 5; i++) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / 5, b = a + Math.PI / 5;
      pts.push({ o: [Math.cos(a) * r, Math.sin(a) * r], i: [Math.cos(b) * inner, Math.sin(b) * inner] });
    }
    /* skip outer tip number `missing`: connect the two inner points around it directly */
    var d = '', m = missing, first = true;
    for (var k = 0; k < 5; k++) {
      var idx = (m + 1 + k) % 5;                    /* start after the missing tip */
      var p = pts[idx];
      if (idx === m) continue;
      d += (first ? 'M' : 'L') + p.o[0].toFixed(2) + ' ' + p.o[1].toFixed(2) + ' ';
      first = false;
      d += 'L' + p.i[0].toFixed(2) + ' ' + p.i[1].toFixed(2) + ' ';
    }
    /* flat notch where the missing tip would be: the inner point on the far side of it */
    d += 'L' + pts[m].i[0].toFixed(2) + ' ' + pts[m].i[1].toFixed(2) + ' ';
    return d + 'Z';
  }
  K.missingStarPath = function (r) { return starPath(r || 10, (r || 10) * 0.42, 4); };

  function initHero() {
    var stage = K.$('#kairoStage'), img = K.$('#kairoImg'), shadow = K.$('#kairoShadow');
    K.$('#eggStarPath').setAttribute('d', K.missingStarPath(10));

    /* lantern clock ticks */
    var g = K.$('.lc-ticks');
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      var ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('x1', 60 + Math.sin(a) * 38); ln.setAttribute('y1', 60 - Math.cos(a) * 38);
      ln.setAttribute('x2', 60 + Math.sin(a) * 44); ln.setAttribute('y2', 60 - Math.cos(a) * 44);
      g.appendChild(ln);
    }

    /* Kairo eases toward the pointer slowly; the shadow gets there first. */
    var target = { x: 0, y: 0 }, kairo = { x: 0, y: 0 }, shad = { x: 0, y: 0 }, running = false;
    function move(clientX, clientY) {
      var r = stage.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((clientX - r.left) / r.width - 0.5) * 2));
      target.y = Math.max(-1, Math.min(1, ((clientY - r.top) / r.height - 0.5) * 2));
      if (!running) { running = true; requestAnimationFrame(loop); }
    }
    function loop() {
      if (!K.motionOK()) { img.style.transform = shadow.style.transform = ''; running = false; return; }
      kairo.x += (target.x - kairo.x) * 0.045; kairo.y += (target.y - kairo.y) * 0.045;
      shad.x += (target.x - shad.x) * 0.25;   shad.y += (target.y - shad.y) * 0.25;
      img.style.transform = 'translate(' + (kairo.x * -5).toFixed(2) + 'px,' + (kairo.y * -4).toFixed(2) + 'px) scale(1.03) rotate(' + (kairo.x * 0.8).toFixed(2) + 'deg)';
      shadow.style.transform = 'translate(' + (shad.x * -5 + shad.x * 16).toFixed(2) + 'px,' + (shad.y * -4 + 10).toFixed(2) + 'px) scale(1.03) rotate(' + (shad.x * 0.8).toFixed(2) + 'deg)';
      var still = Math.abs(target.x - kairo.x) < 0.002 && Math.abs(target.y - kairo.y) < 0.002;
      if (still) { running = false; } else requestAnimationFrame(loop);
    }
    stage.addEventListener('pointermove', function (e) { move(e.clientX, e.clientY); });
    stage.addEventListener('pointerdown', function (e) { move(e.clientX, e.clientY); });
    stage.addEventListener('pointerleave', function () { target.x = 0; target.y = 0; if (!running) { running = true; requestAnimationFrame(loop); } });
    shadow.style.transform = 'translate(0px,10px) scale(1.03)';

    /* three-click Easter egg on the lantern star */
    var egg = K.$('#eggStar'), n = 0, timer;
    egg.addEventListener('click', function () {
      n++; clearTimeout(timer);
      egg.classList.add('hit'); setTimeout(function () { egg.classList.remove('hit'); }, 220);
      K.sound.play('tick');
      timer = setTimeout(function () { n = 0; }, 2500);      /* clicks must come close together */
      if (n === 1) K.toast('A star on the lantern…', 'One point is missing.');
      if (n === 2) K.toast('It flickers.', 'One more?');
      if (n >= 3) {
        n = 0; K.sound.play('egg');
        K.store.set('egg', true);
        K.modal('You have been here before.', [
          K.el('p', { text: 'A note slips out of the lantern. The handwriting is Kairo’s own.' }),
          K.el('p', { class: 'modal-note', text: '“I cannot remember the last time I left this message. If the star is still missing a point, follow the clock that moves backward. The answer is not where the loop begins. It is why I chose to remain.”' }),
          K.el('p', { class: 'small-note', text: 'Hidden note unlocked. Thank you for looking closely.' })
        ]);
      }
    });
  }

  /* ---------- stars canvas ---------- */
  function initStars() {
    var cv = K.$('#stars'), c = cv.getContext('2d'), stars = [], w = 0, h = 0, raf = 0;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = cv.width = Math.floor(window.innerWidth * dpr); h = cv.height = Math.floor(window.innerHeight * dpr);
      stars = [];
      var count = Math.min(110, Math.floor(window.innerWidth * window.innerHeight / 14000));
      for (var i = 0; i < count; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.3 + .4) * dpr, p: Math.random() * 6.28, s: Math.random() * .02 + .005 });
      draw(0);
    }
    function draw(t) {
      c.clearRect(0, 0, w, h);
      var gold = document.documentElement.getAttribute('data-theme') === 'twilight' ? '255,236,190' : '255,243,207';
      stars.forEach(function (s) {
        var a = K.motionOK() ? 0.35 + 0.55 * Math.abs(Math.sin(s.p + t * s.s)) : 0.7;
        c.fillStyle = 'rgba(' + gold + ',' + a.toFixed(2) + ')';
        c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.fill();
      });
    }
    function frame(ts) {
      draw(ts / 16);
      raf = K.motionOK() && !document.hidden ? requestAnimationFrame(frame) : 0;
    }
    function kick() { cancelAnimationFrame(raf); raf = 0; if (K.motionOK() && !document.hidden) raf = requestAnimationFrame(frame); else draw(0); }
    window.addEventListener('resize', function () { size(); kick(); });
    document.addEventListener('visibilitychange', kick);
    document.addEventListener('kairo:settings', kick);
    size(); kick();
  }

  /* ---------- tabs (shared helper, roving tabindex) ---------- */
  K.tabs = function (tabs, panels, onSelect) {
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        t.setAttribute('aria-selected', j === i ? 'true' : 'false');
        t.setAttribute('tabindex', j === i ? '0' : '-1');
        panels[j].hidden = j !== i;
      });
      if (focus) tabs[i].focus();
      if (onSelect) onSelect(i);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, j = i;
        if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % tabs.length;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') j = 0; else if (k === 'End') j = tabs.length - 1; else return;
        e.preventDefault(); select(j, true);
      });
    });
    return select;
  };

  /* ---------- meet kairo viewer ---------- */
  var EXPRS = [
    ['curious', 'Curious', 'Kairo notices a strange symbol or an unexplained event.'],
    ['happy', 'Happy', 'Kairo briefly relaxes, or celebrates a discovery.'],
    ['thoughtful', 'Thoughtful', 'Kairo studies a clue or weighs a difficult choice.'],
    ['determined', 'Determined', 'Kairo prepares to confront the mystery.'],
    ['sad', 'Sad', 'Kairo remembers the friend whose disappearing dream started everything.'],
    ['surprised', 'Surprised', 'Kairo finds an unexpected message, or another version of themself.']
  ];
  function initMeet() {
    var pick = K.$('.expr-picker');
    EXPRS.forEach(function (e, i) {
      var b = K.el('button', { type: 'button', 'aria-pressed': i === 0 ? 'true' : 'false', 'aria-label': e[1] + ' expression' },
        K.el('img', { src: 'assets/expr-' + e[0] + '.jpg', alt: '', width: 102, height: 110, loading: 'lazy' }), e[1]);
      b.addEventListener('click', function () {
        K.$$('button', pick).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        var im = K.$('#exprImg'); im.src = 'assets/expr-' + e[0] + '.jpg'; im.alt = 'Kairo looking ' + e[1].toLowerCase();
        K.$('#exprName').textContent = e[1]; K.$('#exprNote').textContent = e[2];
      });
      pick.appendChild(b);
    });
    K.tabs([K.$('#tabExpr'), K.$('#tabTurn'), K.$('#tabShadow')], [K.$('#panelExpr'), K.$('#panelTurn'), K.$('#panelShadow')]);
  }

  /* ---------- boot ---------- */
  function boot() {
    K.applySettings();

    K.$('#tgTheme').addEventListener('click', function () { K.settings.theme = K.settings.theme === 'night' ? 'twilight' : 'night'; K.store.set('theme', K.settings.theme); K.applySettings(); });
    K.$('#tgSound').addEventListener('click', function () { K.settings.sound = !K.settings.sound; K.applySettings(); if (K.settings.sound) { ac(); K.sound.play('clue'); } });
    K.$('#tgMotion').addEventListener('click', function () { K.settings.reduce = !K.settings.reduce; K.store.set('reduce', K.settings.reduce); K.applySettings(); });
    K.$('#tgSparkle').addEventListener('click', function () { K.settings.sparkle = !K.settings.sparkle; K.store.set('sparkle', K.settings.sparkle); K.applySettings(); });
    K.$('#tgChaos').addEventListener('click', function () { K.settings.chaos = !K.settings.chaos; K.store.set('chaos', K.settings.chaos); K.applySettings(); K.toast(K.settings.chaos ? 'Chaos mode on' : 'Chaos mode off', K.settings.chaos ? 'Maximum early-web. Press the button again to calm down.' : 'Back to quiet midnight.'); });
    if (mq.addEventListener) mq.addEventListener('change', function (e) { if (K.store.get('reduce', null) === null) { K.settings.reduce = e.matches; K.applySettings(); } });

    /* click sounds on every button/link (only when sound is on) */
    document.addEventListener('click', function (e) {
      if (!K.settings.sound) return;
      var t = e.target.closest && e.target.closest('button, a.btn, .main-nav a');
      if (t && !t.matches('#tgSound, #eggStar')) K.sound.play('click');
    }, true);

    K.$('#modalX').addEventListener('click', K.closeModal);
    K.$('#modal').addEventListener('click', function (e) { if (e.target === this) K.closeModal(); });
    K.$('#lanternFab').addEventListener('click', function () { var nb = K.$('#notebook'); nb.scrollIntoView({ behavior: K.motionOK() ? 'smooth' : 'auto' }); });

    K.$('#nbConnectAll').addEventListener('click', function () {
      var made = 0;
      K.found.forEach(function (a) { K.clueById[a].links.forEach(function (b) { if (K.hasClue(b) && !(K.conn[a] || []).includes(b)) { K.connect(a, b); made++; } }); });
      K.renderNotebook();
      K.toast(made ? made + ' connection' + (made > 1 ? 's' : '') + ' made' : 'Nothing new to connect', made ? 'The pattern is getting clearer.' : 'Find more clues, then try again.');
    });
    K.$('#nbReset').addEventListener('click', function () {
      if (!K.found.length) return;
      if (!window.confirm('Clear all clues from your notebook on this device?')) return;
      K.found = []; K.conn = {}; K.truth = false;
      K.store.del('found'); K.store.del('conn'); K.store.del('truth');
      K.renderNotebook(); document.dispatchEvent(new CustomEvent('kairo:reset'));
    });

    initStars(); initHero(); initMeet(); K.renderNotebook();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
