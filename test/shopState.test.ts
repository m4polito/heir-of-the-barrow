import { describe, expect, it } from 'vitest';
import { StateStack } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import type { Font } from '../src/engine/font';
import { AudioManager } from '../src/engine/audio/audio';
import { SpriteCache } from '../src/engine/spriteCache';
import { createRng } from '../src/engine/rng';
import { ExploreState } from '../src/game/explore';
import { createGame } from '../src/game/game';
import { createPlayer, type PlayerState } from '../src/game/player';
import { DialogState } from '../src/game/dialog/dialogState';
import { ShopState } from '../src/game/shopState';
import { sellRows, stockRows } from '../src/game/shop';
import { MAPS } from '../src/data/maps';
import { ITEMS } from '../src/data/items';
import { SPELLS } from '../src/data/spells';
import { SHOPS } from '../src/data/shops';
import { MONSTERS } from '../src/data/monsters';
import { DIALOGS } from '../src/data/dialog/hollowmere';
import { SONGS } from '../src/data/songs';
import { STORY } from '../src/data/story';
import { PALETTE } from '../src/data/palette';

const drawn: string[] = [];
const font = { drawText: (_c: unknown, t: string) => drawn.push(t) } as unknown as Font;
const ctx = new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D;

const keys = (...down: string[]) =>
  ({
    held: () => false,
    pressed: (a: string) => down.includes(a),
    repeat: (a: string) => down.includes(a),
    rearm: () => {},
  }) as unknown as Input;

function setup(
  map: string,
  pos: { x: number; y: number; facing: 'up' },
  patch: Partial<PlayerState> = {},
  dialogs: typeof DIALOGS = DIALOGS,
) {
  const stack = new StateStack();
  const sounds: string[] = [];
  const game = createGame({
    stack,
    input: {} as Input,
    font,
    audio: new AudioManager(null),
    sprites: new SpriteCache(PALETTE),
    rng: createRng(1),
    maps: MAPS,
    dialogs,
    songs: SONGS,
    items: ITEMS,
    spells: SPELLS,
    shops: SHOPS,
    monsters: MONSTERS,
    story: STORY,
    player: { ...createPlayer(STORY.defaultHeroName, []), ...patch },
  });
  game.audio.playSfx = (id: string) => void sounds.push(id);
  game.audio.playSong = () => {};
  game.audio.stopSong = () => {};
  const explore = new ExploreState(game, map, pos);
  stack.push(explore);
  const idle = (n = 200) => {
    for (let i = 0; i < n; i++) stack.update(keys());
  };
  const press = (...k: string[]) => stack.update(keys(...k));
  /** The text the top state shows right now. */
  const shown = () => {
    drawn.length = 0;
    stack.top!.render(ctx, 1);
    return drawn.filter((t) => !['▶', '▼', 'Yes', 'No'].includes(t)).join(' ');
  };
  /** Types out the top dialog, then presses confirm once. */
  const confirm = () => {
    idle();
    press('confirm');
  };
  const shop = () => stack.top as ShopState;
  return { stack, game, explore, sounds, idle, press, shown, confirm, shop };
}

function forge(patch: Partial<PlayerState> = {}) {
  const t = setup('forge', { x: 5, y: 4, facing: 'up' }, patch);
  t.press('confirm'); // talk
  t.confirm();
  t.confirm();
  expect(t.stack.top).toBeInstanceOf(ShopState);
  return t;
}

type Forge = ReturnType<typeof forge>;

/** Into the Buy list with the cursor on `row`. */
function buyRow(t: Forge, row: number) {
  t.press('confirm');
  for (let i = 0; i < row; i++) t.press('down');
}

/** Presses confirm on the buy row and types out whatever opens. */
function pickRow(t: Forge, row: number) {
  buyRow(t, row);
  t.press('confirm');
  t.idle();
}

describe('ExploreState entry position', () => {
  it('stands the hero on a given tile and facing', () => {
    const t = setup('elder_house', { x: 6, y: 4, facing: 'up' });
    const e = new ExploreState(t.game, 'elder_house', { x: 6, y: 4, facing: 'left' });
    expect(e.hero.x).toBe(6);
    expect(e.hero.y).toBe(4);
    expect(e.hero.facing).toBe('left');
  });

  it('rejects positions off the map or not walkable', () => {
    const t = setup('elder_house', { x: 6, y: 4, facing: 'up' });
    expect(() => new ExploreState(t.game, 'elder_house', { x: 0, y: 0, facing: 'up' })).toThrow(
      'Bad position on map elder_house',
    );
    expect(() => new ExploreState(t.game, 'elder_house', { x: 99, y: 0, facing: 'up' })).toThrow(
      'Bad position on map elder_house',
    );
  });
});

