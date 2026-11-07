/**
 * EcrioX WorldView - Discovery & Search Controller
 * Connects Globe, Map, Filter Tabs, Search Suggestions, Random Discovery, and Grid cards.
 */

(function (window) {
  'use strict';

  let currentCategory = 'all';
  let currentSort = 'featured';
  let currentSearchQuery = '';
  let favorites = new Set();

  function initWorldViewUI() {
    loadFavorites();

    const data = window.ECRIOX_WORLDVIEW_DATA;
    if (!data) return;

    renderCategoryFilters();
    renderCameraGrid();
    setupSearch();
    setupSort();
    setupViewToggles();
    setupRandomDiscovery();
    setupPlayerModalControls();
    checkUrlDeepLink();
  }

  function loadFavorites() {
    try {
      const stored = localStorage.getItem('ecriox_worldview_favorites');
      if (stored) {
        favorites = new Set(JSON.parse(stored));
      }
    } catch (e) {}
  }

  function saveFavorites() {
    try {
      localStorage.setItem('ecriox_worldview_favorites', JSON.stringify(Array.from(favorites)));
    } catch (e) {}
  }

  function renderCategoryFilters() {
    const container = document.getElementById('categoryFilterBar');
    if (!container || !window.ECRIOX_WORLDVIEW_DATA) return;

    const categories = window.ECRIOX_WORLDVIEW_DATA.categories;
    container.innerHTML = categories.map(cat => `
      <button type="button" class="category-pill-btn ${cat.id === currentCategory ? 'active' : ''}" data-cat-id="${cat.id}">
        <span>${cat.icon}</span>
        <span>${cat.name}</span>
      </button>
    `).join('');

    container.querySelectorAll('.category-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.category-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-cat-id');
        renderCameraGrid();
      });
    });
  }

  function renderCameraGrid() {
    const grid = document.getElementById('worldviewCamerasGrid');
    const emptyNotice = document.getElementById('gridEmptyNotice');
    const countDisplay = document.getElementById('feedCountDisplay');
    if (!grid || !window.ECRIOX_WORLDVIEW_DATA) return;

    let list = window.ECRIOX_WORLDVIEW_DATA.getByCategory(currentCategory);

    // Apply search query
    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q)
      );
    }

    // Apply sort
    if (currentSort === 'featured') {
      list = list.slice().sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else if (currentSort === 'country') {
      list = list.slice().sort((a, b) => a.country.localeCompare(b.country));
    } else if (currentSort === 'city') {
      list = list.slice().sort((a, b) => a.city.localeCompare(b.city));
    }

    if (countDisplay) {
      countDisplay.textContent = `Showing ${list.length} verified cameras`;
    }

    if (list.length === 0) {
      grid.innerHTML = '';
      if (emptyNotice) emptyNotice.style.display = 'block';
      return;
    }

    if (emptyNotice) emptyNotice.style.display = 'none';

    grid.innerHTML = list.map(c => {
      const isFav = favorites.has(c.id);
      const streamBadge = c.streamType === 'live-video'
        ? '<span class="cam-badge badge-video">🔴 LIVE STREAM</span>'
        : '<span class="cam-badge badge-snapshot">📸 LIVE IMAGE (15s)</span>';

      return `
        <article class="camera-card" data-camera-id="${c.id}">
          <div class="camera-card-media">
            <img src="${c.thumbnailUrl}" alt="${c.title}" loading="lazy" class="camera-card-img">
            <div class="camera-card-badges">
              ${streamBadge}
              <button type="button" class="btn-fav-card ${isFav ? 'is-favorited' : ''}" data-fav-id="${c.id}" aria-label="Save to favorites">
                ${isFav ? '★' : '☆'}
              </button>
            </div>
            <div class="camera-card-location-pill">
              <span>${c.flag || '📍'}</span>
              <span>${escapeHTML(c.city)}, ${escapeHTML(c.country)}</span>
            </div>
          </div>

          <div class="camera-card-content">
            <div class="camera-card-category">${escapeHTML(c.categoryName)}</div>
            <h3 class="camera-card-title">${escapeHTML(c.title)}</h3>
            <p class="camera-card-desc">${escapeHTML(c.description)}</p>

            <div class="camera-card-footer">
              <span class="provider-pill" title="Source: ${escapeHTML(c.provider)}">
                🏛️ ${escapeHTML(c.provider.substring(0, 24))}...
              </span>
              <button type="button" class="btn-play-card" data-play-id="${c.id}">
                ▶ Watch Live
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach card click handlers
    grid.querySelectorAll('.camera-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // If clicking favorite button, toggle fav
        if (e.target.closest('.btn-fav-card')) {
          const btn = e.target.closest('.btn-fav-card');
          const id = btn.getAttribute('data-fav-id');
          if (favorites.has(id)) {
            favorites.delete(id);
            btn.classList.remove('is-favorited');
            btn.textContent = '☆';
          } else {
            favorites.add(id);
            btn.classList.add('is-favorited');
            btn.textContent = '★';
          }
          saveFavorites();
          return;
        }

        const id = card.getAttribute('data-camera-id');
        const target = window.ECRIOX_WORLDVIEW_DATA.getById(id);
        if (target && window.ECRIOX_WORLDVIEW_PLAYER) {
          window.ECRIOX_WORLDVIEW_PLAYER.openCamera(target);
          if (window.ECRIOX_WORLDVIEW_GLOBE) {
            window.ECRIOX_WORLDVIEW_GLOBE.flyToCamera(target);
          }
        }
      });
    });
  }

  function setupSearch() {
    const input = document.getElementById('worldviewSearchInput');
    const dropdown = document.getElementById('searchSuggestionsBox');
    if (!input) return;

    input.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim();
      renderCameraGrid();

      // Show suggestions if typed 2+ chars
      if (currentSearchQuery.length >= 2 && dropdown) {
        const matches = window.ECRIOX_WORLDVIEW_DATA.search(currentSearchQuery).slice(0, 5);
        if (matches.length > 0) {
          dropdown.style.display = 'block';
          dropdown.innerHTML = matches.map(m => `
            <div class="search-suggestion-item" data-cam-id="${m.id}">
              <div style="font-weight:700; font-size:0.875rem; color:var(--wv-text);">${m.flag} ${escapeHTML(m.title)}</div>
              <div style="font-size:0.75rem; color:var(--wv-text-muted);">${escapeHTML(m.city)}, ${escapeHTML(m.country)} • ${escapeHTML(m.categoryName)}</div>
            </div>
          `).join('');

          dropdown.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
              const id = item.getAttribute('data-cam-id');
              const target = window.ECRIOX_WORLDVIEW_DATA.getById(id);
              dropdown.style.display = 'none';
              input.value = '';
              currentSearchQuery = '';
              renderCameraGrid();
              if (target && window.ECRIOX_WORLDVIEW_PLAYER) {
                window.ECRIOX_WORLDVIEW_PLAYER.openCamera(target);
                if (window.ECRIOX_WORLDVIEW_GLOBE) {
                  window.ECRIOX_WORLDVIEW_GLOBE.flyToCamera(target);
                }
              }
            });
          });
        } else {
          dropdown.style.display = 'none';
        }
      } else if (dropdown) {
        dropdown.style.display = 'none';
      }
    });

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
        dropdown.style.display = 'none';
      }
    });
  }

  function setupSort() {
    const select = document.getElementById('sortSelect');
    if (select) {
      select.addEventListener('change', () => {
        currentSort = select.value;
        renderCameraGrid();
      });
    }
  }

  function setupViewToggles() {
    const btnGlobe = document.getElementById('btnViewGlobe');
    const btnMap = document.getElementById('btnViewMap');
    const globeWrapper = document.getElementById('globeContainerWrapper');
    const mapWrapper = document.getElementById('mapContainerWrapper');

    if (btnGlobe && btnMap) {
      btnGlobe.addEventListener('click', () => {
        btnGlobe.classList.add('active');
        btnMap.classList.remove('active');
        if (globeWrapper) globeWrapper.style.display = 'block';
        if (mapWrapper) mapWrapper.style.display = 'none';
      });

      btnMap.addEventListener('click', () => {
        btnMap.classList.add('active');
        btnGlobe.classList.remove('active');
        if (globeWrapper) globeWrapper.style.display = 'none';
        if (mapWrapper) {
          mapWrapper.style.display = 'block';
          if (window.ECRIOX_WORLDVIEW_GLOBE) {
            window.ECRIOX_WORLDVIEW_GLOBE.initLeafletMap('leafletMapContainer');
          }
        }
      });
    }
  }

  function setupRandomDiscovery() {
    const btn = document.getElementById('btnRandomCamera');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const all = window.ECRIOX_WORLDVIEW_DATA.cameras;
      if (!all || all.length === 0) return;

      const randomCam = all[Math.floor(Math.random() * all.length)];
      if (randomCam) {
        if (window.ECRIOX_WORLDVIEW_GLOBE) {
          window.ECRIOX_WORLDVIEW_GLOBE.flyToCamera(randomCam);
        }
        if (window.ECRIOX_WORLDVIEW_PLAYER) {
          window.ECRIOX_WORLDVIEW_PLAYER.openCamera(randomCam);
        }
      }
    });
  }

  function setupPlayerModalControls() {
    const closeBtn = document.getElementById('btnClosePlayerModal');
    const fullscreenBtn = document.getElementById('btnPlayerFullscreen');
    const retryBtn = document.getElementById('btnRetryStream');
    const modal = document.getElementById('worldviewPlayerModal');

    closeBtn?.addEventListener('click', () => {
      window.ECRIOX_WORLDVIEW_PLAYER.closeModal();
    });

    fullscreenBtn?.addEventListener('click', () => {
      window.ECRIOX_WORLDVIEW_PLAYER.toggleFullscreen();
    });

    retryBtn?.addEventListener('click', () => {
      if (window.ECRIOX_WORLDVIEW_PLAYER.currentCamera) {
        window.ECRIOX_WORLDVIEW_PLAYER.renderPlayerContent(window.ECRIOX_WORLDVIEW_PLAYER.currentCamera);
      }
    });

    // Close on outside overlay click
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        window.ECRIOX_WORLDVIEW_PLAYER.closeModal();
      }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        window.ECRIOX_WORLDVIEW_PLAYER.closeModal();
      }
    });
  }

  function checkUrlDeepLink() {
    try {
      const url = new URL(window.location.href);
      const camId = url.searchParams.get('cam');
      if (camId && window.ECRIOX_WORLDVIEW_DATA) {
        const target = window.ECRIOX_WORLDVIEW_DATA.getById(camId);
        if (target && window.ECRIOX_WORLDVIEW_PLAYER) {
          setTimeout(() => {
            window.ECRIOX_WORLDVIEW_PLAYER.openCamera(target);
            if (window.ECRIOX_WORLDVIEW_GLOBE) {
              window.ECRIOX_WORLDVIEW_GLOBE.flyToCamera(target);
            }
          }, 400);
        }
      }
    } catch (e) {}
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.ECRIOX_WORLDVIEW_UI = {
    init: initWorldViewUI
  };

})(typeof window !== 'undefined' ? window : this);
