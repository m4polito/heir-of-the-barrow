import type { Rng } from '../engine/rng';

export type Effect =
  | { kind: 'heal'; min: number; max: number }
  | { kind: 'damage'; min: number; max: number }
  | { kind: 'warp' };

export type UseWhere = 'battle' | 'field' | 'both';

export function usableIn(where: UseWhere, ctx: 'battle' | 'field'): boolean {
  return where === 'both' || where === ctx;
}

export interface SpellDef {
  id: string;
  name: string;
  mp: number;
  where: UseWhere;
  effect: Effect;
}

export type SpellTable = Record<string, SpellDef>;

/** Roll an effect's amount; a warp has none and draws nothing. */
export function rollEffect(rng: Rng, e: Effect): number {
  return e.kind === 'warp' ? 0 : rng.int(e.min, e.max);
}
