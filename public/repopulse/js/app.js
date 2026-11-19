// ============================================
// RepoPulse — Main Application Coordinator
// ============================================

import { API } from './api.js';
import { UI } from './ui.js';
import { Charts } from './charts.js';
import { Stats } from './stats.js';
import { Compare } from './compare.js';
import { parseRepoInput } from './urlParser.js';
import { detectTechStack } from './stackDetector.js';
import { Exporter } from './export.js';

// DOM Selectors
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
  // Header Elements
  headerSearch: $('#header-search'),
  headerRepoInput: $('#repo-input'),
  patToggle: $('#pat-toggle'),
  patPanel: $('#pat-panel'),
  patClose: $('#pat-close'),
  patInput: $('#pat-input'),
  patSave: $('#pat-save'),
  patClear: $('#pat-clear'),
  rateLimitStatus: $('#rate-limit-status'),

  // Landing Elements
  landingSection: $('#landing-section'),
  landingRepoInput: $('#landing-repo-input'),
  landingSearchBtn: $('#landing-search-btn'),
  landingError: $('#landing-error'),
  presetChips: $$('.preset-chip'),

  // Dashboard Elements
  dashboard: $('#dashboard'),
  mainContent: $('#repo-main-content'),

  // Themes & Export
  themeToggle: $('#theme-toggle'),
  themeDropdown: $('#theme-dropdown'),
  exportBtn: $('#export-btn'),

  // Compare
  compareBtn: $('#compare-btn'),
  compareSection: $('#compare-section'),
  compareContent: $('#compare-content')
};

// Application State
const state = {
  currentRepo: null,
  repoData: null,
  statsData: null,
  languagesData: null,
  contributorsData: null,
  stackData: null,
  token: API.getToken()
};

// ═══════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════
function init() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  if (state.token) {
    els.patToggle?.classList.add('has-token');
    if (els.patInput) els.patInput.value = state.token;
  }

  checkRateLimit();
  bindEvents();
  handleUrlRouting();
}

// ═══════════════════════════════════════
//  EVENT BINDINGS
// ═══════════════════════════════════════
function bindEvents() {
  bindTheme();
  bindAuth();
  bindNavigation();
  bindKeyboardShortcuts();

  // Landing Search
  if (els.landingSearchBtn) {
    els.landingSearchBtn.addEventListener('click', () => {
      const val = els.landingRepoInput?.value;
      submitSearch(val, els.landingError);
    });
  }

  if (els.landingRepoInput) {
    els.landingRepoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        submitSearch(els.landingRepoInput.value, els.landingError);
      }
    });
  }

  // Header Search
  if (els.headerRepoInput) {
    els.headerRepoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        submitSearch(els.headerRepoInput.value);
      }
    });
  }

  // Preset Chips (query dynamically)
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const repo = chip.dataset.repo;
      if (repo) {
        if (els.landingRepoInput) els.landingRepoInput.value = repo;
        submitSearch(repo);
      }
    });
  });

  // Export Dashboard Button
  if (els.exportBtn) {
    els.exportBtn.addEventListener('click', () => {
      const fullName = state.currentRepo?.fullName || 'repository';
      Exporter.exportAsPng(fullName, els.exportBtn);
    });
  }

  // Compare Toggle Button
  if (els.compareBtn) {
    els.compareBtn.addEventListener('click', toggleCompare);
  }

  // Popstate for browser back/forward buttons
  window.addEventListener('popstate', handleUrlRouting);
}

function bindNavigation() {
  document.querySelectorAll('.header__brand').forEach(brand => {
    brand.addEventListener('click', (e) => {
      e.preventDefault();
      state.currentRepo = null;
      if (els.landingRepoInput) els.landingRepoInput.value = '';
      if (els.headerRepoInput) els.headerRepoInput.value = '';
      UI.showLanding();
      window.history.pushState({}, '', window.location.pathname);
    });
  });
}

function handleGlobalKeydown(e) {
  const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

  if (e.key === 'Escape') {
    if (!els.patPanel.hidden) return (els.patPanel.hidden = true);
    if (!els.compareSection.hidden) return closeCompare();
    if (isInputActive) document.activeElement?.blur();
    return;
  }

  const isSearch = (e.key === '/' && !isInputActive) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k');
  if (isSearch) {
    e.preventDefault();
    const target = (!els.dashboard.hidden && els.headerRepoInput) ? els.headerRepoInput : els.landingRepoInput;
    target?.focus();
    target?.select();
  }
}

function bindKeyboardShortcuts() {
  window.addEventListener('keydown', handleGlobalKeydown);
}

