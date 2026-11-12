import { LEVELS } from '../data/levels';
import type { ItemId } from '../data/items';

export type EquipSlot = 'weapon' | 'armor' | 'shield';

export interface InventorySlot {
  item: ItemId;
  count: number;
}

export interface PlayerState {
  name: string;
  level: number;
  xp: number;
  hp: number;
  mp: number;
  gold: number;
  str: number;
  agi: number;
  maxHp: number;
  maxMp: number;
  equipment: Partial<Record<EquipSlot, ItemId>>;
  inventory: InventorySlot[];
  flags: string[];
}

export function createPlayer(name: string): PlayerState {
  const row = LEVELS[0]!;
  return {
    name,
    level: row.level,
    xp: row.xp,
    hp: row.maxHp,
    mp: row.maxMp,
    gold: 40,
    str: row.str,
    agi: row.agi,
    maxHp: row.maxHp,
    maxMp: row.maxMp,
    equipment: {},
    inventory: [{ item: 'herb', count: 1 }],
    flags: [],
  };
}

export function hasFlag(p: PlayerState, flag: string): boolean {
  return p.flags.includes(flag);
}

export function setFlag(p: PlayerState, flag: string): PlayerState {
  return hasFlag(p, flag) ? p : { ...p, flags: [...p.flags, flag] };
}

export function applyLevel(p: PlayerState, level: number): PlayerState {
  const lv = Math.min(LEVELS.length, Math.max(1, Math.floor(level)));
  const row = LEVELS[lv - 1]!;
  const hpRatio = p.maxHp > 0 ? p.hp / p.maxHp : 1;
  const mpRatio = p.maxMp > 0 ? p.mp / p.maxMp : 1;
  return {
    ...p,
    level: row.level,
    xp: row.xp,
    str: row.str,
    agi: row.agi,
    maxHp: row.maxHp,
    maxMp: row.maxMp,
    hp: Math.max(1, Math.floor(row.maxHp * hpRatio)),
    mp: Math.floor(row.maxMp * mpRatio),
  };
}
