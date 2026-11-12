import { ITEMS } from '../data/items';
import type { ItemId } from '../data/items';
import type { EquipSlot, InventorySlot, PlayerState } from './player';

export const INVENTORY_SLOTS = 8;

export interface InvResult {
  player: PlayerState;
  ok: boolean;
}

export function addItem(p: PlayerState, id: ItemId, n = 1): InvResult {
  const def = ITEMS[id] as (typeof ITEMS)[ItemId] | undefined;
  if (!def) return { player: p, ok: false };
  const cap = def.stack;
  const inv: InventorySlot[] = p.inventory.map((s) => ({ ...s }));
  let left = n;
  for (const s of inv) {
    if (left <= 0) break;
    if (s.item === id && s.count < cap) {
      const take = Math.min(cap - s.count, left);
      s.count += take;
      left -= take;
    }
  }
  while (left > 0 && inv.length < INVENTORY_SLOTS) {
    const take = Math.min(cap, left);
    inv.push({ item: id, count: take });
    left -= take;
  }
  if (left > 0) return { player: p, ok: false };
  return { player: { ...p, inventory: inv }, ok: true };
}

export function removeItem(p: PlayerState, id: ItemId, n = 1): InvResult {
  const total = p.inventory.reduce((sum, s) => (s.item === id ? sum + s.count : sum), 0);
  if (total < n) return { player: p, ok: false };
  let left = n;
  const inv: InventorySlot[] = [];
  for (const s of p.inventory) {
    if (s.item !== id || left <= 0) {
      inv.push({ ...s });
      continue;
    }
    const take = Math.min(s.count, left);
    left -= take;
    if (s.count - take > 0) inv.push({ ...s, count: s.count - take });
  }
  return { player: { ...p, inventory: inv }, ok: true };
}

export function equip(p: PlayerState, id: ItemId): InvResult {
  const kind = ITEMS[id].kind;
  if (kind !== 'weapon' && kind !== 'armor' && kind !== 'shield') return { player: p, ok: false };
  const removed = removeItem(p, id);
  if (!removed.ok) return { player: p, ok: false };
  let next = removed.player;
  const old = next.equipment[kind];
  if (old) {
    const back = addItem(next, old);
    if (!back.ok) return { player: p, ok: false };
    next = back.player;
  }
  return { player: { ...next, equipment: { ...next.equipment, [kind]: id } }, ok: true };
}

export function unequip(p: PlayerState, slot: EquipSlot): InvResult {
  const id = p.equipment[slot];
  if (!id) return { player: p, ok: false };
  const added = addItem(p, id);
  if (!added.ok) return { player: p, ok: false };
  const equipment = { ...added.player.equipment };
  delete equipment[slot];
  return { player: { ...added.player, equipment }, ok: true };
}
