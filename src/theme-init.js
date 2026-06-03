// theme-init.js - classic (non-module) script loaded synchronously in <head>
// BEFORE the page paints. MV3 forbids inline scripts, so this lives in its own
// file. It applies the saved background + font so there is no flash on a new tab.
(function () {
  try {
    var t = localStorage.getItem('onward.theme') || 'paper';
    if (t === 'system') {
      t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'paper' : 'ink';
    }
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-font', localStorage.getItem('onward.font') || 'sans');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'paper');
    document.documentElement.setAttribute('data-font', 'sans');
  }
})();