// ═══════════════════════════════════════
//  URL ROUTING
// ═══════════════════════════════════════
function handleUrlRouting() {
  const params = new URLSearchParams(window.location.search);
  const repoParam = params.get('repo');
  const compareParam = params.get('compare');

  if (compareParam && compareParam.includes(',')) {
    const [a, b] = compareParam.split(',').map(s => s.trim());
    showCompare(a, b);
  } else if (repoParam) {
    if (els.landingRepoInput) els.landingRepoInput.value = repoParam;
    if (els.headerRepoInput) els.headerRepoInput.value = repoParam;
    analyzeRepository(repoParam);
  } else {
    UI.showLanding();
  }
}

// ═══════════════════════════════════════
//  SEARCH HANDLER
// ═══════════════════════════════════════
function submitSearch(inputVal, errorEl = null) {
  if (errorEl) {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  const parsed = parseRepoInput(inputVal);
  if (!parsed.isValid) {
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = parsed.error;
    } else {
      alert(parsed.error);
    }
    return;
  }

  // Update browser URL
  const newUrl = `?repo=${encodeURIComponent(parsed.fullName)}`;
  window.history.pushState({ repo: parsed.fullName }, '', newUrl);

  if (els.headerRepoInput) els.headerRepoInput.value = parsed.fullName;
  analyzeRepository(parsed.fullName);
}

// ═══════════════════════════════════════
//  CORE REPOSITORY ANALYSIS
// ═══════════════════════════════════════
async function analyzeRepository(repoSpecifier) {
  const parsed = parseRepoInput(repoSpecifier);
  if (!parsed.isValid) {
    UI.showError(parsed.error);
    return;
  }

  state.currentRepo = parsed;
  document.title = `${parsed.fullName} — RepoPulse`;
  UI.showLoading(parsed.fullName);

  try {
    // 1. Fetch Repository Metadata
    const repo = await API.getRepo(parsed.owner, parsed.repo);
    state.repoData = repo;

    // 2. Fetch parallel deep analytics
    const [languages, commitActivity, recentCommits, contributors, latestRelease, communityProfile] = await Promise.all([
      API.getLanguages(parsed.owner, parsed.repo).catch(() => ({})),
      API.getCommitActivity(parsed.owner, parsed.repo).catch(() => []),
      API.getRecentCommits(parsed.owner, parsed.repo).catch(() => []),
      API.getContributors(parsed.owner, parsed.repo, 30).catch(() => []),
      API.getLatestRelease(parsed.owner, parsed.repo).catch(() => null),
      API.getCommunityProfile(parsed.owner, parsed.repo).catch(() => null)
    ]);

    // 3. Process & Detect Data
    const detectedStack = detectTechStack(repo, languages);
    const commitStats = Stats.analyzeCommitActivity(commitActivity);
    const contributorStats = Stats.analyzeContributors(contributors);

    state.languagesData = languages;
    state.statsData = commitStats;
    state.commitActivityData = commitActivity;
    state.recentCommitsData = recentCommits;
    state.contributorsData = contributorStats;
    state.stackData = detectedStack;

    // 4. Render Main Dashboard Bento Grid
    renderDashboardLayout(repo, detectedStack, commitStats, latestRelease, communityProfile);

    // 5. Render Chart.js Visualizations
    const techStackEl = $('#tech-stack-container');
    if (techStackEl) Charts.renderTechStack(languages, techStackEl);

    const commitActivityEl = $('#commit-velocity-container');
    if (commitActivityEl) Charts.renderCommitActivity(commitActivity, commitActivityEl, commitStats);

    const cadenceEl = $('#commit-cadence-container');
    if (cadenceEl) Charts.renderCadence(commitStats.dayDistribution, recentCommits, cadenceEl);

    const contributorsEl = $('#contributors-container');
    if (contributorsEl) UI.renderContributors(contributorStats, contributorsEl);

    const contributorShareEl = $('#contributor-share-container');
    if (contributorShareEl) Charts.renderContributorShare(contributors, contributorShareEl);

    // 6. Bind in-dashboard dynamic actions
    bindDashboardActions(repo);
    checkRateLimit();

  } catch (err) {
    console.error('Failed to analyze repository:', err);
    const isRateLimit = err.message && err.message.toLowerCase().includes('rate limit');
    UI.showError(err.message, isRateLimit);
  }
}

