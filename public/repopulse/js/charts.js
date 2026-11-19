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
   * Theme configuration helper
   */
  getTheme() {
    const isLight = typeof document !== 'undefined' && document.documentElement?.getAttribute('data-theme') === 'light';
    return {
      isLight,
      border: isLight ? '#ffffff' : '#17161b',
      text: isLight ? '#71717a' : '#8b8b9a',
      grid: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)',
      tooltipBg: isLight ? '#ffffff' : '#1c1b22',
      tooltipTitle: isLight ? '#111014' : '#f7f6f3',
      tooltipBody: isLight ? '#55545e' : '#a09fa6',
      tooltipBorder: isLight ? '#e5e4e2' : 'rgba(255,255,255,0.1)'
    };
  },

  /**
   * Base Chart.js configuration
   */
  getBaseOptions(extraPlugins = {}) {
    const theme = this.getTheme();
    return {
      devicePixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2),
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          ...extraPlugins.tooltip
        },
        ...extraPlugins
      }
    };
  },

  /**
   * Destroys existing chart instance by key to prevent canvas reuse errors
   */
  destroy(key) {
    if (this.instances[key]) {
      try {
        this.instances[key].destroy();
      } catch (e) {
        console.warn(`Chart destroy failed for ${key}:`, e);
      }
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
   * Group language bytes into top items and Other
   */
  groupLanguages(languageBytes = {}) {
    const entries = Object.entries(languageBytes || {});
    const totalBytes = entries.reduce((acc, [, b]) => acc + b, 0);
    if (!totalBytes) return { displayLangs: [], totalBytes: 0, primaryLang: null };

    const sorted = entries
      .map(([name, bytes]) => ({ name, bytes, percent: (bytes / totalBytes) * 100 }))
      .sort((a, b) => b.bytes - a.bytes);

    const top = sorted.slice(0, 6).filter(l => l.percent >= 1.0);
    const topBytes = top.reduce((acc, l) => acc + l.bytes, 0);
    const otherBytes = totalBytes - topBytes;

    if (otherBytes > 0) {
      top.push({ name: 'Other', bytes: otherBytes, percent: (otherBytes / totalBytes) * 100 });
    }

    return { displayLangs: top, totalBytes, primaryLang: top[0] || null };
  },

  /**
   * Renders the interactive Tech Stack Doughnut Chart
   * @param {Record<string, number>} languageBytes Map of language name -> byte count
   * @param {HTMLElement} container Container element
   */
  renderTechStack(languageBytes = {}, container) {
    this.destroy('techStack');
    if (!container) return;

    const { displayLangs, totalBytes, primaryLang } = this.groupLanguages(languageBytes);
    if (!displayLangs.length || !primaryLang) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="code-2" style="width:32px;height:32px;color:var(--text-muted);margin-bottom:8px;"></i>
          <p style="color:var(--text-muted);font-size:0.875rem;">No language data detected in this repository.</p>
        </div>
      `;
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      return;
    }

    const labels = displayLangs.map(l => l.name);
    const dataValues = displayLangs.map(l => l.bytes);
    const backgroundColors = displayLangs.map(l => getLangColor(l.name));

    const legendHtml = displayLangs.map(l => {
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

    // Build DOM structure with canvas & inline legend
    container.innerHTML = `
      <div class="tech-stack-chart-wrapper">
        <div class="tech-stack-canvas-box">
          <canvas id="techStackCanvas"></canvas>
          <div class="tech-stack-center-badge">
            <span class="center-badge-lang" style="color:${getLangColor(primaryLang.name)}">${primaryLang.name}</span>
            <span class="center-badge-pct">${primaryLang.percent.toFixed(1)}%</span>
          </div>
        </div>
        <div class="tech-stack-legend">${legendHtml}</div>
      </div>
    `;

    const canvas = container.querySelector('#techStackCanvas');
    if (!canvas || !window.Chart) return;

    const theme = this.getTheme();
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
          borderColor: theme.border,
          hoverBorderColor: theme.border,
          hoverOffset: 6
        }]
      },
      options: {
        ...this.getBaseOptions({
          tooltip: {
            callbacks: {
              label: (context) => {
                const langName = context.label;
                const bytes = context.raw;
                const pct = totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : 0;
                return ` ${langName}: ${formatBytes(bytes)} (${pct}%)`;
              }
            }
          }
        }),
        cutout: '72%',
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

    const theme = this.getTheme();
    const computedStyle = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    const accentColor = computedStyle?.getPropertyValue('--accent')?.trim() || '#c8a2ff';

    const ctx = canvas.getContext('2d');
    const gradient = ctx ? ctx.createLinearGradient(0, 0, 0, 260) : null;
    if (gradient) {
      gradient.addColorStop(0, accentColor.startsWith('#') ? `${accentColor}44` : 'rgba(200, 162, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    }

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
          backgroundColor: gradient || accentColor,
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: accentColor,
          pointHoverBorderColor: theme.border,
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        ...this.getBaseOptions({
          tooltip: {
            callbacks: {
              title: (items) => `Week of ${items[0].label}`,
              label: (context) => ` ${context.raw} commits pushed`
            }
          }
        }),
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 12,
              color: theme.text,
              font: { size: 11, family: 'var(--font-mono)' }
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: theme.grid },
            ticks: {
              color: theme.text,
              font: { size: 11, family: 'var(--font-mono)' },
              precision: 0
            }
          }
        }
      }
    });
  },

  /**
   * Compute 4-quadrant time of day distribution
   */
  computeTimeSlots(commits = []) {
    const slots = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    if (!Array.isArray(commits)) return slots;
    commits.forEach(c => {
      const dateStr = c.commit?.author?.date || c.commit?.committer?.date;
      if (dateStr) {
        const hour = new Date(dateStr).getHours();
        if (hour >= 6 && hour < 12) slots.morning++;
        else if (hour >= 12 && hour < 18) slots.afternoon++;
        else if (hour >= 18 && hour < 24) slots.evening++;
        else slots.night++;
      }
    });
    return slots;
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
    const slots = this.computeTimeSlots(recentCommits);
    const totalRecent = Object.values(slots).reduce((a, b) => a + b, 0) || 1;

    const slotItems = [
      ['sunrise', 'Morning (6-12)', slots.morning],
      ['sun', 'Afternoon (12-18)', slots.afternoon],
      ['sunset', 'Evening (18-24)', slots.evening],
      ['moon', 'Night (0-6)', slots.night]
    ];

    container.innerHTML = `
      <div class="cadence-container">
        <div class="cadence-bars-box">
          <canvas id="cadenceCanvas"></canvas>
        </div>
        <div class="time-distribution">
          ${slotItems.map(([icon, label, count]) => `
            <div class="time-slot-card">
              <span class="slot-icon"><i data-lucide="${icon}"></i></span>
              <span class="slot-name">${label}</span>
              <span class="slot-pct">${Math.round((count / totalRecent) * 100)}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();

    const canvas = container.querySelector('#cadenceCanvas');
    const ChartClass = window.Chart;
    if (!canvas || !ChartClass) return;

    const theme = this.getTheme();
    const computedStyle = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    const accent = computedStyle?.getPropertyValue('--accent')?.trim() || '#c8a2ff';

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
        ...this.getBaseOptions({
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.raw} commits` }
          }
        }),
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: theme.text,
              font: { size: 11, family: 'var(--font-mono)' }
            }
          },
          y: { display: false, beginAtZero: true }
        }
      }
    });
  },

  /**
   * Contributor share color palette
   */
  PALETTE: ['#c8a2ff', '#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#71717a'],

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
      labels.push('Community');
      data.push(otherSum);
    }

    container.innerHTML = `
      <div style="position:relative; width:100%; height:100%;">
        <canvas id="contributorShareCanvas"></canvas>
      </div>
    `;

    const canvas = container.querySelector('#contributorShareCanvas');
    const ChartClass = window.Chart;
    if (!canvas || !ChartClass) return;

    const theme = this.getTheme();

    this.instances.contributorShare = new ChartClass(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: this.PALETTE.slice(0, labels.length),
          borderWidth: 2,
          borderColor: theme.border
        }]
      },
      options: {
        ...this.getBaseOptions({
          legend: {
            display: true,
            position: 'right',
            labels: {
              boxWidth: 8,
              padding: 8,
              color: theme.text,
              font: { size: 10 }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw.toLocaleString()} commits`
            }
          }
        }),
        cutout: '65%'
      }
    });
  }
};
