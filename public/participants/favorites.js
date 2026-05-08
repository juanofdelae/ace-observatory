/**
 * Favorites module — auto-initializes based on page context.
 * - On delegate profile: injects a star button that toggles favorite state.
 * - On favorites.html: renders the list of starred delegates.
 * - On info center home (index.html): injects a "My Favorites" link into the search section.
 */
(function () {
  var STORAGE_KEY = 'ace.favorites.delegates';
  var PAGE_PATH = location.pathname.replace(/^.*\//, '').toLowerCase();

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function save(map) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch (e) {}
  }
  function slugFromPath() {
    return PAGE_PATH.replace(/\.html$/, '');
  }
  function isDelegatePage() {
    var nonDelegate = ['index.html', 'agenda.html', 'map.html', 'network.html',
                       'analytics.html', 'organizers.html', 'participants.html',
                       'favorites.html', 'search.html', ''];
    return nonDelegate.indexOf(PAGE_PATH) === -1 && PAGE_PATH.endsWith('.html');
  }
  function extractMeta() {
    var name = document.querySelector('.profile-name');
    var role = document.querySelector('.profile-title');
    var org = document.querySelector('.profile-org');
    var countryEl = document.querySelector('.profile-country');
    var country = countryEl ? countryEl.textContent.trim() : '';
    return {
      slug: slugFromPath(),
      url: PAGE_PATH,
      name: name ? name.textContent.trim() : slugFromPath(),
      role: role ? role.textContent.trim() : '',
      org: org ? org.textContent.trim() : '',
      country: country,
    };
  }
  function initials(name) {
    return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }
  function injectStyles() {
    if (document.getElementById('ace-fav-styles')) return;
    var css = [
      '.ace-fav-btn {',
      '  position: fixed; top: calc(12px + env(safe-area-inset-top)); right: 14px; z-index: 1001;',
      '  width: 44px; height: 44px; border-radius: 50%; border: none; cursor: pointer;',
      '  background: rgba(255,255,255,0.95); box-shadow: 0 4px 16px rgba(0,0,0,0.12);',
      '  display: flex; align-items: center; justify-content: center;',
      '  color: #8A94A6; transition: transform 0.15s ease, color 0.15s ease;',
      '}',
      '.ace-fav-btn:active { transform: scale(0.92); }',
      '.ace-fav-btn.is-fav { color: #E9B94A; }',
      '.ace-fav-btn svg { width: 22px; height: 22px; fill: currentColor; stroke: currentColor; stroke-width: 2; }',
      '.ace-fav-btn.is-fav svg { fill: currentColor; }',
      '.ace-fav-btn:not(.is-fav) svg { fill: none; }',
      '',
      '.ace-fav-link {',
      '  display: inline-flex; align-items: center; gap: 6px;',
      '  background: #fff; border-radius: 999px; padding: 8px 14px 8px 12px;',
      '  color: #1A4272; font-family: Montserrat, sans-serif; font-weight: 600; font-size: 0.82rem;',
      '  text-decoration: none; box-shadow: 0 2px 10px rgba(20,40,80,0.08);',
      '  border: 1px solid rgba(20,40,80,0.08);',
      '}',
      '.ace-fav-link svg { width: 16px; height: 16px; fill: #E9B94A; }',
      '.ace-fav-link-wrap { max-width: 900px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; margin-bottom: 18px; }',
      '.ace-fav-link { padding: 10px 16px 10px 14px; }',
      '',
      '.ace-fav-container { max-width: 900px; margin: 0 auto; padding: 24px 20px 80px; }',
      '.ace-fav-container h1 { font-family: Montserrat, sans-serif; color: #003b4a; font-size: 24px; font-weight: 700; margin-bottom: 6px; }',
      '.ace-fav-container .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 20px; }',
      '.ace-fav-row { display: flex; gap: 6px; align-items: stretch; margin-bottom: 8px; min-width: 0; }',
      '.ace-fav-card {',
      '  flex: 1; min-width: 0;',
      '  display: flex; align-items: center; gap: 14px; padding: 12px 16px;',
      '  background: #fff; border-radius: 14px; text-decoration: none; color: inherit;',
      '  border: 1px solid rgba(20,40,80,0.06);',
      '}',
      '.ace-fav-card:active { background: #F5F6F8; }',
      '.ace-fav-avatar {',
      '  width: 44px; height: 44px; border-radius: 50%; background: #F5F6F8; color: #1A4272;',
      '  display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;',
      '  font-family: Montserrat, sans-serif;',
      '}',
      '.ace-fav-body { flex: 1; min-width: 0; font-family: Montserrat, sans-serif; }',
      '.ace-fav-name { font-weight: 700; color: #003b4a; font-size: 15px; margin-bottom: 2px; }',
      '.ace-fav-meta { color: #6b7280; font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.ace-fav-remove {',
      '  border: none; background: transparent; cursor: pointer; color: #8A94A6;',
      '  padding: 8px; border-radius: 50%; flex-shrink: 0;',
      '}',
      '.ace-fav-remove:active { background: #F5F6F8; color: #ef4444; }',
      '.ace-fav-remove svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }',
      '.ace-fav-empty { padding: 40px 20px; text-align: center; color: #6b7280; font-family: Montserrat, sans-serif; }',
      '.ace-fav-empty svg { width: 56px; height: 56px; color: #8A94A6; opacity: 0.5; margin-bottom: 12px; }',
      '.ace-fav-empty h2 { color: #1A4272; font-size: 16px; font-weight: 600; margin-bottom: 4px; }',
      '.ace-fav-empty a { color: #4C4EE8; font-weight: 600; text-decoration: none; }',
    ].join('\n');
    var style = document.createElement('style');
    style.id = 'ace-fav-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }
  function starSvg() {
    return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linejoin="round" stroke-linecap="round" d="M12 3l2.9 6.9L22 10.7l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-6.5L2 10.7l7.1-.8z"/></svg>';
  }
  function injectStarButton() {
    var meta = extractMeta();
    if (!meta.name || meta.name === meta.slug) return; // not a real profile
    var btn = document.createElement('button');
    btn.className = 'ace-fav-btn';
    btn.setAttribute('aria-label', 'Toggle favorite');
    btn.innerHTML = starSvg();
    function refresh() {
      var favs = load();
      if (favs[meta.slug]) {
        btn.classList.add('is-fav');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('is-fav');
        btn.setAttribute('aria-pressed', 'false');
      }
    }
    btn.addEventListener('click', function () {
      var favs = load();
      if (favs[meta.slug]) {
        delete favs[meta.slug];
      } else {
        favs[meta.slug] = {
          name: meta.name, role: meta.role, org: meta.org,
          country: meta.country, url: meta.url,
          starred_at: Date.now(),
        };
      }
      save(favs);
      refresh();
    });
    document.body.appendChild(btn);
    refresh();
  }
  function injectHomeLink() {
    var searchSection = document.querySelector('.search-section');
    if (!searchSection) return;
    var wrap = document.createElement('div');
    wrap.className = 'ace-fav-link-wrap';
    wrap.innerHTML = '<a href="favorites.html" class="ace-fav-link">' + starSvg() + ' My Contacts</a>';
    searchSection.parentNode.insertBefore(wrap, searchSection.nextSibling);
  }
  function renderFavorites() {
    var container = document.getElementById('ace-fav-container');
    if (!container) return;
    var favs = load();
    var entries = Object.keys(favs).map(function (k) {
      return Object.assign({ slug: k }, favs[k]);
    }).sort(function (a, b) { return (b.starred_at || 0) - (a.starred_at || 0); });

    if (!entries.length) {
      container.innerHTML =
        '<div class="ace-fav-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.9 6.9L22 10.7l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-6.5L2 10.7l7.1-.8z"/></svg>' +
        '<h2>No favorites yet</h2>' +
        '<p>Tap the ★ on a delegate profile to save them here.<br><a href="participants.html">Browse delegates →</a></p>' +
        '</div>';
      return;
    }
    var html = '<div class="subtitle">' + entries.length + ' saved delegate' + (entries.length === 1 ? '' : 's') + '</div>';
    entries.forEach(function (e) {
      var sub = [e.country, e.role || e.org].filter(Boolean).join(' · ');
      html += (
        '<div class="ace-fav-row">' +
        '<a class="ace-fav-card" href="' + e.url + '">' +
        '<div class="ace-fav-avatar">' + initials(e.name) + '</div>' +
        '<div class="ace-fav-body">' +
        '<div class="ace-fav-name">' + e.name + '</div>' +
        '<div class="ace-fav-meta">' + sub + '</div>' +
        '</div>' +
        '</a>' +
        '<button class="ace-fav-remove" data-slug="' + e.slug + '" aria-label="Remove">' +
        '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>' +
        '</button>' +
        '</div>'
      );
    });
    container.innerHTML = html;
    container.querySelectorAll('.ace-fav-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var slug = btn.getAttribute('data-slug');
        var f = load();
        delete f[slug];
        save(f);
        renderFavorites();
      });
    });
  }

  function boot() {
    injectStyles();
    if (PAGE_PATH === 'favorites.html') {
      renderFavorites();
      return;
    }
    if (PAGE_PATH === 'index.html' || PAGE_PATH === '') {
      injectHomeLink();
      return;
    }
    if (isDelegatePage()) {
      injectStarButton();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
