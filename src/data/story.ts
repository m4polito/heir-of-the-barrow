import type { StoryConfig } from '../game/game';

export const STORY = {
  title: 'HEIR OF THE BARROW',
  subtitle: 'THE DIMMING',
  defaultHeroName: 'Wren',
  newGame: { map: 'elder_house', entry: 'start' },
  opening: { map: 'elder_house', flag: 'intro_done', dialog: 'maren_intro' },
  respawn: { map: 'elder_house', entry: 'start', dialog: 'maren_fallen' },
  home: { map: 'hollowmere', entry: 'gate' },
  startingItems: [{ item: 'herb', count: 1 }],
  storagePrefix: 'dimming',
} as const satisfies StoryConfig;
