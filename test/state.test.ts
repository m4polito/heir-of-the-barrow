import { MONSTERS } from '../src/data/monsters';
import { ITEMS } from '../src/data/items';
import { SPELLS } from '../src/data/spells';
import { SHOPS } from '../src/data/shops';
import { describe, it, expect } from 'vitest';
import { StateStack, type State } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import { TransitionState } from '../src/game/transition';
import { DialogState } from '../src/game/dialog/dialogState';
import { ExploreState } from '../src/game/explore';
import { createGame } from '../src/game/game';
import { npcPixelOffset } from '../src/game/npc';
import { createPlayer, hasFlag, setFlag } from '../src/game/player';
import type { GameMap } from '../src/game/map';
import type { Font } from '../src/engine/font';
import { AudioManager } from '../src/engine/audio/audio';
import { SpriteCache } from '../src/engine/spriteCache';
import { createRng } from '../src/engine/rng';
import { MAPS } from '../src/data/maps';
import { DIALOGS } from '../src/data/dialog/hollowmere';
import { SONGS } from '../src/data/songs';
import { STORY } from '../src/data/story';
import { PALETTE } from '../src/data/palette';
import { TILE_IDS } from '../src/data/tiles';

function fake(name: string, log: string[]): State {
  return {
    enter: () => log.push(`${name}.enter`),
    exit: () => log.push(`${name}.exit`),
    update: () => log.push(`${name}.update`),
    render: (_c, frame) => log.push(`${name}.render:${frame}`),
  };
}
const input = {} as Input;
const ctx = {} as CanvasRenderingContext2D;

describe('StateStack', () => {
  it('updates only the top state', () => {
    const log: string[] = [];
    const s = new StateStack();
    s.push(fake('a', log));
    s.push(fake('b', log));
    log.length = 0;
    s.update(input);
    expect(log).toEqual(['b.update']);
  });
  it('renders bottom to top', () => {
    const log: string[] = [];
    const s = new StateStack();
    s.push(fake('a', log));
    s.push(fake('b', log));
    log.length = 0;
    s.render(ctx, 7);
    expect(log).toEqual(['a.render:7', 'b.render:7']);
  });
  it('replace exits the top then enters the new one', () => {
    const log: string[] = [];
    const s = new StateStack();
    s.push(fake('a', log));
    s.push(fake('b', log));
    const c = fake('c', log);
    log.length = 0;
    s.replace(c);
    expect(log).toEqual(['b.exit', 'c.enter']);
    expect(s.top).toBe(c);
  });
  it('pop on empty does not throw', () => {
    expect(() => new StateStack().pop()).not.toThrow();
  });
  it('reset exits top to bottom, then enters the new state', () => {
    const log: string[] = [];
    const s = new StateStack();
    s.push(fake('a', log));
    s.push(fake('b', log));
    const c = fake('c', log);
    log.length = 0;
    s.reset(c);
    expect(log).toEqual(['b.exit', 'a.exit', 'c.enter']);
    expect(s.states).toEqual([c]);
  });
  it('remove takes out that exact instance and keeps the top', () => {
    const log: string[] = [];
    const s = new StateStack();
    const a = fake('a', log);
    const b = fake('b', log);
    const c = fake('c', log);
    s.push(a);
    s.push(b);
    s.push(c);
    log.length = 0;
    s.remove(b);
    expect(log).toEqual(['b.exit']);
    expect(s.states).toEqual([a, c]);
    expect(s.top).toBe(c);
    expect(s.contains(b)).toBe(false);
    expect(s.contains(c)).toBe(true);
    expect(() => s.remove(b)).not.toThrow();
  });
  it('a transition under a pushed state removes only itself', () => {
    const log: string[] = [];
    const s = new StateStack();
    const a = fake('a', log);
    const b = fake('b', log);
    const t = new TransitionState(s, { frames: 3, onMid: () => {} });
    s.push(a);
    s.push(t);
    s.push(b);
    for (let i = 0; i < 6; i++) t.update(input);
    expect(s.states).toEqual([a, b]);
  });
});

function makeGame(overrides: Partial<Parameters<typeof createGame>[0]> = {}) {
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
    shops: SHOPS,
    monsters: MONSTERS,
    story: STORY,
    player: createPlayer(STORY.defaultHeroName, STORY.startingItems),
    ...overrides,
  });
  return { stack, game };
}

