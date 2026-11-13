// ============================================
// RepoPulse — Repository URL & Specifier Parser
// ============================================

/**
 * Parses user input into a validated GitHub owner and repository name.
 * Accepts full URLs, SSH paths, shorthand formats, or owner/repo pairs.
 * 
 * Supported patterns:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo/tree/branch-name
 * - http://github.com/owner/repo/pull/12
 * - git@github.com:owner/repo.git
 * - github.com/owner/repo
 * - owner/repo
 * 
 * @param {string} input - Raw string from user or query param
 * @returns {{ isValid: boolean, owner?: string, repo?: string, fullName?: string, url?: string, error?: string }}
 */
export function parseRepoInput(input) {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Please enter a GitHub repository URL or owner/repo.' };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Repository input cannot be empty.' };
  }

  let owner = '';
  let repo = '';

  // 1. Handle SSH format: git@github.com:owner/repo.git
  const sshMatch = trimmed.match(/^git@github\.com:([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(\.git)?$/i);
  if (sshMatch) {
    owner = sshMatch[1];
    repo = sshMatch[2];
  }

  // 2. Handle HTTP / HTTPS URL format
  if (!owner) {
    try {
      const urlCandidate = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : (trimmed.startsWith('github.com/') ? `https://${trimmed}` : null);

      if (urlCandidate) {
        const parsedUrl = new URL(urlCandidate);
        const host = parsedUrl.hostname.toLowerCase();
        if (host !== 'github.com' && host !== 'www.github.com') {
          return { isValid: false, error: 'Only GitHub repositories (github.com) are currently supported.' };
        }

        const segments = parsedUrl.pathname.split('/').filter(Boolean);
        if (segments.length >= 2) {
          owner = segments[0];
          repo = segments[1].replace(/\.git$/i, '');
        }
      }
    } catch (e) {
      // Not a valid URL, proceed to shorthand check
    }
  }

  // 3. Handle shorthand "owner/repo" or "github.com/owner/repo"
  if (!owner) {
    const cleaned = trimmed.replace(/^https?:\/\//i, '').replace(/^github\.com\//i, '').replace(/\.git$/i, '');
    const parts = cleaned.split('/').filter(Boolean);
    if (parts.length >= 2) {
      owner = parts[0];
      repo = parts[1];
    }
  }

  // Final validation of owner and repo names (GitHub naming conventions)
  // Owner: alphanumeric + hyphens (no consecutive hyphens, no start/end with hyphen, max 39 chars)
  // Repo: alphanumeric, hyphens, underscores, dots (max 100 chars)
  const validOwnerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  const validRepoRegex = /^[a-zA-Z0-9_.-]{1,100}$/;

  if (!owner || !repo) {
    return {
      isValid: false,
      error: 'Invalid format. Use "owner/repo" (e.g. facebook/react) or full GitHub URL.'
    };
  }

  if (!validOwnerRegex.test(owner)) {
    return {
      isValid: false,
      error: `Invalid GitHub owner or organization name: "${owner}".`
    };
  }

  if (!validRepoRegex.test(repo)) {
    return {
      isValid: false,
      error: `Invalid GitHub repository name: "${repo}".`
    };
  }

  const fullName = `${owner}/${repo}`;
  return {
    isValid: true,
    owner,
    repo,
    fullName,
    url: `https://github.com/${fullName}`
  };
}
