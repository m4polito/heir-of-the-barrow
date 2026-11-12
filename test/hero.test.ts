import { describe, expect, it } from 'vitest';
import type { Dir } from '../src/engine/constants';
import { parseAsciiMap, type GameMap } from '../src/game/map';
import { TILE_IDS } from '../src/data/tiles';
import { HERO_SPRITES } from '../src/data/sprites/hero';
import { STEP_FRAMES, createHero, heroPixelOffset, updateHero, type HeroState } from '../src/game/hero';

const map: GameMap = {
  ...parseAsciiMap(['g#g', 'ggg', 'ggg'], { g: TILE_IDS.grass, '#': TILE_IDS.wall }),
  id: 'test',
  music: 'hollowmere',
  entry: {},
};

const none = () => false;
const holding = (...dirs: Dir[]) => (a: Dir) => dirs.includes(a);
function run(h: HeroState, held: (a: Dir) => boolean, n: number): HeroState {
  for (let i = 0; i < n; i++) h = updateHero(h, held, map);
  return h;
}

describe('hero movement', () => {
  it('idle hero stays put', () => {
    const h = run(createHero(1, 1, 'down'), none, 3);
    expect(h).toMatchObject({ x: 1, y: 1, stepFrame: 0 });
  });
  it('starts a step on the first update', () => {
    const h = run(createHero(0, 1, 'down'), holding('right'), 1);
    expect(h).toMatchObject({ x: 1, stepFrame: STEP_FRAMES, facing: 'right', walkFrame: 1 });
    expect(heroPixelOffset(h)).toEqual({ dx: -16, dy: 0 });
  });
  it('finishes a step after release', () => {
    let h = run(createHero(0, 1, 'down'), holding('right'), 1);
    h = run(h, none, 4);
    expect(h.stepFrame).toBe(4);
    h = run(h, none, 4);
    expect(h).toMatchObject({ x: 1, stepFrame: 0 });
    expect(heroPixelOffset(h)).toEqual({ dx: 0, dy: 0 });
  });
  it('chains steps with no idle tick', () => {
    let h = run(createHero(0, 1, 'down'), holding('right'), 9);
    expect(h).toMatchObject({ x: 2, stepFrame: STEP_FRAMES });
    h = run(h, holding('right'), 8);
    expect(h).toMatchObject({ x: 2, stepFrame: 0 });
  });
  it('turns without moving into a wall', () => {
    const h = run(createHero(1, 1, 'down'), holding('up'), 1);
    expect(h).toMatchObject({ facing: 'up', x: 1, y: 1, stepFrame: 0 });
  });
  it('does not leave the map', () => {
    const h = run(createHero(0, 1, 'down'), holding('left'), 1);
    expect(h).toMatchObject({ facing: 'left', x: 0, y: 1, stepFrame: 0 });
  });
  it('prefers up over right', () => {
    const h = run(createHero(1, 1, 'down'), holding('up', 'right'), 1);
    expect(h).toMatchObject({ facing: 'up', x: 1, y: 1, stepFrame: 0 });
  });
  it('does not mutate its input', () => {
    const h = createHero(0, 1, 'down');
    const before = structuredClone(h);
    updateHero(h, holding('right'), map);
    expect(h).toEqual(before);
  });
});

describe('HERO_SPRITES', () => {
  it('every frame is 16x16', () => {
    for (const dir of ['up', 'down', 'left', 'right'] as Dir[]) {
      expect(HERO_SPRITES[dir]).toHaveLength(2);
      for (const art of HERO_SPRITES[dir]) {
        expect(art.w).toBe(16);
        expect(art.h).toBe(16);
        expect(art.rows).toHaveLength(16);
        for (const row of art.rows) expect(row).toHaveLength(16);
      }
    }
  });
});
