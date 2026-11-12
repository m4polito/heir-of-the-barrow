import { describe, expect, it } from 'vitest';
import { TILES, TILE_IDS } from '../src/data/tiles';

describe('tiles', () => {
  it('has ten tiles indexed by id', () => {
    expect(TILES.length).toBe(10);
    TILES.forEach((t, i) => expect(t.id).toBe(i));
  });

  it('every frame is 16x16', () => {
    for (const t of TILES) {
      for (const f of t.frames) {
        expect(f.w).toBe(16);
        expect(f.h).toBe(16);
        expect(f.rows.length).toBe(16);
        for (const r of f.rows) expect(r.length).toBe(16);
      }
    }
  });

  it('water has two frames', () => {
    expect(TILES[TILE_IDS.water]!.frames.length).toBe(2);
  });

  it('walkability', () => {
    expect(TILES[TILE_IDS.grass]!.walkable).toBe(true);
    expect(TILES[TILE_IDS.wall]!.walkable).toBe(false);
  });
});
