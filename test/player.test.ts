import { describe, it, expect } from 'vitest';
import { LEVELS, levelForXp } from '../src/data/levels';
import { ITEMS } from '../src/data/items';
import { createPlayer, hasFlag, setFlag, applyLevel } from '../src/game/player';
import { attackOf, defenseOf } from '../src/game/stats';
import { equip } from '../src/game/inventory';

describe('levels', () => {
  it('has ten rows and level 3 matches the spec', () => {
    expect(LEVELS.length).toBe(10);
    expect(LEVELS[2]).toEqual({ level: 3, xp: 23, str: 7, agi: 6, maxHp: 24, maxMp: 5, learns: 'heal' });
  });
  it('levelForXp', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(22)).toBe(2);
    expect(levelForXp(23)).toBe(3);
    expect(levelForXp(2000)).toBe(10);
    expect(levelForXp(99999)).toBe(10);
  });
});

describe('player', () => {
  it('createPlayer', () => {
    const p = createPlayer('Wren');
    expect(p).toMatchObject({ name: 'Wren', level: 1, hp: 15, maxHp: 15, mp: 0, gold: 40, str: 4, agi: 4, flags: [] });
    expect(p.inventory).toEqual([{ item: 'herb', count: 1 }]);
    expect(p.equipment).toEqual({});
  });
  it('setFlag is pure and dedupes', () => {
    const p = createPlayer('x');
    const a = setFlag(setFlag(p, 'f'), 'f');
    expect(a.flags).toEqual(['f']);
    expect(p.flags).toEqual([]);
    expect(hasFlag(a, 'f')).toBe(true);
    expect(hasFlag(p, 'f')).toBe(false);
  });
  it('applyLevel keeps hp ratio', () => {
    const p = { ...createPlayer('x'), hp: 10 };
    const q = applyLevel(p, 5);
    expect(q).toMatchObject({ level: 5, str: 12, agi: 10, maxHp: 35, maxMp: 20, xp: 110, hp: 23 });
    expect(p.level).toBe(1);
  });
  it('applyLevel gives full mp from 0/0 and clamps level', () => {
    expect(applyLevel(createPlayer('x'), 3).mp).toBe(5);
    expect(applyLevel(createPlayer('x'), 99).level).toBe(10);
    expect(applyLevel(createPlayer('x'), 0).level).toBe(1);
  });
  it('attack and defense', () => {
    const p = createPlayer('x');
    expect(attackOf(p)).toBe(4);
    const e = equip({ ...p, inventory: [{ item: 'aldric_shield', count: 1 }] }, 'aldric_shield');
    expect(defenseOf(e.player)).toBe(6);
  });
  it('items', () => {
    expect(ITEMS.bronze_sword.price).toBe(180);
    expect(ITEMS.herb.stack).toBe(6);
  });
});
