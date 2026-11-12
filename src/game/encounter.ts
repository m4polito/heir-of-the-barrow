import type { Rng } from '../engine/rng';
import type { TileDef } from '../data/tiles';
import type { EncounterTable } from './map';

/** Steps after a battle (or a map entry) during which no encounter can start. */
export const ENCOUNTER_GRACE = 3;

export interface EncounterHit {
  monster: string;
  backdrop: string;
}

/** Roll for a random battle on the tile just stepped onto. Draws nothing when there is nothing to roll. */
export function rollEncounter(
  rng: Rng,
  table: EncounterTable,
  tile: Pick<TileDef, 'name' | 'encounterRate'>,
): EncounterHit | null {
  const zone = table.zones[tile.name];
  if (!zone || zone.monsters.length === 0 || tile.encounterRate <= 0) return null;
  const total = zone.monsters.reduce((sum, e) => sum + e.weight, 0);
  if (total <= 0) return null;
  if (!(rng.next() < table.baseRate * tile.encounterRate)) return null;
  const r = rng.next() * total;
  let run = 0;
  for (const e of zone.monsters) {
    run += e.weight;
    if (run > r) return { monster: e.monster, backdrop: zone.backdrop };
  }
  const last = zone.monsters[zone.monsters.length - 1]!;
  return { monster: last.monster, backdrop: zone.backdrop };
}

/** One step's worth of encounter logic: grace steps count down silently, then the roll applies. */
export function encounterStep(
  rng: Rng,
  table: EncounterTable,
  tile: Pick<TileDef, 'name' | 'encounterRate'>,
  grace: number,
): { grace: number; hit: EncounterHit | null } {
  if (grace > 0) return { grace: grace - 1, hit: null };
  return { grace: 0, hit: rollEncounter(rng, table, tile) };
}
