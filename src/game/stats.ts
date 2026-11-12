import { ITEMS } from '../data/items';
import type { PlayerState } from './player';

export function attackOf(p: PlayerState): number {
  const w = p.equipment.weapon;
  return p.str + (w ? (ITEMS[w].atk ?? 0) : 0);
}

export function defenseOf(p: PlayerState): number {
  const a = p.equipment.armor;
  const s = p.equipment.shield;
  return Math.floor(p.agi / 2) + (a ? (ITEMS[a].def ?? 0) : 0) + (s ? (ITEMS[s].def ?? 0) : 0);
}
