/**
 * Lightweight pull-to-refresh.
 * Triggers when user swipes down from the very top of the document.
 * On release past threshold: asks the service worker to check for updates
 * and reloads the page bypassing cache.
 */
(function () {
  var THRESHOLD = 80;            // pixels of pull to trigger refresh
  var MAX_PULL = 140;            // cap on indicator translation
  var DAMPEN = 0.5;              // resistance factor so pull feels natural
  var startY = null;
  var pullY = 0;
  var armed = false;
  var active = false;
  var triggered = false;

  function getScrollTop() {
    return (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0);
  }

  function injectStyles() {
    if (document.getElementById('ace-ptr-styles')) return;
    var css = [
      '#ace-ptr {',
      '  position: fixed; top: 0; left: 50%;',
      '  transform: translate(-50%, -60px);',
      '  width: 44px; height: 44px; border-radius: 50%;',
      '  background: #fff; box-shadow: 0 4px 16px rgba(20,40,80,0.14);',
      '  display: flex; align-items: center; justify-content: center;',
      '  z-index: 9999; pointer-events: none;',
      '  transition: transform 0.2s ease, opacity 0.2s ease;',
      '  opacity: 0;',
      '}',
      '#ace-ptr svg { width: 22px; height: 22px; color: #4C4EE8; transition: transform 0.1s linear; }',
      '#ace-ptr.active { opacity: 1; }',
      '#ace-ptr.refreshing svg { animation: ace-ptr-spin 0.8s linear infinite; }',
      '@keyframes ace-ptr-spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }',
    ].join('\n');
    var style = document.createElement('style');
    style.id = 'ace-ptr-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function createIndicator() {
    var el = document.getElementById('ace-ptr');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'ace-ptr';
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
    document.body.appendChild(el);
    return el;
  }

  function onTouchStart(e) {
    if (triggered) return;
    if (getScrollTop() > 0) { armed = false; return; }
    startY = e.touches[0].clientY;
    pullY = 0;
    armed = true;
    active = false;
  }
  function onTouchMove(e) {
    if (!armed || triggered) return;
    var dy = e.touches[0].clientY - startY;
    if (dy <= 0) { active = false; resetIndicator(); return; }
    if (getScrollTop() > 0) { armed = false; resetIndicator(); return; }
    active = true;
    pullY = Math.min(dy * DAMPEN, MAX_PULL);
    var el = createIndicator();
    el.classList.add('active');
    var translate = Math.min(pullY - 60, 40);
    el.style.transform = 'translate(-50%, ' + translate + 'px)';
    var rotation = Math.min((pullY / THRESHOLD) * 360, 360);
    var svg = el.querySelector('svg');
    if (svg) svg.style.transform = 'rotate(' + rotation + 'deg)';
    // prevent default so browser doesn't do its own overscroll
    if (pullY > 10 && e.cancelable) e.preventDefault();
  }
  function onTouchEnd() {
    if (!armed || triggered) { armed = false; return; }
    if (active && pullY >= THRESHOLD) {
      trigger();
    } else {
      resetIndicator();
    }
    armed = false;
    active = false;
    pullY = 0;
  }
  function resetIndicator() {
    var el = document.getElementById('ace-ptr');
    if (!el) return;
    el.classList.remove('active');
    el.style.transform = 'translate(-50%, -60px)';
    var svg = el.querySelector('svg');
    if (svg) svg.style.transform = '';
  }
  function trigger() {
    triggered = true;
    var el = createIndicator();
    el.classList.add('active', 'refreshing');
    el.style.transform = 'translate(-50%, 20px)';
    // Ask SW to update if available
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      try { navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' }); } catch (e) {}
    }
    // Short delay so spinner is visible, then reload with cache-bust query
    setTimeout(function () {
      var url = new URL(location.href);
      url.searchParams.set('_r', Date.now());
      location.replace(url.toString());
    }, 600);
  }

  function boot() {
    injectStyles();
    createIndicator();
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
