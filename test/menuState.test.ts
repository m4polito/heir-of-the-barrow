import { describe, expect, it } from 'vitest';
import { StateStack } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import type { Font } from '../src/engine/font';
import { AudioManager } from '../src/engine/audio/audio';
import { SpriteCache } from '../src/engine/spriteCache';
import { createRng } from '../src/engine/rng';
import { ExploreState } from '../src/game/explore';
import { createGame } from '../src/game/game';
import { createPlayer, setFlag } from '../src/game/player';
import { addItem } from '../src/game/inventory';
import { DialogState } from '../src/game/dialog/dialogState';
import { MenuState } from '../src/game/menu/menuState';
import { ItemsState } from '../src/game/menu/itemsState';
import { EquipState } from '../src/game/menu/equipState';
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
    story: STORY,
    player: setFlag(createPlayer(STORY.defaultHeroName), STORY.opening.flag),
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
});

describe('items and equip', () => {
  function withShield() {
    const s = setup();
    s.game.player = addItem(s.game.player, 'aldric_shield').player;
    return s;
  }

  it('a consumable cannot be used now', () => {
    const { stack, game } = setup();
    const items = new ItemsState(game);
    stack.push(items);
    items.update(keys('confirm'));
    expect(stack.top).toBeInstanceOf(DialogState);
    expect(game.player.inventory[0]!.item).toBe('herb');
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
