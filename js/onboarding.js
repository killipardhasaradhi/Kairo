/* onboarding.js: plain-language first-visit help and calm reading mode */
(function () {
  'use strict';
  function init() {
    var K = window.K;
    if (!K) return;
    var start = K.$('#startGuidedStory');
    if (start) start.addEventListener('click', function () {
      if (K.story && K.story.go) K.story.go('prologue');
      var root = K.$('#sceneRoot');
      if (root) root.scrollIntoView({ behavior: K.motionOK() ? 'smooth' : 'auto', block: 'start' });
    });
    var read = K.$('#readModeToggle');
    if (read) {
      var enabled = K.store.get('readMode', false);
      document.body.classList.toggle('read-mode', enabled);
      read.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      read.textContent = enabled ? 'Turn off calm reading mode' : 'Turn on calm reading mode';
      read.addEventListener('click', function () {
        enabled = !enabled;
        K.store.set('readMode', enabled);
        document.body.classList.toggle('read-mode', enabled);
        read.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        read.textContent = enabled ? 'Turn off calm reading mode' : 'Turn on calm reading mode';
        if (enabled && !K.settings.reduce) {
          K.settings.reduce = true;
          K.store.set('reduce', true);
          K.applySettings();
        }
        K.toast(enabled ? 'Calm reading mode on' : 'Calm reading mode off', enabled ? 'Animations are reduced to keep attention on the story.' : 'Your regular visual effects are restored.');
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
