import { MONSTERS } from '../src/data/monsters';
import { ITEMS } from '../src/data/items';
import { SPELLS } from '../src/data/spells';
import { describe, expect, it } from 'vitest';
import { NAME_GRID, NAME_MAX, NameEntryModel, NameEntryState } from '../src/game/nameEntry';
import { TitleState } from '../src/game/title';
import { StateStack } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import type { Font } from '../src/engine/font';
import { AudioManager } from '../src/engine/audio/audio';
import { SpriteCache } from '../src/engine/spriteCache';
import { createRng } from '../src/engine/rng';
import { ExploreState } from '../src/game/explore';
import { createGame } from '../src/game/game';
import { createPlayer } from '../src/game/player';
import { DialogState } from '../src/game/dialog/dialogState';
import { TransitionState } from '../src/game/transition';
import { MAPS } from '../src/data/maps';
import { DIALOGS } from '../src/data/dialog/hollowmere';
import { SONGS } from '../src/data/songs';
import { STORY } from '../src/data/story';
import { PALETTE } from '../src/data/palette';

describe('NameEntryModel', () => {
  it('starts at (0,0) and confirm appends A', () => {
    const m = new NameEntryModel('Wren');
    expect([m.cx, m.cy]).toEqual([0, 0]);
    expect(m.confirm()).toBe('char');
    expect(m.name).toBe('A');
  });

  it('wraps horizontally and vertically', () => {
    const m = new NameEntryModel('Wren');
    m.move(-1, 0);
    expect(m.cx).toBe(NAME_GRID[0]!.length - 1);
    m.move(0, -1);
    expect(m.cy).toBe(NAME_GRID.length - 1);
    m.move(0, 1);
    expect(m.cy).toBe(0);
  });

  it('BACK END row resolves to the two actions', () => {
    const m = new NameEntryModel('Wren');
    m.confirm();
    m.confirm();
    m.move(0, -1); // last row
    expect(m.cx).toBe(0);
    expect(m.confirm()).toBe('back');
    expect(m.name).toBe('A');
    m.move(1, 0);
    expect(m.cx).toBe(1);
    expect(m.confirm()).toBe('end');
    expect(m.done).toBe(true);
    expect(m.finalName).toBe('A');
  });

  it('last row has exactly two cells and wraps between them', () => {
    const m = new NameEntryModel('Wren');
    m.move(0, -1);
    m.move(-1, 0);
    expect(m.confirm()).toBe('end');
    expect(m.cx).toBe(1);
  });

  it('refuses a ninth letter', () => {
    const m = new NameEntryModel('Wren');
    for (let i = 0; i < NAME_MAX; i++) expect(m.confirm()).toBe('char');
    expect(m.confirm()).toBe('full');
    expect(m.name.length).toBe(NAME_MAX);
  });

  it('cancel deletes the last letter', () => {
    const m = new NameEntryModel('Wren');
    m.confirm();
    m.move(1, 0);
    m.confirm();
    m.cancel();
    expect(m.name).toBe('A');
    m.cancel();
    m.cancel();
    expect(m.name).toBe('');
  });

  it('END with an empty name falls back to the default', () => {
    const m = new NameEntryModel('Wren');
    m.move(0, -1);
    m.move(1, 0);
    expect(m.confirm()).toBe('end');
    expect(m.done).toBe(true);
    expect(m.finalName).toBe('Wren');
  });
});

const keys = (...down: string[]) =>
  ({
    held: () => false,
    pressed: (a: string) => down.includes(a),
    repeat: (a: string) => down.includes(a),
  }) as unknown as Input;

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
    player: createPlayer(STORY.defaultHeroName, STORY.startingItems),
  });
  const title = new TitleState(game);
  stack.push(title);
  return { stack, game, title };
}

function runTransition(stack: StateStack): void {
  for (let i = 0; i < 40 && stack.top instanceof TransitionState; i++) stack.update(keys());
}

describe('NameEntryModel spaces', () => {
  it('a spaces-only name falls back to the default', () => {
    const m = new NameEntryModel('Wren');
    m.cy = 4;
    m.cx = 10; // the space cell
    m.confirm();
    m.confirm();
    expect(m.name).toBe('  ');
    m.move(0, 1); // clamps to END
    expect(m.confirm()).toBe('end');
    expect(m.finalName).toBe('Wren');
  });
});

describe('new-game flow', () => {
  it('title confirm opens name entry', () => {
    const { stack } = setup();
    stack.update(keys('confirm'));
    expect(stack.top).toBeInstanceOf(NameEntryState);
  });

  it('typing a name then END starts the opening in Explore', () => {
    const { stack, game, title } = setup();
    stack.update(keys('confirm'));
    const entry = stack.top as NameEntryState;
    stack.update(keys('confirm')); // A
    stack.update(keys('right'));
    stack.update(keys('confirm')); // B
    stack.update(keys('up')); // last row; column 1 maps to BACK
    stack.update(keys('right')); // END
    stack.update(keys('confirm'));
    expect(stack.top).toBeInstanceOf(TransitionState);
    runTransition(stack);
    expect(game.player.name).toBe('AB');
    const explore = stack.states.find((s) => s instanceof ExploreState) as ExploreState;
    expect(explore).toBeDefined();
    expect(explore.mapId).toBe(STORY.newGame.map);
    expect(stack.contains(title)).toBe(false);
    expect(stack.contains(entry)).toBe(false);
    stack.update(keys());
    expect(stack.top).toBeInstanceOf(DialogState);
  });

  it('an empty name uses the default', () => {
    const { stack, game } = setup();
    stack.update(keys('confirm'));
    stack.update(keys('up'));
    stack.update(keys('right'));
    stack.update(keys('confirm'));
    runTransition(stack);
    expect(game.player.name).toBe(STORY.defaultHeroName);
  });
});

describe('NameEntryModel BACK/END row mapping', () => {
  const at = (cx: number, cy: number) => {
    const m = new NameEntryModel('Wren');
    m.cx = cx;
    m.cy = cy;
    return m;
  };
  it('entering from the left half lands on BACK, the right half on END', () => {
    for (const [col, want] of [[0, 0], [3, 0], [4, 1], [6, 1], [12, 1]] as const) {
      const m = at(col, 4);
      m.move(0, 1);
      expect([m.cy, m.cx], `col ${col}`).toEqual([5, want]);
      const up = at(col, 0);
      up.move(0, -1);
      expect(up.cx, `up col ${col}`).toBe(want);
    }
  });
  it('leaving BACK goes to column 0, END to column 6, up or down', () => {
    for (const dy of [-1, 1] as const) {
      const back = at(0, 5);
      back.move(0, dy);
      expect(back.cx).toBe(0);
      const end = at(1, 5);
      end.move(0, dy);
      expect(end.cx).toBe(6);
    }
  });
});
