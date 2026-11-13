// ============================================
// RepoPulse — Visual Charts (Chart.js Engine)
// ============================================

import { getLangColor, formatBytes } from './langColors.js';

export const Charts = {
  instances: {
    techStack: null,
    commitActivity: null,
    cadence: null,
    contributorShare: null
  },

  /**
   * Destroys existing chart instance by key to prevent canvas reuse errors
   */
  destroy(key) {
    if (this.instances[key]) {
      this.instances[key].destroy();
      this.instances[key] = null;
    }
  },

  /**
   * Destroys all active chart instances
   */
  destroyAll() {
    Object.keys(this.instances).forEach(key => this.destroy(key));
  },

  /**
   * Renders the interactive Tech Stack Doughnut Chart
   * @param {Record<string, number>} languageBytes Map of language name -> byte count
   * @param {HTMLElement} container Container element
   */
  renderTechStack(languageBytes = {}, container) {
    this.destroy('techStack');
    if (!container) return;

    const entries = Object.entries(languageBytes || {});
    if (entries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="code-2" style="width:32px;height:32px;color:var(--text-muted);margin-bottom:8px;"></i>
          <p style="color:var(--text-muted);font-size:0.875rem;">No language data detected in this repository.</p>
        </div>
      `;
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      return;
    }

    const totalBytes = entries.reduce((acc, [, b]) => acc + b, 0);

    // Sort languages descending
    const sorted = entries
      .map(([name, bytes]) => ({
        name,
        bytes,
        percent: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0
      }))
      .sort((a, b) => b.bytes - a.bytes);

    // Group items beyond top 6 or < 1.0% into "Other"
    const displayLangs = [];
    let otherBytes = 0;

    sorted.forEach((item, idx) => {
      if (idx < 6 && item.percent >= 1.0) {
        displayLangs.push(item);
      } else {
        otherBytes += item.bytes;
      }
    });

    if (otherBytes > 0) {
      displayLangs.push({
        name: 'Other',
        bytes: otherBytes,
        percent: (otherBytes / totalBytes) * 100
      });
    }

    const labels = displayLangs.map(l => l.name);
    const dataValues = displayLangs.map(l => l.bytes);
    const backgroundColors = displayLangs.map(l => getLangColor(l.name));
    const primaryLang = displayLangs[0];

    // Build DOM structure with canvas & legend container
    container.innerHTML = `
      <div class="tech-stack-chart-wrapper">
        <div class="tech-stack-canvas-box">
          <canvas id="techStackCanvas"></canvas>
          <div class="tech-stack-center-badge">
            <span class="center-badge-lang" style="color:${getLangColor(primaryLang.name)}">${primaryLang.name}</span>
            <span class="center-badge-pct">${primaryLang.percent.toFixed(1)}%</span>
          </div>
        </div>
        <div class="tech-stack-legend" id="tech-stack-legend"></div>
      </div>
    `;

    const canvas = container.querySelector('#techStackCanvas');
    if (!canvas || !window.Chart) return;

    // Detect theme background color for donut border ring
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const borderColor = isLight ? '#ffffff' : '#17161b';

    const ChartClass = window.Chart;
    if (!ChartClass) return;

    this.instances.techStack = new ChartClass(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: backgroundColors,
          borderWidth: 3,
          borderColor: borderColor,
          hoverBorderColor: borderColor,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isLight ? '#ffffff' : '#1c1b22',
            titleColor: isLight ? '#111014' : '#f7f6f3',
            bodyColor: isLight ? '#55545e' : '#a09fa6',
            borderColor: isLight ? '#e5e4e2' : 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (context) => {
                const langName = context.label;
                const bytes = context.raw;
                const pct = totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : 0;
                return ` ${langName}: ${formatBytes(bytes)} (${pct}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          duration: 900
        }
      }
    });

    // Populate legend with custom progress bars
    const legendEl = container.querySelector('#tech-stack-legend');
    if (legendEl) {
      legendEl.innerHTML = displayLangs.map(l => {
        const color = getLangColor(l.name);
        return `
          <div class="lang-row">
            <div class="lang-row__meta">
              <span class="lang-dot" style="background:${color};"></span>
              <span class="lang-name">${l.name}</span>
              <span class="lang-bytes">${formatBytes(l.bytes)}</span>
              <span class="lang-pct">${l.percent.toFixed(1)}%</span>
            </div>
            <div class="lang-bar-bg">
              <div class="lang-bar-fill" style="width:${l.percent}%; background:${color};"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  /**
   * Renders the 52-Week Commit Activity Velocity Spline Chart
   * @param {Array<{total: number, week: number}>} activity 52-week activity array
   * @param {HTMLElement} container Container DOM element
   * @param {Object} stats Calculated commit stats
   */
  renderCommitActivity(activity = [], container, stats = {}) {
    this.destroy('commitActivity');
    if (!container) return;

    if (!Array.isArray(activity) || activity.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="activity" style="width:32px;height:32px;color:var(--text-muted);margin-bottom:8px;"></i>
          <p style="color:var(--text-muted);font-size:0.875rem;">Commit activity statistics currently unavailable for this repository.</p>
        </div>
      `;
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      return;
    }

    // Format week dates and labels
    const labels = [];
    const values = [];

    activity.forEach(item => {
      values.push(item.total || 0);
      if (item.week) {
        const d = new Date(item.week * 1000);
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      } else {
        labels.push('');
      }
    });

    container.innerHTML = `
      <div class="commit-activity-wrapper">
        <div class="commit-stats-pills">
          <div class="commit-stat-pill">
            <span class="pill-label">Annual Commits</span>
            <span class="pill-value">${stats.totalYearCommits?.toLocaleString() || '0'}</span>
          </div>
          <div class="commit-stat-pill">
            <span class="pill-label">Weekly Average</span>
            <span class="pill-value">${stats.weeklyAverage || '0'} / wk</span>
          </div>
          <div class="commit-stat-pill">
            <span class="pill-label">Peak Velocity</span>
            <span class="pill-value">${stats.peakWeek?.count || '0'} commits</span>
          </div>
          <div class="commit-stat-pill">
            <span class="pill-label">30-Day Momentum</span>
            <span class="pill-value ${stats.trendDirection === 'up' ? 'trend-up' : (stats.trendDirection === 'down' ? 'trend-down' : '')}">
              ${stats.trend || '0%'}
            </span>
          </div>
        </div>

        <div class="commit-canvas-box" style="position:relative; width:100%; height:260px; margin-top:var(--space-4);">
          <canvas id="commitActivityCanvas"></canvas>
        </div>
      </div>
    `;

    const canvas = container.querySelector('#commitActivityCanvas');
    if (!canvas || !window.Chart) return;

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const computedStyle = getComputedStyle(document.documentElement);
    const accentColor = computedStyle.getPropertyValue('--accent').trim() || '#c8a2ff';

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, accentColor.startsWith('#') ? `${accentColor}55` : 'rgba(200, 162, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    const ChartClass = window.Chart;
    if (!ChartClass) return;

    this.instances.commitActivity = new ChartClass(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Commits',
          data: values,
          borderColor: accentColor,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: accentColor,
          pointHoverBorderColor: isLight ? '#ffffff' : '#111014',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 12,
              color: isLight ? '#71717a' : '#8b8b9a',
              font: { size: 11, family: 'var(--font-mono)' }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'
            },
            ticks: {
              color: isLight ? '#71717a' : '#8b8b9a',
              font: { size: 11, family: 'var(--font-mono)' },
              precision: 0
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isLight ? '#ffffff' : '#1c1b22',
            titleColor: isLight ? '#111014' : '#f7f6f3',
            bodyColor: isLight ? '#55545e' : '#a09fa6',
            borderColor: isLight ? '#e5e4e2' : 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              title: (items) => `Week of ${items[0].label}`,
              label: (context) => ` ${context.raw} commits pushed`
            }
          }
        }
      }
    });
  },

  /**
   * Renders Day-of-Week and Time-of-Day commit cadence
   * @param {number[]} dayDistribution 7-element array [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
   * @param {Array} recentCommits Array of recent commit objects
   * @param {HTMLElement} container Container DOM element
   */
  renderCadence(dayDistribution = [0, 0, 0, 0, 0, 0, 0], recentCommits = [], container) {
    this.destroy('cadence');
    if (!container) return;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const maxVal = Math.max(...dayDistribution, 1);

    // Calculate time-of-day slots from recent commits
    const timeSlots = {
      morning: 0,   // 06:00 - 12:00
      afternoon: 0, // 12:00 - 18:00
      evening: 0,   // 18:00 - 24:00
      night: 0      // 00:00 - 06:00
    };

    if (Array.isArray(recentCommits)) {
      recentCommits.forEach(c => {
        const dateStr = c.commit?.author?.date || c.commit?.committer?.date;
        if (dateStr) {
          const hour = new Date(dateStr).getHours();
          if (hour >= 6 && hour < 12) timeSlots.morning++;
          else if (hour >= 12 && hour < 18) timeSlots.afternoon++;
          else if (hour >= 18 && hour < 24) timeSlots.evening++;
          else timeSlots.night++;
        }
      });
    }

    const totalRecent = Object.values(timeSlots).reduce((a, b) => a + b, 0) || 1;

    container.innerHTML = `
      <div class="cadence-container">
        <div class="cadence-bars-box">
          <canvas id="cadenceCanvas"></canvas>
        </div>
        <div class="time-distribution">
          <div class="time-slot-card">
            <span class="slot-icon"><i data-lucide="sunrise"></i></span>
            <span class="slot-name">Morning (6-12)</span>
            <span class="slot-pct">${Math.round((timeSlots.morning / totalRecent) * 100)}%</span>
          </div>
          <div class="time-slot-card">
            <span class="slot-icon"><i data-lucide="sun"></i></span>
            <span class="slot-name">Afternoon (12-18)</span>
            <span class="slot-pct">${Math.round((timeSlots.afternoon / totalRecent) * 100)}%</span>
          </div>
          <div class="time-slot-card">
            <span class="slot-icon"><i data-lucide="sunset"></i></span>
            <span class="slot-name">Evening (18-24)</span>
            <span class="slot-pct">${Math.round((timeSlots.evening / totalRecent) * 100)}%</span>
          </div>
          <div class="time-slot-card">
            <span class="slot-icon"><i data-lucide="moon"></i></span>
            <span class="slot-name">Night (0-6)</span>
            <span class="slot-pct">${Math.round((timeSlots.night / totalRecent) * 100)}%</span>
          </div>
        </div>
      </div>
    `;

    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();

    const canvas = container.querySelector('#cadenceCanvas');
    const ChartClass = window.Chart;
    if (!canvas || !ChartClass) return;

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const computedStyle = getComputedStyle(document.documentElement);
    const accent = computedStyle.getPropertyValue('--accent').trim() || '#c8a2ff';

    const barColors = dayDistribution.map(val => {
      const ratio = val / maxVal;
      return ratio > 0.8 ? accent : (accent.startsWith('#') ? `${accent}88` : 'rgba(200, 162, 255, 0.5)');
    });

    this.instances.cadence = new ChartClass(canvas, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'Commits',
          data: dayDistribution,
          backgroundColor: barColors,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: isLight ? '#71717a' : '#8b8b9a',
              font: { size: 11, family: 'var(--font-mono)' }
            }
          },
          y: {
            display: false,
            beginAtZero: true
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isLight ? '#ffffff' : '#1c1b22',
            titleColor: isLight ? '#111014' : '#f7f6f3',
            bodyColor: isLight ? '#55545e' : '#a09fa6',
            borderColor: isLight ? '#e5e4e2' : 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` ${context.raw} commits`
            }
          }
        }
      }
    });
  },

  /**
   * Renders the Contributor Share Distribution Chart
   * @param {Array} contributors List of top contributors
   * @param {HTMLElement} container Container DOM element
   */
  renderContributorShare(contributors = [], container) {
    this.destroy('contributorShare');
    if (!container || !Array.isArray(contributors) || contributors.length === 0) return;

    const top5 = contributors.slice(0, 5);
    const top5Sum = top5.reduce((acc, c) => acc + (c.contributions || 0), 0);
    const totalAll = contributors.reduce((acc, c) => acc + (c.contributions || 0), 0);
    const otherSum = Math.max(0, totalAll - top5Sum);

    const labels = top5.map(c => c.login);
    const data = top5.map(c => c.contributions);

    if (otherSum > 0) {
      labels.push('Community (Other)');
      data.push(otherSum);
    }

    const palette = ['#c8a2ff', '#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#71717a'];

    container.innerHTML = `
      <div style="position:relative; width:100%; height:180px;">
        <canvas id="contributorShareCanvas"></canvas>
      </div>
    `;

    const ChartClass = window.Chart;
    if (!canvas || !ChartClass) return;

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const borderColor = isLight ? '#ffffff' : '#17161b';

    this.instances.contributorShare = new ChartClass(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: palette.slice(0, labels.length),
          borderWidth: 2,
          borderColor: borderColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 10,
              padding: 8,
              color: isLight ? '#3f3f46' : '#d4d4d8',
              font: { size: 10 }
            }
          },
          tooltip: {
            padding: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw.toLocaleString()} commits`
            }
          }
        }
      }
    });
  }
};
