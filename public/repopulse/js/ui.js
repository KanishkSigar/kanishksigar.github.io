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
        <div class="skeleton-header card">
          <div style="display:flex; gap:16px; align-items:center;">
            <div class="skeleton-pulse" style="width:64px; height:64px; border-radius:14px;"></div>
            <div style="flex:1;">
              <div class="skeleton-pulse" style="width:240px; height:24px; border-radius:6px; margin-bottom:10px;"></div>
              <div class="skeleton-pulse" style="width:360px; height:14px; border-radius:4px;"></div>
            </div>
          </div>
        </div>

        <div class="vitals-grid" style="margin-top:var(--space-6);">
          ${Array(8).fill(`
            <div class="vital-card card skeleton-pulse" style="height:90px;"></div>
          `).join('')}
        </div>

        <div class="analytics-grid" style="margin-top:var(--space-6); display:grid; grid-template-columns:1fr 1fr; gap:var(--space-6);">
          <div class="card skeleton-pulse" style="height:360px;"></div>
          <div class="card skeleton-pulse" style="height:360px;"></div>
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
      <div class="card error-card" style="padding:var(--space-10); text-align:center; max-width:640px; margin:40px auto;">
        <div style="width:52px; height:52px; border-radius:50%; background:rgba(248,113,113,0.15); color:#f87171; display:flex; align-items:center; justify-content:center; margin:0 auto var(--space-4);">
          <i data-lucide="alert-triangle" style="width:26px; height:26px;"></i>
        </div>
        <h2 style="font-family:var(--font-display); font-size:1.35rem; margin-bottom:8px; color:var(--text-primary);">
          ${isRateLimit ? 'API Rate Limit Reached' : 'Unable to Analyze Repository'}
        </h2>
        <p style="color:var(--text-secondary); font-size:0.9rem; line-height:1.6; margin-bottom:24px;">
          ${message}
        </p>
        <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="location.reload()">
            <i data-lucide="rotate-cw" style="width:16px;height:16px;"></i>
            <span>Retry</span>
          </button>
          <button class="btn btn-secondary" onclick="document.getElementById('pat-toggle').click()">
            <i data-lucide="key-round" style="width:16px;height:16px;"></i>
            <span>Configure Token</span>
          </button>
          <a href="." class="btn btn-ghost">
            <span>Back to Search</span>
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
    const licenseName = repo.license ? (repo.license.spdx_id || repo.license.name) : 'No License';
    const isFork = Boolean(repo.fork);
    const defaultBranch = repo.default_branch || 'main';

    return `
      <div class="repo-header card">
        <div class="repo-header__top">
          <div class="repo-header__identity">
            <a href="${owner.html_url || '#'}" target="_blank" rel="noopener" class="repo-header__avatar-link" title="Visit ${owner.login}">
              <img src="${owner.avatar_url || 'https://github.com/github.png'}" alt="${owner.login}" class="repo-header__avatar" loading="lazy">
            </a>
            <div class="repo-header__titles">
              <div class="repo-header__breadcrumbs">
                <a href="${owner.html_url || '#'}" target="_blank" rel="noopener" class="repo-header__owner">${owner.login}</a>
                <span class="repo-header__slash">/</span>
                <a href="${repo.html_url}" target="_blank" rel="noopener" class="repo-header__name">${repo.name}</a>
                <span class="badge ${repo.private ? 'badge-private' : 'badge-public'}">${repo.private ? 'Private' : 'Public'}</span>
                ${isFork ? '<span class="badge badge-fork"><i data-lucide="git-fork" style="width:12px;height:12px;"></i> Fork</span>' : ''}
                ${repo.archived ? '<span class="badge badge-archived">Archived</span>' : ''}
              </div>
              <p class="repo-header__desc">${repo.description ? this.escapeHtml(repo.description) : '<em>No repository description provided.</em>'}</p>
            </div>
          </div>

          <div class="repo-header__actions">
            <a href="${repo.html_url}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" title="Open repository on GitHub">
              <i data-lucide="github" style="width:15px;height:15px;"></i>
              <span>GitHub</span>
            </a>
            <button class="btn btn-secondary btn-sm" id="btn-copy-clone" data-clone="${repo.clone_url}" title="Copy git clone command">
              <i data-lucide="copy" style="width:15px;height:15px;"></i>
              <span id="clone-btn-label">Clone</span>
            </button>
            <button class="btn btn-primary btn-sm" id="btn-share-report" title="Copy Markdown Report summary">
              <i data-lucide="share-2" style="width:15px;height:15px;"></i>
              <span>Share</span>
            </button>
          </div>
        </div>

        <!-- Topics & Detected Ecosystem Tags -->
        <div class="repo-header__tags">
          ${topics.slice(0, 8).map(t => `<span class="tag-chip tag-topic">#${t}</span>`).join('')}
          ${detectedStack.slice(0, 6).map(item => `
            <span class="tag-chip tag-stack">
              <i data-lucide="${item.icon || 'layers'}" style="width:12px;height:12px;"></i>
              ${item.name}
            </span>
          `).join('')}
          ${repo.homepage ? `
            <a href="${repo.homepage.startsWith('http') ? repo.homepage : 'https://' + repo.homepage}" target="_blank" rel="noopener" class="tag-chip tag-homepage" title="Website: ${repo.homepage}">
              <i data-lucide="link" style="width:12px;height:12px;"></i>
              ${repo.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Renders the 8-metric Vitals Ribbon
   */
  renderVitals(repo, commitStats = {}, latestRelease = null, communityProfile = null) {
    const stars = Stats.formatCompactNumber(repo.stargazers_count);
    const forks = Stats.formatCompactNumber(repo.forks_count);
    const watchers = Stats.formatCompactNumber(repo.subscribers_count || repo.watchers_count);
    const issues = Stats.formatCompactNumber(repo.open_issues_count);
    const size = Stats.formatSize(repo.size);
    const license = repo.license ? (repo.license.spdx_id || repo.license.name) : 'None';
    const releaseTag = latestRelease ? (latestRelease.tag_name || 'v1.0') : 'No release';
    const healthPercent = communityProfile?.health_percentage !== undefined ? `${communityProfile.health_percentage}%` : 'Standard';

    const items = [
      { label: 'Stars', value: stars, icon: 'star', color: '#fbbf24' },
      { label: 'Forks', value: forks, icon: 'git-fork', color: '#60a5fa' },
      { label: 'Watchers', value: watchers, icon: 'eye', color: '#a78bfa' },
      { label: 'Open Issues', value: issues, icon: 'alert-circle', color: '#f87171' },
      { label: 'Repository Size', value: size, icon: 'hard-drive', color: '#34d399' },
      { label: 'License', value: license, icon: 'file-text', color: '#38bdf8' },
      { label: 'Latest Release', value: releaseTag, icon: 'tag', color: '#ec4899' },
      { label: 'Community Health', value: healthPercent, icon: 'shield-check', color: '#10b981' }
    ];

    return `
      <div class="vitals-grid">
        ${items.map(item => `
          <div class="vital-card card">
            <div class="vital-card__icon" style="color: ${item.color}; background: ${item.color}18;">
              <i data-lucide="${item.icon}" style="width:18px;height:18px;"></i>
            </div>
            <div class="vital-card__content">
              <span class="vital-card__value" title="${item.value}">${item.value}</span>
              <span class="vital-card__label">${item.label}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Renders the Top Contributors Podium and Leaderboard
   */
  renderContributors(contributorData = {}, container) {
    if (!container) return;
    const { podium = [], ranked = [], dependencyRisk, dependencyDescription, riskColor } = contributorData;

    if (podium.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="users" style="width:32px;height:32px;color:var(--text-muted);margin-bottom:8px;"></i>
          <p style="color:var(--text-muted);font-size:0.875rem;">No contributor data found for this repository.</p>
        </div>
      `;
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      return;
    }

    const first = podium[0];
    const second = podium[1];
    const third = podium[2];

    const podiumHtml = `
      <div class="podium-wrapper">
        <!-- 2nd Place -->
        ${second ? `
          <div class="podium-step podium-step-2">
            <div class="podium-badge badge-silver">#2</div>
            <a href="${second.html_url}" target="_blank" rel="noopener" class="podium-avatar-link">
              <img src="${second.avatar_url}" alt="${second.login}" class="podium-avatar" loading="lazy">
            </a>
            <a href="${second.html_url}" target="_blank" rel="noopener" class="podium-login">${second.login}</a>
            <span class="podium-count">${second.contributions.toLocaleString()} commits</span>
            <span class="podium-share">${second.share}% share</span>
            <div class="podium-pillar pillar-2"></div>
          </div>
        ` : '<div class="podium-step-empty"></div>'}

        <!-- 1st Place (Center & Elevated) -->
        ${first ? `
          <div class="podium-step podium-step-1">
            <div class="podium-badge badge-gold"><i data-lucide="crown" style="width:14px;height:14px;"></i> #1</div>
            <a href="${first.html_url}" target="_blank" rel="noopener" class="podium-avatar-link">
              <img src="${first.avatar_url}" alt="${first.login}" class="podium-avatar podium-avatar-gold" loading="lazy">
            </a>
            <a href="${first.html_url}" target="_blank" rel="noopener" class="podium-login">${first.login}</a>
            <span class="podium-count">${first.contributions.toLocaleString()} commits</span>
            <span class="podium-share">${first.share}% share</span>
            <div class="podium-pillar pillar-1"></div>
          </div>
        ` : ''}

        <!-- 3rd Place -->
        ${third ? `
          <div class="podium-step podium-step-3">
            <div class="podium-badge badge-bronze">#3</div>
            <a href="${third.html_url}" target="_blank" rel="noopener" class="podium-avatar-link">
              <img src="${third.avatar_url}" alt="${third.login}" class="podium-avatar" loading="lazy">
            </a>
            <a href="${third.html_url}" target="_blank" rel="noopener" class="podium-login">${third.login}</a>
            <span class="podium-count">${third.contributions.toLocaleString()} commits</span>
            <span class="podium-share">${third.share}% share</span>
            <div class="podium-pillar pillar-3"></div>
          </div>
        ` : '<div class="podium-step-empty"></div>'}
      </div>
    `;

    // Leaderboard table for contributors ranked 4+
    const remaining = ranked.slice(3, 15);
    const leaderboardHtml = remaining.length > 0 ? `
      <div class="contributors-list">
        <h4 class="contributors-list__title">Core Contributors</h4>
        <div class="contributors-table">
          ${remaining.map(c => `
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
              <a href="${c.html_url}" target="_blank" rel="noopener" class="contributor-link" title="View profile on GitHub">
                <i data-lucide="external-link" style="width:13px;height:13px;"></i>
              </a>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    container.innerHTML = `
      <div class="contributors-content">
        <!-- Dependency Risk Notice -->
        <div class="dependency-alert" style="border-left: 3px solid ${riskColor};">
          <div class="dependency-alert__header">
            <span class="dependency-badge" style="background: ${riskColor}18; color: ${riskColor};">${dependencyRisk}</span>
            <span class="dependency-info-text">${dependencyDescription}</span>
          </div>
        </div>

        ${podiumHtml}
        ${leaderboardHtml}
      </div>
    `;

    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  },

  /**
   * Renders Codebase Health Checklist & Latest Release Widget
   */
  renderHealthAndReleases(communityProfile = null, latestRelease = null, repo = {}) {
    const files = communityProfile?.files || {};
    const healthPercent = communityProfile?.health_percentage ?? (repo.license ? 75 : 50);

    const checkItems = [
      { name: 'README', exists: Boolean(files.readme || true), icon: 'book-open' },
      { name: 'LICENSE', exists: Boolean(files.license || repo.license), icon: 'file-text' },
      { name: 'Contributing Guide', exists: Boolean(files.contributing), icon: 'git-pull-request' },
      { name: 'Code of Conduct', exists: Boolean(files.code_of_conduct), icon: 'heart-handshake' },
      { name: 'Issue Templates', exists: Boolean(files.issue_template), icon: 'file-question' },
      { name: 'Pull Request Template', exists: Boolean(files.pull_request_template), icon: 'git-merge' }
    ];

    const releaseHtml = latestRelease ? `
      <div class="latest-release-box">
        <div class="release-header">
          <div class="release-tag-pill">
            <i data-lucide="tag" style="width:14px;height:14px;"></i>
            <span>${latestRelease.tag_name || 'Latest'}</span>
          </div>
          <span class="release-date">${latestRelease.published_at ? Stats.formatRelativeTime(latestRelease.published_at) : 'Tagged'}</span>
        </div>
        <p class="release-title">${latestRelease.name ? this.escapeHtml(latestRelease.name) : 'Release ' + latestRelease.tag_name}</p>
        <a href="${latestRelease.html_url}" target="_blank" rel="noopener" class="release-link">
          <span>View Release Notes</span>
          <i data-lucide="arrow-up-right" style="width:14px;height:14px;"></i>
        </a>
      </div>
    ` : `
      <div class="latest-release-box release-none">
        <p style="color:var(--text-muted);font-size:0.85rem;">No formal releases published on GitHub yet.</p>
        <span style="font-size:0.75rem;color:var(--text-tertiary);">Track development on default branch (<code>${repo.default_branch || 'main'}</code>)</span>
      </div>
    `;

    return `
      <div class="health-and-release-grid">
        <!-- Community Standards Checklist -->
        <div class="health-card">
          <div class="health-score-header">
            <span class="health-score-title">Community Standards</span>
            <span class="health-score-pct">${healthPercent}%</span>
          </div>
          <div class="health-progress-bg">
            <div class="health-progress-fill" style="width:${healthPercent}%;"></div>
          </div>
          <div class="health-checklist">
            ${checkItems.map(item => `
              <div class="checklist-item ${item.exists ? 'item-pass' : 'item-missing'}">
                <i data-lucide="${item.exists ? 'check-circle-2' : 'circle-dashed'}" class="checklist-icon"></i>
                <span class="checklist-label">${item.name}</span>
                <span class="checklist-status">${item.exists ? 'Found' : 'Missing'}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Latest Release Info -->
        <div class="release-card">
          <h4 class="card-subtitle"><i data-lucide="package" style="width:15px;height:15px;"></i> Latest Release</h4>
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
