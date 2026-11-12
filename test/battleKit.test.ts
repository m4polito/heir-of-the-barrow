import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/data/items';
import { SPELLS } from '../src/data/spells';
import { battleKit } from '../src/game/battle/kit';
import { createPlayer } from '../src/game/player';

const at = (level: number, items: { item: string; count: number }[]) => ({ ...createPlayer('A', items), level });

describe('battleKit', () => {
  it('level 1 with one Herb', () => {
    const k = battleKit(at(1, [{ item: 'herb', count: 1 }]), SPELLS, ITEMS);
    expect(k.spells).toEqual([]);
    expect(k.items).toEqual([{ id: 'herb', name: 'Herb', count: 1, effect: ITEMS.herb.use!.effect }]);
  });

  it('level 6 knows heal then ember', () => {
    expect(battleKit(at(6, []), SPELLS, ITEMS).spells.map((s) => s.id)).toEqual(['heal', 'ember']);
  });

  it('level 9 still two, Homeward is field-only', () => {
    expect(battleKit(at(9, []), SPELLS, ITEMS).spells.map((s) => s.id)).toEqual(['heal', 'ember']);
  });

  it('sums Herbs across slots', () => {
    const k = battleKit(at(1, [{ item: 'herb', count: 6 }, { item: 'herb', count: 2 }]), SPELLS, ITEMS);
    expect(k.items).toHaveLength(1);
    expect(k.items[0]!.count).toBe(8);
  });

  it('does not list a Torch', () => {
    expect(battleKit(at(1, [{ item: 'torch', count: 1 }]), SPELLS, ITEMS).items).toEqual([]);
  });

  it('throws when the table lacks a known spell', () => {
    const { heal: _heal, ...rest } = SPELLS;
    expect(() => battleKit(at(3, []), rest, ITEMS)).toThrow('Unknown spell: heal');
  });
});
