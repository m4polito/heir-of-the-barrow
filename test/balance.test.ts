import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/data/items';
import { MONSTERS } from '../src/data/monsters';
import { createRng } from '../src/engine/rng';
import { validateActions } from '../src/game/battle/ai';
import { attackOf, defenseOf } from '../src/game/stats';
import { fightOnly, healer, heroAt, simulate } from './helpers/simulate';
import { WARDEN } from './helpers/warden';

const N = 4000;

describe('early-game balance', () => {
  it('road: an unarmed level 1 hero with the shield beats a Mireling quickly and cheaply', () => {
    const r = simulate(createRng(1), heroAt(1, ['aldric_shield'], 0), MONSTERS.mireling!, fightOnly, N);
    expect(r.winRate).toBeGreaterThanOrEqual(0.99);
    expect(r.meanHpLost).toBeLessThanOrEqual(3.0);
    expect(r.meanRounds).toBeLessThanOrEqual(4);
  });

  it('marsh: a level 3 hero usually wins with Heal and usually loses without', () => {
    const hero = heroAt(3, ['aldric_shield'], 0);
    const heal = simulate(createRng(2), hero, MONSTERS.bog_mireling!, healer(8, null), N);
    const plain = simulate(createRng(3), hero, MONSTERS.bog_mireling!, fightOnly, N);
    expect(heal.winRate).toBeGreaterThan(0.6);
    expect(plain.winRate).toBeLessThanOrEqual(heal.winRate - 0.2);
  });

  it('marsh: a level 1 hero is still outmatched', () => {
    const r = simulate(createRng(4), heroAt(1, ['aldric_shield'], 0), MONSTERS.bog_mireling!, fightOnly, N);
    expect(r.winRate).toBeLessThan(0.05);
  });
});

describe('Barrow Warden win-rate bands', () => {
  const gear = ['bronze_sword', 'leather_armor', 'aldric_shield'];
  const run = (level: number, seed: number) =>
    simulate(createRng(seed), heroAt(level, gear, 3), WARDEN, healer(18, 8), N);

  it('the Warden fixture has valid actions', () => {
    expect(() => validateActions(WARDEN.actions!)).not.toThrow();
  });

  it('a level 6 hero has the stats the spec states', () => {
    const p = heroAt(6, gear, 3);
    expect(attackOf(ITEMS, p)).toBe(26);
    expect(defenseOf(ITEMS, p)).toBe(13);
  });

  it('level 4 almost never wins', () => {
    const r = run(4, 5);
    expect(r.winRate).toBeLessThan(0.03);
  });
  it('level 5 wins under half the time', () => {
    const r = run(5, 6);
    expect(r.winRate).toBeLessThan(0.5);
  });
  it('level 6 usually wins', () => {
    const r = run(6, 7);
    expect(r.winRate).toBeGreaterThan(0.7);
  });
  it('level 7 almost always wins', () => {
    const r = run(7, 8);
    expect(r.winRate).toBeGreaterThan(0.9);
  });
});
