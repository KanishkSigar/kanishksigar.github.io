// ============================================
// RepoPulse — UI Components & DOM Renderers
// ============================================

import { Stats } from './stats.js';

export const UI = {
  get elements() {
    return {
      landing: document.getElementById('landing-section'),
      dashboard: document.getElementById('dashboard'),
      headerSearch: document.getElementById('header-search'),
      exportBtn: document.getElementById('export-btn'),
      mainContent: document.getElementById('repo-main-content'),
      rateLimitStatus: document.getElementById('rate-limit-status')
    };
  },

  showDashboard() {
    const els = this.elements;
    if (els.landing) els.landing.hidden = true;
    if (els.dashboard) els.dashboard.hidden = false;
    if (els.headerSearch) els.headerSearch.hidden = false;
    if (els.exportBtn) els.exportBtn.hidden = false;
  },

  showLanding() {
    const els = this.elements;
    if (els.landing) els.landing.hidden = false;
    if (els.dashboard) els.dashboard.hidden = true;
    if (els.headerSearch) els.headerSearch.hidden = true;
    if (els.exportBtn) els.exportBtn.hidden = true;
  },

  showLoading(repoName = 'repository') {
    this.showDashboard();
    const els = this.elements;
    if (!els.mainContent) return;

    els.mainContent.innerHTML = `
      <div class="repo-loading">
        <div class="repo-header card">
          <div style="display:flex; gap:14px; align-items:center;">
            <div class="skeleton-pulse" style="width:40px; height:40px; border-radius:6px;"></div>
            <div style="flex:1;">
              <div class="skeleton-pulse" style="width:200px; height:18px; margin-bottom:8px;"></div>
              <div class="skeleton-pulse" style="width:340px; height:12px;"></div>
            </div>
          </div>
        </div>

        <div class="vitals-strip" style="margin-top:var(--space-4);">
          ${Array(7).fill(`
            <div class="vital-item" style="padding:14px 16px;">
              <div class="skeleton-pulse" style="width:60px; height:20px; margin-bottom:6px;"></div>
              <div class="skeleton-pulse" style="width:40px; height:10px;"></div>
            </div>
          `).join('')}
        </div>

        <div class="analytics-bento-grid">
          <div class="card bento-card" style="height:320px;">
            <div class="skeleton-pulse" style="width:120px; height:16px; margin-bottom:16px;"></div>
            <div class="skeleton-pulse" style="width:100%; height:230px;"></div>
          </div>
          <div class="card bento-card" style="height:320px;">
            <div class="skeleton-pulse" style="width:140px; height:16px; margin-bottom:16px;"></div>
            <div class="skeleton-pulse" style="width:100%; height:230px;"></div>
          </div>
        </div>

        <div class="card bento-card" style="height:260px; margin-top:var(--space-4);">
          <div class="skeleton-pulse" style="width:180px; height:16px; margin-bottom:16px;"></div>
          <div class="skeleton-pulse" style="width:100%; height:180px;"></div>
        </div>
      </div>
    `;
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  },

  showError(message, isRateLimit = false) {
    this.showDashboard();
    const els = this.elements;
    if (!els.mainContent) return;

    els.mainContent.innerHTML = `
      <div class="card error-card" style="padding:var(--space-8); text-align:center; max-width:540px; margin:40px auto;">
        <h2 style="font-size:1.15rem; margin-bottom:8px; color:var(--text-primary);">
          ${isRateLimit ? 'API Rate Limit Reached' : 'Unable to Analyze Repository'}
        </h2>
        <p style="color:var(--text-secondary); font-size:0.85rem; line-height:1.5; margin-bottom:20px;">
          ${message}
        </p>
        <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="location.reload()">
            Retry
          </button>
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('pat-toggle').click()">
            Token
          </button>
          <a href="." class="btn btn-ghost btn-sm">
            Search
          </a>
        </div>
      </div>
    `;
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  },

  /**
   * Renders the primary Repository Header Card
   */
  renderRepoHeader(repo, detectedStack = []) {
    const owner = repo.owner || {};
    const topics = Array.isArray(repo.topics) ? repo.topics : [];
    const isFork = Boolean(repo.fork);

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
                ${repo.private ? '<span class="badge badge-private">Private</span>' : ''}
                ${isFork ? '<span class="badge badge-fork">Fork</span>' : ''}
                ${repo.archived ? '<span class="badge badge-archived">Archived</span>' : ''}
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

        ${(topics.length > 0 || detectedStack.length > 0 || repo.homepage) ? `
          <div class="repo-header__tags">
            ${topics.slice(0, 6).map(t => `<span class="tag-chip">#${t}</span>`).join('')}
            ${detectedStack.slice(0, 5).map(item => `
              <span class="tag-chip">${item.name}</span>
            `).join('')}
            ${repo.homepage ? `
              <a href="${repo.homepage.startsWith('http') ? repo.homepage : 'https://' + repo.homepage}" target="_blank" rel="noopener" class="tag-chip" style="color:var(--text-primary);">
                ${repo.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
              </a>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Renders the Vitals Metric Strip
   */
  renderVitals(repo, commitStats = {}, latestRelease = null, communityProfile = null) {
    const stars = Stats.formatCompactNumber(repo.stargazers_count);
    const forks = Stats.formatCompactNumber(repo.forks_count);
    const watchers = Stats.formatCompactNumber(repo.subscribers_count || repo.watchers_count);
    const issues = Stats.formatCompactNumber(repo.open_issues_count);
    const size = Stats.formatSize(repo.size);
    const license = repo.license ? (repo.license.spdx_id || repo.license.name) : 'None';
    const releaseTag = latestRelease ? (latestRelease.tag_name || 'Tagged') : 'None';

    const items = [
      { label: 'Stars', value: stars, detail: `${(repo.stargazers_count || 0).toLocaleString()} stargazers` },
      { label: 'Forks', value: forks, detail: `${(repo.forks_count || 0).toLocaleString()} forks` },
      { label: 'Watchers', value: watchers, detail: `${((repo.subscribers_count || repo.watchers_count) || 0).toLocaleString()} watchers` },
      { label: 'Open Issues', value: issues, detail: `${(repo.open_issues_count || 0).toLocaleString()} open issues` },
      { label: 'Size', value: size, detail: `Repository disk size: ${size}` },
      { label: 'License', value: license, detail: `SPDX License: ${license}` },
      { label: 'Release', value: releaseTag, detail: `Latest release tag: ${releaseTag}` }
    ];

    return `
      <div class="vitals-strip">
        ${items.map(item => `
          <div class="vital-item" title="${item.detail}">
            <span class="vital-item__value">${item.value}</span>
            <span class="vital-item__label">${item.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Renders Top Contributors (Clean ranked list)
   */
  renderContributors(contributorData = {}, container) {
    if (!container) return;
    const { ranked = [], dependencyRisk, dependencyDescription, riskColor } = contributorData;

    if (ranked.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p style="color:var(--text-muted);font-size:0.85rem;">No contributor data found for this repository.</p>
        </div>
      `;
      return;
    }

    const list = ranked.slice(0, 10);

    container.innerHTML = `
      <div class="contributors-content">
        <div class="dependency-alert" style="border-left: 2px solid ${riskColor};">
          <span class="dependency-info-text">${dependencyDescription}</span>
          <span class="dependency-badge" style="background: ${riskColor}18; color: ${riskColor};">${dependencyRisk} Risk</span>
        </div>

        <div class="contributors-table">
          ${list.map(c => `
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
          `).join('')}
        </div>
      </div>
    `;

    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  },

  /**
   * Renders Codebase Health Standards Audit & Latest Release Widget
   */
  renderHealthAndReleases(communityProfile = null, latestRelease = null, repo = {}) {
    const files = communityProfile?.files || {};
    const healthPercent = communityProfile?.health_percentage ?? (repo.license ? 75 : 50);

    const checkItems = [
      { name: 'README', exists: Boolean(files.readme || true) },
      { name: 'LICENSE', exists: Boolean(files.license || repo.license) },
      { name: 'Contributing Guide', exists: Boolean(files.contributing) },
      { name: 'Code of Conduct', exists: Boolean(files.code_of_conduct) },
      { name: 'Issue Templates', exists: Boolean(files.issue_template) },
      { name: 'PR Template', exists: Boolean(files.pull_request_template) }
    ];

    const spdx = (repo.license?.spdx_id || '').toUpperCase();
    let licenseType = 'Custom';
    if (['MIT', 'APACHE-2.0', 'BSD-2-CLAUSE', 'BSD-3-CLAUSE', 'ISC', 'UNLICENSE'].includes(spdx)) {
      licenseType = 'Permissive';
    } else if (['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0', 'MPL-2.0'].includes(spdx)) {
      licenseType = 'Copyleft';
    } else if (!spdx) {
      licenseType = 'Unlicensed';
    }

    const releaseHtml = latestRelease ? `
      <div class="latest-release-box">
        <div class="release-header">
          <span class="release-tag">${latestRelease.tag_name || 'Latest'}</span>
          <span class="release-date">${latestRelease.published_at ? Stats.formatRelativeTime(latestRelease.published_at) : ''}</span>
        </div>
        <p class="release-title">${latestRelease.name ? this.escapeHtml(latestRelease.name) : 'Release ' + latestRelease.tag_name}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
          <span style="font-size:0.72rem; color:var(--text-tertiary); font-family:var(--font-mono);">${licenseType} (${spdx || 'None'})</span>
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
            ${checkItems.map(item => `
              <div class="checklist-item ${item.exists ? 'item-pass' : 'item-missing'}">
                <div class="checklist-left">
                  <span class="checklist-dot"></span>
                  <span class="checklist-label">${item.name}</span>
                </div>
                <span class="checklist-status">${item.exists ? 'Found' : 'Missing'}</span>
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
