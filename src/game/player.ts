import { LEVELS } from '../data/levels';

export type EquipSlot = 'weapon' | 'armor' | 'shield';

export interface InventorySlot {
  item: string;
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
  equipment: Partial<Record<EquipSlot, string>>;
  inventory: InventorySlot[];
  flags: string[];
}

export function createPlayer(name: string, startingItems: readonly { item: string; count: number }[]): PlayerState {
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
    inventory: startingItems.map((s) => ({ item: s.item, count: s.count })),
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
  // Integer arithmetic: a float ratio can land just under a whole number and lose a point.
  const scale = (max: number, cur: number, curMax: number) =>
    curMax > 0 ? Math.floor((max * cur) / curMax) : max;
  return {
    ...p,
    level: row.level,
    xp: row.xp,
    str: row.str,
    agi: row.agi,
    maxHp: row.maxHp,
    maxMp: row.maxMp,
    hp: Math.max(1, scale(row.maxHp, p.hp, p.maxHp)),
    mp: scale(row.maxMp, p.mp, p.maxMp),
  };
}

export const GOLD_MAX = 65535;
export const XP_MAX = 65535;

/** Death penalty: half the gold, full hp and mp; nothing else changes. */
export function applyDeath(p: PlayerState): PlayerState {
  return { ...p, gold: Math.floor(p.gold / 2), hp: p.maxHp, mp: p.maxMp };
}

/** Fold a finished battle back into the player: remaining hp and an optional capped reward. */
export function settleBattle(
  p: PlayerState,
  heroHp: number,
  reward: { xp: number; gold: number } | null,
): PlayerState {
  return {
    ...p,
    hp: Math.min(p.maxHp, Math.max(0, heroHp)),
    xp: reward ? Math.min(XP_MAX, p.xp + reward.xp) : p.xp,
    gold: reward ? Math.min(GOLD_MAX, p.gold + reward.gold) : p.gold,
  };
}
