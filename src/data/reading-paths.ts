/** Editorial entry points into the catalogue. Slugs are resolved from the
 * catalogue so titles, covers and links stay in sync as books are updated. */
export const readingPaths = [
  {
    number: '01', eyebrow: 'For the curious mind', title: 'Question everything',
    description: 'Books that look beneath the familiar: consciousness, belief and the way we experience the world.',
    slugs: ['first-person-singular', 'belief-unveiled', 'the-human-operating-manual'],
    accent: 'ochre',
  },
  {
    number: '02', eyebrow: 'For the feeling heart', title: 'Love, in all its forms',
    description: 'From a storm-bound island to a small-town bookshop, find stories about connection and second chances.',
    slugs: ['the-ninth-bell', 'the-bookshop-at-the-end-of-maple-street', 'the-spare-key-summer'],
    accent: 'rose',
  },
  {
    number: '03', eyebrow: 'For another world', title: 'Lose yourself in a story',
    description: 'Step into impossible maps, shadowed crowns and mythic lands where the extraordinary feels close.',
    slugs: ['the-map-of-tomorrow', 'the-shadow-tithe', 'the-eden-of-sunspire'],
    accent: 'blue',
  },
  {
    number: '04', eyebrow: 'For real life', title: 'Find a way forward',
    description: 'Practical, compassionate reading for navigating change, attention and the responsibilities we carry.',
    slugs: ['the-caregiving-launch-plan', 'neurofocus-protocol', 'the-infinite-classroom'],
    accent: 'sage',
  },
] as const;
