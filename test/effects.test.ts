import { describe, it, expect } from 'vitest';
import { rollEffect, usableIn } from '../src/game/effects';
import { SPELLS } from '../src/data/spells';
import { ITEMS } from '../src/data/items';
import { LEVELS } from '../src/data/levels';
import { seqRng } from './helpers/seqRng';

describe('rollEffect', () => {
  it('rolls heal and damage between min and max inclusive', () => {
    const heal = { kind: 'heal', min: 10, max: 17 } as const;
    expect(rollEffect(seqRng([0]), heal)).toBe(10);
    expect(rollEffect(seqRng([0.99]), heal)).toBe(17);
    expect(rollEffect(seqRng([0.99]), { kind: 'damage', min: 5, max: 12 })).toBe(12);
  });
  it('warp is 0 and draws nothing', () => {
    expect(rollEffect(seqRng([]), { kind: 'warp' })).toBe(0);
  });
});

describe('usableIn', () => {
  it('matches where against the context', () => {
    expect(usableIn('both', 'field')).toBe(true);
    expect(usableIn('both', 'battle')).toBe(true);
    expect(usableIn('battle', 'battle')).toBe(true);
    expect(usableIn('field', 'field')).toBe(true);
    expect(usableIn('battle', 'field')).toBe(false);
    expect(usableIn('field', 'battle')).toBe(false);
  });
});

describe('spell table', () => {
  it('matches the design', () => {
    expect(SPELLS.heal).toEqual({ id: 'heal', name: 'Heal', mp: 4, where: 'both', effect: { kind: 'heal', min: 10, max: 17 } });
    expect(SPELLS.ember).toEqual({ id: 'ember', name: 'Ember', mp: 2, where: 'battle', effect: { kind: 'damage', min: 5, max: 12 } });
    expect(SPELLS.homeward).toEqual({ id: 'homeward', name: 'Homeward', mp: 8, where: 'field', effect: { kind: 'warp' } });
  });
  it('every learned spell exists and ids match keys', () => {
    for (const row of LEVELS) if (row.learns) expect(Object.keys(SPELLS)).toContain(row.learns);
    for (const [k, v] of Object.entries(SPELLS)) expect(v.id).toBe(k);
  });
  it('herb heals in both contexts; the torch lights in the field only', () => {
    expect(ITEMS.herb.use).toEqual({ where: 'both', effect: { kind: 'heal', min: 20, max: 30 } });
    expect(ITEMS.torch.use).toEqual({ where: 'field', effect: { kind: 'light', radius: 3, steps: 200 } });
  });
});
