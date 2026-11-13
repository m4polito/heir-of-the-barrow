import { LEVELS, levelForXp } from '../data/levels';
import { removeItem } from './inventory';

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
  /** Steps of torchlight left. */
  torch: number;
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
    torch: 0,
  };
}

export function hasFlag(p: PlayerState, flag: string): boolean {
  return p.flags.includes(flag);
}

export function setFlag(p: PlayerState, flag: string): PlayerState {
  return hasFlag(p, flag) ? p : { ...p, flags: [...p.flags, flag] };
}

export function clearFlag(p: PlayerState, flag: string): PlayerState {
  return hasFlag(p, flag) ? { ...p, flags: p.flags.filter((f) => f !== flag) } : p;
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

/** Death penalty: half the gold, full hp and mp, and a lit torch goes out; nothing else changes. */
export function applyDeath(p: PlayerState): PlayerState {
  return { ...p, gold: Math.floor(p.gold / 2), hp: p.maxHp, mp: p.maxMp, torch: 0 };
}

/** Spell ids learned at or below the given level, in table order. */
export function spellsKnown(level: number): string[] {
  const out: string[] = [];
  for (const row of LEVELS) if (row.level <= level && row.learns) out.push(row.learns);
  return out;
}

export interface LevelUp {
  from: number;
  to: number;
  str: number;
  agi: number;
  maxHp: number;
  maxMp: number;
  learned: string[];
}

/** Add experience (capped); raise the level when a threshold is crossed. Never lowers a level. */
export function gainXp(p: PlayerState, xp: number): { player: PlayerState; levelUp: LevelUp | null } {
  const newXp = Math.min(XP_MAX, p.xp + xp);
  const to = Math.max(p.level, levelForXp(newXp));
  if (to === p.level) return { player: { ...p, xp: newXp }, levelUp: null };
  const row = LEVELS[to - 1]!;
  const levelUp: LevelUp = {
    from: p.level,
    to,
    str: row.str - p.str,
    agi: row.agi - p.agi,
    maxHp: row.maxHp - p.maxHp,
    maxMp: row.maxMp - p.maxMp,
    learned: LEVELS.filter((r) => r.level > p.level && r.level <= to && r.learns).map((r) => r.learns!),
  };
  return {
    player: {
      ...p,
      level: to,
      xp: newXp,
      str: row.str,
      agi: row.agi,
      maxHp: row.maxHp,
      maxMp: row.maxMp,
      hp: p.hp + levelUp.maxHp,
      mp: p.mp + levelUp.maxMp,
    },
    levelUp,
  };
}

/** Experience still needed for the next level, or null at the last level. */
export function xpToNext(p: PlayerState): number | null {
  const next = LEVELS[p.level];
  return next ? Math.max(0, next.xp - p.xp) : null;
}

/** Fold a finished battle back into the player: hp, mp, items spent, and an optional capped reward. */
export function settleBattle(
  p: PlayerState,
  end: { hp: number; mp: number; itemsUsed: readonly string[] },
  reward: { xp: number; gold: number } | null,
): PlayerState {
  let q: PlayerState = {
    ...p,
    hp: Math.min(p.maxHp, Math.max(0, end.hp)),
    mp: Math.min(p.maxMp, Math.max(0, end.mp)),
  };
  for (const id of end.itemsUsed) {
    const r = removeItem(q, id);
    if (!r.ok) throw new Error(`Used item not held: ${id}`);
    q = r.player;
  }
  if (reward) {
    q = { ...q, gold: Math.min(GOLD_MAX, q.gold + reward.gold) };
    q = gainXp(q, reward.xp).player;
  }
  return q;
}
