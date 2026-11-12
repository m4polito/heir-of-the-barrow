import { describe, it, expect } from 'vitest';
import { StateStack, type State } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import { TransitionState } from '../src/game/transition';
import { DialogState } from '../src/game/dialog/dialogState';
import { ExploreState } from '../src/game/explore';
import { createGame } from '../src/game/game';
import { createPlayer, hasFlag } from '../src/game/player';
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
    story: STORY,
    player: createPlayer(STORY.defaultHeroName),
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
