import { describe, expect, it } from 'vitest';
import { MAPS } from '../src/data/maps';
import { DIALOGS } from '../src/data/dialog/hollowmere';
import { NPC_SPRITES } from '../src/data/sprites/npcs';
import { STORY } from '../src/data/story';
import { TILE_IDS } from '../src/data/tiles';
import { isWalkable, warpAt, type GameMap } from '../src/game/map';

const BY_ID: Record<string, GameMap> = MAPS;
const ALL = Object.entries(BY_ID);
const INTERIORS = ALL.filter(([id]) => id !== 'hollowmere' && id !== 'marsh');
const key = (x: number, y: number) => `${x},${y}`;

function reach(map: GameMap, sx: number, sy: number): Set<string> {
  const seen = new Set([key(sx, sy)]);
  const stack: [number, number][] = [[sx, sy]];
  while (stack.length) {
    const [x, y] = stack.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx, ny = y + dy;
      if (!seen.has(key(nx, ny)) && isWalkable(map, nx, ny)) {
        seen.add(key(nx, ny));
        stack.push([nx, ny]);
      }
    }
  }
  return seen;
}

describe('map registry', () => {
  it('has all six maps keyed by id', () => {
    expect(Object.keys(MAPS).sort()).toEqual(['elder_house', 'forge', 'hollowmere', 'inn', 'marsh', 'shop']);
    for (const [id, map] of ALL) expect(map.id).toBe(id);
  });
  it('every warp targets an existing map and entry', () => {
    for (const [, map] of ALL)
      for (const t of map.triggers) {
        if (t.kind !== 'warp') continue;
        const target = BY_ID[t.to];
        expect(target, t.to).toBeDefined();
        expect(target!.entry[t.entry], `${t.to}/${t.entry}`).toBeDefined();
      }
  });
});

describe('interiors', () => {
  it.each(INTERIORS)('%s is 12x9 with one door and a connected floor', (_id, map) => {
    expect(map.width).toBe(12);
    expect(map.height).toBe(9);
    expect(map.tiles.filter((t) => t === TILE_IDS.door).length).toBe(1);
    const door = map.entry.door!;
    expect(isWalkable(map, door.x, door.y)).toBe(true);
    let walkable = 0;
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) if (isWalkable(map, x, y)) walkable++;
    const reached = reach(map, door.x, door.y);
    expect(reached.size).toBe(walkable);
    for (const e of Object.values(map.entry)) expect(reached.has(key(e.x, e.y))).toBe(true);
  });
  it('every door-tile warp is walkable, every door tile has a warp, and only gate and town warps are off doors', () => {
    const offDoor: string[] = [];
    for (const [id, map] of ALL) {
      const doors = new Set<string>();
      map.tiles.forEach((t, i) => {
        if (t === TILE_IDS.door) doors.add(key(i % map.width, Math.floor(i / map.width)));
      });
      const warps = new Set<string>();
      for (const t of map.triggers) {
        if (t.kind !== 'warp') continue;
        warps.add(key(t.x, t.y));
        expect(isWalkable(map, t.x, t.y), `${id} warp ${t.x},${t.y} walkable`).toBe(true);
        if (!doors.has(key(t.x, t.y))) offDoor.push(`${id}@${t.x},${t.y}`);
      }
      for (const d of doors) expect(warps.has(d), `${id} door ${d} has warp`).toBe(true);
    }
    expect(offDoor.sort()).toEqual(['hollowmere@11,19', 'hollowmere@12,19', 'marsh@12,20']);
  });
  it('hollowmere has six warps: four doors and the two-tile south gate', () => {
    expect(MAPS.hollowmere.triggers.filter((t) => t.kind === 'warp').length).toBe(6);
  });
  it('doors round-trip through hollowmere', () => {
    const outside = MAPS.hollowmere;
    let visited = 0;
    const isDoor = (x: number, y: number) => outside.tiles[y * outside.width + x] === TILE_IDS.door;
    for (const t of outside.triggers) {
      if (t.kind !== 'warp' || !isDoor(t.x, t.y)) continue;
      visited++;
      const inside = BY_ID[t.to]!;
      const door = inside.entry[t.entry]!;
      expect(isWalkable(inside, door.x, door.y)).toBe(true);
      const back = warpAt(inside, door.x, door.y + 1)!;
      expect(back.to).toBe('hollowmere');
      expect(back.entry).toBe(t.to);
      const landing = outside.entry[back.entry]!;
      expect(isWalkable(outside, landing.x, landing.y)).toBe(true);
      expect(landing).toMatchObject({ x: t.x, y: t.y + 1, facing: 'down' });
    }
    expect(visited).toBe(4);
  });
});

