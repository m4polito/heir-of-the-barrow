import type { ItemTable } from './items';
import type { PlayerState } from './player';

export function attackOf(items: ItemTable, p: PlayerState): number {
  const w = p.equipment.weapon;
  return p.str + (w ? (items[w]?.atk ?? 0) : 0);
}

export function defenseOf(items: ItemTable, p: PlayerState): number {
  const a = p.equipment.armor;
  const s = p.equipment.shield;
  return Math.floor(p.agi / 2) + (a ? (items[a]?.def ?? 0) : 0) + (s ? (items[s]?.def ?? 0) : 0);
}

export function statusLines(items: ItemTable, p: PlayerState): string[] {
  return [
    'NAME ' + p.name,
    'LV   ' + p.level,
    'HP   ' + p.hp + '/' + p.maxHp,
    'MP   ' + p.mp + '/' + p.maxMp,
    'GOLD ' + p.gold,
    'XP   ' + p.xp,
    'STR  ' + p.str,
    'AGI  ' + p.agi,
    'ATK  ' + attackOf(items, p),
    'DEF  ' + defenseOf(items, p),
  ];
}
