import type { StoryConfig } from '../game/game';

export const STORY = {
  title: 'THE DIMMING',
  defaultHeroName: 'Wren',
  newGame: { map: 'elder_house', entry: 'start' },
  opening: { map: 'elder_house', flag: 'intro_done', dialog: 'maren_intro' },
} as const satisfies StoryConfig;
