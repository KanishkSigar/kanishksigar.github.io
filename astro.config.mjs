import { defineConfig } from 'astro/config';
import remarkBreaks from 'remark-breaks';

export default defineConfig({
  site: 'https://kanishksigar.me',
  markdown: {
    // Notes and marginalia are written line-by-line like verse; keep the breaks.
    remarkPlugins: [remarkBreaks],
  },
});
