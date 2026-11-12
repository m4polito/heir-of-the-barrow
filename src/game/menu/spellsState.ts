import type { SpellDef } from '../effects';

/** One row per spell: the name padded to ten, then its MP cost in two columns. */
export function spellLines(spells: readonly SpellDef[]): string[] {
  if (spells.length === 0) return ['Nothing'];
  return spells.map((s) => s.name.padEnd(10) + String(s.mp).padStart(2));
}