// ═══════════════════════════════════════
//  DASHBOARD DOM ASSEMBLY
// ═══════════════════════════════════════
function renderDashboardLayout(repo, detectedStack, commitStats, latestRelease, communityProfile) {
  if (!els.mainContent) return;

  const headerHtml = UI.renderRepoHeader(repo, detectedStack);
  const vitalsHtml = UI.renderVitals(repo, commitStats, latestRelease, communityProfile);
  const healthHtml = UI.renderHealthAndReleases(communityProfile, latestRelease, repo);

  els.mainContent.innerHTML = `
    <div class="repo-dashboard-layout">
      ${headerHtml}
      ${vitalsHtml}

      <!-- Bento Grid Row 1: Tech Stack & Velocity -->
      <div class="analytics-bento-grid">
        
        <div class="card bento-card" id="card-tech-stack">
          <div class="bento-header">
            <span class="bento-title">Tech Stack</span>
            <span class="bento-subtitle">GitHub Linguist byte share</span>
          </div>
          <div id="tech-stack-container"></div>
        </div>

        <div class="card bento-card" id="card-commit-velocity">
          <div class="bento-header">
            <span class="bento-title">Commit Velocity</span>
            <span class="bento-subtitle">Past 52 weeks</span>
          </div>
          <div id="commit-velocity-container"></div>
        </div>

      </div>

      <!-- Bento Grid Row 2: Cadence & Codebase Health -->
      <div class="analytics-bento-grid">
        
        <div class="card bento-card" id="card-commit-cadence">
          <div class="bento-header">
            <span class="bento-title">Commit Cadence</span>
            <span class="bento-subtitle">Day &amp; hour distribution</span>
          </div>
          <div id="commit-cadence-container"></div>
        </div>

        <div class="card bento-card" id="card-codebase-health">
          <div class="bento-header">
            <span class="bento-title">Codebase Health</span>
            <span class="bento-subtitle">Standards audit</span>
          </div>
          <div>
            ${healthHtml}
          </div>
        </div>

      </div>

      <!-- Full Width: Top Contributors & Maintainer Risk -->
      <div class="card bento-card" id="card-top-contributors" style="margin-top:var(--space-4);">
        <div class="bento-header">
          <div>
            <span class="bento-title">Contributors &amp; Maintainer Distribution</span>
            <span class="bento-subtitle">Ranked volume and bus factor risk</span>
          </div>
          <div id="contributor-share-container" style="min-width:200px; height:100px;"></div>
        </div>
        <div id="contributors-container"></div>
      </div>

    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
}

// ═══════════════════════════════════════
//  DASHBOARD ACTIONS BINDING
// ═══════════════════════════════════════
function bindDashboardActions(repo) {
  // Clone button copy action
  const copyCloneBtn = $('#btn-copy-clone');
  const cloneBtnLabel = $('#clone-btn-label');
  if (copyCloneBtn && cloneBtnLabel) {
    copyCloneBtn.addEventListener('click', async () => {
      const cloneUrl = copyCloneBtn.dataset.clone || repo.clone_url;
      try {
        await navigator.clipboard.writeText(`git clone ${cloneUrl}`);
        cloneBtnLabel.textContent = 'Copied!';
        setTimeout(() => { cloneBtnLabel.textContent = 'Clone'; }, 2000);
      } catch (e) {
        prompt('Copy git clone command:', `git clone ${cloneUrl}`);
      }
    });
  }

  // Share markdown report action
  const shareBtn = $('#btn-share-report');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const success = await Exporter.copyMarkdownReport(
        state.repoData,
        state.statsData,
        state.languagesData,
        state.contributorsData?.ranked || [],
        state.stackData || []
      );
      if (success) {
        const origText = shareBtn.innerHTML;
        shareBtn.innerHTML = '<i data-lucide="check" style="width:15px;height:15px;"></i><span>Copied Report!</span>';
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
        setTimeout(() => {
          shareBtn.innerHTML = origText;
          if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
        }, 2500);
      }
    });
  }
}

// ═══════════════════════════════════════
//  COMPARE VIEW
// ═══════════════════════════════════════
function toggleCompare() {
  const isHidden = els.compareSection.hidden;
  if (isHidden) {
    showCompare();
  } else {
    closeCompare();
  }
}

function showCompare(prefillA = '', prefillB = '') {
  els.compareSection.hidden = false;
  els.dashboard.hidden = true;
  els.landingSection.hidden = true;

  const currentFullName = state.currentRepo?.fullName || '';
  const valA = prefillA || currentFullName || 'facebook/react';
  const valB = prefillB || 'vuejs/core';

  els.compareContent.innerHTML = `
    <div class="compare-box">
      <div class="compare-top-bar">
        <h2 style="font-size:1.05rem; font-weight:600;">Compare Repositories</h2>
        <button class="btn btn-ghost btn-sm" id="compare-close" aria-label="Close compare">
          <i data-lucide="x" style="width:14px;height:14px;"></i>
        </button>
      </div>
      <div class="compare-inputs-row">
        <input type="text" class="input" id="compare-input-a" placeholder="First repository (e.g. facebook/react)" value="${valA}" autocomplete="off">
        <input type="text" class="input" id="compare-input-b" placeholder="Second repository (e.g. vuejs/core)" value="${valB}" autocomplete="off">
        <button class="btn btn-primary btn-sm" id="compare-run-btn">Compare</button>
      </div>
      <div id="compare-results"></div>
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();

  $('#compare-close')?.addEventListener('click', closeCompare);
  $('#compare-run-btn')?.addEventListener('click', () => {
    const a = $('#compare-input-a')?.value;
    const b = $('#compare-input-b')?.value;
    if (a && b) {
      window.history.pushState({}, '', `?compare=${encodeURIComponent(a)},${encodeURIComponent(b)}`);
      Compare.render(a, b);
    }
  });

  if (prefillA && prefillB) {
    Compare.render(prefillA, prefillB);
  }
}

