import { MONSTERS } from '../src/data/monsters';
import { ITEMS } from '../src/data/items';
import { SPELLS } from '../src/data/spells';
import { describe, expect, it, vi } from 'vitest';
import { StateStack } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import type { Font } from '../src/engine/font';
import { AudioManager } from '../src/engine/audio/audio';
import { SpriteCache } from '../src/engine/spriteCache';
import { createRng } from '../src/engine/rng';
import { ExploreState } from '../src/game/explore';
import { createGame } from '../src/game/game';
import { applyLevel, createPlayer, setFlag } from '../src/game/player';
import { addItem } from '../src/game/inventory';
import { DialogState } from '../src/game/dialog/dialogState';
import { TransitionState } from '../src/game/transition';
import { MenuState } from '../src/game/menu/menuState';
import { ItemsState } from '../src/game/menu/itemsState';
import { SpellsState } from '../src/game/menu/spellsState';
import { EquipState, equipWindowRect } from '../src/game/menu/equipState';
import { MAPS } from '../src/data/maps';
import { DIALOGS } from '../src/data/dialog/hollowmere';
import { SONGS } from '../src/data/songs';
import { STORY } from '../src/data/story';
import { PALETTE } from '../src/data/palette';

function setup() {
  const stack = new StateStack();
  const game = createGame({
    stack,
    input: {} as Input,
    font: {} as Font,
    audio: new AudioManager(null),
    sprites: new SpriteCache(PALETTE),
    rng: createRng(1),
    maps: MAPS,
    dialogs: DIALOGS,
    songs: SONGS,
    items: ITEMS,
    spells: SPELLS,
    monsters: MONSTERS,
    story: STORY,
    player: setFlag(createPlayer(STORY.defaultHeroName, STORY.startingItems), STORY.opening.flag),
  });
  const explore = new ExploreState(game, STORY.newGame.map, STORY.newGame.entry);
  stack.push(explore);
  return { stack, game, explore };
}

const keys = (...down: string[]) =>
  ({
    held: () => false,
    pressed: (a: string) => down.includes(a),
    repeat: (a: string) => down.includes(a),
    rearm: () => {},
  }) as unknown as Input;

describe('menu from explore', () => {
  it('cancel while idle opens the menu', () => {
    const { stack } = setup();
    stack.update(keys('cancel'));
    expect(stack.top).toBeInstanceOf(MenuState);
  });

  it('cancel mid-step does not open the menu', () => {
    const { stack, explore } = setup();
    explore.hero.stepFrame = 4;
    stack.update(keys('cancel'));
    expect(stack.top).toBe(explore);
  });

  it('cancel pops the menu back to explore', () => {
    const { stack, explore } = setup();
    stack.update(keys('cancel'));
    stack.update(keys('cancel'));
    expect(stack.top).toBe(explore);
  });

  it('confirm on the cursor row pushes the sub-state', () => {
    const { stack } = setup();
    stack.update(keys('cancel'));
    stack.update(keys('down'));
    stack.update(keys('confirm'));
    expect(stack.top).toBeInstanceOf(ItemsState);
  });

  it('rows are Status, Items, Spells, Equip', () => {
    const rows = (s: MenuState) => (s as unknown as { list: { items: string[] } }).list.items;
    const { stack, game } = setup();
    expect(rows(new MenuState(game))).toEqual(['Status', 'Items', 'Spells', 'Equip']);
    stack.update(keys('cancel'));
    stack.update(keys('down'));
    stack.update(keys('down'));
    stack.update(keys('confirm'));
    expect(stack.top).toBeInstanceOf(SpellsState);
    stack.update(keys('cancel'));
    stack.update(keys('down'));
    stack.update(keys('confirm'));
    expect(stack.top).toBeInstanceOf(EquipState);
  });
});

/** Confirm through a dialog until it is gone. */
function dismiss(stack: StateStack) {
  for (let i = 0; i < 200 && stack.top instanceof DialogState; i++) stack.update(keys('confirm'));
}

