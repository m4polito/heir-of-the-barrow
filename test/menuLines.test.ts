import { ITEMS } from '../src/data/items';
import { STORY } from '../src/data/story';
import { describe, expect, it } from 'vitest';
import { applyLevel, createPlayer } from '../src/game/player';
import { addItem, equip, equipLines, itemLines } from '../src/game/inventory';
import { statusLines } from '../src/game/stats';

describe('statusLines', () => {
  it('lists the hero numbers in order', () => {
    const p = createPlayer('Wren', STORY.startingItems);
    const lines = statusLines(ITEMS, p);
    expect(lines).toHaveLength(11);
    expect(lines[0]).toBe('NAME Wren');
    expect(lines[2]).toBe('HP   16/16');
    expect(lines[9]).toBe('DEF  2');
    expect(lines[10]).toBe('NEXT 8');
  });
  it('shows NEXT - at the top level', () => {
    const p = applyLevel(createPlayer('Wren', STORY.startingItems), 10);
    expect(statusLines(ITEMS, p)[10]).toBe('NEXT -');
  });
  it('reflects equipment', () => {
    let p = createPlayer('Wren', STORY.startingItems);
    p = addItem(ITEMS, p, 'aldric_shield').player;
    p = equip(ITEMS, p, 'aldric_shield').player;
    expect(statusLines(ITEMS, p)[9]).toBe('DEF  6');
  });
});

describe('itemLines', () => {
  it('shows counts for consumables only', () => {
    const p = createPlayer('Wren', STORY.startingItems);
    expect(itemLines(ITEMS, p)).toEqual(['Herb x1']);
    expect(itemLines(ITEMS, addItem(ITEMS, p, 'aldric_shield').player)).toEqual(['Herb x1', "Aldric's Shield"]);
  });
  it('says Nothing when empty', () => {
    expect(itemLines(ITEMS, { ...createPlayer('Wren', STORY.startingItems), inventory: [] })).toEqual(['Nothing']);
  });
});

describe('equipLines', () => {
  it('shows none for empty slots and lists equipment candidates', () => {
    let p = createPlayer('Wren', STORY.startingItems);
    expect(equipLines(ITEMS, p)).toEqual({
      slots: ['WEAPON: none', 'ARMOR:  none', 'SHIELD: none'],
      candidates: [],
    });
    p = addItem(ITEMS, p, 'aldric_shield').player;
    expect(equipLines(ITEMS, p).candidates).toEqual(['aldric_shield']);
    p = equip(ITEMS, p, 'aldric_shield').player;
    const after = equipLines(ITEMS, p);
    expect(after.candidates).toEqual([]);
    expect(after.slots[2]).toBe("SHIELD: Aldric's Shield");
  });
});
