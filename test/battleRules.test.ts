import { describe, it, expect } from 'vitest';
import { createRng } from '../src/engine/rng';
import { damageRoll, heroStrike, monsterStrike, monsterFirst, runSucceeds } from '../src/game/battle/rules';
import { seqRng } from './helpers/seqRng';

describe('damageRoll', () => {
  it('positive base', () => {
    expect(damageRoll(seqRng([0]), 4, 3)).toBe(1);
    expect(damageRoll(seqRng([0]), 26, 14)).toBe(5);
    expect(damageRoll(seqRng([0.99]), 26, 14)).toBe(9);
    expect(damageRoll(seqRng([0.99]), 5, 8)).toBe(1);
  });
  it('base at or below zero', () => {
    expect(damageRoll(seqRng([0.4]), 4, 8)).toBe(0);
    expect(damageRoll(seqRng([0.6]), 4, 8)).toBe(1);
    expect(damageRoll(seqRng([0.6]), 1, 40)).toBe(1);
  });
});

describe('heroStrike', () => {
  it('miss', () => {
    expect(heroStrike(seqRng([0.01]), 6, { def: 3, dodge: 1 / 32 })).toEqual({ kind: 'miss', damage: 0 });
  });
  it('dodge', () => {
    expect(heroStrike(seqRng([0.5, 0.01]), 6, { def: 3, dodge: 1 / 16 })).toEqual({ kind: 'dodge', damage: 0 });
  });
  it('crit', () => {
    expect(heroStrike(seqRng([0.5, 0.5, 0.01, 0.99]), 6, { def: 3, dodge: 1 / 32 })).toEqual({ kind: 'crit', damage: 6 });
  });
  it('hit', () => {
    expect(heroStrike(seqRng([0.5, 0.5, 0.5, 0]), 6, { def: 3, dodge: 1 / 32 })).toEqual({ kind: 'hit', damage: 2 });
  });
  it('boss makes no crit draw', () => {
    expect(heroStrike(seqRng([0.5, 0.5, 0]), 26, { def: 14, dodge: 1 / 32, boss: true })).toEqual({ kind: 'hit', damage: 5 });
  });
  it('statistical rates', () => {
    const rng = createRng(7);
    let miss = 0;
    let crit = 0;
    let negative = 0;
    const n = 10000;
    for (let i = 0; i < n; i++) {
      const s = heroStrike(rng, 6, { def: 3, dodge: 1 / 32 });
      if (s.kind === 'miss') miss++;
      if (s.kind === 'crit') crit++;
      if (s.damage < 0) negative++;
    }
    expect(miss / n).toBeGreaterThanOrEqual(0.05);
    expect(miss / n).toBeLessThanOrEqual(0.075);
    expect(crit / n).toBeGreaterThanOrEqual(0.02);
    expect(crit / n).toBeLessThanOrEqual(0.037);
    expect(negative).toBe(0);
  });
});

describe('monsterStrike', () => {
  it('miss and hits', () => {
    expect(monsterStrike(seqRng([0.01]), 11, 6)).toEqual({ kind: 'miss', damage: 0 });
    expect(monsterStrike(seqRng([0.5, 0]), 11, 6)).toEqual({ kind: 'hit', damage: 2 });
    expect(monsterStrike(seqRng([0.5, 0.99]), 11, 6)).toEqual({ kind: 'hit', damage: 4 });
  });
});

describe('monsterFirst', () => {
  it('compares rolled agility, monster roll drawn first', () => {
    expect(monsterFirst(seqRng([0.99, 0]), 4, 3)).toBe(true);
    expect(monsterFirst(seqRng([0, 0.99]), 4, 3)).toBe(false);
    expect(monsterFirst(seqRng([0.5, 0.5]), 4, 4)).toBe(false);
  });
});

describe('runSucceeds', () => {
  it('compares rolled agility, hero roll drawn first', () => {
    expect(runSucceeds(seqRng([0.99, 0]), 4, 3, 1)).toBe(true);
    expect(runSucceeds(seqRng([0, 0.99]), 4, 3, 1)).toBe(false);
  });
  it('infinite runFactor fails without drawing', () => {
    expect(runSucceeds(seqRng([]), 4, 3, Infinity)).toBe(false);
  });
});
