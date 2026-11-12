import { ITEMS } from '../src/data/items';
import { STORY } from '../src/data/story';
import { describe, it, expect } from 'vitest';
import { LEVELS, levelForXp } from '../src/data/levels';
import { createPlayer, hasFlag, setFlag, applyLevel, applyDeath, settleBattle } from '../src/game/player';
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
    const p = createPlayer('Wren', STORY.startingItems);
    expect(p).toMatchObject({ name: 'Wren', level: 1, hp: 15, maxHp: 15, mp: 0, gold: 40, str: 4, agi: 4, flags: [] });
    expect(p.inventory).toEqual([{ item: 'herb', count: 1 }]);
    expect(p.equipment).toEqual({});
  });
  it('setFlag is pure and dedupes', () => {
    const p = createPlayer('x', STORY.startingItems);
    const a = setFlag(setFlag(p, 'f'), 'f');
    expect(a.flags).toEqual(['f']);
    expect(p.flags).toEqual([]);
    expect(hasFlag(a, 'f')).toBe(true);
    expect(hasFlag(p, 'f')).toBe(false);
  });
  it('applyLevel keeps hp ratio', () => {
    const p = { ...createPlayer('x', STORY.startingItems), hp: 10 };
    const q = applyLevel(p, 5);
    expect(q).toMatchObject({ level: 5, str: 12, agi: 10, maxHp: 35, maxMp: 20, xp: 110, hp: 23 });
    expect(p.level).toBe(1);
  });
  it('re-applying the same level never changes hp or mp', () => {
    for (let lv = 1; lv <= LEVELS.length; lv++) {
      const base = applyLevel(createPlayer('x', STORY.startingItems), lv);
      for (let hp = 1; hp <= base.maxHp; hp++)
        for (const mp of [0, Math.floor(base.maxMp / 2), base.maxMp]) {
          const p = { ...base, hp, mp };
          const q = applyLevel(p, lv);
          expect([q.hp, q.mp], `lv ${lv} hp ${hp} mp ${mp}`).toEqual([hp, mp]);
        }
    }
  });
  it('applyLevel gives full mp from 0/0 and clamps level', () => {
    expect(applyLevel(createPlayer('x', STORY.startingItems), 3).mp).toBe(5);
    expect(applyLevel(createPlayer('x', STORY.startingItems), 99).level).toBe(10);
    expect(applyLevel(createPlayer('x', STORY.startingItems), 0).level).toBe(1);
  });
  it('attack and defense', () => {
    const p = createPlayer('x', STORY.startingItems);
    expect(attackOf(ITEMS, p)).toBe(4);
    const e = equip(ITEMS, { ...p, inventory: [{ item: 'aldric_shield', count: 1 }] }, 'aldric_shield');
    expect(defenseOf(ITEMS, e.player)).toBe(6);
  });
  it('items', () => {
    expect(ITEMS.bronze_sword.price).toBe(180);
    expect(ITEMS.herb.stack).toBe(6);
  });
});

describe('applyDeath and settleBattle', () => {
  const base = () => ({ ...createPlayer('x', STORY.startingItems), level: 3, xp: 30, flags: ['a'] });
  it('applyDeath halves gold, restores hp and mp, keeps the rest', () => {
    expect(applyDeath({ ...base(), gold: 41 }).gold).toBe(20);
    expect(applyDeath({ ...base(), gold: 1 }).gold).toBe(0);
    expect(applyDeath({ ...base(), gold: 0 }).gold).toBe(0);
    const p = { ...base(), hp: 0, mp: 0, maxHp: 15, maxMp: 5, equipment: { weapon: 'w' } };
    const before = structuredClone(p);
    const q = applyDeath(p);
    expect(q.hp).toBe(15);
    expect(q.mp).toBe(5);
    expect(q).toMatchObject({ xp: p.xp, level: p.level, inventory: p.inventory, equipment: p.equipment, flags: p.flags });
    expect(p).toEqual(before);
  });
  it('settleBattle applies hp and reward', () => {
    const p = { ...base(), gold: 10, xp: 5 };
    expect(settleBattle(p, 9, { xp: 2, gold: 4 })).toMatchObject({ hp: 9, gold: 14, xp: 7 });
    expect(settleBattle(p, -3, null)).toMatchObject({ hp: 0, gold: 10, xp: 5 });
    expect(settleBattle(p, 999, null).hp).toBe(p.maxHp);
  });
  it('settleBattle caps gold and xp', () => {
    expect(settleBattle({ ...base(), gold: 65530 }, 1, { xp: 0, gold: 18 }).gold).toBe(65535);
    expect(settleBattle({ ...base(), xp: 65534 }, 1, { xp: 18, gold: 0 }).xp).toBe(65535);
  });
});
