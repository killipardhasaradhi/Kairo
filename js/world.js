/* world.js: Kairo notices you, the world reacts to your cursor, Kairo remembers you,
   time as a mechanic, hidden choices, the mirror that lies. Everything is local to this browser. */
(function () {
  'use strict';
  var E = K.el;
  var now = function () { return Date.now(); };

  /* ================= companion (idea 1) ================= */
  var comp, face, img, bub, cx, mood = 'curious', bubT = 0, lastAct = now(), idleSaid = 0, activeMs = 0, scene = null;
  var MOODS = { curious: 1, happy: 1, sad: 1, surprised: 1, thoughtful: 1, determined: 1 };
  function setMood(m) { if (!MOODS[m]) m = 'curious'; mood = m; if (img) img.src = 'assets/expr-' + m + '.jpg'; }
  function say(text, m, ms, sound) {
    if (!K.settings.companion || !comp) return;
    comp.hidden = false; if (m) setMood(m);
    K.clear(bub); bub.appendChild(E('span', { text: text })); bub.hidden = false;
    clearTimeout(bubT); bubT = setTimeout(function () { bub.hidden = true; if (m && m !== 'curious') setMood(sceneMood()); }, ms || 6500);
    if (sound) K.audio.whisper(sound);
  }
  K.say = say;
  function sceneMood() { return { prologue: 'curious', stillhour: 'surprised', workshop: 'thoughtful', library: 'curious', mirror: 'surprised', truth: 'sad', tower: 'determined', epilogue: 'happy' }[scene] || 'curious'; }

  var TOUR = [
    ['Hello. I am watching, but only the way a lantern does.', 'happy'],
    ['Try hovering the buttons. I tend to look where you look.', 'curious'],
    ['The star on my lantern is missing a point. That matters.', 'thoughtful'],
    ['Your notebook fills itself. Connect two clues and I will tell you why they match.', 'curious']
  ];
  var tourI = 0;
  function talk() {
    var n = K.found.length, f = K.story && K.story.state && K.story.state.free;
    var pool = [];
    if (f) pool.push(['Tomorrow came. I keep checking that it is real.', 'happy']);
    if (n >= 10) pool.push(['You have almost the whole picture. The last pieces are the quiet ones.', 'determined']);
    if (n === 0) pool.push(['Start with the lantern. Press the glowing clock in the Prologue.', 'curious']);
    if (n > 0 && n < 6) pool.push(['You are building a case. Check the notebook: clues connect.', 'thoughtful']);
    if (K.hasSecret('shadow') && !K.hasSecret('lanternBack')) pool.push(['Shadows turn. Lanterns have backs too.', 'thoughtful']);
    if (!K.hasSecret('terminal') && K.secrets.ninth) pool.push(['The ninth place has a terminal. It sends messages from tomorrow.', 'surprised']);
    pool.push(TOUR[tourI++ % TOUR.length]);
    var p = pool[(Math.random() * pool.length) | 0];
    say(p[0], p[1]);
  }

  function buildCompanion() {
    comp = K.$('#companion'); face = K.$('#compFace'); img = K.$('#compImg'); bub = K.$('#compBubble'); cx = K.$('#compX');
    if (!comp) return;
    comp.hidden = !K.settings.companion;
    face.addEventListener('click', function () { K.sound.play('click'); talk(); });
    cx.addEventListener('click', function () { K.settings.companion = false; K.store.set('companion', false); comp.hidden = true; K.toast('Kairo companion hidden', 'Reload the page with ?companion to bring it back.'); });
    if (/[?&]companion\b/.test(location.search)) { K.settings.companion = true; K.store.set('companion', true); comp.hidden = false; }
    /* blink: a quick squash of the face every few seconds */
    (function blink() {
      setTimeout(function () { if (K.motionOK() && comp && !comp.hidden) { face.classList.add('blink'); setTimeout(function () { face.classList.remove('blink'); }, 160); } blink(); }, 2800 + Math.random() * 3200);
    })();
  }

  /* ================= gaze: the companion and hero look toward what you hover (idea 1/2) ================= */
  var gazeEls = 'a.btn, button.btn, .main-nav a, .tab, .fab, .egg-star, .choice, .door-btn, .tool';
  function gaze(el) {
    if (!el) return;
    var r = el.getBoundingClientRect(), c = comp && comp.getBoundingClientRect();
    if (c && !comp.hidden) {
      var dx = (r.left + r.width / 2) - (c.left + c.width / 2), dy = (r.top + r.height / 2) - (c.top + c.height / 2);
      var d = Math.max(1, Math.hypot(dx, dy)), k = Math.min(1, 300 / d);
      img.style.transform = 'translate(' + (dx / d * 5 * k).toFixed(1) + 'px,' + (dy / d * 4 * k).toFixed(1) + 'px) scale(1.06)';
    }
    var hero = K.$('#landing');
    if (hero && el.closest && el.closest('#landing') && K.lookAt) K.lookAt(el);
  }
  function ungaze() { if (img) img.style.transform = ''; }
  document.addEventListener('pointerover', function (e) { var t = e.target.closest && e.target.closest(gazeEls); if (t) gaze(t); }, { passive: true });
  document.addEventListener('pointerout', function (e) { if (e.target.closest && e.target.closest(gazeEls)) ungaze(); }, { passive: true });
  document.addEventListener('focusin', function (e) { var t = e.target.closest && e.target.closest(gazeEls); if (t) gaze(t); });
  document.addEventListener('focusout', ungaze);

  /* ================= pointer world (idea 2) ================= */
  var layer, light, pointerRAF = 0;
  function pointer(e) {
    var p = K.pointer; p.type = e.pointerType || 'mouse'; p.x = e.clientX; p.y = e.clientY;
    p.nx = (e.clientX / window.innerWidth - 0.5) * 2; p.ny = (e.clientY / window.innerHeight - 0.5) * 2; p.moved = true;
    lastAct = now();
    if (!pointerRAF) pointerRAF = requestAnimationFrame(frame);
  }
  document.addEventListener('pointermove', pointer, { passive: true });
  ['keydown', 'scroll', 'pointerdown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, function () { lastAct = now(); }, { passive: true }); });

  var syms = [];
  var SYM_DEF = [
    { sel: '#landing', x: '4%', y: '82%', g: '☽' }, { sel: '#meet', x: '93%', y: '14%', g: '✧' }, { sel: '#story', x: '6%', y: '10%', g: '◇' },
    { sel: '#portfolio', x: '92%', y: '88%', g: '⌘' }, { sel: '#notebook', x: '50%', y: '97%', g: '☍' }, { sel: '#guestbook', x: '8%', y: '90%', g: '✶' }
  ];
  function buildSymbols() {
    var got = K.flag('symsFound') || [];
    SYM_DEF.forEach(function (d, i) {
      var host = K.$(d.sel); if (!host) return;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      var b = E('button', { type: 'button', class: 'sym' + (got.indexOf(i) !== -1 ? ' got' : ''), 'aria-label': 'A faint hidden symbol', style: { left: 'min(' + d.x + ', calc(100% - 40px))', top: d.y } }, d.g);
      b.addEventListener('click', function () {
        var g = K.flag('symsFound') || []; if (g.indexOf(i) !== -1) return;
        g.push(i); K.setFlag('symsFound', g); b.classList.add('got'); K.sound.play('clue');
        K.toast('Hidden symbol ' + g.length + ' of 6', g.length === 6 ? 'All six. They spell a doorway.' : 'Something is waking up.');
        if (g.length === 6) { K.secret('symbols'); say('Six marks, one for each place I was never meant to find. Thank you for noticing.', 'happy', 8000, 'idle'); }
      });
      host.appendChild(b); syms.push(b);
    });
  }
  function frame() {
    pointerRAF = 0;
    var p = K.pointer;
    if (light && p.type === 'mouse' && K.motionOK()) {
      light.style.setProperty('--lx', p.x + 'px'); light.style.setProperty('--ly', p.y + 'px'); light.classList.add('on');
    }
    /* symbols glow as the lantern light approaches */
    for (var i = 0; i < syms.length; i++) {
      var r = syms[i].getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - p.x, r.top + r.height / 2 - p.y);
      var near = Math.max(0, 1 - d / 170);
      syms[i].style.setProperty('--near', near.toFixed(2));
      if (near > 0.6 && !syms[i].classList.contains('got') && K.settings.sound) K.audio.chime(near);
    }
  }
  /* touch visitors cannot hover: let symbols pulse softly instead */
  function touchHint() { document.documentElement.classList.toggle('touch', window.matchMedia && window.matchMedia('(hover: none)').matches); }

  /* ================= idle whisper + the thing behind the cursor (idea 1) ================= */
  function tick() {
    var t = now();
    if (!document.hidden && t - lastAct < 5000) activeMs += 1000;
    if (!document.hidden && t - lastAct > 28000 && t - idleSaid > 60000 && K.settings.companion) {
      idleSaid = t;
      say('You’re still here. I thought time had taken you too.', 'sad', 8000, 'idle');
      K.audio.silence(1800);
    }
    if (activeMs > 75000 && !K.hasSecret('behind') && K.pointer.moved && K.pointer.type === 'mouse' && K.motionOK()) {
      K.secret('behind', true); behind();
    }
  }
  function behind() {
    var g = E('div', { class: 'ghost-cursor', 'aria-hidden': 'true' }, '✦'); document.body.appendChild(g);
    var gx = K.pointer.x, gy = K.pointer.y, end = now() + 4200;
    (function f() {
      gx += (K.pointer.x - gx) * 0.045; gy += (K.pointer.y - gy) * 0.045;
      g.style.transform = 'translate(' + gx.toFixed(0) + 'px,' + gy.toFixed(0) + 'px)';
      if (now() < end) requestAnimationFrame(f); else g.remove();
    })();
    K.audio.step(0.6); if (K.startle) K.startle();
    say('Don’t turn around. Something is following your cursor, just a step behind it.', 'surprised', 7000);
    setTimeout(function () { K.secret('behind'); }, 4500);
  }

  /* ================= Kairo remembers you (idea 5) ================= */
  function remember() {
    var last = K.store.get('last', null), visits = K.store.get('visits', 1);
    var line = null, m = 'curious';
    if (last && last.t) {
      var gap = now() - last.t, away = gap > 3600e3 ? 'a while' : 'a moment';
      if (last.scene === 'stillhour' && !last.free) { line = 'You came back. Last time, you left the clock running.'; m = 'surprised'; }
      else if (last.free) { line = 'Tomorrow is still here. I half expected you to be gone, and I am glad you are not.'; m = 'happy'; }
      else if (last.trust === 'trust') { line = 'Last time you trusted the other me. I have been wondering whether that was wise.'; m = 'thoughtful'; }
      else if (last.trust === 'alone') { line = 'Last time you chose to follow the evidence alone. You do that, don’t you.'; m = 'determined'; }
      else if (last.clues >= 1) { line = 'You came back after ' + away + '. You have ' + last.clues + ' clue' + (last.clues === 1 ? '' : 's') + ' in the notebook. Shall we continue?'; m = 'curious'; }
      else { line = 'You came back. That is not nothing, around here.'; m = 'happy'; }
      if (visits >= 4) line += ' This is visit number ' + visits + ' from this device.';
    } else line = 'A new face. Welcome to Stillhour. Be careful with the lantern.';
    setTimeout(function () { say(line, m, 9500, 'idle'); }, 1400);
  }
  function save() {
    var st = K.story && K.story.state;
    K.store.set('last', { t: now(), scene: scene, clues: K.found.length, trust: st && st.trust, free: st && st.free });
  }
  window.addEventListener('pagehide', save); document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });

  /* ================= scene hooks: danger, whispers, time, hidden choices, mirror (ideas 4, 6, 7, 8) ================= */
  var DANGER = { prologue: 0.05, stillhour: 0.2, workshop: 0.3, library: 0.35, mirror: 0.65, truth: 0.7, tower: 1, epilogue: 0 };
  var TEMPO = { prologue: 1, stillhour: 1.2, workshop: 1.1, library: 0.9, mirror: 1.6, truth: 1.4, tower: 2, epilogue: 0.6 };
  var LOOK = { stillhour: 'Still hour. Everything repeats here.', mirror: 'The reflection should match me. Watch it carefully.', tower: 'The thirteenth bell is up there.' };

  function addTool(stage, label, fn, cls) {
    var b = E('button', { type: 'button', class: 'btn small ghost ' + (cls || '') }, label);
    b.addEventListener('click', function () { fn(b); });
    var row = stage.querySelector('.world-tools');
    if (!row) { row = E('div', { class: 'row world-tools' }); stage.appendChild(row); }
    row.appendChild(b); return b;
  }
  function note(stage, text, cls) { var p = E('p', { class: 'world-note ' + (cls || ''), 'aria-live': 'polite', text: text }); stage.appendChild(p); return p; }

  function atmos(id) {
    scene = id; K.audio.scene(id); K.setDanger(DANGER[id] || 0); K.tempo = TEMPO[id] || 1;
    setMood(sceneMood()); K.audio.whisper(id); K.audio.silence(900);
    if (LOOK[id]) setTimeout(function () { say(LOOK[id], sceneMood(), 5500); }, 600);
  }
  document.addEventListener('kairo:chapter', function (e) { atmos(e.detail.id); });
  function onScene(ev) {
    var d = ev.detail, id = d.id, stage = d.stage;
    if (d.mode !== 'scroll') atmos(id);
    /* the terminal's warning poisons exactly one scene (idea 10) */
    if (K.flag('warnedNext') && !K.flag('lieShown') && id !== 'prologue') {
      K.setFlag('lieShown', true);
      var lie = E('p', { class: 'world-note lie' }, 'The narrator insists: “Every clock in this place shows fourteen marks.” ');
      var rep = E('button', { type: 'button', class: 'btn small ghost' }, 'This feels wrong: report it');
      rep.addEventListener('click', function () { K.setFlag('caughtLie', true); rep.disabled = true; lie.classList.add('caught'); K.sound.play('contradiction'); K.toast('Inconsistency recorded', 'There are thirteen marks, never fourteen. The terminal was right to warn you.'); say('Fourteen? I knew there were only thirteen. Good catch.', 'determined'); });
      lie.appendChild(rep); stage.appendChild(lie);
    }

    if (id === 'prologue') {
      addTool(stage, 'Turn the lantern over', function (b) {
        if (K.secret('lanternBack')) { b.after(E('p', { class: 'world-note', text: 'On the back, scratched in tiny letters: “FOR WHEN I FORGET WHY.” The handwriting is Kairo’s, but older.' })); K.setFlag('lanternBack', true); }
        else K.toast('Already turned', 'FOR WHEN I FORGET WHY.');
      });
    }
    if (id === 'stillhour') stillhourTime(stage);
    if (id === 'workshop') workshopTime(stage);
    if (id === 'library') libraryTime(stage);
    if (id === 'mirror') mirrorLies(stage);
    if (id === 'tower') towerExtras(stage);
  }
  document.addEventListener('kairo:scene', onScene);

  /* ---- Stillhour: slow or speed the loop, and rewind ---- */
  function stillhourTime(stage) {
    if (K.settings.calm) { note(stage, 'Calm mode is on: time pressure is removed. The loop will wait for you.'); return; }
    var lbl = note(stage, 'Time here is yours to bend. Slow it, speed it, or rewind ten seconds. Kairo’s clues do not expire either way.');
    var slow = addTool(stage, 'Slow time', function () { K.tempo = 0.45; document.documentElement.classList.add('slow'); K.toast('Time slowed', 'The ticking in your left ear grows distant.'); K.sound.play('rewind'); });
    addTool(stage, 'Speed time', function () { K.tempo = 2.6; document.documentElement.classList.remove('slow'); K.toast('Time sped up', 'The ticking quickens.'); K.sound.play('beep'); });
    addTool(stage, 'Rewind 10 seconds', function () {
      K.sound.play('rewind'); stage.classList.add('rewind'); setTimeout(function () { stage.classList.remove('rewind'); }, 900);
      K.bump('rewinds');
      var n = K.flag('rewinds');
      lbl.textContent = n >= 3 ? 'Each rewind makes the town hold its breath a little longer. You have rewound ' + n + ' times. Kairo has done this far more.' : 'Ten seconds ago, Stillhour looked exactly like this. That is the point.';
    });
    slow.parentNode.appendChild(E('span', { class: 'small-note', text: 'Tip: sound makes this tangible. Turn Sound on and listen with headphones.' }));
  }
  /* ---- Workshop: a note that exists for a few seconds; the back of a drawing ---- */
  function workshopTime(stage) {
    var fl = K.hasSecret('fleeting');
    var holder = E('div', { class: 'world-slot' }); stage.appendChild(holder);
    function offer() {
      var b = E('button', { type: 'button', class: 'btn small ghost' }, K.settings.calm ? 'Read the note pinned to the beam' : 'A note is fluttering by the beam… (quick)');
      holder.appendChild(b);
      b.addEventListener('click', function () {
        K.clear(holder);
        var n = E('p', { class: 'world-note fleeting' }, '“If the star has a missing point, someone took it on purpose.”');
        holder.appendChild(n);
        K.secret('fleeting'); K.sound.play('secret');
        if (!K.settings.calm) setTimeout(function () { n.classList.add('gone'); n.textContent = '…the paper crumbles. You will have to remember it.'; }, 6000);
      });
      if (!K.settings.calm && !fl) {
        setTimeout(function () { if (!K.hasSecret('fleeting') && b.parentNode) { b.disabled = true; b.textContent = 'The note blew away. Come back to this scene to try again.'; } }, 9000);
      }
    }
    if (!fl) offer(); else holder.appendChild(E('p', { class: 'world-note', text: 'You already read the note by the beam. Once is all it ever lets you.' }));
    addTool(stage, 'Turn a drawing over', function (b) {
      if (K.secret('drawingBack')) { b.after(E('p', { class: 'world-note', text: 'The back reads, in a hurried hand: “Don’t trust the one who tells you everything is fine.”' })); }
      else K.toast('Already turned', 'Don’t trust the one who tells you everything is fine.');
    });
  }
  /* ---- Library: stop time, and the dust writes ---- */
  function libraryTime(stage) {
    var dust = E('div', { class: 'dust', 'aria-hidden': 'true' });
    for (var i = 0; i < 18; i++) dust.appendChild(E('i', { style: { left: (Math.random() * 100).toFixed(0) + '%', 'animation-delay': (-Math.random() * 6).toFixed(1) + 's', 'animation-duration': (5 + Math.random() * 5).toFixed(1) + 's' } }));
    stage.appendChild(dust);
    var msg = E('p', { class: 'world-note dust-msg', hidden: true, text: 'Held in the air, the dust reads: “THE BOOK ENDS WHERE YOU DO.”' });
    stage.appendChild(msg);
    var held = false;
    addTool(stage, 'Make time stand still', function (b) {
      held = !held; dust.classList.toggle('held', held); b.textContent = held ? 'Let time move again' : 'Make time stand still';
      K.sound.play('rewind'); K.audio.silence(held ? 6000 : 0);
      msg.hidden = !held;
      if (held) { K.secret('dust'); say('Hold still. Do you hear that? Nothing is ticking. That is the sound of the thirteenth minute.', 'thoughtful', 7000); }
    });
  }
  /* ---- Mirror: the reflection lies (idea 8) ---- */
  function mirrorLies(stage) {
    var seen = {};
    var panel = E('div', { class: 'mirror-lab' },
      E('p', { class: 'small-note', text: 'The reflection looks like Kairo, but check it. Three things to inspect:' }));
    var out = E('p', { class: 'world-note', 'aria-live': 'polite' });
    var mir = stage.querySelector('.mirror');
    function done() {
      if (seen.blink && seen.bell && seen.text && !K.flag('mirrorLies')) {
        K.setFlag('mirrorLies', true); K.sound.play('contradiction'); K.audio.theme('shadow');
        K.toast('The reflection is not Kairo', 'It blinks first, it holds a bell, and it writes backwards. It is someone else’s version.');
        say('So that is why trust matters here. It is wearing my face, but it moves before I do.', 'surprised', 8000);
        K.setDanger(0.85);
      }
    }
    function b1() {
      seen.blink = true; if (mir) { mir.classList.remove('lie-blink'); void mir.offsetWidth; mir.classList.add('lie-blink'); }
      out.textContent = 'Kairo blinks. A moment later, so does the reflection. Then it blinks again, but Kairo did not. The reflection moved first.'; K.audio.tick(0.4, 0.05); done();
    }
    function b2() {
      seen.bell = true; K.secret('mirrorBell'); if (mir) mir.classList.add('lie-bell');
      out.textContent = 'In the glass there is a small bell hanging over the reflection’s shoulder. Turn around: the room has no bell at all.'; K.sound.play('bell'); done();
    }
    function b3() {
      seen.text = true; K.secret('mirrorText');
      out.innerHTML = ''; out.appendChild(E('span', { class: 'mirror-text', text: 'DO NOT LET HER HEAR THE BELL' })); out.appendChild(E('span', { class: 'small-note', text: ' (written backwards in the glass: it only reads correctly in a mirror)' }));
      K.audio.whisper('mirror'); done();
    }
    var row = E('div', { class: 'row' });
    [['Watch the blink', b1], ['Look for the bell', b2], ['Read the glass', b3]].forEach(function (a) { var b = E('button', { type: 'button', class: 'btn small ghost' }, a[0]); b.addEventListener('click', a[1]); row.appendChild(b); });
    panel.appendChild(row); panel.appendChild(out); stage.appendChild(panel);
  }
  /* ---- Tower: hidden choice and evidence ---- */
  function towerExtras(stage) {
    var st = K.story.state;
    if (st.free) return;
    var ev = [];
    if (K.hasClue('bell13')) ev.push('the thirteenth bell'); if (K.hasClue('mirror')) ev.push('the mirror'); if (K.hasClue('book')) ev.push('the Final Loop book');
    var p = note(stage, ev.length ? 'Evidence in your hands: ' + ev.join(', ') + '.' : 'You have almost no evidence yet. A choice made blind often repeats itself.', 'evidence');
    if (K.flag('mirrorLies') && st.trust === 'trust') p.textContent += ' You trusted a reflection that you later caught lying. Think about that before choosing.';
    if (K.flag('caughtLie')) p.textContent += ' You also caught the narrator lying once, so you know that not everything that speaks here is honest.';
    if (K.hasSecret('lanternBack') || K.hasSecret('drawingBack')) {
      addTool(stage, 'Whisper “for when I forget why”', function (b) { K.setFlag('whispered', true); b.disabled = true; K.audio.whisper('tower'); say('You remembered what I wrote on the back of the lantern. That is the only reason I am still here.', 'sad', 8000); K.toast('A different path opens', 'The ending will remember this.'); });
    }
  }
  document.addEventListener('kairo:free', function () {
    K.setDanger(0.1); K.audio.theme(K.story.state.trust === 'trust' ? 'together' : 'seeker'); K.audio.silence(2500);
    setTimeout(function () { say(K.flag('whispered') ? 'You remembered why. So did I.' : K.flag('caughtLie') ? 'You caught the lie and still opened the door. That takes courage.' : 'Tomorrow exists. Thank you.', 'happy', 9000); }, 1600);
  });
  document.addEventListener('kairo:trust', function () { K.audio.theme(K.story.state.trust === 'trust' ? 'together' : 'alone'); });
  document.addEventListener('kairo:clue', function () { setTimeout(function () { if (Math.random() < 0.4 && K.found.length < 12) say(['That felt important.', 'The notebook is filling up.', 'I remember that. Almost.'][(Math.random() * 3) | 0], 'thoughtful', 3800); }, 700); });
  document.addEventListener('kairo:secret', function (e) { if (K.startle && e.detail !== 'behind') K.startle(); });
  document.addEventListener('kairo:autoconnect', function () { say('Two of your clues just recognised each other.', 'surprised', 5500); });

  /* ================= hero: the shadow turns (idea 2/5) ================= */
  function heroShadow() {
    var stage = K.$('#kairoStage'); if (!stage) return;
    var b = E('button', { type: 'button', class: 'shadow-btn', 'aria-label': 'The shadow at Kairo’s feet. Something about it looks wrong.' });
    stage.appendChild(b);
    if (K.hasSecret('shadow')) K.shadowTurn(true);
    b.addEventListener('click', function () {
      var on = !K.flag('shadowTurned'); K.setFlag('shadowTurned', on); K.shadowTurn(on); K.sound.play('secret');
      if (on) { K.secret('shadow'); K.audio.step(0.8); say('The shadow turned to face the other way. It was never mine.', 'surprised', 7000); }
      else say('It turned back. It does that when it is watched.', 'thoughtful', 5000);
    });
    /* the shadow moves first: after you rest the pointer on the picture it leads by a beat */
    stage.addEventListener('pointerenter', function () { stage.classList.add('watched'); });
    stage.addEventListener('pointerleave', function () { stage.classList.remove('watched'); });
  }


  /* ================= secrets list + theory board (idea 3 / 6) ================= */
  function drawSecrets() {
    var ul = K.$('#secList'); if (!ul) return; K.clear(ul);
    var n = 0;
    K.SECRETS.forEach(function (d) {
      var has = K.hasSecret(d.id); if (has) n++;
      ul.appendChild(E('li', { class: has ? 'found' : '' }, E('strong', { text: has ? d.name : '???' }), E('span', { text: has ? ' Found.' : ' Hint: ' + d.hint })));
    });
    K.$('#secCount').textContent = n + ' of ' + K.SECRETS.length;
  }
  function theories() {
    var form = K.$('#thForm'); if (!form) return;
    var list = K.store.get('theories', []), ul = K.$('#thList'), input = K.$('#thIn');
    function draw() { K.clear(ul); list.forEach(function (t, i) { var b = E('button', { type: 'button', class: 'linklike', 'aria-label': 'Delete this theory' }, 'delete'); b.addEventListener('click', function () { list.splice(i, 1); K.store.set('theories', list); draw(); }); ul.appendChild(E('li', null, E('span', { text: t + ' ' }), b)); }); }
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value.replace(/\s+/g, ' ').trim(); if (!v) return; if (/https?:\/\/|@/.test(v)) { K.toast('Please leave out links and emails'); return; } list.push(v.slice(0, 140)); K.store.set('theories', list.slice(-12)); list = list.slice(-12); input.value = ''; draw(); say('Interesting. I will keep that in mind.', 'thoughtful', 4000); });
    draw();
  }
  document.addEventListener('kairo:secret', drawSecrets);
  document.addEventListener('kairo:reset', function () { K.secrets = {}; K.flags = {}; K.order = []; K.store.del('secrets'); K.store.del('flags'); K.store.del('order'); K.store.del('last'); K.shadowTurn && K.shadowTurn(false); syms.forEach(function (b) { b.classList.remove('got'); }); drawSecrets(); });

  function boot() {
    drawSecrets(); theories();
    layer = K.$('#lightLayer'); light = layer; touchHint();
    buildCompanion(); buildSymbols(); heroShadow(); remember();
    setInterval(tick, 1000);
    K.audio.refresh();
    if (K.story && K.story.state) { /* first paint before any scene hook */
      document.documentElement.style.setProperty('--cold', '0');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
