import { describe, expect, it } from 'vitest';
import { setupRoom } from './helpers/exploreKit';
import { chestAt, chestFlag, lookAt, type ChestTrigger, type Trigger } from '../src/game/map';
import { hasFlag } from '../src/game/player';
import { INVENTORY_SLOTS } from '../src/game/inventory';
import { DialogState } from '../src/game/dialog/dialogState';
import { ExploreState } from '../src/game/explore';
import { TILES, TILE_IDS } from '../src/data/tiles';
import type { PixelArt } from '../src/engine/pixels';

const GOLD: ChestTrigger = { kind: 'chest', x: 2, y: 1, id: 'a', gold: 40 };
const TORCH: ChestTrigger = { kind: 'chest', x: 2, y: 1, id: 'a', item: 'torch' };

describe('trigger lookups', () => {
  const triggers: Trigger[] = [GOLD, { kind: 'look', x: 4, y: 4, dialog: 'note' }];
  const map = { triggers } as never;
  it('chestAt and lookAt find triggers by tile', () => {
    expect(chestAt(map, 2, 1)).toBe(GOLD);
    expect(chestAt(map, 4, 4)).toBeUndefined();
    expect(lookAt(map, 4, 4)).toMatchObject({ dialog: 'note' });
    expect(lookAt(map, 2, 1)).toBeUndefined();
  });
  it('chestFlag prefixes the id', () => {
    expect(chestFlag('copse')).toBe('chest_copse');
  });
});

describe('a gold chest', () => {
  it('opens once, pays once, then is empty', () => {
    const t = setupRoom({ triggers: [GOLD] });
    const gold = t.game.player.gold;
    t.press('confirm');
    expect(t.game.player.gold).toBe(gold + 40);
    expect(hasFlag(t.game.player, 'chest_a')).toBe(true);
    expect(t.count('chest')).toBe(1);
    t.idle();
    expect(t.shown()).toBe('You open the chest.');
    t.press('confirm');
    t.idle();
    expect(t.shown()).toBe('You find 40 gold.');
    t.press('confirm');
    expect(t.stack.top).toBeInstanceOf(ExploreState);
    t.press('confirm');
    t.idle();
    expect(t.shown()).toBe('The chest is empty.');
    expect(t.game.player.gold).toBe(gold + 40);
    expect(t.count('chest')).toBe(1);
  });

  it('cancel on the first line cannot undo or repeat it', () => {
    const t = setupRoom({ triggers: [GOLD] });
    const gold = t.game.player.gold;
    t.press('confirm');
    t.idle();
    t.press('cancel');
    expect(t.stack.top).toBeInstanceOf(ExploreState);
    expect(t.game.player.gold).toBe(gold + 40);
    expect(hasFlag(t.game.player, 'chest_a')).toBe(true);
    t.press('confirm');
    t.idle();
    expect(t.shown()).toBe('The chest is empty.');
    expect(t.game.player.gold).toBe(gold + 40);
  });

  it('caps gold at 65535', () => {
    const t = setupRoom({ triggers: [GOLD], patch: { gold: 65530 } });
    t.press('confirm');
    expect(t.game.player.gold).toBe(65535);
  });

  it('is empty for a player who already has the flag', () => {
    const t = setupRoom({ triggers: [GOLD], patch: { flags: ['chest_a'] } });
    const gold = t.game.player.gold;
    t.press('confirm');
    t.idle();
    expect(t.shown()).toBe('The chest is empty.');
    expect(t.game.player.gold).toBe(gold);
    expect(t.count('chest')).toBe(0);
  });

  it('needs the hero to face it', () => {
    const t = setupRoom({ triggers: [GOLD], pos: { x: 3, y: 2, facing: 'up' } });
    t.press('confirm');
    expect(t.stack.top).toBeInstanceOf(ExploreState);
    expect(hasFlag(t.game.player, 'chest_a')).toBe(false);
  });
});

