import { describe, expect, it } from 'vitest';
import type { Dir } from '../src/engine/constants';
import { isWalkable, parseAsciiMap, type GameMap } from '../src/game/map';
import { TILE_IDS } from '../src/data/tiles';
import { HERO_SPRITES } from '../src/data/sprites/hero';
import { STEP_FRAMES, createHero, facingTile, heroIdle, heroPixelOffset, opposite, updateHero, type HeroState } from '../src/game/hero';

const map: GameMap = {
  ...parseAsciiMap(['g#g', 'ggg', 'ggg'], { g: TILE_IDS.grass, '#': TILE_IDS.wall }),
  id: 'test',
  music: 'hollowmere',
  entry: {},
  npcs: [],
  triggers: [],
};

const canEnter = (x: number, y: number) => isWalkable(map, x, y);

const none = () => false;
const holding = (...dirs: Dir[]) => (a: Dir) => dirs.includes(a);
function run(h: HeroState, held: (a: Dir) => boolean, n: number): HeroState {
  for (let i = 0; i < n; i++) h = updateHero(h, held, canEnter);
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
    updateHero(h, holding('right'), canEnter);
    expect(h).toEqual(before);
  });
});

describe('hero arrive hook and helpers', () => {
  function arrive(onArrive: (x: number, y: number) => boolean) {
    const calls: [number, number][] = [];
    let h = createHero(0, 1, 'down');
    h = updateHero(h, holding('right'), canEnter, (x, y) => (calls.push([x, y]), onArrive(x, y)));
    for (let i = 0; i < STEP_FRAMES; i++) h = updateHero(h, holding('right'), canEnter, (x, y) => (calls.push([x, y]), onArrive(x, y)));
    return { h, calls };
  }
  it('calls onArrive once with the new tile on the tick the step completes', () => {
    const { calls } = arrive(() => false);
    expect(calls).toEqual([[1, 1]]);
  });
  it('does not call onArrive mid-step', () => {
    const calls: [number, number][] = [];
    let h = createHero(0, 1, 'down');
    for (let i = 0; i < STEP_FRAMES - 1; i++) h = updateHero(h, holding('right'), canEnter, (x, y) => (calls.push([x, y]), false));
    expect(calls).toEqual([]);
  });
  it('returning true stops the chain and leaves the hero idle', () => {
    const { h } = arrive(() => true);
    expect(h).toMatchObject({ x: 1, y: 1, stepFrame: 0 });
  });
  it('returning false chains into the next step', () => {
    const { h } = arrive(() => false);
    expect(h).toMatchObject({ x: 2, y: 1, stepFrame: STEP_FRAMES });
  });
  it('facingTile, opposite, heroIdle', () => {
    expect(facingTile(createHero(1, 1, 'up'))).toEqual({ x: 1, y: 0 });
    expect(opposite('left')).toBe('right');
    expect(opposite('up')).toBe('down');
    expect(heroIdle(createHero(1, 1, 'up'))).toBe(true);
    expect(heroIdle({ ...createHero(1, 1, 'up'), stepFrame: 3 })).toBe(false);
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