describe('opening scene', () => {
  it('an auto trigger fires once, after the Transition is gone', () => {
    const { stack, game } = makeGame();
    const input = {
      held: () => false,
      pressed: (a: string) => a === 'confirm' && stack.top instanceof DialogState,
    } as unknown as Input;
    const hasDialog = () => stack.states.some((s) => s instanceof DialogState);
    const t = new TransitionState(stack, {
      frames: 2,
      onMid: () => stack.reset(new ExploreState(game, STORY.newGame.map, STORY.newGame.entry)),
    });
    stack.push(t);
    let guard = 0;
    while (stack.contains(t)) {
      expect(hasDialog()).toBe(false);
      stack.update(input);
      expect(++guard).toBeLessThan(50);
    }
    expect(hasDialog()).toBe(false);
    stack.update(input);
    expect(stack.top).toBeInstanceOf(DialogState);
    let ticks = 0;
    while (!(stack.top instanceof ExploreState) && ticks++ < 2000) stack.update(input);
    expect(stack.top).toBeInstanceOf(ExploreState);
    expect(hasFlag(game.player, 'intro_done')).toBe(true);
    expect(hasFlag(game.player, 'shield_received')).toBe(true);
    expect(game.player.inventory.some((s) => s.item === 'aldric_shield')).toBe(true);
    for (let i = 0; i < 100; i++) {
      stack.update(input);
      expect(hasDialog()).toBe(false);
    }
  });
});

describe('talking', () => {
  function counterGame(middle: number, facing: 'right' | 'left' = 'right') {
    const songId = Object.keys(SONGS)[0]!;
    const map: GameMap = {
      id: 'test',
      width: 4,
      height: 1,
      tiles: [TILE_IDS.floor, middle, TILE_IDS.floor, TILE_IDS.floor],
      music: songId,
      entry: { start: { x: 0, y: 0, facing } },
      npcs: [{ id: 'n', sprite: 'elder', x: 2, y: 0, facing: 'down', wander: false, dialog: 'hi' }],
      triggers: [],
    };
    const { stack, game } = makeGame({ maps: { test: map }, dialogs: { hi: ['Hello.'] } });
    const explore = new ExploreState(game, 'test', 'start');
    stack.push(explore);
    const input = { held: () => false, pressed: (a: string) => a === 'confirm' } as unknown as Input;
    return { stack, explore, input };
  }

  it('talks across a counter and turns the NPC to face the hero', () => {
    const { stack, explore, input } = counterGame(TILE_IDS.counter);
    stack.update(input);
    expect(stack.top).toBeInstanceOf(DialogState);
    expect(explore.npcs[0]!.facing).toBe('left');
  });

  it('does not reach across an empty walkable tile', () => {
    const { stack, input } = counterGame(TILE_IDS.floor);
    stack.update(input);
    expect(stack.top).toBeInstanceOf(ExploreState);
  });

  it('throws a clear error for an unknown dialog id', () => {
    const { stack, explore, input } = counterGame(TILE_IDS.counter);
    explore.npcs[0]!.def.dialog = 'nope';
    expect(() => stack.update(input)).toThrow(/Unknown dialog: nope/);
  });
});

describe('dialog fix round 1', () => {
  it('a confirm on the tick that reveals the last character only reveals', () => {
    const drawn: string[] = [];
    const font = { drawText: (_c: unknown, t: string) => drawn.push(t) } as unknown as Font;
    const { stack, game } = makeGame({ font });
    const text = 'Hello.';
    const dlg = new DialogState(game, [text, 'Second.']);
    stack.push(dlg);
    const idle = { pressed: () => false } as unknown as Input;
    const press = { pressed: (a: string) => a === 'confirm' } as unknown as Input;
    const ctx = new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D;
    const shown = () => {
      drawn.length = 0;
      dlg.render(ctx, 1);
      return drawn.filter((t) => t !== '▼').join('|');
    };
    for (let i = 0; i < text.length - 1; i++) dlg.update(idle);
    expect(shown()).toBe('Hello');
    dlg.update(press);
    expect(shown()).toBe('Hello.');
    dlg.update(press);
    expect(shown()).toBe('S');
  });

  it('talking snaps a mid-step NPC to its tile before turning it', () => {
    const songId = Object.keys(SONGS)[0]!;
    const map: GameMap = {
      id: 'test',
      width: 3,
      height: 1,
      tiles: [TILE_IDS.floor, TILE_IDS.floor, TILE_IDS.floor],
      music: songId,
      entry: { start: { x: 0, y: 0, facing: 'right' } },
      npcs: [{ id: 'n', sprite: 'elder', x: 1, y: 0, facing: 'down', wander: false, dialog: 'hi' }],
      triggers: [],
    };
    const { stack, game } = makeGame({ maps: { test: map }, dialogs: { hi: ['Hello.'] } });
    const explore = new ExploreState(game, 'test', 'start');
    stack.push(explore);
    const npc = explore.npcs[0]!;
    npc.stepFrame = 4;
    const input = { held: () => false, pressed: (a: string) => a === 'confirm' } as unknown as Input;
    stack.update(input);
    expect(stack.top).toBeInstanceOf(DialogState);
    expect(npc.stepFrame).toBe(0);
    expect(npc.facing).toBe('left');
    expect(npcPixelOffset(npc)).toEqual({ dx: 0, dy: 0 });
  });
});

