import type { Effect, UseWhere } from './effects';

export type ItemKind = 'weapon' | 'armor' | 'shield' | 'consumable' | 'key';

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  atk?: number;
  def?: number;
  price: number;
  stack: number;
  use?: { where: UseWhere; effect: Effect };
}

export type ItemTable = Record<string, ItemDef>;
