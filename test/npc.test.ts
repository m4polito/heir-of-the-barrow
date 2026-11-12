import { describe, expect, it } from 'vitest';
import { createRng } from '../src/engine/rng';
import { createNpc, updateNpc, npcPixelOffset } from '../src/game/npc';
import { adultPalette, npcArt } from '../src/data/sprites/npcs';
import type { NpcPlacement } from '../src/game/map';

const def = (wander: boolean): NpcPlacement => ({
  id: 'n', sprite: 'adult', x: 3, y: 3, facing: 'down', wander, dialog: 'd',
});
const open = (x: number, y: number) => x >= 0 && y >= 0 && x < 7 && y < 7;

describe('npc wander', () => {
  it('starts at its placement', () => {
    const n = createNpc(def(true));
    expect([n.x, n.y, n.facing, n.stepFrame, n.walkFrame, n.wait]).toEqual([3, 3, 'down', 0, 0, 60]);
  });
  it('a non-wander npc never moves', () => {
    const rng = createRng(1);
    let n = createNpc(def(false));
    for (let i = 0; i < 600; i++) n = updateNpc(n, rng, open);
    expect([n.x, n.y]).toEqual([3, 3]);
  });
  it('a wander npc stays within 2 tiles of home and does move', () => {
    const rng = createRng(1);
    let n = createNpc(def(true));
    let moved = false;
    for (let i = 0; i < 2000; i++) {
      n = updateNpc(n, rng, open);
      if (n.x !== 3 || n.y !== 3) moved = true;
      expect(Math.max(Math.abs(n.x - 3), Math.abs(n.y - 3))).toBeLessThanOrEqual(2);
    }
    expect(moved).toBe(true);
  });
  it('with canEnter always false it never moves but still turns', () => {
    const rng = createRng(1);
    let n = createNpc(def(true));
    const facings = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      n = updateNpc(n, rng, () => false);
      facings.add(n.facing);
    }
    expect([n.x, n.y]).toEqual([3, 3]);
    expect(facings.size).toBeGreaterThan(1);
  });
  it('calls canEnter with the target tile', () => {
    const rng = createRng(1);
    const seen: [number, number][] = [];
    let n = createNpc(def(true));
    for (let i = 0; i < 300; i++) {
      n = updateNpc(n, rng, (x, y) => (seen.push([x, y]), false));
    }
    expect(seen.length).toBeGreaterThan(0);
    for (const [x, y] of seen) expect(Math.abs(x - 3) + Math.abs(y - 3)).toBe(1);
  });
  it('does not mutate its input and offsets while stepping', () => {
    const n = { ...createNpc(def(true)), wait: 0 };
    const snap = { ...n };
    const m = updateNpc(n, createRng(2), open);
    expect(n).toEqual(snap);
    if (m.stepFrame > 0) {
      const o = npcPixelOffset(m);
      expect(Math.abs(o.dx) + Math.abs(o.dy)).toBeGreaterThan(0);
    }
  });
});

describe('npc art', () => {
  it('adultPalette swaps the tunic colour', () => {
    expect(adultPalette(0).t).toBe(10);
    expect(adultPalette(1).t).toBe(20);
    expect(adultPalette(2).t).toBe(23);
  });
  it('npcArt is stable and rejects unknown sprites', () => {
    expect(npcArt('adult', 1, 'up', 0)).toBe(npcArt('adult', 1, 'up', 0));
    expect(npcArt('adult', 1, 'up', 0).colors.t).toBe(20);
    expect(npcArt('adult', 9, 'up', 0).colors.t).toBe(10);
    expect(() => npcArt('dragon', undefined, 'up', 0)).toThrow(/dragon/);
  });
});