describe('leaving interiors', () => {
  it.each(['elder_house', 'inn', 'forge', 'shop'])('walking down from the %s door returns to the town', (id) => {
    const { stack, game } = makeGame();
    game.player = setFlag(game.player, STORY.opening.flag);
    const explore = new ExploreState(game, id, 'door');
    stack.push(explore);
    const input = {
      held: (a: string) => a === 'down',
      pressed: () => false,
      repeat: () => false,
      rearm: () => {},
    } as unknown as Input;
    let guard = 0;
    while (!stack.states.some((s) => s instanceof TransitionState)) {
      stack.update(input);
      expect(++guard).toBeLessThan(200);
    }
    while (stack.states.some((s) => s instanceof TransitionState)) {
      stack.update(input);
      expect(++guard).toBeLessThan(400);
    }
    expect(explore.mapId).toBe('hollowmere');
    const landing = MAPS.hollowmere.entry[id]!;
    expect(explore.hero).toMatchObject({ x: landing.x, y: landing.y });
  });
});

describe('escape from dialog', () => {
  function cancelInput(stack: StateStack, fire: { cancel: boolean }) {
    return {
      held: () => false,
      rearm: () => {},
      pressed: (a: string) => a === 'cancel' && fire.cancel,
    } as unknown as Input;
  }
  function setup(script: import('../src/game/dialog/script').DialogScript, onChoice?: (a: boolean) => void) {
    const { stack, game } = makeGame();
    const sfx: string[] = [];
    game.audio.playSfx = ((id: string) => void sfx.push(id)) as typeof game.audio.playSfx;
    let done = 0;
    const d = new DialogState(game, script, { onDone: () => done++, onChoice });
    stack.push(d);
    const fire = { cancel: true };
    const input = cancelInput(stack, fire);
    return { stack, game, sfx, d, input, fire, done: () => done };
  }

  it('cancel on the opening scene still gives the shield and sets flags', () => {
    const { stack, game } = makeGame();
    const fire = { cancel: true };
    const input = cancelInput(stack, fire);
    const explore = new ExploreState(game, STORY.newGame.map, STORY.newGame.entry);
    stack.push(explore);
    stack.update({ held: () => false, rearm: () => {}, pressed: () => false } as unknown as Input);
    expect(stack.top).toBeInstanceOf(DialogState);
    stack.update(input);
    expect(stack.top).toBe(explore);
    expect(stack.states.some((s) => s instanceof DialogState)).toBe(false);
    expect(game.player.inventory.some((s) => s.item === 'aldric_shield')).toBe(true);
    expect(hasFlag(game.player, 'shield_received')).toBe(true);
    expect(hasFlag(game.player, 'intro_done')).toBe(true);
  });

  it('cancel on a showing choice takes No and reports false; onDone once', () => {
    const calls: boolean[] = [];
    const script = ['hi', { choice: ['Y', 'N'], yes: [{ set: 'yes' }], no: [{ set: 'no' }] }] as import('../src/game/dialog/script').DialogScript;
    const t = setup(script, (a) => calls.push(a));
    t.fire.cancel = false;
    t.input.pressed = (a: string) => a === 'confirm';
    // advance to the choice with confirm presses
    let guard = 0;
    while (guard++ < 200 && !(t.d as unknown as { model: { isChoice: boolean } }).model.isChoice) t.stack.update(t.input);
    expect((t.d as unknown as { model: { isChoice: boolean } }).model.isChoice).toBe(true);
    t.input.pressed = (a: string) => a === 'cancel';
    t.stack.update(t.input);
    expect(calls).toEqual([false]);
    expect(hasFlag(t.game.player, 'no')).toBe(true);
    expect(hasFlag(t.game.player, 'yes')).toBe(false);
    expect(t.stack.contains(t.d)).toBe(false);
    expect(t.done()).toBe(1);
    t.stack.update(t.input);
    expect(t.done()).toBe(1);
  });

  it('cancel before the choice is reached does the same', () => {
    const calls: boolean[] = [];
    const script = ['hi', { choice: ['Y', 'N'], yes: [{ set: 'yes' }], no: [{ set: 'no' }] }] as import('../src/game/dialog/script').DialogScript;
    const t = setup(script, (a) => calls.push(a));
    t.stack.update(t.input);
    expect(calls).toEqual([false]);
    expect(hasFlag(t.game.player, 'no')).toBe(true);
    expect(hasFlag(t.game.player, 'yes')).toBe(false);
    expect(t.done()).toBe(1);
  });

  it('later sfx nodes stay silent; only menuCancel plays', () => {
    const t = setup(['hi', { sfx: 'door' }, { set: 'x' }, { sfx: 'error' }, 'bye']);
    t.stack.update(t.input);
    expect(t.sfx).toEqual(['menuCancel']);
    expect(hasFlag(t.game.player, 'x')).toBe(true);
  });

  it('the cancel that closes a dialog does not open the menu', () => {
    const { stack, game } = makeGame();
    game.player = setFlag(game.player, 'intro_done');
    const explore = new ExploreState(game, STORY.newGame.map, STORY.newGame.entry);
    stack.push(explore);
    stack.push(new DialogState(game, ['hello', 'there']));
    const fire = { cancel: true };
    const input = cancelInput(stack, fire);
    stack.update(input);
    expect(stack.top).toBe(explore);
    expect(stack.states).toHaveLength(1);
    fire.cancel = false;
    stack.update(input);
    expect(stack.states).toHaveLength(1);
    expect(stack.top).toBe(explore);
  });
});