describe('opening the shop', () => {
  it('the keeper lines lead to the shop menu over the dialog', () => {
    const t = forge();
    expect(t.shop().phase).toBe('menu');
    expect(t.stack.states[t.stack.states.length - 2]).toBeInstanceOf(DialogState);
  });

  it('cancel on the first line never opens the shop', () => {
    const t = setup('forge', { x: 5, y: 4, facing: 'up' });
    t.press('confirm');
    t.idle(5);
    t.press('cancel');
    t.idle();
    expect(t.stack.states.some((s) => s instanceof ShopState)).toBe(false);
    expect(t.stack.top).toBe(t.explore);
  });

  it('the goods shop sells Herbs and Torches', () => {
    const t = setup('shop', { x: 5, y: 5, facing: 'up' });
    t.press('confirm');
    t.confirm();
    expect(t.stack.top).toBeInstanceOf(ShopState);
    t.press('confirm');
    expect(t.shop().rows).toEqual(['Herb            10', 'Torch            8']);
  });

  it('an unknown shop id throws', () => {
    const t = setup('shop', { x: 5, y: 5, facing: 'up' }, {}, { ...DIALOGS, odo: [{ shop: 'nope' }] });
    expect(() => t.press('confirm')).toThrow('Unknown shop: nope');
  });
});

describe('buying', () => {
  it('the Buy list is the stock list', () => {
    const t = forge();
    t.press('confirm');
    expect(t.shop().phase).toBe('buy');
    expect(t.shop().rows).toEqual(stockRows(ITEMS, SHOPS.forge!.stock));
  });

  it('buys and equips the Wooden Club', () => {
    const t = forge();
    pickRow(t, 0);
    expect(t.shown()).toContain('The Wooden Club? That will be 30 gold.');
    t.press('confirm'); // Yes
    t.idle();
    expect(t.shown()).toContain('Will you equip it now?');
    t.press('confirm'); // Yes
    expect(t.game.player.gold).toBe(10);
    expect(t.game.player.equipment.weapon).toBe('wooden_club');
    expect(t.game.player.inventory.some((s) => s.item === 'wooden_club')).toBe(false);
    expect(t.sounds.filter((s) => s === 'buy')).toHaveLength(1);
    expect(t.shop().phase).toBe('buy');
    expect(t.stack.top).toBe(t.shop());
  });

  it('declining to equip keeps the Club in the pack', () => {
    const t = forge();
    pickRow(t, 0);
    t.press('confirm');
    t.idle();
    t.press('down');
    t.press('confirm'); // No
    expect(t.game.player.gold).toBe(10);
    expect(t.game.player.inventory.some((s) => s.item === 'wooden_club')).toBe(true);
    expect(t.game.player.equipment.weapon).toBeUndefined();
  });

  it('one press answers one question', () => {
    const t = forge();
    pickRow(t, 0);
    t.press('confirm'); // Yes to the price
    expect(t.game.player.inventory.some((s) => s.item === 'wooden_club')).toBe(true);
    expect(t.stack.top).toBeInstanceOf(DialogState);
    t.idle();
    expect(t.shown()).toContain('Will you equip it now?');
    expect(t.game.player.equipment.weapon).toBeUndefined();
  });

  it('cancel at the price question changes nothing', () => {
    const t = forge();
    pickRow(t, 0);
    t.press('cancel');
    expect(t.game.player.gold).toBe(40);
    expect(t.game.player.inventory).toEqual([]);
    expect(t.sounds).not.toContain('buy');
    expect(t.stack.top).toBe(t.shop());
  });

  it('cancel at the equip question keeps the bought Club in the pack', () => {
    const t = forge();
    pickRow(t, 0);
    t.press('confirm');
    t.idle();
    t.press('cancel');
    expect(t.game.player.gold).toBe(10);
    expect(t.game.player.inventory.some((s) => s.item === 'wooden_club')).toBe(true);
    expect(t.game.player.equipment.weapon).toBeUndefined();
    expect(t.stack.top).toBe(t.shop());
  });

  it('refuses when gold is short', () => {
    const t = forge();
    pickRow(t, 1);
    expect(t.sounds).toContain('error');
    expect(t.shown()).toBe('You do not have enough gold.');
    expect(t.game.player.gold).toBe(40);
  });

  it('refuses a second Club', () => {
    const t = forge({ inventory: [{ item: 'wooden_club', count: 1 }] });
    pickRow(t, 0);
    expect(t.shown()).toBe('You already carry one.');
  });

  const fullPack = (): Partial<PlayerState> => ({
    gold: 100,
    equipment: { weapon: 'wooden_club' },
    inventory: [
      'herb',
      'torch',
      'journal_page',
      'aldric_shield',
      'cloth_tunic',
      'leather_armor',
      'plank_shield',
      'bronze_sword',
    ].map((item) => ({ item, count: 1 })),
  });

  it('a full pack trades the worn weapon in', () => {
    const t = forge(fullPack());
    pickRow(t, 1);
    expect(t.shown()).toContain('I will take your Wooden Club for 15 gold');
    t.press('confirm');
    t.idle();
    expect(t.shown()).toContain('The Iron Knife? That will be 60 gold.');
    t.press('confirm'); // Yes
    expect(t.game.player.equipment.weapon).toBe('iron_knife');
    expect(t.game.player.gold).toBe(55);
    expect(t.sounds).toContain('buy');
  });

  it('declining the trade-in changes nothing', () => {
    const t = forge(fullPack());
    pickRow(t, 1);
    t.press('confirm');
    t.idle();
    t.press('down');
    t.press('confirm'); // No
    expect(t.game.player.equipment.weapon).toBe('wooden_club');
    expect(t.game.player.gold).toBe(100);
  });
});

