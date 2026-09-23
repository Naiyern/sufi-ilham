import booksRaw from './books.json';

export type Book = {
  slug: string;
  title: string;
  sub?: string;
  kicker?: string;
  quote?: string;
  desc?: string;
  img: string;
  spec?: string[];
  us?: string;
  in?: string;
  uk?: string;
  ca?: string;
  au?: string;
  paperback?: string;
  seriesUrl?: string;
  comingSoon?: boolean;
  series?: 'maple' | 'tithe' | 'carto' | 'song';
  order?: number;
  genre?: string;
  ku?: boolean;
  pages?: number | null;
};

export const books = booksRaw as Book[];

export const bookBySlug = (slug: string) => books.find((b) => b.slug === slug);

export const seriesBooks = (id: Book['series']) =>
  books.filter((b) => b.series === id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const standalone = books.filter((b) => !b.series);

export type Series = {
  id: NonNullable<Book['series']>;
  name: string;
  tagline: string;
  lede: string;
  accent: string;
  note: string;
};

export const series: Series[] = [
  {
    id: 'maple',
    name: 'The Maple Falls Romance Series',
    tagline: 'Five love stories. One town that never lets go.',
    lede:
      'Welcome to Maple Falls, Vermont — a small town at the end of a maple-lined street, where the bookshop keeps its lights on, the bakery keeps its ovens warm, and every love story gets the happily-ever-after it deserves.',
    accent: '#c9713f',
    note:
      'Grumpy sunshine. Enemies to lovers. Second chances. Snowdrifts. Fireworks. One town where everyone gets their ending — and all five books are free to read on Kindle Unlimited.',
  },
  {
    id: 'tithe',
    name: 'The Tithe Crown Trilogy',
    tagline: 'Three books. One Crown that never lets go.',
    lede:
      'A completed adult gothic dark romantasy trilogy. The Crown cuts magic out of a soul that will not declare it — and sends its collectors to hunt down every shadow that hides.',
    accent: '#8d6bd6',
    note:
      'Enemies to lovers. Forced proximity. A morally grey collector who falls first. Obsessive devotion. A slow burn that turns open-door only after it costs them something — all three books free on Kindle Unlimited.',
  },
  {
    id: 'carto',
    name: 'The Cartographers of Lost Tomorrows',
    tagline: 'Seven books. One harbor.',
    lede:
      'A slow-burn romance and impossible mystery in a fog-bound harbor city that files its secrets under water. Chart-restorer Cassia Merel finds a map that predicts her own death — and the name of Elias Rooke, a man officially dead for twenty-seven years.',
    accent: '#3f9fc9',
    note:
      'Impossible cartography. Debts that outlive their debtors. A guild that trades in tomorrows. Books 1–3 are available now and free on Kindle Unlimited — Books 4–7 are coming soon.',
  },
  {
    id: 'song',
    name: 'The Song of the Unbroken Sky',
    tagline: 'Three books. One unbroken song.',
    lede:
      'A luminous mythic romance of Valen and Elora — devotion, destiny, and the melody that awakens the living earth. From the pastoral valley of Sunspire to the wall-less citadel of Aethelgard and the fate of thirty nations on the Plain of Sundered Vows.',
    accent: '#d8b45e',
    note:
      'No grim darkness — light, music, philosophy and a love that proves the mind cannot contain the infinite. All three books are complete and free to read on Kindle Unlimited.',
  },
];

export const site = {
  name: 'Sufi Ilham',
  altName: 'MD Naiyer Alam',
  url: 'https://naiyern.github.io/sufi-ilham',
  phone: '+91 62017 57330',
  phoneRaw: '916201757330',
  instagram: 'https://instagram.com/Sufiilham07',
  instagram2: 'https://instagram.com/naiyer_fx',
  amazonUS: 'https://www.amazon.com/author/sufibookauthor',
  amazonIN: 'https://www.amazon.in/stores/Sufi-ilham/author/B0DK9YXXMV/allbooks',
  location: 'Bihar, India',
};

export const published = books.filter((b) => !b.comingSoon);

export const stats = [
  { n: published.length, label: 'Published Titles' },
  { n: 5000, suffix: '+', label: 'Pages in Print' },
  { n: published.filter((b) => b.ku).length, label: 'Free on Kindle Unlimited' },
  { n: 5, label: 'Amazon Marketplaces' },
];

export const themes = [
  {
    n: '01',
    name: 'Belief',
    text:
      'The hidden architecture beneath your relationships, career and happiness — and the fact that architecture can be rebuilt.',
  },
  {
    n: '02',
    name: 'Time',
    text:
      'Why the obsession with past and future silently steals a life, and what remains when the clock loses its authority.',
  },
  {
    n: '03',
    name: 'Attention',
    text:
      'A thread one breath long. The whole art is the returning — in meditation, in focus, in ordinary Tuesday afternoons.',
  },
  {
    n: '04',
    name: 'Seeing',
    text:
      'Not doctrine, not self-help. Something older: philosophy with a heartbeat, offered without asking you to believe anything.',
  },
];

export const journey = [
  {
    date: 'Oct 2024',
    title: 'Belief Unveiled',
    text: 'The debut. A journey into the hidden architecture of the mind — and how to rewrite it.',
  },
  {
    date: 'Nov 2024',
    title: 'Fractured Time',
    text: "The most talked-about title. What if time isn't real, but a beautiful lie?",
  },
  {
    date: 'Feb 2025',
    title: 'The Infinite Classroom',
    text: 'Learning from birth to beyond — for those brave enough to keep attending.',
  },
  {
    date: '2026',
    title: 'Twenty-Two New Works',
    text:
      "NeuroFocus Protocol, The Human Operating Manual, Moh Tera Prem, PREM, The River's Portion, the Maple Falls romances, The Tithe Crown trilogy — and now the Cartographers saga, the Song of the Unbroken Sky trilogy and The Spare Key Summer.",
  },
];
