import { describe, expect, it } from 'vitest';
import { createRng } from '../src/engine/rng';
import type { EncounterTable } from '../src/game/map';
import { ENCOUNTER_GRACE, encounterStep, rollEncounter } from '../src/game/encounter';
import { seqRng } from './helpers/seqRng';

const T: EncounterTable = {
  baseRate: 1 / 16,
  zones: {
    grass: {
      backdrop: 'grass',
      monsters: [
        { monster: 'a', weight: 3 },
        { monster: 'b', weight: 1 },
      ],
    },
    marsh: { backdrop: 'murk', monsters: [{ monster: 'c', weight: 1 }] },
    empty: { backdrop: 'grass', monsters: [] },
    zero: { backdrop: 'grass', monsters: [{ monster: 'z', weight: 0 }] },
    road: { backdrop: 'grass', monsters: [{ monster: 'r', weight: 1 }] },
  },
};
const grass = { name: 'grass', encounterRate: 1 };

describe('rollEncounter', () => {
  it('picks a monster by weight when the roll hits', () => {
    expect(rollEncounter(seqRng([0.01, 0]), T, grass)).toEqual({ monster: 'a', backdrop: 'grass' });
    expect(rollEncounter(seqRng([0.01, 0.8]), T, grass)).toEqual({ monster: 'b', backdrop: 'grass' });
  });

  it('returns null when the rate roll misses', () => {
    expect(rollEncounter(seqRng([0.07]), T, grass)).toBeNull();
  });

  it('scales the rate by the tile multiplier', () => {
    expect(rollEncounter(seqRng([0.07, 0]), T, { name: 'marsh', encounterRate: 1.5 })).toEqual({
      monster: 'c',
      backdrop: 'murk',
    });
  });

  it('draws nothing when there is nothing to roll', () => {
    expect(rollEncounter(seqRng([]), T, { name: 'floor', encounterRate: 1 })).toBeNull();
    expect(rollEncounter(seqRng([]), T, { name: 'empty', encounterRate: 1 })).toBeNull();
    expect(rollEncounter(seqRng([]), T, { name: 'grass', encounterRate: 0 })).toBeNull();
    expect(rollEncounter(seqRng([]), T, { name: 'zero', encounterRate: 1 })).toBeNull();
  });

  it('hits at roughly the expected rates', () => {
    const count = (tile: { name: string; encounterRate: number }) => {
      const rng = createRng(5);
      const hits = [];
      for (let i = 0; i < 16000; i++) {
        const h = rollEncounter(rng, T, tile);
        if (h) hits.push(h);
      }
      return hits;
    };
    const g = count(grass);
    expect(g.length).toBeGreaterThanOrEqual(850);
    expect(g.length).toBeLessThanOrEqual(1150);
    const share = g.filter((h) => h.monster === 'a').length / g.length;
    expect(share).toBeGreaterThan(0.7);
    expect(share).toBeLessThan(0.8);
    const r = count({ name: 'road', encounterRate: 0.5 }).length;
    expect(r).toBeGreaterThanOrEqual(400);
    expect(r).toBeLessThanOrEqual(600);
    const m = count({ name: 'marsh', encounterRate: 1.5 }).length;
    expect(m).toBeGreaterThanOrEqual(1350);
    expect(m).toBeLessThanOrEqual(1650);
  });
});

describe('encounterStep', () => {
  it('counts grace down without drawing', () => {
    expect(ENCOUNTER_GRACE).toBe(3);
    expect(encounterStep(seqRng([]), T, grass, 3)).toEqual({ grace: 2, hit: null });
  });

  it('rolls once grace is spent', () => {
    expect(encounterStep(seqRng([0.01, 0]), T, grass, 0)).toEqual({
      grace: 0,
      hit: { monster: 'a', backdrop: 'grass' },
    });
    expect(encounterStep(seqRng([0.9]), T, grass, 0)).toEqual({ grace: 0, hit: null });
  });
});
