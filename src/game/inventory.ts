import type { ItemTable } from './items';
import type { EquipSlot, InventorySlot, PlayerState } from './player';

export const INVENTORY_SLOTS = 8;
/** The most key-item entries a save may hold; they take no pack slot. */
export const KEY_ITEM_SLOTS = 8;

export function isKeyItem(items: ItemTable, id: string): boolean {
  return items[id]?.kind === 'key';
}

/** Pack slots in use: every entry that is not a key item. Key items take no slot. */
export function packSlots(items: ItemTable, p: PlayerState): number {
  return p.inventory.filter((s) => !isKeyItem(items, s.item)).length;
}

export interface InvResult {
  player: PlayerState;
  ok: boolean;
}

export function addItem(items: ItemTable, p: PlayerState, id: string, n = 1): InvResult {
  const def = items[id];
  if (!def) return { player: p, ok: false };
  const cap = def.stack;
  if (def.kind === 'key' && p.inventory.some((s) => s.item === id && s.count >= cap)) return { player: p, ok: true };
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
  let slots = packSlots(items, { ...p, inventory: inv });
  const key = isKeyItem(items, id);
  while (left > 0 && (key || slots < INVENTORY_SLOTS)) {
    const take = Math.min(cap, left);
    inv.push({ item: id, count: take });
    left -= take;
    if (!key) slots++;
  }
  if (left > 0) return { player: p, ok: false };
  return { player: { ...p, inventory: inv }, ok: true };
}

export function removeItem(p: PlayerState, id: string, n = 1): InvResult {
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

export function equip(items: ItemTable, p: PlayerState, id: string): InvResult {
  const kind = items[id]?.kind;
  if (kind !== 'weapon' && kind !== 'armor' && kind !== 'shield') return { player: p, ok: false };
  const removed = removeItem(p, id);
  if (!removed.ok) return { player: p, ok: false };
  let next = removed.player;
  const old = next.equipment[kind];
  if (old) {
    const back = addItem(items, next, old);
    if (!back.ok) return { player: p, ok: false };
    next = back.player;
  }
  return { player: { ...next, equipment: { ...next.equipment, [kind]: id } }, ok: true };
}

export function unequip(items: ItemTable, p: PlayerState, slot: EquipSlot): InvResult {
  const id = p.equipment[slot];
  if (!id) return { player: p, ok: false };
  const added = addItem(items, p, id);
  if (!added.ok) return { player: p, ok: false };
  const equipment = { ...added.player.equipment };
  delete equipment[slot];
  return { player: { ...added.player, equipment }, ok: true };
}

const EQUIP_SLOTS: EquipSlot[] = ['weapon', 'armor', 'shield'];

export function itemName(items: ItemTable, id: string): string {
  return items[id]?.name ?? id;
}

export function isEquipment(items: ItemTable, id: string): boolean {
  const kind = items[id]?.kind;
  return kind === 'weapon' || kind === 'armor' || kind === 'shield';
}

export function isConsumable(items: ItemTable, id: string): boolean {
  return items[id]?.kind === 'consumable';
}

export function itemLines(items: ItemTable, p: PlayerState): string[] {
  if (p.inventory.length === 0) return ['Nothing'];
  return p.inventory.map((s) => (isConsumable(items, s.item) ? `${itemName(items, s.item)} x${s.count}` : itemName(items, s.item)));
}

export function equipLines(items: ItemTable, p: PlayerState): { slots: string[]; candidates: string[] } {
  const label = { weapon: 'WEAPON: ', armor: 'ARMOR:  ', shield: 'SHIELD: ' };
  const slots = EQUIP_SLOTS.map((s) => {
    const id = p.equipment[s];
    return label[s] + (id ? itemName(items, id) : 'none');
  });
  const candidates = p.inventory.filter((s) => isEquipment(items, s.item)).map((s) => s.item);
  return { slots, candidates };
}
