import { ITEMS } from '../src/data/items';
import { STORY } from '../src/data/story';
import { describe, it, expect } from 'vitest';
import { createPlayer } from '../src/game/player';
import type { PlayerState } from '../src/game/player';
import { addItem, removeItem, equip, unequip, INVENTORY_SLOTS, packSlots, itemLines, equipLines } from '../src/game/inventory';
import { sellRows } from '../src/game/shop';

const empty = (): PlayerState => ({ ...createPlayer('x', STORY.startingItems), inventory: [] });

describe('inventory', () => {
  it('a key item already held is not added twice, and both calls succeed', () => {
    const once = addItem(ITEMS, empty(), 'journal_page');
    const twice = addItem(ITEMS, once.player, 'journal_page');
    expect(once.ok && twice.ok).toBe(true);
    expect(twice.player.inventory).toEqual([{ item: 'journal_page', count: 1 }]);
  });

  it('an ordinary stack-1 item added twice makes two entries', () => {
    const r = addItem(ITEMS, addItem(ITEMS, empty(), 'wooden_club').player, 'wooden_club');
    expect(r.ok).toBe(true);
    expect(r.player.inventory).toHaveLength(2);
  });

  it('stacks 7 herbs as [6, 1]', () => {
    const r = addItem(ITEMS, empty(), 'herb', 7);
    expect(r.ok).toBe(true);
    expect(r.player.inventory.map((s) => s.count)).toEqual([6, 1]);
  });
  it('refuses when full and leaves player unchanged', () => {
    let p = empty();
    for (let i = 0; i < INVENTORY_SLOTS; i++) p = addItem(ITEMS, p, 'wooden_club').player;
    expect(p.inventory.length).toBe(8);
    const r = addItem(ITEMS, p, 'wooden_club');
    expect(r.ok).toBe(false);
    expect(r.player).toBe(p);
  });
  it('removeItem across stacks', () => {
    const p = addItem(ITEMS, empty(), 'herb', 8).player;
    const r = removeItem(p, 'herb', 7);
    expect(r.ok).toBe(true);
    expect(r.player.inventory).toEqual([{ item: 'herb', count: 1 }]);
    expect(removeItem(p, 'herb', 9).ok).toBe(false);
  });
  it('equip moves shield from inventory', () => {
    const p = addItem(ITEMS, empty(), 'aldric_shield').player;
    const r = equip(ITEMS, p, 'aldric_shield');
    expect(r.ok).toBe(true);
    expect(r.player.equipment.shield).toBe('aldric_shield');
    expect(r.player.inventory).toEqual([]);
  });
  it('equip swaps', () => {
    let p = addItem(ITEMS, empty(), 'aldric_shield').player;
    p = equip(ITEMS, p, 'aldric_shield').player;
    p = addItem(ITEMS, p, 'plank_shield').player;
    const r = equip(ITEMS, p, 'plank_shield');
    expect(r.ok).toBe(true);
    expect(r.player.equipment.shield).toBe('plank_shield');
    expect(r.player.inventory).toEqual([{ item: 'aldric_shield', count: 1 }]);
  });
  it('equip swap still succeeds with a full inventory (the new item frees a slot)', () => {
    let p = addItem(ITEMS, empty(), 'aldric_shield').player;
    p = equip(ITEMS, p, 'aldric_shield').player;
    p = addItem(ITEMS, p, 'plank_shield').player;
    for (let i = 0; i < 7; i++) p = addItem(ITEMS, p, 'wooden_club').player;
    expect(p.inventory.length).toBe(8);
    const r = equip(ITEMS, p, 'plank_shield');
    expect(r.ok).toBe(true);
    expect(r.player.inventory.length).toBe(8);
    expect(r.player.equipment.shield).toBe('plank_shield');
    expect(r.player.inventory.some((s) => s.item === 'aldric_shield')).toBe(true);
  });
  it('unequip fails when the inventory is full', () => {
    let p = addItem(ITEMS, empty(), 'aldric_shield').player;
    p = equip(ITEMS, p, 'aldric_shield').player;
    for (let i = 0; i < 8; i++) p = addItem(ITEMS, p, 'wooden_club').player;
    const r = unequip(ITEMS, p, 'shield');
    expect(r.ok).toBe(false);
    expect(r.player).toBe(p);
  });
  it('unequip returns item', () => {
    let p = addItem(ITEMS, empty(), 'aldric_shield').player;
    p = equip(ITEMS, p, 'aldric_shield').player;
    const r = unequip(ITEMS, p, 'shield');
    expect(r.ok).toBe(true);
    expect(r.player.equipment.shield).toBeUndefined();
    expect(r.player.inventory).toEqual([{ item: 'aldric_shield', count: 1 }]);
    expect(unequip(ITEMS, r.player, 'shield').ok).toBe(false);
  });
  it('equipping a consumable fails', () => {
    const p = addItem(ITEMS, empty(), 'herb').player;
    expect(equip(ITEMS, p, 'herb').ok).toBe(false);
  });
});

describe('addItem unknown id', () => {
  it('returns ok:false and leaves the player unchanged', () => {
    const p = empty();
    const r = addItem(ITEMS, p, 'no_such_item' as never);
    expect(r.ok).toBe(false);
    expect(r.player).toBe(p);
  });
});

describe('key items take no pack slot', () => {
  const full = () => {
    let p = empty();
    for (let i = 0; i < INVENTORY_SLOTS; i++) p = addItem(ITEMS, p, 'wooden_club').player;
    return p;
  };
  it('adds a key item to a full pack; the ordinary count stays 8', () => {
    const r = addItem(ITEMS, full(), 'journal_page');
    expect(r.ok).toBe(true);
    expect(r.player.inventory.length).toBe(9);
    expect(packSlots(ITEMS, r.player)).toBe(8);
    expect(addItem(ITEMS, r.player, 'wooden_club').ok).toBe(false);
  });
  it('packSlots counts only ordinary entries', () => {
    expect(packSlots(ITEMS, empty())).toBe(0);
    const p = addItem(ITEMS, addItem(ITEMS, empty(), 'journal_page').player, 'herb', 7).player;
    expect(packSlots(ITEMS, p)).toBe(2);
  });
  it('lists keep pack order', () => {
    let p = addItem(ITEMS, empty(), 'herb').player;
    p = addItem(ITEMS, p, 'journal_page').player;
    p = addItem(ITEMS, p, 'wooden_club').player;
    expect(itemLines(ITEMS, p)).toEqual(['Herb x1', "Aldric's Journal", 'Wooden Club']);
    expect(sellRows(ITEMS, p).map((r) => r.slice(0, 12).trim())).toEqual(['Herb x1', 'Wooden Club']);
    expect(equipLines(ITEMS, p).candidates).toEqual(['wooden_club']);
  });
});
