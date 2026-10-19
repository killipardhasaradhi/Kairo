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
    chaos: K.store.get('chaos', false),
    calm: K.store.get('calm', false),                /* calm mode: no timers, no time pressure */
    volume: K.store.get('volume', 0.7),
    companion: K.store.get('companion', true)
  };
  K.danger = 0;                                      /* 0 (warm) .. 1 (cold, dangerous): driven by the story */
  K.pointer = { x: 0, y: 0, nx: 0, ny: 0, sx: 0, sy: 0, moved: false, type: 'mouse' };
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
    var cb = K.$('#tgCalm'); if (cb) setPressed(cb, s.calm, s.calm ? 'Calm on' : 'Calm off');
    root.classList.toggle('calm', !!s.calm);
    var vw = K.$('#volWrap'); if (vw) { vw.hidden = !s.sound; K.$('#vol').value = Math.round(s.volume * 100); }
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

  /* ---------- audio (synthesised, opt-in; stereo, volume, ambient ticking) ---------- */
  var ctx = null, master = null, pannerOK = false, noiseBuf = null;
  var amb = { tick: 0, step: 0, scene: '', quietUntil: 0 };
  function volGain() { var v = Math.max(0, Math.min(1, K.settings.volume)); return v * v; }
  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (C) {
        try {
          ctx = new C(); master = ctx.createGain(); master.gain.value = volGain(); master.connect(ctx.destination);
          pannerOK = typeof ctx.createStereoPanner === 'function';
        } catch (e) { ctx = null; }
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function dest(c, pan) {
    if (pan && pannerOK) { var p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); p.connect(master); return p; }
    return master;
  }
  function tone(freq, dur, type, vol, delay, slideTo, pan) {
    var c = ac(); if (!c) return;
    var t0 = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest(c, pan)); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, lo, hi, vol, delay, pan) {
    var c = ac(); if (!c) return;
    if (!noiseBuf) { noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.7), c.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var t0 = c.currentTime + (delay || 0), len = Math.min(dur + 0.05, 0.65);
    var src = c.createBufferSource(); src.buffer = noiseBuf;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.2;
    f.frequency.setValueAtTime(lo, t0); f.frequency.exponentialRampToValueAtTime(hi, t0 + dur);
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(dest(c, pan)); src.start(t0, 0, len);
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
      else if (name === 'secret') { [392, 587, 784, 1175].forEach(function (f, j) { tone(f, 0.45, 'sine', 0.07, j * 0.09, undefined, j % 2 ? 0.5 : -0.5); }); }
      else if (name === 'link') { tone(523, 0.25, 'triangle', 0.08, 0, undefined, -0.3); tone(784, 0.4, 'triangle', 0.08, 0.14, undefined, 0.3); }
      else if (name === 'contradiction') { tone(311, 0.5, 'sawtooth', 0.05, 0, 294); tone(329, 0.5, 'sawtooth', 0.05, 0, 311); tone(1500, 0.3, 'sine', 0.03, 0.05, 300); }
      else if (name === 'rewind') { tone(1400, 0.7, 'sawtooth', 0.035, 0, 140); noise(0.6, 3200, 300, 0.07, 0); }
      else if (name === 'glitch') { noise(0.16, 2400, 600, 0.07, 0); tone(90, 0.12, 'square', 0.05, 0.03); }
      else if (name === 'beep') { tone(1046, 0.08, 'square', 0.04); tone(1568, 0.08, 'square', 0.04, 0.09); }
    }
  };
  var WHISPER = { prologue: [1400, 2600, -0.2], stillhour: [900, 1800, 0.3], workshop: [700, 1500, -0.4], library: [1100, 2000, 0.2], mirror: [2200, 900, 0.7], truth: [600, 1300, -0.5], tower: [500, 1000, 0, ], epilogue: [1800, 3200, 0], idle: [800, 1700, 0] };
  var THEMES = {
    loop: [440, 392, 349, 330], together: [392, 494, 587, 784], alone: [330, 392, 440, 494, 659], second: [440, 523, 659, 523, 880],
    seeker: [523, 659, 784, 988, 1175], shadow: [262, 330, 392, 330, 523], plain: [523, 659, 784]
  };
  K.audio = {
    /* explicit instrument sound (Lullaby Lab): plays even when ambient sound is off, because the visitor pressed a key */
    note: function (freq, dur, type, vol, delay, pan) { tone(freq, dur, type, vol, delay, undefined, pan); },
    ready: function () { return !!ac(); },
    volume: function (v) { K.settings.volume = v; K.store.set('volume', v); if (master) master.gain.value = volGain(); },
    tick: function (pan, vol) { if (K.settings.sound) tone(1500, 0.035, 'square', vol || 0.03, 0, 900, pan === undefined ? -0.85 : pan); },
    step: function (pan) { if (!K.settings.sound) return; var p = pan === undefined ? 0.8 : pan; noise(0.1, 300, 110, 0.07, 0, p); noise(0.1, 320, 120, 0.05, 0.2, p); },
    chime: function (near) { if (K.settings.sound) tone(800 + near * 900, 0.24, 'sine', 0.015 + near * 0.03, 0, undefined, 0); },
    whisper: function (id) { if (!K.settings.sound) return; var w = WHISPER[id] || WHISPER.idle; noise(0.55, w[0], w[1], 0.06, 0, w[2]); noise(0.4, w[1], w[0], 0.035, 0.3, -w[2]); },
    silence: function (ms) { amb.quietUntil = Math.max(amb.quietUntil, performance.now() + ms); },
    scene: function (id) { amb.scene = id; },
    theme: function (id) {
      if (!K.settings.sound) return;
      (THEMES[id] || THEMES.plain).forEach(function (f, j) { tone(f, 1.1, 'sine', 0.07, j * 0.38, undefined, id === 'shadow' ? (j % 2 ? 0.7 : -0.7) : 0); tone(f / 2, 1.4, 'triangle', 0.035, j * 0.38); });
    },
    refresh: function () {
      if (K.settings.sound) { ac(); if (!amb.tick) amb.tick = setTimeout(ambTick, 700); if (!amb.step) amb.step = setTimeout(ambStep, 1600); }
      else { clearTimeout(amb.tick); clearTimeout(amb.step); amb.tick = amb.step = 0; }
      if (master) master.gain.value = volGain();
    }
  };
  K.tempo = 1;
  function ambTick() {
    amb.tick = 0; if (!K.settings.sound) return;
    var d = K.danger || 0, interval = 1000 / ((1 + d * 2.4) * (K.tempo || 1));
    if (!document.hidden && performance.now() > amb.quietUntil) K.audio.tick(-0.85, 0.012 + d * 0.024);
    amb.tick = setTimeout(ambTick, interval);
  }
  var STEP_SCENES = { mirror: 1, truth: 1, tower: 1 };
  function ambStep() {
    amb.step = 0; if (!K.settings.sound) return;
    if (!document.hidden && performance.now() > amb.quietUntil && (STEP_SCENES[amb.scene] || K.flags.shadowTurned)) K.audio.step(0.8);
    amb.step = setTimeout(ambStep, 1800 + Math.random() * 1800);
  }
  document.addEventListener('kairo:settings', function () { K.audio.refresh(); });

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
  K.order = K.store.get('order', []);       /* clue ids in the order they were found */

  /* ---------- journal: flags (decisions), secrets ---------- */
  K.flags = K.store.get('flags', {});
  K.flag = function (k) { return K.flags[k]; };
  K.setFlag = function (k, v) {
    K.flags[k] = v; K.store.set('flags', K.flags);
    document.dispatchEvent(new CustomEvent('kairo:flag', { detail: { key: k, value: v } }));
  };
  K.bump = function (k) { K.setFlag(k, (K.flags[k] || 0) + 1); return K.flags[k]; };
  K.SECRETS = [
    { id: 'egg',        name: 'The note in the lantern',        hint: 'The star on the lantern is not just decoration. Be persistent with it.' },
    { id: 'shadow',     name: 'The way the shadow faces',       hint: 'Something dark glows at the edge of the first picture. Look at it, then follow its gaze.' },
    { id: 'symbols',    name: 'Six hidden symbols',             hint: 'Move slowly over the page. Some corners hold small marks that only show near the lantern light.' },
    { id: 'behind',     name: 'Something behind you',           hint: 'Keep exploring for a while. Kairo may notice something you do not.' },
    { id: 'lanternBack', name: 'The back of the lantern',       hint: 'Objects look different from other angles. Turn the lantern all the way around.' },
    { id: 'drawingBack', name: 'The back of a drawing',         hint: 'A drawing pinned to a wall has a back.' },
    { id: 'fleeting',   name: 'The fleeting note',              hint: 'Some things in the workshop exist for only a few seconds.' },
    { id: 'dust',       name: 'Writing in the falling dust',    hint: 'In the library, make time stand still.' },
    { id: 'mirrorText', name: 'Writing meant for a mirror',     hint: 'Text in the mirror room is backwards for a reason.' },
    { id: 'mirrorBell', name: 'The bell only the mirror shows', hint: 'The reflection has something the room does not.' },
    { id: 'ninth',      name: 'The ninth place',                hint: 'The story says eight scenes. Study the secret map once you understand the truth.' },
    { id: 'terminal',   name: 'A message that should not exist', hint: 'Something on the secret map is not in any scene.' },
    { id: 'ciphers',    name: 'Three ciphers decoded',          hint: 'The observer’s files need keys that only collected clues can give you.' }
  ];
  K.secrets = K.store.get('secrets', {});
  K.hasSecret = function (id) { return !!K.secrets[id]; };
  K.secret = function (id, quiet) {
    if (K.secrets[id]) return false;
    var def = K.SECRETS.filter(function (x) { return x.id === id; })[0]; if (!def) return false;
    K.secrets[id] = true; K.store.set('secrets', K.secrets);
    if (!quiet) { K.toast('Secret found: ' + def.name, Object.keys(K.secrets).length + ' of ' + K.SECRETS.length + ' secrets'); K.sound.play('secret'); }
    document.dispatchEvent(new CustomEvent('kairo:secret', { detail: id }));
    return true;
  };

  /* why two clues belong together, shown once they are connected */
  K.WHY = {
    'clock|star': 'Both are missing one piece: a clock with no hands, a star with a missing point. Someone left both marks.',
    'clock|vanish': 'The star vanished the moment the clock began ticking backward.',
    'clock|bell13': 'A clock has twelve marks. The warning inside it names a thirteenth, the one that is missing.',
    'clock|forward': 'The same lantern clock, before the loop ends and after it.',
    'vanish|forward': 'The star that disappeared comes back as a doorway made of stars.',
    'bird|book': 'The bird says Kairo came back earlier. The book is the record of those earlier attempts.',
    'bird|drawings': 'The bird says Kairo came back earlier. The drawings were left by an earlier Kairo.',
    'bird|knocks': 'Two messages that both speak as if Kairo had been here before.',
    'bird|mirror': 'The stranger in the mirror is another version of Kairo, one who has been here before.',
    'drawings|star': 'The same missing-point star sits in the corner of every drawing.',
    'drawings|knocks': 'Both come from the workshop, and both are signals left by earlier attempts.',
    'star|book': 'The missing-point star appears on the pages of the Final Loop book.',
    'book|warnings': 'The warnings are written inside the Final Loop book.',
    'warnings|darkeyes': 'Some of the warnings were sent backward by this exhausted version of Kairo.',
    'warnings|mirror': 'The mirror shows a Kairo who knows why the warnings disagree.',
    'warnings|bell13': 'The warnings disagree about the clockmaker, but the lantern’s warning names the thirteenth bell.',
    'mirror|darkeyes': 'The figure that stepped out of the mirror is the one with the dark, tired eyes.'
  };
  K.why = function (a, b) { return K.WHY[a + '|' + b] || K.WHY[b + '|' + a] || 'These clues point to the same forgotten history.'; };
  /* pairs the notebook connects by itself the moment the visitor has both */
  K.HIDDEN_PAIRS = [['bird', 'knocks'], ['drawings', 'star'], ['star', 'book'], ['mirror', 'darkeyes'], ['clock', 'bell13'], ['book', 'warnings'], ['clock', 'vanish']];
  K.autoConnect = function () {
    var made = [];
    K.HIDDEN_PAIRS.forEach(function (p) {
      if (!K.hasClue(p[0]) || !K.hasClue(p[1])) return;
      if ((K.conn[p[0]] || []).indexOf(p[1]) !== -1) return;
      K.conn[p[0]] = K.conn[p[0]] || []; K.conn[p[1]] = K.conn[p[1]] || [];
      K.conn[p[0]].push(p[1]); K.conn[p[1]].push(p[0]); made.push(p);
    });
    if (made.length) {
      K.store.set('conn', K.conn); K.renderNotebook();
      K.bump('autoLinks');
      var p = made[0];
      K.toast('The notebook connected two clues by itself', K.clueById[p[0]].name + ' ↔ ' + K.clueById[p[1]].name);
      K.sound.play('link');
      document.dispatchEvent(new CustomEvent('kairo:autoconnect', { detail: made }));
    }
    return made.length;
  };
  /* clues read differently depending on what was found before them */
  K.VARIANTS = {
    bird:     { other: 'knocks', before: 'Found before the knocks, it reads like a greeting from a stranger.', after: 'Found after the knocks, it sounds like the same voice that whispered through the wall.' },
    star:     { other: 'book', before: 'Found before the book, it is just a mark in a corner.', after: 'Found after the book, it is a signature that keeps surviving.' },
    warnings: { other: 'mirror', before: 'Found before the mirror, it looks like two lies.', after: 'Found after the mirror, it looks like two truths from two different Kairos.' },
    clock:    { other: 'star', before: 'Found before the star, it is only a clock ticking backward.', after: 'Found after the star, it looks like the clock and the star are missing the same kind of piece.' },
    knocks:   { other: 'bird', before: 'Found before the bird, the whisper is a mystery.', after: 'Found after the bird, “You remembered the signal” matches “You came back earlier”.' },
    drawings: { other: 'star', before: 'Found before the star, they look like prophecies.', after: 'Found after the star, they look like notes left by someone who was trying to be recognized.' }
  };
  K.variantText = function (id) {
    var v = K.VARIANTS[id]; if (!v) return null;
    var i = K.order.indexOf(id), j = K.order.indexOf(v.other);
    if (i === -1) return null;
    if (j === -1) return v.before + ' (It may read differently once you find “' + K.clueById[v.other].name + '”.)';
    return i < j ? v.before : v.after;
  };

  K.hasClue = function (id) { return K.found.indexOf(id) !== -1; };
  K.addClue = function (id, quiet) {
    if (!K.clueById[id] || K.hasClue(id)) return false;
    K.found.push(id);
    K.order.push(id); K.store.set('order', K.order);
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
    K.autoConnect();
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
          K.toast('Connected!', K.why(c.id, v));
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
        K.variantText(c.id) ? K.el('p', { class: 'variant', text: K.variantText(c.id) }) : null,
        mine.length
          ? K.el('div', { class: 'conn yes' }, K.el('p', { text: 'Connected to:' }), K.el('ul', { class: 'why' }, mine.map(function (m) { return K.el('li', null, K.el('strong', { text: K.clueById[m].name }), ' — ' + K.why(c.id, m)); })))
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
    K.look = move;
    K.lookAt = function (el) { if (!el || !el.getBoundingClientRect) return; var r = el.getBoundingClientRect(); move(r.left + r.width / 2, r.top + r.height / 2); };
    K.startle = function () { stage.classList.remove('startled'); void stage.offsetWidth; if (K.motionOK()) stage.classList.add('startled'); setTimeout(function () { stage.classList.remove('startled'); }, 800); };
    K.shadowTurn = function (on) { shadow.classList.toggle('turned', !!on); };
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
        K.store.set('egg', true); K.secret('egg');
        K.modal('You have been here before.', [
          K.el('p', { text: 'A note slips out of the lantern. The handwriting is Kairo’s own.' }),
          K.el('p', { class: 'modal-note', text: '“I cannot remember the last time I left this message. If the star is still missing a point, follow the clock that moves backward. The answer is not where the loop begins. It is why I chose to remain.”' }),
          K.el('p', { class: 'small-note', text: 'Hidden note unlocked. Thank you for looking closely.' })
        ]);
      }
    });
  }

  /* ---------- stars canvas: drift with the pointer, turn cold with danger ---------- */
  K.setDanger = function (x) {
    x = Math.max(0, Math.min(1, x)); if (Math.abs(x - K.danger) < 0.001) return;
    K.danger = x; document.documentElement.style.setProperty('--cold', x.toFixed(3));
    document.dispatchEvent(new CustomEvent('kairo:danger', { detail: x }));
  };
  function initStars() {
    var cv = K.$('#stars'), c = cv.getContext('2d'), stars = [], w = 0, h = 0, raf = 0, dpr = 1;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = cv.width = Math.floor(window.innerWidth * dpr); h = cv.height = Math.floor(window.innerHeight * dpr);
      stars = [];
      var count = Math.min(110, Math.floor(window.innerWidth * window.innerHeight / 14000));
      for (var i = 0; i < count; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.3 + .4) * dpr, p: Math.random() * 6.28, s: Math.random() * .02 + .005, z: Math.random() * .9 + .1 });
      draw(0);
    }
    function draw(t) {
      c.clearRect(0, 0, w, h);
      var tw = document.documentElement.getAttribute('data-theme') === 'twilight';
      var warm = tw ? [255, 236, 190] : [255, 243, 207], cold = [150, 210, 255], d = K.danger || 0;
      var rgb = [0, 1, 2].map(function (i) { return Math.round(warm[i] + (cold[i] - warm[i]) * d); }).join(',');
      var p = K.pointer, move = K.motionOK();
      if (move) { p.sx += (p.nx - p.sx) * 0.05; p.sy += (p.ny - p.sy) * 0.05; }
      var ox = move ? -p.sx * 34 * dpr : 0, oy = move ? -p.sy * 24 * dpr : 0;
      stars.forEach(function (s) {
        var a = move ? 0.35 + 0.55 * Math.abs(Math.sin(s.p + t * s.s)) : 0.7;
        c.fillStyle = 'rgba(' + rgb + ',' + a.toFixed(2) + ')';
        var x = ((s.x + ox * s.z) % w + w) % w, y = ((s.y + oy * s.z) % h + h) % h;
        c.beginPath(); c.arc(x, y, s.r, 0, 6.283); c.fill();
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
    document.addEventListener('kairo:danger', function () { if (!raf) draw(0); });
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
        K.el('img', { src: 'assets/expr-' + e[0] + '.jpg', alt: '', width: 256, height: 256, loading: 'lazy' }), e[1]);
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
    var calmBtn = K.$('#tgCalm'); if (calmBtn) calmBtn.addEventListener('click', function () { K.settings.calm = !K.settings.calm; K.store.set('calm', K.settings.calm); K.applySettings(); K.toast(K.settings.calm ? 'Calm mode on' : 'Calm mode off', K.settings.calm ? 'No countdowns and no time pressure anywhere.' : 'Timed moments are back.'); });
    var volEl = K.$('#vol'); if (volEl) volEl.addEventListener('input', function () { K.audio.volume(volEl.value / 100); });
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
      K.found = []; K.conn = {}; K.truth = false; K.order = [];
      K.store.del('found'); K.store.del('conn'); K.store.del('truth'); K.store.del('order');
      K.renderNotebook(); document.dispatchEvent(new CustomEvent('kairo:reset'));
    });

    initStars(); initHero(); initMeet(); K.renderNotebook();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
