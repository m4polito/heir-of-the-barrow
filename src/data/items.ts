import type { ItemDef } from '../game/items';

export type ItemId =
  | 'aldric_shield'
  | 'wooden_club'
  | 'iron_knife'
  | 'bronze_sword'
  | 'cloth_tunic'
  | 'leather_armor'
  | 'plank_shield'
  | 'herb'
  | 'torch'
  | 'journal_page';

export const ITEMS: Record<ItemId, ItemDef> = {
  aldric_shield: { id: 'aldric_shield', name: "Aldric's Shield", kind: 'shield', def: 4, price: 0, stack: 1 },
  wooden_club: { id: 'wooden_club', name: 'Wooden Club', kind: 'weapon', atk: 2, price: 30, stack: 1 },
  iron_knife: { id: 'iron_knife', name: 'Iron Knife', kind: 'weapon', atk: 4, price: 60, stack: 1 },
  bronze_sword: { id: 'bronze_sword', name: 'Bronze Sword', kind: 'weapon', atk: 10, price: 180, stack: 1 },
  cloth_tunic: { id: 'cloth_tunic', name: 'Cloth Tunic', kind: 'armor', def: 2, price: 20, stack: 1 },
  leather_armor: { id: 'leather_armor', name: 'Leather Armor', kind: 'armor', def: 4, price: 70, stack: 1 },
  plank_shield: { id: 'plank_shield', name: 'Plank Shield', kind: 'shield', def: 2, price: 25, stack: 1 },
  herb: { id: 'herb', name: 'Herb', kind: 'consumable', price: 10, stack: 6, use: { where: 'both', effect: { kind: 'heal', min: 20, max: 30 } } },
  torch: { id: 'torch', name: 'Torch', kind: 'consumable', price: 8, stack: 6, use: { where: 'field', effect: { kind: 'light', radius: 3, steps: 200 } } },
  journal_page: { id: 'journal_page', name: 'Journal Page', kind: 'key', price: 0, stack: 1 },
};
