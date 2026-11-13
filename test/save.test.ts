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
import { PLAY_FRAMES_MAX } from '../src/game/playTime';

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

  it('carries the torch steps through a save', () => {
    const p = { ...hero(), torch: 137 };
    const s = parseSave(JSON.stringify(toSave(p, at)), ctx)!;
    expect(s.torchSteps).toBe(137);
    expect(fromSave(s)).toEqual(p);
  });

  it('a Phase 5 save (torchSteps 0) loads with no torch', () => {
    const text = JSON.stringify({ ...toSave(hero(), at), torchSteps: 0 });
    expect(fromSave(parseSave(text, ctx)!).torch).toBe(0);
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
    ['hp 65536', { hp: 65536 }],
    ['mp -1', { mp: -1 }],
    ['mp 65536', { mp: 65536 }],
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
    ['inventory with null', { inventory: [null] }],
    ['inventory with a string', { inventory: ['herb'] }],
    ['equipment null', { equipment: null }],
    ['inventory item constructor', { inventory: [{ item: 'constructor', count: 1 }] }],
    ['inventory item __proto__', { inventory: [{ item: '__proto__', count: 1 }] }],
    ['equipment toString', { equipment: { weapon: 'toString' } }],
    ['map toString', { map: 'toString' }],
    ['map constructor', { map: 'constructor' }],
    ['x null', { x: null }],
  ];
  it.each(cases)('%s', (_label, change) => {
    const text = JSON.stringify({ ...goodSave(), ...change });
    expect(parseSave(text, ctx)).toBeNull();
  });

  it('rejects an x that is not a finite number', () => {
    const text = goodText().replace(/"x":\d+/, '"x":1e999');
    expect(text).toContain('1e999');
    expect(parseSave(text, ctx)).toBeNull();
  });

  it('keeps a save whose hp or mp now exceeds the level table, and clamps on load', () => {
    const lv = LEVELS[3]!;
    for (const [field, over, max] of [
      ['hp', lv.maxHp + 1, lv.maxHp],
      ['mp', lv.maxMp + 1, lv.maxMp],
    ] as const) {
      const parsed = parseSave(JSON.stringify({ ...goodSave(), [field]: over }), ctx);
      expect(parsed, field).not.toBeNull();
      expect(fromSave(parsed!)[field]).toBe(max);
    }
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

describe('parseSave pack and key entries', () => {
  const withInv = (inventory: { item: string; count: number }[]) => JSON.stringify({ ...goodSave(), inventory });
  const club = (n: number) => Array.from({ length: n }, () => ({ item: 'wooden_club', count: 1 }));
  const page = { item: 'journal_page', count: 1 };
  it('accepts 8 ordinary entries plus the journal page, through parse and fromSave', () => {
    const save = parseSave(withInv([...club(8), page]), ctx);
    expect(save).not.toBeNull();
    expect(fromSave(save!).inventory.length).toBe(9);
  });
  it('rejects 9 ordinary entries', () => {
    expect(parseSave(withInv(club(9)), ctx)).toBeNull();
    expect(parseSave(withInv([...club(9), page]), ctx)).toBeNull();
  });
  it('rejects 9 key entries', () => {
    expect(parseSave(withInv(Array.from({ length: 9 }, () => page)), ctx)).toBeNull();
  });
});

describe('play time in the save', () => {
  it('round-trips through toSave, JSON, parseSave and fromSave', () => {
    const p = { ...hero(), playFrames: 123456 };
    const s = parseSave(JSON.stringify(toSave(p, at)), ctx)!;
    expect(s.playFrames).toBe(123456);
    expect(fromSave(s)).toEqual(p);
  });
  it('toSave always writes it', () => {
    expect(goodSave().playFrames).toBe(0);
  });
  it('a save with no playFrames field (every save made before it) loads with 0', () => {
    const old: Record<string, unknown> = { ...goodSave() };
    delete old.playFrames;
    const text = JSON.stringify(old);
    expect(text).not.toContain('playFrames');
    const s = parseSave(text, ctx);
    expect(s).not.toBeNull();
    expect(fromSave(s!).playFrames).toBe(0);
  });
  it.each([-1, 1.5, '7', null, PLAY_FRAMES_MAX + 1])('rejects playFrames %j', (bad) => {
    expect(parseSave(JSON.stringify({ ...goodSave(), playFrames: bad }), ctx)).toBeNull();
  });
  it('accepts 0 and the cap', () => {
    for (const ok of [0, PLAY_FRAMES_MAX]) {
      expect(parseSave(JSON.stringify({ ...goodSave(), playFrames: ok }), ctx)?.playFrames).toBe(ok);
    }
  });
});