describe('items and equip', () => {
  function withShield() {
    const s = setup();
    s.game.player = addItem(ITEMS, s.game.player, 'aldric_shield').player;
    return s;
  }

  it('a hurt hero uses an Herb', () => {
    const { stack, game } = setup();
    game.player = { ...game.player, hp: 1 };
    const playSfx = vi.spyOn(game.audio, 'playSfx');
    const items = new ItemsState(game);
    stack.push(items);
    items.update(keys('confirm'));
    expect(game.player.hp).toBe(16);
    expect(game.player.inventory).toEqual([]);
    items.update(keys());
    expect((items as unknown as { list: { items: string[] } }).list.items).toEqual(['Nothing']);
    expect(stack.top).toBeInstanceOf(DialogState);
    expect(playSfx).toHaveBeenCalledWith('heal');
  });

  it('an Herb at full HP is kept and errors', () => {
    const { stack, game } = setup();
    const playSfx = vi.spyOn(game.audio, 'playSfx');
    const items = new ItemsState(game);
    stack.push(items);
    items.update(keys('confirm'));
    expect(playSfx).toHaveBeenCalledWith('error');
    expect(playSfx).not.toHaveBeenCalledWith('heal');
    expect(game.player.inventory).toEqual([{ item: 'herb', count: 1 }]);
    expect(stack.top).toBeInstanceOf(DialogState);
  });

  it('a held Torch cannot be used and stays held', () => {
    const { stack, game } = setup();
    game.player = { ...addItem(ITEMS, game.player, 'torch').player, hp: 1 };
    const playSfx = vi.spyOn(game.audio, 'playSfx');
    const items = new ItemsState(game);
    stack.push(items);
    items.update(keys('down'));
    items.update(keys('confirm'));
    expect(playSfx).toHaveBeenCalledWith('error');
    expect(game.player.inventory.some((s) => s.item === 'torch')).toBe(true);
    expect(game.player.hp).toBe(1);
  });

  it('using the last of two stacks leaves the cursor on a valid row', () => {
    const { stack, game } = setup();
    const held = addItem(ITEMS, game.player, 'torch').player;
    game.player = { ...held, inventory: [...held.inventory].reverse(), hp: 1 };
    const items = new ItemsState(game);
    stack.push(items);
    items.update(keys('down'));
    items.update(keys('confirm'));
    dismiss(stack);
    items.update(keys());
    const list = (items as unknown as { list: { cursor: number; items: string[] } }).list;
    expect(list.items).toEqual(['Torch x1']);
    expect(list.cursor).toBe(0);
  });

  it('equipment asks and equips on Yes only', () => {
    const { stack, game } = withShield();
    const items = new ItemsState(game);
    stack.push(items);
    items.update(keys('down'));
    items.update(keys('confirm'));
    const dlg = stack.top as DialogState;
    expect(dlg).toBeInstanceOf(DialogState);
    // answer No: reveal, advance to the choice, move to No, confirm
    dlg.update(keys('confirm'));
    dlg.update(keys('confirm'));
    dlg.update(keys('down'));
    dlg.update(keys('confirm'));
    expect(stack.top).toBe(items);
    expect(game.player.equipment.shield).toBeUndefined();

    const items2 = new ItemsState(game);
    stack.push(items2);
    items2.update(keys('down'));
    items2.update(keys('confirm'));
    const dlg2 = stack.top as DialogState;
    dlg2.update(keys('confirm'));
    dlg2.update(keys('confirm'));
    dlg2.update(keys('confirm'));
    expect(stack.top).toBe(items2);
    expect(game.player.equipment.shield).toBe('aldric_shield');
  });

  it('equip state equips a candidate and unequips a slot', () => {
    const { stack, game } = withShield();
    const eq = new EquipState(game);
    stack.push(eq);
    for (let i = 0; i < 3; i++) eq.update(keys('down'));
    eq.update(keys('confirm'));
    expect(game.player.equipment.shield).toBe('aldric_shield');
    // cursor is still on row 3 (now past the end); move to the shield slot
    const eq2 = new EquipState(game);
    stack.push(eq2);
    eq2.update(keys('down'));
    eq2.update(keys('down'));
    eq2.update(keys('confirm'));
    expect(game.player.equipment.shield).toBeUndefined();
    expect(game.player.inventory.some((s) => s.item === 'aldric_shield')).toBe(true);
  });
});

describe('equip window rect', () => {
  it('keeps the default size for short lines', () => {
    expect(equipWindowRect(['Club', 'Cloth'])).toEqual({ x: 88, w: 160 });
  });
  it('grows leftwards for a 23-character line', () => {
    expect(equipWindowRect(['x'.repeat(23)])).toEqual({ x: 40, w: 208 });
  });
  it('keeps every line inside the border', () => {
    for (let n = 1; n <= 28; n++) {
      const { x, w } = equipWindowRect(['a'.repeat(n)]);
      expect(x + 6 + 8 + n * 8).toBeLessThanOrEqual(x + w - 8);
    }
  });
});

