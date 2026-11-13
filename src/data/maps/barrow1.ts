import { TILE_IDS } from '../tiles';
import { parseAsciiMap, type GameMap } from '../../game/map';

const LEGEND: Record<string, number> = {
  '#': TILE_IDS.barrowWall,
  '.': TILE_IDS.barrowFloor,
  v: TILE_IDS.stairsDown,
  '^': TILE_IDS.stairsUp,
  C: TILE_IDS.chest,
  S: TILE_IDS.sealedDoor,
  L: TILE_IDS.sconce,
};

// 24 x 24, dark. Floor 1: the way in is at the bottom left (the exit stair beside the mouth) and
// the main corridor climbs north-east in steps of east, then north, to the stair down at the top
// right. Two side corridors end at chests; three short stubs go nowhere.
const ROWS = [
  '########################',
  '########################',
  '####################v###',
  '####################.###',
  '##################.#.###',
  '##################.#.###',
  '###############......###',
  '###############.########',
  '###############.......C#',
  '###############.########',
  '###############.########',
  '#########.......########',
  '#########.##.###########',
  '##C.......##.###########',
  '#########.##.###########',
  '#########.##############',
  '###.......##############',
  '###.####################',
  '#...####################',
  '###.####################',
  '###.####################',
  '###.####################',
  '###^####################',
  '########################',
];

export const BARROW_1: GameMap = {
  id: 'barrow_1',
  ...parseAsciiMap(ROWS, LEGEND),
  music: 'barrow',
  dark: true,
  border: TILE_IDS.barrowWall,
  entry: {
    mouth: { x: 3, y: 21, facing: 'up' },
    stairs: { x: 20, y: 3, facing: 'down' },
  },
  npcs: [],
  triggers: [
    { kind: 'warp', x: 3, y: 22, to: 'marsh', entry: 'barrow', sfx: 'stairsUp' },
    { kind: 'warp', x: 20, y: 2, to: 'barrow_2', entry: 'stairs', sfx: 'stairs' },
    { kind: 'chest', x: 2, y: 13, id: 'barrow_gold', gold: 90 },
    { kind: 'chest', x: 22, y: 8, id: 'barrow_torch', item: 'torch' },
  ],
  encounters: {
    baseRate: 1 / 16,
    zones: {
      barrowFloor: { backdrop: 'barrow', monsters: [{ monster: 'barrow_mireling', weight: 1 }] },
    },
  },
};
