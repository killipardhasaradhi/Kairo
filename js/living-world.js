/* living-world.js: optional, clearly explained mini-mysteries and local-only visitor memory. */
(function () {
  'use strict';
  function init() {
    var K = window.K;
    if (!K) return;
    var $ = K.$, $$ = K.$$;
    var moodTitle = $('#kairoMoodTitle'), moodText = $('#kairoMoodText');
    var reactions = [
      ['Kairo looks curious.', '“The clock has been wrong all night. Will you help me find out why?”'],
      ['Kairo seems worried.', '“If the shadow moves first, does that mean it has already seen tomorrow?”'],
      ['Kairo is trying to be brave.', '“We can take this slowly. One clue at a time.”'],
      ['Kairo noticed something.', '“Look at the lantern. The missing star is not missing by accident.”'],
      ['Kairo gives a tiny smile.', '“You are better at this than you think. Keep looking.”']
    ];
    var reactIndex = 0;
    var answers = {
      why: ['I do not know yet.', '“Something is holding one minute in place. We need the clues before we can know why.”'],
      shadow: ['That is the dangerous part.', '“My shadow moves one second before I do. It may be remembering a tomorrow I have not reached.”'],
      trust: ['Look at the evidence.', '“I want to trust the clockmaker. But the book warns me not to. You must decide what the clues mean.”'],
      clues: ['No. Curiosity is enough.', '“Every clue helps, but none is required to finish the story. Follow the blue hint if you need help.”'],
      scared: ['A little.', '“I am afraid of forgetting the people I promised to save. That is why I keep walking.”']
    };
    function react() {
      var question = $('#kairoQuestion');
      var r = question && answers[question.value] ? answers[question.value] : reactions[reactIndex++ % reactions.length];
      if (moodTitle) moodTitle.textContent = r[0];
      if (moodText) moodText.textContent = r[1];
      var stage = $('#kairoStage'); if (stage) { stage.classList.remove('reacting'); void stage.offsetWidth; stage.classList.add('reacting'); }
      if (K.settings.sound) K.sound.play('whisper');
    }
    var reactBtn = $('#kairoReact'); if (reactBtn) reactBtn.addEventListener('click', react);
    var kairoStage = $('#kairoStage');
    if (kairoStage) {
      kairoStage.addEventListener('pointermove', function () {
        if (moodTitle && moodTitle.textContent === 'Kairo is curious about you.') {
          moodTitle.textContent = 'Kairo is watching you.';
          moodText.textContent = 'The golden eyes follow your pointer. Try the lantern sound button, or explore the optional experiments below.';
        }
      }, { passive: true });
      kairoStage.addEventListener('click', function () { react(); });
    }

    /* A rewindable three-moment story puzzle; never affects the main story state. */
    var moments = [
      { text: 'Moment 1: the clock ticks backward. Everything seems normal.', active: 0 },
      { text: 'Moment 2: the candle goes out, but its shadow stays lit.', active: 1 },
      { text: 'Moment 3: the shadow moves before Kairo. That is the clue.', active: 2 }
    ];
    var timeIndex = Number(K.store.get('labTime', 0)) || 0;
    function paintTime() {
      var result = $('#timelineResult'), visual = $('#timelineVisual');
      if (result) result.textContent = moments[timeIndex].text;
      if (visual) $$('.timeline-dot', visual).forEach(function (dot, i) { dot.classList.toggle('active', i === timeIndex); dot.setAttribute('aria-current', i === timeIndex ? 'step' : 'false'); });
      K.store.set('labTime', timeIndex);
    }
    $('#timeStep').addEventListener('click', function () { timeIndex = (timeIndex + 1) % moments.length; paintTime(); if (timeIndex === 2) { K.sound.play('reveal'); K.toast('A pattern revealed', 'The shadow moves one second before Kairo.'); } else K.sound.play('tick'); });
    $('#timeReset').addEventListener('click', function () { timeIndex = 0; paintTime(); K.toast('Time rewound', 'The experiment has returned to its first moment.'); });
    paintTime();

    /* Mirror puzzle. */
    $$('[data-mirror-answer]').forEach(function (btn) { btn.addEventListener('click', function () {
      var result = $('#mirrorResult');
      if (btn.getAttribute('data-mirror-answer') === 'shadow') {
        result.textContent = 'Correct. Kairo’s shadow moved first. The mirror is showing an event from one second ahead.';
        $('#mirrorStage').classList.add('solved'); K.store.set('mirrorSolved', true); K.sound.play('reveal'); K.toast('Mirror mystery solved', 'You spotted the central anomaly.');
      } else {
        result.textContent = 'Not quite. Think about Kairo’s character profile: what moves one second before Kairo? Try another answer.';
        K.sound.play('ominous');
      }
    }); });
    if (K.store.get('mirrorSolved', false)) { $('#mirrorStage').classList.add('solved'); $('#mirrorResult').textContent = 'Solved: Kairo’s shadow moved first. The mirror shows an event from one second ahead.'; }

    /* Fictional terminal: answer is discoverable from the explicit hint. */
    function decode() {
      var answer = ($('#terminalAnswer').value || '').trim().toLowerCase(), out = $('#terminalResult');
      if (answer === 'shadow') {
        out.textContent = 'MESSAGE DECODED: “Do not trust the first version of tomorrow.” The terminal remembers that you solved it.';
        K.store.set('terminalSolved', true); K.sound.play('reveal'); K.toast('Message decoded', 'A new line has appeared in your case notes.');
      } else { out.textContent = 'The terminal rejects that word. Hint: it is the dark shape that follows Kairo—and sometimes arrives early.'; K.sound.play('tick'); }
    }
    $('#terminalSubmit').addEventListener('click', decode);
    $('#terminalAnswer').addEventListener('keydown', function (e) { if (e.key === 'Enter') decode(); });
    if (K.store.get('terminalSolved', false)) $('#terminalResult').textContent = 'Previously decoded: “Do not trust the first version of tomorrow.”';

    /* Map links are shortcuts, not prerequisites. */
    $$('[data-scene-jump]').forEach(function (btn) { btn.addEventListener('click', function () {
      if (K.story && K.story.go) { K.story.go(btn.getAttribute('data-scene-jump')); $('#story').scrollIntoView({ behavior: K.motionOK() ? 'smooth' : 'auto', block: 'start' }); }
      else { location.hash = '#story'; }
    }); });

    /* Private, local-only theory notes. */
    var theory = $('#theoryText'), theoryResult = $('#theoryResult');
    theory.value = K.store.get('visitorTheory', '');
    $('#saveTheory').addEventListener('click', function () {
      K.store.set('visitorTheory', theory.value.slice(0, 500));
      theoryResult.textContent = theory.value.trim() ? 'Saved on this device. You can edit this theory whenever you like.' : 'An empty theory was saved. Write something whenever you are ready.';
      K.toast('Theory saved', 'Stored only in this browser.');
    });
    $('#clearTheory').addEventListener('click', function () { theory.value = ''; K.store.del('visitorTheory'); theoryResult.textContent = 'Your theory was cleared from this browser.'; });

    /* Case report uses only locally available story progress; safe to copy or share manually. */
    var lastReport = '';
    function updateStats() {
      $('#caseClues').textContent = Array.isArray(K.found) ? K.found.length : 0;
      var visited = K.store.get('visited', {}), n = Object.keys(visited || {}).filter(function (k) { return !!visited[k]; }).length;
      $('#caseScenes').textContent = n;
      $('#caseEnding').textContent = K.store.get('free', false) ? 'Released' : (K.store.get('memoryEnding', false) ? 'Keeper' : (K.store.get('resetEnding', false) ? 'Loop' : 'Open'));
    }
    function buildReport() {
      updateStats();
      var found = (K.clues || []).filter(function (c) { return K.hasClue(c.id); }).map(function (c) { return '• ' + c.name; });
      var visited = K.store.get('visited', {}), places = Object.keys(visited || {}).filter(function (k) { return visited[k]; });
      var ending = K.store.get('free', false) ? 'The loop was released' : (K.store.get('memoryEnding', false) ? 'Memory Keeper ending' : (K.store.get('resetEnding', false) ? 'The loop continues' : 'Not chosen yet'));
      lastReport = 'KAIRO — CASE REPORT\nSomeone Is Resetting Tomorrow\n\nClues found: ' + found.length + '/12\n' + (found.length ? found.join('\n') : 'No clues collected yet.') + '\n\nPlaces visited: ' + (places.length ? places.join(', ') : 'No places recorded yet.') + '\nEnding: ' + ending + '\n\nMy theory: ' + ((K.store.get('visitorTheory', '') || '').trim() || 'Not written yet.') + '\n\nGenerated locally by the Kairo story website.';
      $('#caseReport').value = lastReport; $('#copyReport').disabled = false;
      K.toast('Case report ready', 'You can copy the summary below.');
    }
    $('#makeReport').addEventListener('click', buildReport);
    $('#copyReport').addEventListener('click', function () {
      var area = $('#caseReport'); area.focus(); area.select(); area.setSelectionRange(0, area.value.length);
      var copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(lastReport).then(function () { K.toast('Report copied', 'Paste it into a message or document.'); }).catch(function () { K.toast('Report selected', 'Use Copy from your device menu.'); });
      else K.toast('Report selected', 'Use Copy from your device menu.');
    });
    document.addEventListener('kairo:clue', updateStats);
    document.addEventListener('kairo:scene', updateStats);
    updateStats();

    /* User-initiated ambience only. Keep oscillator low-volume and stop cleanly. */
    var ambienceTimer = null, ambienceOn = false, ambientToggle = $('#ambientToggle'), ambientStatus = $('#ambientStatus');
    function stopAmbience() { if (ambienceTimer) clearInterval(ambienceTimer); ambienceTimer = null; ambienceOn = false; ambientToggle.setAttribute('aria-pressed', 'false'); ambientToggle.textContent = 'Start quiet ambience'; ambientStatus.textContent = K.settings.sound ? 'Ambience stopped.' : 'Sound is off until you choose it.'; }
    ambientToggle.addEventListener('click', function () {
      if (!K.settings.sound) { K.toast('Enable sound first', 'Use the Sound button in the top bar. Sound is off by default.'); return; }
      if (ambienceOn) { stopAmbience(); return; }
      ambienceOn = true; ambientToggle.setAttribute('aria-pressed', 'true'); ambientToggle.textContent = 'Stop quiet ambience'; ambientStatus.textContent = 'Quiet clock ambience is playing. Use Stop or mute sound to end it.';
      K.sound.play('ominous'); K.sound.play('tick');
      ambienceTimer = setInterval(function () { if (!K.settings.sound || document.hidden) { stopAmbience(); return; } K.sound.play('tick'); }, 3200);
    });
    document.addEventListener('kairo:settings', function () { if (!K.settings.sound && ambienceOn) stopAmbience(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && ambienceOn) stopAmbience(); });
    window.addEventListener('pagehide', stopAmbience);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
