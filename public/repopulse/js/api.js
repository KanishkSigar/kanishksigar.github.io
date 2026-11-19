// ============================================
// RepoPulse — GitHub REST & GraphQL API Client
// ============================================

import { Cache } from './cache.js';

function formatApiError(response, rateLimit) {
  const status = response.status;
  if (status === 403 || status === 429) {
    if (response.headers?.get('x-ratelimit-remaining') === '0' || rateLimit?.remaining === 0) {
      const resetMin = rateLimit?.resetTime ? Math.max(1, Math.round((rateLimit.resetTime - Date.now()) / 60000)) : 60;
      return new Error(`GitHub API rate limit reached. Resets in ~${resetMin}m. Add an API token to lift limits.`);
    }
    return new Error('Access forbidden by GitHub. A Personal Access Token may be required.');
  }
  if (status === 404) return new Error('Repository not found. Check owner/repo name and ensure it is public.');
  if (status === 401) return new Error('Invalid GitHub token. Please verify or clear your token.');
  return new Error(`GitHub API error (${status}): ${response.statusText || 'Request failed'}`);
}

export const API = {
  REST_BASE: 'https://api.github.com',
  GRAPHQL_BASE: 'https://api.github.com/graphql',

  // Current rate limit status tracked from response headers
  rateLimit: {
    limit: 60,
    remaining: 60,
    resetTime: null
  },

  /**
   * Retrieves user-configured Personal Access Token safely
   */
  getToken() {
    try {
      return typeof localStorage !== 'undefined' ? (localStorage.getItem('repopulse_pat') || '') : '';
    } catch (e) {
      return '';
    }
  },

  /**
   * Generates standard GitHub API headers with optional authorization
   */
  getHeaders(customHeaders = {}) {
    const pat = this.getToken()?.trim();
    return {
      'Accept': 'application/vnd.github.v3+json',
      ...(pat ? { 'Authorization': `Bearer ${pat}` } : {}),
      ...customHeaders
    };
  },

  /**
   * Parses rate limit headers from response
   */
  updateRateLimits(response) {
    if (!response?.headers) return;
    const limit = response.headers.get('x-ratelimit-limit');
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (limit) this.rateLimit.limit = Number(limit);
    if (remaining) this.rateLimit.remaining = Number(remaining);
    if (reset) this.rateLimit.resetTime = new Date(Number(reset) * 1000);
  },

  /**
   * Checks whether the current client is rate limited
   */
  isRateLimited() {
    return this.rateLimit.remaining === 0 && Boolean(this.rateLimit.resetTime && this.rateLimit.resetTime > new Date());
  },

  /**
   * Core REST fetch with caching, backoff retries, and rate limit error handling
   */
  async fetchRest(endpoint, params = {}, ttl = Cache.DEFAULT_TTL, retries = 2) {
    const cacheKey = Cache.getKey(endpoint, params);
    const cached = Cache.get(cacheKey);
    if (cached) return cached;

    const qs = new URLSearchParams(params).toString();
    const ghPath = endpoint + (qs ? `?${qs}` : '');
    const url = `${this.REST_BASE}${ghPath}`;

    let response;
    try {
      response = await fetch(url, { headers: this.getHeaders() });
    } catch (networkErr) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 600));
        return this.fetchRest(endpoint, params, ttl, retries - 1);
      }
      throw new Error('Network error connecting to GitHub. Please check your internet connection.');
    }

    this.updateRateLimits(response);

    // GitHub 202 Accepted: asynchronous calculation in progress
    if (response.status === 202 && retries > 0) {
      await new Promise(r => setTimeout(r, 800 * (3 - retries)));
      return this.fetchRest(endpoint, params, ttl, retries - 1);
    }

    if (!response.ok) {
      throw formatApiError(response, this.rateLimit);
    }

    const data = await response.json();
    Cache.set(cacheKey, data, ttl);
    return data;
  },

  /**
   * Fetches GitHub API rate limit state
   */
  async getRateLimit() {
    try {
      const data = await this.fetchRest('/rate_limit', {}, 30 * 1000);
      if (data && data.resources && data.resources.core) {
        this.rateLimit.limit = data.resources.core.limit;
        this.rateLimit.remaining = data.resources.core.remaining;
        this.rateLimit.resetTime = new Date(data.resources.core.reset * 1000);
      }
      return this.rateLimit;
    } catch (e) {
      return this.rateLimit;
    }
  },

  /**
   * Fetches main repository metadata
   * @param {string} owner
   * @param {string} repo
   */
  async getRepo(owner, repo) {
    return this.fetchRest(`/repos/${owner}/${repo}`, {}, Cache.TTL.META);
  },

  /**
   * Fetches language byte breakdown for the repository
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<Record<string, number>>} e.g. { "TypeScript": 1823900, "CSS": 42000 }
   */
  async getLanguages(owner, repo) {
    return this.fetchRest(`/repos/${owner}/${repo}/languages`, {}, Cache.TTL.LANGUAGES);
  },

  /**
   * Fetches the last year of commit activity grouped by week (52 weeks).
   * Handles 202 async stats with automatic participation fallback.
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<Array<{days: number[], total: number, week: number}>>}
   */
  async getCommitActivity(owner, repo) {
    const cacheKey = Cache.getKey(`/repos/${owner}/${repo}/stats/commit_activity`);
    const cached = Cache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.fetchRest(`/repos/${owner}/${repo}/stats/commit_activity`, {}, Cache.TTL.STATS, 2);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {
      // Fallback below
    }

    // Fallback: participation stats
    try {
      const part = await this.getParticipationStats(owner, repo);
      if (Array.isArray(part?.all) && part.all.length > 0) {
        const now = Math.floor(Date.now() / 1000);
        const reconstructed = part.all.map((count, index) => ({
          week: now - ((51 - index) * 7 * 86400),
          total: count,
          days: [0, 0, Math.floor(count * 0.4), Math.floor(count * 0.3), Math.floor(count * 0.3), 0, 0]
        }));
        Cache.set(cacheKey, reconstructed, Cache.TTL.STATS);
        return reconstructed;
      }
    } catch (e) {}

    return [];
  },

  /**
   * Fetches weekly commit counts for the last 52 weeks (all vs maintainers)
   */
  async getParticipationStats(owner, repo) {
    return this.fetchRest(`/repos/${owner}/${repo}/stats/participation`, {}, Cache.TTL.STATS);
  },

  /**
   * Fetches recent commits (last 50-100 commits) for cadence and message analysis
   */
  async getRecentCommits(owner, repo, count = 100) {
    return this.fetchRest(`/repos/${owner}/${repo}/commits`, { per_page: count }, Cache.TTL.STATS);
  },

  /**
   * Fetches commit punch card data [day, hour, commits] for weekly hourly distribution
   */
  async getPunchCard(owner, repo) {
    try {
      return await this.fetchRest(`/repos/${owner}/${repo}/stats/punch_card`, {}, Cache.TTL.STATS);
    } catch (e) {
      return [];
    }
  },

  /**
   * Fetches top contributors for the repository
   * @param {string} owner
   * @param {string} repo
   * @param {number} count Number of contributors to fetch (default 30)
   * @returns {Promise<Array<{login: string, avatar_url: string, html_url: string, contributions: number, type: string}>>}
   */
  async getContributors(owner, repo, count = 30) {
    try {
      const data = await this.fetchRest(`/repos/${owner}/${repo}/contributors`, { per_page: count }, Cache.TTL.CONTRIBUTORS);
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (e) {
      console.warn('Could not fetch contributors list:', e);
      return [];
    }
  },

  /**
   * Fetches the latest published release or fallback tag
   */
  async getLatestRelease(owner, repo) {
    try {
      return await this.fetchRest(`/repos/${owner}/${repo}/releases/latest`, {}, Cache.TTL.RELEASES);
    } catch (e) {
      // If 404 (no official releases), try tags
      try {
        const tags = await this.fetchRest(`/repos/${owner}/${repo}/tags`, { per_page: 1 }, Cache.TTL.RELEASES);
        if (Array.isArray(tags) && tags.length > 0) {
          return {
            tag_name: tags[0].name,
            name: tags[0].name,
            published_at: null,
            html_url: `https://github.com/${owner}/${repo}/releases/tag/${tags[0].name}`,
            is_tag_only: true
          };
        }
      } catch (err) {}
      return null;
    }
  },

  /**
   * Fetches community profile (health score, documentation files presence)
   */
  async getCommunityProfile(owner, repo) {
    try {
      return await this.fetchRest(`/repos/${owner}/${repo}/community/profile`, {}, Cache.TTL.COMMUNITY);
    } catch (e) {
      return null;
    }
  }
};
