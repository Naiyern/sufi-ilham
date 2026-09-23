import rss from '@astrojs/rss';
import { books, site } from '../data/site';

export function GET(context: { site?: URL }) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const origin = (context.site?.origin ?? 'https://naiyern.github.io') + base;
  const dated = books.filter((b) => !b.comingSoon);
  return rss({
    title: 'Sufi Ilham — Books',
    description:
      'New releases from Sufi Ilham (MD Naiyer Alam): philosophy, self-help, literary fiction, romance, mythic romance and dark romantasy.',
    site: origin,
    items: dated.map((b) => ({
      title: b.title,
      description: b.blurb ?? b.sub ?? '',
      link: `${origin}/books/${b.slug}`,
      categories: [b.genre ?? 'Books'],
    })),
    customData: '<language>en</language>',
  });
}
