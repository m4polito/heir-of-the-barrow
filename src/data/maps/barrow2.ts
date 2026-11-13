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

// 24 x 24, dark. Floor 2: from the stair at the top right the main corridor runs south and west
// to the Warden's tile, which stands in the one doorway of a small chamber at the bottom; its far
// wall is the sealed door, a sconce on either side. A long side corridor to the west holds the sword.
const ROWS = [
  '########################',
  '########################',
  '####################^###',
  '####################.###',
  '####################.###',
  '####################.###',
  '####################.###',
  '####################.###',
  '##############.......###',
  '##############.##.######',
  '###C...........##.######',
  '##############.##.######',
  '##############.#########',
  '########.......#########',
  '########.##.############',
  '########.##.############',
  '########.###############',
  '########...#############',
  '########.###############',
  '########.###############',
  '#######...##############',
  '#######...##############',
  '#######...##############',
  '#######LSL##############',
];

export const BARROW_2: GameMap = {
  id: 'barrow_2',
  ...parseAsciiMap(ROWS, LEGEND),
  music: 'barrow',
  dark: true,
  border: TILE_IDS.barrowWall,
  entry: {
    stairs: { x: 20, y: 3, facing: 'down' },
  },
  npcs: [],
  triggers: [
    { kind: 'warp', x: 20, y: 2, to: 'barrow_1', entry: 'stairs', sfx: 'stairs' },
    { kind: 'chest', x: 3, y: 10, id: 'barrow_sword', item: 'bronze_sword' },
    {
      kind: 'boss',
      x: 8,
      y: 19,
      monster: 'barrow_warden',
      backdrop: 'barrow',
      flag: 'warden_defeated',
      dialog: 'warden_fallen',
    },
    { kind: 'look', x: 8, y: 23, dialog: 'sealed_door' },
  ],
  encounters: {
    baseRate: 1 / 16,
    zones: {
      barrowFloor: { backdrop: 'barrow', monsters: [{ monster: 'barrow_mireling', weight: 1 }] },
    },
  },
};