describe('spells', () => {
  function at(level: number, patch: Record<string, number> = {}) {
    const s = setup();
    s.game.player = { ...applyLevel(s.game.player, level), ...patch };
    const spells = new SpellsState(s.game);
    s.stack.push(spells);
    const playSfx = vi.spyOn(s.game.audio, 'playSfx');
    return { ...s, spells, playSfx };
  }
  const listOf = (st: SpellsState) => (st as unknown as { list: { items: string[] } }).list.items;

  it('lists Nothing at level 1 and errors on confirm', () => {
    const { spells, playSfx, stack } = at(1);
    expect(listOf(spells)).toEqual(['Nothing']);
    spells.update(keys('confirm'));
    expect(playSfx).toHaveBeenCalledWith('error');
    expect(stack.top).toBe(spells);
  });

  it('cancel pops with the cancel sound', () => {
    const { spells, playSfx, stack, explore } = at(3);
    spells.update(keys('cancel'));
    expect(playSfx).toHaveBeenCalledWith('menuCancel');
    expect(stack.states.includes(spells)).toBe(false);
    expect(stack.states.includes(explore)).toBe(true);
  });

  it('Heal restores HP and spends MP', () => {
    const { spells, playSfx, game, stack } = at(3, { hp: 5, mp: 5 });
    expect(listOf(spells)).toEqual(['Heal       4']);
    spells.update(keys('confirm'));
    expect(game.player.hp).toBeGreaterThanOrEqual(15);
    expect(game.player.hp).toBeLessThanOrEqual(22);
    expect(game.player.mp).toBe(1);
    expect(playSfx).toHaveBeenCalledWith('heal');
    expect(stack.top).toBeInstanceOf(DialogState);
  });

  it('Heal with too little MP errors and keeps MP', () => {
    const { spells, playSfx, game } = at(3, { hp: 5, mp: 3 });
    spells.update(keys('confirm'));
    expect(playSfx).toHaveBeenCalledWith('error');
    expect(game.player.mp).toBe(3);
    expect(game.player.hp).toBe(5);
  });

  it('a battle-only spell cannot be cast in the field', () => {
    const { spells, playSfx, game } = at(6, { hp: 5, mp: 20 });
    expect(listOf(spells)).toEqual(['Heal       4', 'Ember      2']);
    spells.update(keys('down'));
    spells.update(keys('confirm'));
    expect(playSfx).toHaveBeenCalledWith('error');
    expect(game.player.mp).toBe(20);
  });

  it('Homeward fades to the home map and entry', () => {
    const s = setup();
    s.game.player = { ...applyLevel(s.game.player, 9), mp: 35 };
    s.stack.reset(new ExploreState(s.game, 'marsh', 'town'));
    s.stack.update(keys('cancel'));
    s.stack.update(keys('down'));
    s.stack.update(keys('down'));
    s.stack.update(keys('confirm'));
    expect(s.stack.top).toBeInstanceOf(SpellsState);
    const spells = s.stack.top as SpellsState;
    expect(listOf(spells)).toEqual(['Heal       4', 'Ember      2', 'Homeward   8']);
    spells.update(keys('down'));
    spells.update(keys('down'));
    spells.update(keys('confirm'));
    dismiss(s.stack);
    // mash confirm and cancel while the fade runs; once it ends the hero is idle on the map, so stop
    for (let i = 0; i < 30; i++) {
      const fading = s.stack.top instanceof TransitionState;
      s.stack.update(keys(...(fading ? [i % 2 === 0 ? 'confirm' : 'cancel'] : [])));
    }
    expect(s.stack.states).toHaveLength(1);
    const ex = s.stack.top as ExploreState;
    expect(ex).toBeInstanceOf(ExploreState);
    expect(ex.map.id).toBe(STORY.home.map);
    const e = MAPS[STORY.home.map]!.entry[STORY.home.entry]!;
    expect(ex.hero.x).toBe(e.x);
    expect(ex.hero.y).toBe(e.y);
    expect(s.game.player.mp).toBe(27);
  });
});
