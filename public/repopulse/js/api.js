// ============================================
// RepoPulse — GitHub REST & GraphQL API Client
// ============================================

import { Cache } from './cache.js';

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
   * Retrieves user-configured Personal Access Token
   */
  getToken() {
    return localStorage.getItem('repopulse_pat') || localStorage.getItem('gitpulse_pat') || '';
  },

  /**
   * Sets request headers with token if available
   */
  getHeaders() {
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    const pat = this.getToken();
    if (pat) {
      headers['Authorization'] = `token ${pat.trim()}`;
    }
    return headers;
  },

  /**
   * Parses rate limit headers from response
   */
  updateRateLimits(response) {
    if (!response || !response.headers) return;
    const limit = response.headers.get('x-ratelimit-limit');
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (limit !== null) this.rateLimit.limit = parseInt(limit, 10);
    if (remaining !== null) this.rateLimit.remaining = parseInt(remaining, 10);
    if (reset !== null) this.rateLimit.resetTime = new Date(parseInt(reset, 10) * 1000);
  },

  /**
   * Core REST fetch with caching and rate limit error handling
   */
  async fetchRest(endpoint, params = {}, ttl = Cache.DEFAULT_TTL) {
    const cacheKey = Cache.getKey(endpoint, params);
    const cached = Cache.get(cacheKey);
    if (cached) return cached;

    const qs = new URLSearchParams(params).toString();
    const ghPath = endpoint + (qs ? `?${qs}` : '');
    const url = `${this.REST_BASE}${ghPath}`;

    const response = await fetch(url, { headers: this.getHeaders() });
    this.updateRateLimits(response);

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        if (response.headers.get('x-ratelimit-remaining') === '0') {
          const resetMinutes = this.rateLimit.resetTime 
            ? Math.max(1, Math.round((this.rateLimit.resetTime - Date.now()) / 60000))
            : 'a few';
          throw new Error(`GitHub API rate limit reached. Resets in ~${resetMinutes} min. Add a Personal Access Token in the top-right to get 5,000 requests/hour.`);
        }
        throw new Error('Access forbidden by GitHub API. You may need to authenticate with a Personal Access Token.');
      }
      if (response.status === 404) {
        throw new Error(`Repository not found. Please check the owner/repo name and make sure the repository is public.`);
      }
      if (response.status === 401) {
        throw new Error('Invalid GitHub token. Please check or clear your Personal Access Token in the top-right.');
      }
      throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
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
   * Handles GitHub 202 Accepted calculation responses with retries and fallbacks.
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<Array<{days: number[], total: number, week: number}>>}
   */
  async getCommitActivity(owner, repo) {
    const cacheKey = Cache.getKey(`/repos/${owner}/${repo}/stats/commit_activity`);
    const cached = Cache.get(cacheKey);
    if (cached) return cached;

    const endpoint = `/repos/${owner}/${repo}/stats/commit_activity`;
    const url = `${this.REST_BASE}${endpoint}`;

    // Retry loop for GitHub 202 async stats generation
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, { headers: this.getHeaders() });
        this.updateRateLimits(response);

        if (response.status === 200) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            Cache.set(cacheKey, data, Cache.TTL.STATS);
            return data;
          }
        } else if (response.status === 202) {
          // GitHub is calculating stats, wait and retry
          await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        } else if (response.status === 403 || response.status === 429) {
          break; // Rate limit reached, fallback
        }
      } catch (err) {
        break;
      }
    }

    // Fallback: If commit_activity is still unavailable or computing, try participation stats
    try {
      const part = await this.getParticipationStats(owner, repo);
      if (part && Array.isArray(part.all) && part.all.length > 0) {
        const now = Math.floor(Date.now() / 1000);
        const reconstructed = part.all.map((count, index) => {
          const weekTimestamp = now - ((51 - index) * 7 * 86400);
          return {
            week: weekTimestamp,
            total: count,
            days: [0, 0, Math.floor(count * 0.4), Math.floor(count * 0.3), Math.floor(count * 0.3), 0, 0]
          };
        });
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
