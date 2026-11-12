import type { Rng } from '../../engine/rng';
import type { MonsterDef } from './monster';

export const MISS_CHANCE = 1 / 16;
export const CRIT_CHANCE = 1 / 32;

export interface Strike {
  kind: 'miss' | 'dodge' | 'hit' | 'crit';
  damage: number;
}

export function damageRoll(rng: Rng, atk: number, def: number): number {
  const base = atk - Math.floor(def / 2);
  if (base <= 0) return rng.next() < 0.5 ? 0 : 1;
  const lo = Math.ceil(base / 4);
  const hi = Math.max(lo, Math.floor(base / 2));
  return rng.int(lo, hi);
}

export function heroStrike(rng: Rng, atk: number, m: Pick<MonsterDef, 'def' | 'dodge' | 'boss'>): Strike {
  if (rng.next() < MISS_CHANCE) return { kind: 'miss', damage: 0 };
  if (rng.next() < m.dodge) return { kind: 'dodge', damage: 0 };
  if (!m.boss && rng.next() < CRIT_CHANCE) return { kind: 'crit', damage: rng.int(Math.ceil(atk / 2), atk) };
  return { kind: 'hit', damage: damageRoll(rng, atk, m.def) };
}

export function monsterStrike(rng: Rng, atk: number, heroDef: number): Strike {
  if (rng.next() < MISS_CHANCE) return { kind: 'miss', damage: 0 };
  return { kind: 'hit', damage: damageRoll(rng, atk, heroDef) };
}

export function monsterFirst(rng: Rng, heroAgi: number, monsterAgi: number): boolean {
  const monsterRoll = monsterAgi * rng.int(0, 255);
  const heroRoll = heroAgi * rng.int(0, 255);
  return monsterRoll > heroRoll;
}

export function runSucceeds(rng: Rng, heroAgi: number, monsterAgi: number, runFactor: number): boolean {
  if (!Number.isFinite(runFactor)) return false;
  const heroRoll = heroAgi * rng.int(0, 255);
  const monsterRoll = monsterAgi * rng.int(0, 255) * runFactor;
  return heroRoll > monsterRoll;
}
