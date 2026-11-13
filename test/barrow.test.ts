import { describe, expect, it } from 'vitest';
import { MAPS } from '../src/data/maps';
import { SONGS } from '../src/data/songs';
import { DIALOGS } from '../src/data/dialog/hollowmere';
import { TILE_IDS } from '../src/data/tiles';
import { backdropArt } from '../src/data/sprites/backdrops';
import { bossAt, chestAt, isWalkable, lookAt, warpAt, type GameMap } from '../src/game/map';

const BY_ID: Record<string, GameMap> = MAPS;
const B1 = BY_ID.barrow_1!;
const B2 = BY_ID.barrow_2!;
const FLOORS: [string, GameMap][] = [['barrow_1', B1], ['barrow_2', B2]];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const key = (x: number, y: number) => `${x},${y}`;
const tileId = (m: GameMap, x: number, y: number) => m.tiles[y * m.width + x];

function tilesOf(m: GameMap, id: number): [number, number][] {
  const out: [number, number][] = [];
  m.tiles.forEach((t, i) => {
    if (t === id) out.push([i % m.width, Math.floor(i / m.width)]);
  });
  return out;
}

/** Steps over walkable tiles inside one map, never entering `blocked`. */
function dist(m: GameMap, from: [number, number][], blocked = new Set<string>()): Map<string, number> {
  const d = new Map<string, number>();
  const queue: [number, number][] = [];
  for (const [x, y] of from) {
    d.set(key(x, y), 0);
    queue.push([x, y]);
  }
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i]!;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (d.has(k) || blocked.has(k) || !isWalkable(m, nx, ny)) continue;
      d.set(k, d.get(key(x, y))! + 1);
      queue.push([nx, ny]);
    }
  }
  return d;
}

const entries = (m: GameMap): [number, number][] => Object.values(m.entry).map((e) => [e.x, e.y]);

function openNeighbours(m: GameMap, x: number, y: number): [number, number][] {
  return DIRS.map(([dx, dy]) => [x + dx, y + dy] as [number, number]).filter(([nx, ny]) => isWalkable(m, nx, ny));
}

/** The tile a player stands on to face a non-walkable tile: its single walkable neighbour. */
function facingTile(m: GameMap, x: number, y: number): [number, number] {
  const open = openNeighbours(m, x, y);
  expect(open.length, `${m.id} ${x},${y} has one way in`).toBe(1);
  return open[0]!;
}

/** Shortest walk across maps: a step onto a warp tile lands on the arrival entry. */
function shortestWalk(): { steps: number; tiles: Map<string, [number, number][]> } {
  type Node = { map: string; x: number; y: number };
  const nodeKey = (n: Node) => `${n.map}:${n.x},${n.y}`;
  const start: Node = { map: 'barrow_1', x: B1.entry.mouth!.x, y: B1.entry.mouth!.y };
  const boss = B2.triggers.find((t) => t.kind === 'boss')!;
  const prev = new Map<string, string>([[nodeKey(start), '']]);
  const nodes = new Map<string, Node>([[nodeKey(start), start]]);
  const queue = [start];
  let goal = '';
  for (let i = 0; i < queue.length && !goal; i++) {
    const n = queue[i]!;
    const m = BY_ID[n.map]!;
    for (const [dx, dy] of DIRS) {
      const nx = n.x + dx, ny = n.y + dy;
      if (!isWalkable(m, nx, ny)) continue;
      const warp = warpAt(m, nx, ny);
      const next: Node = warp
        ? { map: warp.to, x: BY_ID[warp.to]!.entry[warp.entry]!.x, y: BY_ID[warp.to]!.entry[warp.entry]!.y }
        : { map: n.map, x: nx, y: ny };
      const nk = nodeKey(next);
      if (prev.has(nk)) continue;
      prev.set(nk, nodeKey(n));
      nodes.set(nk, next);
      if (next.map === 'barrow_2' && next.x === boss.x && next.y === boss.y) goal = nk;
      queue.push(next);
    }
  }
  expect(goal, 'Warden reachable from the mouth').not.toBe('');
  const tiles = new Map<string, [number, number][]>();
  let steps = -1;
  for (let k = goal; k !== ''; k = prev.get(k)!) {
    const n = nodes.get(k)!;
    tiles.set(n.map, [...(tiles.get(n.map) ?? []), [n.x, n.y]]);
    steps++;
  }
  return { steps, tiles };
}

