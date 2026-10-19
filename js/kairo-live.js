/* kairo-live.js: a hand-drawn SVG Kairo who watches your cursor, blinks, changes mood, and reacts when touched. */
(function () {
  'use strict';
  var host = document.getElementById('liveKairo'); if (!host) return;

  var SVG = '' +
  '<svg id="lkSvg" viewBox="0 0 400 470" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="A live drawing of Kairo. Her eyes follow your pointer.">' +
  '<defs>' +
    '<radialGradient id="lkBg" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#3a2f8f" stop-opacity=".75"/><stop offset="1" stop-color="#0a0f2c" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="lkEarL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b79bff"/><stop offset=".55" stop-color="#7aa8ff"/><stop offset="1" stop-color="#5de8f5"/></linearGradient>' +
    '<linearGradient id="lkEarR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9ad5"/><stop offset=".5" stop-color="#b08cff"/><stop offset="1" stop-color="#6fd8ff"/></linearGradient>' +
    '<linearGradient id="lkCloak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34338f"/><stop offset="1" stop-color="#0f1342"/></linearGradient>' +
    '<linearGradient id="lkHood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b3aa0"/><stop offset="1" stop-color="#171b56"/></linearGradient>' +
    '<linearGradient id="lkHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f3ff"/><stop offset="1" stop-color="#bdb4e8"/></linearGradient>' +
    '<linearGradient id="lkGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#f2c34e"/><stop offset="1" stop-color="#b9831f"/></linearGradient>' +
    '<radialGradient id="lkIris" cx="50%" cy="38%" r="65%"><stop offset="0" stop-color="#ffd987"/><stop offset=".55" stop-color="#e59a2f"/><stop offset="1" stop-color="#6b3a12"/></radialGradient>' +
    '<radialGradient id="lkFace" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#fff0e4"/><stop offset="1" stop-color="#f6cdb8"/></radialGradient>' +
    '<radialGradient id="lkGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3c4" stop-opacity=".95"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>' +
    '<path id="lkStar" d="M0-1 L.26-.36 .95-.31 .42.12 .59.81 0 .44 -.59.81 -.42.12 -.95-.31 -.26-.36Z"/>' +
    '<clipPath id="lkEyeL"><ellipse cx="160" cy="238" rx="27" ry="32"/></clipPath><clipPath id="lkEyeR"><ellipse cx="240" cy="238" rx="27" ry="32"/></clipPath>' +
  '</defs>' +

  '<ellipse cx="200" cy="215" rx="190" ry="215" fill="url(#lkBg)"/>' +
  '<g id="lkStars" fill="#ffe9a6"></g>' +

  '<g id="lkAll"><g id="lkBody">' +
    /* ears: uneven on purpose */
    '<g id="lkEarLg" class="lk-ear" tabindex="0" role="button" aria-label="Left ear: tap to make it wiggle"><path d="M126 168 C70 150 8 196 10 284 C12 344 72 352 102 300 C128 258 142 208 126 168Z" fill="url(#lkEarL)" opacity=".9"/><path d="M118 190 C80 190 36 224 38 282 C40 318 74 320 92 288 C110 256 124 220 118 190Z" fill="#fff" opacity=".18"/><circle cx="48" cy="262" r="3" fill="#fff" opacity=".9"/><circle cx="70" cy="226" r="2" fill="#fff" opacity=".8"/><circle cx="84" cy="300" r="2.4" fill="#fff" opacity=".8"/></g>' +
    '<g id="lkEarRg" class="lk-ear" tabindex="0" role="button" aria-label="Right ear: tap to make it wiggle"><path d="M276 172 C330 156 386 200 386 276 C384 332 332 338 304 292 C280 254 266 212 276 172Z" fill="url(#lkEarR)" opacity=".9"/><path d="M280 196 C316 192 358 226 356 278 C354 310 324 312 308 284 C290 254 278 222 280 196Z" fill="#fff" opacity=".18"/><circle cx="352" cy="256" r="3" fill="#fff" opacity=".9"/><circle cx="330" cy="222" r="2" fill="#fff" opacity=".8"/><circle cx="318" cy="296" r="2.2" fill="#fff" opacity=".8"/></g>' +

    /* cloak + lantern */
    '<g id="lkTorso">' +
      '<path d="M70 470 C74 392 118 336 200 332 C282 336 326 392 330 470Z" fill="url(#lkCloak)"/>' +
      '<path d="M96 470 C100 410 134 368 200 364 C266 368 300 410 304 470" fill="none" stroke="#f2c34e" stroke-width="1.6" opacity=".7"/>' +
      '<g fill="url(#lkGold)" opacity=".9"><use href="#lkStar" transform="translate(112 420) scale(9)"/><use href="#lkStar" transform="translate(292 410) scale(7)"/><use href="#lkStar" transform="translate(88 456) scale(6)"/><use href="#lkStar" transform="translate(318 448) scale(8)"/><use href="#lkStar" transform="translate(150 372) scale(5)"/><use href="#lkStar" transform="translate(252 372) scale(5)"/></g>' +
      '<path d="M150 340 Q200 372 250 340" fill="none" stroke="#f2c34e" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="200" cy="350" r="9" fill="url(#lkGold)"/><circle cx="200" cy="350" r="4" fill="#7ad7ff"/>' +
    '</g>' +
    '<g id="lkLantern" class="lk-lantern" tabindex="0" role="button" aria-label="The lantern. Tap it to wake its light">' +
      '<circle id="lkHalo" cx="200" cy="404" r="62" fill="url(#lkGlow)" opacity=".55"/>' +
      '<path d="M178 366 Q200 338 222 366" fill="none" stroke="url(#lkGold)" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="168" y="364" width="64" height="12" rx="5" fill="url(#lkGold)"/>' +
      '<circle cx="200" cy="410" r="38" fill="url(#lkGold)"/><circle cx="200" cy="410" r="31" fill="#fff6d4"/><circle cx="200" cy="410" r="31" fill="none" stroke="#b9831f" stroke-width="2"/>' +
      '<g id="lkTicks" stroke="#8a5a14" stroke-width="2.2" stroke-linecap="round"></g>' +
      '<circle cx="200" cy="410" r="3.2" fill="#8a5a14"/>' +
      '<rect x="176" y="444" width="48" height="10" rx="5" fill="url(#lkGold)"/>' +
    '</g>' +
    '<g id="lkHands"><ellipse id="lkHandL" cx="160" cy="396" rx="17" ry="14" fill="url(#lkFace)"/><ellipse id="lkHandR" cx="240" cy="396" rx="17" ry="14" fill="url(#lkFace)"/><path d="M148 388 q6 -6 13 -2 M239 386 q7 -4 13 2" stroke="#e9b9a0" stroke-width="2" fill="none" stroke-linecap="round"/></g>' +
  '</g>' +

  '<g id="lkHead">' +
    /* hood behind */
    '<path id="lkHoodTip" d="M112 130 C82 100 42 108 20 142 C54 140 78 156 92 186Z" fill="url(#lkHood)"/>' +
    '<g id="lkTipStar" transform="translate(24 146) rotate(-14)"><use href="#lkStar" transform="scale(13)" fill="url(#lkGold)"/></g>' +
    '<path d="M98 236 C86 120 140 50 200 46 C262 50 314 122 302 236 C270 196 130 196 98 236Z" fill="url(#lkHood)"/>' +
    /* back hair */
    '<path d="M104 210 C96 130 142 92 200 92 C258 92 304 130 296 210 C310 262 304 300 290 330 C282 300 276 270 268 250 L132 250 C124 270 118 300 110 330 C96 300 90 262 104 210Z" fill="url(#lkHair)"/>' +
    /* face */
    '<ellipse cx="200" cy="232" rx="82" ry="76" fill="url(#lkFace)"/>' +
    '<ellipse cx="132" cy="262" rx="15" ry="9" fill="#ff9aa8" opacity=".42"/><ellipse cx="268" cy="262" rx="15" ry="9" fill="#ff9aa8" opacity=".42"/>' +
    /* eyes */
    '<g id="lkEyes">' +
      '<g id="lkEyeLg" class="lk-eye"><ellipse cx="160" cy="238" rx="28" ry="33" fill="#fffaf2"/><g clip-path="url(#lkEyeL)"><g class="lk-iris"><ellipse cx="160" cy="240" rx="25" ry="30" fill="url(#lkIris)"/><ellipse class="lk-pupil" cx="160" cy="240" rx="11" ry="15" fill="#2a1408"/><g fill="#fff"><use class="lk-spark" href="#lkStar" transform="translate(152 228) scale(8)"/><circle cx="170" cy="250" r="4.2"/><circle cx="148" cy="252" r="2.2" opacity=".8"/></g></g><rect class="lk-lid" x="120" y="196" width="80" height="0" fill="#f4c9b3"/></g><path d="M130 232 Q158 200 190 224" fill="none" stroke="#2a1408" stroke-width="5" stroke-linecap="round"/></g>' +
      '<g id="lkEyeRg" class="lk-eye"><ellipse cx="240" cy="238" rx="28" ry="33" fill="#fffaf2"/><g clip-path="url(#lkEyeR)"><g class="lk-iris"><ellipse cx="240" cy="240" rx="25" ry="30" fill="url(#lkIris)"/><ellipse class="lk-pupil" cx="240" cy="240" rx="11" ry="15" fill="#2a1408"/><g fill="#fff"><use class="lk-spark" href="#lkStar" transform="translate(232 228) scale(8)"/><circle cx="250" cy="250" r="4.2"/><circle cx="228" cy="252" r="2.2" opacity=".8"/></g></g><rect class="lk-lid" x="200" y="196" width="80" height="0" fill="#f4c9b3"/></g><path d="M210 224 Q242 200 270 232" fill="none" stroke="#2a1408" stroke-width="5" stroke-linecap="round"/></g>' +
    '</g>' +
    '<g id="lkBrows" fill="none" stroke="#9a86c9" stroke-width="3.2" stroke-linecap="round"><path id="lkBrowL" d="M134 196 Q158 184 184 196"/><path id="lkBrowR" d="M216 196 Q242 184 266 196"/></g>' +
    '<ellipse cx="200" cy="262" rx="3.2" ry="2.2" fill="#e9a894"/>' +
    '<g id="lkMouth"><path id="lkMouthP" d="M186 282 Q200 292 214 282" fill="none" stroke="#b0545e" stroke-width="3.2" stroke-linecap="round"/></g>' +
    '<path id="lkTear" d="M126 262 q-6 12 0 16 q6 -4 0 -16Z" fill="#9fe7ff" opacity="0"/>' +
    /* hair bangs and locks in front of face */
    '<path d="M110 232 C100 170 138 120 200 118 C262 120 300 170 290 232 C286 200 270 178 250 170 C262 192 240 206 222 200 C230 184 214 170 200 168 C186 170 170 184 178 200 C160 206 138 192 150 170 C130 178 114 200 110 232Z" fill="url(#lkHair)"/>' +
    '<path d="M104 214 C90 250 96 300 110 336 C128 304 132 262 122 226Z" fill="url(#lkHair)"/><path d="M296 214 C310 250 304 300 290 336 C272 304 268 262 278 226Z" fill="url(#lkHair)"/>' +
    '<path d="M132 150 C152 130 176 124 200 124" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>' +
    /* hood front + trim + star */
    '<path d="M98 236 C86 118 140 52 200 48 C262 52 314 120 302 236 C296 182 270 130 200 124 C130 130 104 182 98 236Z" fill="url(#lkHood)"/>' +
    '<path d="M102 226 C96 130 144 62 200 58 C256 62 304 130 298 226" fill="none" stroke="url(#lkGold)" stroke-width="2.4"/>' +
    '<g fill="url(#lkGold)"><use href="#lkStar" transform="translate(130 112) scale(7)"/><use href="#lkStar" transform="translate(274 114) scale(6)"/><use href="#lkStar" transform="translate(112 168) scale(5)"/><use href="#lkStar" transform="translate(290 170) scale(5)"/></g>' +
    '<g id="lkCrown" class="lk-crown" tabindex="0" role="button" aria-label="The golden star on her hood. Tap for stardust"><circle cx="200" cy="64" r="34" fill="url(#lkGlow)" opacity=".6"/><use href="#lkStar" transform="translate(200 62) scale(36)" fill="url(#lkGold)"/><use href="#lkStar" transform="translate(200 62) scale(19)" fill="#fff6c8" opacity=".75"/></g>' +
  '</g>' +
  '<g id="lkFx"></g></g>' +
  '</svg>';

  host.innerHTML = SVG;
  var svg = host.querySelector('svg');
  var $ = function (id) { return svg.querySelector('#' + id); };
  var ns = 'http://www.w3.org/2000/svg';

  /* ---- decoration ---- */
  var ticks = $('lkTicks');
  for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6, l = document.createElementNS(ns, 'line'); l.setAttribute('x1', 200 + Math.sin(a) * 23); l.setAttribute('y1', 410 - Math.cos(a) * 23); l.setAttribute('x2', 200 + Math.sin(a) * 28); l.setAttribute('y2', 410 - Math.cos(a) * 28); ticks.appendChild(l); }
  var sg = $('lkStars'); for (i = 0; i < 26; i++) { var c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', (Math.random() * 400).toFixed(0)); c.setAttribute('cy', (Math.random() * 300).toFixed(0)); c.setAttribute('r', (Math.random() * 1.6 + .5).toFixed(1)); c.setAttribute('class', 'lk-tw'); c.style.animationDelay = (-Math.random() * 4).toFixed(1) + 's'; sg.appendChild(c); }

  /* ---- moods: mouth, brows, lids, pupil size, blush ---- */
  var MOODS = {
    curious:    { mouth: 'M192 284 Q200 276 208 284 Q200 292 192 284Z', fill: '#b0545e', browL: 'M134 190 Q158 176 184 192', browR: 'M216 196 Q242 188 266 200', lid: 0, pup: 1.05, say: 'Hm? What is that?' },
    happy:      { mouth: 'M176 276 Q200 312 224 276 Q200 284 176 276Z', fill: '#b0545e', tongue: true, browL: 'M134 192 Q158 180 184 192', browR: 'M216 192 Q242 180 266 192', lid: 15, pup: 1.1, say: 'Hehe! That tickles.' },
    thoughtful: { mouth: 'M190 284 Q200 282 210 286', browL: 'M134 198 Q158 190 184 192', browR: 'M216 190 Q240 184 266 194', lid: 3, pup: .95, say: 'Let me think about that…' },
    determined: { mouth: 'M186 282 L214 282', browL: 'M134 192 L184 202', browR: 'M216 202 L266 192', lid: 4, pup: 1, say: 'I am not stopping now.' },
    sad:        { mouth: 'M186 288 Q200 276 214 288', browL: 'M134 202 Q158 188 184 196', browR: 'M216 196 Q242 188 266 202', lid: 6, pup: 1.15, tear: true, say: 'I remember something I wish I did not.' },
    surprised:  { mouth: 'M193 280 Q200 274 207 280 Q208 296 200 298 Q192 296 193 280Z', fill: '#b0545e', browL: 'M134 184 Q158 168 184 184', browR: 'M216 184 Q242 168 266 184', lid: -4, pup: .85, say: 'Oh! You startled me.' }
  };
  var mood = 'curious', moodUntil = 0;
  var mouth = $('lkMouthP'), tear = $('lkTear');
  var tongue = document.createElementNS(ns, 'ellipse'); tongue.setAttribute('cx', 200); tongue.setAttribute('cy', 296); tongue.setAttribute('rx', 9); tongue.setAttribute('ry', 5); tongue.setAttribute('fill', '#ff8fa3'); tongue.style.opacity = 0; $('lkMouth').insertBefore(tongue, mouth);
  function setMood(m, ms) {
    var d = MOODS[m]; if (!d) return; mood = m; moodUntil = ms ? performance.now() + ms : 0;
    mouth.setAttribute('d', d.mouth); mouth.setAttribute('fill', d.fill || 'none');
    tongue.style.opacity = d.tongue ? 1 : 0; tear.style.opacity = d.tear ? .9 : 0;
    $('lkBrowL').setAttribute('d', d.browL); $('lkBrowR').setAttribute('d', d.browR);
    Array.prototype.forEach.call(svg.querySelectorAll('.lk-lid'), function (r) { r.setAttribute('height', Math.max(0, d.lid * 2)); });
    Array.prototype.forEach.call(svg.querySelectorAll('.lk-pupil'), function (p) { p.style.transform = 'scale(' + d.pup + ')'; });
    svg.setAttribute('data-mood', m);
    Array.prototype.forEach.call(document.querySelectorAll('.lk-mood'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === m)); });
    var st = document.getElementById('lkStatus'); if (st) st.textContent = 'Kairo feels ' + m + '.';
  }
  setMood('curious');

  /* ---- gaze: pupils, head, ears, body all respond to the pointer ---- */
  var g = { x: 0, y: 0, tx: 0, ty: 0, near: 0 }, lastMove = performance.now(), reduce = function () { return window.K ? !K.motionOK() : false; };
  function toSvg(cx, cy) { var r = svg.getBoundingClientRect(); return { x: (cx - r.left) / r.width * 400, y: (cy - r.top) / r.height * 470 }; }
  function aim(cx, cy) {
    var p = toSvg(cx, cy), dx = p.x - 200, dy = p.y - 238;
    var d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160);
    g.tx = dx / d * k; g.ty = dy / d * k; g.dist = d; lastMove = performance.now();
    var r = svg.getBoundingClientRect(); g.far = Math.hypot(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2));
    /* very close to her face: startle once */
    if (d < 70 && !g.close && performance.now() > moodUntil) { g.close = true; setMood('surprised', 1400); }
    if (d > 110) g.close = false;
  }
  window.addEventListener('pointermove', function (e) { aim(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener('touchmove', function (e) { if (e.touches[0]) aim(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  window.addEventListener('touchstart', function (e) { if (e.touches[0]) aim(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  var irises = svg.querySelectorAll('.lk-iris'), head = $('lkHead'), eyes = $('lkEyes'), earL = $('lkEarLg'), earR = $('lkEarRg'), body = $('lkBody'), hands = $('lkHands'), halo = $('lkHalo');
  var wig = { l: 0, r: 0 }, blink = 0, nextBlink = performance.now() + 2500, raf = 0, wander = 0;

  function frame(t) {
    raf = 0;
    var idle = t - lastMove > 7000;
    if (idle && !reduce()) { /* eyes wander when nobody is around */
      g.tx = Math.sin(t / 1900) * .8; g.ty = Math.cos(t / 2600) * .35;
    }
    g.x += (g.tx - g.x) * .14; g.y += (g.ty - g.y) * .14;
    var sx = g.x * 8, sy = g.y * 6;
    for (var i = 0; i < irises.length; i++) irises[i].style.transform = 'translate(' + sx.toFixed(2) + 'px,' + sy.toFixed(2) + 'px)';
    head.style.transform = 'translate(' + (g.x * 6).toFixed(2) + 'px,' + (g.y * 3.5).toFixed(2) + 'px) rotate(' + (g.x * 3.2).toFixed(2) + 'deg)';
    eyes.style.transform = 'translate(' + (g.x * 2).toFixed(2) + 'px,' + (g.y * 1.5).toFixed(2) + 'px)';
    var bob = reduce() ? 0 : Math.sin(t / 900) * 2.2;
    body.style.transform = 'translate(' + (-g.x * 3).toFixed(2) + 'px,' + bob.toFixed(2) + 'px)';
    var sw = reduce() ? 0 : Math.sin(t / 700) * 1.8;
    earL.style.transform = 'rotate(' + (-g.x * 4 + sw + wig.l).toFixed(2) + 'deg)'; earR.style.transform = 'rotate(' + (-g.x * 4 - sw * .8 - wig.r).toFixed(2) + 'deg)';
    wig.l *= .92; wig.r *= .92;
    halo.setAttribute('opacity', (.5 + (reduce() ? 0 : Math.sin(t / 600) * .1) + flare).toFixed(2)); flare *= .94;
    /* blinking */
    if (t > nextBlink && !reduce()) { blink = 1; nextBlink = t + 2200 + Math.random() * 3200; }
    if (blink > 0) { blink -= .12; }
    var b = blink > 0 ? Math.sin(Math.max(0, blink) * Math.PI) : 0;
    var lidH = Math.max(0, MOODS[mood].lid * 2) + b * 70;
    var lids = svg.querySelectorAll('.lk-lid'); for (i = 0; i < lids.length; i++) lids[i].setAttribute('height', lidH.toFixed(1));
    if (moodUntil && t > moodUntil) { setMood(baseMood()); }
    raf = requestAnimationFrame(frame);
  }
  var flare = 0;
  function baseMood() { return window.K && K.settings && K.settings.theme === 'twilight' ? 'happy' : 'curious'; }

  /* ---- interactions ---- */
  function fx(x, y, glyph, color) {
    if (reduce()) return; var layer = $('lkFx');
    for (var i = 0; i < 8; i++) {
      var s = document.createElementNS(ns, 'use'); s.setAttribute('href', '#lkStar'); var ang = Math.random() * 6.28, d = 30 + Math.random() * 40, sc = 4 + Math.random() * 6;
      s.setAttribute('fill', color || '#ffe28a'); s.setAttribute('class', 'lk-burst'); s.style.setProperty('--dx', (Math.cos(ang) * d).toFixed(0) + 'px'); s.style.setProperty('--dy', (Math.sin(ang) * d).toFixed(0) + 'px');
      s.setAttribute('transform', 'translate(' + x + ' ' + y + ') scale(' + sc + ')'); layer.appendChild(s); (function (n) { setTimeout(function () { n.remove(); }, 900); })(s);
    }
  }
  function say(t, m) { if (window.K && K.say) K.say(t, m, 4500); var st = document.getElementById('lkStatus'); if (st) st.textContent = t; }
  function act(el, fn) { el.addEventListener('click', fn); el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }); }
  var faceClicks = 0, faceT = 0;
  act($('lkEarLg'), function () { wig.l = 14; fx(40, 260, 0, '#9fe7ff'); setMood('happy', 1600); if (K.sound) K.sound.play('click'); });
  act($('lkEarRg'), function () { wig.r = 14; fx(360, 255, 0, '#ffb3e6'); setMood('surprised', 1200); if (K.sound) K.sound.play('click'); });
  act($('lkCrown'), function () { fx(200, 62, 0, '#fff0a8'); setMood('curious', 1200); if (window.K && K.sound) K.sound.play('egg'); say('The star has a story. Find the one with a missing point.', 'thoughtful'); });
  act($('lkLantern'), function () { flare = .5; fx(200, 410, 0, '#ffe9a0'); if (K.sound) K.sound.play('bell'); setMood('thoughtful', 1800); say('Its clock has no hands. It still keeps time.', 'thoughtful'); if (window.K && K.bump) K.bump('liveLantern'); });
  /* tap her body: she spins around and comes back with a new expression */
  var order = ['happy', 'surprised', 'thoughtful', 'determined', 'sad', 'curious'], oi = 0, spinning = false;
  function spin() {
    if (spinning) return; spinning = true; var all = $('lkAll');
    var next = order[oi++ % order.length]; if (next === mood) next = order[oi++ % order.length];
    if (reduce()) { setMood(next, 4000); say(MOODS[next].say, next); spinning = false; return; }
    all.classList.remove('lk-spin'); void all.getBoundingClientRect(); all.classList.add('lk-spin');
    setTimeout(function () { setMood(next, 4000); say(MOODS[next].say, next); }, 330);
    setTimeout(function () { all.classList.remove('lk-spin'); spinning = false; }, 720);
    if (window.K && K.sound) K.sound.play('rewind');
  }
  svg.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.lk-ear, .lk-crown, .lk-lantern')) return;
    var q = toSvg(e.clientX, e.clientY);
    if (q.y > 318 || (e.target.closest && e.target.closest('#lkHands, #lkTorso'))) { spin(); return; }
    var p = q;
    if (p.y > 140 && p.y < 330 && Math.abs(p.x - 200) < 100) { /* tapped her face */
      faceClicks++; clearTimeout(faceT); faceT = setTimeout(function () { faceClicks = 0; }, 1500);
      if (faceClicks >= 3) { setMood('happy', 2600); say('Okay okay, that is ticklish! Hehe.', 'happy'); fx(200, 250, 0, '#ffd1e8'); faceClicks = 0; if (K.sound) K.sound.play('egg'); }
      else { setMood('surprised', 700); }
    }
  });
  /* hold the pointer still on her for a moment: she smiles */
  var hoverT = 0;
  svg.addEventListener('pointerenter', function () { hoverT = setTimeout(function () { if (performance.now() > moodUntil) setMood('happy', 2200); }, 1400); });
  svg.addEventListener('pointerleave', function () { clearTimeout(hoverT); });

  /* mood buttons + theme sync */
  Array.prototype.forEach.call(document.querySelectorAll('.lk-mood'), function (b) { b.addEventListener('click', function () { var m = b.getAttribute('data-m'); setMood(m); say(MOODS[m].say, m); }); });
  var follow = document.getElementById('lkFollow');
  if (follow) follow.addEventListener('click', function () { g.tx = 0; g.ty = 0; lastMove = performance.now(); });
  document.addEventListener('kairo:settings', function () { if (!moodUntil && !window.__lkManual) setMood(baseMood()); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) raf = requestAnimationFrame(frame); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { if (en[0].isIntersecting) { if (!raf) raf = requestAnimationFrame(frame); } else { cancelAnimationFrame(raf); raf = 0; } }, { threshold: 0.02 }).observe(svg); else raf = requestAnimationFrame(frame);
  window.KairoLive = { setMood: setMood, aim: aim };
})();
