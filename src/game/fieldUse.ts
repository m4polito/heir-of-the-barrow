import type { Rng } from '../engine/rng';
import type { SfxId } from '../data/sfx';
import { removeItem } from './inventory';
import { rollEffect, usableIn, type Effect, type SpellTable, type UseWhere } from './effects';
import type { ItemTable } from './items';
import { spellsKnown, type PlayerState } from './player';

export type FieldResult =
  | { ok: true; player: PlayerState; text: string; sfx: SfxId; warp?: true; dialog?: string }
  | { ok: false; text: string };

const CANNOT: FieldResult = { ok: false, text: 'You cannot use that now.' };

/** What the field knows about where the hero stands. */
export interface FieldCtx {
  dark: boolean;
}

/** Apply an effect in the field. The caller has already checked the context and paid any cost. */
function applyEffect(rng: Rng, p: PlayerState, effect: Effect, ctx: FieldCtx, itemName?: string): FieldResult {
  switch (effect.kind) {
    case 'damage':
      return CANNOT;
    case 'warp':
      return { ok: true, player: p, text: 'You are carried home.', sfx: 'spell', warp: true };
    case 'heal': {
      if (p.hp >= p.maxHp) return { ok: false, text: 'You are not hurt.' };
      const n = Math.min(rollEffect(rng, effect), p.maxHp - p.hp);
      return { ok: true, player: { ...p, hp: p.hp + n }, text: `You recover ${n} HP.`, sfx: 'heal' };
    }
    case 'light':
      if (itemName === undefined) return CANNOT; // only an item can light a torch
      if (!ctx.dark) return { ok: false, text: 'There is no need for light here.' };
      if (p.torch > 0) return { ok: false, text: 'Your torch still burns.' };
      return { ok: true, player: { ...p, torch: effect.steps }, text: `You light the ${itemName}.`, sfx: 'torch' };
    case 'read':
      if (itemName === undefined) return CANNOT;
      return { ok: true, player: p, text: '', sfx: 'menuConfirm', dialog: effect.dialog };
    default: {
      const unreachable: never = effect;
      throw new Error(`unknown effect: ${JSON.stringify(unreachable)}`);
    }
  }
}

function usable(where: UseWhere, effect: Effect): boolean {
  return usableIn(where, 'field') && effect.kind !== 'damage';
}

export function castInField(rng: Rng, spells: SpellTable, p: PlayerState, spellId: string): FieldResult {
  const spell = spells[spellId];
  if (!spell) throw new Error(`Unknown spell: ${spellId}`);
  if (!spellsKnown(p.level).includes(spellId)) throw new Error(`Spell not known: ${spellId}`);
  if (!usable(spell.where, spell.effect) || spell.effect.kind === 'light' || spell.effect.kind === 'read') return CANNOT;
  if (p.mp < spell.mp) return { ok: false, text: 'Not enough MP.' };
  const r = applyEffect(rng, p, spell.effect, { dark: false });
  if (!r.ok) return r;
  return { ...r, player: { ...r.player, mp: r.player.mp - spell.mp } };
}

export function useItemInField(rng: Rng, items: ItemTable, p: PlayerState, itemId: string, ctx: FieldCtx): FieldResult {
  if (!p.inventory.some((s) => s.item === itemId && s.count > 0)) throw new Error(`Item not held: ${itemId}`);
  const def = items[itemId];
  const use = def?.use;
  if (!def || !use || !usable(use.where, use.effect)) return CANNOT;
  const r = applyEffect(rng, p, use.effect, ctx, def.name);
  if (!r.ok) return r;
  if (use.effect.kind === 'read') return r; // reading does not use the item up
  const removed = removeItem(r.player, itemId);
  if (!removed.ok) throw new Error(`Item not held: ${itemId}`);
  return { ...r, player: removed.player };
}
