import type { Rng } from '../engine/rng';

export type Effect =
  | { kind: 'heal'; min: number; max: number }
  | { kind: 'damage'; min: number; max: number }
  | { kind: 'warp' }
  | { kind: 'light'; radius: number; steps: number }
  | { kind: 'read'; dialog: string };

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

/** Roll an effect's amount; a warp, a light and a read have none and draw nothing. */
export function rollEffect(rng: Rng, e: Effect): number {
  return e.kind === 'heal' || e.kind === 'damage' ? rng.int(e.min, e.max) : 0;
}
