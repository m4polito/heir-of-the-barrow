import { addItem, isEquipment, itemLines, removeItem } from './inventory';
import type { ItemDef, ItemTable } from './items';
import { GOLD_MAX, type EquipSlot, type PlayerState } from './player';

export interface ShopDef {
  stock: string[];
}
export type ShopTable = Record<string, ShopDef>;

export type BuyCheck =
  | { ok: true; wearOnly: boolean; tradeIn: { id: string; gold: number } | null }
  | { ok: false; why: 'gold' | 'owned' | 'full' };

/** What a shop pays for an item: half its price, rounded down. 0 means it cannot be sold. */
export function sellPrice(def: ItemDef | undefined): number {
  if (!def || def.kind === 'key') return 0;
  return Math.floor(def.price / 2);
}

/** In the pack or worn. */
export function owns(p: PlayerState, id: string): boolean {
  return p.inventory.some((s) => s.item === id) || Object.values(p.equipment).includes(id);
}

export function buyCheck(items: ItemTable, p: PlayerState, id: string): BuyCheck {
  const def = items[id];
  if (!def || def.price > p.gold) return { ok: false, why: 'gold' };
  const gear = isEquipment(items, id);
  if (gear && owns(p, id)) return { ok: false, why: 'owned' };
  if (addItem(items, p, id).ok) return { ok: true, wearOnly: false, tradeIn: null };
  if (gear) {
    const worn = p.equipment[def.kind as EquipSlot];
    if (!worn) return { ok: true, wearOnly: true, tradeIn: null };
    const gold = sellPrice(items[worn]);
    if (gold > 0) return { ok: true, wearOnly: true, tradeIn: { id: worn, gold } };
  }
  return { ok: false, why: 'full' };
}

export function buy(items: ItemTable, p: PlayerState, id: string): PlayerState {
  const check = buyCheck(items, p, id);
  if (!check.ok || check.wearOnly) throw new Error(`Cannot buy: ${id}`);
  const added = addItem(items, p, id);
  return { ...added.player, gold: p.gold - items[id]!.price };
}

export function buyAndWear(items: ItemTable, p: PlayerState, id: string): PlayerState {
  const check = buyCheck(items, p, id);
  if (!check.ok || !check.wearOnly) throw new Error(`Cannot buy: ${id}`);
  const slot = items[id]!.kind as EquipSlot;
  const gold = Math.min(GOLD_MAX, p.gold - items[id]!.price + (check.tradeIn?.gold ?? 0));
  return { ...p, gold, equipment: { ...p.equipment, [slot]: id } };
}

/** Sells one of the item in a pack slot; null when there is nothing to sell or it cannot be sold. */
export function sell(items: ItemTable, p: PlayerState, slot: number): { player: PlayerState; gold: number } | null {
  const s = p.inventory[slot];
  if (!s) return null;
  const gold = sellPrice(items[s.item]);
  if (gold <= 0) return null;
  const inventory = p.inventory.flatMap((x, i) => (i !== slot ? [{ ...x }] : x.count > 1 ? [{ ...x, count: x.count - 1 }] : []));
  return { player: { ...p, inventory, gold: Math.min(GOLD_MAX, p.gold + gold) }, gold };
}

const row = (label: string, price: string): string => label.padEnd(15) + price.padStart(3);

export function stockRows(items: ItemTable, stock: readonly string[]): string[] {
  return stock.map((id) => row(items[id]?.name ?? id, String(items[id]?.price ?? 0)));
}

/** Pack slots the shop will list: key items are never offered. */
export function sellSlots(items: ItemTable, p: PlayerState): number[] {
  return p.inventory.flatMap((s, i) => (items[s.item]?.kind === 'key' ? [] : [i]));
}

export function sellRows(items: ItemTable, p: PlayerState): string[] {
  const labels = itemLines(items, p);
  return sellSlots(items, p).map((slot) => {
    const price = sellPrice(items[p.inventory[slot]!.item]);
    return row(labels[slot]!, price > 0 ? String(price) : '-');
  });
}
