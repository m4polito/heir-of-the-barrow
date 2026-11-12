import { parseAsciiMap, type GameMap } from '../../game/map';
import { INTERIOR_LEGEND } from './legend';
import { STORY } from '../story';

const ROWS = [
  '############',
  '#bwwwwwwwww#',
  '#wwwwwwwwww#',
  '#wwwwTTTwww#',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '######D#####',
];

export const ELDER_HOUSE: GameMap = {
  id: 'elder_house',
  ...parseAsciiMap(ROWS, INTERIOR_LEGEND),
  music: 'hollowmere',
  entry: {
    door: { x: 6, y: 7, facing: 'up' },
    start: { x: 6, y: 4, facing: 'up' },
  },
  npcs: [
    { id: 'maren', sprite: 'elder', x: 6, y: 2, facing: 'down', wander: false, dialog: 'maren' },
  ],
  triggers: [
    { kind: 'warp', x: 6, y: 8, to: 'hollowmere', entry: 'elder_house' },
    { kind: 'auto', flag: STORY.opening.flag, dialog: STORY.opening.dialog },
  ],
};
