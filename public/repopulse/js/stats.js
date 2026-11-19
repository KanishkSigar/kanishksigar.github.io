// ============================================
// RepoPulse — Statistics & Metric Calculators
// ============================================

export const Stats = {
  /**
   * Formats large numbers compactly (e.g. 1.2k, 4.5M)
   */
  formatCompactNumber(num) {
    const n = Number(num);
    if (!n || isNaN(n)) return '0';
    if (n < 1000) return n.toLocaleString();
    if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  },

  /**
   * Computes a rounded percentage string
   */
  formatPercent(val, total) {
    const v = Number(val) || 0;
    const t = Number(total) || 0;
    return t > 0 ? `${Math.round((v / t) * 100)}%` : '0%';
  },

  /**
   * Formats repository size in KB to readable KB, MB, GB
   */
  formatSize(kb) {
    if (!kb || kb <= 0) return '0 KB';
    if (kb < 1024) return `${kb} KB`;
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
  },

  /**
   * Formats relative ISO timestamp with compact interval mapping
   */
  formatRelativeTime(dateString) {
    if (!dateString) return 'unknown';
    const sec = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (sec < 60) return 'just now';
    const intervals = [
      [31536000, 'y'],
      [2592000, 'mo'],
      [86400, 'd'],
      [3600, 'h'],
      [60, 'm']
    ];
    for (const [divisor, unit] of intervals) {
      const val = Math.floor(sec / divisor);
      if (val >= 1) return `${val}${unit} ago`;
    }
    return 'just now';
  },

  /**
   * Formats date nicely (e.g. "Nov 13, 2026")
   */
  formatDate(dateString) {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  },

  /**
   * Analyzes 52-week commit activity array from GitHub API
   * @param {Array<{total: number, week: number, days: number[]}>} activity
   */
  analyzeCommitActivity(activity) {
    if (!Array.isArray(activity) || activity.length === 0) {
      return {
        totalYearCommits: 0,
        weeklyAverage: 0,
        peakWeek: { count: 0, date: null },
        trend: '0%',
        trendDirection: 'neutral',
        dayDistribution: [0, 0, 0, 0, 0, 0, 0],
        mostActiveDay: 'N/A'
      };
    }

    let totalYearCommits = 0;
    let peakCount = 0;
    let peakWeekTime = null;
    let activeWeeks = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat

    activity.forEach(item => {
      const count = item.total || 0;
      totalYearCommits += count;

      if (count > peakCount) {
        peakCount = count;
        peakWeekTime = item.week ? new Date(item.week * 1000) : null;
      }

      if (count > 0) {
        activeWeeks++;
        currentStreak++;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }

      if (Array.isArray(item.days)) {
        item.days.forEach((dayCount, dayIdx) => {
          dayTotals[dayIdx] = (dayTotals[dayIdx] || 0) + dayCount;
        });
      }
    });

    const weeklyAverage = Math.round(totalYearCommits / (activity.length || 52));

    // Calculate trend: last 4 weeks vs prior 4 weeks
    const len = activity.length;
    let recentCommits = 0;
    let priorCommits = 0;

    for (let i = 0; i < 4 && len - 1 - i >= 0; i++) {
      recentCommits += activity[len - 1 - i].total || 0;
    }
    for (let i = 4; i < 8 && len - 1 - i >= 0; i++) {
      priorCommits += activity[len - 1 - i].total || 0;
    }

    let trend = '0%';
    let trendDirection = 'neutral';
    if (priorCommits > 0) {
      const diffPercent = Math.round(((recentCommits - priorCommits) / priorCommits) * 100);
      trend = (diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`);
      trendDirection = diffPercent > 0 ? 'up' : (diffPercent < 0 ? 'down' : 'neutral');
    } else if (recentCommits > 0) {
      trend = '+100%';
      trendDirection = 'up';
    }

    const consistencyPercent = activity.length > 0
      ? Math.round((activeWeeks / activity.length) * 100)
      : 0;

    // Most active day calculation
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let maxDayCount = -1;
    let maxDayIdx = 0;
    dayTotals.forEach((count, idx) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        maxDayIdx = idx;
      }
    });

    const mostActiveDay = totalYearCommits > 0 
      ? `${dayNames[maxDayIdx]} (${Math.round((maxDayCount / totalYearCommits) * 100)}%)` 
      : 'N/A';

    return {
      totalYearCommits,
      weeklyAverage,
      peakWeek: {
        count: peakCount,
        date: peakWeekTime ? peakWeekTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null
      },
      recentCommits,
      activeWeeks,
      longestStreak,
      consistencyPercent,
      trend,
      trendDirection,
      dayDistribution: dayTotals,
      mostActiveDay
    };
  },

  /**
   * Analyzes contributors list to evaluate maintainer dependency and bus factor risk
   * @param {Array<{login: string, contributions: number, avatar_url: string, html_url: string, type: string}>} contributors
   */
  analyzeContributors(contributors) {
    if (!Array.isArray(contributors) || contributors.length === 0) {
      return {
        totalContributions: 0,
        contributorsCount: 0,
        top1Share: 0,
        top3Share: 0,
        dependencyRisk: 'Unknown',
        dependencyDescription: 'No contributor data available',
        podium: [],
        ranked: []
      };
    }

    // Filter automated service accounts
    const isBot = (c) => {
      const l = (c.login || '').toLowerCase();
      return l.endsWith('[bot]') || l === 'dependabot' || l === 'github-actions' || c.type === 'Bot';
    };
    const humanList = contributors.filter(c => !isBot(c));
    const list = humanList.length > 0 ? humanList : contributors;
    const totalContribs = list.reduce((sum, c) => sum + (c.contributions || 0), 0);

    const enriched = list.map((c, idx) => ({
      rank: idx + 1,
      login: c.login,
      avatar_url: c.avatar_url,
      html_url: c.html_url,
      contributions: c.contributions || 0,
      share: totalContribs > 0 ? Math.round(((c.contributions || 0) / totalContribs) * 1000) / 10 : 0
    }));

    const top1Contribs = enriched[0]?.contributions || 0;
    const top3Contribs = enriched.slice(0, 3).reduce((acc, c) => acc + c.contributions, 0);

    const top1Share = totalContribs > 0 ? Math.round((top1Contribs / totalContribs) * 100) : 0;
    const top3Share = totalContribs > 0 ? Math.round((top3Contribs / totalContribs) * 100) : 0;

    let dependencyRisk = 'Low (Decentralized)';
    let dependencyDescription = 'Well-distributed contributor base with healthy community participation.';
    let riskColor = 'var(--accent-green, #34d399)';

    // Calculate core team size (number of maintainers who account for 80% of commits)
    let cumulative = 0;
    let coreMaintainersCount = 0;
    for (const c of enriched) {
      cumulative += c.contributions;
      coreMaintainersCount++;
      if (cumulative >= totalContribs * 0.8) break;
    }

    if (top1Share >= 65) {
      dependencyRisk = 'High (Single Maintainer)';
      dependencyDescription = `Lead maintainer accounts for ${top1Share}% of commits. High maintainer dependency.`;
      riskColor = 'var(--accent-red, #f87171)';
    } else if (top3Share >= 75) {
      dependencyRisk = 'Moderate (Core Group)';
      dependencyDescription = `Top 3 contributors drive ${top3Share}% of commits. Core group of ${coreMaintainersCount} accounts for 80%.`;
      riskColor = 'var(--accent-amber, #fbbf24)';
    }

    return {
      totalContributions: totalContribs,
      contributorsCount: list.length,
      coreMaintainersCount,
      top1Share,
      top3Share,
      dependencyRisk,
      dependencyDescription,
      riskColor,
      podium: enriched.slice(0, 3),
      ranked: enriched
    };
  }
};