describe('selling', () => {
  function sellList(patch: Partial<PlayerState>) {
    const t = forge(patch);
    t.press('down');
    t.press('confirm');
    return t;
  }

  it('lists the pack and pays half, keeping the cursor on a real row', () => {
    const t = sellList({
      inventory: [
        { item: 'herb', count: 2 },
        { item: 'aldric_shield', count: 1 },
      ],
    });
    expect(t.shop().phase).toBe('sell');
    expect(t.shop().rows).toEqual(sellRows(ITEMS, t.game.player));
    for (let i = 0; i < 2; i++) {
      t.press('confirm');
      t.idle();
      expect(t.shown()).toContain('The Herb? I can give you 5 gold.');
      t.press('confirm');
    }
    expect(t.game.player.gold).toBe(50);
    expect(t.shop().rows).toEqual(sellRows(ITEMS, t.game.player));
    expect(t.shop().rows).toHaveLength(1);
    expect(t.shop().rows[0]).toContain("Aldric's Shield");
    expect(t.sounds.filter((s) => s === 'buy')).toHaveLength(2);
  });

  it('will not buy the shield', () => {
    const t = sellList({ inventory: [{ item: 'aldric_shield', count: 1 }] });
    t.press('confirm');
    t.idle();
    expect(t.shown()).toBe('I cannot buy that.');
    expect(t.sounds).toContain('error');
    t.press('confirm');
    expect(t.game.player.inventory).toHaveLength(1);
  });

  it('returns to the menu after the last item is sold', () => {
    const t = sellList({ inventory: [{ item: 'herb', count: 1 }] });
    t.press('confirm');
    t.idle();
    t.press('confirm');
    expect(t.shop().phase).toBe('menu');
    expect(t.game.player.gold).toBe(45);
  });

  it('says so when there is nothing to sell', () => {
    const t = sellList({});
    t.idle();
    expect(t.shown()).toBe('You have nothing to sell.');
    t.press('confirm');
    expect(t.shop().phase).toBe('menu');
  });
});

describe('leaving', () => {
  it('Leave closes the shop and the keeper says farewell', () => {
    const t = forge();
    t.press('down');
    t.press('down');
    t.press('confirm');
    expect(t.stack.states.some((s) => s instanceof ShopState)).toBe(false);
    t.idle();
    expect(t.shown()).toContain('He left a wife and a child for a hole in the ground.');
    t.confirm();
    t.confirm();
    expect(t.stack.states).toHaveLength(1);
    expect(t.stack.top).toBe(t.explore);
  });

  it('cancel in a list returns to the menu', () => {
    const t = forge();
    t.press('confirm');
    t.press('cancel');
    expect(t.shop().phase).toBe('menu');
    expect(t.sounds).toContain('menuCancel');
  });
});