describe('the Barrow floors', () => {
  it.each(FLOORS)('%s is 24x24, dark, registered, with the barrow wall for border', (id, m) => {
    expect(m.id).toBe(id);
    expect(m.width).toBe(24);
    expect(m.height).toBe(24);
    expect(m.dark).toBe(true);
    expect(m.border).toBe(TILE_IDS.barrowWall);
    expect(m.encounters).toEqual({
      baseRate: 1 / 16,
      zones: { barrowFloor: { backdrop: 'barrow', monsters: [{ monster: 'barrow_mireling', weight: 1 }] } },
    });
  });

  it("each Barrow map's music is barrow and that id is in SONGS", () => {
    for (const [, m] of FLOORS) {
      expect(m.music).toBe('barrow');
      expect(Object.keys(SONGS)).toContain(m.music);
    }
  });

  it('every warp between the marsh and the floors lands on a walkable, non-warp tile and round-trips', () => {
    const maps: GameMap[] = [BY_ID.marsh!, B1, B2];
    let seen = 0;
    for (const m of maps)
      for (const t of m.triggers) {
        if (t.kind !== 'warp' || !(t.to.startsWith('barrow') || m.id.startsWith('barrow'))) continue;
        seen++;
        const target = BY_ID[t.to]!;
        const arrival = target.entry[t.entry]!;
        expect(isWalkable(target, arrival.x, arrival.y), `${m.id} to ${t.to}`).toBe(true);
        expect(warpAt(target, arrival.x, arrival.y), `${t.to} arrival is not a warp`).toBeUndefined();
        // The warp on the target that leads back lands beside the tile we left from.
        const back = target.triggers.find((b) => b.kind === 'warp' && b.to === m.id);
        expect(back, `${t.to} leads back to ${m.id}`).toBeDefined();
        if (back && back.kind === 'warp') {
          const home = m.entry[back.entry]!;
          expect(isWalkable(m, home.x, home.y)).toBe(true);
          expect(warpAt(m, home.x, home.y)).toBeUndefined();
          expect(Math.abs(home.x - t.x) + Math.abs(home.y - t.y), `${m.id} return lands beside its warp`).toBe(1);
        }
      }
    expect(seen).toBe(4);
  });

  it('the marsh gains the entry below the barrow mouth, and the mouth warps into floor 1', () => {
    expect(BY_ID.marsh!.entry.barrow).toEqual({ x: 40, y: 7, facing: 'down' });
    expect(warpAt(BY_ID.marsh!, 40, 6)).toMatchObject({ kind: 'warp', to: 'barrow_1', entry: 'mouth' });
    expect(warpAt(B1, B1.entry.mouth!.x, B1.entry.mouth!.y)).toBeUndefined();
    expect(B1.triggers.find((t) => t.kind === 'warp' && t.to === 'marsh')).toMatchObject({ entry: 'barrow' });
  });

  it('the stairs warp with the stairs sound', () => {
    const down = tilesOf(B1, TILE_IDS.stairsDown);
    const up = tilesOf(B2, TILE_IDS.stairsUp);
    expect(down.length).toBe(1);
    expect(up.length).toBe(1);
    expect(warpAt(B1, down[0]![0], down[0]![1])).toEqual({
      kind: 'warp', x: down[0]![0], y: down[0]![1], to: 'barrow_2', entry: 'stairs', sfx: 'stairs',
    });
    expect(warpAt(B2, up[0]![0], up[0]![1])).toEqual({
      kind: 'warp', x: up[0]![0], y: up[0]![1], to: 'barrow_1', entry: 'stairs', sfx: 'stairs',
    });
  });

  it('every warp on a stair tile plays the stairs sound', () => {
    let seen = 0;
    for (const m of Object.values(BY_ID))
      for (const t of m.triggers) {
        if (t.kind !== 'warp') continue;
        const id = tileId(m, t.x, t.y);
        if (id !== TILE_IDS.stairsUp && id !== TILE_IDS.stairsDown) continue;
        seen++;
        expect(t.sfx, `${m.id} ${t.x},${t.y}`).toBe('stairs');
      }
    expect(seen).toBeGreaterThanOrEqual(3);
  });

  it.each(FLOORS)('%s: every walkable tile is reachable from its entries', (_id, m) => {
    const reached = dist(m, entries(m));
    let walkable = 0;
    m.tiles.forEach((_t, i) => {
      if (isWalkable(m, i % m.width, Math.floor(i / m.width))) walkable++;
    });
    expect(reached.size).toBe(walkable);
  });

  it('the chamber on floor 2 is reached only through the Warden tile', () => {
    const boss = B2.triggers.find((t) => t.kind === 'boss')!;
    const [sx, sy] = tilesOf(B2, TILE_IDS.sealedDoor)[0]!;
    const inside = facingTile(B2, sx, sy);
    const stairs = B2.entry.stairs!;
    const blocked = new Set([key(boss.x, boss.y)]);
    const fromStairs = dist(B2, [[stairs.x, stairs.y]], blocked);
    const fromInside = dist(B2, [inside], blocked);
    expect(fromStairs.has(key(inside[0], inside[1]))).toBe(false);
    expect(fromInside.size).toBeGreaterThan(0);
    for (const k of fromInside.keys()) expect(fromStairs.has(k), `chamber tile ${k}`).toBe(false);
    // With the Warden tile open, the chamber joins the rest.
    expect(dist(B2, [[stairs.x, stairs.y]]).has(key(inside[0], inside[1]))).toBe(true);
    expect(tileId(B2, boss.x, boss.y)).toBe(TILE_IDS.barrowFloor);
  });

  it('the chests hold what the design says, each faced from a walkable tile', () => {
    const found = new Map<string, { map: GameMap; gold?: number; item?: string; x: number; y: number }>();
    for (const [, m] of FLOORS)
      for (const t of m.triggers) if (t.kind === 'chest') found.set(t.id, { map: m, gold: t.gold, item: t.item, x: t.x, y: t.y });
    expect([...found.keys()].sort()).toEqual(['barrow_gold', 'barrow_sword', 'barrow_torch']);
    expect(found.get('barrow_gold')).toMatchObject({ map: B1, gold: 90 });
    expect(found.get('barrow_torch')).toMatchObject({ map: B1, item: 'torch' });
    expect(found.get('barrow_sword')).toMatchObject({ map: B2, item: 'bronze_sword' });
    for (const c of found.values()) {
      expect(chestAt(c.map, c.x, c.y)).toBeDefined();
      const [fx, fy] = facingTile(c.map, c.x, c.y);
      expect(isWalkable(c.map, fx, fy)).toBe(true);
    }
  });

  it("the sword's facing tile leads out only along a one-tile corridor of at least 8 tiles", () => {
    const sword = B2.triggers.find((t) => t.kind === 'chest')!;
    let prev: [number, number] = [sword.x, sword.y];
    let cur = facingTile(B2, sword.x, sword.y);
    let run = 0;
    for (;;) {
      const forward = openNeighbours(B2, cur[0], cur[1]).filter(([x, y]) => x !== prev[0] || y !== prev[1]);
      if (forward.length !== 1) break;
      const next = forward[0]!;
      if (openNeighbours(B2, next[0], next[1]).length !== 2) break;
      run++;
      prev = cur;
      cur = next;
    }
    expect(run).toBeGreaterThanOrEqual(8);
  });

  it('the shortest walk from the mouth to the Warden takes 45 to 105 steps', () => {
    const { steps } = shortestWalk();
    expect(steps).toBeGreaterThanOrEqual(45);
    expect(steps).toBeLessThanOrEqual(105);
  });

  it('each chest is a detour of at least 6 steps from the shortest walk', () => {
    const { tiles } = shortestWalk();
    for (const [id, m] of FLOORS) {
      const d = dist(m, tiles.get(id) ?? []);
      for (const t of m.triggers) {
        if (t.kind !== 'chest') continue;
        const face = facingTile(m, t.x, t.y);
        expect(d.get(key(face[0], face[1])), t.id).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it('floor 2 has one boss trigger, one sealed door with a look, and two sconces in the chamber walls', () => {
    const bosses = B2.triggers.filter((t) => t.kind === 'boss');
    expect(bosses.length).toBe(1);
    const boss = bosses[0]!;
    expect(boss).toEqual({
      kind: 'boss', x: boss.x, y: boss.y, monster: 'barrow_warden', backdrop: 'barrow', flag: 'warden_defeated', dialog: 'warden_fallen',
    });
    expect(bossAt(B2, boss.x, boss.y)).toBe(boss);
    expect(bossAt(B2, boss.x + 1, boss.y)).toBeUndefined();
    expect(B1.triggers.some((t) => t.kind === 'boss')).toBe(false);

    const doors = tilesOf(B2, TILE_IDS.sealedDoor);
    expect(doors.length).toBe(1);
    const [dx, dy] = doors[0]!;
    expect(B2.triggers.filter((t) => t.kind === 'look').length).toBe(1);
    expect(lookAt(B2, dx, dy)).toEqual({ kind: 'look', x: dx, y: dy, dialog: 'sealed_door' });
    expect(Object.keys(DIALOGS)).toContain('sealed_door');
    const inside = facingTile(B2, dx, dy);

    const chamber = dist(B2, [inside], new Set([key(boss.x, boss.y)]));
    const sconces = tilesOf(B2, TILE_IDS.sconce);
    expect(sconces.length).toBe(2);
    for (const [sx, sy] of sconces)
      expect(DIRS.some(([ax, ay]) => chamber.has(key(sx + ax, sy + ay))), `sconce ${sx},${sy} borders the chamber`).toBe(true);
  });

  it('floor 1 has no look, boss or sealed door', () => {
    expect(B1.triggers.some((t) => t.kind === 'look' || t.kind === 'boss')).toBe(false);
    expect(tilesOf(B1, TILE_IDS.sealedDoor).length).toBe(0);
  });
});

describe('the barrow backdrop', () => {
  it('is a 16x24 strip, black above row 8, whose left and right columns match so it tiles sideways', () => {
    const art = backdropArt('barrow');
    expect(art.w).toBe(16);
    expect(art.h).toBe(24);
    expect(art.rows.length).toBe(24);
    for (const row of art.rows) expect(row.length).toBe(16);
    for (const row of art.rows.slice(0, 8)) expect(row).toBe('.'.repeat(16));
    expect(art.rows.map((r) => r[0]).join('')).toBe(art.rows.map((r) => r[15]).join(''));
  });
});
