import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/data/items';
import { SHOPS } from '../src/data/shops';
import type { ItemDef } from '../src/game/items';
import { INVENTORY_SLOTS } from '../src/game/inventory';
import { createPlayer, type InventorySlot, type PlayerState } from '../src/game/player';
import { buy, buyAndWear, buyCheck, owns, sell, sellPrice, sellRows, stockRows } from '../src/game/shop';

const fresh = (over: Partial<PlayerState> = {}): PlayerState => ({
  ...createPlayer('Hero', [{ item: 'herb', count: 1 }]),
  ...over,
});

/** Eight pack slots; `first` is the first slot, the rest are other items. */
function fullPack(first: InventorySlot): InventorySlot[] {
  const filler = ['torch', 'cloth_tunic', 'aldric_shield', 'torch', 'bronze_sword', 'cloth_tunic', 'leather_armor'];
  return [first, ...filler.slice(0, INVENTORY_SLOTS - 1).map((item) => ({ item, count: 1 }))];
}

describe('sellPrice', () => {
  it('halves the price, rounding down; 0 means cannot be sold', () => {
    expect(sellPrice(ITEMS.wooden_club)).toBe(15);
    expect(sellPrice(ITEMS.herb)).toBe(5);
    expect(sellPrice(ITEMS.torch)).toBe(4);
    expect(sellPrice(ITEMS.plank_shield)).toBe(12);
    expect(sellPrice(ITEMS.aldric_shield)).toBe(0);
    expect(sellPrice(ITEMS.journal_page)).toBe(0);
    expect(sellPrice(undefined)).toBe(0);
  });
});

describe('buyCheck and buy', () => {
  it('a new player buys a Club into the pack', () => {
    const p = fresh();
    expect(buyCheck(ITEMS, p, 'wooden_club')).toEqual({ ok: true, wearOnly: false, tradeIn: null });
    const q = buy(ITEMS, p, 'wooden_club');
    expect(q.gold).toBe(10);
    expect(q.inventory).toEqual([{ item: 'herb', count: 1 }, { item: 'wooden_club', count: 1 }]);
    expect(p.gold).toBe(40);
    expect(p.inventory).toEqual([{ item: 'herb', count: 1 }]);
    expect(buyCheck(ITEMS, p, 'iron_knife')).toEqual({ ok: false, why: 'gold' });
  });

  it('exactly enough gold buys; one short does not', () => {
    const q = buy(ITEMS, fresh({ gold: 30 }), 'wooden_club');
    expect(q.gold).toBe(0);
    expect(buyCheck(ITEMS, fresh({ gold: 29 }), 'wooden_club')).toEqual({ ok: false, why: 'gold' });
  });

  it('gear already owned is refused; consumables never are', () => {
    const inPack = fresh({ inventory: [{ item: 'wooden_club', count: 1 }] });
    expect(owns(inPack, 'wooden_club')).toBe(true);
    expect(buyCheck(ITEMS, inPack, 'wooden_club')).toEqual({ ok: false, why: 'owned' });
    const worn = fresh({ inventory: [], equipment: { weapon: 'wooden_club' } });
    expect(owns(worn, 'wooden_club')).toBe(true);
    expect(buyCheck(ITEMS, worn, 'wooden_club')).toEqual({ ok: false, why: 'owned' });
    expect(buyCheck(ITEMS, fresh(), 'herb').ok).toBe(true);
  });

  it('a full pack still stacks a consumable until the stack is full', () => {
    const stacks = (n: number) => fresh({ inventory: fullPack({ item: 'herb', count: n }) });
    expect(buyCheck(ITEMS, stacks(3), 'herb')).toEqual({ ok: true, wearOnly: false, tradeIn: null });
    expect(buyCheck(ITEMS, stacks(6), 'herb')).toEqual({ ok: false, why: 'full' });
  });

  it('too little gold wins over every other reason', () => {
    const p = fresh({ gold: 0, inventory: fullPack({ item: 'wooden_club', count: 1 }) });
    expect(buyCheck(ITEMS, p, 'wooden_club')).toEqual({ ok: false, why: 'gold' });
  });

  it('buy and buyAndWear throw for the wrong kind of check', () => {
    const full = fresh({ gold: 100, inventory: fullPack({ item: 'herb', count: 1 }) });
    expect(() => buy(ITEMS, full, 'iron_knife')).toThrow('Cannot buy');
    expect(() => buy(ITEMS, fresh({ gold: 0 }), 'wooden_club')).toThrow('Cannot buy: wooden_club');
    expect(() => buyAndWear(ITEMS, fresh(), 'wooden_club')).toThrow('Cannot buy');
    const poorFull = fresh({ gold: 0, inventory: fullPack({ item: 'herb', count: 1 }) });
    expect(buyCheck(ITEMS, poorFull, 'iron_knife')).toEqual({ ok: false, why: 'gold' });
    expect(() => buyAndWear(ITEMS, poorFull, 'iron_knife')).toThrow('Cannot buy');
  });
});

