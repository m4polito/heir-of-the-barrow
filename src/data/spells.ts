import type { SpellDef } from '../game/effects';
import type { SpellId } from './levels';

export const SPELLS = {
  heal: { id: 'heal', name: 'Heal', mp: 4, where: 'both', effect: { kind: 'heal', min: 10, max: 17 } },
  ember: { id: 'ember', name: 'Ember', mp: 2, where: 'battle', effect: { kind: 'damage', min: 5, max: 12 } },
  homeward: { id: 'homeward', name: 'Homeward', mp: 8, where: 'field', effect: { kind: 'warp' } },
} satisfies Record<SpellId, SpellDef>;
