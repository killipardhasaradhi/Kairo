/* extras.js: sparkle cursor, local guestbook, honest visit counter, credits */
(function () {
  'use strict';
  var E = K.el;

  /* ---------- sparkle cursor (mouse only, never blocks clicks or text selection) ---------- */
  function sparkles() {
    var layer = K.$('#sparkles'), last = 0, alive = 0, glyphs = ['✦', '★', '✧', '✶'];
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !K.settings.sparkle || !K.motionOK()) return;
      var now = performance.now(); if (now - last < 45 || alive > 24) return; last = now;
      var s = document.createElement('span');
      s.className = 'sp'; s.textContent = glyphs[(Math.random() * glyphs.length) | 0];
      s.style.left = e.clientX + (Math.random() * 10 - 5) + 'px'; s.style.top = e.clientY + (Math.random() * 10 - 5) + 'px';
      s.style.setProperty('--dx', (Math.random() * 30 - 15).toFixed(0) + 'px');
      s.style.color = ['#f2c768', '#5de8f5', '#a98bff'][(Math.random() * 3) | 0];
      layer.appendChild(s); alive++;
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); alive--; }, 950);
    }, { passive: true });
  }

  /* ---------- visit counter: local only, labelled as such ---------- */
  function counter() {
    var n = K.store.get('visits', 0);
    var counted = false; try { counted = sessionStorage.getItem('kairo:counted') === '1'; } catch (e) { /* ignore */ }
    if (!counted) { n++; K.store.set('visits', n); try { sessionStorage.setItem('kairo:counted', '1'); } catch (e) { /* ignore */ } }
    var s = String(n); while (s.length < 4) s = '0' + s;
    K.$('#odometer').textContent = s;
    K.$('#odometer').setAttribute('aria-label', 'You have visited ' + n + ' times from this device');
  }

  /* ---------- guestbook (localStorage only) ---------- */
  function guestbook() {
    var form = K.$('#gbForm'), name = K.$('#gbName'), msg = K.$('#gbMsg'), count = K.$('#gbCount'), err = K.$('#gbErr'), list = K.$('#gbList'), empty = K.$('#gbEmpty');
    var notes = K.store.get('guestbook', []);
    function draw() {
      K.clear(list);
      notes.slice().reverse().forEach(function (n) {
        list.appendChild(E('li', null, E('div', { class: 'who', text: n.name || 'A fellow wanderer' }), E('div', { text: n.msg })));
      });
      empty.hidden = notes.length > 0; K.$('#gbClear').hidden = notes.length === 0;
    }
    msg.addEventListener('input', function () { count.textContent = msg.value.length + ' / 140'; err.textContent = ''; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = msg.value.replace(/\s+/g, ' ').trim(), nm = name.value.replace(/\s+/g, ' ').trim();
      if (!m) { err.textContent = 'Please write a short message first.'; msg.focus(); return; }
      if (m.length > 140) { err.textContent = 'Please keep it to 140 characters.'; return; }
      var combined = m + ' ' + nm;
      if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(combined) || /(\+?\d[\s().-]?){7,}/.test(combined) || /https?:\/\/|www\./i.test(combined)) {
        err.textContent = 'Please leave out emails, phone numbers, and links.'; return;
      }
      notes.push({ name: nm.slice(0, 24), msg: m, t: Date.now() });
      if (notes.length > 20) notes.shift();
      K.store.set('guestbook', notes);
      msg.value = ''; count.textContent = '0 / 140'; err.textContent = '';
      draw(); K.toast('Note saved on this device', 'Kairo reads it, and wonders if it has read it before.');
    });
    K.$('#gbClear').addEventListener('click', function () {
      if (!window.confirm('Delete all guestbook notes stored on this device?')) return;
      notes = []; K.store.del('guestbook'); draw();
    });
    draw();
  }

  /* ---------- credits ---------- */
  function credits() {
    K.$('#openCredits').addEventListener('click', function () {
      K.modal('Credits', [
        E('p', null, E('strong', { text: 'Character, story and world: ' }), 'Kairo, Stillhour, and everything in the story are original creations made for this hackathon.'),
        E('p', null, E('strong', { text: 'Character art: ' }), 'Kairo’s character sheet and its cropped illustrations (hero, expressions, turnaround, shadow, locations, project icons). Crops and cleanup were done for the web. Add the artist or tool credit here before submitting. See the README.'),
        E('p', null, E('strong', { text: 'Code: ' }), 'Plain HTML, CSS, and JavaScript. Written with help from Claude (Anthropic), an AI coding assistant, which the hackathon rules allow.'),
        E('p', null, E('strong', { text: 'Fonts: ' }), 'Cinzel, Nunito, Caveat, and VT323 from Google Fonts, all under the SIL Open Font License.'),
        E('p', null, E('strong', { text: 'Sound: ' }), 'Every sound is synthesised in your browser with the Web Audio API. There are no audio files, and sound is off until you turn it on.'),
        E('p', null, E('strong', { text: 'Libraries: ' }), 'None.')
      ]);
    });
  }

  function boot() { sparkles(); counter(); guestbook(); credits(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