function closeCompare() {
  els.compareSection.hidden = true;
  if (state.currentRepo) {
    UI.showDashboard();
    window.history.pushState({}, '', `?repo=${encodeURIComponent(state.currentRepo.fullName)}`);
  } else {
    UI.showLanding();
    window.history.pushState({}, '', window.location.pathname);
  }
}

// ═══════════════════════════════════════
//  AUTH & PAT TOKEN PANEL
// ═══════════════════════════════════════
function bindAuth() {
  if (els.patToggle) {
    els.patToggle.addEventListener('click', () => {
      const isHidden = els.patPanel.hidden;
      els.patPanel.hidden = !isHidden;
      if (!els.patPanel.hidden) {
        checkRateLimit();
        els.patInput?.focus();
      }
    });
  }

  if (els.patClose) {
    els.patClose.addEventListener('click', () => {
      els.patPanel.hidden = true;
    });
  }

  const saveToken = () => {
    const val = els.patInput?.value.trim() || '';
    if (val) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('repopulse_pat', val);
      }
      state.token = val;
      els.patToggle?.classList.add('has-token');
      els.patPanel.hidden = true;
      checkRateLimit();
    }
  };

  const clearToken = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('repopulse_pat');
      localStorage.removeItem('gitpulse_pat');
    }
    state.token = '';
    if (els.patInput) els.patInput.value = '';
    els.patToggle?.classList.remove('has-token');
    checkRateLimit();
  };

  if (els.patSave) els.patSave.addEventListener('click', saveToken);
  if (els.patClear) els.patClear.addEventListener('click', clearToken);
  if (els.patInput) {
    els.patInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveToken();
    });
  }
}

async function checkRateLimit() {
  try {
    const rl = await API.getRateLimit();
    if (els.rateLimitStatus) {
      const resetMin = rl.resetTime ? Math.max(1, Math.round((rl.resetTime - Date.now()) / 60000)) : 0;
      els.rateLimitStatus.innerHTML = `
        <span>API Requests: <strong>${rl.remaining} / ${rl.limit}</strong> remaining (resets in ${resetMin}m)</span>
      `;
    }
  } catch (e) {}
}

// ═══════════════════════════════════════
//  THEME SYSTEM
// ═══════════════════════════════════════
function bindTheme() {
  if (els.themeToggle && els.themeDropdown) {
    els.themeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      els.themeDropdown.hidden = !els.themeDropdown.hidden;
    });

    document.addEventListener('click', () => {
      if (els.themeDropdown) els.themeDropdown.hidden = true;
    });

    $$('.theme-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        const theme = opt.dataset.theme;
        if (theme) {
          document.documentElement.setAttribute('data-theme', theme);
          localStorage.setItem('repopulse_theme', theme);
        } else {
          document.documentElement.removeAttribute('data-theme');
          localStorage.removeItem('repopulse_theme');
        }

        // Re-render active charts with updated theme colors
        if (state.languagesData && $('#tech-stack-container')) {
          Charts.renderTechStack(state.languagesData, $('#tech-stack-container'));
        }
        if (state.statsData && $('#commit-velocity-container')) {
          Charts.renderCommitActivity(state.commitActivityData || [], $('#commit-velocity-container'), state.statsData);
        }
        if (state.statsData && $('#commit-cadence-container')) {
          Charts.renderCadence(state.statsData.dayDistribution || [0,0,0,0,0,0,0], state.recentCommitsData || [], $('#commit-cadence-container'));
        }
      });
    });
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
