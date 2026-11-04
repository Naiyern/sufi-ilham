/* The reading room's wall: lines that the archive keeps beside it.

   Every entry carries the work it comes from, and where the English is a
   translation, the translator and year. All of them are public-domain texts —
   the King James Bible, sixteenth- to nineteenth-century English poetry, and
   nineteenth-century translations of Greek, Roman, Persian, Arabic, Indian and
   Chinese classics — so a line can be traced back to a page rather than to a
   quotation website.

   Nothing here is invented, reworded into a modern idiom, or attributed to a
   convenient name. If a line could not be sourced, it is not in the file. That
   is why the collection is the size it is: adding to it means adding sources,
   not sentences.

   The rotation lives in src/scripts/quotes.ts; this module is the data. */

export type Quote = {
  /** The line itself, without quotation marks — the interface sets those. */
  text: string;
  author: string;
  /** Work and, for translations, translator and year. */
  source: string;
};

const q = (text: string, author: string, source: string): Quote => ({ text, author, source });

const BORROWED: Quote[] = [
  /* ---------- William Shakespeare, Sonnets (1609) ---------- */
  q('Shall I compare thee to a summer’s day? Thou art more lovely and more temperate.', 'William Shakespeare', 'Sonnet 18'),
  q('So long as men can breathe or eyes can see, so long lives this, and this gives life to thee.', 'William Shakespeare', 'Sonnet 18'),
  q('When, in disgrace with fortune and men’s eyes, I all alone beweep my outcast state.', 'William Shakespeare', 'Sonnet 29'),
  q('For thy sweet love remembered such wealth brings that then I scorn to change my state with kings.', 'William Shakespeare', 'Sonnet 29'),
  q('When to the sessions of sweet silent thought I summon up remembrance of things past.', 'William Shakespeare', 'Sonnet 30'),
  q('That time of year thou mayst in me behold when yellow leaves, or none, or few, do hang.', 'William Shakespeare', 'Sonnet 73'),
  q('This thou perceiv’st, which makes thy love more strong, to love that well which thou must leave ere long.', 'William Shakespeare', 'Sonnet 73'),
  q('Tired with all these, for restful death I cry.', 'William Shakespeare', 'Sonnet 66'),
  q('No longer mourn for me when I am dead than you shall hear the surly sullen bell.', 'William Shakespeare', 'Sonnet 71'),
  q('Let me not to the marriage of true minds admit impediments. Love is not love which alters when it alteration finds.', 'William Shakespeare', 'Sonnet 116'),
  q('Love’s not Time’s fool, though rosy lips and cheeks within his bending sickle’s compass come.', 'William Shakespeare', 'Sonnet 116'),
  q('If this be error and upon me proved, I never writ, nor no man ever loved.', 'William Shakespeare', 'Sonnet 116'),
  q('My mistress’ eyes are nothing like the sun.', 'William Shakespeare', 'Sonnet 130'),
  q('When my love swears that she is made of truth I do believe her, though I know she lies.', 'William Shakespeare', 'Sonnet 138'),

  /* ---------- Shakespeare, the plays ---------- */
  q('All the world’s a stage, and all the men and women merely players.', 'William Shakespeare', 'As You Like It, II.vii'),
  q('And one man in his time plays many parts, his acts being seven ages.', 'William Shakespeare', 'As You Like It, II.vii'),
  q('We are such stuff as dreams are made on, and our little life is rounded with a sleep.', 'William Shakespeare', 'The Tempest, IV.i'),
  q('Full fathom five thy father lies; of his bones are coral made.', 'William Shakespeare', 'The Tempest, I.ii'),
  q('Nothing of him that doth fade but doth suffer a sea-change into something rich and strange.', 'William Shakespeare', 'The Tempest, I.ii'),
  q('To be, or not to be, that is the question.', 'William Shakespeare', 'Hamlet, III.i'),
  q('There are more things in heaven and earth, Horatio, than are dreamt of in your philosophy.', 'William Shakespeare', 'Hamlet, I.v'),
  q('This above all: to thine own self be true.', 'William Shakespeare', 'Hamlet, I.iii'),
  q('Neither a borrower nor a lender be.', 'William Shakespeare', 'Hamlet, I.iii'),
  q('Brevity is the soul of wit.', 'William Shakespeare', 'Hamlet, II.ii'),
  q('Though this be madness, yet there is method in’t.', 'William Shakespeare', 'Hamlet, II.ii'),
  q('The readiness is all.', 'William Shakespeare', 'Hamlet, V.ii'),
  q('Good night, sweet prince, and flights of angels sing thee to thy rest.', 'William Shakespeare', 'Hamlet, V.ii'),
  q('The rest is silence.', 'William Shakespeare', 'Hamlet, V.ii'),
  q('There is nothing either good or bad, but thinking makes it so.', 'William Shakespeare', 'Hamlet, II.ii'),
  q('What a piece of work is a man!', 'William Shakespeare', 'Hamlet, II.ii'),
  q('When sorrows come, they come not single spies, but in battalions.', 'William Shakespeare', 'Hamlet, IV.v'),
  q('Tomorrow, and tomorrow, and tomorrow, creeps in this petty pace from day to day.', 'William Shakespeare', 'Macbeth, V.v'),
  q('Out, out, brief candle! Life’s but a walking shadow.', 'William Shakespeare', 'Macbeth, V.v'),
  q('It is a tale told by an idiot, full of sound and fury, signifying nothing.', 'William Shakespeare', 'Macbeth, V.v'),
  q('Methought I heard a voice cry “Sleep no more! Macbeth does murder sleep.”', 'William Shakespeare', 'Macbeth, II.ii'),
  q('When shall we three meet again, in thunder, lightning, or in rain?', 'William Shakespeare', 'Macbeth, I.i'),
  q('Fair is foul, and foul is fair.', 'William Shakespeare', 'Macbeth, I.i'),
  q('Give sorrow words; the grief that does not speak whispers the o’er-fraught heart and bids it break.', 'William Shakespeare', 'Macbeth, IV.iii'),
  q('Nothing in his life became him like the leaving it.', 'William Shakespeare', 'Macbeth, I.iv'),
  q('Nothing will come of nothing.', 'William Shakespeare', 'King Lear, I.i'),
  q('As flies to wanton boys are we to th’ gods; they kill us for their sport.', 'William Shakespeare', 'King Lear, IV.i'),
  q('Men must endure their going hence, even as their coming hither: ripeness is all.', 'William Shakespeare', 'King Lear, V.ii'),
  q('How sharper than a serpent’s tooth it is to have a thankless child.', 'William Shakespeare', 'King Lear, I.iv'),
  q('The quality of mercy is not strained; it droppeth as the gentle rain from heaven.', 'William Shakespeare', 'The Merchant of Venice, IV.i'),
  q('If you prick us, do we not bleed?', 'William Shakespeare', 'The Merchant of Venice, III.i'),
  q('All that glisters is not gold.', 'William Shakespeare', 'The Merchant of Venice, II.vii'),
  q('But love is blind, and lovers cannot see the pretty follies that themselves commit.', 'William Shakespeare', 'The Merchant of Venice, II.vi'),
  q('Friends, Romans, countrymen, lend me your ears; I come to bury Caesar, not to praise him.', 'William Shakespeare', 'Julius Caesar, III.ii'),
  q('The evil that men do lives after them; the good is oft interrèd with their bones.', 'William Shakespeare', 'Julius Caesar, III.ii'),
  q('There is a tide in the affairs of men which, taken at the flood, leads on to fortune.', 'William Shakespeare', 'Julius Caesar, IV.iii'),
  q('Cowards die many times before their deaths; the valiant never taste of death but once.', 'William Shakespeare', 'Julius Caesar, II.ii'),
  q('The fault, dear Brutus, is not in our stars, but in ourselves, that we are underlings.', 'William Shakespeare', 'Julius Caesar, I.ii'),
  q('Et tu, Brute? Then fall, Caesar.', 'William Shakespeare', 'Julius Caesar, III.i'),
  q('Now is the winter of our discontent made glorious summer by this sun of York.', 'William Shakespeare', 'Richard III, I.i'),
  q('A horse! a horse! my kingdom for a horse!', 'William Shakespeare', 'Richard III, V.iv'),
  q('Once more unto the breach, dear friends, once more.', 'William Shakespeare', 'Henry V, III.i'),
  q('We few, we happy few, we band of brothers.', 'William Shakespeare', 'Henry V, IV.iii'),
  q('If music be the food of love, play on.', 'William Shakespeare', 'Twelfth Night, I.i'),
  q('Some are born great, some achieve greatness, and some have greatness thrust upon ’em.', 'William Shakespeare', 'Twelfth Night, II.v'),
  q('Better a witty fool than a foolish wit.', 'William Shakespeare', 'Twelfth Night, I.v'),
  q('Be not afraid of greatness.', 'William Shakespeare', 'Twelfth Night, II.v'),
  q('Love sought is good, but given unsought is better.', 'William Shakespeare', 'Twelfth Night, III.i'),
  q('The course of true love never did run smooth.', 'William Shakespeare', 'A Midsummer Night’s Dream, I.i'),
  q('Love looks not with the eyes, but with the mind.', 'William Shakespeare', 'A Midsummer Night’s Dream, I.i'),
  q('O, I am fortune’s fool!', 'William Shakespeare', 'Romeo and Juliet, III.i'),
  q('These violent delights have violent ends.', 'William Shakespeare', 'Romeo and Juliet, II.vi'),
  q('A plague o’ both your houses!', 'William Shakespeare', 'Romeo and Juliet, III.i'),
  q('Parting is such sweet sorrow.', 'William Shakespeare', 'Romeo and Juliet, II.ii'),
  q('What’s in a name? That which we call a rose by any other name would smell as sweet.', 'William Shakespeare', 'Romeo and Juliet, II.ii'),
  q('Age cannot wither her, nor custom stale her infinite variety.', 'William Shakespeare', 'Antony and Cleopatra, II.ii'),
  q('The barge she sat in, like a burnished throne, burned on the water.', 'William Shakespeare', 'Antony and Cleopatra, II.ii'),
  q('Our doubts are traitors, and make us lose the good we oft might win, by fearing to attempt.', 'William Shakespeare', 'Measure for Measure, I.iv'),
  q('The miserable have no other medicine but only hope.', 'William Shakespeare', 'Measure for Measure, III.i'),

  /* ---------- William Blake ---------- */
  q('To see a World in a Grain of Sand, and a Heaven in a Wild Flower, hold Infinity in the palm of your hand, and Eternity in an hour.', 'William Blake', 'Auguries of Innocence'),
  q('Tyger Tyger, burning bright, in the forests of the night.', 'William Blake', 'Songs of Experience'),
  q('What immortal hand or eye dare frame thy fearful symmetry?', 'William Blake', 'Songs of Experience'),
  q('The road of excess leads to the palace of wisdom.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('If the doors of perception were cleansed every thing would appear to man as it is, Infinite.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('Eternity is in love with the productions of time.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('He who desires but acts not, breeds pestilence.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('The tygers of wrath are wiser than the horses of instruction.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('Everything that lives is holy.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('Improvement makes strait roads, but the crooked roads without Improvement are roads of Genius.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('In seed time learn, in harvest teach, in winter enjoy.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('The cistern contains: the fountain overflows.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('I must create a system, or be enslav’d by another man’s.', 'William Blake', 'Jerusalem'),
  q('He who binds to himself a joy does the winged life destroy; but he who kisses the joy as it flies lives in eternity’s sun rise.', 'William Blake', 'Eternity'),

  /* ---------- Emily Dickinson (Poems, 1890–1896) ---------- */
  q('Hope is the thing with feathers that perches in the soul.', 'Emily Dickinson', 'Poems, series 1'),
  q('And sweetest in the Gale is heard; and sore must be the storm that could abash the little Bird that kept so many warm.', 'Emily Dickinson', 'Poems, series 1'),
  q('I’m Nobody! Who are you? Are you—Nobody—too?', 'Emily Dickinson', 'Poems, series 2'),
  q('Because I could not stop for Death—he kindly stopped for me.', 'Emily Dickinson', 'Poems, series 2'),
  q('The Brain—is wider than the Sky—', 'Emily Dickinson', 'Poems, series 2'),
  q('Tell all the truth but tell it slant—success in circuit lies.', 'Emily Dickinson', 'Poems, series 2'),
  q('After great pain, a formal feeling comes.', 'Emily Dickinson', 'Poems, series 2'),
  q('Much madness is divinest sense.', 'Emily Dickinson', 'Poems, series 2'),
  q('Forever—is composed of Nows.', 'Emily Dickinson', 'Poems, series 3'),
  q('That it will never come again is what makes life so sweet.', 'Emily Dickinson', 'Poems, series 3'),
  q('If I can stop one heart from breaking, I shall not live in vain.', 'Emily Dickinson', 'Poems, series 3'),
  q('A word is dead when it is said, some say. I say it just begins to live that day.', 'Emily Dickinson', 'Poems, series 3'),
  q('We never know how high we are till we are called to rise.', 'Emily Dickinson', 'Poems, series 3'),
  q('The truth must dazzle gradually or every man be blind.', 'Emily Dickinson', 'Poems, series 2'),
  q('One need not be a chamber to be haunted.', 'Emily Dickinson', 'Poems, series 3'),
  q('I dwell in Possibility—a fairer House than Prose.', 'Emily Dickinson', 'Poems, series 2'),

  /* ---------- Walt Whitman, Leaves of Grass ---------- */
  q('Do I contradict myself? Very well then I contradict myself, I am large, I contain multitudes.', 'Walt Whitman', 'Song of Myself, 51'),
  q('I celebrate myself, and sing myself.', 'Walt Whitman', 'Song of Myself, 1'),
  q('A child said What is the grass? fetching it to me with full hands; how could I answer the child? I do not know what it is any more than he.', 'Walt Whitman', 'Song of Myself, 6'),
  q('All goes onward and outward, nothing collapses, and to die is different from what any one supposed, and luckier.', 'Walt Whitman', 'Song of Myself, 6'),
  q('I loafe and invite my soul; I lean and loafe at my ease observing a spear of summer grass.', 'Walt Whitman', 'Song of Myself, 1'),
  q('I sing the body electric.', 'Walt Whitman', 'I Sing the Body Electric'),
  q('I exist as I am, that is enough.', 'Walt Whitman', 'Song of Myself, 20'),
  q('That the powerful play goes on, and you will contribute a verse.', 'Walt Whitman', 'O Me! O Life!'),
  q('Love the earth and sun and the animals, despise riches, give alms to every one that asks.', 'Walt Whitman', 'Preface to Leaves of Grass (1855)'),
  q('Re-examine all you have been told at school or church or in any book, dismiss whatever insults your own soul.', 'Walt Whitman', 'Preface to Leaves of Grass (1855)'),

  /* ---------- John Keats ---------- */
  q('Beauty is truth, truth beauty,—that is all ye know on earth, and all ye need to know.', 'John Keats', 'Ode on a Grecian Urn'),
  q('Heard melodies are sweet, but those unheard are sweeter.', 'John Keats', 'Ode on a Grecian Urn'),
  q('Season of mists and mellow fruitfulness.', 'John Keats', 'To Autumn'),
  q('The poetry of earth is never dead.', 'John Keats', 'On the Grasshopper and Cricket'),
  q('A thing of beauty is a joy for ever.', 'John Keats', 'Endymion'),
  q('Now more than ever seems it rich to die, to cease upon the midnight with no pain.', 'John Keats', 'Ode to a Nightingale'),
  q('Thou wast not born for death, immortal Bird!', 'John Keats', 'Ode to a Nightingale'),
  q('Was it a vision, or a waking dream? Fled is that music:—do I wake or sleep?', 'John Keats', 'Ode to a Nightingale'),

  /* ---------- William Wordsworth ---------- */
  q('The Child is father of the Man.', 'William Wordsworth', 'My Heart Leaps Up'),
  q('The world is too much with us; late and soon, getting and spending, we lay waste our powers.', 'William Wordsworth', 'The World Is Too Much With Us'),
  q('I wandered lonely as a cloud that floats on high o’er vales and hills.', 'William Wordsworth', 'Daffodils'),
  q('For oft, when on my couch I lie in vacant or in pensive mood, they flash upon that inward eye which is the bliss of solitude.', 'William Wordsworth', 'Daffodils'),
  q('That best portion of a good man’s life: his little, nameless, unremembered acts of kindness and of love.', 'William Wordsworth', 'Lines Composed a Few Miles above Tintern Abbey'),
  q('A presence that disturbs me with the joy of elevated thoughts.', 'William Wordsworth', 'Lines Composed a Few Miles above Tintern Abbey'),

  /* ---------- Samuel Taylor Coleridge ---------- */
  q('Water, water, every where, nor any drop to drink.', 'Samuel Taylor Coleridge', 'The Rime of the Ancient Mariner'),
  q('Alone, alone, all, all alone, alone on a wide wide sea!', 'Samuel Taylor Coleridge', 'The Rime of the Ancient Mariner'),
  q('He prayeth best, who loveth best all things both great and small.', 'Samuel Taylor Coleridge', 'The Rime of the Ancient Mariner'),

  /* ---------- Percy Bysshe Shelley ---------- */
  q('Look on my works, ye Mighty, and despair!', 'Percy Bysshe Shelley', 'Ozymandias'),
  q('The lone and level sands stretch far away.', 'Percy Bysshe Shelley', 'Ozymandias'),
  q('If Winter comes, can Spring be far behind?', 'Percy Bysshe Shelley', 'Ode to the West Wind'),
  q('The world’s great age begins anew, the golden years return.', 'Percy Bysshe Shelley', 'Hellas'),

  /* ---------- Alfred, Lord Tennyson ---------- */
  q('’Tis better to have loved and lost than never to have loved at all.', 'Alfred, Lord Tennyson', 'In Memoriam A.H.H.'),
  q('Theirs not to reason why, theirs but to do and die.', 'Alfred, Lord Tennyson', 'The Charge of the Light Brigade'),
  q('Into the valley of Death rode the six hundred.', 'Alfred, Lord Tennyson', 'The Charge of the Light Brigade'),
  q('I am a part of all that I have met.', 'Alfred, Lord Tennyson', 'Ulysses'),
  q('To strive, to seek, to find, and not to yield.', 'Alfred, Lord Tennyson', 'Ulysses'),
  q('Tears, idle tears, I know not what they mean.', 'Alfred, Lord Tennyson', 'The Princess'),

  /* ---------- Robert Browning ---------- */
  q('God’s in his heaven—all’s right with the world!', 'Robert Browning', 'Pippa Passes'),
  q('Ah, but a man’s reach should exceed his grasp, or what’s a heaven for?', 'Robert Browning', 'Andrea del Sarto'),
  q('Grow old along with me! The best is yet to be.', 'Robert Browning', 'Rabbi Ben Ezra'),
  q('That’s the wise thrush; he sings each song twice over, lest you should think he never could recapture the first fine careless rapture!', 'Robert Browning', 'Home-Thoughts, from Abroad'),

  /* ---------- W. B. Yeats (early poems, public domain) ---------- */
  q('Tread softly because you tread on my dreams.', 'W. B. Yeats', 'He Wishes for the Cloths of Heaven'),
  q('But I, being poor, have only my dreams; I have spread my dreams under your feet.', 'W. B. Yeats', 'He Wishes for the Cloths of Heaven'),
  q('Things fall apart; the centre cannot hold.', 'W. B. Yeats', 'The Second Coming'),
  q('The best lack all conviction, while the worst are full of passionate intensity.', 'W. B. Yeats', 'The Second Coming'),

  /* ---------- Gerard Manley Hopkins ---------- */
  q('The world is charged with the grandeur of God.', 'Gerard Manley Hopkins', 'God’s Grandeur'),
  q('There lives the dearest freshness deep down things.', 'Gerard Manley Hopkins', 'God’s Grandeur'),

  /* ---------- John Donne ---------- */
  q('No man is an island, entire of itself.', 'John Donne', 'Devotions upon Emergent Occasions, XVII'),
  q('Any man’s death diminishes me, because I am involved in mankind.', 'John Donne', 'Devotions upon Emergent Occasions, XVII'),
  q('Therefore never send to know for whom the bell tolls; it tolls for thee.', 'John Donne', 'Devotions upon Emergent Occasions, XVII'),
  q('For God’s sake hold your tongue, and let me love.', 'John Donne', 'The Canonization'),
  q('Death be not proud, though some have called thee mighty and dreadful, for thou art not so.', 'John Donne', 'Holy Sonnet X'),
  q('One short sleep past, we wake eternally, and death shall be no more; death, thou shalt die.', 'John Donne', 'Holy Sonnet X'),

  /* ---------- George Herbert, Andrew Marvell, John Milton ---------- */
  q('Love bade me welcome: yet my soul drew back.', 'George Herbert', 'Love (III)'),
  q('Who would have thought my shriveled heart could have recovered greenness?', 'George Herbert', 'The Flower'),
  q('Had we but world enough, and time, this coyness, lady, were no crime.', 'Andrew Marvell', 'To His Coy Mistress'),
  q('But at my back I always hear Time’s winged chariot hurrying near.', 'Andrew Marvell', 'To His Coy Mistress'),
  q('They also serve who only stand and wait.', 'John Milton', 'When I Consider How My Light Is Spent'),
  q('The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.', 'John Milton', 'Paradise Lost, I'),
  q('What though the field be lost? All is not lost.', 'John Milton', 'Paradise Lost, I'),
  q('Awake, arise, or be for ever fall’n.', 'John Milton', 'Paradise Lost, I'),
  q('You never enjoy the world aright, till the sea itself floweth in your veins, till you are clothed with the heavens, and crowned with the stars.', 'Thomas Traherne', 'Centuries of Meditations'),

  /* ---------- Ralph Waldo Emerson ---------- */
  q('Trust thyself: every heart vibrates to that iron string.', 'Ralph Waldo Emerson', 'Self-Reliance'),
  q('To be great is to be misunderstood.', 'Ralph Waldo Emerson', 'Self-Reliance'),
  q('A foolish consistency is the hobgoblin of little minds.', 'Ralph Waldo Emerson', 'Self-Reliance'),
  q('Nothing can bring you peace but yourself.', 'Ralph Waldo Emerson', 'Self-Reliance'),
  q('There is a time in every man’s education when he arrives at the conviction that envy is ignorance.', 'Ralph Waldo Emerson', 'Self-Reliance'),
  q('Nothing great was ever achieved without enthusiasm.', 'Ralph Waldo Emerson', 'Circles'),
  q('The only way to have a friend is to be one.', 'Ralph Waldo Emerson', 'Friendship'),
  q('In the woods, we return to reason and faith.', 'Ralph Waldo Emerson', 'Nature'),
  q('I become a transparent eye-ball. I am nothing. I see all.', 'Ralph Waldo Emerson', 'Nature'),
  q('Every natural fact is a symbol of some spiritual fact.', 'Ralph Waldo Emerson', 'Nature'),
  q('We are symbols, and inhabit symbols.', 'Ralph Waldo Emerson', 'The Poet'),
  q('The sky is the daily bread of the eyes.', 'Ralph Waldo Emerson', 'Nature'),

  /* ---------- Henry David Thoreau ---------- */
  q('The mass of men lead lives of quiet desperation.', 'Henry David Thoreau', 'Walden'),
  q('I went to the woods because I wished to live deliberately, to front only the essential facts of life.', 'Henry David Thoreau', 'Walden'),
  q('Simplify, simplify.', 'Henry David Thoreau', 'Walden'),
  q('Our life is frittered away by detail.', 'Henry David Thoreau', 'Walden'),
  q('If a man does not keep pace with his companions, perhaps it is because he hears a different drummer.', 'Henry David Thoreau', 'Walden'),
  q('Rather than love, than money, than fame, give me truth.', 'Henry David Thoreau', 'Walden'),
  q('Heaven is under our feet as well as over our heads.', 'Henry David Thoreau', 'Walden'),
  q('Time is but the stream I go a-fishing in.', 'Henry David Thoreau', 'Walden'),

  /* ---------- Francis Bacon ---------- */
  q('Reading maketh a full man; conference a ready man; and writing an exact man.', 'Francis Bacon', 'Of Studies'),
  q('Some books are to be tasted, others to be swallowed, and some few to be chewed and digested.', 'Francis Bacon', 'Of Studies'),
  q('Crafty men contemn studies, simple men admire them, and wise men use them.', 'Francis Bacon', 'Of Studies'),

  /* ---------- Thomas Browne ---------- */
  q('We carry with us the wonders we seek without us.', 'Thomas Browne', 'Religio Medici'),
  q('The world is made of contrarieties, and the harmony of it consists in discords.', 'Thomas Browne', 'Religio Medici'),

  /* ---------- Herman Melville ---------- */
  q('Call me Ishmael.', 'Herman Melville', 'Moby-Dick'),
  q('It is not down in any map; true places never are.', 'Herman Melville', 'Moby-Dick'),
  q('There is a wisdom that is woe; but there is a woe that is madness.', 'Herman Melville', 'Moby-Dick'),

  /* ---------- Edgar Allan Poe ---------- */
  q('All that we see or seem is but a dream within a dream.', 'Edgar Allan Poe', 'A Dream Within a Dream'),
  q('Once upon a midnight dreary, while I pondered, weak and weary.', 'Edgar Allan Poe', 'The Raven'),

  /* ---------- Oscar Wilde ---------- */
  q('We are all in the gutter, but some of us are looking at the stars.', 'Oscar Wilde', 'Lady Windermere’s Fan'),
  q('Experience is the name every one gives to their mistakes.', 'Oscar Wilde', 'Lady Windermere’s Fan'),
  q('The truth is rarely pure and never simple.', 'Oscar Wilde', 'The Importance of Being Earnest'),
  q('To live is the rarest thing in the world. Most people exist, that is all.', 'Oscar Wilde', 'The Soul of Man under Socialism'),

  /* ---------- Kahlil Gibran, The Prophet (1923) ---------- */
  q('Your children are not your children. They are the sons and daughters of Life’s longing for itself.', 'Kahlil Gibran', 'The Prophet, “On Children”'),
  q('You are the bows from which your children as living arrows are sent forth.', 'Kahlil Gibran', 'The Prophet, “On Children”'),
  q('Ever has it been that love knows not its own depth until the hour of separation.', 'Kahlil Gibran', 'The Prophet, “On Love”'),
  q('For what is it to die but to stand naked in the wind and to melt into the sun?', 'Kahlil Gibran', 'The Prophet, “On Death”'),
  q('And could you keep your heart in wonder at the daily miracles of your life, your pain would not seem less wondrous than your joy.', 'Kahlil Gibran', 'The Prophet, “On Pain”'),
  q('Your joy is your sorrow unmasked.', 'Kahlil Gibran', 'The Prophet, “On Joy and Sorrow”'),

  /* ---------- Omar Khayyám, trans. Edward FitzGerald (1859) ---------- */
  q('The Moving Finger writes; and, having writ, moves on: nor all thy Piety nor Wit shall lure it back to cancel half a Line.', 'Omar Khayyám', 'Rubáiyát, trans. Edward FitzGerald (1859)'),
  q('A Book of Verses underneath the Bough, A Jug of Wine, a Loaf of Bread—and Thou beside me singing in the Wilderness.', 'Omar Khayyám', 'Rubáiyát, trans. Edward FitzGerald (1859)'),
  q('Ah, make the most of what we yet may spend, before we too into the Dust descend.', 'Omar Khayyám', 'Rubáiyát, trans. Edward FitzGerald (1859)'),
  q('The Wine of Life keeps oozing drop by drop, the Leaves of Life keep falling one by one.', 'Omar Khayyám', 'Rubáiyát, trans. Edward FitzGerald (1859)'),
  q('One Flash of It within the Tavern caught better than in the Temple lost outright.', 'Omar Khayyám', 'Rubáiyát, trans. Edward FitzGerald (1859)'),

  /* ---------- Epictetus, trans. George Long (1877) ---------- */
  q('Men are disturbed not by things, but by the views which they take of things.', 'Epictetus', 'Enchiridion, trans. George Long (1877)'),
  q('Seek not that the things which happen should happen as you wish; but wish the things which happen to be as they are, and you will have a tranquil flow of life.', 'Epictetus', 'Enchiridion, trans. George Long (1877)'),
  q('No man is free who is not master of himself.', 'Epictetus', 'Enchiridion, trans. George Long (1877)'),

  /* ---------- Marcus Aurelius, trans. George Long (1862) ---------- */
  q('The universe is transformation: our life is what our thoughts make it.', 'Marcus Aurelius', 'Meditations, trans. George Long (1862)'),
  q('No longer talk at all about the kind of man that a good man ought to be, but be such.', 'Marcus Aurelius', 'Meditations, trans. George Long (1862)'),
  q('Loss is nothing else but change, and change is Nature’s delight.', 'Marcus Aurelius', 'Meditations, trans. George Long (1862)'),

  /* ---------- Seneca, trans. Richard Mott Gummere (1917) ---------- */
  q('We suffer more often in imagination than in reality.', 'Seneca', 'Letters to Lucilius, trans. Richard Mott Gummere (1917)'),
  q('While we are postponing, life speeds by.', 'Seneca', 'Letters to Lucilius, trans. Richard Mott Gummere (1917)'),

  /* ---------- Confucius, trans. James Legge (1861) ---------- */
  q('Learning without thought is labour lost; thought without learning is perilous.', 'Confucius', 'Analects, trans. James Legge (1861)'),
  q('What you do not want done to yourself, do not do to others.', 'Confucius', 'Analects, trans. James Legge (1861)'),
  q('The superior man is distressed by his want of ability; he is not distressed by men’s not knowing him.', 'Confucius', 'Analects, trans. James Legge (1861)'),

  /* ---------- Plato, trans. Benjamin Jowett (1871) ---------- */
  q('The unexamined life is not worth living.', 'Plato', 'Apology, trans. Benjamin Jowett (1871)'),
  q('Wonder is the only beginning of philosophy.', 'Plato', 'Theaetetus, trans. Benjamin Jowett (1871)'),

  /* ---------- Heraclitus ---------- */
  q('Upon those who step into the same rivers, different and again different waters flow.', 'Heraclitus', 'Fragment B12'),

  /* ---------- Homer, trans. Samuel Butler (1900) ---------- */
  q('Sing, O goddess, the anger of Achilles son of Peleus.', 'Homer', 'Iliad, trans. Samuel Butler (1900)'),
  q('As are the generations of leaves, such are those likewise of men.', 'Homer', 'Iliad VI, trans. Samuel Butler (1900)'),

  /* ---------- Virgil, trans. John Dryden (1697) ---------- */
  q('Arms, and the man I sing.', 'Virgil', 'Aeneid, trans. John Dryden (1697)'),
  q('The gates of Hell are open night and day; smooth the descent, and easy is the way.', 'Virgil', 'Aeneid VI, trans. John Dryden (1697)'),

  /* ---------- Dante, trans. Henry Wadsworth Longfellow (1867) ---------- */
  q('Midway upon the journey of our life I found myself within a forest dark.', 'Dante Alighieri', 'Inferno I, trans. Henry Wadsworth Longfellow (1867)'),
  q('All hope abandon, ye who enter in!', 'Dante Alighieri', 'Inferno III, trans. Henry Wadsworth Longfellow (1867)'),
  q('The Love that moves the sun and the other stars.', 'Dante Alighieri', 'Paradiso XXXIII, trans. Henry Wadsworth Longfellow (1867)'),

  /* ---------- Michel de Montaigne, trans. John Florio (1603) ---------- */
  q('What do I know?', 'Michel de Montaigne', 'Essais II.12, trans. John Florio (1603)'),
  q('He who fears he shall suffer, already suffers what he fears.', 'Michel de Montaigne', 'Essais III.13, trans. John Florio (1603)'),
  q('The greatest thing in the world is to know how to belong to oneself.', 'Michel de Montaigne', 'Essais I.39, trans. John Florio (1603)'),

  /* ---------- Blaise Pascal, trans. W. F. Trotter (1904) ---------- */
  q('The heart has its reasons, which reason does not know.', 'Blaise Pascal', 'Pensées, trans. W. F. Trotter (1904)'),
  q('Man is but a reed, the weakest in nature, but he is a thinking reed.', 'Blaise Pascal', 'Pensées, trans. W. F. Trotter (1904)'),
  q('All the dignity of man consists in thought.', 'Blaise Pascal', 'Pensées, trans. W. F. Trotter (1904)'),

  /* ---------- Friedrich Nietzsche, trans. Thomas Common (1909–1911) ---------- */
  q('He who has a why to live for can bear almost any how.', 'Friedrich Nietzsche', 'Twilight of the Idols, trans. Thomas Common'),
  q('That which does not kill us makes us stronger.', 'Friedrich Nietzsche', 'Twilight of the Idols, trans. Thomas Common'),
  q('One must still have chaos in oneself to be able to give birth to a dancing star.', 'Friedrich Nietzsche', 'Thus Spoke Zarathustra, trans. Thomas Common'),
  q('There are no facts, only interpretations.', 'Friedrich Nietzsche', 'The Will to Power, trans. Thomas Common'),

  /* ---------- Leo Tolstoy, trans. Aylmer Maude ---------- */
  q('Happy families are all alike; every unhappy family is unhappy in its own way.', 'Leo Tolstoy', 'Anna Karenina, trans. Aylmer Maude'),
  q('I sit on a man’s back, choking him and making him carry me, and yet assure myself and others that I am very sorry for him and wish to ease his lot by all possible means—except by getting off his back.', 'Leo Tolstoy', 'What Then Must We Do?, trans. Aylmer Maude'),

  /* ---------- Fyodor Dostoevsky, trans. Constance Garnett ---------- */
  q('Pain and suffering are always inevitable for a large intelligence and a deep heart.', 'Fyodor Dostoevsky', 'Crime and Punishment, trans. Constance Garnett'),
  q('Man grows used to everything, the scoundrel!', 'Fyodor Dostoevsky', 'Crime and Punishment, trans. Constance Garnett'),

  /* ---------- Anton Chekhov, trans. Constance Garnett ---------- */
  q('Medicine is my lawful wife, and literature is my mistress.', 'Anton Chekhov', 'Letter to Alexei Suvorin, trans. Constance Garnett'),
  q('When we are happy we don’t notice whether it is winter or summer.', 'Anton Chekhov', 'The Three Sisters, trans. Constance Garnett'),

  /* ---------- François de La Rochefoucauld ---------- */
  q('We are so accustomed to disguise ourselves to others that at last we disguise ourselves to ourselves.', 'François de La Rochefoucauld', 'Maxims'),
  q('Nothing is so contagious as example.', 'François de La Rochefoucauld', 'Maxims'),
  q('True love is like ghosts, which everyone talks about and few have seen.', 'François de La Rochefoucauld', 'Maxims'),

  /* ---------- The Dhammapada, trans. Max Müller (1881) ---------- */
  q('All that we are is the result of what we have thought.', 'The Dhammapada', 'I.1, trans. Max Müller (1881)'),
  q('If a man speaks or acts with an evil thought, pain follows him, as the wheel follows the foot of the ox that draws the carriage.', 'The Dhammapada', 'I.1, trans. Max Müller (1881)'),
  q('Victory breeds hatred, for the conquered is unhappy.', 'The Dhammapada', 'XIV, trans. Max Müller (1881)'),
  q('He who holds back rising anger like a rolling chariot, him I call a real driver.', 'The Dhammapada', 'XVII, trans. Max Müller (1881)'),

  /* ---------- The Bhagavad Gita, trans. Edwin Arnold (1885) ---------- */
  q('Never the spirit was born; the spirit shall cease to be never.', 'The Bhagavad Gita', 'II, trans. Edwin Arnold (1885)'),

  /* ---------- Sun Tzu, trans. Lionel Giles (1910) ---------- */
  q('All warfare is based on deception.', 'Sun Tzu', 'The Art of War, trans. Lionel Giles (1910)'),
  q('Supreme excellence consists in breaking the enemy’s resistance without fighting.', 'Sun Tzu', 'The Art of War, trans. Lionel Giles (1910)'),
  q('If you know yourself and know your enemy, you need not fear the result of a hundred battles.', 'Sun Tzu', 'The Art of War, trans. Lionel Giles (1910)'),

  /* ---------- Kabir, trans. Rabindranath Tagore (1915) ---------- */
  q('O servant, where dost thou seek Me? Lo! I am beside thee.', 'Kabir', 'One Hundred Poems of Kabir, trans. Rabindranath Tagore (1915)'),
  q('I am neither in temple nor in mosque: I am neither in Kaaba nor in Kailash.', 'Kabir', 'One Hundred Poems of Kabir, trans. Rabindranath Tagore (1915)'),
  q('I laugh when I hear that the fish in the water is thirsty.', 'Kabir', 'One Hundred Poems of Kabir, trans. Rabindranath Tagore (1915)'),
  q('The moon shines in my body, but my blind eyes cannot see it.', 'Kabir', 'One Hundred Poems of Kabir, trans. Rabindranath Tagore (1915)'),

  /* ---------- Rabindranath Tagore, Gitanjali (1912) ---------- */
  q('Thou hast made me endless, such is thy pleasure.', 'Rabindranath Tagore', 'Gitanjali 1 (1912)'),
  q('The time that my journey takes is long and the way of it long.', 'Rabindranath Tagore', 'Gitanjali 12 (1912)'),
  q('Life of my life, I shall ever try to keep my body pure, knowing that thy living touch is upon all my limbs.', 'Rabindranath Tagore', 'Gitanjali 4 (1912)'),
  q('I am here to sing thee songs.', 'Rabindranath Tagore', 'Gitanjali 2 (1912)'),

  /* ---------- The King James Bible (1611) — Ecclesiastes ---------- */
  q('Vanity of vanities, saith the Preacher, vanity of vanities; all is vanity.', 'The Bible, KJV', 'Ecclesiastes 1:2'),
  q('The sun also ariseth, and the sun goeth down, and hasteth to his place where he arose.', 'The Bible, KJV', 'Ecclesiastes 1:5'),
  q('There is no new thing under the sun.', 'The Bible, KJV', 'Ecclesiastes 1:9'),
  q('To every thing there is a season, and a time to every purpose under the heaven.', 'The Bible, KJV', 'Ecclesiastes 3:1'),
  q('A time to be born, and a time to die.', 'The Bible, KJV', 'Ecclesiastes 3:2'),
  q('He hath made every thing beautiful in his time.', 'The Bible, KJV', 'Ecclesiastes 3:11'),

  /* ---------- KJV — Psalms and the prophets ---------- */
  q('The LORD is my shepherd; I shall not want.', 'The Bible, KJV', 'Psalm 23:1'),
  q('Yea, though I walk through the valley of the shadow of death, I will fear no evil.', 'The Bible, KJV', 'Psalm 23:4'),
  q('Be still, and know that I am God.', 'The Bible, KJV', 'Psalm 46:10'),
  q('Weeping may endure for a night, but joy cometh in the morning.', 'The Bible, KJV', 'Psalm 30:5'),
  q('The heavens declare the glory of God; and the firmament sheweth his handywork.', 'The Bible, KJV', 'Psalm 19:1'),
  q('Whither shall I go from thy spirit? or whither shall I flee from thy presence?', 'The Bible, KJV', 'Psalm 139:7'),
  q('If I take the wings of the morning, and dwell in the uttermost parts of the sea; even there shall thy hand lead me.', 'The Bible, KJV', 'Psalm 139:9–10'),
  q('Many are the afflictions of the righteous: but the LORD delivereth him out of them all.', 'The Bible, KJV', 'Psalm 34:19'),
  q('The grass withereth, the flower fadeth: but the word of our God shall stand for ever.', 'The Bible, KJV', 'Isaiah 40:8'),
  q('They shall mount up with wings as eagles; they shall run, and not be weary.', 'The Bible, KJV', 'Isaiah 40:31'),
  q('Comfort ye, comfort ye my people.', 'The Bible, KJV', 'Isaiah 40:1'),

  /* ---------- KJV — Job, Proverbs, the Song of Songs ---------- */
  q('The Lord gave, and the Lord hath taken away; blessed be the name of the Lord.', 'The Bible, KJV', 'Job 1:21'),
  q('Man is born unto trouble, as the sparks fly upward.', 'The Bible, KJV', 'Job 5:7'),
  q('For we are but of yesterday, and know nothing.', 'The Bible, KJV', 'Job 8:9'),
  q('Where wast thou when I laid the foundations of the earth?', 'The Bible, KJV', 'Job 38:4'),
  q('Canst thou bind the sweet influences of Pleiades, or loose the bands of Orion?', 'The Bible, KJV', 'Job 38:31'),
  q('Hope deferred maketh the heart sick: but when the desire cometh, it is a tree of life.', 'The Bible, KJV', 'Proverbs 13:12'),
  q('A soft answer turneth away wrath.', 'The Bible, KJV', 'Proverbs 15:1'),
  q('Better is a dinner of herbs where love is, than a stalled ox and hatred therewith.', 'The Bible, KJV', 'Proverbs 15:17'),
  q('A merry heart doeth good like a medicine.', 'The Bible, KJV', 'Proverbs 17:22'),
  q('Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.', 'The Bible, KJV', 'Proverbs 27:17'),
  q('Set me as a seal upon thine heart, as a seal upon thine arm: for love is strong as death.', 'The Bible, KJV', 'Song of Solomon 8:6'),
  q('Many waters cannot quench love, neither can the floods drown it.', 'The Bible, KJV', 'Song of Solomon 8:7'),

  /* ---------- KJV — the epistle on love ---------- */
  q('Though I speak with the tongues of men and of angels, and have not charity, I am become as sounding brass, or a tinkling cymbal.', 'The Bible, KJV', '1 Corinthians 13:1'),
  q('Charity suffereth long, and is kind; charity envieth not.', 'The Bible, KJV', '1 Corinthians 13:4'),
  q('For now we see through a glass, darkly; but then face to face.', 'The Bible, KJV', '1 Corinthians 13:12'),
  q('And now abideth faith, hope, charity, these three; but the greatest of these is charity.', 'The Bible, KJV', '1 Corinthians 13:13'),

  /* ---------- more Blake ---------- */
  q('The cut worm forgives the plough.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('Prudence is a rich ugly old maid courted by Incapacity.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('Joys impregnate. Sorrows bring forth.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('Exuberance is Beauty.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('The bird a nest, the spider a web, man friendship.', 'William Blake', 'The Marriage of Heaven and Hell'),
  q('The most sublime act is to set another before you.', 'William Blake', 'The Marriage of Heaven and Hell'),

  /* ---------- more Emerson and Thoreau ---------- */
  q('Nothing is at last sacred but the integrity of your own mind.', 'Ralph Waldo Emerson', 'Self-Reliance'),
  q('The years teach much which the days never know.', 'Ralph Waldo Emerson', 'Experience'),
  q('We are always getting ready to live, but never living.', 'Ralph Waldo Emerson', 'Journals'),
  q('Books are the best of things, well used; abused, among the worst.', 'Ralph Waldo Emerson', 'The American Scholar'),
  q('The language of friendship is not words but meanings.', 'Henry David Thoreau', 'A Week on the Concord and Merrimack Rivers'),
  q('It is not enough to be busy; so are the ants. The question is: what are we busy about?', 'Henry David Thoreau', 'Letter to H. G. O. Blake (1854)'),
  q('The only obligation which I have a right to assume is to do at any time what I think right.', 'Henry David Thoreau', 'Civil Disobedience'),

  /* ---------- more Shakespeare ---------- */
  q('Our revels now are ended. These our actors, as I foretold you, were all spirits.', 'William Shakespeare', 'The Tempest, IV.i'),
  q('There is a special providence in the fall of a sparrow.', 'William Shakespeare', 'Hamlet, V.ii'),
  q('Give me that man that is not passion’s slave, and I will wear him in my heart’s core.', 'William Shakespeare', 'Hamlet, III.ii'),
  q('How weary, stale, flat, and unprofitable seem to me all the uses of this world!', 'William Shakespeare', 'Hamlet, I.ii'),
  q('The better part of valour is discretion.', 'William Shakespeare', 'Henry IV, Part 1, V.iv'),
  q('Uneasy lies the head that wears a crown.', 'William Shakespeare', 'Henry IV, Part 2, III.i'),

  /* ---------- more Tennyson and Browning ---------- */
  q('The old order changeth, yielding place to new.', 'Alfred, Lord Tennyson', 'Morte d’Arthur'),
  q('More things are wrought by prayer than this world dreams of.', 'Alfred, Lord Tennyson', 'Morte d’Arthur'),
  q('God uses us to help each other so, lending our minds out.', 'Robert Browning', 'Fra Lippo Lippi'),

  /* ---------- Aristotle, trans. S. H. Butcher (1895) and W. D. Ross (1908) ---------- */
  q('All men by nature desire to know.', 'Aristotle', 'Metaphysics I.1, trans. W. D. Ross (1908)'),
  q('Poetry is something more philosophic and of graver import than history.', 'Aristotle', 'Poetics 9, trans. S. H. Butcher (1895)'),

  /* ---------- Homer, Odyssey ---------- */
  q('There is nothing nobler or more admirable than when two people who see eye to eye keep house as man and wife.', 'Homer', 'Odyssey VI, trans. Samuel Butler (1900)'),

  /* ---------- Cicero ---------- */
  q('If you have a garden and a library, you have everything you need.', 'Cicero', 'Letter to Varro, 46 BC'),


  /* ---------- KJV — the Psalms of ascent and longing ---------- */
  q('The LORD is my light and my salvation; whom shall I fear?', 'The Bible, KJV', 'Psalm 27:1'),
  q('One thing have I desired of the LORD, that will I seek after; that I may dwell in the house of the LORD all the days of my life.', 'The Bible, KJV', 'Psalm 27:4'),
  q('Wait on the LORD: be of good courage, and he shall strengthen thine heart.', 'The Bible, KJV', 'Psalm 27:14'),
  q('Delight thyself also in the LORD; and he shall give thee the desires of thine heart.', 'The Bible, KJV', 'Psalm 37:4'),
  q('Rest in the LORD, and wait patiently for him.', 'The Bible, KJV', 'Psalm 37:7'),
  q('As the hart panteth after the water brooks, so panteth my soul after thee, O God.', 'The Bible, KJV', 'Psalm 42:1'),
  q('Deep calleth unto deep at the noise of thy waterspouts.', 'The Bible, KJV', 'Psalm 42:7'),
  q('God is our refuge and strength, a very present help in trouble.', 'The Bible, KJV', 'Psalm 46:1'),
  q('Create in me a clean heart, O God; and renew a right spirit within me.', 'The Bible, KJV', 'Psalm 51:10'),
  q('Truly my soul waiteth upon God: from him cometh my salvation.', 'The Bible, KJV', 'Psalm 62:1'),
  q('Whom have I in heaven but thee? and there is none upon earth that I desire beside thee.', 'The Bible, KJV', 'Psalm 73:25'),
  q('My flesh and my heart faileth: but God is the strength of my heart, and my portion for ever.', 'The Bible, KJV', 'Psalm 73:26'),
  q('Lord, thou hast been our dwelling place in all generations.', 'The Bible, KJV', 'Psalm 90:1'),
  q('So teach us to number our days, that we may apply our hearts unto wisdom.', 'The Bible, KJV', 'Psalm 90:12'),
  q('He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.', 'The Bible, KJV', 'Psalm 91:1'),
  q('He shall cover thee with his feathers, and under his wings shalt thou trust.', 'The Bible, KJV', 'Psalm 91:4'),
  q('O come, let us worship and bow down: let us kneel before the LORD our maker.', 'The Bible, KJV', 'Psalm 95:6'),
  q('This is the day which the LORD hath made; we will rejoice and be glad in it.', 'The Bible, KJV', 'Psalm 118:24'),
  q('I will lift up mine eyes unto the hills, from whence cometh my help.', 'The Bible, KJV', 'Psalm 121:1'),
  q('Except the LORD build the house, they labour in vain that build it.', 'The Bible, KJV', 'Psalm 127:1'),
  q('He giveth his beloved sleep.', 'The Bible, KJV', 'Psalm 127:2'),
  q('Out of the depths have I cried unto thee, O LORD.', 'The Bible, KJV', 'Psalm 130:1'),
  q('If I ascend up into heaven, thou art there: if I make my bed in hell, behold, thou art there.', 'The Bible, KJV', 'Psalm 139:8'),
  q('Search me, O God, and know my heart: try me, and know my thoughts.', 'The Bible, KJV', 'Psalm 139:23'),
  q('By the rivers of Babylon, there we sat down, yea, we wept, when we remembered Zion.', 'The Bible, KJV', 'Psalm 137:1'),

  /* ---------- KJV — wisdom, and the gospels ---------- */
  q('The fear of the LORD is the beginning of wisdom.', 'The Bible, KJV', 'Proverbs 9:10'),
  q('The light shineth in darkness; and the darkness comprehended it not.', 'The Bible, KJV', 'John 1:5'),
  q('Peace I leave with you, my peace I give unto you.', 'The Bible, KJV', 'John 14:27'),

  /* ---------- a few more of the English poets ---------- */
  q('Stone walls do not a prison make, nor iron bars a cage.', 'Richard Lovelace', 'To Althea, from Prison'),
  q('I could not love thee, dear, so much, loved I not honour more.', 'Richard Lovelace', 'To Lucasta, Going to the Wars'),
  q('Gather ye rosebuds while ye may, old time is still a-flying.', 'Robert Herrick', 'To the Virgins, to Make Much of Time'),
  q('And this same flower that smiles today, tomorrow will be dying.', 'Robert Herrick', 'To the Virgins, to Make Much of Time'),
  q('The grave’s a fine and private place, but none, I think, do there embrace.', 'Andrew Marvell', 'To His Coy Mistress'),
  q('Season of mists and mellow fruitfulness, close bosom-friend of the maturing sun.', 'John Keats', 'To Autumn'),
  q('O for a life of sensations rather than of thoughts!', 'John Keats', 'Letter to Benjamin Bailey (1817)'),
  q('If I should die, think only this of me: that there’s some corner of a foreign field that is for ever England.', 'Rupert Brooke', 'The Soldier'),
  q('These I have loved: white plates and cups, clean-gleaming.', 'Rupert Brooke', 'The Great Lover'),
];


/* ---------- from the author's own books — first party, no translation ---------- */
const OWN: Quote[] = [
  q('She signed for ninety quiet days. The house had already decided how long she would stay.', 'Sufi Ilham', 'The Quiet Tenancy'),
  q('What if what you called love was only your fear of losing them?', 'Sufi Ilham', 'Moh Tera Prem: Where Attachment Ends and Love Begins'),
  q('His name is not a name. His dates are uncertain by two centuries.', 'Sufi Ilham', 'Laozi: The Man Who Disappeared into the Dao'),
  q('A book that asks to be lived, not merely read.', 'Sufi Ilham', 'The Wall Was a Gesture'),
  q('The map is not the country. Walk until you know the difference.', 'Sufi Ilham', 'The Map Is Finished'),
  q('Your brain is not broken. You just need the right protocol.', 'Sufi Ilham', 'NeuroFocus Protocol'),
  q('Don\'t read this book. Surrender to it.', 'Sufi Ilham', 'Fractured Time'),
  q('Your beliefs created your current reality. New beliefs will create your new reality.', 'Sufi Ilham', 'Belief Unveiled'),
  q('Welcome to the Infinite Classroom. The lesson begins now.', 'Sufi Ilham', 'The Infinite Classroom'),
  q('A flower where it should not be. A house that remembers a flood. A man who has been paid to make the past more beautiful than it was.', 'Sufi Ilham', 'The River\'s Portion'),
  q('She came to sell a bookshop. The bookshop had other plans.', 'Sufi Ilham', 'The Bookshop at the End of Maple Street'),
  q('She was always leaving. He never learned how to let go. Christmas had other plans.', 'Sufi Ilham', 'The Christmas Letters of Maple Falls'),
  q('The whole town is getting married. The fire chief never wanted to attend a wedding again.', 'Sufi Ilham', 'A Wedding at the End of Maple Street'),
  q('Declare it, or they cut it out of you.', 'Sufi Ilham', 'The Shadow Tithe'),
  q('In Isker, shadows arrive late. He falls first. That is not enough.', 'Sufi Ilham', 'The Sea Tithe'),
  q('He falls first. She does not declare him. She declares herself.', 'Sufi Ilham', 'The Crown Always Owns'),
  q('Some futures are drawn. Hers was signed.', 'Sufi Ilham', 'The Map of Tomorrow'),
  q('His desk is walking home. They mean to use it.', 'Sufi Ilham', 'The Compass of the Dead'),
  q('The harbor keeps its ledgers under water.', 'Sufi Ilham', 'The Library of Drowned Days'),
  q('Seven days were never written. They are coming due.', 'Sufi Ilham', 'The Seven Unwritten Days'),
  q('Every guild ends with one name left on the roll.', 'Sufi Ilham', 'The Last Cartographer'),
  q('The sky was never broken by the storm; it only waited for the flute.', 'Sufi Ilham', 'The Eden of Sunspire'),
  q('The mind can only meditate upon a void; love is already full of the Beloved.', 'Sufi Ilham', 'The Citadel of Sapphire Seas'),
  q('Across all worlds and all ages, our love is the song.', 'Sufi Ilham', 'The Chariot of Peace'),
];

/** The collection as it is dealt: a stable shuffle of the file's order, so
 *  consecutive page loads do not walk down one poet’s work. */
export const QUOTES: Quote[] = [...BORROWED, ...OWN]
  .sort((a, b) => seedFrom(a.text) - seedFrom(b.text));

/** A stable number from a string (FNV-1a), so a page always opens on the same
 *  line during a build while no two pages agree with each other. */
export function seedFrom(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** The line a given page opens on. Deterministic, so the built HTML is stable. */
export const quoteFor = (key: string): Quote => QUOTES[seedFrom(key) % QUOTES.length];

/** How much room a line needs: the stage sets its type from this. */
export const sizeFor = (text: string): 'short' | 'medium' | 'long' =>
  (text.length > 170 ? 'long' : text.length > 90 ? 'medium' : 'short');

export const QUOTE_COUNT = QUOTES.length;
