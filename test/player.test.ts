import { ITEMS } from '../src/data/items';
import { STORY } from '../src/data/story';
import { describe, it, expect } from 'vitest';
import { LEVELS, levelForXp } from '../src/data/levels';
import { createPlayer, hasFlag, setFlag, applyLevel, applyDeath, settleBattle, spellsKnown, gainXp, xpToNext } from '../src/game/player';
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
  const end = (hp: number, mp = 0, itemsUsed: readonly string[] = []) => ({ hp, mp, itemsUsed });
  it('settleBattle applies hp and reward', () => {
    const p = { ...base(), gold: 10, xp: 5 };
    expect(settleBattle(p, end(9), { xp: 2, gold: 4 })).toMatchObject({ hp: 9, gold: 14, xp: 7 });
    expect(settleBattle(p, end(-3), null)).toMatchObject({ hp: 0, gold: 10, xp: 5 });
    expect(settleBattle(p, end(999), null).hp).toBe(p.maxHp);
  });
  it('settleBattle caps gold and xp', () => {
    expect(settleBattle({ ...base(), gold: 65530 }, end(1), { xp: 0, gold: 18 }).gold).toBe(65535);
    expect(settleBattle({ ...base(), xp: 65534 }, end(1), { xp: 18, gold: 0 }).xp).toBe(65535);
  });
  it('settleBattle clamps mp and removes used items', () => {
    const p = { ...createPlayer('x', STORY.startingItems), maxMp: 5 };
    const q = settleBattle(p, end(9, 1, ['herb']), null);
    expect(q).toMatchObject({ hp: 9, mp: 1, inventory: [] });
    expect(settleBattle(p, end(9, 99), null).mp).toBe(5);
    expect(settleBattle(p, end(9, -2), null).mp).toBe(0);
    expect(() => settleBattle(p, end(9, 1, ['herb', 'herb']), null)).toThrow('Used item not held: herb');
  });
  it('settleBattle levels the hero up on a reward', () => {
    const p = createPlayer('x', STORY.startingItems);
    expect(settleBattle(p, end(9), { xp: 7, gold: 4 })).toMatchObject({ level: 2, hp: 16, gold: 44 });
  });
});

describe('levelling', () => {
  const hero = (over: Partial<ReturnType<typeof createPlayer>> = {}) => ({ ...createPlayer('x', STORY.startingItems), ...over });
  it('spellsKnown lists learned spells in table order', () => {
    expect(spellsKnown(1)).toEqual([]);
    expect(spellsKnown(3)).toEqual(['heal']);
    expect(spellsKnown(5)).toEqual(['heal', 'ember']);
    expect(spellsKnown(10)).toEqual(['heal', 'ember', 'homeward']);
  });
  it('LEVELS never decreases', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      const a = LEVELS[i - 1]!;
      const b = LEVELS[i]!;
      for (const k of ['xp', 'str', 'agi', 'maxHp', 'maxMp'] as const) expect(b[k], `${k} at row ${i}`).toBeGreaterThanOrEqual(a[k]);
    }
  });
  it('gainXp raises one level', () => {
    const p = hero({ xp: 5, hp: 9 });
    const before = structuredClone(p);
    const r = gainXp(p, 2);
    expect(r.player).toMatchObject({ level: 2, str: 5, maxHp: 22, hp: 16, xp: 7 });
    expect(r.levelUp).toEqual({ from: 1, to: 2, str: 1, agi: 0, maxHp: 7, maxMp: 0, learned: [] });
    expect(p).toEqual(before);
  });
  it('gainXp without a level only changes xp', () => {
    const p = hero();
    const r = gainXp(p, 1);
    expect(r.levelUp).toBeNull();
    expect(r.player).toEqual({ ...p, xp: 1 });
  });
  it('gainXp can jump several levels', () => {
    const r = gainXp(hero({ hp: 15 }), 47);
    expect(r.player.level).toBe(4);
    expect(r.levelUp).toEqual({ from: 1, to: 4, str: 3, agi: 4, maxHp: 16, maxMp: 16, learned: ['heal'] });
    expect(r.player).toMatchObject({ hp: 31, mp: 16 });
  });
  it('gainXp at the top level and the xp cap', () => {
    const top = applyLevel(hero(), 10);
    const r = gainXp({ ...top, xp: 2000 }, 500);
    expect(r.levelUp).toBeNull();
    expect(r.player).toMatchObject({ level: 10, xp: 2500 });
    expect(gainXp({ ...top, xp: 65530 }, 18).player.xp).toBe(65535);
  });
  it('gainXp never lowers a level set above its xp', () => {
    const p = { ...applyLevel(hero(), 5), xp: 0 };
    const r = gainXp(p, 1);
    expect(r.player.level).toBe(5);
    expect(r.levelUp).toBeNull();
  });
  it('xpToNext', () => {
    expect(xpToNext(hero())).toBe(7);
    expect(xpToNext(hero({ xp: 5 }))).toBe(2);
    expect(xpToNext(applyLevel(hero(), 10))).toBeNull();
  });
});
