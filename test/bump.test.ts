import { describe, expect, it } from 'vitest';
import { setupRoom, keys } from './helpers/exploreKit';
import { BUMP_REPEAT } from '../src/game/explore';
import { SFX } from '../src/data/sfx';

const npc = { id: 'v', sprite: 'adult', x: 3, y: 2, facing: 'down' as const, wander: false, dialog: 'd' };
// wall to the left of (1,2), water below it, a villager right of (2,2), the map edge is wall too
const cases = {
  wall: { pos: { x: 1, y: 2, facing: 'down' as const }, dir: 'left', npcs: [] },
  water: { pos: { x: 1, y: 2, facing: 'up' as const }, dir: 'down', npcs: [] },
  villager: { pos: { x: 2, y: 2, facing: 'up' as const }, dir: 'right', npcs: [npc] },
};

describe('bump', () => {
  it('repeats every sixteen frames', () => {
    expect(BUMP_REPEAT).toBe(16);
  });

  describe.each(Object.entries(cases))('against %s', (_name, c) => {
    const room = () => setupRoom({ pos: c.pos, npcs: c.npcs });

    it('sounds at once, then every sixteen held updates', () => {
      const t = room();
      t.hold(1, c.dir);
      expect(t.count('bump')).toBe(1);
      t.hold(15, c.dir);
      expect(t.count('bump')).toBe(1);
      t.hold(1, c.dir);
      expect(t.count('bump')).toBe(2);
    });

    it('sounds three times in 48 held updates', () => {
      const t = room();
      t.hold(48, c.dir);
      expect(t.count('bump')).toBe(3);
    });

    it('sounds again at once after a release and a new press', () => {
      const t = room();
      t.hold(3, c.dir);
      expect(t.count('bump')).toBe(1);
      t.hold(1);
      t.hold(1, c.dir);
      expect(t.count('bump')).toBe(2);
    });
  });

  it('plays nothing for a step that succeeds', () => {
    const t = setupRoom({ pos: { x: 3, y: 4, facing: 'up' } });
    t.hold(8, 'right');
    expect(t.explore.hero.x).toBe(4);
    expect(t.count('bump')).toBe(0);
  });

  it('plays on the first refused update after a successful step', () => {
    const t = setupRoom({ pos: { x: 4, y: 4, facing: 'up' } });
    // (5,4) is open, (6,4) is wall: the step takes 8 updates (1 to start, 7 more),
    // the 9th update completes it and is refused at once, so the bump is the 9th update's
    t.hold(8, 'right');
    expect(t.count('bump')).toBe(0);
    t.hold(1, 'right');
    expect(t.explore.hero.x).toBe(5);
    expect(t.count('bump')).toBe(1);
  });

  it('is silent while a dialog is on top', () => {
    const t = setupRoom({ pos: { x: 2, y: 2, facing: 'up' }, triggers: [{ kind: 'look', x: 2, y: 1, dialog: 'n' }], dialogs: { n: ['Hi.'] } });
    t.press('confirm');
    for (let i = 0; i < 40; i++) t.stack.update(keys({ held: ['up'] }));
    expect(t.count('bump')).toBe(0);
  });

  it('is its own sound', () => {
    expect(SFX.bump).toEqual([
      { ch: 'tri', note: 'G2', frames: 3, vol: 10 },
      { ch: 'tri', note: 'D2', frames: 3, vol: 10 },
    ]);
    for (const [id, steps] of Object.entries(SFX)) {
      if (id !== 'bump') expect(JSON.stringify(steps), id).not.toBe(JSON.stringify(SFX.bump));
    }
  });
});
