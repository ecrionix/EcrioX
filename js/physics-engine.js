/**
 * EcrioX Physics Simulation Engine & Graphing Utilities
 * Lightweight, high-precision, vanilla JavaScript simulation toolkit.
 * Zero external dependencies. Designed for 60fps interactive HTML5 Canvas.
 */

(function(window) {
  'use strict';

  const PhysicsEngine = {
    // High-DPI Canvas Setup
    setupCanvas: function(canvas) {
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      return { ctx, width: rect.width, height: rect.height, dpr };
    },

    // Detect Current Theme Colors
    getThemeColors: function() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      return {
        isDark: isDark,
        bg: isDark ? '#0F172A' : '#FFFFFF',
        bgSubtle: isDark ? '#1E293B' : '#F8FAFC',
        textMain: isDark ? '#F8FAFC' : '#172554',
        textMuted: isDark ? '#94A3B8' : '#64748B',
        textSubtle: isDark ? '#64748B' : '#94A3B8',
        border: isDark ? '#334155' : '#E2E8F0',
        primary: isDark ? '#3B82F6' : '#2563EB',
        secondary: isDark ? '#8B5CF6' : '#7C3AED',
        success: isDark ? '#22C55E' : '#16A34A',
        danger: isDark ? '#F87171' : '#DC2626',
        warning: isDark ? '#FBBF24' : '#F59E0B'
      };
    },

    // Real-Time 2D Graph Plotter
    createGraph: function(canvasId, config) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;

      const opts = Object.assign({
        xLabel: 'Time (s)',
        yLabel: 'Value',
        xMin: 0,
        xMax: 10,
        yMin: 0,
        yMax: 10,
        autoScaleY: true,
        series: [{ name: 'Data', color: '#2563EB' }]
      }, config || {});

      let dataPoints = [[]]; // array of series points [[{x, y}, ...]]
      if (opts.series.length > 1) {
        dataPoints = opts.series.map(() => []);
      }

      function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      resize();

      return {
        addPoint: function(seriesIdx, x, y) {
          if (!dataPoints[seriesIdx]) dataPoints[seriesIdx] = [];
          dataPoints[seriesIdx].push({ x: Number(x), y: Number(y) });
          // Limit memory to 600 points per series
          if (dataPoints[seriesIdx].length > 600) {
            dataPoints[seriesIdx].shift();
          }
        },
        clear: function() {
          dataPoints = opts.series.map(() => []);
        },
        draw: function() {
          const colors = PhysicsEngine.getThemeColors();
          const w = canvas.width / dpr;
          const h = canvas.height / dpr;

          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, w, h);

          const padL = 50;
          const padR = 20;
          const padT = 25;
          const padB = 40;
          const plotW = Math.max(10, w - padL - padR);
          const plotH = Math.max(10, h - padT - padB);

          // Calculate Dynamic Min / Max
          let xMin = opts.xMin;
          let xMax = opts.xMax;
          let yMin = opts.yMin;
          let yMax = opts.yMax;

          if (opts.autoScaleY) {
            let allY = [];
            dataPoints.forEach(s => s.forEach(pt => allY.push(pt.y)));
            if (allY.length > 0) {
              const minY = Math.min(...allY);
              const maxY = Math.max(...allY);
              const span = Math.max(0.1, maxY - minY);
              yMin = Math.min(opts.yMin, minY - span * 0.1);
              yMax = Math.max(opts.yMax, maxY + span * 0.1);
            }
          }

          // Auto-scroll X if time exceeds current xMax
          let latestX = 0;
          dataPoints.forEach(s => {
            if (s.length > 0) latestX = Math.max(latestX, s[s.length - 1].x);
          });
          if (latestX > xMax) {
            const span = xMax - xMin;
            xMax = latestX;
            xMin = Math.max(0, xMax - span);
          }

          // Background & Grid
          ctx.fillStyle = colors.bgSubtle;
          ctx.fillRect(padL, padT, plotW, plotH);

          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 1;
          const gridDivs = 4;
          for (let i = 0; i <= gridDivs; i++) {
            const gy = padT + (plotH / gridDivs) * i;
            ctx.beginPath();
            ctx.moveTo(padL, gy);
            ctx.lineTo(padL + plotW, gy);
            ctx.stroke();

            const valY = (yMax - (i / gridDivs) * (yMax - yMin)).toFixed(1);
            ctx.fillStyle = colors.textSubtle;
            ctx.font = '10px var(--font-mono, monospace)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(valY, padL - 8, gy);
          }

          for (let i = 0; i <= gridDivs; i++) {
            const gx = padL + (plotW / gridDivs) * i;
            ctx.beginPath();
            ctx.moveTo(gx, padT);
            ctx.lineTo(gx, padT + plotH);
            ctx.stroke();

            const valX = (xMin + (i / gridDivs) * (xMax - xMin)).toFixed(1);
            ctx.fillStyle = colors.textSubtle;
            ctx.font = '10px var(--font-mono, monospace)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(valX, gx, padT + plotH + 6);
          }

          // Labels
          ctx.fillStyle = colors.textMuted;
          ctx.font = '11px var(--font-sans, sans-serif)';
          ctx.textAlign = 'center';
          ctx.fillText(opts.xLabel, padL + plotW / 2, h - 8);

          ctx.save();
          ctx.translate(14, padT + plotH / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(opts.yLabel, 0, 0);
          ctx.restore();

          // Plot Data Series
          dataPoints.forEach((pts, sIdx) => {
            if (pts.length < 2) return;
            const seriesConf = opts.series[sIdx] || { color: colors.primary };
            ctx.strokeStyle = seriesConf.color || colors.primary;
            ctx.lineWidth = 2;
            ctx.beginPath();

            let first = true;
            for (let i = 0; i < pts.length; i++) {
              const pt = pts[i];
              if (pt.x < xMin && i < pts.length - 1 && pts[i+1].x < xMin) continue;
              const px = padL + ((pt.x - xMin) / (xMax - xMin || 1)) * plotW;
              const py = padT + plotH - ((pt.y - yMin) / (yMax - yMin || 1)) * plotH;
              if (first) {
                ctx.moveTo(px, Math.max(padT, Math.min(padT + plotH, py)));
                first = false;
              } else {
                ctx.lineTo(px, Math.max(padT, Math.min(padT + plotH, py)));
              }
            }
            ctx.stroke();
          });

          // Plot Outer Border
          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 1;
          ctx.strokeRect(padL, padT, plotW, plotH);

          ctx.restore();
        }
      };
    },

    // 4th Order Runge-Kutta Numerical Integrator
    rk4: function(f, y0, t0, dt) {
      const k1 = f(t0, y0);
      const yTemp1 = y0.map((y, i) => y + 0.5 * dt * k1[i]);
      const k2 = f(t0 + 0.5 * dt, yTemp1);
      const yTemp2 = y0.map((y, i) => y + 0.5 * dt * k2[i]);
      const k3 = f(t0 + 0.5 * dt, yTemp2);
      const yTemp3 = y0.map((y, i) => y + dt * k3[i]);
      const k4 = f(t0 + dt, yTemp3);

      return y0.map((y, i) => y + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    }
  };

  window.PhysicsEngine = PhysicsEngine;
})(window);
