import type { Dir } from '../engine/constants';
import { TILES, type TileDef } from '../data/tiles';
import type { SfxId } from '../data/sfx';

export interface NpcPlacement {
  id: string;
  sprite: string;
  /** Palette swap index for the adult body: 0 default, 1, 2. */
  palette?: number;
  x: number;
  y: number;
  facing: Dir;
  wander: boolean;
  dialog: string;
}

export interface WarpTrigger {
  kind: 'warp';
  x: number;
  y: number;
  to: string;
  entry: string;
  /** Sound on stepping through; the door by default. */
  sfx?: SfxId;
}

export interface AutoTrigger {
  kind: 'auto';
  flag: string;
  dialog: string;
}

/** A chest on the tile: exactly one of `gold` and `item`. Opened state is the flag `chestFlag(id)`. */
export interface ChestTrigger {
  kind: 'chest';
  x: number;
  y: number;
  id: string;
  gold?: number;
  item?: string;
}

/** Something to look at on the tile: confirm while facing it shows this dialog. */
export interface LookTrigger {
  kind: 'look';
  x: number;
  y: number;
  dialog: string;
}

export type Trigger = WarpTrigger | AutoTrigger | ChestTrigger | LookTrigger;

export interface EncounterEntry {
  monster: string;
  weight: number;
}

export interface EncounterZone {
  backdrop: string;
  monsters: EncounterEntry[];
}

export interface EncounterTable {
  baseRate: number;
  /** Zones keyed by `TileDef.name`. */
  zones: Record<string, EncounterZone>;
}

export interface GameMap {
  id: string;
  width: number;
  height: number;
  tiles: number[];
  music: string;
  dark?: boolean;
  entry: Record<string, { x: number; y: number; facing: Dir }>;
  npcs: NpcPlacement[];
  triggers: Trigger[];
  encounters?: EncounterTable;
  /** Tile id drawn outside the map's bounds. */
  border?: number;
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

export function warpAt(map: GameMap, x: number, y: number): WarpTrigger | undefined {
  for (const t of map.triggers) {
    if (t.kind === 'warp' && t.x === x && t.y === y) return t;
  }
  return undefined;
}

export function chestAt(map: GameMap, x: number, y: number): ChestTrigger | undefined {
  for (const t of map.triggers) {
    if (t.kind === 'chest' && t.x === x && t.y === y) return t;
  }
  return undefined;
}

export function lookAt(map: GameMap, x: number, y: number): LookTrigger | undefined {
  for (const t of map.triggers) {
    if (t.kind === 'look' && t.x === x && t.y === y) return t;
  }
  return undefined;
}

export function chestFlag(id: string): string {
  return 'chest_' + id;
}
