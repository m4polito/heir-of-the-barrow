import type { Rng } from '../engine/rng';
import type { SfxId } from '../data/sfx';
import { removeItem } from './inventory';
import { rollEffect, usableIn, type Effect, type SpellTable, type UseWhere } from './effects';
import type { ItemTable } from './items';
import { spellsKnown, type PlayerState } from './player';

export type FieldResult =
  | { ok: true; player: PlayerState; text: string; sfx: SfxId; warp?: true }
  | { ok: false; text: string };

const CANNOT: FieldResult = { ok: false, text: 'You cannot use that now.' };

/** Apply an effect in the field. The caller has already checked the context and paid any cost. */
function applyEffect(rng: Rng, p: PlayerState, effect: Effect): FieldResult {
  if (effect.kind === 'damage') return CANNOT;
  if (effect.kind === 'warp') return { ok: true, player: p, text: 'You are carried home.', sfx: 'spell', warp: true };
  if (p.hp >= p.maxHp) return { ok: false, text: 'You are not hurt.' };
  const n = Math.min(rollEffect(rng, effect), p.maxHp - p.hp);
  return { ok: true, player: { ...p, hp: p.hp + n }, text: `You recover ${n} HP.`, sfx: 'heal' };
}

function usable(where: UseWhere, effect: Effect): boolean {
  return usableIn(where, 'field') && effect.kind !== 'damage';
}

export function castInField(rng: Rng, spells: SpellTable, p: PlayerState, spellId: string): FieldResult {
  const spell = spells[spellId];
  if (!spell) throw new Error(`Unknown spell: ${spellId}`);
  if (!spellsKnown(p.level).includes(spellId)) throw new Error(`Spell not known: ${spellId}`);
  if (!usable(spell.where, spell.effect)) return CANNOT;
  if (p.mp < spell.mp) return { ok: false, text: 'Not enough MP.' };
  const r = applyEffect(rng, p, spell.effect);
  if (!r.ok) return r;
  return { ...r, player: { ...r.player, mp: r.player.mp - spell.mp } };
}

export function useItemInField(rng: Rng, items: ItemTable, p: PlayerState, itemId: string): FieldResult {
  if (!p.inventory.some((s) => s.item === itemId && s.count > 0)) throw new Error(`Item not held: ${itemId}`);
  const use = items[itemId]?.use;
  if (!use || !usable(use.where, use.effect)) return CANNOT;
  const r = applyEffect(rng, p, use.effect);
  if (!r.ok) return r;
  const removed = removeItem(r.player, itemId);
  if (!removed.ok) throw new Error(`Item not held: ${itemId}`);
  return { ...r, player: removed.player };
}
