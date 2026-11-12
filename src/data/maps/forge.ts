import { parseAsciiMap, type GameMap } from '../../game/map';
import { INTERIOR_LEGEND } from './legend';

const ROWS = [
  '############',
  '#wwwwwwwwTT#',
  '#wwwwwwwwww#',
  '#wwcccccwww#',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '#####D######',
];

export const FORGE: GameMap = {
  id: 'forge',
  ...parseAsciiMap(ROWS, INTERIOR_LEGEND),
  music: 'hollowmere',
  entry: {
    door: { x: 6, y: 7, facing: 'up' },
  },
  npcs: [
    { id: 'garrik', sprite: 'smith', x: 5, y: 2, facing: 'down', wander: false, dialog: 'garrik' },
  ],
  triggers: [
    { kind: 'warp', x: 6, y: 8, to: 'hollowmere', entry: 'forge' },
  ],
};
