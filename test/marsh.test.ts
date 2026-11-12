import { describe, expect, it } from 'vitest';
import { MAPS } from '../src/data/maps';
import { HOLLOWMERE } from '../src/data/maps/hollowmere';
import { MARSH, MARSH_POINTS } from '../src/data/maps/marsh';
import { MONSTERS } from '../src/data/monsters';
import { BACKDROPS } from '../src/data/sprites/backdrops';
import { SONGS } from '../src/data/songs';
import { TILES, TILE_IDS } from '../src/data/tiles';
import { isWalkable, warpAt, type GameMap } from '../src/game/map';

const key = (x: number, y: number) => `${x},${y}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const tileId = (m: GameMap, x: number, y: number) =>
  x < 0 || y < 0 || x >= m.width || y >= m.height ? -1 : m.tiles[y * m.width + x]!;

function count(m: GameMap, id: number, inner = true): number {
  let n = 0;
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++) {
      if (inner && (x === 0 || y === 0 || x === m.width - 1 || y === m.height - 1)) continue;
      if (tileId(m, x, y) === id) n++;
    }
  return n;
}

function find(m: GameMap, id: number): [number, number][] {
  const out: [number, number][] = [];
  for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) if (tileId(m, x, y) === id) out.push([x, y]);
  return out;
}

/** Breadth-first distances over tiles that satisfy `ok`, from the given starts. */
function bfs(m: GameMap, starts: [number, number][], ok: (x: number, y: number) => boolean): Map<string, number> {
  const dist = new Map<string, number>();
  const queue: [number, number][] = [];
  for (const [x, y] of starts) {
    dist.set(key(x, y), 0);
    queue.push([x, y]);
  }
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i]!;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (!dist.has(key(nx, ny)) && ok(nx, ny)) {
        dist.set(key(nx, ny), dist.get(key(x, y))! + 1);
        queue.push([nx, ny]);
      }
    }
  }
  return dist;
}

const isRoad = (x: number, y: number) => tileId(MARSH, x, y) === TILE_IDS.road;

describe('the Marsh map', () => {
  it('is 48x40, registered, with music and a water border', () => {
    expect(MARSH.width).toBe(48);
    expect(MARSH.height).toBe(40);
    expect(MARSH.tiles.length).toBe(48 * 40);
    expect(MAPS.marsh.id).toBe('marsh');
    expect(SONGS[MARSH.music as keyof typeof SONGS]).toBeDefined();
    expect(MARSH.border).toBe(TILE_IDS.water);
    expect(MARSH.npcs).toEqual([]);
  });

  it('has one town tile, one barrow mouth, a dead tree, and a blocked edge', () => {
    expect(find(MARSH, TILE_IDS.town)).toEqual([[12, 20]]);
    expect(find(MARSH, TILE_IDS.barrowMouth)).toEqual([[40, 6]]);
    expect(find(MARSH, TILE_IDS.deadTree).length).toBeGreaterThanOrEqual(1);
    for (let x = 0; x < MARSH.width; x++) {
      expect(isWalkable(MARSH, x, 0)).toBe(false);
      expect(isWalkable(MARSH, x, MARSH.height - 1)).toBe(false);
    }
    for (let y = 0; y < MARSH.height; y++) {
      expect(isWalkable(MARSH, 0, y)).toBe(false);
      expect(isWalkable(MARSH, MARSH.width - 1, y)).toBe(false);
    }
    for (let y = 0; y < MARSH.height; y++)
      for (let x = 0; x < MARSH.width; x++)
        if (x === 0 || y === 0 || x === MARSH.width - 1 || y === MARSH.height - 1)
          expect([TILE_IDS.water, TILE_IDS.tree]).toContain(tileId(MARSH, x, y));
  });

  it('enters on a road tile below the town, and the town tile warps to the gate', () => {
    const e = MARSH.entry.town!;
    expect(e).toEqual({ x: 12, y: 21, facing: 'down' });
    expect(tileId(MARSH, e.x, e.y)).toBe(TILE_IDS.road);
    const warp = warpAt(MARSH, 12, 20)!;
    expect(warp).toMatchObject({ to: 'hollowmere', entry: 'gate' });
    const landing = HOLLOWMERE.entry.gate!;
    expect(landing).toBeDefined();
    expect(isWalkable(HOLLOWMERE, landing.x, landing.y)).toBe(true);
  });

  it('has an unbroken road from the town to the barrow, passing a dead tree', () => {
    const dist = bfs(MARSH, [[12, 21]], isRoad);
    const barrowNeighbours = DIRS.map(([dx, dy]) => key(40 + dx, 6 + dy));
    expect(barrowNeighbours.some((k) => dist.has(k))).toBe(true);
    const roadSide = [...dist.keys()].map((k) => k.split(',').map(Number) as [number, number]);
    const nearDead = roadSide.some(
      ([x, y]) => x >= 20 && x <= 34 && DIRS.some(([dx, dy]) => tileId(MARSH, x + dx, y + dy) === TILE_IDS.deadTree),
    );
    expect(nearDead).toBe(true);
  });

  it('every walkable tile is reachable from the town entry', () => {
    const e = MARSH.entry.town!;
    const reached = bfs(MARSH, [[e.x, e.y]], (x, y) => isWalkable(MARSH, x, y));
    let walkable = 0;
    for (let y = 0; y < MARSH.height; y++) for (let x = 0; x < MARSH.width; x++) if (isWalkable(MARSH, x, y)) walkable++;
    expect(reached.size).toBe(walkable);
  });

  it('keeps marsh and hill at least four tiles from the town', () => {
    for (let y = 20 - 3; y <= 20 + 3; y++)
      for (let x = 12 - 3; x <= 12 + 3; x++) {
        const id = tileId(MARSH, x, y);
        expect(id).not.toBe(TILE_IDS.marsh);
        expect(id).not.toBe(TILE_IDS.hill);
      }
  });

  it('has enough of each region away from the edge', () => {
    expect(count(MARSH, TILE_IDS.marsh)).toBeGreaterThanOrEqual(150);
    expect(count(MARSH, TILE_IDS.hill)).toBeGreaterThanOrEqual(40);
    expect(count(MARSH, TILE_IDS.water)).toBeGreaterThanOrEqual(60);
    expect(count(MARSH, TILE_IDS.tree)).toBeGreaterThanOrEqual(80);
    expect(count(MARSH, TILE_IDS.road)).toBeGreaterThanOrEqual(50);
  });

  it('has a dead-end copse far from the road', () => {
    const { x, y } = MARSH_POINTS.copse;
    expect(MARSH_POINTS.barrow).toEqual({ x: 40, y: 6 });
    expect(isWalkable(MARSH, x, y)).toBe(true);
    const open = DIRS.filter(([dx, dy]) => isWalkable(MARSH, x + dx, y + dy));
    expect(open.length).toBe(1);
    const trees = DIRS.filter(([dx, dy]) => tileId(MARSH, x + dx, y + dy) === TILE_IDS.tree);
    expect(trees.length).toBeGreaterThanOrEqual(2);
    const fromRoad = bfs(MARSH, find(MARSH, TILE_IDS.road), (nx, ny) => isWalkable(MARSH, nx, ny));
    expect(fromRoad.get(key(x, y))).toBeGreaterThanOrEqual(12);
  });

  it('has a valid encounter table', () => {
    const enc = MARSH.encounters!;
    expect(enc.baseRate).toBe(1 / 16);
    expect(Object.keys(enc.zones).sort()).toEqual(['grass', 'hill', 'marsh', 'road']);
    const names = TILES.map((t) => t.name);
    for (const [zone, z] of Object.entries(enc.zones)) {
      expect(names).toContain(zone);
      expect(Object.keys(BACKDROPS)).toContain(z.backdrop);
      expect(z.monsters.length).toBeGreaterThan(0);
      for (const m of z.monsters) {
        expect(Object.keys(MONSTERS)).toContain(m.monster);
        expect(m.weight).toBeGreaterThan(0);
      }
    }
  });
});

describe('the Hollowmere gate', () => {
  it('has a two-tile south gate warping to the Marsh', () => {
    for (const x of [11, 12]) expect(warpAt(HOLLOWMERE, x, 19)).toMatchObject({ to: 'marsh', entry: 'town' });
    expect(MAPS.marsh.entry.town).toBeDefined();
  });
  it('has a walkable gate entry with nobody standing on it', () => {
    const g = HOLLOWMERE.entry.gate!;
    expect(g).toEqual({ x: 11, y: 18, facing: 'up' });
    expect(isWalkable(HOLLOWMERE, g.x, g.y)).toBe(true);
    expect(HOLLOWMERE.npcs.some((n) => n.x === g.x && n.y === g.y)).toBe(false);
  });
});
