import rss from '@astrojs/rss';
import { byNewest, newReleases } from '../data/site';

export function GET(context: { site?: URL }) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const origin = (context.site?.origin ?? 'https://naiyern.github.io') + base;
  return rss({
    title: 'Sufi Ilham — Books',
    description: `New releases from Sufi Ilham (MD Naiyer Alam). Latest: ${newReleases.map((b) => b.title).join(' · ')}.`,
    site: origin,
    items: byNewest.map((b) => ({
      title: b.title,
      description: b.blurb ?? b.sub ?? '',
      link: `${origin}/books/${b.slug}`,
      pubDate: b.published && b.published.length > 7 ? new Date(`${b.published}T12:00:00Z`) : undefined,
      categories: [b.genre ?? 'Books'],
    })),
    customData: '<language>en</language>',
  });
}