describe('buyAndWear', () => {
  const pack = fullPack({ item: 'herb', count: 1 });

  it('full pack, empty slot: wears it, pack untouched', () => {
    const p = fresh({ gold: 100, inventory: pack });
    expect(buyCheck(ITEMS, p, 'iron_knife')).toEqual({ ok: true, wearOnly: true, tradeIn: null });
    const q = buyAndWear(ITEMS, p, 'iron_knife');
    expect(q.equipment.weapon).toBe('iron_knife');
    expect(q.gold).toBe(40);
    expect(q.inventory).toEqual(pack);
  });

  it('full pack, worn piece is traded in at its sell price', () => {
    const p = fresh({ gold: 100, inventory: pack, equipment: { weapon: 'wooden_club' } });
    expect(buyCheck(ITEMS, p, 'iron_knife')).toEqual({
      ok: true,
      wearOnly: true,
      tradeIn: { id: 'wooden_club', gold: 15 },
    });
    const q = buyAndWear(ITEMS, p, 'iron_knife');
    expect(q.equipment.weapon).toBe('iron_knife');
    expect(q.gold).toBe(55);
    expect(q.inventory).toEqual(pack);
    expect(owns(q, 'wooden_club')).toBe(false);
  });

  it('full pack, worn piece cannot be sold: full', () => {
    const p = fresh({ gold: 100, inventory: pack, equipment: { shield: 'aldric_shield' } });
    expect(buyCheck(ITEMS, p, 'plank_shield')).toEqual({ ok: false, why: 'full' });
  });

  it('caps gold at the maximum', () => {
    const p = fresh({ gold: 65535, inventory: pack, equipment: { weapon: 'bronze_sword' } });
    expect(buyAndWear(ITEMS, p, 'iron_knife').gold).toBe(65535);
  });
});

describe('sell', () => {
  it('sells one of a stack', () => {
    const p = fresh({ inventory: [{ item: 'herb', count: 3 }] });
    const r = sell(ITEMS, p, 0)!;
    expect(r.gold).toBe(5);
    expect(r.player.gold).toBe(45);
    expect(r.player.inventory).toEqual([{ item: 'herb', count: 2 }]);
    expect(p.inventory).toEqual([{ item: 'herb', count: 3 }]);
  });

  it('the last one empties the slot', () => {
    const r = sell(ITEMS, fresh(), 0)!;
    expect(r.player.inventory).toEqual([]);
  });

  it('refuses key gear, empty slots and bad slots', () => {
    const p = fresh({ inventory: [{ item: 'aldric_shield', count: 1 }] });
    const before = structuredClone(p);
    expect(sell(ITEMS, p, 0)).toBeNull();
    expect(p).toEqual(before);
    expect(sell(ITEMS, p, 1)).toBeNull();
    expect(sell(ITEMS, p, 9)).toBeNull();
  });

  it('caps gold at the maximum', () => {
    const p = fresh({ gold: 65530, inventory: [{ item: 'bronze_sword', count: 1 }] });
    const r = sell(ITEMS, p, 0)!;
    expect(r.player.gold).toBe(65535);
  });
});

describe('rows', () => {
  it('stock rows show name and price', () => {
    const rows = stockRows(ITEMS, SHOPS.forge!.stock);
    expect(rows[0]).toBe('Wooden Club     30');
    expect(rows[2]).toBe('Bronze Sword   180');
  });

  it('sell rows show the pack label and sell price', () => {
    const p = fresh({ inventory: [{ item: 'herb', count: 3 }, { item: 'aldric_shield', count: 1 }] });
    expect(sellRows(ITEMS, p)).toEqual(['Herb x3          5', "Aldric's Shield  -"]);
    expect(sellRows(ITEMS, fresh({ inventory: [] }))).toEqual([]);
  });

  it('key items are not listed for sale; other rows keep their order', () => {
    const p = fresh({ inventory: [{ item: 'herb', count: 1 }, { item: 'journal_page', count: 1 }, { item: 'wooden_club', count: 1 }] });
    expect(sellRows(ITEMS, p)).toEqual(['Herb x1          5', 'Wooden Club     15']);
    expect(sellRows(ITEMS, fresh({ inventory: [{ item: 'journal_page', count: 1 }] }))).toEqual([]);
    expect(sell(ITEMS, p, 1)).toBeNull();
  });

  it('every row any item can make fits the list window (at most 18 characters)', () => {
    for (const shop of Object.values(SHOPS)) for (const r of stockRows(ITEMS, shop.stock)) expect(r.length).toBeLessThanOrEqual(18);
    for (const id of Object.keys(ITEMS))
      for (const count of [1, 9]) {
        const p = fresh({ inventory: [{ item: id, count }] });
        for (const r of sellRows(ITEMS, p)) expect(r.length, `${id} x${count}`).toBeLessThanOrEqual(18);
      }
  });

  it('every row is 18 characters', () => {
    for (const shop of Object.values(SHOPS)) for (const r of stockRows(ITEMS, shop.stock)) expect(r).toHaveLength(18);
    const p = fresh({ inventory: fullPack({ item: 'herb', count: 3 }) });
    for (const r of sellRows(ITEMS, p)) expect(r).toHaveLength(18);
  });
});

describe('shop data', () => {
  it('every stock id is a priced item listed once', () => {
    for (const [name, shop] of Object.entries(SHOPS)) {
      expect(new Set(shop.stock).size, name).toBe(shop.stock.length);
      for (const id of shop.stock) {
        const def = (ITEMS as Record<string, ItemDef | undefined>)[id];
        expect(def, `${name}:${id}`).toBeDefined();
        expect(def!.price, `${name}:${id}`).toBeGreaterThan(0);
      }
    }
  });
});
