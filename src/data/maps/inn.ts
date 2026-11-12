import { parseAsciiMap, type GameMap } from '../../game/map';
import { INTERIOR_LEGEND } from './legend';

const ROWS = [
  '############',
  '#wwwwwwwbbb#',
  '#wwwwwwwwww#',
  '#wwcccccwww#',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '#####D######',
];

export const INN: GameMap = {
  id: 'inn',
  ...parseAsciiMap(ROWS, INTERIOR_LEGEND),
  music: 'hollowmere',
  entry: {
    door: { x: 6, y: 7, facing: 'up' },
  },
  npcs: [
    { id: 'hesta', sprite: 'adult', palette: 1, x: 5, y: 2, facing: 'down', wander: false, dialog: 'hesta' },
  ],
  triggers: [
    { kind: 'warp', x: 6, y: 8, to: 'hollowmere', entry: 'inn' },
  ],
};
