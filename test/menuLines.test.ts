import { describe, expect, it } from 'vitest';
import { createPlayer } from '../src/game/player';
import { addItem, equip, equipLines, itemLines } from '../src/game/inventory';
import { statusLines } from '../src/game/stats';

describe('statusLines', () => {
  it('lists the hero numbers in order', () => {
    const p = createPlayer('Wren');
    const lines = statusLines(p);
    expect(lines).toHaveLength(10);
    expect(lines[0]).toBe('NAME Wren');
    expect(lines[2]).toBe('HP   15/15');
    expect(lines[9]).toBe('DEF  2');
  });
  it('reflects equipment', () => {
    let p = createPlayer('Wren');
    p = addItem(p, 'aldric_shield').player;
    p = equip(p, 'aldric_shield').player;
    expect(statusLines(p)[9]).toBe('DEF  6');
  });
});

describe('itemLines', () => {
  it('shows counts for consumables only', () => {
    const p = createPlayer('Wren');
    expect(itemLines(p)).toEqual(['Herb x1']);
    expect(itemLines(addItem(p, 'aldric_shield').player)).toEqual(['Herb x1', "Aldric's Shield"]);
  });
  it('says Nothing when empty', () => {
    expect(itemLines({ ...createPlayer('Wren'), inventory: [] })).toEqual(['Nothing']);
  });
});

describe('equipLines', () => {
  it('shows none for empty slots and lists equipment candidates', () => {
    let p = createPlayer('Wren');
    expect(equipLines(p)).toEqual({
      slots: ['WEAPON: none', 'ARMOR:  none', 'SHIELD: none'],
      candidates: [],
    });
    p = addItem(p, 'aldric_shield').player;
    expect(equipLines(p).candidates).toEqual(['aldric_shield']);
    p = equip(p, 'aldric_shield').player;
    const after = equipLines(p);
    expect(after.candidates).toEqual([]);
    expect(after.slots[2]).toBe("SHIELD: Aldric's Shield");
  });
});
