import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One markdown file per piece, in src/content/writing/.
// Publishing is: add a file, commit, push. draft: true builds locally but never ships.
const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    form: z.enum(['essay', 'note', 'marginalia']),
    date: z.coerce.date(),
    book: z.string().optional(),   // marginalia only: "The Trial — Kafka"
    excerpt: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing };
