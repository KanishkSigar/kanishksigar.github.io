// ============================================
// RepoPulse — Tech Stack & Ecosystem Detector
// ============================================

/**
 * Heuristically detects the tech stack, libraries, build tools, and ecosystems
 * used by a repository based on GitHub topics, language signatures, description, and metadata.
 */

const ECOSYSTEM_RULES = [
  // Frontend Frameworks
  { name: 'React', category: 'Framework', icon: 'atom', match: ['react', 'reactjs', 'react-native'] },
  { name: 'Next.js', category: 'Framework', icon: 'zap', match: ['nextjs', 'next-js', 'next'] },
  { name: 'Vue.js', category: 'Framework', icon: 'layout', match: ['vue', 'vuejs', 'vue3', 'nuxt', 'nuxtjs'] },
  { name: 'Angular', category: 'Framework', icon: 'shield', match: ['angular', 'angularjs'] },
  { name: 'Svelte', category: 'Framework', icon: 'flame', match: ['svelte', 'sveltekit'] },
  { name: 'Astro', category: 'Framework', icon: 'rocket', match: ['astro', 'astrojs'] },
  { name: 'SolidJS', category: 'Framework', icon: 'box', match: ['solidjs', 'solid'] },
  { name: 'Electron', category: 'App Platform', icon: 'monitor', match: ['electron'] },
  { name: 'Tauri', category: 'App Platform', icon: 'cpu', match: ['tauri'] },

  // Styling & UI
  { name: 'Tailwind CSS', category: 'Styling', icon: 'palette', match: ['tailwindcss', 'tailwind', 'tailwind-css'] },
  { name: 'shadcn/ui', category: 'UI Components', icon: 'layers', match: ['shadcn', 'shadcn-ui'] },
  { name: 'Bootstrap', category: 'Styling', icon: 'grid', match: ['bootstrap'] },

  // Backend Frameworks
  { name: 'Node.js', category: 'Runtime', icon: 'server', match: ['nodejs', 'node', 'express', 'nestjs', 'fastify'] },
  { name: 'Express', category: 'Backend', icon: 'server', match: ['express', 'expressjs'] },
  { name: 'NestJS', category: 'Backend', icon: 'box', match: ['nestjs'] },
  { name: 'FastAPI', category: 'Backend', icon: 'zap', match: ['fastapi'] },
  { name: 'Django', category: 'Backend', icon: 'server', match: ['django'] },
  { name: 'Flask', category: 'Backend', icon: 'server', match: ['flask'] },
  { name: 'Spring Boot', category: 'Backend', icon: 'leaf', match: ['spring', 'spring-boot', 'springboot'] },
  { name: 'Gin', category: 'Backend', icon: 'server', match: ['gin', 'gin-gonic'] },
  { name: 'Actix / Axum', category: 'Backend', icon: 'cpu', match: ['actix', 'axum', 'actix-web'] },
  { name: 'Ruby on Rails', category: 'Backend', icon: 'train', match: ['rails', 'ruby-on-rails'] },

  // Tooling & Build
  { name: 'Vite', category: 'Build Tool', icon: 'zap', match: ['vite', 'vitejs'] },
  { name: 'Webpack', category: 'Build Tool', icon: 'package', match: ['webpack'] },
  { name: 'Turborepo', category: 'Monorepo', icon: 'layers', match: ['turborepo', 'turbo'] },
  { name: 'Cargo', category: 'Package Manager', icon: 'box', match: ['cargo', 'crates'] },
  { name: 'Bun', category: 'Runtime', icon: 'coffee', match: ['bun', 'bunjs'] },
  { name: 'Deno', category: 'Runtime', icon: 'shield', match: ['deno', 'denojs'] },
  { name: 'pnpm', category: 'Package Manager', icon: 'package', match: ['pnpm'] },

  // DevOps & Cloud
  { name: 'Docker', category: 'DevOps', icon: 'container', match: ['docker', 'dockerfile', 'containers'] },
  { name: 'Kubernetes', category: 'DevOps', icon: 'cloud', match: ['kubernetes', 'k8s'] },
  { name: 'GitHub Actions', category: 'CI/CD', icon: 'git-merge', match: ['github-actions', 'ci-cd', 'workflows'] },
  { name: 'Terraform', category: 'IaC', icon: 'cpu', match: ['terraform'] },
  { name: 'Cloudflare', category: 'Edge', icon: 'cloud', match: ['cloudflare', 'cloudflare-workers', 'workers'] },

  // Testing
  { name: 'Jest', category: 'Testing', icon: 'check-circle-2', match: ['jest'] },
  { name: 'Vitest', category: 'Testing', icon: 'check-circle-2', match: ['vitest'] },
  { name: 'Playwright', category: 'Testing', icon: 'play-circle', match: ['playwright'] },
  { name: 'pytest', category: 'Testing', icon: 'check-circle-2', match: ['pytest'] },

  // AI & Data
  { name: 'PyTorch', category: 'AI / ML', icon: 'cpu', match: ['pytorch', 'torch'] },
  { name: 'TensorFlow', category: 'AI / ML', icon: 'cpu', match: ['tensorflow', 'keras'] },
  { name: 'LangChain', category: 'AI / LLM', icon: 'bot', match: ['langchain'] },
  { name: 'PostgreSQL', category: 'Database', icon: 'database', match: ['postgres', 'postgresql'] },
  { name: 'Redis', category: 'Database', icon: 'database', match: ['redis'] },
  { name: 'GraphQL', category: 'API', icon: 'share-2', match: ['graphql', 'apollo'] }
];

export function detectTechStack(repo, languages = {}) {
  const detected = [];
  const seen = new Set();

  const topics = Array.isArray(repo?.topics) ? repo.topics.map(t => t.toLowerCase()) : [];
  const textCorpus = `${repo?.name || ''} ${repo?.description || ''} ${topics.join(' ')}`.toLowerCase();
  const langKeys = Object.keys(languages || {}).map(l => l.toLowerCase());

  // Check language-based baseline tech
  if (langKeys.includes('typescript')) {
    detected.push({ name: 'TypeScript', category: 'Language', icon: 'code-2' });
    seen.add('typescript');
  } else if (langKeys.includes('javascript')) {
    detected.push({ name: 'JavaScript', category: 'Language', icon: 'code-2' });
    seen.add('javascript');
  }

  if (langKeys.includes('python')) {
    detected.push({ name: 'Python', category: 'Language', icon: 'code-2' });
    seen.add('python');
  }
  if (langKeys.includes('rust')) {
    detected.push({ name: 'Rust', category: 'Language', icon: 'cpu' });
    seen.add('rust');
  }
  if (langKeys.includes('go')) {
    detected.push({ name: 'Go', category: 'Language', icon: 'box' });
    seen.add('go');
  }
  if (langKeys.includes('c++') || langKeys.includes('c')) {
    detected.push({ name: 'C / C++', category: 'Language', icon: 'cpu' });
    seen.add('c/c++');
  }

  // Check ecosystem rules against topics and description
  for (const rule of ECOSYSTEM_RULES) {
    if (seen.has(rule.name.toLowerCase())) continue;

    const matched = rule.match.some(keyword => {
      // Check in topics array directly
      if (topics.includes(keyword)) return true;
      // Check in regex whole-word search in description / title
      const regex = new RegExp(`\\b${keyword.replace('-', '[- ]?')}\\b`, 'i');
      return regex.test(textCorpus);
    });

    if (matched) {
      detected.push({
        name: rule.name,
        category: rule.category,
        icon: rule.icon
      });
      seen.add(rule.name.toLowerCase());
    }
  }

  return detected;
}

