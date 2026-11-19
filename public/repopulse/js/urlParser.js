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
const POPULAR_ALIASES = {
  react: 'facebook/react',
  'next.js': 'vercel/next.js',
  nextjs: 'vercel/next.js',
  next: 'vercel/next.js',
  vue: 'vuejs/core',
  vuejs: 'vuejs/core',
  svelte: 'sveltejs/svelte',
  angular: 'angular/angular',
  astro: 'withastro/astro',
  linux: 'torvalds/linux',
  uv: 'astral-sh/uv',
  flask: 'pallets/flask',
  django: 'django/django',
  fastapi: 'fastapi/fastapi',
  express: 'expressjs/express',
  tailwind: 'tailwindlabs/tailwindcss',
  tailwindcss: 'tailwindlabs/tailwindcss',
  shadcn: 'shadcn-ui/ui',
  'shadcn/ui': 'shadcn-ui/ui',
  typescript: 'microsoft/TypeScript',
  vscode: 'microsoft/vscode',
  rust: 'rust-lang/rust',
  go: 'golang/go',
  bun: 'oven-sh/bun',
  deno: 'denoland/deno',
  flutter: 'flutter/flutter',
  electron: 'electron/electron',
  supabase: 'supabase/supabase',
  zig: 'ziglang/zig',
  neovim: 'neovim/neovim',
  nvim: 'neovim/neovim',
  pytorch: 'pytorch/pytorch',
  tensorflow: 'tensorflow/tensorflow',
  kubernetes: 'kubernetes/kubernetes',
  k8s: 'kubernetes/kubernetes'
};

export function resolveAlias(term) {
  if (!term || typeof term !== 'string') return null;
  const raw = term.trim().toLowerCase();
  if (POPULAR_ALIASES[raw]) return POPULAR_ALIASES[raw];
  const normalized = raw.replace(/[-_.]/g, '');
  for (const [k, v] of Object.entries(POPULAR_ALIASES)) {
    if (k.replace(/[-_.]/g, '') === normalized) return v;
  }
  return null;
}

export function parseRepoInput(input) {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Please enter a GitHub repository URL or owner/repo.' };
  }

  // Sanitize: strip whitespace, leading @, trailing slashes/hashes/queries
  let trimmed = input.trim().replace(/^@/, '');
  if (!trimmed) {
    return { isValid: false, error: 'Repository input cannot be empty.' };
  }

  // Remove query params and hash fragments from URL inputs
  trimmed = trimmed.split(/[?#]/)[0].replace(/\/+$/, '');

  // Check known popular aliases (e.g. "react" -> "facebook/react")
  const aliasTarget = resolveAlias(trimmed);
  if (aliasTarget) {
    const [aliasOwner, aliasRepo] = aliasTarget.split('/');
    return {
      isValid: true,
      owner: aliasOwner,
      repo: aliasRepo,
      fullName: `${aliasOwner}/${aliasRepo}`,
      url: `https://github.com/${aliasOwner}/${aliasRepo}`
    };
  }

  // Reject other git hosting domains explicitly
  if (/^(https?:\/\/)?(www\.)?(gitlab\.com|bitbucket\.org|gitea\.com)/i.test(trimmed)) {
    return { isValid: false, error: 'Only GitHub repositories (github.com) are currently supported.' };
  }

  let owner = '';
  let repo = '';

  // 1. SSH format: git@github.com:owner/repo.git
  const sshMatch = trimmed.match(/^git@github\.com:([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(\.git)?$/i);
  if (sshMatch) {
    owner = sshMatch[1];
    repo = sshMatch[2];
  }

  // 2. HTTP / HTTPS / github.com URL format
  if (!owner) {
    const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
    if (urlMatch) {
      owner = urlMatch[1];
      repo = urlMatch[2].replace(/\.git$/i, '');
    }
  }

  // 3. Shorthand "owner/repo"
  if (!owner) {
    const shortMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?(?:\/.*)?$/);
    if (shortMatch) {
      owner = shortMatch[1];
      repo = shortMatch[2];
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

/**
 * Concise throwing helper for functional pipelines
 */
export function parseRepo(input) {
  const res = parseRepoInput(input);
  if (!res.isValid) {
    throw new Error(res.error || 'Invalid repository identifier');
  }
  return { owner: res.owner, repo: res.repo, fullName: res.fullName, url: res.url };
}