describe('dialog services', () => {
  type Script = import('../src/game/dialog/script').DialogScript;
  const press = (a: string) => ({ held: () => false, rearm: () => {}, pressed: (k: string) => k === a }) as unknown as Input;

  function setup(script: Script, services: ConstructorParameters<typeof DialogState>[2] = {}, gold = 0) {
    const { stack, game } = makeGame();
    game.audio.playSfx = (() => {}) as typeof game.audio.playSfx;
    game.player = { ...game.player, gold, hp: 1, mp: 0 };
    const d = new DialogState(game, script, services);
    stack.push(d);
    return { stack, game, d };
  }
  // confirm until the dialog reveals fully and moves on: first confirm reveals, second advances
  const confirmTwice = (stack: StateStack) => {
    stack.update(press('confirm'));
    stack.update(press('confirm'));
  };

  it('pay subtracts the price when affordable', () => {
    const { game, stack, d } = setup([{ pay: 6, then: ['ok'] }], {}, 6);
    expect(game.player.gold).toBe(0);
    expect(stack.states).toContain(d);
  });

  it('pay changes nothing and skips then when gold is short', () => {
    let done = 0;
    const { game, stack, d } = setup([{ pay: 6, then: ['ok'] }], { onDone: () => done++ }, 5);
    expect(game.player.gold).toBe(5);
    stack.update(press('none'));
    expect(stack.states).not.toContain(d);
    expect(done).toBe(1);
  });

  it.each([-1, 1.5, NaN])('pay rejects the bad price %s', (n) => {
    expect(() => setup([{ pay: n, then: ['ok'] }], {}, 10)).toThrow('Bad price');
  });

  it('pay 0 succeeds and takes nothing', () => {
    const { game } = setup([{ pay: 0, then: ['ok'] }], {}, 3);
    expect(game.player.gold).toBe(3);
  });

  it('save shows ok when the service succeeds, calling it once', () => {
    let calls = 0;
    const { game, stack } = setup([{ save: true, ok: ['w'], fail: ['f'] }], { services: { save: () => (calls++, true) } });
    const drawn: string[] = [];
    (game as { font: unknown }).font = { drawText: (_c: unknown, t: string) => drawn.push(t) };
    const ctx = new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D;
    stack.update(press('none'));
    (stack.top as DialogState).render(ctx, 1);
    expect(drawn.filter((t) => t !== '▼').join('')).toBe('w');
    expect(calls).toBe(1);
  });

  it('cancelled save still calls the service once', () => {
    let calls = 0;
    const { stack } = setup(['hi', { save: true, ok: [], fail: [] }], { services: { save: () => (calls++, true) } });
    stack.update(press('cancel'));
    expect(calls).toBe(1);
  });

  it('a dialog does nothing more in the update that opened a state', () => {
    const sfx: string[] = [];
    let done = 0;
    const fakeState = fake('shopscreen', []);
    const { stack, game, d } = setup(['hi', { shop: 's' }], {
      onDone: () => done++,
      services: { shop: () => stack.push(fakeState) },
    });
    game.audio.playSfx = ((id: string) => void sfx.push(id)) as typeof game.audio.playSfx;
    stack.update(press('none'));
    stack.update(press('confirm'));
    sfx.length = 0;
    stack.update(press('confirm'));
    expect(stack.top).toBe(fakeState);
    expect(stack.states).toContain(d);
    expect(done).toBe(0);
    expect(sfx).not.toContain('blip');
    stack.remove(fakeState);
    stack.update(press('none'));
    expect(stack.states).not.toContain(d);
    expect(done).toBe(1);
  });

  it('rest restores HP and MP and calls the service once', () => {
    const calls: string[] = [];
    const { game, stack, d } = setup(['hi', { rest: 'r' }, 'bye'], { services: { rest: (s) => calls.push(s) } });
    game.player = { ...game.player, hp: 1, mp: 0 };
    confirmTwice(stack);
    expect(game.player.hp).toBe(game.player.maxHp);
    expect(game.player.mp).toBe(game.player.maxMp);
    expect(calls).toEqual(['r']);
    expect(stack.states).toContain(d);
    // it shows bye
    const drawn: string[] = [];
    (game as { font: unknown }).font = { drawText: (_c: unknown, t: string) => drawn.push(t) };
    const ctx = new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D;
    for (let i = 0; i < 5; i++) stack.update(press('none'));
    d.render(ctx, 1);
    expect(drawn.filter((t) => t !== '▼').join('')).toBe('bye');
  });

  it('cancelled rest still restores but does not call the service', () => {
    const calls: string[] = [];
    const { game, stack, d } = setup(['hi', { rest: 'r' }, 'bye'], { services: { rest: (s) => calls.push(s) } });
    stack.update(press('cancel'));
    expect(game.player.hp).toBe(game.player.maxHp);
    expect(game.player.mp).toBe(game.player.maxMp);
    expect(calls).toEqual([]);
    expect(stack.states).not.toContain(d);
  });

  it('shop opens a state over the dialog; removing it resumes the script', () => {
    const log: string[] = [];
    const fakeState = fake('shopscreen', log);
    let pushed = false;
    const { stack, d, game } = setup(['hi', { shop: 's' }, 'bye'], {
      services: {
        shop: (id) => {
          expect(id).toBe('s');
          pushed = true;
          stack.push(fakeState);
        },
      },
    });
    confirmTwice(stack);
    expect(pushed).toBe(true);
    expect(stack.top).toBe(fakeState);
    expect(stack.states[stack.states.length - 2]).toBe(d);
    stack.remove(fakeState);
    const drawn: string[] = [];
    (game as { font: unknown }).font = { drawText: (_c: unknown, t: string) => drawn.push(t) };
    const ctx = new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D;
    for (let i = 0; i < 5; i++) stack.update(press('none'));
    d.render(ctx, 1);
    expect(drawn.filter((t) => t !== '▼').join('')).toBe('bye');
    confirmTwice(stack);
    expect(stack.states).not.toContain(d);
  });

  it('cancelled shop does not call the service', () => {
    let calls = 0;
    const { stack, d } = setup(['hi', { shop: 's' }, 'bye'], { services: { shop: () => void calls++ } });
    stack.update(press('cancel'));
    expect(calls).toBe(0);
    expect(stack.states).not.toContain(d);
  });

  it('save with no services takes the fail branch', () => {
    const { game, stack } = setup([{ save: true, ok: ['w'], fail: ['f'] }]);
    const drawn: string[] = [];
    (game as { font: unknown }).font = { drawText: (_c: unknown, t: string) => drawn.push(t) };
    const ctx = new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D;
    stack.update(press('none'));
    (stack.top as DialogState).render(ctx, 1);
    expect(drawn.filter((t) => t !== '▼').join('')).toBe('f');
  });
});
