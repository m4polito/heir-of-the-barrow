import { describe, it, expect } from 'vitest';
import { ITEMS } from '../src/data/items';
import { MAPS } from '../src/data/maps';
import { STORY } from '../src/data/story';
import { LEVELS } from '../src/data/levels';
import { applyLevel, createPlayer } from '../src/game/player';
import type { PlayerState } from '../src/game/player';
import { fromSave, parseSave, readSave, saveKey, toSave, writeSave } from '../src/game/save';
import type { SaveContext, SaveData } from '../src/game/save';
import type { Dir } from '../src/engine/constants';

const ctx: SaveContext = { items: ITEMS, maps: MAPS };
const at = { map: 'elder_house', x: 6, y: 4, facing: 'up' as Dir };

function hero(): PlayerState {
  const p = applyLevel(createPlayer('Wren', STORY.startingItems), 4);
  return {
    ...p,
    hp: 20,
    mp: 5,
    gold: 123,
    xp: 60,
    equipment: { weapon: 'wooden_club' },
    inventory: [
      { item: 'herb', count: 2 },
      { item: 'aldric_shield', count: 1 },
    ],
    flags: ['intro_done', 'shield_received'],
  };
}

const goodSave = (): SaveData => toSave(hero(), at);
const goodText = (): string => JSON.stringify(goodSave());

function storage() {
  const m = new Map<string, string>();
  return {
    setItem: (k: string, v: string) => void m.set(k, v),
    getItem: (k: string) => m.get(k) ?? null,
  };
}

describe('save round trip', () => {
  it('restores the player and the position', () => {
    const p = hero();
    const s = parseSave(JSON.stringify(toSave(p, at)), ctx)!;
    expect(fromSave(s)).toEqual(p);
    expect({ map: s.map, x: s.x, y: s.y, facing: s.facing }).toEqual(at);
    expect(s.torchSteps).toBe(0);
  });

  it('keeps a debug-raised level 5 hero with 0 xp at level 5 stats', () => {
    const p: PlayerState = { ...applyLevel(hero(), 5), xp: 0 };
    const q = fromSave(parseSave(JSON.stringify(toSave(p, at)), ctx)!);
    const row = LEVELS[4]!;
    expect(q.level).toBe(5);
    expect(q.xp).toBe(0);
    expect([q.str, q.agi, q.maxHp, q.maxMp]).toEqual([row.str, row.agi, row.maxHp, row.maxMp]);
    expect(q).toEqual(p);
  });

  it('toSave shares nothing with the player', () => {
    const p = hero();
    const before = JSON.parse(JSON.stringify(p));
    const s = toSave(p, at);
    s.inventory.push({ item: 'herb', count: 1 });
    s.inventory[0]!.count = 5;
    s.flags.push('x');
    s.equipment.armor = 'cloth_tunic';
    expect(p).toEqual(before);
  });
});

describe('parseSave rejects damage', () => {
  const lv = LEVELS[3]!;
  const cases: [string, Record<string, unknown>][] = [
    ['version 2', { version: 2 }],
    ['version missing', { version: undefined }],
    ['empty name', { name: '' }],
    ['nine-character name', { name: 'Abcdefghi' }],
    ['name with a character off the grid', { name: 'Wr{n' }],
    ['numeric name', { name: 5 }],
    ['level 0', { level: 0 }],
    ['level 11', { level: 11 }],
    ['level 2.5', { level: 2.5 }],
    ['level string', { level: '3' }],
    ['xp -1', { xp: -1 }],
    ['xp 65536', { xp: 65536 }],
    ['gold -1', { gold: -1 }],
    ['gold 65536', { gold: 65536 }],
    ['gold 1.5', { gold: 1.5 }],
    ['hp 0', { hp: 0 }],
    ['hp over max', { hp: lv.maxHp + 1 }],
    ['mp -1', { mp: -1 }],
    ['mp over max', { mp: lv.maxMp + 1 }],
    ['herb as weapon', { equipment: { weapon: 'herb' } }],
    ['unknown weapon', { equipment: { weapon: 'nope' } }],
    ['unknown slot', { equipment: { hat: 'wooden_club' } }],
    ['inventory not an array', { inventory: {} }],
    ['nine inventory entries', { inventory: Array.from({ length: 9 }, () => ({ item: 'wooden_club', count: 1 })) }],
    ['unknown item', { inventory: [{ item: 'nope', count: 1 }] }],
    ['herb count 0', { inventory: [{ item: 'herb', count: 0 }] }],
    ['herb count 7', { inventory: [{ item: 'herb', count: 7 }] }],
    ['herb count 1.5', { inventory: [{ item: 'herb', count: 1.5 }] }],
    ['club count 2', { inventory: [{ item: 'wooden_club', count: 2 }] }],
    ['flags not an array', { flags: 'a' }],
    ['numeric flag', { flags: [1] }],
    ['empty flag', { flags: [''] }],
    ['33-character flag', { flags: ['a'.repeat(33)] }],
    ['repeated flag', { flags: ['a', 'a'] }],
    ['65 flags', { flags: Array.from({ length: 65 }, (_, i) => `f${i}`) }],
    ['unknown map', { map: 'nope' }],
    ['x -1', { x: -1 }],
    ['x 12', { x: 12 }],
    ['x 1.5', { x: 1.5 }],
    ['wall tile', { x: 0, y: 0 }],
    ['facing north', { facing: 'north' }],
    ['torchSteps -1', { torchSteps: -1 }],
    ['torchSteps 65536', { torchSteps: 65536 }],
  ];
  it.each(cases)('%s', (_label, change) => {
    const text = JSON.stringify({ ...goodSave(), ...change });
    expect(parseSave(text, ctx)).toBeNull();
  });

  it('accepts the good save', () => {
    expect(parseSave(goodText(), ctx)).toEqual(goodSave());
  });

  it('returns null, without throwing, for unreadable text', () => {
    const good = goodText();
    for (const t of [null, '', '{', 'null', '[]', '42', good.slice(0, good.length / 2)]) {
      expect(parseSave(t, ctx)).toBeNull();
    }
  });

  it('drops extra fields', () => {
    const s = parseSave(JSON.stringify({ ...goodSave(), cheat: 1 }), ctx)!;
    expect('cheat' in s).toBe(false);
    expect(s).toEqual(goodSave());
  });
});

describe('storage', () => {
  it('builds the key', () => {
    expect(saveKey('x')).toBe('x.save.v1');
  });

  it('writes and reads back', () => {
    const st = storage();
    expect(writeSave(st, 'k', goodSave())).toBe(true);
    expect(readSave(st, 'k', ctx)).toEqual(goodSave());
    expect(readSave(st, 'missing', ctx)).toBeNull();
  });

  it('fails soft', () => {
    expect(writeSave(null, 'k', goodSave())).toBe(false);
    expect(writeSave({ setItem: () => { throw new Error('full'); } }, 'k', goodSave())).toBe(false);
    expect(readSave(null, 'k', ctx)).toBeNull();
    expect(readSave({ getItem: () => { throw new Error('denied'); } }, 'k', ctx)).toBeNull();
  });
});
