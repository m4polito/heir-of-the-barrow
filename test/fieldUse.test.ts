import { describe, it, expect } from 'vitest';
import { castInField, useItemInField } from '../src/game/fieldUse';
import { createPlayer, gainXp, applyLevel, type PlayerState } from '../src/game/player';
import { SPELLS } from '../src/data/spells';
import { ITEMS } from '../src/data/items';
import { seqRng } from './helpers/seqRng';

const lv3 = (): PlayerState => gainXp(createPlayer('Wren', [{ item: 'herb', count: 2 }]), 23).player;
const herbs = (p: PlayerState) => p.inventory.find((s) => s.item === 'herb')?.count ?? 0;

describe('castInField', () => {
  it('heals and spends mp', () => {
    const p = { ...lv3(), hp: 5 };
    const r = castInField(seqRng([0]), SPELLS, p, 'heal');
    expect(r).toMatchObject({ ok: true, text: 'You recover 10 HP.', sfx: 'heal' });
    if (r.ok) expect(r.player).toMatchObject({ hp: 15, mp: 1 });
  });
  it('caps the heal at max hp', () => {
    const r = castInField(seqRng([0.99]), SPELLS, { ...lv3(), hp: 20 }, 'heal');
    expect(r.ok && r.player.hp).toBe(24);
    expect(r.text).toBe('You recover 4 HP.');
  });
  it('refuses without a draw or change', () => {
    const full = lv3();
    expect(castInField(seqRng([]), SPELLS, full, 'heal')).toEqual({ ok: false, text: 'You are not hurt.' });
    const low = { ...lv3(), hp: 5, mp: 3 };
    expect(castInField(seqRng([]), SPELLS, low, 'heal')).toEqual({ ok: false, text: 'Not enough MP.' });
    const l5 = applyLevel(lv3(), 5);
    expect(castInField(seqRng([]), SPELLS, l5, 'ember')).toEqual({ ok: false, text: 'You cannot use that now.' });
  });
  it('homeward warps', () => {
    const p = { ...applyLevel(lv3(), 8), mp: 29 };
    const r = castInField(seqRng([]), SPELLS, p, 'homeward');
    expect(r).toMatchObject({ ok: true, warp: true, text: 'You are carried home.', sfx: 'spell' });
    if (r.ok) expect(r.player.mp).toBe(21);
  });
  it('throws on programming errors', () => {
    expect(() => castInField(seqRng([]), SPELLS, lv3(), 'ember')).toThrow();
    expect(() => castInField(seqRng([]), SPELLS, lv3(), 'nope')).toThrow();
  });
});

describe('useItemInField', () => {
  it('uses a herb', () => {
    const r = useItemInField(seqRng([0]), ITEMS, { ...lv3(), hp: 1 }, 'herb');
    expect(r).toMatchObject({ ok: true, text: 'You recover 20 HP.', sfx: 'heal' });
    if (r.ok) {
      expect(r.player.hp).toBe(21);
      expect(herbs(r.player)).toBe(1);
    }
  });
  it('keeps the herb at full hp', () => {
    const p = lv3();
    expect(useItemInField(seqRng([]), ITEMS, p, 'herb')).toEqual({ ok: false, text: 'You are not hurt.' });
    expect(herbs(p)).toBe(2);
  });
  it('refuses an item with no use', () => {
    const p = { ...lv3(), inventory: [{ item: 'torch', count: 1 }] };
    expect(useItemInField(seqRng([]), ITEMS, p, 'torch')).toEqual({ ok: false, text: 'You cannot use that now.' });
  });
  it('throws for an item not held', () => {
    expect(() => useItemInField(seqRng([]), ITEMS, lv3(), 'torch')).toThrow();
  });
});
