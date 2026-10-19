/* tiers.js: mood toggle, flashlight, Lullaby Lab, Dream Delivery route, falling-dreams game, rule-based chat. */
(function () {
  'use strict';
  var E = K.el;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ================= mood toggle: palette AND expression move together ================= */
  var MOOD = { night: ['determined', 'determined (night)'], twilight: ['happy', 'happy (twilight)'] };
  function mood() {
    var m = MOOD[K.settings.theme] || MOOD.night;
    var img = K.$('#moodImg'), txt = K.$('#moodText');
    if (img) img.src = 'assets/expr-' + m[0] + '-sm.jpg';
    if (txt) txt.textContent = 'Kairo feels ' + m[1];
    document.documentElement.setAttribute('data-mood', m[0]);
  }
  var lastTheme = K.settings.theme;
  document.addEventListener('kairo:settings', function () {
    mood();
    if (K.settings.theme !== lastTheme) { lastTheme = K.settings.theme; var m = MOOD[lastTheme]; if (K.say) K.say(lastTheme === 'twilight' ? 'The sky is softer now. I feel lighter.' : 'Back to midnight. I think better in the dark.', m[0], 5000); }
  });

  /* ================= flashlight (global mode) ================= */
  var flashOn = K.store.get('flash', false), fm;
  function flashApply() {
    if (!fm) { fm = E('div', { id: 'flashMask', 'aria-hidden': 'true' }); document.body.appendChild(fm); }
    document.documentElement.classList.toggle('flashlight', flashOn);
    var b = K.$('#tgLight'); if (b) { b.setAttribute('aria-pressed', String(flashOn)); K.$('.tool-label', b).textContent = flashOn ? 'Flashlight on' : 'Flashlight off'; }
  }
  function flashMove(x, y) { if (fm) { fm.style.setProperty('--fx', x + 'px'); fm.style.setProperty('--fy', y + 'px'); } }
  document.addEventListener('pointermove', function (e) { if (flashOn) flashMove(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener('touchmove', function (e) { if (flashOn && e.touches[0]) flashMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  document.addEventListener('touchstart', function (e) { if (flashOn && e.touches[0]) flashMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });

  /* ================= dark dreams (flashlight in a dark panel) ================= */
  var DREAMS = ['a clock that sleeps', 'a door with no wall', 'a bell nobody rings', 'a star missing one point', 'a town that holds its breath', 'a letter from tomorrow', 'a friend you forgot', 'a minute that never ends'];
  var DPOS = [[8, 18], [38, 10], [66, 22], [14, 52], [44, 48], [74, 56], [22, 82], [56, 80]];
  function darkDreams() {
    var box = K.$('#darkDream'); if (!box) return;
    var words = K.$('#ddWords'), mask = K.$('#ddMask'), list = K.$('#ddList'), count = K.$('#ddCount');
    var found = K.flag('dreamsFound') || [];
    DREAMS.forEach(function (d, i) {
      words.appendChild(E('span', { class: 'dd-w' + (found.indexOf(i) !== -1 ? ' got' : ''), style: { left: DPOS[i][0] + '%', top: DPOS[i][1] + '%' } }, d));
      list.appendChild(E('li', { text: d }));
    });
    function upd() { count.textContent = 'Dreams found: ' + found.length + ' of ' + DREAMS.length + (found.length === DREAMS.length ? '. You lit every dream.' : ''); }
    upd();
    function at(cx, cy) {
      var r = box.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
      mask.style.setProperty('--mx', x + 'px'); mask.style.setProperty('--my', y + 'px'); mask.classList.add('live');
      Array.prototype.forEach.call(words.children, function (w, i) {
        var wr = w.getBoundingClientRect(), wx = wr.left + wr.width / 2 - r.left, wy = wr.top + wr.height / 2 - r.top;
        var near = Math.hypot(wx - x, wy - y) < 70;
        if (near && found.indexOf(i) === -1) { found.push(i); w.classList.add('got'); K.setFlag('dreamsFound', found); K.audio.note(520 + i * 70, 0.5, 'sine', 0.06); upd(); if (found.length === DREAMS.length && K.say) K.say('You found every dream hiding in the dark. They were all waiting for light.', 'happy', 7000); }
      });
    }
    box.addEventListener('pointermove', function (e) { at(e.clientX, e.clientY); });
    box.addEventListener('pointerdown', function (e) { at(e.clientX, e.clientY); });
    box.addEventListener('touchmove', function (e) { if (e.touches[0]) { e.preventDefault(); at(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: false });
    box.addEventListener('keydown', function (e) { /* keyboard visitors can sweep the light */
      var r = box.getBoundingClientRect(), cur = box._k || { x: r.width / 2, y: r.height / 2 };
      var d = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] }[e.key]; if (!d) return; e.preventDefault();
      cur = { x: clamp(cur.x + d[0], 0, r.width), y: clamp(cur.y + d[1], 0, r.height) }; box._k = cur; at(r.left + cur.x, r.top + cur.y);
    });
  }

  /* ================= Lullaby Lab ================= */
  var NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51], NAMES = ['C', 'D', 'E', 'G', 'A', 'C', 'D', 'E'], KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
  var SONGS = {
    1: { name: 'Stillhour Lullaby', bpm: 84, seq: [[2, 1], [4, 1], [5, 2], [4, 1], [2, 1], [0, 2], [2, 1], [4, 1], [7, 2], [5, 1], [4, 1], [2, 2], [0, 1], [2, 1], [4, 2], [0, 3]] },
    2: { name: 'Thirteenth Bell', bpm: 72, seq: [[0, 1], [3, 1], [5, 2], [3, 1], [5, 1], [7, 2], [6, 1], [5, 1], [3, 2], [5, 1], [3, 1], [0, 2], [2, 1], [3, 1], [5, 3]] }
  };
  function lullaby() {
    var mb = K.$('#mbox'); if (!mb) return;
    var muted = false, tone = 'box', playing = 0, timers = [], keys = [], recording = false, rec = [], recT0 = 0, status = K.$('#llStatus');
    NOTES.forEach(function (f, i) {
      var b = E('button', { type: 'button', class: 'mkey', 'aria-label': 'Note ' + NAMES[i] + ' (key ' + KEYS[i].toUpperCase() + ')' }, E('span', { text: NAMES[i] }), E('small', { text: KEYS[i].toUpperCase() }));
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); hit(i); });
      b.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hit(i); } });
      mb.appendChild(b); keys.push(b);
    });
    function sound(i) {
      if (muted) return;
      var f = NOTES[i], pan = (i - 3.5) / 5;
      if (tone === 'box') { K.audio.note(f, 1.0, 'triangle', 0.16, 0, pan); K.audio.note(f * 2, 0.45, 'sine', 0.05, 0, pan); }
      else if (tone === 'bell') { K.audio.note(f, 1.8, 'sine', 0.14, 0, pan); K.audio.note(f * 2.76, 1.0, 'sine', 0.05, 0, pan); K.audio.note(f * 5.4, 0.5, 'sine', 0.02, 0, pan); }
      else { K.audio.note(f, 1.3, 'sine', 0.12, 0, pan); K.audio.note(f * 3, 0.6, 'sine', 0.04, 0, pan); }
    }
    function hit(i) {
      keys[i].classList.add('on'); setTimeout(function () { keys[i].classList.remove('on'); }, 220);
      sound(i);
      if (recording) rec.push([i, performance.now() - recT0]);
      K.bump('notes');
    }
    function stop() { timers.forEach(clearTimeout); timers = []; playing = 0; }
    function playSeq(list, label) {
      stop(); playing = 1; var t = 0;
      list.forEach(function (n) { timers.push(setTimeout(function () { hit2(n[0]); }, t)); t += n[1]; });
      timers.push(setTimeout(function () { playing = 0; status.textContent = muted ? 'Finished (muted).' : 'Finished: ' + label; }, t + 400));
      status.textContent = (muted ? 'Playing silently (muted): ' : 'Playing: ') + label;
    }
    function hit2(i) { keys[i].classList.add('on'); setTimeout(function () { keys[i].classList.remove('on'); }, 240); sound(i); }
    function song(n) { var s = SONGS[n], beat = 60000 / s.bpm; playSeq(s.seq.map(function (x) { return [x[0], x[1] * beat * 0.75]; }), s.name); }
    K.$('#llPlay1').addEventListener('click', function () { song(1); });
    K.$('#llPlay2').addEventListener('click', function () { song(2); K.secret && 0; });
    K.$('#llMute').addEventListener('click', function (e) { muted = !muted; e.currentTarget.setAttribute('aria-pressed', String(muted)); e.currentTarget.textContent = muted ? 'Sound: muted' : 'Sound: on'; if (muted) status.textContent = 'Muted. Keys still light up so you can follow along.'; });
    K.$('#llMood').addEventListener('change', function (e) { tone = e.target.value; });
    var recBtn = K.$('#llRec'), playRec = K.$('#llPlayRec');
    recBtn.addEventListener('click', function () {
      if (!recording) { recording = true; rec = []; recT0 = performance.now(); recBtn.textContent = 'Stop recording'; status.textContent = 'Recording. Play some notes.'; }
      else { recording = false; recBtn.textContent = 'Record my tune'; if (rec.length) { playRec.hidden = false; status.textContent = 'Recorded ' + rec.length + ' notes.'; } else status.textContent = 'Nothing recorded.'; }
    });
    playRec.addEventListener('click', function () {
      stop(); rec.forEach(function (n) { timers.push(setTimeout(function () { hit2(n[0]); }, n[1])); });
      status.textContent = 'Playing your tune.';
    });
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test((e.target || {}).tagName || '')) return;
      var i = KEYS.indexOf(e.key.toLowerCase()); if (i === -1) return;
      var r = mb.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;  /* only when the music box is on screen */
      hit(i);
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
  }

  /* ================= Dream Delivery route (SVG path motion synced with scroll) ================= */
  function delivery() {
    var wrap = K.$('#dvWrap'); if (!wrap) return;
    var path = K.$('#dvPath'), draw = K.$('#dvDraw'), lantern = K.$('#dvLantern'), stops = K.$('#dvStops');
    var len = path.getTotalLength(), sc = K.story.scenes, pts = [], els = [];
    var TEXT = { prologue: 'It starts with a lantern whose clock has no hands.', stillhour: 'A town stuck repeating one minute.', workshop: 'Drawings, a missing-point star, and knocks in the wall.', library: 'A book about Kairo that Kairo never read.', mirror: 'A reflection that blinks first.', truth: 'The truth about who is resetting tomorrow.', tower: 'The thirteenth bell, and the choice.', epilogue: 'A doorway made of stars, and a knock from the other side.' };
    sc.forEach(function (s, i) {
      var f = i / (sc.length - 1), pt = path.getPointAtLength(len * f); pts.push(f);
      var g = K.svg('<svg xmlns="http://www.w3.org/2000/svg"><g class="dv-stop" tabindex="0" role="button" aria-label="Stop ' + (i + 1) + ': ' + s.short + '"><circle cx="' + pt.x + '" cy="' + pt.y + '" r="10"/><text x="' + pt.x + '" y="' + (pt.y + 4) + '" text-anchor="middle">' + (i + 1) + '</text></g></svg>');
      var node = g.querySelector('g'); node.addEventListener('click', function () { K.story.go(s.id); });
      node.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); K.story.go(s.id); } });
      stops.appendChild(node); els.push(node);
    });
    draw.style.strokeDasharray = len; var raf = 0, cur = -1;
    function upd() {
      raf = 0;
      var r = wrap.getBoundingClientRect(), span = Math.max(1, r.height - innerHeight * 0.8);
      var p = clamp(-r.top / span + 0.02, 0, 1);
      draw.style.strokeDashoffset = len * (1 - p);
      var pt = path.getPointAtLength(len * p); lantern.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')');
      var idx = 0; pts.forEach(function (f, i) { if (p >= f - 0.001) idx = i; });
      els.forEach(function (e, i) { e.classList.toggle('lit', i <= idx); e.classList.toggle('now', i === idx); });
      if (idx !== cur) {
        cur = idx; var s = sc[idx];
        K.$('#dvKick').textContent = 'Stop ' + (idx + 1) + ' of ' + sc.length; K.$('#dvName').textContent = s.title; K.$('#dvText').textContent = TEXT[s.id] || '';
      }
    }
    function req() { if (!raf) raf = requestAnimationFrame(upd); }
    window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', req); upd();
  }

  /* ================= falling dreams game ================= */
  function game() {
    var cv = K.$('#cgCanvas'); if (!cv) return;
    var g = cv.getContext('2d'), W = cv.width, H = cv.height, btn = K.$('#cgStart'), sc = K.$('#cgScore');
    var st = { run: false, x: W / 2, score: 0, lives: 3, items: [], t: 0, best: K.store.get('cgBest', 0), raf: 0, spawn: 0, last: 0, keys: {} };
    function label() { sc.textContent = 'Score ' + st.score + ' · Lives ' + st.lives + ' · Best ' + st.best; }
    function idle() {
      g.fillStyle = '#0a0f2c'; g.fillRect(0, 0, W, H); g.fillStyle = '#f2c768'; g.font = '20px sans-serif'; g.textAlign = 'center'; g.fillText('Press Start', W / 2, H / 2); drawLantern();
    }
    function drawLantern() { g.fillStyle = '#f2c768'; g.fillRect(st.x - 22, H - 30, 44, 22); g.fillStyle = '#fff1c4'; g.beginPath(); g.arc(st.x, H - 19, 7, 0, 7); g.fill(); }
    function frame(ts) {
      var dt = Math.min(0.05, (ts - st.last) / 1000 || 0.016); st.last = ts; st.t += dt;
      if (st.keys.ArrowLeft) st.x -= 320 * dt; if (st.keys.ArrowRight) st.x += 320 * dt; st.x = clamp(st.x, 24, W - 24);
      st.spawn -= dt; if (st.spawn <= 0) { st.spawn = Math.max(0.35, 0.9 - st.t * 0.01); st.items.push({ x: 20 + Math.random() * (W - 40), y: -10, v: 80 + st.t * 3 + Math.random() * 40, dark: Math.random() < 0.28 }); }
      g.fillStyle = '#0a0f2c'; g.fillRect(0, 0, W, H);
      st.items.forEach(function (it) { it.y += it.v * dt; g.fillStyle = it.dark ? '#7b3fe4' : '#f2c768'; g.beginPath(); g.arc(it.x, it.y, 9, 0, 7); g.fill(); if (it.dark) { g.strokeStyle = '#000'; g.stroke(); } });
      st.items = st.items.filter(function (it) {
        if (it.y > H - 38 && Math.abs(it.x - st.x) < 28 && it.y < H) { if (it.dark) { st.lives--; K.audio.note(160, 0.25, 'square', 0.06); } else { st.score++; K.audio.note(800 + (st.score % 5) * 120, 0.2, 'sine', 0.05); } label(); return false; }
        return it.y < H + 12;
      });
      drawLantern();
      if (st.lives <= 0) { end(); return; }
      st.raf = requestAnimationFrame(frame);
    }
    function end() {
      st.run = false; cancelAnimationFrame(st.raf); if (st.score > st.best) { st.best = st.score; K.store.set('cgBest', st.best); }
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.font = '22px sans-serif'; g.textAlign = 'center'; g.fillText('The dreams fall quiet. Score ' + st.score, W / 2, H / 2);
      btn.textContent = 'Play again'; label(); if (st.score >= 15 && K.say) K.say('Fifteen dreams! You would make a fine dream courier.', 'happy', 6000);
    }
    function start() { st.run = true; st.score = 0; st.lives = 3; st.items = []; st.t = 0; st.spawn = 0.4; st.last = performance.now(); btn.textContent = 'Restart'; label(); cancelAnimationFrame(st.raf); st.raf = requestAnimationFrame(frame); cv.focus({ preventScroll: true }); }
    btn.addEventListener('click', start);
    function setX(cx) { var r = cv.getBoundingClientRect(); st.x = clamp((cx - r.left) / r.width * W, 24, W - 24); if (!st.run) idle(); }
    cv.addEventListener('pointermove', function (e) { setX(e.clientX); });
    cv.addEventListener('touchmove', function (e) { e.preventDefault(); setX(e.touches[0].clientX); }, { passive: false });
    cv.addEventListener('keydown', function (e) { if (e.key.indexOf('Arrow') === 0) { e.preventDefault(); st.keys[e.key] = true; } });
    cv.addEventListener('keyup', function (e) { st.keys[e.key] = false; });
    document.addEventListener('visibilitychange', function () { if (document.hidden && st.run) { st.run = false; cancelAnimationFrame(st.raf); btn.textContent = 'Resume'; } });
    btn.addEventListener('click', function () { }); idle(); label();
  }

  /* ================= chat: rule-based, in Kairo's voice (no AI, no server) ================= */
  var HINT_ORDER = ['clock', 'bell13', 'vanish', 'bird', 'drawings', 'star', 'knocks', 'book', 'warnings', 'mirror', 'darkeyes'];
  function nextHint() {
    for (var i = 0; i < HINT_ORDER.length; i++) { var c = K.clueById[HINT_ORDER[i]]; if (c && !K.hasClue(c.id)) return 'Try “' + c.where + '”. Look for ' + c.name.toLowerCase() + '.'; }
    return 'You have found every clue I know about. Open the notebook and connect them, or look for the secrets.';
  }
  var RULES = [
    { k: /\b(hi|hello|hey|hola|namaste)\b/, a: function (n) { return ['Hello' + n + '. You found me, or I found you. Hard to tell in Stillhour.', 'happy']; } },
    { k: /my name is ([a-z]{2,16})|i am called ([a-z]{2,16})|call me ([a-z]{2,16})/, a: function (n, m) { var nm = (m[1] || m[2] || m[3]); nm = nm[0].toUpperCase() + nm.slice(1); K.store.set('visitorName', nm); return ['I will remember that, ' + nm + '. Memory is precious where I come from.', 'happy']; } },
    { k: /who are you|what are you|your name|about you|introduce/, a: function () { return ['I am Kairo, the last dream wanderer of Veyling. I carry a lantern whose clock has no hands, and I am trying to find out who is resetting tomorrow.', 'curious']; } },
    { k: /lantern|clock/, a: function () { return [K.hasClue('clock') ? 'The clock ticks backward, and it has twelve marks. It should have thirteen.' : 'My lantern holds a clock with no hands. Press it in the Prologue and it will tell you something.', 'thoughtful']; } },
    { k: /star|missing point/, a: function () { return [K.hasSecret('egg') ? 'You found the note beside the star. It is missing a point on purpose.' : 'A small star with one point missing. It is on my lantern. It appears in places it should not. I think it is a signature.', 'thoughtful']; } },
    { k: /bell|thirteen/, a: function () { return [K.story.state.free ? 'It rang. Tomorrow exists now. Thank you.' : 'The thirteenth bell. Everyone warns me not to ring it. I have never been sure that is the right thing to obey.', 'determined']; } },
    { k: /mirror|reflection|lie|lying/, a: function () { return [K.flag('mirrorLies') ? 'You saw it too. It blinks before I do. That is not me.' : 'Beneath the archive there is a mirror. Be careful. Watch who blinks first.', 'surprised']; } },
    { k: /shadow/, a: function () { return [K.hasSecret('shadow') ? 'You turned it around. It never wanted to face me.' : 'Look at my shadow on the first page. It moves before I do.', 'surprised']; } },
    { k: /stillhour|town|loop|repeat/, a: function () { return ['Stillhour lives one minute again and again. Nobody there knows. I am the only one who remembers, and even I forget.', 'sad']; } },
    { k: /who.*(reset|resetting)|tomorrow|villain|clockmaker|culprit/, a: function () { return [K.truth || K.story.state.free ? 'It was never one villain. A friend’s dream held the loop together, and I kept resetting it out of love. Nobody holds the whole truth.' : 'I do not know yet. Someone is resetting tomorrow. Some warnings say trust the clockmaker. Others say never. Collect the clues and decide for yourself.', 'thoughtful']; } },
    { k: /hint|help|stuck|what (do|should) i|where.*(go|next)|clue/, a: function () { return [nextHint(), 'curious']; } },
    { k: /trust|alone|friend/, a: function () { var t = K.story.state.trust; return [t === 'trust' ? 'You trusted the other me. I hope it was not a mistake.' : t === 'alone' ? 'You went alone, on the evidence. I respect that.' : 'Whom to trust is the whole mystery. The mirror will ask you.', 'thoughtful']; } },
    { k: /sad|lonely|tired|scared|afraid|alone/, a: function () { return ['Me too, sometimes. The ticking helps. If you are carrying something heavy in real life, please tell someone you trust. I am only a lantern and a few rules.', 'sad']; } },
    { k: /how are you|how.*feel|you ok/, a: function () { var s = K.settings.theme; return [s === 'twilight' ? 'Lighter than usual. Twilight does that.' : 'Awake. Midnight suits me.', s === 'twilight' ? 'happy' : 'determined']; } },
    { k: /thank|thanks/, a: function () { return ['You are welcome. Come back whenever the clock runs out.', 'happy']; } },
    { k: /joke|funny|laugh/, a: function () { return ['Why did the clockmaker go to bed early? Tomorrow was running a little late.', 'happy']; } },
    { k: /secret|easter egg/, a: function () { return ['There are ' + K.SECRETS.length + ' secrets here. You have found ' + Object.keys(K.secrets).length + '. I cannot say more, except that backs of things are worth turning over.', 'curious']; } },
    { k: /bye|goodbye|see you/, a: function () { return ['Leave the lantern lit. I will be here, or I will have forgotten that I was.', 'sad']; } }
  ];
  function chat() {
    var log = K.$('#chatLog'); if (!log) return;
    var form = K.$('#chatForm'), inp = K.$('#chatIn'), chips = K.$('#chatChips');
    function add(who, text) { var d = E('div', { class: 'msg ' + who }, E('span', { class: 'who', text: who === 'k' ? 'Kairo' : 'You' }), E('span', { text: ' ' + text })); log.appendChild(d); log.scrollTop = log.scrollHeight; }
    function answer(q) {
      var t = q.toLowerCase(), name = K.store.get('visitorName', ''), nm = name ? ', ' + name : '';
      for (var i = 0; i < RULES.length; i++) { var m = RULES[i].k.exec(t); if (m) { var r = RULES[i].a(nm, m); return r; } }
      return ['I am not sure I understood. I run on rules, not magic. Try asking about the lantern, the bell, the mirror, the loop, or ask me for a hint.', 'curious'];
    }
    function send(q) {
      q = (q || '').replace(/\s+/g, ' ').trim(); if (!q) return; add('u', q);
      var r = answer(q);
      setTimeout(function () { add('k', r[0]); if (K.say) K.say(r[0].length > 90 ? r[0].slice(0, 87) + '…' : r[0], r[1], 4500); }, K.motionOK() ? 350 : 0);
      K.bump('chats');
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = inp.value; inp.value = ''; send(v); });
    ['Who are you?', 'What is the lantern?', 'Who is resetting tomorrow?', 'Give me a hint', 'Tell me a joke'].forEach(function (c) { var b = E('button', { type: 'button', class: 'chip' }, c); b.addEventListener('click', function () { send(c); }); chips.appendChild(b); });
    var n = K.store.get('visitorName', '');
    add('k', 'Hello' + (n ? ', ' + n : '') + '. Ask me anything about Stillhour. I will not spoil what you have not earned.');
    if (K.say) { var face = K.$('#compFace'); if (face) face.addEventListener('dblclick', function () { var c = K.$('#chat'); if (c) c.scrollIntoView({ behavior: K.motionOK() ? 'smooth' : 'auto' }); }); }
  }

  function boot() {
    mood(); flashApply();
    var t = K.$('#tgLight'); if (t) t.addEventListener('click', function () { flashOn = !flashOn; K.store.set('flash', flashOn); flashApply(); K.toast(flashOn ? 'Flashlight on' : 'Flashlight off', flashOn ? 'The page is dark. Your pointer or finger is the light.' : 'Lights are back.'); });
    darkDreams(); lullaby(); game(); chat(); if (K.story && K.story.scenes) delivery();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
