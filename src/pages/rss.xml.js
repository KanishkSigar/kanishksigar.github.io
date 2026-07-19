import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const pieces = (await getCollection('writing', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Kanishk Sigar',
    description: 'Notes, essays, and marginalia.',
    site: context.site,
    items: pieces.map((p) => ({
      title: p.data.title,
      description: p.data.excerpt ?? '',
      pubDate: p.data.date,
      link: `/life/writing/${p.id}`,
    })),
  });
}
