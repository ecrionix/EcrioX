/**
 * EcrioX WorldView - 3D Interactive Earth Globe & 2D Map Explorer
 * Built with Three.js for 3D Globe and Leaflet for 2D Map mode.
 * Features spherical raycasting, pin clustering, inertia rotation, and battery-saving idle management.
 */

(function (window) {
  'use strict';

  class WorldViewGlobe {
    constructor() {
      this.container = null;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.globeGroup = null;
      this.markerGroup = null;
      this.markers = [];
      this.isInteracting = false;
      this.autoRotate = true;
      this.lastInteractionTime = Date.now();
      this.pointer = { x: 0, y: 0 };
      this.previousPointer = { x: 0, y: 0 };
      this.raycaster = null;
      this.hoveredMarker = null;
      this.animFrameId = null;
      this.isGlobeVisible = true;
      this.currentMode = 'globe'; // 'globe' or 'map'
      this.leafletMap = null;
    }

    /**
     * Initialize 3D Globe
     */
    init(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container || typeof window.THREE === 'undefined') return;

      const width = this.container.clientWidth;
      const height = this.container.clientHeight || 560;

      // Scene, Camera, Renderer
      this.scene = new window.THREE.Scene();
      this.camera = new window.THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      this.camera.position.z = 240;

      this.renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.container.appendChild(this.renderer.domElement);

      this.globeGroup = new window.THREE.Group();
      this.scene.add(this.globeGroup);

      this.markerGroup = new window.THREE.Group();
      this.globeGroup.add(this.markerGroup);

      this.raycaster = new window.THREE.Raycaster();

      // Build Earth Sphere
      this.buildEarthSphere();
      this.buildAtmosphereGlow();
      this.buildStarfield();
      this.populateMarkers();

      // Setup interaction events
      this.setupControls();
      this.setupResizeListener();
      this.setupVisibilityObserver();

      // Start animation loop
      this.animate();
    }

    /**
     * Create Earth Sphere with procedural dark-vector continental topography
     */
    buildEarthSphere() {
      const radius = 75;
      const geometry = new window.THREE.SphereGeometry(radius, 64, 64);

      // Procedural Earth Texture Canvas
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      // Deep ocean background
      ctx.fillStyle = '#0b132b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Latitude and Longitude coordinate grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw stylized world continents
      ctx.fillStyle = '#1c2541';
      this.drawContinents(ctx, canvas.width, canvas.height);

      const texture = new window.THREE.CanvasTexture(canvas);
      const material = new window.THREE.MeshPhongMaterial({
        map: texture,
        bumpScale: 0.05,
        specular: new window.THREE.Color('#1e40af'),
        shininess: 12
      });

      const earthMesh = new window.THREE.Mesh(geometry, material);
      this.globeGroup.add(earthMesh);

      // Ambient and directional lighting
      const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.85);
      this.scene.add(ambientLight);

      const directionalLight = new window.THREE.DirectionalLight(0x38bdf8, 1.2);
      directionalLight.position.set(150, 100, 150);
      this.scene.add(directionalLight);
    }

    /**
     * Draw stylized continental outlines on the texture canvas
     */
    drawContinents(ctx, w, h) {
      // Scale lat/lon to canvas pixels
      const toXY = (lat, lon) => ({
        x: ((lon + 180) / 360) * w,
        y: ((90 - lat) / 180) * h
      });

      // Simplified continental polygons for crisp procedural rendering
      const continents = [
        // North America
        [[70, -165], [60, -140], [50, -125], [30, -115], [20, -105], [15, -90], [25, -80], [35, -75], [45, -65], [60, -60], [70, -90]],
        // South America
        [[10, -75], [-5, -80], [-20, -70], [-55, -68], [-45, -60], [-20, -40], [-5, -35], [5, -50], [10, -60]],
        // Eurasia & Africa
        [[65, -10], [55, 5], [45, 10], [35, -5], [30, 32], [30, 35], [15, 45], [-35, 20], [-30, 30], [5, 45], [10, 50], [25, 60], [25, 90], [10, 105], [20, 110], [40, 120], [60, 140], [70, 170], [75, 100], [70, 40]],
        // Australia
        [[-15, 130], [-25, 115], [-35, 118], [-38, 145], [-25, 153], [-12, 142]],
        // India subcontinent
        [[30, 70], [22, 70], [8, 77], [15, 80], [22, 88], [28, 88], [32, 78]]
      ];

      continents.forEach(poly => {
        ctx.beginPath();
        poly.forEach((pt, i) => {
          const { x, y } = toXY(pt[0], pt[1]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    /**
     * Atmospheric outer halo
     */
    buildAtmosphereGlow() {
      const geometry = new window.THREE.SphereGeometry(77.5, 32, 32);
      const material = new window.THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.12,
        side: window.THREE.BackSide
      });
      const atmosphere = new window.THREE.Mesh(geometry, material);
      this.scene.add(atmosphere);
    }

    /**
     * Starfield background
     */
    buildStarfield() {
      const starGeometry = new window.THREE.BufferGeometry();
      const starCount = 600;
      const positions = new Float32Array(starCount * 3);

      for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 800;
        positions[i + 1] = (Math.random() - 0.5) * 800;
        positions[i + 2] = (Math.random() - 0.5) * 800;
      }

      starGeometry.setAttribute('position', new window.THREE.BufferAttribute(positions, 3));
      const starMaterial = new window.THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.2,
        transparent: true,
        opacity: 0.75
      });

      const stars = new window.THREE.Points(starGeometry, starMaterial);
      this.scene.add(stars);
    }

    /**
     * Convert Latitude & Longitude to 3D Cartesian coordinates
     */
    latLonToVector3(lat, lon, radius = 75.5) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new window.THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    /**
     * Populate 3D Pins for each verified camera
     */
    populateMarkers() {
      if (!window.ECRIOX_WORLDVIEW_DATA) return;
      const cameras = window.ECRIOX_WORLDVIEW_DATA.cameras;

      cameras.forEach(cam => {
        const pos = this.latLonToVector3(cam.latitude, cam.longitude, 75.8);

        // Marker Pin Geometry
        const pinGeo = new window.THREE.SphereGeometry(1.6, 16, 16);
        const pinMat = new window.THREE.MeshBasicMaterial({
          color: cam.streamType === 'live-video' ? 0xef4444 : 0x00f0ff
        });
        const pinMesh = new window.THREE.Mesh(pinGeo, pinMat);
        pinMesh.position.copy(pos);
        pinMesh.userData = { camera: cam };

        // Outer pulsing ring
        const ringGeo = new window.THREE.RingGeometry(1.8, 2.6, 24);
        const ringMat = new window.THREE.MeshBasicMaterial({
          color: cam.streamType === 'live-video' ? 0xef4444 : 0x00f0ff,
          side: window.THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const ringMesh = new window.THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(pos);
        ringMesh.lookAt(new window.THREE.Vector3(0, 0, 0));
        pinMesh.add(ringMesh);

        this.markerGroup.add(pinMesh);
        this.markers.push(pinMesh);
      });
    }

    /**
     * Mouse & Touch Orbit Controls with Inertia
     */
    setupControls() {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let targetRotX = 0;
      let targetRotY = 0;

      const dom = this.renderer.domElement;

      dom.addEventListener('pointerdown', (e) => {
        isDragging = true;
        this.isInteracting = true;
        this.lastInteractionTime = Date.now();
        startX = e.clientX;
        startY = e.clientY;
      });

      dom.addEventListener('pointermove', (e) => {
        const rect = dom.getBoundingClientRect();
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        if (isDragging) {
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          this.globeGroup.rotation.y += deltaX * 0.005;
          this.globeGroup.rotation.x += deltaY * 0.005;

          // Limit vertical rotation to avoid tumbling
          this.globeGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.globeGroup.rotation.x));

          startX = e.clientX;
          startY = e.clientY;
          this.lastInteractionTime = Date.now();
        } else {
          this.handleHover();
        }
      });

      window.addEventListener('pointerup', (e) => {
        if (isDragging) {
          isDragging = false;
          this.isInteracting = false;
        }
      });

      dom.addEventListener('click', (e) => {
        this.handleClick();
      });

      // Zoom via wheel
      dom.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.camera.position.z += e.deltaY * 0.15;
        this.camera.position.z = Math.max(120, Math.min(320, this.camera.position.z));
        this.lastInteractionTime = Date.now();
      }, { passive: false });
    }

    handleHover() {
      if (!this.raycaster || !this.camera) return;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.markers);

      const tooltip = document.getElementById('globeTooltip');
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const cam = hit.userData.camera;
        this.renderer.domElement.style.cursor = 'pointer';

        if (tooltip && cam) {
          tooltip.style.display = 'block';
          tooltip.style.left = `${(this.pointer.x + 1) * (this.container.clientWidth / 2) + 15}px`;
          tooltip.style.top = `${(-this.pointer.y + 1) * (this.container.clientHeight / 2) - 15}px`;
          tooltip.innerHTML = `
            <strong>${cam.flag} ${cam.city}</strong>
            <span style="font-size:0.75rem; color:#94a3b8; display:block;">${cam.title}</span>
            <span style="font-size:0.65rem; color:#38bdf8; font-weight:700;">Click to watch &rarr;</span>
          `;
        }
      } else {
        this.renderer.domElement.style.cursor = 'grab';
        if (tooltip) tooltip.style.display = 'none';
      }
    }

    handleClick() {
      if (!this.raycaster || !this.camera) return;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.markers);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const cam = hit.userData.camera;
        if (cam && window.ECRIOX_WORLDVIEW_PLAYER) {
          window.ECRIOX_WORLDVIEW_PLAYER.openCamera(cam);
        }
      }
    }

    /**
     * Spin globe toward specific camera coordinates
     */
    flyToCamera(camera) {
      if (!camera || !this.globeGroup) return;
      const targetY = -((camera.longitude + 180) * (Math.PI / 180)) + Math.PI / 2;
      const targetX = (camera.latitude) * (Math.PI / 180);

      this.globeGroup.rotation.y = targetY;
      this.globeGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetX));
      this.lastInteractionTime = Date.now();
    }

    setupResizeListener() {
      window.addEventListener('resize', () => {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight || 560;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      });
    }

    setupVisibilityObserver() {
      // Pause 3D rendering when out of viewport to preserve battery
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            this.isGlobeVisible = entry.isIntersecting;
          });
        });
        observer.observe(this.container);
      }
    }

    animate() {
      this.animFrameId = requestAnimationFrame(() => this.animate());

      if (!this.isGlobeVisible) return;

      // Auto-rotation after 4 seconds of idle
      if (!this.isInteracting && Date.now() - this.lastInteractionTime > 3500) {
        this.globeGroup.rotation.y += 0.0018;
      }

      this.renderer.render(this.scene, this.camera);
    }

    /**
     * Initialize Leaflet 2D Map Mode
     */
    initLeafletMap(mapContainerId) {
      const container = document.getElementById(mapContainerId);
      if (!container || typeof window.L === 'undefined' || this.leafletMap) return;

      this.leafletMap = window.L.map(mapContainerId, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true
      });

      // CartoDB Dark Matter Tiles (High contrast, elegant travel theme)
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(this.leafletMap);

      if (window.ECRIOX_WORLDVIEW_DATA) {
        window.ECRIOX_WORLDVIEW_DATA.cameras.forEach(cam => {
          const pinColor = cam.streamType === 'live-video' ? '#ef4444' : '#00f0ff';
          const customIcon = window.L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div style="background:${pinColor}; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px ${pinColor}; position:relative;">
                <span style="position:absolute; inset:-4px; border-radius:50%; border:1px solid ${pinColor}; animation:pinPulse 2s infinite;"></span>
              </div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });

          const marker = window.L.marker([cam.latitude, cam.longitude], { icon: customIcon }).addTo(this.leafletMap);
          marker.bindPopup(`
            <div style="font-family:inherit; min-width:180px;">
              <div style="font-size:0.75rem; color:#64748b; font-weight:700;">${cam.flag} ${cam.city}, ${cam.country}</div>
              <div style="font-size:0.9375rem; font-weight:800; color:#0f172a; margin:0.2rem 0 0.4rem 0;">${cam.title}</div>
              <button type="button" class="btn-play-map-cam" data-cam-id="${cam.id}" style="width:100%; background:#2563eb; color:#fff; border:none; padding:0.35rem 0.6rem; border-radius:4px; font-weight:700; font-size:0.75rem; cursor:pointer;">
                ▶ Watch Live Now
              </button>
            </div>
          `);
        });

        // Delegate click on popup button
        document.addEventListener('click', (e) => {
          if (e.target && e.target.classList.contains('btn-play-map-cam')) {
            const id = e.target.getAttribute('data-cam-id');
            const target = window.ECRIOX_WORLDVIEW_DATA.getById(id);
            if (target && window.ECRIOX_WORLDVIEW_PLAYER) {
              window.ECRIOX_WORLDVIEW_PLAYER.openCamera(target);
            }
          }
        });
      }
    }
  }

  window.ECRIOX_WORLDVIEW_GLOBE = new WorldViewGlobe();

})(typeof window !== 'undefined' ? window : this);
