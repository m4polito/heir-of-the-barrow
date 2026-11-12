import type { Effect } from '../effects';
import { usableIn } from '../effects';
import type { SpellDef, SpellTable } from '../effects';
import type { ItemTable } from '../items';
import { spellsKnown, type PlayerState } from '../player';

export interface BattleKit {
  spells: SpellDef[];
  items: { id: string; name: string; count: number; effect: Effect }[];
}

/** What the hero can use in battle: known spells in learning order, held items (counts summed across slots). */
export function battleKit(p: PlayerState, spells: SpellTable, items: ItemTable): BattleKit {
  const known: SpellDef[] = [];
  for (const id of spellsKnown(p.level)) {
    const def = spells[id];
    if (!def) throw new Error(`Unknown spell: ${id}`);
    if (usableIn(def.where, 'battle')) known.push(def);
  }
  const held: BattleKit['items'] = [];
  for (const slot of p.inventory) {
    const def = items[slot.item];
    if (!def?.use || !usableIn(def.use.where, 'battle')) continue;
    const entry = held.find((h) => h.id === def.id);
    if (entry) entry.count += slot.count;
    else held.push({ id: def.id, name: def.name, count: slot.count, effect: def.use.effect });
  }
  return { spells: known, items: held };
}
