import { describe, it, expect } from 'vitest';
import { castInField, useItemInField } from '../src/game/fieldUse';
import { createPlayer, gainXp, applyLevel, type PlayerState } from '../src/game/player';
import { SPELLS } from '../src/data/spells';
import { ITEMS } from '../src/data/items';
import { seqRng } from './helpers/seqRng';

const LIT = { dark: false };
const DARK = { dark: true };
const lv3 = (): PlayerState => gainXp(createPlayer('Wren', [{ item: 'herb', count: 2 }]), 22).player;
const herbs = (p: PlayerState) => p.inventory.find((s) => s.item === 'herb')?.count ?? 0;

describe('castInField', () => {
  it('heals and spends mp', () => {
    const p = { ...lv3(), hp: 5 };
    const r = castInField(seqRng([0]), SPELLS, p, 'heal');
    expect(r).toMatchObject({ ok: true, text: 'You recover 10 HP.', sfx: 'heal' });
    if (r.ok) expect(r.player).toMatchObject({ hp: 15, mp: 2 });
  });
  it('caps the heal at max hp', () => {
    const r = castInField(seqRng([0.99]), SPELLS, { ...lv3(), hp: 20 }, 'heal');
    expect(r.ok && r.player.hp).toBe(25);
    expect(r.text).toBe('You recover 5 HP.');
  });
  it('refuses without a draw or change', () => {
    const full = lv3();
    expect(castInField(seqRng([]), SPELLS, full, 'heal')).toEqual({ ok: false, text: 'You are not hurt.' });
    const low = { ...lv3(), hp: 5, mp: 3 };
    expect(castInField(seqRng([]), SPELLS, low, 'heal')).toEqual({ ok: false, text: 'Not enough MP.' });
    const l6 = applyLevel(lv3(), 6);
    expect(castInField(seqRng([]), SPELLS, l6, 'ember')).toEqual({ ok: false, text: 'You cannot use that now.' });
  });
  it('homeward warps', () => {
    const p = { ...applyLevel(lv3(), 9), mp: 35 };
    const r = castInField(seqRng([]), SPELLS, p, 'homeward');
    expect(r).toMatchObject({ ok: true, warp: true, text: 'You are carried home.', sfx: 'spell' });
    if (r.ok) expect(r.player.mp).toBe(27);
  });
  it('throws on programming errors', () => {
    expect(() => castInField(seqRng([]), SPELLS, lv3(), 'ember')).toThrow();
    expect(() => castInField(seqRng([]), SPELLS, lv3(), 'nope')).toThrow();
  });
});

describe('useItemInField', () => {
  it('uses a herb', () => {
    const r = useItemInField(seqRng([0]), ITEMS, { ...lv3(), hp: 1 }, 'herb', LIT);
    expect(r).toMatchObject({ ok: true, text: 'You recover 20 HP.', sfx: 'heal' });
    if (r.ok) {
      expect(r.player.hp).toBe(21);
      expect(herbs(r.player)).toBe(1);
    }
  });
  it('keeps the herb at full hp', () => {
    const p = lv3();
    expect(useItemInField(seqRng([]), ITEMS, p, 'herb', LIT)).toEqual({ ok: false, text: 'You are not hurt.' });
    expect(herbs(p)).toBe(2);
  });
  it('refuses an item with no use', () => {
    const p = { ...lv3(), inventory: [{ item: 'journal_page', count: 1 }] };
    expect(useItemInField(seqRng([]), ITEMS, p, 'journal_page', LIT)).toEqual({ ok: false, text: 'You cannot use that now.' });
  });
  it('throws for an item not held', () => {
    expect(() => useItemInField(seqRng([]), ITEMS, lv3(), 'torch', LIT)).toThrow();
  });
});

describe('useItemInField: the Torch', () => {
  const held = (torch = 0): PlayerState => ({ ...lv3(), torch, inventory: [{ item: 'torch', count: 2 }] });
  const torches = (p: PlayerState) => p.inventory.find((s) => s.item === 'torch')?.count ?? 0;

  it('lights in the dark: used up, 200 steps, sound torch, draws nothing', () => {
    const r = useItemInField(seqRng([]), ITEMS, held(), 'torch', DARK);
    expect(r).toMatchObject({ ok: true, text: 'You light the Torch.', sfx: 'torch' });
    if (r.ok) {
      expect(r.player.torch).toBe(200);
      expect(torches(r.player)).toBe(1);
    }
  });
  it('is refused where it is not dark and stays held', () => {
    const p = held();
    expect(useItemInField(seqRng([]), ITEMS, p, 'torch', LIT)).toEqual({ ok: false, text: 'There is no need for light here.' });
    expect(p.torch).toBe(0);
    expect(torches(p)).toBe(2);
  });
  it('is refused while a torch still burns', () => {
    const p = held(5);
    expect(useItemInField(seqRng([]), ITEMS, p, 'torch', DARK)).toEqual({ ok: false, text: 'Your torch still burns.' });
    expect(p.torch).toBe(5);
    expect(torches(p)).toBe(2);
  });
});

describe('useItemInField: read items', () => {
  const items = { ...ITEMS, note: { id: 'note', name: 'Note', kind: 'key' as const, price: 0, stack: 1, use: { where: 'field' as const, effect: { kind: 'read' as const, dialog: 'the_note' } } } };
  it('opens the dialog, keeps the item, changes nothing else', () => {
    const p = { ...lv3(), inventory: [{ item: 'note', count: 1 }] };
    const r = useItemInField(seqRng([]), items, p, 'note', LIT);
    expect(r).toMatchObject({ ok: true, dialog: 'the_note', text: '', sfx: 'menuConfirm' });
    if (r.ok) expect(r.player).toEqual(p);
  });
  it('a spell with a light or read effect is refused', () => {
    const p = { ...applyLevel(lv3(), 9), mp: 35 };
    for (const effect of [{ kind: 'light' as const, radius: 3, steps: 9 }, { kind: 'read' as const, dialog: 'x' }]) {
      const spells = { ...SPELLS, homeward: { ...SPELLS.homeward, effect } };
      expect(castInField(seqRng([]), spells, p, 'homeward')).toEqual({ ok: false, text: 'You cannot use that now.' });
    }
  });
});
