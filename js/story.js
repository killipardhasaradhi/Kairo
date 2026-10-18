/* story.js: the eight story scenes, clue hotspots, trust choice, final choice */
(function () {
  'use strict';
  var E = K.el;
  var state = {
    idx: 0,
    trust: K.store.get('trust', null),     /* 'trust' | 'alone' | null */
    free: K.store.get('free', false),      /* canonical ending reached */
    resets: 0,                             /* times the alternate ending was chosen */
    visited: K.store.get('visited', {})
  };
  var cleanup = null;
  K.story = { state: state, go: null, isFree: function () { return state.free; } };

  var SCENES = [
    { id: 'prologue',  short: 'Prologue',   kicker: 'Prologue',  title: 'The message inside the lantern', bg: 'assets/kairo-bg.jpg',     build: prologue,  next: 'Follow the ticking to Stillhour' },
    { id: 'stillhour', short: 'Stillhour',  kicker: 'Chapter 1', title: 'The town that repeats',           bg: 'assets/loc-stillhour.jpg', build: stillhour, next: 'Follow the bird to the workshop' },
    { id: 'workshop',  short: 'Workshop',   kicker: 'Chapter 1', title: 'The clockmaker’s workshop',  bg: 'assets/loc-stillhour.jpg', build: workshop,  next: 'Search for the Library of Unwritten Days' },
    { id: 'library',   short: 'Library',    kicker: 'Chapter 2', title: 'The Library of Unwritten Days',   bg: 'assets/loc-archive.jpg',   build: library,   next: 'Go beneath the archive' },
    { id: 'mirror',    short: 'Mirror',     kicker: 'Chapter 3', title: 'The stranger in the mirror',      bg: 'assets/loc-mirror.jpg',    build: mirror,    next: 'Learn the truth about the loop' },
    { id: 'truth',     short: 'The truth',  kicker: 'Chapter 4', title: 'The truth about the loop',        bg: 'assets/loc-tower.jpg',     build: truth,     next: 'Climb the clock tower' },
    { id: 'tower',     short: 'Clock Tower', kicker: 'Chapter 5', title: 'The choice that breaks tomorrow', bg: 'assets/loc-tower.jpg',    build: tower,     next: 'See what happens next' },
    { id: 'epilogue',  short: 'Epilogue',   kicker: 'Epilogue',  title: 'The knock from the other side',   bg: 'assets/hero.jpg',          build: epilogue,  next: null }
  ];
  var BY_ID = {}; SCENES.forEach(function (s, i) { BY_ID[s.id] = i; });

  /* plain-language "what to do here" help for every scene, plus which clues live there */
  var HELP = {
    prologue:  { todo: 'Tap the glowing clock in the picture to read the message. Then tap “Look up at the night sky”.', clues: ['clock', 'bell13', 'vanish'] },
    stillhour: { todo: 'Watch the minute repeat. Press “Next loop” two or three times until a paper bird lands, then tap the bird.', clues: ['bird'] },
    workshop:  { todo: 'Tap each drawing. Tap the small star in a drawing’s corner. Then press “Listen at the wall”.', clues: ['drawings', 'star', 'knocks'] },
    library:   { todo: 'Press “Open KAIRO — FINAL LOOP”, then “Next page” until you reach the last page.', clues: ['book', 'warnings', 'star'] },
    mirror:    { todo: 'Press “Step closer to the mirror”, then “Keep watching”. Read the lines, then choose who to trust.', clues: ['mirror', 'darkeyes'] },
    truth:     { todo: 'Press “Next” to read each step of the truth. At the end press “Connect the clues”.', clues: [] },
    tower:     { todo: 'Choose what Kairo does. You can pick “Reset the clock” first to see that ending, then return and choose again.', clues: [] },
    epilogue:  { todo: 'Tap the doorway made of stars and listen.', clues: [] }
  };

  /* ---------- shared bits ---------- */
  function bigClock(mode) {
    var n = mode === 'fwd' ? 13 : 12, s = '', i, a, x1, y1, x2, y2;
    for (i = 0; i < n; i++) {
      a = i * 2 * Math.PI / n;
      x1 = 100 + Math.sin(a) * 66; y1 = 100 - Math.cos(a) * 66; x2 = 100 + Math.sin(a) * 80; y2 = 100 - Math.cos(a) * 80;
      s += '<line class="tk' + (mode === 'fwd' && i === n - 1 ? ' tk13' : '') + '" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
    }
    var label = mode === 'fwd'
      ? 'The lantern clock now has thirteen marks and ticks forward.'
      : 'The lantern clock has no hands. Its marker ticks backward.';
    return K.svg('<svg class="big-clock ' + (mode === 'fwd' ? 'fwd' : 'back') + '" viewBox="0 0 200 200" role="img" aria-label="' + label + '">' +
      '<circle class="rim" cx="100" cy="100" r="92"/><circle class="face" cx="100" cy="100" r="86"/>' + s +
      '<g class="spin"><circle class="pip" cx="100" cy="38" r="7"/></g><circle cx="100" cy="100" r="5" fill="#b98a22"/></svg>');
  }
  function clueButton(id, label, onClick) {
    var b = E('button', { type: 'button', class: 'clue-btn' + (K.hasClue(id) ? ' found' : '') }, label);
    b.addEventListener('click', function () { K.addClue(id); b.classList.add('found'); if (onClick) onClick(b); });
    return b;
  }
  function msgCard(text) { return E('div', { class: 'msg-card', role: 'note' }, text); }

  /* ---------- Prologue ---------- */
  function prologue(stage, say) {
    say('Kairo is a Veyling, a being born between two moments in time, who wanders through forgotten dreams and broken timelines.');
    say('Tonight, the clock inside the lantern is ticking backward.');
    var out = E('div', { class: 'row' });
    var clockBtn = E('button', { type: 'button', class: 'clock-btn', 'aria-label': 'Examine the lantern clock' }, bigClock('back'));
    var hint = E('p', { class: 'small-note', text: 'Tap the lantern clock to look inside.' });
    var skyHolder = E('div');
    stage.appendChild(clockBtn); stage.appendChild(hint); stage.appendChild(out); stage.appendChild(skyHolder);

    var read = false;
    function showSky() {
      var sky = E('div', { class: 'sky' });
      [[12, 18], [32, 40], [58, 14], [76, 44], [88, 20]].forEach(function (p, i) {
        if (i === 2) return;
        sky.appendChild(E('span', { class: 'st', 'aria-hidden': 'true', style: { left: p[0] + '%', top: p[1] + 'px', 'animation-delay': (i * .5) + 's' }, text: '✦' }));
      });
      var target = E('span', { class: 'st', 'aria-hidden': 'true', style: { left: '58%', top: '14px' }, text: '★' });
      sky.appendChild(target);
      var b = E('button', { type: 'button', class: 'clue-btn' + (K.hasClue('vanish') ? ' found' : '') }, 'Look up at the night sky');
      b.addEventListener('click', function () {
        target.classList.add('vanish'); b.classList.add('found'); b.disabled = true;
        setTimeout(function () { if (!sky.querySelector('.gone')) sky.appendChild(E('span', { class: 'gone', style: { left: '58%', top: '20px' }, text: '(a star was here)' })); }, K.motionOK() ? 1300 : 0);
        K.addClue('vanish');
        say('A star disappears from the sky. The lantern ticks backward again, and for a moment Kairo feels that this has all happened before.');
      });
      skyHolder.appendChild(sky); skyHolder.appendChild(E('div', { style: { 'margin-top': '.6rem' } }, b));
    }
    clockBtn.addEventListener('click', function () {
      K.addClue('clock');
      if (read) return; read = true; hint.textContent = '';
      out.appendChild(msgCard('“If you are reading this, you have already made the wrong choice. Do not ring the thirteenth bell. — Kairo.”'));
      say('The handwriting is Kairo’s own. Kairo does not remember writing it.');
      setTimeout(function () { K.addClue('bell13'); showSky(); }, K.motionOK() ? 900 : 0);
    });
  }

  /* ---------- Chapter 1: Stillhour ---------- */
  function stillhour(stage, say, ctx) {
    if (state.free) {
      say('The minute no longer repeats. A door closes once. The candle burns down. The bell finishes ringing.');
      say('Stillhour has a tomorrow.');
      stage.appendChild(E('p', { class: 'final-msg', text: 'Tomorrow arrived.' }));
      return;
    }
    say('Following the backward ticking, Kairo reaches Stillhour. Every night, the same sixty seconds repeat.');
    say('Watch closely. (Shown here in about eight seconds per loop.)');
    var tick = 0, loop = 1, timer = null, birdShown = false;
    var ringLen = 2 * Math.PI * 50;
    var ring = K.svg('<svg class="minute-ring" viewBox="0 0 120 120" role="img" aria-label="Progress through the repeating minute"><circle class="bg" cx="60" cy="60" r="50"/><circle class="fg" cx="60" cy="60" r="50" stroke-dasharray="' + ringLen.toFixed(1) + '" stroke-dashoffset="' + ringLen.toFixed(1) + '"/><text x="60" y="70">1:00</text></svg>');
    var fg = ring.querySelector('.fg'), txt = ring.querySelector('text');
    var evts = {
      door: E('li', null, 'A door slams'), candle: E('li', null, 'A candle flickers'),
      bell: E('li', null, 'A distant bell begins to ring'), reset: E('li', null, 'Everything resets')
    };
    var list = E('ul', { class: 'evts', 'aria-label': 'Events in the repeating minute' }, [evts.door, evts.candle, evts.bell, evts.reset]);
    var loopLine = E('p', { class: 'loop-line', 'aria-live': 'polite', text: 'Loop 1: waiting…' });
    var birdRow = E('div', { class: 'row' });
    var playBtn = E('button', { type: 'button', class: 'btn small ghost', 'aria-pressed': 'false' }, 'Pause');
    var stepBtn = E('button', { type: 'button', class: 'btn small ghost' }, 'Step');
    var nextBtn = E('button', { type: 'button', class: 'btn small ghost' }, 'Next loop');
    stage.appendChild(E('div', { class: 'minute' }, ring, list, loopLine));
    stage.appendChild(birdRow);
    stage.appendChild(E('div', { class: 'row' }, playBtn, stepBtn, nextBtn));

    function light(k) {
      Object.keys(evts).forEach(function (n) { evts[n].classList.toggle('on', n === k); });
    }
    function paint(msg, k) {
      fg.style.strokeDashoffset = (ringLen * (1 - tick / 8)).toFixed(1);
      var sec = Math.max(0, Math.round(60 - tick * 7.5));
      txt.textContent = '0:' + (sec < 10 ? '0' : '') + sec;
      if (msg) loopLine.textContent = 'Loop ' + loop + ': ' + msg;
      light(k || null);
    }
    function showBird() {
      if (birdShown) return; birdShown = true;
      var b = clueButton('bird', 'A paper bird lands. Read it.', function (btn) {
        btn.disabled = true;
        birdRow.appendChild(msgCard('“You came back earlier this time.”'));
        say('Came back? Earlier? Kairo has never knowingly visited Stillhour.');
      });
      birdRow.appendChild(b);
    }
    function advance() {
      tick++;
      if (tick > 8) { tick = 1; loop++; }
      K.sound.play('tick');
      if (tick === 1) paint('A door slams.', 'door');
      else if (tick === 3) paint('A candle flickers.', 'candle');
      else if (tick === 4 && loop >= 3) { paint('A small paper bird appears. It was not in the first loops.', null); evts.candle.classList.add('odd'); showBird(); }
      else if (tick === 5) paint('A distant bell begins to ring.', 'bell');
      else if (tick === 7) paint('Everything resets.', 'reset');
      else paint(null, null);
      if (loop >= 3 && tick >= 4) showBird();
    }
    function setPlaying(on) {
      clearInterval(timer); timer = null;
      playBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); playBtn.textContent = on ? 'Pause' : 'Play';
      if (on) timer = setInterval(advance, 1000);
    }
    playBtn.addEventListener('click', function () { setPlaying(!timer); });
    stepBtn.addEventListener('click', function () { setPlaying(false); advance(); });
    nextBtn.addEventListener('click', function () { setPlaying(false); var l = loop; var guard = 0; do { advance(); guard++; } while (!(loop > l && tick === 1) && guard < 20); });
    setPlaying(K.motionOK());
    if (!K.motionOK()) { loopLine.textContent = 'Press Step or Next loop to move through the minute.'; }
    ctx.onLeave(function () { clearInterval(timer); });
  }

  /* ---------- Chapter 1b: workshop ---------- */
  var SKETCHES = [
    { cap: 'a tower', say: 'A clock tower drawn from below. Kairo has not been there yet.',
      svg: '<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M38 72V24l12-16 12 16v48z M44 30h12v12H44z M50 36v-4 M50 36h3 M34 72h32" fill="none" stroke="#2b2210" stroke-width="1.6" stroke-linejoin="round"/></svg>' },
    { cap: 'a mirror', say: 'A room with one tall mirror, and two figures standing in it.',
      svg: '<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M34 74V30a16 16 0 0 1 32 0v44z M44 66l4-20 M56 66l-4-20" fill="none" stroke="#2b2210" stroke-width="1.6" stroke-linejoin="round"/><circle cx="46" cy="42" r="3" fill="none" stroke="#2b2210" stroke-width="1.4"/><circle cx="55" cy="42" r="3" fill="none" stroke="#2b2210" stroke-width="1.4"/></svg>' },
    { cap: 'a lantern', say: 'A lantern held up in the dark by someone who looks a great deal like Kairo.',
      svg: '<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M42 20h16 M46 14h8 M40 22h20l4 10v26l-6 8H42l-6-8V32z" fill="none" stroke="#2b2210" stroke-width="1.6" stroke-linejoin="round"/><circle cx="50" cy="46" r="8" fill="none" stroke="#2b2210" stroke-width="1.5"/></svg>' }
  ];
  function starSvg(r) { return K.svg('<svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="' + K.missingStarPath(r) + '"/></svg>'); }

  function workshop(stage, say) {
    say('The clockmaker’s workshop is full of gears and broken clocks. Someone was here recently.');
    say('Drawings are pinned to the walls. They show things that have not happened yet.');
    var wrap = E('div', { class: 'drawings' });
    var pins = [];
    function lightStars() { pins.forEach(function (p) { p.classList.add('lit'); }); }
    SKETCHES.forEach(function (sk, i) {
      var card = E('button', { type: 'button', class: 'drawing', style: { '--r': (i - 1) * 1.6 + 'deg' }, 'aria-label': 'Inspect the drawing of ' + sk.cap }, K.svg(sk.svg), E('span', { class: 'cap', text: sk.cap }));
      var pin = E('button', { type: 'button', class: 'star-pin' + (K.hasClue('star') ? ' lit' : ''), 'aria-label': 'Look closely at the star in the corner of the drawing of ' + sk.cap }, starSvg(9));
      pins.push(pin);
      card.addEventListener('click', function () {
        K.$$('.drawing', wrap).forEach(function (d) { d.classList.remove('active'); }); card.classList.add('active');
        K.addClue('drawings'); say(sk.say);
      });
      pin.addEventListener('click', function () {
        lightStars(); K.addClue('star');
        say('Every drawing carries the same mark: a star with one missing point. Kairo’s lantern has one too.');
      });
      wrap.appendChild(E('div', { class: 'drawing-wrap' }, card, pin));
    });
    if (K.hasClue('star')) lightStars();

    var knocks = E('div', { class: 'knocks', 'aria-live': 'polite' });
    var whisper = E('p', { class: 'whisper', 'aria-live': 'polite' });
    var listenBtn = E('button', { type: 'button', class: 'clue-btn' + (K.hasClue('knocks') ? ' found' : '') }, 'Listen at the wall');
    listenBtn.addEventListener('click', function () {
      K.sound.play('knock'); K.clear(knocks); K.clear(whisper);
      ['Knock.', 'Knock.', 'Knock.'].forEach(function (t, i) { setTimeout(function () { knocks.appendChild(E('span', { text: t + ' ' })); }, K.motionOK() ? i * 450 : 0); });
      setTimeout(function () { whisper.textContent = '“You remembered the signal.”'; K.addClue('knocks'); listenBtn.classList.add('found'); }, K.motionOK() ? 1700 : 0);
    });
    stage.appendChild(wrap);
    stage.appendChild(E('div', { class: 'wall' }, E('p', { class: 'small-note', text: 'Behind the far wall, something is tapping.' }), listenBtn, knocks, whisper));
    say('Is the clockmaker hiding something? Kairo is not sure yet.');
  }

  /* ---------- Chapter 2: library ---------- */
  function library(stage, say) {
    say('Beyond the workshop is a hidden archive of books about days that have not happened, or that nobody remembers living.');
    var shelves = E('div', { class: 'bookshelf', 'aria-hidden': 'true' });
    var cols = ['#3b3a8a', '#6a3d8f', '#2c6a8a', '#8a5a2c', '#3b6a5a', '#7a2c4a'];
    for (var s = 0; s < 2; s++) {
      var shelf = E('div', { class: 'shelf' });
      for (var b = 0; b < 22; b++) shelf.appendChild(E('i', { style: { '--c': cols[(b * 5 + s * 3) % cols.length], '--h': (34 + ((b * 7 + s * 11) % 22)) + 'px' } }));
      shelves.appendChild(shelf);
    }
    var holder = E('div', { class: 'final-book' });
    stage.appendChild(shelves); stage.appendChild(holder);

    var pages = [
      { h: 'KAIRO — FINAL LOOP', t: 'A book about Kairo that Kairo has never read.' },
      { t: '“Trust the clockmaker.”' },
      { t: '“Never trust him.”' },
      { star: true, t: 'The same mark. Again.' },
      { t: '“If you have reached this page, I have failed to stop you.”' }
    ];
    var seen = {};
    var openBtn = E('button', { type: 'button', class: 'clue-btn' + (K.hasClue('book') ? ' found' : '') }, 'Open “KAIRO — FINAL LOOP”');
    holder.appendChild(openBtn);
    openBtn.addEventListener('click', function () {
      K.addClue('book');
      openBtn.hidden = true;
      var pg = 0, body = E('div', { class: 'book', tabindex: '0', role: 'group', 'aria-label': 'The book KAIRO Final Loop', 'aria-live': 'polite' });
      var no = E('span', { class: 'pgno' });
      var prev = E('button', { type: 'button', class: 'btn small ghost' }, 'Previous page');
      var nxt = E('button', { type: 'button', class: 'btn small' }, 'Next page');
      var close = E('button', { type: 'button', class: 'btn small ghost' }, 'Close book');
      function draw() {
        K.clear(body); var p = pages[pg];
        var inner = E('div', null, p.h ? E('p', { class: 'pg-h', text: p.h }) : null, p.star ? starSvg(10) : null, E('p', { class: 'pg-t', text: p.t }));
        body.appendChild(inner);
        no.textContent = 'Page ' + (pg + 1) + ' of ' + pages.length;
        prev.disabled = pg === 0; nxt.disabled = pg === pages.length - 1;
        var first = !seen[pg];
        seen[pg] = true;
        if (seen[1] && seen[2]) { if (K.addClue('warnings')) say('Two warnings, both in Kairo’s handwriting, and they cannot both be true.'); }
        if (p.star) { if (K.addClue('star')) say('The missing-point star again. It is on the lantern, in the drawings, and now here.'); }
        if (first && pg === pages.length - 1) say('Someone has reached this page before. That someone may have been Kairo.');
      }
      prev.addEventListener('click', function () { if (pg > 0) { pg--; draw(); } });
      nxt.addEventListener('click', function () { if (pg < pages.length - 1) { pg++; draw(); } });
      close.addEventListener('click', function () { K.clear(holder); openBtn.hidden = false; holder.appendChild(openBtn); openBtn.focus(); });
      body.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); nxt.click(); } else if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
      });
      holder.appendChild(body);
      holder.appendChild(E('div', { class: 'book-ctl' }, prev, no, nxt, close));
      draw(); body.focus();
    });
  }

  /* ---------- Chapter 3: mirror ---------- */
  function mirror(stage, say) {
    say('Beneath the archive is a locked room with a single mirror.');
    var wrap = E('div', { class: 'mirror-wrap' });
    var mir = E('div', { class: 'mirror', role: 'img', 'aria-label': 'A tall mirror showing Kairo’s reflection' }, E('img', { src: 'assets/kairo-clean.jpg', alt: '' }));
    var figure = E('div');
    var dlg = E('div', { class: 'dialogue', 'aria-live': 'polite', hidden: true });
    var ctl = E('div', { class: 'row' });
    wrap.appendChild(mir); wrap.appendChild(figure);
    stage.appendChild(wrap); stage.appendChild(dlg); stage.appendChild(ctl);

    var LINES = [
      '“You are not the first Kairo to reach this room.”',
      '“You have tried this before. Every attempt ends in the same town.”',
      '“The warnings were meant to stop the loop. Some of them also feed it.”',
      '“If I tell you the truth too early, you’ll make the same choice again.”'
    ];
    function dialogue(who, text) {
      dlg.hidden = false; K.clear(dlg);
      dlg.appendChild(E('p', { class: 'who', text: who })); dlg.appendChild(E('p', { class: 'say', text: text }));
    }
    function btn(label, fn, ghost) {
      K.clear(ctl);
      var b = E('button', { type: 'button', class: 'btn small' + (ghost ? ' ghost' : '') }, label);
      b.addEventListener('click', fn); ctl.appendChild(b); b.focus({ preventScroll: true });
    }
    function showChoice() {
      K.clear(ctl);
      dialogue('Kairo', 'Should I trust this exhausted version of myself, or keep following the evidence alone?');
      var a = E('button', { type: 'button', class: 'choice' }, E('strong', { text: 'Trust the other Kairo' }), E('span', { text: 'Listen to the stranger’s fragments of memory.' }));
      var b = E('button', { type: 'button', class: 'choice' }, E('strong', { text: 'Continue alone' }), E('span', { text: 'Rely on what Stillhour, the workshop, and the library show.' }));
      var wrapC = E('div', { class: 'choices' }, a, b); ctl.appendChild(wrapC); a.focus({ preventScroll: true });
      function pick(v) {
        state.trust = v; K.store.set('trust', v); K.clear(ctl);
        if (v === 'trust') {
          dialogue('Another Kairo', '“Then listen. Look at the star on your lantern, and do not go to the tower before you know why it is there. I only have fragments. Nobody holds the whole truth.”');
          K.toast('You chose to trust the other Kairo', 'The story will remember the mirror first.');
        } else {
          dialogue('Another Kairo', '“Then follow the evidence. You always do. I have never managed to stop you, and I only have fragments of the truth anyway.”');
          K.toast('You chose to continue alone', 'The story will start from the evidence.');
        }
        say('The stranger is not simply an enemy or a guide. The stranger is what Kairo might become.');
      }
      a.addEventListener('click', function () { pick('trust'); });
      b.addEventListener('click', function () { pick('alone'); });
    }
    function lineLoop(i) {
      dialogue('Another Kairo', LINES[i]);
      if (i < LINES.length - 1) btn('Next', function () { lineLoop(i + 1); });
      else btn('Decide', showChoice);
    }
    btn('Step closer to the mirror', function () {
      mir.classList.add('move'); K.addClue('mirror');
      say('The reflection turns its head. Kairo did not. The reflection’s eyes are darker.');
      btn('Keep watching', function () {
        K.clear(figure);
        figure.appendChild(E('img', { class: 'future', src: 'assets/shadow.jpg', alt: 'A dark silhouette of another Kairo, tired, with faintly glowing violet eyes', width: 212, height: 254 }));
        K.addClue('darkeyes');
        say('Another Kairo steps out of the mirror. This one looks exhausted.');
        lineLoop(0);
      });
    });
    if (state.trust) say(state.trust === 'trust' ? 'Last time, you chose to trust the other Kairo.' : 'Last time, you chose to continue alone.');
  }

  /* ---------- Chapter 4: truth ---------- */
  var ORDER_TRUST = ['mirror', 'darkeyes', 'warnings', 'book', 'star', 'drawings', 'bird', 'knocks', 'clock', 'vanish', 'bell13'];
  var ORDER_ALONE = ['drawings', 'star', 'knocks', 'bird', 'book', 'warnings', 'mirror', 'darkeyes', 'clock', 'vanish', 'bell13'];
  function truth(stage, say) {
    var voice = state.trust === 'trust' ? 'The other Kairo remembers' : state.trust === 'alone' ? 'The evidence says' : 'The pieces fit together';
    var STEPS = [
      'Long ago, Kairo tried to open the thirteenth minute to save a friend whose dream was disappearing.',
      'The attempt broke time. Whole worlds were in danger.',
      'The clockmaker built a mechanism to contain the damage. It needed one living memory to hold the repeating world together.',
      'Kairo volunteered.',
      'Every reset erased more of Kairo’s memory. Only warnings, drawings, books, and one star survived.',
      'The dark-eyed Kairo is not evil, only frightened. The clockmaker is not the villain. Kairo has been both the prisoner and the keeper of the prison.'
    ];
    say('Kairo finally understands what happened. This is the order ' + (state.trust === 'trust' ? 'the other Kairo tells it' : state.trust === 'alone' ? 'the evidence points to it' : 'it comes together') + '.');
    var i = 0;
    var card = E('div', { class: 'truth-card', 'aria-live': 'polite' });
    var ctl = E('div', { class: 'row' });
    var chain = E('ul', { class: 'chain', 'aria-label': 'Clues in the order they matter, found ones are checked' });
    (state.trust === 'trust' ? ORDER_TRUST : ORDER_ALONE).forEach(function (id) {
      chain.appendChild(E('li', { class: K.hasClue(id) ? 'have' : '', text: K.clueById[id].name }));
    });
    function draw() {
      K.clear(card);
      card.appendChild(E('p', { class: 'n', text: voice + ' (' + (i + 1) + ' of ' + STEPS.length + ')' }));
      card.appendChild(E('p', { class: 't', text: STEPS[i] }));
      K.clear(ctl);
      if (i < STEPS.length - 1) {
        var n = E('button', { type: 'button', class: 'btn small' }, 'Next');
        n.addEventListener('click', function () { i++; draw(); }); ctl.appendChild(n); n.focus({ preventScroll: true });
      } else {
        var c = E('button', { type: 'button', class: 'btn small' }, 'Connect the clues');
        c.addEventListener('click', function () {
          var made = 0;
          K.found.forEach(function (a) { K.clueById[a].links.forEach(function (b) { if (K.hasClue(b) && (K.conn[a] || []).indexOf(b) === -1) { K.connect(a, b); made++; } }); });
          K.revealTruth(); c.disabled = true;
          K.toast('The clues fit together', made + ' new connection' + (made === 1 ? '' : 's') + '. Your notebook now shows what each clue meant.');
          say('The warnings contradict each other because they come from different attempts, by versions of Kairo who no longer remember the same things.');
          say('The notebook has been updated.');
        });
        ctl.appendChild(c); c.focus({ preventScroll: true });
        ctl.appendChild(E('a', { class: 'btn small ghost', href: '#notebook' }, 'Open the notebook'));
      }
    }
    stage.appendChild(card); stage.appendChild(ctl);
    stage.appendChild(E('p', { class: 'small-note', text: 'Clues you gathered (it is fine if some are missing):' }));
    stage.appendChild(chain);
    draw();
  }

  /* ---------- Chapter 5: clock tower ---------- */
  function bellSvg() {
    return K.svg('<svg class="bell-svg" viewBox="0 0 120 120" role="img" aria-label="The thirteenth bell"><path class="body" d="M60 14c-18 0-30 14-30 34v26l-10 14h80l-10-14V48c0-20-12-34-30-34z"/><circle cx="60" cy="98" r="8" fill="#fff1c4"/><circle cx="60" cy="10" r="4" fill="#fff1c4"/></svg>');
  }
  function marks(done) {
    var m = E('div', { class: 'marks' + (done ? ' done' : ''), role: 'img', 'aria-label': 'Twelve marks lit, the thirteenth ' + (done ? 'now lit' : 'still dark') });
    for (var i = 0; i < 13; i++) m.appendChild(E('i'));
    return m;
  }
  function tower(stage, say, ctx) {
    var bell = bellSvg(), mk = marks(state.free);
    var area = E('div', { style: { width: '100%', display: 'grid', 'justify-items': 'center', gap: '.8rem' } });
    stage.appendChild(E('div', { class: 'bell-wrap' }, bell, mk));
    stage.appendChild(area);

    function goEpilogue() { K.story.go('epilogue'); }
    function finished() {
      K.clear(area);
      area.appendChild(E('p', { class: 'final-msg', text: 'Tomorrow exists.' }));
      var next = E('button', { type: 'button', class: 'btn' }, 'Continue to the epilogue'); next.addEventListener('click', goEpilogue);
      var alt = E('button', { type: 'button', class: 'btn ghost small' }, 'See the path Kairo did not take');
      alt.addEventListener('click', function () { altEnding(true); });
      area.appendChild(E('div', { class: 'row' }, next, alt)); next.focus({ preventScroll: true });
    }
    function altEnding(viewOnly) {
      K.clear(area);
      var back = E('button', { type: 'button', class: 'btn small' }, viewOnly ? 'Back' : 'Return to the tower');
      back.addEventListener('click', function () { if (state.free) finished(); else choose(); });
      area.appendChild(E('div', { class: 'alt-end' },
        E('h4', { text: 'Alternate ending: the loop continues' }),
        E('p', { text: 'A door slams. A candle flickers. A distant bell begins to ring. Then everything resets.' }),
        E('p', { text: 'Stillhour stays protected, and stays trapped. Kairo forgets a little more, and walks back toward the same mystery.' }),
        state.resets >= 2 ? E('p', { class: 'small-note', text: 'The star on the lantern was never random. Look at it again.' }) : null));
      area.appendChild(back); back.focus({ preventScroll: true });
    }
    function open() {
      state.free = true; K.store.set('free', true);
      K.clear(area);
      if (K.motionOK()) bell.classList.add('ring');
      mk.classList.add('done'); mk.setAttribute('aria-label', 'All thirteen marks lit');
      K.sound.play('bell');
      K.addClue('bell13');
      say('Kairo notices the star on the lantern. It was not random. Kairo left it as a reminder. “A future worth saving cannot be one that never arrives.”');
      say('Kairo lets go. The thirteenth bell rings. For the first time, Stillhour moves beyond its repeating minute.');
      say('The villagers continue their lives. The clockmaker watches the mechanism fall silent. Kairo remembers the friend whose dream began it all.');
      say('Kairo does not know what tomorrow will bring. But tomorrow exists.');
      setTimeout(finished, K.motionOK() ? 1200 : 0);
      K.toast('The loop is released', 'Stillhour is moving forward.');
    }
    function choose() {
      K.clear(area);
      var A = E('button', { type: 'button', class: 'choice' }, E('strong', { text: 'Reset the clock' }), E('span', { text: 'Keep the worlds protected. Keep the loop.' }));
      var B = E('button', { type: 'button', class: 'choice' }, E('strong', { text: 'Open the thirteenth minute' }), E('span', { text: 'Let go of the memory holding the loop. Let tomorrow arrive, with no guarantees.' }));
      A.addEventListener('click', function () { state.resets++; altEnding(false); });
      B.addEventListener('click', open);
      area.appendChild(E('div', { class: 'choices' }, A, B));
    }
    say('Kairo reaches the clock tower. The thirteenth bell waits above the repeating town.');
    say('This is the moment earlier versions of Kairo feared, warned about, or tried to prevent.');
    if (state.free) { finished(); } else { choose(); }
    ctx.onLeave(function () { /* nothing to clean */ });
  }

  /* ---------- Epilogue ---------- */
  function epilogue(stage, say) {
    if (!state.free) {
      say('The door is still closed. Something has to be decided at the clock tower first.');
      var go = E('button', { type: 'button', class: 'btn' }, 'Go to the clock tower');
      go.addEventListener('click', function () { K.story.go('tower'); });
      stage.appendChild(E('div', { class: 'alt-end' }, E('h4', { text: 'Locked' }), E('p', { text: 'The epilogue opens after the thirteenth minute is released.' })));
      stage.appendChild(go);
      return;
    }
    K.addClue('forward');
    say('After the loop ends, the lantern has changed. Its clock now has thirteen marks, and it ticks forward.');
    stage.appendChild(bigClock('fwd'));
    stage.appendChild(msgCard('“Thank you for opening the door.”'));
    stage.appendChild(E('p', { class: 'small-note', text: 'There is no signature.' }));
    var pts = [[50, 220], [50, 170], [50, 120], [50, 78], [62, 50], [80, 32], [100, 26], [120, 32], [138, 50], [150, 78], [150, 120], [150, 170], [150, 220]];
    var s = '';
    for (var i = 0; i < pts.length - 1; i++) s += '<line x1="' + pts[i][0] + '" y1="' + pts[i][1] + '" x2="' + pts[i + 1][0] + '" y2="' + pts[i + 1][1] + '"/>';
    s += '<line x1="50" y1="220" x2="150" y2="220"/>';
    pts.forEach(function (p) { s += '<circle class="dot" cx="' + p[0] + '" cy="' + p[1] + '" r="3.4"/>'; });
    s += '<circle class="dot" cx="132" cy="150" r="5"/>';
    var door = K.svg('<svg class="door-svg" viewBox="0 0 200 240" role="img" aria-label="The stars have formed a constellation in the shape of a doorway">' + s + '</svg>');
    var btn = E('button', { type: 'button', class: 'door-btn', 'aria-label': 'Listen to the constellation' }, door);
    var knocks = E('div', { class: 'knocks', 'aria-live': 'polite' });
    var fin = E('p', { class: 'final-msg', 'aria-live': 'polite' });
    stage.appendChild(btn); stage.appendChild(knocks); stage.appendChild(fin);
    say('Outside, the stars form a constellation shaped like a doorway. Look closely at it.');
    var done = false;
    btn.addEventListener('click', function () {
      if (done) return; done = true;
      K.sound.play('knock');
      ['Knock.', 'Knock.', 'Knock.'].forEach(function (t, k) { setTimeout(function () { knocks.appendChild(E('span', { text: t + ' ' })); }, K.motionOK() ? k * 450 : 0); });
      setTimeout(function () {
        say('This time the knocks do not come from behind a wall. They come from the other side of the sky.');
        fin.textContent = 'Chapter Two has been waiting for you.';
      }, K.motionOK() ? 1700 : 0);
    });
    stage.appendChild(E('p', { class: 'small-note', text: 'Tap the doorway.' }));
  }

  /* ---------- scene player ---------- */
  function renderSteps() {
    var nav = K.clear(K.$('#storySteps'));
    SCENES.forEach(function (sc, i) {
      var b = E('button', { type: 'button', class: state.visited[sc.id] ? 'done' : '', 'aria-label': 'Scene ' + (i + 1) + ': ' + sc.short + (state.visited[sc.id] ? ' (visited)' : '') }, (i + 1) + '. ' + sc.short);
      if (i === state.idx) b.setAttribute('aria-current', 'step');
      b.addEventListener('click', function () { show(i, true); });
      nav.appendChild(b);
    });
  }
  function show(i, focusTitle) {
    if (cleanup) { cleanup(); cleanup = null; }
    state.idx = i; var sc = SCENES[i];
    state.visited[sc.id] = true; K.store.set('visited', state.visited);
    renderSteps();
    var root = K.clear(K.$('#sceneRoot'));
    var narr = E('div', { class: 'narration', 'aria-live': 'polite' });
    var stage = E('div', { class: 'stage', style: { '--stage-img': 'url(' + sc.bg + ')' } });
    var leaves = [];
    var ctx = { onLeave: function (fn) { leaves.push(fn); } };
    cleanup = function () { leaves.forEach(function (f) { f(); }); };
    function say(text) { narr.appendChild(E('p', { text: text })); }
    var title = E('h3', { id: 'sceneTitle', tabindex: '-1', text: sc.title });
    var prev = E('button', { type: 'button', class: 'btn ghost small' }, 'Back');
    prev.disabled = i === 0; prev.addEventListener('click', function () { show(i - 1, true); });
    var next = sc.next
      ? E('button', { type: 'button', class: 'btn small' }, sc.next + ' →')
      : E('a', { class: 'btn small', href: '#portfolio' }, 'Try Kairo’s inventions →');
    if (sc.next) next.addEventListener('click', function () { show(i + 1, true); });
    var help = HELP[sc.id] || { todo: '', clues: [] };
    var todoCount = E('span', { class: 'todo-count' });
    var todo = E('p', { class: 'todo' }, E('strong', { text: 'What to do here: ' }), help.todo, ' ', todoCount);
    function updateTodo() {
      if (!help.clues.length) { todoCount.textContent = ''; return; }
      var got = help.clues.filter(function (c) { return K.hasClue(c); }).length;
      todoCount.textContent = '(Clues in this scene: ' + got + ' of ' + help.clues.length + (got === help.clues.length ? ', all found ✓' : '') + ')';
    }
    updateTodo();
    document.addEventListener('kairo:clue', updateTodo);
    leaves.push(function () { document.removeEventListener('kairo:clue', updateTodo); });
    root.appendChild(E('article', { class: 'scene', 'aria-labelledby': 'sceneTitle' },
      E('header', { class: 'scene-head' }, E('p', { class: 'kicker', text: sc.kicker }), title),
      todo,
      stage, narr,
      E('footer', { class: 'scene-nav' }, prev, next)));
    sc.build(stage, say, ctx);
    if (focusTitle) {
      title.focus({ preventScroll: true });
      K.$('#storyTitle').scrollIntoView({ behavior: K.motionOK() ? 'smooth' : 'auto', block: 'start' });
    }
  }
  K.story.go = function (idOrIdx) {
    var i = typeof idOrIdx === 'number' ? idOrIdx : BY_ID[idOrIdx];
    if (i === undefined) return;
    show(i, true);
  };

  document.addEventListener('kairo:reset', function () { state.trust = null; state.free = false; state.visited = {}; K.store.del('trust'); K.store.del('free'); K.store.del('visited'); show(0, false); });

  function boot() { show(0, false); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
