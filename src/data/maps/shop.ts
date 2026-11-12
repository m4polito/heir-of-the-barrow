import { parseAsciiMap, type GameMap } from '../../game/map';
import { INTERIOR_LEGEND } from './legend';

const ROWS = [
  '############',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '#wwcccccccw#',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '#wwwwwwwwww#',
  '######D#####',
];

export const SHOP: GameMap = {
  id: 'shop',
  ...parseAsciiMap(ROWS, INTERIOR_LEGEND),
  music: 'hollowmere',
  entry: {
    door: { x: 6, y: 7, facing: 'up' },
  },
  npcs: [
    { id: 'odo', sprite: 'adult', palette: 2, x: 5, y: 3, facing: 'down', wander: false, dialog: 'odo' },
  ],
  triggers: [
    { kind: 'warp', x: 6, y: 8, to: 'hollowmere', entry: 'shop' },
  ],
};
