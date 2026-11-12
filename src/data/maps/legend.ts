import { TILE_IDS } from '../tiles';

export const INTERIOR_LEGEND: Record<string, number> = {
  '#': TILE_IDS.wall,
  w: TILE_IDS.floorWood,
  c: TILE_IDS.counter,
  b: TILE_IDS.bed,
  T: TILE_IDS.table,
  D: TILE_IDS.door,
};
