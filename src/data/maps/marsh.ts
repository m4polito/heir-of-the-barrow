import { TILE_IDS } from '../tiles';
import { parseAsciiMap, type GameMap } from '../../game/map';

const LEGEND: Record<string, number> = {
  g: TILE_IDS.grass,
  '.': TILE_IDS.road,
  '~': TILE_IDS.water,
  t: TILE_IDS.tree,
  m: TILE_IDS.marsh,
  h: TILE_IDS.hill,
  H: TILE_IDS.town,
  B: TILE_IDS.barrowMouth,
  w: TILE_IDS.deadTree,
};

// 48 x 40. Grassland round Hollowmere (the town tile, west of centre), a wide marsh across
// the middle that the road threads through, hills to the north and east, and the barrow
// mound in the north-east. A dead willow stands by the road half-way; a walled-in copse
// in the south-west is a dead end kept for a later chest.
const ROWS = [
  't~~~ttttttt~~~~~~~~~~~tttttttttttttttttttttttttt',
  'ttttgttggttgttthhhhhhhhhggghhhhhhhttthhhhhhhhhtt',
  'ttgggggggggggghhhhhhhhhhhghhhhhhhhhgghhhhhhhhhgt',
  'tggggggggggghhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhht',
  'ttggggggggghhhhhhhhhhhhhgghhhhhhhhhgghhhhhhhhhgt',
  'tggggggggggghhhgggttggggggghhhhhhhttghggggghhhtt',
  'tggg~~~~ggggggggggttgggghhhgghhhgghhhgggBgghhhgt',
  'tgg~~~~~~gggggggggttgghhhhhhhgggghhh.....ggghhht',
  'ttgg~~~~ggggggttgggggggghhhggggggghh.ggggggghhht',
  'ttggggggggggggttgggggggggggmmmmmmmgg.gggggghhhht',
  '~tggggggggggggttggggggggggmmmmmmmmmg.gggggghhhht',
  '~tggggggggggggttgggggggggggmmmmmmmgg.gggggghhhh~',
  '~ttttgggg~~~ggttggggggmgggggmmmmmmmm.gggggghhhh~',
  '~ttttggg~~~~~gttgggmmmmmmmgmmmmmmmmm.mggggghhhh~',
  '~ttttgggg~~~ggggggmmmmmmmmmmmmmm~~~m.mmgggghhhh~',
  '~tgtggggggggggggggmmmm~mmmmmmmm~~~~~.mggggghhhh~',
  '~ggtgggggggggggggmmmm~~~mmmmmmmw~~~m.gggggghhhh~',
  '~tggggggggggggggttmmmm~mmm...........ggggtghhhht',
  '~gggggggttggggggttmmmmmmmm.mmmmmmmmmggggggghhhht',
  '~tggggggttggggggttgmmmmmmm.mmmmmmmmmmmgggghhthht',
  '~tggggggggggHgggggmmmmmmmm.mmmmmmmmmmmmgghhhhhgt',
  '~ggggggggggg..gggmmmmmmmmm.wmmmmmmmmmmmgghhhhhtt',
  '~tttggttgggg..gggmmmmmmmmm.mmmmmmmmmmmmmghhhhhtt',
  'ttttggttgggg..gggmmmmmmmmm.mmmmmmmmmmmmggghhhggt',
  'ttttgggggggg..ggggmmmmmmmm.mmmmmmmmmmmmgggghgggt',
  'ttgggggggggg...............mmmmmmmmmmmggtgggggtt',
  'tttggggggggg.......mmmmmmmmmmmmmm~~~mmmggggggggt',
  'tttggggggggggggtgmmmmmmmmmmmmmmm~~~~~mmgggtttttt',
  'ttggggggtgtgtggtggmmmmmmmmmmmmmmm~~~mmmmggtttttt',
  'tggggggggggggggtggmmmmm~~~mmmmmmmmmmmmmgtgggggtt',
  'ttgggg~ggggggggggggmmm~~~~~mmmmmmmmmmmmttgg~gggt',
  'tggg~~~~~ggggggtgggggmm~~~mmmmmmmmmmmmttt~~~~~tt',
  'tggg~~~~~ggggggtggggmmmmmmmmmmmmmmmmmggg~~~~~~~t',
  'tttgttt~~ggggggtgggmmmmmmmmmmmmggmmmmmmmg~~~~~tt',
  'tttgttttttttttgtggggmmmmmmmmmgggmmmmmmmmmgg~tttt',
  'tttgttttttttttgggtttgmmmmmmmgggggmmmmmmmggtttttt',
  'tttgttttttttttgtgtttggggmgggggggggggmgggttttttt~',
  'ttttttttttttttgtgtttggggggggggggggggggtgttttttt~',
  'ttttttttttttttttgttttggtttttttttttttggttttttttt~',
  't~~~~~~~~~ttttttt~~~~~~tttt~~~~~~~~~~~~~tttttttt',
];

/** Places later phases refer to. */
export const MARSH_POINTS = {
  copse: { x: 3, y: 36 },
  barrow: { x: 40, y: 6 },
};

const GRASS_ZONE = { backdrop: 'grass', monsters: [{ monster: 'mireling', weight: 1 }] };

export const MARSH: GameMap = {
  id: 'marsh',
  ...parseAsciiMap(ROWS, LEGEND),
  music: 'marsh',
  border: TILE_IDS.water,
  entry: {
    town: { x: 12, y: 21, facing: 'down' },
  },
  npcs: [],
  triggers: [{ kind: 'warp', x: 12, y: 20, to: 'hollowmere', entry: 'gate' }],
  encounters: {
    baseRate: 1 / 16,
    zones: {
      grass: GRASS_ZONE,
      road: GRASS_ZONE,
      marsh: { backdrop: 'murk', monsters: [{ monster: 'bog_mireling', weight: 1 }] },
      hill: { backdrop: 'grass', monsters: [{ monster: 'bog_mireling', weight: 1 }] },
    },
  },
};
