// ============================================
// RepoPulse — UI Components & DOM Renderers
// ============================================

import { Stats } from './stats.js';

export const UI = {
  _cache: {},

  $(id) {
    if (typeof document === 'undefined') return null;
    return this._cache[id] || (this._cache[id] = document.getElementById(id));
  },

  get elements() {
    return {
      landing: this.$('landing-section'),
      dashboard: this.$('dashboard'),
      headerSearch: this.$('header-search'),
      exportBtn: this.$('export-btn'),
      mainContent: this.$('repo-main-content'),
      rateLimitStatus: this.$('rate-limit-status')
    };
  },

  showDashboard() {
    const { landing, dashboard, headerSearch, exportBtn } = this.elements;
    if (landing) landing.hidden = true;
    if (dashboard) dashboard.hidden = false;
    if (headerSearch) headerSearch.hidden = false;
    if (exportBtn) exportBtn.hidden = false;
  },

  showLanding() {
    const { landing, dashboard, headerSearch, exportBtn } = this.elements;
    if (landing) landing.hidden = false;
    if (dashboard) dashboard.hidden = true;
    if (headerSearch) headerSearch.hidden = true;
    if (exportBtn) exportBtn.hidden = true;
  },

  showLoading() {
    this.showDashboard();
    const els = this.elements;
    if (!els.mainContent) return;

    els.mainContent.innerHTML = `
      <div class="repo-loading">
        <div class="repo-header card">
          <div style="display:flex; gap:12px; align-items:center;">
            <div class="skeleton-pulse" style="width:36px; height:36px; border-radius:6px; flex-shrink:0;"></div>
            <div style="flex:1;">
              <div class="skeleton-pulse" style="width:180px; height:16px; margin-bottom:8px;"></div>
              <div class="skeleton-pulse" style="width:320px; height:12px;"></div>
            </div>
          </div>
        </div>

        <div class="vitals-strip" style="margin-top:var(--space-4);">
          ${Array(7).fill(`
            <div class="vital-item">
              <div class="skeleton-pulse" style="width:48px; height:18px; margin:0 auto 4px;"></div>
              <div class="skeleton-pulse" style="width:32px; height:10px; margin:0 auto;"></div>
            </div>
          `).join('')}
        </div>

        <div class="analytics-bento-grid">
          <div class="card bento-card" style="height:300px;">
            <div class="skeleton-pulse" style="width:120px; height:16px; margin-bottom:16px;"></div>
            <div class="skeleton-pulse" style="width:100%; height:210px;"></div>
          </div>
          <div class="card bento-card" style="height:300px;">
            <div class="skeleton-pulse" style="width:140px; height:16px; margin-bottom:16px;"></div>
            <div class="skeleton-pulse" style="width:100%; height:210px;"></div>
          </div>
        </div>
      </div>
    `;
  },

  showError(message, isRateLimit = false) {
    this.showDashboard();
    const els = this.elements;
    if (!els.mainContent) return;

    const safeMessage = this.escapeHtml(message);
    const title = isRateLimit ? 'API Rate Limit Reached' : 'Unable to Analyze Repository';

    els.mainContent.innerHTML = `
      <div class="card error-card" style="padding:var(--space-8); text-align:center; max-width:520px; margin:48px auto;">
        <h2 style="font-size:1.1rem; font-weight:600; margin-bottom:8px; color:var(--text-primary);">${title}</h2>
        <p style="color:var(--text-secondary); font-size:0.85rem; line-height:1.5; margin-bottom:20px;">${safeMessage}</p>
        <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" id="error-retry-btn">Retry</button>
          <button class="btn btn-secondary btn-sm" id="error-token-btn">Configure Token</button>
          <a href="." class="btn btn-ghost btn-sm">Return Home</a>
        </div>
      </div>
    `;

    els.mainContent.querySelector('#error-retry-btn')?.addEventListener('click', () => location.reload());
    els.mainContent.querySelector('#error-token-btn')?.addEventListener('click', () => {
      document.getElementById('pat-toggle')?.click();
    });
  },

  /**
   * Renders the primary Repository Header Card
   */
  renderRepoHeader(repo, detectedStack = []) {
    const owner = repo.owner || {};
    const topics = Array.isArray(repo.topics) ? repo.topics : [];
    const badges = [
      repo.private && '<span class="badge badge-private">Private</span>',
      repo.fork && '<span class="badge badge-fork">Fork</span>',
      repo.archived && '<span class="badge badge-archived">Archived</span>'
    ].filter(Boolean).join(' ');

    const tags = [
      ...topics.slice(0, 6).map(t => `<span class="tag-chip">#${t}</span>`),
      ...detectedStack.slice(0, 5).map(item => `<span class="tag-chip">${item.name}</span>`),
      repo.homepage ? `<a href="${repo.homepage.startsWith('http') ? repo.homepage : 'https://' + repo.homepage}" target="_blank" rel="noopener" class="tag-chip" style="color:var(--text-primary);">${repo.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗</a>` : null
    ].filter(Boolean).join('');

    return `
      <div class="repo-header">
        <div class="repo-header__top">
          <div class="repo-header__identity">
            <a href="${owner.html_url || '#'}" target="_blank" rel="noopener" title="Visit ${owner.login}">
              <img src="${owner.avatar_url || 'https://github.com/github.png'}" alt="${owner.login}" class="repo-header__avatar" loading="lazy">
            </a>
            <div>
              <div class="repo-header__breadcrumbs">
                <a href="${owner.html_url || '#'}" target="_blank" rel="noopener" class="repo-header__owner">${owner.login}</a>
                <span class="repo-header__slash">/</span>
                <a href="${repo.html_url}" target="_blank" rel="noopener" class="repo-header__name">${repo.name}</a>
                ${badges}
              </div>
              <p class="repo-header__desc">${repo.description ? this.escapeHtml(repo.description) : 'No description provided.'}</p>
            </div>
          </div>

          <div class="repo-header__actions">
            <a href="${repo.html_url}" target="_blank" rel="noopener" class="repo-header__github-link">
              <span>github.com/${owner.login}/${repo.name}</span>
              <i data-lucide="arrow-up-right" style="width:13px;height:13px;"></i>
            </a>
          </div>
        </div>

        ${tags ? `<div class="repo-header__tags">${tags}</div>` : ''}
      </div>
    `;
  },

  /**
   * Renders the Vitals Metric Strip
   */
  renderVitals(repo, commitStats = {}, latestRelease = null) {
    const items = [
      ['Stars', Stats.formatCompactNumber(repo.stargazers_count), `${(repo.stargazers_count || 0).toLocaleString()} stargazers`],
      ['Forks', Stats.formatCompactNumber(repo.forks_count), `${(repo.forks_count || 0).toLocaleString()} forks`],
      ['Watchers', Stats.formatCompactNumber(repo.subscribers_count || repo.watchers_count), `${((repo.subscribers_count || repo.watchers_count) || 0).toLocaleString()} watchers`],
      ['Open Issues', Stats.formatCompactNumber(repo.open_issues_count), `${(repo.open_issues_count || 0).toLocaleString()} open issues`],
      ['Size', Stats.formatSize(repo.size), `Disk size: ${Stats.formatSize(repo.size)}`],
      ['License', repo.license?.spdx_id || repo.license?.name || 'None', `License: ${repo.license?.spdx_id || repo.license?.name || 'None'}`],
      ['Release', latestRelease?.tag_name || 'None', `Latest release: ${latestRelease?.tag_name || 'None'}`]
    ];

    return `
      <div class="vitals-strip">
        ${items.map(([label, val, title]) => `
          <div class="vital-item" title="${title}">
            <span class="vital-item__value">${val}</span>
            <span class="vital-item__label">${label}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Renders a single contributor row
   */
  renderContributorRow(c) {
    return `
      <div class="contributor-row">
        <span class="contributor-rank">#${c.rank}</span>
        <a href="${c.html_url}" target="_blank" rel="noopener" class="contributor-user">
          <img src="${c.avatar_url}" alt="${c.login}" class="contributor-user-avatar" loading="lazy">
          <span class="contributor-user-name">${c.login}</span>
        </a>
        <div class="contributor-share-bar-box">
          <div class="contributor-share-bar">
            <div class="contributor-share-fill" style="width:${Math.max(c.share, 3)}%;"></div>
          </div>
        </div>
        <span class="contributor-commits">${c.contributions.toLocaleString()} commits</span>
        <span class="contributor-share-pct">${c.share}%</span>
      </div>
    `;
  },

  /**
   * Renders Top Contributors (Clean ranked list)
   */
  renderContributors(contributorData = {}, container) {
    if (!container) return;
    const { ranked = [], dependencyRisk, dependencyDescription, riskColor } = contributorData;

    if (!ranked.length) {
      container.innerHTML = '<div class="empty-state"><p style="color:var(--text-muted);font-size:0.85rem;">No contributor data found for this repository.</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="contributors-content">
        <div class="dependency-alert" style="border-left: 2px solid ${riskColor};">
          <span class="dependency-info-text">${dependencyDescription}</span>
          <span class="dependency-badge" style="background: ${riskColor}18; color: ${riskColor};">${dependencyRisk} Risk</span>
        </div>
        <div class="contributors-table">
          ${ranked.slice(0, 10).map(c => this.renderContributorRow(c)).join('')}
        </div>
      </div>
    `;

    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  },

  /**
   * Classify repository license type
   */
  classifyLicense(spdx = '') {
    const code = (spdx || '').toUpperCase();
    if (!code) return { type: 'Unlicensed', code: 'None' };
    if (['MIT', 'APACHE-2.0', 'BSD-2-CLAUSE', 'BSD-3-CLAUSE', 'ISC', 'UNLICENSE'].includes(code)) {
      return { type: 'Permissive', code };
    }
    if (['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0', 'MPL-2.0'].includes(code)) {
      return { type: 'Copyleft', code };
    }
    return { type: 'Custom', code };
  },

  /**
   * Renders Codebase Health Standards Audit & Latest Release Widget
   */
  renderHealthAndReleases(communityProfile = null, latestRelease = null, repo = {}) {
    const files = communityProfile?.files || {};
    const healthPercent = communityProfile?.health_percentage ?? (repo.license ? 75 : 50);

    const checkItems = [
      ['README', Boolean(files.readme || true)],
      ['LICENSE', Boolean(files.license || repo.license)],
      ['Contributing Guide', Boolean(files.contributing)],
      ['Code of Conduct', Boolean(files.code_of_conduct)],
      ['Issue Templates', Boolean(files.issue_template)],
      ['PR Template', Boolean(files.pull_request_template)]
    ];

    const { type: licenseType, code: spdx } = this.classifyLicense(repo.license?.spdx_id);

    const releaseHtml = latestRelease ? `
      <div class="latest-release-box">
        <div class="release-header">
          <span class="release-tag">${latestRelease.tag_name || 'Latest'}</span>
          <span class="release-date">${latestRelease.published_at ? Stats.formatRelativeTime(latestRelease.published_at) : ''}</span>
        </div>
        <p class="release-title">${latestRelease.name ? this.escapeHtml(latestRelease.name) : 'Release ' + latestRelease.tag_name}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
          <span style="font-size:0.72rem; color:var(--text-tertiary); font-family:var(--font-mono);">${licenseType} (${spdx})</span>
          <a href="${latestRelease.html_url}" target="_blank" rel="noopener" class="release-link">
            Notes ↗
          </a>
        </div>
      </div>
    ` : `
      <div class="latest-release-box">
        <p style="color:var(--text-muted);font-size:0.82rem;">No formal releases published on GitHub.</p>
        <span style="font-size:0.72rem; color:var(--text-tertiary); font-family:var(--font-mono); margin-top:4px; display:block;">
          Default branch: <code>${repo.default_branch || 'main'}</code> · ${licenseType}
        </span>
      </div>
    `;

    return `
      <div class="health-and-release-grid">
        <div class="health-card">
          <div class="health-score-header">
            <span class="health-score-title">Standards Audit</span>
            <span class="health-score-pct">${healthPercent}%</span>
          </div>
          <div class="health-progress-bg">
            <div class="health-progress-fill" style="width:${healthPercent}%;"></div>
          </div>
          <div class="health-checklist">
            ${checkItems.map(([name, exists]) => `
              <div class="checklist-item ${exists ? 'item-pass' : 'item-missing'}">
                <div class="checklist-left">
                  <span class="checklist-dot"></span>
                  <span class="checklist-label">${name}</span>
                </div>
                <span class="checklist-status">${exists ? 'Found' : 'Missing'}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="release-card">
          <div class="release-card__title">Latest Release</div>
          ${releaseHtml}
        </div>
      </div>
    `;
  },

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