describe('npc placements', () => {
  it.each(ALL)('%s: no NPC on a door, entry, or warp tile, none sharing a tile', (_id, map) => {
    const blocked = new Set<string>();
    map.tiles.forEach((t, i) => {
      if (t === TILE_IDS.door) blocked.add(key(i % map.width, Math.floor(i / map.width)));
    });
    for (const e of Object.values(map.entry)) blocked.add(key(e.x, e.y));
    for (const t of map.triggers) if (t.kind === 'warp') blocked.add(key(t.x, t.y));
    const seen = new Set<string>();
    for (const n of map.npcs) {
      expect(blocked.has(key(n.x, n.y)), n.id).toBe(false);
      expect(seen.has(key(n.x, n.y)), n.id).toBe(false);
      expect(isWalkable(map, n.x, n.y), n.id).toBe(true);
      seen.add(key(n.x, n.y));
    }
  });
  it('every NPC has a dialog and a known sprite', () => {
    for (const [, map] of ALL)
      for (const n of map.npcs) {
        expect(Object.keys(DIALOGS)).toContain(n.dialog);
        expect(Object.keys(NPC_SPRITES)).toContain(n.sprite);
      }
  });
  it('places all nine townsfolk once', () => {
    const ids = ALL.flatMap(([, m]) => m.npcs.map((n) => n.id)).sort();
    expect(ids).toEqual(['bram', 'garrik', 'hesta', 'maren', 'odo', 'pip', 'tobin', 'villager_a', 'villager_b']);
  });
});

describe('story config', () => {
  it('new game entry exists', () => {
    expect(BY_ID[STORY.newGame.map]!.entry[STORY.newGame.entry]).toBeDefined();
  });
  it('opening scene is an auto trigger', () => {
    expect(BY_ID[STORY.opening.map]!.triggers).toContainEqual({
      kind: 'auto',
      flag: STORY.opening.flag,
      dialog: STORY.opening.dialog,
    });
    expect(Object.keys(DIALOGS)).toContain(STORY.opening.dialog);
  });
  it('home entry exists', () => {
    expect(BY_ID[STORY.home.map]!.entry[STORY.home.entry]).toBeDefined();
  });
  it('respawn entry and dialog exist', () => {
    expect(BY_ID[STORY.respawn.map]!.entry[STORY.respawn.entry]).toBeDefined();
    expect(Object.keys(DIALOGS)).toContain(STORY.respawn.dialog);
  });
});

// Vite reads the sources as raw text (the project has no Node typings, so no fs).
const SOURCES = import.meta.glob<string>(['../src/game/**/*.ts', '../src/engine/**/*.ts', '../src/ui/**/*.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('story-free engine', () => {
  const files = Object.entries(SOURCES);
  it('src/game, src/engine and src/ui mention no story names', () => {
    const banned = ["'hollowmere'", "'elder_house'", "'maren", "'aldric", "'mireling", "'marsh'", "'intro_done'", 'dimming', "'ember'", "'homeward'", "'herb'", "'forge'", "'goods'", "'wooden_club'", "'garrik", "'odo'", "'hesta", "'inn'"];
    expect(files.length).toBeGreaterThan(10);
    for (const [file, text] of files)
      for (const b of banned) expect(text.includes(b), `${file} contains ${b}`).toBe(false);
  });
  it('imports no story data tables, not even as types', () => {
    const forbidden = /(?:from|import)\s*\(?\s*['"][^'"]*data\/(items|maps|dialog|songs|story|monsters|spells|shops)\b/;
    for (const [file, text] of files) expect(forbidden.test(text), `${file} imports story data`).toBe(false);
  });
});
