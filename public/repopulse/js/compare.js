// ============================================
// RepoPulse — Compare Two Repositories Side by Side
// ============================================

import { API } from './api.js';
import { parseRepoInput } from './urlParser.js';
import { getLangColor } from './langColors.js';
import { Stats } from './stats.js';

export const Compare = {
  get element() {
    return document.getElementById('compare-results');
  },

  async render(inputA, inputB) {
    const el = this.element;
    if (!el) return;

    const parsedA = parseRepoInput(inputA);
    const parsedB = parseRepoInput(inputB);

    if (!parsedA.isValid) {
      el.innerHTML = `<div class="compare-error">Invalid first repository: ${parsedA.error}</div>`;
      return;
    }
    if (!parsedB.isValid) {
      el.innerHTML = `<div class="compare-error">Invalid second repository: ${parsedB.error}</div>`;
      return;
    }

    el.innerHTML = `
      <div class="compare-loading card" style="text-align:center; padding:var(--space-8);">
        <i data-lucide="loader-2" class="spin-icon" style="width:28px;height:28px;margin-bottom:8px;color:var(--accent);"></i>
        <p style="color:var(--text-secondary);font-size:0.9rem;">Comparing <strong>${parsedA.fullName}</strong> vs <strong>${parsedB.fullName}</strong>...</p>
      </div>
    `;
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();

    try {
      const [repoA, langsA, actA, repoB, langsB, actB] = await Promise.all([
        API.getRepo(parsedA.owner, parsedA.repo),
        API.getLanguages(parsedA.owner, parsedA.repo).catch(() => ({})),
        API.getCommitActivity(parsedA.owner, parsedA.repo).catch(() => []),
        API.getRepo(parsedB.owner, parsedB.repo),
        API.getLanguages(parsedB.owner, parsedB.repo).catch(() => ({})),
        API.getCommitActivity(parsedB.owner, parsedB.repo).catch(() => [])
      ]);

      const statsA = Stats.analyzeCommitActivity(actA);
      const statsB = Stats.analyzeCommitActivity(actB);

      const topLangA = Object.keys(langsA || {})[0] || repoA.language || 'Unknown';
      const topLangB = Object.keys(langsB || {})[0] || repoB.language || 'Unknown';

      const ageA = repoA.created_at ? ((Date.now() - new Date(repoA.created_at)) / (365.25 * 86400000)).toFixed(1) + 'y' : '—';
      const ageB = repoB.created_at ? ((Date.now() - new Date(repoB.created_at)) / (365.25 * 86400000)).toFixed(1) + 'y' : '—';

      const rows = [
        { label: 'Stars', a: repoA.stargazers_count, b: repoB.stargazers_count, format: Stats.formatCompactNumber, cmp: 'high' },
        { label: 'Forks', a: repoA.forks_count, b: repoB.forks_count, format: Stats.formatCompactNumber, cmp: 'high' },
        { label: 'Watchers', a: repoA.subscribers_count || repoA.watchers_count, b: repoB.subscribers_count || repoB.watchers_count, format: Stats.formatCompactNumber, cmp: 'high' },
        { label: 'Open Issues', a: repoA.open_issues_count, b: repoB.open_issues_count, format: Stats.formatCompactNumber, cmp: 'none' },
        { label: 'Annual Commits', a: statsA.totalYearCommits, b: statsB.totalYearCommits, format: (n) => n.toLocaleString(), cmp: 'high' },
        { label: 'Weekly Velocity', a: statsA.weeklyAverage, b: statsB.weeklyAverage, format: (n) => `${n}/wk`, cmp: 'high' },
        { label: 'Code Size', a: repoA.size, b: repoB.size, format: Stats.formatSize, cmp: 'none' },
        { label: 'Primary Tech', a: topLangA, b: topLangB, format: (s) => s, isLang: true },
        { label: 'License', a: repoA.license?.spdx_id || repoA.license?.name || 'None', b: repoB.license?.spdx_id || repoB.license?.name || 'None', format: (s) => s },
        { label: 'Repository Age', a: ageA, b: ageB, format: (s) => s }
      ];

      const renderHeader = (r, parsed) => `
        <div class="chead">
          <img src="${r.owner?.avatar_url || 'https://github.com/github.png'}" alt="${r.owner?.login}" class="chead__avatar" loading="lazy">
          <a href="${r.html_url}" target="_blank" rel="noopener" class="chead__name">${parsed.fullName}</a>
          <span class="chead__desc">${r.description ? r.description.slice(0, 70) + (r.description.length > 70 ? '…' : '') : ''}</span>
        </div>
      `;

      let gridRows = '';
      rows.forEach(row => {
        let winA = false;
        let winB = false;

        if (row.cmp === 'high' && typeof row.a === 'number' && typeof row.b === 'number') {
          if (row.a > row.b) winA = true;
          else if (row.b > row.a) winB = true;
        }

        const valA = row.format ? row.format(row.a) : row.a;
        const valB = row.format ? row.format(row.b) : row.b;

        const langDotA = row.isLang ? `<span class="cdot" style="background:${getLangColor(row.a)}"></span>` : '';
        const langDotB = row.isLang ? `<span class="cdot" style="background:${getLangColor(row.b)}"></span>` : '';

        gridRows += `
          <div class="cval ${winA ? 'win' : ''}">${langDotA} ${valA}</div>
          <div class="crow-label">${row.label}</div>
          <div class="cval ${winB ? 'win' : ''}">${langDotB} ${valB}</div>
          <div class="cspacer"></div>
        `;
      });

      el.innerHTML = `
        <div class="card" style="padding:var(--space-6); margin-top:var(--space-4);">
          <div class="compare-grid">
            ${renderHeader(repoA, parsedA)}
            <div class="cvs">VS</div>
            ${renderHeader(repoB, parsedB)}
            <div class="cspacer" style="margin: 16px 0;"></div>
            ${gridRows}
          </div>
        </div>
      `;

      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    } catch (err) {
      el.innerHTML = `
        <div class="compare-error card" style="text-align:center; padding:var(--space-6); color:#f87171;">
          <p>Failed to compare repositories: ${err.message}</p>
        </div>
      `;
    }
  }
};
