/* demos.js: Dream Compass, Memory Archive, Loop Detector (fictional inventions of Kairo) */
(function () {
  'use strict';
  var E = K.el;

  /* ============ DREAM COMPASS ============ */
  var PLACES = [
    { id: 'stillhour', name: 'Stillhour', ico: '🏘', x: 14, y: 76, img: 'loc-stillhour',
      text: 'A town that repeats the same sixty seconds every night. A door slams, a candle flickers, a distant bell begins to ring, and then everything resets.' },
    { id: 'workshop', name: 'Clockmaker’s Workshop', short: 'Workshop', ico: '⚙', x: 31, y: 48, img: 'loc-stillhour',
      text: 'Gears, broken clocks, and drawings of events that have not happened yet. Three knocks come from behind one wall.' },
    { id: 'library', name: 'Library of Unwritten Days', short: 'Library', ico: '📚', x: 50, y: 70, img: 'loc-archive',
      text: 'Books about days that have not happened, or that nobody remembers living. One is titled KAIRO — FINAL LOOP.' },
    { id: 'mirror', name: 'The Mirror Room', short: 'Mirror Room', ico: '🪞', x: 68, y: 38, img: 'loc-mirror',
      text: 'A locked room beneath the archive. The mirror moves on its own, and someone steps out of it.' },
    { id: 'tower', name: 'The Clock Tower', short: 'Clock Tower', ico: '🕰', x: 84, y: 66, img: 'loc-tower',
      text: 'Home of the thirteenth bell. Ringing it opens the missing minute, and releases the memory that holds the loop together.' },
    { id: 'epilogue', name: 'The Door in the Sky', short: 'Door in the Sky', ico: '🚪', x: 86, y: 14, img: null, locked: true,
      text: 'A constellation shaped like a doorway. Three knocks come from the other side.' }
  ];
  var seen = K.store.get('compass', {});

  function compass(root) {
    var info = E('div', { class: 'loc-panel', 'aria-live': 'polite' });
    var map = E('div', { class: 'map', role: 'group', 'aria-label': 'Map of forgotten places. Each place is a button.' });
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'paths'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    var route = document.createElementNS(svgNS, 'polyline');
    var routeDone = document.createElementNS(svgNS, 'polyline'); routeDone.setAttribute('class', 'route-done');
    svg.appendChild(route); svg.appendChild(routeDone); map.appendChild(svg);
    var needle = K.svg('<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="rgba(7,10,31,.8)" stroke="#f2c768" stroke-width="3"/><g class="nd"><path d="M50 12 L58 50 L50 44 L42 50 Z" fill="#5de8f5"/><path d="M50 88 L58 50 L50 56 L42 50 Z" fill="#f2c768"/></g><circle cx="50" cy="50" r="4" fill="#fff"/></svg>');
    var needleWrap = E('div', { class: 'map-needle', role: 'img', 'aria-label': 'Compass needle pointing to the suggested next place' }, needle);
    map.appendChild(needleWrap);
    var nodeEls = {};

    function usable() { return PLACES.filter(function (p) { return !p.locked || K.story.isFree(); }); }
    function nextPlace() {
      var u = usable();
      for (var i = 0; i < u.length; i++) if (!seen[u[i].id]) return u[i];
      return null;
    }
    function layout() {
      var u = usable();
      route.setAttribute('points', u.map(function (p) { return p.x + ',' + p.y; }).join(' '));
      var done = []; for (var i = 0; i < u.length; i++) { if (seen[u[i].id]) done.push(u[i].x + ',' + u[i].y); else break; }
      routeDone.setAttribute('points', done.length > 1 ? done.join(' ') : '');
      var nx = nextPlace();
      PLACES.forEach(function (p) {
        var n = nodeEls[p.id], isLocked = p.locked && !K.story.isFree();
        n.classList.toggle('seen', !!seen[p.id]);
        n.classList.toggle('next', !!nx && nx.id === p.id);
        n.classList.toggle('locked', isLocked);
        n.setAttribute('aria-disabled', isLocked ? 'true' : 'false');
        var status = isLocked ? 'locked until the story is finished' : seen[p.id] ? 'explored' : 'not explored yet';
        n.setAttribute('aria-label', p.name + ', ' + status + (nx && nx.id === p.id ? ', suggested next' : ''));
        n.querySelector('.ico').textContent = isLocked ? '🔒' : seen[p.id] ? '✓' : p.ico;
      });
      /* needle points from its own centre to the suggested place */
      var from = { x: 7, y: 12 };
      var to = nx ? { x: nx.x, y: nx.y } : { x: 50, y: 0 };
      var ang = Math.atan2(to.x - from.x, -(to.y - from.y)) * 180 / Math.PI;
      needle.querySelector('.nd').style.transform = 'rotate(' + ang.toFixed(1) + 'deg)';
      var count = usable().filter(function (p) { return seen[p.id]; }).length;
      K.$('.cp-count', root).textContent = count + ' of ' + usable().length + ' places explored';
    }
    function show(p) {
      K.clear(info);
      if (p.locked && !K.story.isFree()) {
        info.appendChild(E('h4', { text: p.name }));
        info.appendChild(E('p', { text: 'This place does not appear on any map yet. Finish the story to unlock it.' }));
        info.appendChild(E('button', { type: 'button', class: 'btn small ghost', onclick: function () { K.story.go('tower'); location.hash = '#story'; } }, 'Go to the clock tower'));
        return;
      }
      seen[p.id] = true; K.store.set('compass', seen);
      layout();
      info.appendChild(p.img ? E('img', { src: 'assets/' + p.img + '.jpg', alt: p.name + ' (picture)', width: 112, height: 133 }) : null);
      info.appendChild(E('h4', { text: p.name }));
      info.appendChild(E('span', { class: 'status seen', text: '✓ Explored' }));
      info.appendChild(E('p', { text: p.text }));
      info.appendChild(E('button', { type: 'button', class: 'btn small ghost', onclick: function () { K.story.go(p.id); } }, 'Open this scene in the story'));
      var nx = nextPlace();
      info.appendChild(E('p', { class: 'suggest', text: nx ? 'Suggested next: ' + nx.name : 'You have explored every place on the compass.' }));
    }
    PLACES.forEach(function (p) {
      var n = E('button', { type: 'button', class: 'node', style: { left: p.x + '%', top: p.y + '%' } },
        E('span', { class: 'ico', 'aria-hidden': 'true' }), E('span', { class: 'nm', text: p.short || p.name }));
      n.addEventListener('click', function () { K.$$('.node', map).forEach(function (x) { x.classList.remove('sel'); }); n.classList.add('sel'); show(p); });
      nodeEls[p.id] = n; map.appendChild(n);
    });

    var reset = E('button', { type: 'button', class: 'btn small ghost danger' }, 'Reset compass');
    reset.addEventListener('click', function () { seen = {}; K.store.del('compass'); K.clear(info); info.appendChild(E('p', { text: 'Compass reset. Tap a place on the map to explore it.' })); layout(); });

    K.clear(root);
    root.appendChild(E('h3', { text: 'Dream Compass' }));
    root.appendChild(E('p', { class: 'fiction', text: 'A fictional invention of Kairo’s. Tap a place to explore it. Gold places are explored; dashed places are not. The glowing one is the suggested next stop.' }));
    root.appendChild(E('div', { class: 'compass-grid' }, map, E('div', null, info, E('p', { class: 'small-note cp-count' }), reset)));
    info.appendChild(E('p', { text: 'Tap a place on the map to explore it.' }));
    layout();
    document.addEventListener('kairo:reset', function () { /* compass has its own reset */ });
    root._refresh = layout;
  }

  /* ============ MEMORY ARCHIVE ============ */
  var SRC = { lantern: 'Lantern', bird: 'Paper bird', drawings: 'Drawings', book: 'Final Loop book', mirror: 'Mirror' };
  var MEMS = [
    { id: 'm1', src: 'lantern', title: 'The lantern’s warning', clue: 'clock', frag: '“If you are reading this, you have already made the wrong choice. Do not ring the thirteenth bell. — Kairo.”',
      note: 'Written in Kairo’s own hand, but Kairo does not remember writing it.', links: ['The thirteenth mark', 'The backward-ticking clock'] },
    { id: 'm2', src: 'lantern', title: 'The thirteenth mark', clue: 'bell13', frag: 'A clock has twelve marks. This bell is the one that is missing.',
      note: 'The warning refers to a bell that does not appear on any ordinary clock.', links: ['The lantern’s warning', 'Contradictory warnings'] },
    { id: 'm3', src: 'bird', title: 'The paper bird', clue: 'bird', frag: '“You came back earlier this time.”',
      note: 'Someone remembers a visit that Kairo cannot.', links: ['Drawings of the future', 'KAIRO — FINAL LOOP'] },
    { id: 'm4', src: 'drawings', title: 'Drawings of the future', clue: 'drawings', frag: 'A tower, a mirror, and a lantern, drawn before Kairo had seen any of them.',
      note: 'Traces of earlier attempts pinned to the workshop wall.', links: ['The missing-point star', 'The paper bird'] },
    { id: 'm5', src: 'drawings', title: 'The missing-point star', clue: 'star', frag: 'A five-pointed star with one point missing, in the corner of every drawing.',
      note: 'The same mark appears in the book and on the lantern.', links: ['Drawings of the future', 'KAIRO — FINAL LOOP'] },
    { id: 'm6', src: 'book', title: 'KAIRO — FINAL LOOP', clue: 'book', frag: '“If you have reached this page, I have failed to stop you.”',
      note: 'A record of an earlier attempt, in Kairo’s handwriting.', links: ['Contradictory warnings', 'The missing-point star'] },
    { id: 'm7', src: 'book', title: 'Contradictory warnings', clue: 'warnings', frag: '“Trust the clockmaker.”  /  “Never trust him.”',
      note: 'Different versions of Kairo held different fragments of the truth.', links: ['KAIRO — FINAL LOOP', 'The other Kairo’s eyes'] },
    { id: 'm8', src: 'mirror', title: 'The stranger’s first words', clue: 'mirror', frag: '“You are not the first Kairo to reach this room.”',
      note: 'The reflection moved on its own, and then stepped out.', links: ['The other Kairo’s eyes'] },
    { id: 'm9', src: 'mirror', title: 'The other Kairo’s eyes', clue: 'darkeyes', frag: 'Dark, tired eyes. A guardian that has forgotten almost everything except the fear of another reset.',
      note: 'Not evil. Frightened.', links: ['The stranger’s first words', 'Contradictory warnings'] }
  ];
  var opened = K.store.get('memories', {});

  function memory(root) {
    var filter = 'all';
    var grid = E('div', { class: 'mem-grid' });
    var detail = E('div', { 'aria-live': 'polite' });
    var filters = E('div', { class: 'mem-filters', role: 'group', 'aria-label': 'Filter fragments by source' });
    function drawFilters() {
      K.clear(filters);
      [['all', 'All fragments']].concat(Object.keys(SRC).map(function (k) { return [k, SRC[k]]; })).forEach(function (f) {
        var b = E('button', { type: 'button', 'aria-pressed': filter === f[0] ? 'true' : 'false' }, f[1]);
        b.addEventListener('click', function () { filter = f[0]; drawFilters(); drawGrid(); });
        filters.appendChild(b);
      });
    }
    function drawGrid() {
      K.clear(grid);
      MEMS.filter(function (m) { return filter === 'all' || m.src === filter; }).forEach(function (m) {
        var b = E('button', { type: 'button', class: 'mem-card' + (opened[m.id] ? ' open' : ''), 'aria-label': 'Memory fragment: ' + m.title + ' (from ' + SRC[m.src] + ')' + (opened[m.id] ? ', recovered' : ', not yet recovered') },
          E('span', { class: 'src', text: 'From: ' + SRC[m.src] }), E('span', { class: 'ttl', text: m.title }), E('span', { class: 'state', text: opened[m.id] ? 'Recovered and saved to your notebook' : 'Tap to recover this fragment' }));
        b.addEventListener('click', function () {
          opened[m.id] = true; K.store.set('memories', opened);
          K.addClue(m.clue);
          b.classList.add('open');
          K.clear(detail);
          detail.appendChild(E('div', { class: 'mem-detail' },
            E('h4', { text: m.title }),
            E('p', { class: 'small-note', text: 'Source: ' + SRC[m.src] + ' · Notebook clue: ' + K.clueById[m.clue].name }),
            E('p', { class: 'frag', text: m.frag }),
            E('p', { text: m.note }),
            E('p', { class: 'small-note', text: 'Connects to: ' + m.links.join(', ') }),
            E('a', { class: 'btn small ghost', href: '#notebook' }, 'See it in the notebook')));
          drawGrid(); var again = K.$$('.mem-card', grid).filter(function (x) { return x.textContent.indexOf(m.title) !== -1; })[0]; if (again) again.focus({ preventScroll: true });
          updateCount();
        });
        grid.appendChild(b);
      });
    }
    var count = E('p', { class: 'small-note' });
    function updateCount() { count.textContent = Object.keys(opened).length + ' of ' + MEMS.length + ' fragments recovered'; }
    var reset = E('button', { type: 'button', class: 'btn small ghost danger' }, 'Seal the archive again');
    reset.addEventListener('click', function () { opened = {}; K.store.del('memories'); K.clear(detail); drawGrid(); updateCount(); });
    K.clear(root);
    root.appendChild(E('h3', { text: 'Memory Archive' }));
    root.appendChild(E('p', { class: 'fiction', text: 'A fictional invention of Kairo’s. Recover fragments that time keeps erasing. Each recovered fragment is also saved as a clue in the Detective Notebook.' }));
    root.appendChild(filters); root.appendChild(grid); root.appendChild(detail); root.appendChild(count); root.appendChild(reset);
    drawFilters(); drawGrid(); updateCount();
  }

  /* ============ LOOP DETECTOR ============ */
  var SCEN = [
    { name: 'Stillhour: the paper bird',
      a: ['A door slams', 'A candle flickers', 'A distant bell begins ringing', 'The minute resets'],
      b: ['A door slams', 'A candle flickers', 'A paper bird appears', 'A distant bell begins ringing', 'The minute resets'],
      why: 'The paper bird is an event that does not belong to the original minute. It may carry information from another attempt, which fits the message “You came back earlier this time.”' },
    { name: 'The workshop: three knocks',
      a: ['Gears tick', 'A drawing flutters', 'Silence behind the wall', 'The lamp dims'],
      b: ['Gears tick', 'A drawing flutters', 'Three knocks from behind the wall', 'Silence behind the wall', 'The lamp dims'],
      why: 'Three knocks appear in the second sequence only. Someone is trying to signal across the broken timeline.' },
    { name: 'Stillhour: the order slips',
      a: ['A door slams', 'A candle flickers', 'A distant bell begins ringing', 'The minute resets'],
      b: ['A candle flickers', 'A door slams', 'A distant bell begins ringing', 'The minute resets'],
      why: 'Nothing was added or removed, but the door and the candle swapped places. A loop that changes its own order may be drifting, which suggests that something inside it is remembering.' }
  ];
  function diff(a, b) {
    var out = { a: {}, b: {}, kind: 'same' };
    var onlyB = [], onlyA = [];
    b.forEach(function (x, i) { if (a.indexOf(x) === -1) onlyB.push(i); });
    a.forEach(function (x, i) { if (b.indexOf(x) === -1) onlyA.push(i); });
    onlyB.forEach(function (i) { out.b[i] = true; }); onlyA.forEach(function (i) { out.a[i] = true; });
    if (onlyA.length || onlyB.length) { out.kind = onlyB.length && !onlyA.length ? 'added' : onlyA.length && !onlyB.length ? 'removed' : 'changed'; return out; }
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) { out.a[i] = true; out.b[i] = true; out.kind = 'order'; }
    return out;
  }
  function loopDetector(root) {
    var cur = 0, scanTimer = null;
    var listA = E('ol'), listB = E('ol');
    var verdict = E('div', { 'aria-live': 'polite' });
    var sel = E('select', { id: 'loopSel', 'aria-label': 'Choose a pair of sequences' }, SCEN.map(function (s, i) { return E('option', { value: i, text: s.name }); }));
    var cmp = E('button', { type: 'button', class: 'btn small' }, 'Compare sequences');
    var rev = E('button', { type: 'button', class: 'btn small ghost' }, 'Reveal the anomaly');
    var rst = E('button', { type: 'button', class: 'btn small ghost danger' }, 'Reset');
    var status = E('p', { class: 'small-note', 'aria-live': 'polite' });

    function draw(marks) {
      var s = SCEN[cur]; K.clear(listA); K.clear(listB);
      s.a.forEach(function (t, i) { listA.appendChild(E('li', { class: marks && marks.a[i] ? 'anom' : '', text: t })); });
      s.b.forEach(function (t, i) { listB.appendChild(E('li', { class: marks && marks.b[i] ? 'anom' : '', text: t })); });
    }
    function reset() { clearInterval(scanTimer); K.clear(verdict); status.textContent = ''; rev.disabled = true; draw(null); }
    sel.addEventListener('change', function () { cur = +sel.value; reset(); });
    rst.addEventListener('click', reset);
    cmp.addEventListener('click', function () {
      reset(); var s = SCEN[cur]; var max = Math.max(s.a.length, s.b.length), i = 0;
      status.textContent = 'Comparing…';
      var A = K.$$('li', listA), B = K.$$('li', listB);
      function stepScan() {
        A.forEach(function (x) { x.classList.remove('scan'); }); B.forEach(function (x) { x.classList.remove('scan'); });
        if (i >= max) { clearInterval(scanTimer); status.textContent = 'Comparison finished. Something does not match. Reveal the anomaly to see it.'; rev.disabled = false; rev.focus(); return; }
        if (A[i]) A[i].classList.add('scan'); if (B[i]) B[i].classList.add('scan'); i++;
      }
      if (K.motionOK()) { stepScan(); scanTimer = setInterval(stepScan, 450); } else { i = max; stepScan(); }
    });
    rev.addEventListener('click', function () {
      var s = SCEN[cur], d = diff(s.a, s.b); draw(d);
      var label = { added: 'An extra event appears in Sequence B.', removed: 'An event is missing from Sequence B.', changed: 'Events differ between the sequences.', order: 'The same events happen in a different order.', same: 'No difference found.' }[d.kind];
      K.clear(verdict);
      verdict.appendChild(E('div', { class: 'verdict' }, E('h4', { text: 'Anomaly detected: ' + label }), E('p', { text: s.why }),
        E('p', { class: 'small-note', text: 'This is a demonstration of a fictional invention. It does not prove that real time loops can be detected.' })));
      rev.disabled = true;
    });
    K.clear(root);
    root.appendChild(E('h3', { text: 'Loop Detector' }));
    root.appendChild(E('p', { class: 'fiction', text: 'A fictional invention of Kairo’s. Compare two recordings of a repeating minute and expose what changed.' }));
    root.appendChild(E('div', { class: 'loop-actions' }, E('label', { for: 'loopSel', text: 'Recordings:' }), sel, cmp, rev, rst));
    root.appendChild(E('div', { class: 'loop-grid' }, E('div', { class: 'seq' }, E('h4', { text: 'Sequence A' }), listA), E('div', { class: 'seq' }, E('h4', { text: 'Sequence B' }), listB)));
    root.appendChild(status); root.appendChild(verdict);
    reset();
  }

  /* ============ boot + tabs ============ */
  function boot() {
    var panels = [K.$('#pp-compass'), K.$('#pp-memory'), K.$('#pp-loop')];
    compass(panels[0]); memory(panels[1]); loopDetector(panels[2]);
    K.tabs([K.$('#ptab-compass'), K.$('#ptab-memory'), K.$('#ptab-loop')], panels, function (i) { if (i === 0 && panels[0]._refresh) panels[0]._refresh(); });
    document.addEventListener('kairo:clue', function () { /* archive cards stay independent of clue source */ });
    document.addEventListener('kairo:reset', function () { opened = {}; K.store.del('memories'); memory(panels[1]); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
