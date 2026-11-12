import { describe, expect, it } from 'vitest';
import { TILES, TILE_IDS } from '../src/data/tiles';

describe('tiles', () => {
  it('has nineteen tiles indexed by id', () => {
    expect(TILES.length).toBe(19);
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
    expect(TILES[TILE_IDS.floorWood]!.walkable).toBe(true);
    for (const id of [TILE_IDS.counter, TILE_IDS.bed, TILE_IDS.table]) expect(TILES[id]!.walkable).toBe(false);
  });

  it('overworld tiles: walkability and encounter rates', () => {
    const t = (id: number) => TILES[id]!;
    expect(t(TILE_IDS.marsh)).toMatchObject({ name: 'marsh', walkable: true, encounterRate: 1.5 });
    expect(t(TILE_IDS.hill)).toMatchObject({ name: 'hill', walkable: true, encounterRate: 1.5 });
    expect(t(TILE_IDS.town)).toMatchObject({ name: 'town', walkable: true, encounterRate: 0 });
    expect(t(TILE_IDS.barrowMouth)).toMatchObject({ name: 'barrowMouth', walkable: false, encounterRate: 0 });
    expect(t(TILE_IDS.deadTree)).toMatchObject({ name: 'deadTree', walkable: false, encounterRate: 0 });
  });
});
