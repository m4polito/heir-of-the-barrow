import { TILE_IDS } from '../tiles';
import { parseAsciiMap, type GameMap } from '../../game/map';

const LEGEND: Record<string, number> = {
  g: TILE_IDS.grass,
  '.': TILE_IDS.road,
  '~': TILE_IDS.water,
  t: TILE_IDS.tree,
  '#': TILE_IDS.wall,
  _: TILE_IDS.floor,
  D: TILE_IDS.door,
  W: TILE_IDS.well,
  s: TILE_IDS.sign,
  '^': TILE_IDS.roof,
};

const ROWS = [
  '########################',
  '#ttggggggggggggggggggtt#',
  '#tggggggg^^^^^^gggggggt#',
  '#gggggggg^^^^^^gggggggg#',
  '#gggggggg###D##gggggggg#',
  '#ggggg............ggggg#',
  '#gggggggggg..gggggggggg#',
  '#g^^^^^gggg..gggg^^^^^g#',
  '#g^^^^^gggg..gggg^^^^^g#',
  '#g##D##gggg..gggg##D##g#',
  '#......................#',
  '#ggggggg...W....ggggggg#',
  '#ggggggg........ggggggg#',
  '#ggggggg........ggggggg#',
  '#g^^^^^gggg..gggg~~~ggg#',
  '#g^^^^^gggg..gggg~~~ggg#',
  '#g##D##gggg..gggggggggg#',
  '#t....................t#',
  '#ttgggggggs..ggggggggtt#',
  '###########..###########',
];

export const HOLLOWMERE: GameMap = {
  id: 'hollowmere',
  ...parseAsciiMap(ROWS, LEGEND),
  music: 'hollowmere',
  entry: {
    start: { x: 11, y: 12, facing: 'down' },
    elder_house: { x: 12, y: 5, facing: 'down' },
    inn: { x: 4, y: 10, facing: 'down' },
    forge: { x: 19, y: 10, facing: 'down' },
    shop: { x: 4, y: 17, facing: 'down' },
    gate: { x: 11, y: 18, facing: 'up' },
  },
  npcs: [
    { id: 'pip', sprite: 'child', x: 13, y: 11, facing: 'down', wander: true, dialog: 'pip' },
    { id: 'bram', sprite: 'guard', x: 12, y: 18, facing: 'down', wander: false, dialog: 'bram' },
    { id: 'tobin', sprite: 'squire', x: 4, y: 6, facing: 'down', wander: false, dialog: 'tobin' },
    { id: 'villager_a', sprite: 'adult', x: 5, y: 12, facing: 'down', wander: true, dialog: 'villager_a' },
    { id: 'villager_b', sprite: 'adult', x: 20, y: 12, facing: 'down', wander: true, dialog: 'villager_b' },
  ],
  triggers: [
    { kind: 'warp', x: 12, y: 4, to: 'elder_house', entry: 'door' },
    { kind: 'warp', x: 4, y: 9, to: 'inn', entry: 'door' },
    { kind: 'warp', x: 19, y: 9, to: 'forge', entry: 'door' },
    { kind: 'warp', x: 4, y: 16, to: 'shop', entry: 'door' },
    { kind: 'warp', x: 11, y: 19, to: 'marsh', entry: 'town' },
    { kind: 'warp', x: 12, y: 19, to: 'marsh', entry: 'town' },
  ],
};
