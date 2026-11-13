// ============================================
// RepoPulse — Language Colors (GitHub Linguist Palette)
// ============================================

export const LANG_COLORS = {
  // Web & Frontend
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Sass: '#a53b70',
  Less: '#1d365d',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Astro: '#ff5a03',
  MDX: '#fcb32c',

  // Systems & General Purpose
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Rust: '#dea584',
  Go: '#00ADD8',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Scala: '#c22d40',
  Zig: '#ec915c',
  Nim: '#ffc200',
  D: '#ba595e',

  // Functional & Scientific
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Erlang: '#B83998',
  Clojure: '#db5855',
  OCaml: '#ef7a08',
  FSharp: '#b845fc',
  'F#': '#b845fc',
  R: '#198CE7',
  Julia: '#a270ba',
  Mathematica: '#dd1100',
  MATLAB: '#e16737',

  // Scripting & DevOps
  Shell: '#89e051',
  Bash: '#89e051',
  PowerShell: '#012456',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  HCL: '#844fba',
  Nix: '#7e7eff',
  Terraform: '#5c4ee5',
  Jsonnet: '#0064b5',

  // Data, Query & Config
  SQL: '#e38c00',
  PLpgSQL: '#336790',
  GraphQL: '#e10098',
  'Jupyter Notebook': '#DA5B0B',
  Markdown: '#083fa1',
  TeX: '#3D6117',
  LaTeX: '#3D6117',
  YAML: '#cb171e',
  JSON: '#292929',
  TOML: '#9c4221',
  XML: '#0060ac',

  // Embedded, Gaming & Others
  Assembly: '#6E4C13',
  Solidity: '#AA6746',
  GDScript: '#355570',
  Lua: '#000080',
  Perl: '#0298c3',
  Roff: '#ecdebe',
  'Vim Script': '#199f4b',
  EmacsLisp: '#c065db',
  'Emacs Lisp': '#c065db',
  Other: '#8b8b9a'
};

/**
 * Returns color hex for a given language name.
 * Generates deterministic fallback HSL color if not present in the lookup.
 */
export function getLangColor(name) {
  if (!name) return LANG_COLORS.Other;
  if (LANG_COLORS[name]) return LANG_COLORS[name];

  // Stable hashing per language name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return `hsl(${hash}, 65%, 60%)`;
}

/**
 * Formats byte values into human readable string (e.g. 1.4 MB)
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
