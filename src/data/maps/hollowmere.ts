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
  entry: { start: { x: 11, y: 12, facing: 'down' } },
};
