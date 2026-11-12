export type ItemKind = 'weapon' | 'armor' | 'shield' | 'consumable' | 'key';

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  atk?: number;
  def?: number;
  price: number;
  stack: number;
}

export type ItemTable = Record<string, ItemDef>;
