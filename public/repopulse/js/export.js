// ============================================
// RepoPulse — Dashboard Export & Sharing Engine
// ============================================

import { formatBytes } from './langColors.js';
import { Stats } from './stats.js';

export const Exporter = {
  /**
   * Captures and downloads the dashboard as high-resolution PNG image
   * @param {string} repoFullName e.g. "facebook/react"
   * @param {HTMLElement} triggerBtn Button element to toggle loading state
   */
  async exportAsPng(repoFullName = 'repository', triggerBtn = null) {
    const target = document.getElementById('repo-main-content') || document.getElementById('dashboard');
    if (!target || !window.html2canvas) {
      alert('html2canvas library is not ready. Please try again.');
      return;
    }

    const origHtml = triggerBtn ? triggerBtn.innerHTML : null;
    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.innerHTML = '<span class="spin-icon" style="display:inline-block;">⏳</span> Exporting...';
    }

    try {
      // Determine theme background color for the capture canvas
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const bgColor = isLight ? '#f7f6f3' : '#111014';

      const canvas = await window.html2canvas(target, {
        backgroundColor: bgColor,
        scale: 2, // 2x retina clarity
        useCORS: true,
        logging: false,
        ignoreElements: (element) => {
          return element.classList?.contains('no-export');
        }
      });

      const safeName = repoFullName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `repopulse-${safeName}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export dashboard image:', err);
      alert('Failed to generate image: ' + err.message);
    } finally {
      if (triggerBtn && origHtml) {
        triggerBtn.disabled = false;
        triggerBtn.innerHTML = origHtml;
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      }
    }
  },

  /**
   * Copies the direct URL to the repository analysis to the clipboard
   */
  async copyShareLink(repoFullName) {
    const url = new URL(window.location.href);
    url.searchParams.set('repo', repoFullName);
    try {
      await navigator.clipboard.writeText(url.toString());
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Generates a clean Markdown report string for any repository
   */
  generateMarkdownSummary(repo = {}, stats = {}, languages = {}, contributors = [], stack = [], appUrl = '') {
    const langs = Object.entries(languages || {})
      .slice(0, 5)
      .map(([name, bytes]) => `${name} (${formatBytes(bytes)})`)
      .join(', ') || 'N/A';

    const topContribs = (contributors || []).slice(0, 3)
      .map((c, i) => `${i + 1}. [${c.login}](${c.html_url}) (${(c.contributions || 0).toLocaleString()} commits)`)
      .join('\n');

    const stackItems = (stack || []).map(s => s.name).join(', ') || 'Standard';
    const origin = appUrl || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?repo=${encodeURIComponent(repo.full_name || '')}` : `https://kanishksigar.me/repopulse/?repo=${encodeURIComponent(repo.full_name || '')}`);

    return [
      `# RepoPulse: [${repo.full_name || repo.name || 'Repository'}](${repo.html_url || '#'})`,
      ``,
      `> ${repo.description || 'No description provided.'}`,
      ``,
      `### Metrics`,
      `- **Stars:** ${Stats.formatCompactNumber(repo.stargazers_count)} (${(repo.stargazers_count || 0).toLocaleString()})`,
      `- **Forks:** ${Stats.formatCompactNumber(repo.forks_count)}`,
      `- **Watchers:** ${Stats.formatCompactNumber(repo.subscribers_count || repo.watchers_count)}`,
      `- **Open Issues:** ${Stats.formatCompactNumber(repo.open_issues_count)}`,
      `- **Size:** ${Stats.formatSize(repo.size)}`,
      `- **License:** ${repo.license?.spdx_id || repo.license?.name || 'None'}`,
      ``,
      `### Tech Stack`,
      `- **Languages:** ${langs}`,
      `- **Detected Ecosystem:** ${stackItems}`,
      ``,
      `### Commit Velocity`,
      `- **Annual Commits:** ${stats.totalYearCommits?.toLocaleString() || 'N/A'}`,
      `- **Weekly Average:** ${stats.weeklyAverage || 'N/A'} commits/week`,
      `- **Peak Week:** ${stats.peakWeek?.count || 'N/A'} commits (${stats.peakWeek?.date || ''})`,
      `- **Active Day:** ${stats.mostActiveDay || 'N/A'}`,
      ``,
      `### Top Contributors`,
      topContribs || 'N/A',
      ``,
      `---`,
      `*Generated with [RepoPulse](${origin})*`
    ].join('\n');
  },

  /**
   * Generates a clean Markdown summary for the repository and copies it to clipboard
   */
  async copyMarkdownReport(repo, stats = {}, languages = {}, contributors = [], stack = []) {
    const markdown = this.generateMarkdownSummary(repo, stats, languages, contributors, stack);

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
        return true;
      }
    } catch (_) {}

    if (typeof document !== 'undefined') {
      try {
        const ta = document.createElement('textarea');
        ta.value = markdown;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch (_) {}
    }
    return false;
  }
};
