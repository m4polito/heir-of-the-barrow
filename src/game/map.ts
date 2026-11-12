import type { Dir } from '../engine/constants';
import { TILES, type TileDef } from '../data/tiles';

export type SongId = 'hollowmere';

export interface GameMap {
  id: string;
  width: number;
  height: number;
  tiles: number[];
  music: SongId;
  dark?: boolean;
  entry: Record<string, { x: number; y: number; facing: Dir }>;
}

export function parseAsciiMap(
  rows: string[],
  legend: Record<string, number>,
): { width: number; height: number; tiles: number[] } {
  const width = rows[0]?.length ?? 0;
  const tiles: number[] = [];
  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`Map row ${y} has length ${row.length}, expected ${width}`);
    }
    for (let x = 0; x < row.length; x++) {
      const ch = row.charAt(x);
      const id = legend[ch];
      if (id === undefined) throw new Error(`Unknown map char '${ch}' at row ${y}, column ${x}`);
      tiles.push(id);
    }
  });
  return { width, height: rows.length, tiles };
}

export function tileAt(map: GameMap, x: number, y: number): TileDef | undefined {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return undefined;
  const id = map.tiles[y * map.width + x];
  return id === undefined ? undefined : TILES[id];
}

export function isWalkable(map: GameMap, x: number, y: number): boolean {
  return tileAt(map, x, y)?.walkable ?? false;
}
