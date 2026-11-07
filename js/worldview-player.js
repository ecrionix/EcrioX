/**
 * EcrioX WorldView - Unified Camera Stream Player
 * Supports YouTube Live, HLS (hls.js + native Safari), and Live Snapshot Images.
 * Zero fake streams. Complete error handling, attribution, and lifecycle teardown.
 */

(function (window) {
  'use strict';

  class WorldViewPlayer {
    constructor() {
      this.currentCamera = null;
      this.hlsInstance = null;
      this.refreshInterval = null;
      this.countdownTimer = null;
      this.refreshSeconds = 15;
      this.remainingSeconds = 15;
    }

    /**
     * Open player modal with specified camera
     */
    openCamera(camera) {
      if (!camera) return;
      this.currentCamera = camera;
      this.teardown();

      const modal = document.getElementById('worldviewPlayerModal');
      if (!modal) return;

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Update URL hash / state for deep linking
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('cam', camera.id);
        window.history.replaceState({ camId: camera.id }, '', url.toString());
      } catch (e) {}

      // Update metadata headers
      document.getElementById('playerTitle').textContent = camera.title;
      document.getElementById('playerLocation').innerHTML = `${camera.flag || '📍'} ${camera.city}, ${camera.country}`;
      document.getElementById('playerCategoryBadge').textContent = camera.categoryName;
      document.getElementById('playerStreamTypeBadge').textContent = camera.streamType === 'live-video' ? '🔴 LIVE VIDEO' : '📸 LIVE IMAGE (15s)';
      document.getElementById('playerStreamTypeBadge').className = `stream-badge ${camera.streamType}`;
      document.getElementById('playerDescription').textContent = camera.description;
      document.getElementById('playerAttribution').textContent = camera.attribution || `Feed provided courtesy of ${camera.provider}`;
      document.getElementById('playerSourceLink').href = camera.sourceUrl || '#';

      // Render the player viewport
      this.renderPlayerContent(camera);
      this.renderRelatedCameras(camera);

      // Track analytics safely
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'camera_open', { camera_id: camera.id, category: camera.category });
      }
    }

    /**
     * Render stream inside the player container based on playerType
     */
    renderPlayerContent(camera) {
      const container = document.getElementById('playerScreenContainer');
      const errorScreen = document.getElementById('playerErrorScreen');
      const loader = document.getElementById('playerLoader');
      if (!container) return;

      container.innerHTML = '';
      if (errorScreen) errorScreen.style.display = 'none';
      if (loader) loader.style.display = 'flex';

      if (camera.playerType === 'youtube') {
        this.renderYouTubeStream(camera, container, loader, errorScreen);
      } else if (camera.playerType === 'hls') {
        this.renderHlsStream(camera, container, loader, errorScreen);
      } else if (camera.playerType === 'image') {
        this.renderLiveImageStream(camera, container, loader, errorScreen);
      } else {
        this.showError('Unsupported stream format for this camera feed.');
      }
    }

    renderYouTubeStream(camera, container, loader, errorScreen) {
      const iframe = document.createElement('iframe');
      iframe.className = 'player-iframe';
      iframe.src = camera.streamUrl;
      iframe.title = camera.title;
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';

      iframe.onload = () => {
        if (loader) loader.style.display = 'none';
      };

      iframe.onerror = () => {
        this.showError('Unable to connect to the YouTube Live broadcast. The feed may be temporarily offline.');
      };

      container.appendChild(iframe);
    }

    renderHlsStream(camera, container, loader, errorScreen) {
      const video = document.createElement('video');
      video.className = 'player-video';
      video.controls = true;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.style.width = '100%';
      video.style.height = '100%';
      container.appendChild(video);

      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30
        });
        this.hlsInstance = hls;

        hls.loadSource(camera.streamUrl);
        hls.attachMedia(video);

        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          if (loader) loader.style.display = 'none';
          video.play().catch(e => console.log('Autoplay muted requirement:', e));
        });

        hls.on(window.Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case window.Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case window.Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                this.showError('HLS stream encountered a playback error or is currently offline.');
                this.teardown();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        video.src = camera.streamUrl;
        video.addEventListener('loadedmetadata', () => {
          if (loader) loader.style.display = 'none';
          video.play().catch(e => console.log('Autoplay:', e));
        });
        video.addEventListener('error', () => {
          this.showError('Native HLS stream playback failed or is currently offline.');
        });
      } else {
        this.showError('Your browser does not support HLS video streaming.');
      }
    }

    renderLiveImageStream(camera, container, loader, errorScreen) {
      const wrapper = document.createElement('div');
      wrapper.className = 'live-image-wrapper';
      wrapper.style.position = 'relative';
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.justifyContent = 'center';
      wrapper.style.background = '#000';

      const img = document.createElement('img');
      img.className = 'live-snapshot-img';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';

      // Refresh HUD
      const hud = document.createElement('div');
      hud.className = 'live-image-hud';
      hud.innerHTML = `
        <div style="background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); color:#fff; padding:0.4rem 0.8rem; border-radius:6px; font-size:0.75rem; display:flex; align-items:center; gap:0.5rem; border:1px solid rgba(255,255,255,0.15);">
          <span>📸 Live Snapshot</span>
          <span>•</span>
          <span id="imgCountdownLabel">Refreshing in 15s</span>
          <button type="button" id="btnManualRefreshImg" style="background:#2563eb; color:#fff; border:none; border-radius:4px; padding:0.15rem 0.45rem; font-size:0.7rem; cursor:pointer;">Refresh Now</button>
        </div>
      `;
      hud.style.position = 'absolute';
      hud.style.bottom = '12px';
      hud.style.left = '12px';
      hud.style.zIndex = '5';

      const updateImage = () => {
        if (loader) loader.style.display = 'flex';
        const cacheBuster = `?t=${Date.now()}`;
        img.src = camera.streamUrl + cacheBuster;
      };

      img.onload = () => {
        if (loader) loader.style.display = 'none';
        this.remainingSeconds = this.refreshSeconds;
      };

      img.onerror = () => {
        this.showError('Unable to load live image snapshot from this environmental camera.');
      };

      wrapper.appendChild(img);
      wrapper.appendChild(hud);
      container.appendChild(wrapper);

      updateImage();

      // Setup countdown and auto-refresh
      hud.querySelector('#btnManualRefreshImg')?.addEventListener('click', () => {
        updateImage();
      });

      this.remainingSeconds = this.refreshSeconds;
      this.countdownTimer = setInterval(() => {
        this.remainingSeconds--;
        const label = document.getElementById('imgCountdownLabel');
        if (label) {
          label.textContent = `Refreshing in ${this.remainingSeconds}s`;
        }
        if (this.remainingSeconds <= 0) {
          updateImage();
        }
      }, 1000);
    }

    renderRelatedCameras(current) {
      const container = document.getElementById('playerRelatedGrid');
      if (!container || !window.ECRIOX_WORLDVIEW_DATA) return;

      const all = window.ECRIOX_WORLDVIEW_DATA.cameras;
      const related = all
        .filter(c => c.id !== current.id && (c.category === current.category || c.country === current.country))
        .slice(0, 4);

      container.innerHTML = related.map(c => `
        <div class="related-camera-card" data-camera-id="${c.id}" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; overflow:hidden; cursor:pointer; transition:transform 0.2s ease;">
          <div style="position:relative; aspect-ratio:16/9; background:#000;">
            <img src="${c.thumbnailUrl}" alt="${c.title}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
            <span style="position:absolute; top:6px; left:6px; background:rgba(0,0,0,0.7); color:#fff; font-size:0.65rem; padding:0.15rem 0.4rem; border-radius:3px;">${c.flag} ${c.city}</span>
          </div>
          <div style="padding:0.6rem;">
            <div style="font-size:0.8125rem; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.title}</div>
            <div style="font-size:0.7rem; color:#94a3b8;">${c.categoryName}</div>
          </div>
        </div>
      `).join('');

      container.querySelectorAll('.related-camera-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-camera-id');
          const target = window.ECRIOX_WORLDVIEW_DATA.getById(id);
          if (target) this.openCamera(target);
        });
      });
    }

    showError(message) {
      const loader = document.getElementById('playerLoader');
      const errorScreen = document.getElementById('playerErrorScreen');
      const errorMsg = document.getElementById('playerErrorMessage');
      if (loader) loader.style.display = 'none';
      if (errorScreen) {
        errorScreen.style.display = 'flex';
        if (errorMsg) errorMsg.textContent = message || 'Stream temporarily unavailable.';
      }
    }

    closeModal() {
      const modal = document.getElementById('worldviewPlayerModal');
      if (modal) modal.classList.remove('active');
      document.body.style.overflow = '';
      this.teardown();

      // Clear cam parameter from URL without page reload
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('cam');
        window.history.replaceState({}, '', url.pathname + url.search);
      } catch (e) {}
    }

    toggleFullscreen() {
      const container = document.getElementById('playerScreenContainer');
      if (!container) return;

      if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }

    teardown() {
      if (this.hlsInstance) {
        this.hlsInstance.destroy();
        this.hlsInstance = null;
      }
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
      const container = document.getElementById('playerScreenContainer');
      if (container) container.innerHTML = '';
    }
  }

  window.ECRIOX_WORLDVIEW_PLAYER = new WorldViewPlayer();

})(typeof window !== 'undefined' ? window : this);
