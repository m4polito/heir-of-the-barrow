import { describe, expect, it } from 'vitest';
import { isWalkable, parseAsciiMap, tileAt } from '../src/game/map';
import { HOLLOWMERE } from '../src/data/maps/hollowmere';
import { TILE_IDS } from '../src/data/tiles';

describe('parseAsciiMap', () => {
  it('parses rows into a flat tile array', () => {
    expect(parseAsciiMap(['ab', 'ba'], { a: 0, b: 1 })).toEqual({ width: 2, height: 2, tiles: [0, 1, 1, 0] });
  });
  it('throws on ragged rows', () => {
    expect(() => parseAsciiMap(['ab', 'a'], { a: 0, b: 1 })).toThrow(/row 1/);
  });
  it('throws on unknown chars', () => {
    expect(() => parseAsciiMap(['az'], { a: 0 })).toThrow(/'z' at row 0, column 1/);
  });
});

describe('HOLLOWMERE', () => {
  it('bounds checks', () => {
    expect(isWalkable(HOLLOWMERE, -1, 0)).toBe(false);
    expect(isWalkable(HOLLOWMERE, 24, 0)).toBe(false);
    expect(tileAt(HOLLOWMERE, 0, 20)).toBeUndefined();
  });
  it('start is walkable and size is 24x20', () => {
    const { x, y } = HOLLOWMERE.entry.start!;
    expect(isWalkable(HOLLOWMERE, x, y)).toBe(true);
    expect(HOLLOWMERE.width).toBe(24);
    expect(HOLLOWMERE.height).toBe(20);
    expect(HOLLOWMERE.tiles.length).toBe(480);
  });
  it('has 4+ doors and exactly one well', () => {
    expect(HOLLOWMERE.tiles.filter((t) => t === TILE_IDS.door).length).toBeGreaterThanOrEqual(4);
    expect(HOLLOWMERE.tiles.filter((t) => t === TILE_IDS.well).length).toBe(1);
  });
  it('every walkable tile is reachable from the start', () => {
    const { x: sx, y: sy } = HOLLOWMERE.entry.start!;
    const seen = new Set<number>([sy * HOLLOWMERE.width + sx]);
    const stack: [number, number][] = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx, ny = y + dy;
        const k = ny * HOLLOWMERE.width + nx;
        if (!seen.has(k) && isWalkable(HOLLOWMERE, nx, ny)) {
          seen.add(k);
          stack.push([nx, ny]);
        }
      }
    }
    let walkable = 0;
    for (let y = 0; y < HOLLOWMERE.height; y++)
      for (let x = 0; x < HOLLOWMERE.width; x++) if (isWalkable(HOLLOWMERE, x, y)) walkable++;
    expect(seen.size).toBe(walkable);
  });
});
