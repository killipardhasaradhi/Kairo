/* archive.js: secret map (with a ninth place), the fictional terminal and its ciphers,
   your personal report + share code, and an honest two-visitor comparison. All local; no server. */
(function () {
  'use strict';
  var E = K.el;

  /* ================= the map (idea 9) ================= */
  var NODES = [
    { id: 'prologue', name: 'The lantern', x: 8, y: 70, text: 'Where the message begins: a clock with no hands.' },
    { id: 'stillhour', name: 'Stillhour', x: 24, y: 40, text: 'The town that repeats one minute.' },
    { id: 'workshop', name: 'The workshop', x: 40, y: 72, text: 'Drawings, a missing-point star, and knocks in the wall.' },
    { id: 'library', name: 'Library of Unwritten Days', x: 56, y: 36, text: 'The book KAIRO — FINAL LOOP and its warnings.' },
    { id: 'mirror', name: 'The mirror room', x: 70, y: 70, text: 'A reflection that moves first.' },
    { id: 'truth', name: 'The truth', x: 82, y: 32, text: 'How the loop was built, and by whom.' },
    { id: 'tower', name: 'The clock tower', x: 92, y: 62, text: 'The thirteenth bell, and the choice.' },
    { id: 'epilogue', name: 'The sky door', x: 96, y: 18, text: 'Knocks from the other side.' },
    { id: 'ninth', name: 'The Observer’s Room', x: 50, y: 8, text: '', secret: true }
  ];
  function ninthOpen() { return K.truth || K.found.length >= 9 || K.hasSecret('ninth'); }

  function drawMap() {
    var box = K.$('#mapBox'); if (!box) return; K.clear(box);
    var vis = (K.story && K.story.state && K.story.state.visited) || {};
    var svg = '<svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">';
    for (var i = 0; i < NODES.length - 2; i++) svg += '<line x1="' + NODES[i].x + '" y1="' + NODES[i].y + '" x2="' + NODES[i + 1].x + '" y2="' + NODES[i + 1].y + '"/>';
    if (ninthOpen()) svg += '<line class="secret" x1="50" y1="8" x2="56" y2="36"/><line class="secret" x1="50" y1="8" x2="82" y2="32"/>';
    svg += '</svg>';
    box.appendChild(K.svg(svg));
    NODES.forEach(function (n) {
      if (n.secret && !ninthOpen()) return;
      var visited = n.secret ? K.hasSecret('ninth') : vis[n.id];
      var b = E('button', { type: 'button', class: 'map-node' + (visited ? ' visited' : '') + (n.secret ? ' secret' : ''), style: { left: n.x + '%', top: n.y + '%' }, 'aria-label': n.name + (visited ? ' (visited)' : '') }, E('span', { text: n.secret ? '✦' : String(NODES.indexOf(n) + 1) }), E('small', { text: n.name }));
      b.addEventListener('click', function () { nodeDetail(n); });
      box.appendChild(b);
    });
    var note = K.$('#mapNote');
    if (note) note.textContent = ninthOpen() ? 'The story has eight scenes. This map has nine places.' : 'Eight places are marked. A ninth may appear once you understand the truth (understand it in the story, or find nine clues).';
  }
  function nodeDetail(n) {
    var d = K.clear(K.$('#mapDetail'));
    if (n.secret) { K.secret('ninth'); drawMap(); terminal(d); return; }
    var clues = K.clues.filter(function (c) { return c.scene === n.id; });
    d.appendChild(E('h4', { text: n.name }));
    d.appendChild(E('p', { text: n.text }));
    if (clues.length) d.appendChild(E('p', { class: 'small-note', text: 'Clues here: ' + clues.map(function (c) { return K.hasClue(c.id) ? c.name : '???'; }).join(', ') }));
    var go = E('button', { type: 'button', class: 'btn small' }, 'Go to this scene');
    go.addEventListener('click', function () { K.story.go(n.id); var s = K.$('#story'); if (s && K.story.mode !== 'scroll') s.scrollIntoView(); });
    d.appendChild(go);
  }

  /* ================= the terminal and its ciphers (idea 10) ================= */
  function tomorrow() {
    var t = new Date(Date.now() + 864e5), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()) + ' 03:13';
  }
  function rot13(s) { return s.replace(/[A-Za-z]/g, function (c) { var b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b); }); }
  function a1z26(s) { return s.replace(/[^A-Z]/g, '').split('').map(function (c) { return c.charCodeAt(0) - 64; }).join(' '); }
  var FILES = [
    { n: 1, plain: 'THE NEXT SCENE CANNOT BE TRUSTED', cipher: rot13('THE NEXT SCENE CANNOT BE TRUSTED'), clue: 'bell13', method: 'Each letter moved forward by the number of the missing bell.', key: 'The bell that was not marked. Count the marks on the lantern clock, then count one more.' },
    { n: 2, plain: 'SHE BLINKS FIRST', cipher: 'SHE BLINKS FIRST'.split('').reverse().join(''), clue: 'mirror', method: 'Read it the way the mirror room would.', key: 'A mirror reverses. Reverse the whole line.' },
    { n: 3, plain: 'LISTEN', cipher: a1z26('LISTEN'), clue: 'knocks', method: 'Numbers standing in for letters, in order.', key: 'The knocks in the wall were counted, not heard. A is 1.' }
  ];
  function norm(s) { return (s || '').toUpperCase().replace(/[^A-Z ]/g, '').replace(/\s+/g, ' ').trim(); }
  function terminal(host) {
    host.appendChild(E('h4', { text: 'The Observer’s Room' }));
    host.appendChild(E('p', { class: 'small-note term-warn', text: 'This terminal is part of the fiction. It runs no real commands, reads nothing from your device, and sends nothing anywhere.' }));
    var log = E('div', { class: 'term-log', role: 'log', 'aria-live': 'polite', tabindex: '0' });
    var form = E('form', { class: 'term-form', autocomplete: 'off' });
    var inp = E('input', { class: 'term-in', 'aria-label': 'Terminal command', placeholder: 'type help', autocapitalize: 'off', spellcheck: 'false' });
    form.appendChild(E('span', { class: 'prompt', text: 'observer>' })); form.appendChild(inp);
    host.appendChild(log); host.appendChild(form);
    function out(t, cls) { log.appendChild(E('div', { class: cls || '', text: t })); log.scrollTop = log.scrollHeight; }
    function solved() { return K.flag('cipherSolved') || []; }
    out('— MESSAGE RECEIVED — timestamp ' + tomorrow() + ' (tomorrow) —', 'term-ts');
    out('Kairo. Do not trust the next scene you open.');
    out('You will know it by the details. Count the marks if you must.');
    out('— end of message. 3 files attached. type “files” —');
    K.setFlag('warnedNext', true); K.audio.whisper('mirror'); K.sound.play('beep');
    K.secret('terminal');
    if (K.setDanger) K.setDanger(0.8);
    function cmd(line) {
      var parts = line.trim().split(/\s+/), c = (parts.shift() || '').toLowerCase();
      out('observer> ' + line, 'echo');
      if (!c) return;
      if (c === 'help') out('Commands: files, open N, key N, solve N <answer>, time, whoami, clear, exit');
      else if (c === 'files') FILES.forEach(function (f) { out('file ' + f.n + (solved().indexOf(f.n) !== -1 ? '  [decoded]' : '  [encrypted]')); });
      else if (c === 'open' || c === 'key' || c === 'solve') {
        var f = FILES[(+parts[0]) - 1]; if (!f) { out('No such file. Try “files”.'); return; }
        if (c === 'open') { out('file ' + f.n + ': ' + f.cipher); out('method: ' + f.method); }
        else if (c === 'key') { if (K.hasClue(f.clue)) out('key unlocked by your clue “' + K.clueById[f.clue].name + '”: ' + f.key); else out('You do not hold the clue this key depends on yet.'); }
        else {
          var ans = norm(parts.slice(1).join(' '));
          if (ans === f.plain) {
            var s = solved(); if (s.indexOf(f.n) === -1) { s.push(f.n); K.setFlag('cipherSolved', s); K.sound.play('clue'); }
            out('DECODED: ' + f.plain, 'ok');
            if (s.length === 3) { out('— final file —', 'term-ts'); out('You were never the first to open the door. You are the first to read this.', 'ok'); K.secret('ciphers'); K.setFlag('observerRead', true); if (K.say) K.say('Someone watched the whole loop. Not to stop it. To witness it.', 'sad', 9000); }
          } else out('That does not decode. Check the method with “open ' + f.n + '”.');
        }
      }
      else if (c === 'time') out('It is tomorrow, here. ' + tomorrow());
      else if (c === 'whoami') out('A visitor, in a browser tab. This terminal cannot see anything else.');
      else if (c === 'clear') K.clear(log);
      else if (c === 'exit') K.clear(host);
      else out('unknown command. type help');
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = inp.value; inp.value = ''; cmd(v); });
    inp.focus({ preventScroll: true });
    drawSecrets();
  }

  /* ================= secrets list (all 13) ================= */
  function drawSecrets() {
    var ul = K.$('#secList'); if (!ul) return; K.clear(ul);
    var n = 0;
    K.SECRETS.forEach(function (d) {
      var has = K.hasSecret(d.id); if (has) n++;
      ul.appendChild(E('li', { class: has ? 'found' : '' }, E('strong', { text: has ? d.name : '???' }), E('span', { text: has ? ' Found.' : ' Hint: ' + d.hint })));
    });
    K.$('#secCount').textContent = n + ' of ' + K.SECRETS.length;
  }

  /* ================= report + share code (idea 11) ================= */
  var ARCH = [
    ['The Witness', 'You read the Observer’s files to the end. You know someone was watching, and you stayed to understand why.', function (c) { return K.flag('observerRead'); }],
    ['The Skeptic', 'You caught the story lying and still chose. You trust evidence over voices, including your own reflection.', function (c) { return K.flag('caughtLie'); }],
    ['The Believer', 'You trusted the other Kairo and let tomorrow arrive. You believe a stranger with your face can be right.', function (c) { return c.trust === 'trust' && c.free; }],
    ['The Seeker', 'You followed the evidence alone, right to the bell. Clues, not voices, led you.', function (c) { return c.trust === 'alone' && c.free; }],
    ['The Keeper', 'You chose the loop. Stillhour is safe, and still waiting.', function (c) { return !c.free && c.resets > 0; }],
    ['The Shadow-Watcher', 'You looked where nobody looks, and noticed the shadow before it noticed you.', function (c) { return K.hasSecret('shadow'); }],
    ['The Wanderer', 'You are still walking. The mystery will wait, but it remembers you.', function () { return true; }]
  ];
  function snapshot() {
    var st = K.story.state;
    return { clues: K.found.slice(), secrets: Object.keys(K.secrets), trust: st.trust || null, free: !!st.free, resets: st.resets || 0, lie: !!K.flag('caughtLie'), mlie: !!K.flag('mirrorLies'), whisper: !!K.flag('whispered'), obs: !!K.flag('observerRead') };
  }
  function archetype(c) { for (var i = 0; i < ARCH.length; i++) if (ARCH[i][2](c)) return ARCH[i]; return ARCH[ARCH.length - 1]; }
  function encode(c) {
    var a = 0, b = 0;
    K.clues.forEach(function (x, i) { if (c.clues.indexOf(x.id) !== -1) a |= (1 << i); });
    a |= ({ null: 0, trust: 1, alone: 2 }[c.trust] || 0) << 12; a |= (c.free ? 1 : 0) << 14; a |= Math.min(7, c.resets) << 15; a |= (c.lie ? 1 : 0) << 18; a |= (c.mlie ? 1 : 0) << 19; a |= (c.whisper ? 1 : 0) << 20; a |= (c.obs ? 1 : 0) << 21;
    K.SECRETS.forEach(function (x, i) { if (c.secrets.indexOf(x.id) !== -1) b |= (1 << i); });
    return 'KRO-' + a.toString(36).toUpperCase() + '-' + b.toString(36).toUpperCase();
  }
  function decode(code) {
    var m = /^KRO-([0-9A-Z]{1,6})-([0-9A-Z]{1,4})$/.exec((code || '').trim().toUpperCase()); if (!m) return null;
    var a = parseInt(m[1], 36), b = parseInt(m[2], 36); if (isNaN(a) || isNaN(b) || a >= (1 << 22) || b >= (1 << 13)) return null;
    var c = { clues: [], secrets: [], trust: [null, 'trust', 'alone'][(a >> 12) & 3] || null, free: !!((a >> 14) & 1), resets: (a >> 15) & 7, lie: !!((a >> 18) & 1), mlie: !!((a >> 19) & 1), whisper: !!((a >> 20) & 1), obs: !!((a >> 21) & 1) };
    K.clues.forEach(function (x, i) { if (a & (1 << i)) c.clues.push(x.id); });
    K.SECRETS.forEach(function (x, i) { if (b & (1 << i)) c.secrets.push(x.id); });
    return c;
  }
  function ending(c) {
    if (!c.free) return c.resets ? 'The loop continues' : 'Not yet decided';
    if (c.whisper) return 'Tomorrow, remembered';
    return c.trust === 'trust' ? 'Tomorrow, together' : c.trust === 'alone' ? 'Tomorrow, alone' : 'Tomorrow arrives';
  }
  function drawReport() {
    var box = K.$('#reportBox'); if (!box) return; K.clear(box);
    var c = snapshot(), a = archetype(c), code = encode(c);
    box.appendChild(E('div', { class: 'report-card' },
      E('p', { class: 'eyebrow', text: 'You are' }), E('h4', { class: 'arch', text: a[0] }), E('p', { text: a[1] }),
      E('ul', { class: 'stats' },
        E('li', null, E('strong', { text: c.clues.length + ' / 12' }), ' clues'),
        E('li', null, E('strong', { text: c.secrets.length + ' / ' + K.SECRETS.length }), ' secrets'),
        E('li', null, E('strong', { text: c.trust === 'trust' ? 'Trusted the other Kairo' : c.trust === 'alone' ? 'Followed the evidence alone' : 'Undecided' })),
        E('li', null, E('strong', { text: ending(c) }), ' ending')),
      E('p', { class: 'small-note', text: 'Your report code' }), E('p', { class: 'code', text: code })));
    var row = E('div', { class: 'row' });
    var copy = E('button', { type: 'button', class: 'btn small' }, 'Copy code'); copy.addEventListener('click', function () { try { navigator.clipboard.writeText(code).then(function () { K.toast('Code copied', code); }, function () { K.toast('Copy failed', 'Select the code and copy it by hand.'); }); } catch (e) { K.toast('Copy failed', 'Select the code and copy it by hand.'); } });
    var png = E('button', { type: 'button', class: 'btn small ghost' }, 'Download report image'); png.addEventListener('click', function () { image(c, a, code); });
    var shr = E('button', { type: 'button', class: 'btn small ghost' }, 'Share…');
    shr.addEventListener('click', function () { var t = 'My Kairo report: ' + a[0] + ' · ' + c.clues.length + '/12 clues · code ' + code; if (navigator.share) navigator.share({ title: 'Kairo report', text: t }).catch(function () {}); else try { navigator.clipboard.writeText(t); K.toast('Copied for sharing', t); } catch (e) { K.toast('Share text', t); } });
    row.appendChild(copy); row.appendChild(png); row.appendChild(shr); box.appendChild(row);
  }
  function image(c, a, code) {
    var cv = document.createElement('canvas'); cv.width = 900; cv.height = 520; var g = cv.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 900, 520); gr.addColorStop(0, '#0c1230'); gr.addColorStop(1, '#2a1b52'); g.fillStyle = gr; g.fillRect(0, 0, 900, 520);
    g.fillStyle = '#f2c768'; g.font = '700 22px serif'; g.fillText('★ KAIRO — Someone Is Resetting Tomorrow', 40, 60);
    g.fillStyle = '#fff'; g.font = '700 54px serif'; g.fillText(a[0], 40, 150);
    g.font = '20px sans-serif'; g.fillStyle = '#cfd6ff';
    var words = a[1].split(' '), line = '', y = 200; words.forEach(function (w) { var t = line + w + ' '; if (g.measureText(t).width > 820) { g.fillText(line, 40, y); y += 28; line = w + ' '; } else line = t; }); g.fillText(line, 40, y);
    g.fillStyle = '#f2c768'; g.font = '700 26px sans-serif'; g.fillText(c.clues.length + '/12 clues   ' + c.secrets.length + '/' + K.SECRETS.length + ' secrets   ' + ending(c), 40, 360);
    g.fillStyle = '#5de8f5'; g.font = '700 34px monospace'; g.fillText(code, 40, 440);
    g.fillStyle = '#9aa3d6'; g.font = '16px sans-serif'; g.fillText('Compare codes with a friend on the Kairo site. No data leaves your device.', 40, 490);
    var link = document.createElement('a'); link.download = 'kairo-report.png'; link.href = cv.toDataURL('image/png'); document.body.appendChild(link); link.click(); link.remove();
  }

  /* ================= compare two visitors, honestly (idea 12) ================= */
  function compare(code) {
    var out = K.clear(K.$('#cmpOut')), them = decode(code);
    if (!them) { out.appendChild(E('p', { class: 'err', text: 'That does not look like a Kairo code. It should look like KRO-1A2B-3C.' })); return; }
    var me = snapshot();
    function names(ids, list) { return ids.map(function (i) { return list.filter(function (x) { return x.id === i; })[0].name; }); }
    var onlyMe = me.clues.filter(function (x) { return them.clues.indexOf(x) === -1; }), onlyThem = them.clues.filter(function (x) { return me.clues.indexOf(x) === -1; });
    var union = K.clues.filter(function (x) { return me.clues.indexOf(x.id) !== -1 || them.clues.indexOf(x.id) !== -1; });
    var sOnlyMe = me.secrets.filter(function (x) { return them.secrets.indexOf(x) === -1; }), sOnlyThem = them.secrets.filter(function (x) { return me.secrets.indexOf(x) === -1; });
    out.appendChild(E('h4', { text: 'Where your stories split' }));
    out.appendChild(E('ul', { class: 'stats' },
      E('li', null, 'You: ', E('strong', { text: archetype(me)[0] }), ' · They: ', E('strong', { text: archetype(them)[0] })),
      E('li', null, 'Endings: ', E('strong', { text: ending(me) }), ' vs ', E('strong', { text: ending(them) })),
      E('li', null, 'The mirror: ' + (me.trust === them.trust ? 'you both chose the same way' : 'you chose differently (' + (me.trust || 'undecided') + ' vs ' + (them.trust || 'undecided') + ')')),
      E('li', null, 'Clues only you found: ' + (onlyMe.length ? names(onlyMe, K.clues).join(', ') : 'none')),
      E('li', null, 'Clues only they found: ' + (onlyThem.length ? names(onlyThem, K.clues).join(', ') : 'none')),
      E('li', null, 'Secrets only you found: ' + sOnlyMe.length + '; only they found: ' + sOnlyThem.length)));
    out.appendChild(E('p', { class: 'small-note', text: 'Together you hold ' + union.length + ' of 12 clues.' }));
    if (union.length === 12) {
      K.secret('ciphers', true);
      out.appendChild(E('div', { class: 'world-note joint' }, E('strong', { text: 'The Last Page (only two visitors can read it): ' }), '“Nobody holds the whole truth. That was the point. The door opens when two people compare what they remember.”'));
      if (K.setFlag) K.setFlag('jointPage', true);
      K.sound.play('secret');
    } else {
      out.appendChild(E('p', { class: 'small-note', text: 'If your combined clues reach all twelve, a hidden page unlocks. Right now you are missing: ' + names(K.clues.filter(function (x) { return !union.some(function (u) { return u.id === x.id; }); }).map(function (x) { return x.id; }), K.clues).join(', ') + '.' }));
    }
    out.appendChild(E('p', { class: 'small-note', text: 'Honest note: this compares two codes inside your own browser. There is no server, no shared leaderboard, and nobody else sees your code unless you send it.' }));
  }

  function boot() {
    drawMap(); drawSecrets(); drawReport();
    var f = K.$('#cmpForm'); if (f) f.addEventListener('submit', function (e) { e.preventDefault(); compare(K.$('#cmpIn').value); });
    ['kairo:clue', 'kairo:flag', 'kairo:trust', 'kairo:free', 'kairo:secret', 'kairo:reset', 'kairo:scene'].forEach(function (ev) { document.addEventListener(ev, function () { drawMap(); drawSecrets(); drawReport(); }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
