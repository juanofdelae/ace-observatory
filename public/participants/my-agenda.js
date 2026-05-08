/**
 * Favorite Sites module — tracks agenda events + site cards the user saves.
 * - On agenda.html: star on each .event-card.
 * - On index.html: star on each .site-card + home link.
 * - On favorite-sites.html (also served at my-agenda.html): renders grouped list.
 */
(function () {
  var STORAGE_KEY = 'ace.myagenda.events';
  var PAGE_PATH = location.pathname.replace(/^.*\//, '').toLowerCase();

  var DAY_NAMES = {
    sun: 'Sunday, May 10',
    mon: 'Monday, May 11',
    tue: 'Tuesday, May 12',
    wed: 'Wednesday, May 13',
    thu: 'Thursday, May 14',
    fri: 'Friday, May 15',
  };

  function load() {
    try { var raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
    catch (e) { return {}; }
  }
  function save(map) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch (e) {}
  }
  function keyOf(parts) {
    return parts.join('|').toLowerCase().replace(/[^a-z0-9|]/g, '-').replace(/-+/g, '-');
  }

  function injectStyles() {
    if (document.getElementById('ace-agenda-styles')) return;
    var css = [
      '.ace-agenda-star {',
      '  position: absolute; top: 10px; right: 10px; z-index: 2;',
      '  width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer;',
      '  background: rgba(255,255,255,0.95); box-shadow: 0 2px 10px rgba(20,40,80,0.08);',
      '  display: flex; align-items: center; justify-content: center;',
      '  color: #8A94A6; transition: transform 0.15s ease, color 0.15s ease;',
      '  padding: 0;',
      '}',
      '.ace-agenda-star:active { transform: scale(0.9); }',
      '.ace-agenda-star.is-saved { color: #E9B94A; }',
      '.ace-agenda-star svg { width: 18px; height: 18px; stroke: currentColor; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }',
      '.ace-agenda-star:not(.is-saved) svg { fill: none; }',
      '.ace-agenda-star.is-saved svg { fill: currentColor; }',
      '.event-card, .site-card { position: relative; }',
      '',
      '.ace-mya-link {',
      '  display: inline-flex; align-items: center; gap: 6px;',
      '  background: #fff; border-radius: 999px; padding: 8px 14px 8px 12px;',
      '  color: #1A4272; font-family: Montserrat, sans-serif; font-weight: 600; font-size: 0.82rem;',
      '  text-decoration: none; box-shadow: 0 2px 10px rgba(20,40,80,0.08);',
      '  border: 1px solid rgba(20,40,80,0.08);',
      '}',
      '.ace-mya-link svg { width: 16px; height: 16px; stroke: #4C4EE8; fill: none; stroke-width: 2; }',
      '.ace-mya-link-wrap { max-width: 900px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; margin-bottom: 18px; }',
      '.ace-mya-link { padding: 10px 16px 10px 14px; }',
      '',
      '.ace-mya-container { max-width: 900px; margin: 0 auto; padding: 24px 20px 80px; font-family: Montserrat, sans-serif; }',
      '.ace-mya-container h1 { color: #003b4a; font-size: 24px; font-weight: 700; margin-bottom: 6px; }',
      '.ace-mya-container .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 20px; }',
      '.ace-mya-day-title { color: #4C4EE8; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 8px; }',
      '.ace-mya-event {',
      '  background: #fff; border-radius: 14px; padding: 14px 16px; margin-bottom: 8px;',
      '  display: flex; gap: 12px; align-items: flex-start; border: 1px solid rgba(20,40,80,0.06);',
      '  min-width: 0;',
      '}',
      '.ace-mya-event-body { flex: 1; min-width: 0; }',
      '.ace-mya-event-time { color: #4C4EE8; font-weight: 600; font-size: 12px; margin-bottom: 4px; }',
      '.ace-mya-event-title { color: #003b4a; font-weight: 700; font-size: 15px; margin-bottom: 3px; word-break: break-word; }',
      '.ace-mya-event-loc { color: #6b7280; font-size: 12px; word-break: break-word; }',
      '.ace-mya-event-remove { background: transparent; border: none; color: #8A94A6; padding: 4px; cursor: pointer; border-radius: 50%; flex-shrink: 0; }',
      '.ace-mya-event-remove:active { background: #F5F6F8; color: #ef4444; }',
      '.ace-mya-event-remove svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }',
      '.ace-mya-empty { padding: 40px 20px; text-align: center; color: #6b7280; }',
      '.ace-mya-empty svg { width: 56px; height: 56px; color: #8A94A6; opacity: 0.5; margin-bottom: 12px; stroke: currentColor; fill: none; stroke-width: 1.5; }',
      '.ace-mya-empty h2 { color: #1A4272; font-size: 16px; font-weight: 600; margin-bottom: 4px; }',
      '.ace-mya-empty a { color: #4C4EE8; font-weight: 600; text-decoration: none; }',
    ].join('\n');
    var style = document.createElement('style');
    style.id = 'ace-agenda-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }
  function pinSvg() {
    return '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  }
  function starSvg() {
    return '<svg viewBox="0 0 24 24"><path d="M12 3l2.9 6.9L22 10.7l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-6.5L2 10.7l7.1-.8z"/></svg>';
  }

  function attachStar(container, key, makeEntry) {
    if (container.querySelector('.ace-agenda-star')) return;
    var btn = document.createElement('button');
    btn.className = 'ace-agenda-star';
    btn.setAttribute('aria-label', 'Toggle favorite');
    btn.innerHTML = starSvg();
    function refresh() {
      var saved = load();
      btn.classList.toggle('is-saved', !!saved[key]);
      btn.setAttribute('aria-pressed', saved[key] ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var saved = load();
      if (saved[key]) { delete saved[key]; }
      else { saved[key] = makeEntry(); }
      save(saved);
      refresh();
    });
    container.appendChild(btn);
    refresh();
  }

  function injectStarsOnAgenda() {
    var sections = document.querySelectorAll('.day-section');
    sections.forEach(function (sec) {
      var dayCode = (sec.id || '').replace(/^sec-/, '');
      sec.querySelectorAll('.event-card').forEach(function (card) {
        var titleEl = card.querySelector('.event-title');
        if (!titleEl) return;
        var title = titleEl.textContent.trim();
        var timeEl = card.querySelector('.event-time');
        var time = timeEl ? timeEl.textContent.trim() : '';
        var locEl = card.querySelector('.event-location a, .event-location');
        var loc = locEl ? locEl.textContent.trim() : '';
        var key = keyOf(['event', dayCode, title, time]);
        attachStar(card, key, function () {
          return { type: 'event', day: dayCode, title: title, time: time, location: loc, saved_at: Date.now() };
        });
      });
    });
  }

  function injectStarsOnSites() {
    document.querySelectorAll('.site-card').forEach(function (card) {
      var titleEl = card.querySelector('.site-info h4');
      if (!titleEl) return;
      var title = titleEl.textContent.trim();
      var descEl = card.querySelector('.site-info p');
      var desc = descEl ? descEl.textContent.trim() : '';
      var badgeEl = card.querySelector('.site-info .day-badge');
      var badge = badgeEl ? badgeEl.textContent.trim() : '';
      var key = keyOf(['site', title]);
      attachStar(card, key, function () {
        return { type: 'site', title: title, description: desc, badge: badge, saved_at: Date.now() };
      });
    });
  }

  function injectHomeLink() {
    var existing = document.querySelector('.ace-fav-link-wrap');
    var link = document.createElement('a');
    link.href = 'my-agenda.html';
    link.className = 'ace-mya-link';
    link.innerHTML = pinSvg() + ' Favorite Sites';
    if (existing) {
      existing.insertBefore(link, existing.firstChild);
    } else {
      var searchSection = document.querySelector('.search-section');
      if (!searchSection) return;
      var w = document.createElement('div');
      w.className = 'ace-mya-link-wrap';
      w.appendChild(link);
      searchSection.parentNode.insertBefore(w, searchSection.nextSibling);
    }
  }

  function renderList() {
    var container = document.getElementById('ace-mya-container');
    if (!container) return;
    var saved = load();
    var entries = Object.keys(saved).map(function (k) { return Object.assign({ key: k }, saved[k]); });
    if (!entries.length) {
      container.innerHTML =
        '<div class="ace-mya-empty">' +
        '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
        '<h2>No sites saved yet</h2>' +
        '<p>Tap the ★ on any agenda event or site card to save it here.<br><a href="index.html">Back to Info Center →</a></p>' +
        '</div>';
      return;
    }

    var sites = entries.filter(function (e) { return e.type === 'site'; });
    var events = entries.filter(function (e) { return e.type !== 'site'; });

    var html = '<div class="subtitle">' + entries.length + ' saved · ' + sites.length + ' site' + (sites.length === 1 ? '' : 's') + ' · ' + events.length + ' event' + (events.length === 1 ? '' : 's') + '</div>';

    if (sites.length) {
      html += '<div class="ace-mya-day-title">Sites</div>';
      sites.forEach(function (e) {
        html += renderSite(e);
      });
    }

    if (events.length) {
      var DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
      var byDay = {};
      events.forEach(function (e) {
        (byDay[e.day] = byDay[e.day] || []).push(e);
      });
      DAY_ORDER.forEach(function (d) {
        if (!byDay[d]) return;
        html += '<div class="ace-mya-day-title">' + (DAY_NAMES[d] || d) + '</div>';
        byDay[d].sort(function (a, b) { return (a.time || '').localeCompare(b.time || ''); });
        byDay[d].forEach(function (e) { html += renderEvent(e); });
      });
    }

    container.innerHTML = html;
    container.querySelectorAll('.ace-mya-event-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var k = btn.getAttribute('data-key');
        var s = load();
        delete s[k];
        save(s);
        renderList();
      });
    });
  }

  function renderSite(e) {
    return (
      '<div class="ace-mya-event">' +
      '<div class="ace-mya-event-body">' +
      '<div class="ace-mya-event-title">' + escapeHtml(e.title) + '</div>' +
      (e.description ? '<div class="ace-mya-event-loc">' + escapeHtml(e.description) + '</div>' : '') +
      (e.badge ? '<div class="ace-mya-event-time">' + escapeHtml(e.badge) + '</div>' : '') +
      '</div>' +
      '<button class="ace-mya-event-remove" data-key="' + e.key + '" aria-label="Remove">' +
      '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>' +
      '</button>' +
      '</div>'
    );
  }
  function renderEvent(e) {
    return (
      '<div class="ace-mya-event">' +
      '<div class="ace-mya-event-body">' +
      (e.time ? '<div class="ace-mya-event-time">' + escapeHtml(e.time) + '</div>' : '') +
      '<div class="ace-mya-event-title">' + escapeHtml(e.title) + '</div>' +
      (e.location ? '<div class="ace-mya-event-loc">' + escapeHtml(e.location) + '</div>' : '') +
      '</div>' +
      '<button class="ace-mya-event-remove" data-key="' + e.key + '" aria-label="Remove">' +
      '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>' +
      '</button>' +
      '</div>'
    );
  }
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function boot() {
    injectStyles();
    if (PAGE_PATH === 'agenda.html') { injectStarsOnAgenda(); return; }
    if (PAGE_PATH === 'my-agenda.html') { renderList(); return; }
    if (PAGE_PATH === 'index.html' || PAGE_PATH === '') {
      injectStarsOnSites();
      injectHomeLink();
      return;
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
