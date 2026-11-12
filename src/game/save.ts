import type { Dir } from '../engine/constants';
import { LEVELS } from '../data/levels';
import { GOLD_MAX, XP_MAX } from './player';
import type { EquipSlot, InventorySlot, PlayerState } from './player';
import { INVENTORY_SLOTS } from './inventory';
import type { ItemTable } from './items';
import { isWalkable } from './map';
import type { GameMap } from './map';
import { NAME_GRID, NAME_MAX } from './nameEntry';

export const SAVE_VERSION = 1;

const FLAGS_MAX = 64;
const FLAG_LEN_MAX = 32;
const TORCH_STEPS_MAX = 65535;
const DIRS: readonly Dir[] = ['up', 'down', 'left', 'right'];
const EQUIP_SLOTS: readonly EquipSlot[] = ['weapon', 'armor', 'shield'];
/** The grid's character rows; the last row holds the BACK and END actions. */
const NAME_CHARS = NAME_GRID.slice(0, -1).join('');

export interface SaveData {
  version: 1;
  name: string;
  level: number;
  xp: number;
  hp: number;
  mp: number;
  gold: number;
  equipment: Partial<Record<EquipSlot, string>>;
  inventory: InventorySlot[];
  flags: string[];
  map: string;
  x: number;
  y: number;
  facing: Dir;
  torchSteps: number;
}

export interface SaveContext {
  items: ItemTable;
  maps: Record<string, GameMap>;
}

export function toSave(
  p: PlayerState,
  at: { map: string; x: number; y: number; facing: Dir },
): SaveData {
  return {
    version: SAVE_VERSION,
    name: p.name,
    level: p.level,
    xp: p.xp,
    hp: p.hp,
    mp: p.mp,
    gold: p.gold,
    equipment: { ...p.equipment },
    inventory: p.inventory.map((s) => ({ item: s.item, count: s.count })),
    flags: [...p.flags],
    map: at.map,
    x: at.x,
    y: at.y,
    facing: at.facing,
    torchSteps: 0,
  };
}

export function fromSave(s: SaveData): PlayerState {
  const row = LEVELS[s.level - 1]!;
  return {
    name: s.name,
    level: s.level,
    xp: s.xp,
    hp: s.hp,
    mp: s.mp,
    gold: s.gold,
    str: row.str,
    agi: row.agi,
    maxHp: row.maxHp,
    maxMp: row.maxMp,
    equipment: { ...s.equipment },
    inventory: s.inventory.map((i) => ({ item: i.item, count: i.count })),
    flags: [...s.flags],
  };
}

function isInt(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function has(o: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, key);
}

export function parseSave(text: string | null, ctx: SaveContext): SaveData | null {
  if (text === null) return null;
  try {
    return validate(JSON.parse(text), ctx);
  } catch {
    return null;
  }
}

function validate(raw: unknown, ctx: SaveContext): SaveData | null {
  if (!isRecord(raw) || raw.version !== SAVE_VERSION) return null;

  const { name, level, xp, hp, mp, gold, torchSteps } = raw;
  if (typeof name !== 'string' || name.length < 1 || name.length > NAME_MAX) return null;
  for (const ch of name) if (!NAME_CHARS.includes(ch)) return null;
  if (!isInt(level, 1, LEVELS.length)) return null;
  const row = LEVELS[level - 1]!;
  if (!isInt(xp, 0, XP_MAX) || !isInt(gold, 0, GOLD_MAX)) return null;
  if (!isInt(hp, 1, row.maxHp) || !isInt(mp, 0, row.maxMp)) return null;
  if (!isInt(torchSteps, 0, TORCH_STEPS_MAX)) return null;

  const equipment: Partial<Record<EquipSlot, string>> = {};
  if (!isRecord(raw.equipment)) return null;
  for (const key of Object.keys(raw.equipment)) {
    if (!(EQUIP_SLOTS as readonly string[]).includes(key)) return null;
    const id = raw.equipment[key];
    if (typeof id !== 'string' || !has(ctx.items, id) || ctx.items[id]!.kind !== key) return null;
    equipment[key as EquipSlot] = id;
  }

  if (!Array.isArray(raw.inventory) || raw.inventory.length > INVENTORY_SLOTS) return null;
  const inventory: InventorySlot[] = [];
  for (const entry of raw.inventory as unknown[]) {
    if (!isRecord(entry) || typeof entry.item !== 'string' || !has(ctx.items, entry.item)) return null;
    if (!isInt(entry.count, 1, ctx.items[entry.item]!.stack)) return null;
    inventory.push({ item: entry.item, count: entry.count });
  }

  if (!Array.isArray(raw.flags) || raw.flags.length > FLAGS_MAX) return null;
  const flags: string[] = [];
  for (const f of raw.flags as unknown[]) {
    if (typeof f !== 'string' || f.length < 1 || f.length > FLAG_LEN_MAX || flags.includes(f)) return null;
    flags.push(f);
  }

  if (typeof raw.map !== 'string' || !has(ctx.maps, raw.map)) return null;
  const map = ctx.maps[raw.map]!;
  const { x, y, facing } = raw;
  if (!isInt(x, 0, map.width - 1) || !isInt(y, 0, map.height - 1) || !isWalkable(map, x, y)) return null;
  if (typeof facing !== 'string' || !(DIRS as readonly string[]).includes(facing)) return null;

  return {
    version: SAVE_VERSION,
    name,
    level,
    xp,
    hp,
    mp,
    gold,
    equipment,
    inventory,
    flags,
    map: raw.map,
    x,
    y,
    facing: facing as Dir,
    torchSteps,
  };
}

export function saveKey(prefix: string): string {
  return `${prefix}.save.v${SAVE_VERSION}`;
}

export function writeSave(
  storage: Pick<Storage, 'setItem'> | null | undefined,
  key: string,
  data: SaveData,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function readSave(
  storage: Pick<Storage, 'getItem'> | null | undefined,
  key: string,
  ctx: SaveContext,
): SaveData | null {
  if (!storage) return null;
  try {
    return parseSave(storage.getItem(key), ctx);
  } catch {
    return null;
  }
}