describe('an item chest', () => {
  it('gives the item into a pack with room', () => {
    const t = setupRoom({ triggers: [TORCH] });
    t.press('confirm');
    expect(t.game.player.inventory).toEqual([{ item: 'torch', count: 1 }]);
    expect(hasFlag(t.game.player, 'chest_a')).toBe(true);
    expect(t.count('chest')).toBe(1);
    t.idle();
    expect(t.shown()).toBe('You open the chest.');
    t.press('confirm');
    t.idle();
    expect(t.shown()).toBe('You find the Torch.');
  });

  it('refuses with a full pack, then opens once a slot is free', () => {
    const full = [
      'wooden_club', 'iron_knife', 'bronze_sword', 'cloth_tunic',
      'leather_armor', 'plank_shield', 'aldric_shield', 'herb',
    ];
    expect(full.length).toBe(INVENTORY_SLOTS);
    const t = setupRoom({ triggers: [TORCH], patch: { inventory: full.map((item) => ({ item, count: 1 })) } });
    const pack = t.game.player.inventory;
    t.press('confirm');
    expect(t.count('error')).toBe(1);
    expect(t.count('chest')).toBe(0);
    expect(hasFlag(t.game.player, 'chest_a')).toBe(false);
    expect(t.game.player.inventory).toEqual(pack);
    t.idle();
    expect(t.shown()).toBe('You cannot carry more.');
    t.press('confirm');
    expect(t.stack.top).toBeInstanceOf(ExploreState);
    t.game.player = { ...t.game.player, inventory: pack.slice(1) };
    t.press('confirm');
    expect(t.count('chest')).toBe(1);
    expect(t.game.player.inventory.some((s) => s.item === 'torch')).toBe(true);
    expect(hasFlag(t.game.player, 'chest_a')).toBe(true);
  });

  it('throws for an item the table does not know', () => {
    const t = setupRoom({ triggers: [{ ...TORCH, item: 'nonesuch' }] });
    expect(() => t.press('confirm')).toThrow('Unknown item: nonesuch');
  });
});

describe('chest art', () => {
  it('draws chest art before opening and chestOpen art after', () => {
    const drawnArt: PixelArt[] = [];
    const t = setupRoom({ triggers: [GOLD], sprites: { get: (a) => (drawnArt.push(a), {}) } });
    const shut = TILES[TILE_IDS.chest]!.frames[0]!;
    const open = TILES[TILE_IDS.chestOpen]!.frames[0]!;
    t.stack.render(t.ctx, 0);
    expect(drawnArt).toContain(shut);
    expect(drawnArt).not.toContain(open);
    t.press('confirm');
    t.idle();
    t.press('confirm');
    t.idle();
    t.press('confirm');
    drawnArt.length = 0;
    t.stack.render(t.ctx, 0);
    expect(drawnArt).toContain(open);
    expect(drawnArt).not.toContain(shut);
  });
});

describe('things to look at', () => {
  const dialogs = { note: ['The stone is cold.'], talk: ['Hello there.'] };
  const look: Trigger = { kind: 'look', x: 2, y: 1, dialog: 'note' };
  const npc = { id: 'v', sprite: 'adult', x: 2, y: 1, facing: 'down' as const, wander: false, dialog: 'talk' };

  it('shows the dialog of a look trigger on the facing tile', () => {
    const t = setupRoom({ triggers: [look], dialogs });
    t.press('confirm');
    expect(t.stack.top).toBeInstanceOf(DialogState);
    t.idle();
    expect(t.shown()).toBe('The stone is cold.');
  });

  it('prefers a villager standing there', () => {
    const t = setupRoom({ triggers: [look], npcs: [npc], dialogs });
    t.press('confirm');
    t.idle();
    expect(t.shown()).toBe('Hello there.');
  });

  it('throws for an unknown dialog', () => {
    const t = setupRoom({ triggers: [look], dialogs: {} });
    expect(() => t.press('confirm')).toThrow('Unknown dialog: note');
  });
});

describe('warp sounds', () => {
  const run = (sfx?: 'stairs') => {
    const other = { ...setupRoom({}).room, id: 'other', entry: { in: { x: 1, y: 1, facing: 'down' as const } } };
    const t = setupRoom({
      triggers: [{ kind: 'warp', x: 3, y: 1, to: 'other', entry: 'in', ...(sfx ? { sfx } : {}) }],
      pos: { x: 3, y: 2, facing: 'up' },
      extraMaps: { other },
    });
    t.hold(12, 'up');
    return t.sounds.filter((s) => s === 'stairs' || s === 'door');
  };
  it('plays the trigger sfx', () => {
    expect(run('stairs')).toEqual(['stairs']);
  });
  it('defaults to the door', () => {
    expect(run()).toEqual(['door']);
  });
});
