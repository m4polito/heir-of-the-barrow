import { describe, expect, it } from 'vitest';
import { StateStack } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import type { Font } from '../src/engine/font';
import { AudioManager } from '../src/engine/audio/audio';
import { SpriteCache } from '../src/engine/spriteCache';
import { createRng } from '../src/engine/rng';
import { advance, MAX_STEPS_PER_FRAME } from '../src/engine/loop';
import { ExploreState } from '../src/game/explore';
import { TitleState } from '../src/game/title';
import { TransitionState } from '../src/game/transition';
import { DialogState } from '../src/game/dialog/dialogState';
import { MenuState } from '../src/game/menu/menuState';
import { BattleState } from '../src/game/battle/battleState';
import { createGame } from '../src/game/game';
import { createPlayer } from '../src/game/player';
import { toSave } from '../src/game/save';
import { stepGame } from '../src/game/step';
import { PLAY_FRAMES_MAX, formatPlayTime, tickPlayTime } from '../src/game/playTime';
import { statusLines } from '../src/game/stats';
import { MAPS } from '../src/data/maps';
import { ITEMS } from '../src/data/items';
import { SPELLS } from '../src/data/spells';
import { SHOPS } from '../src/data/shops';
import { MONSTERS } from '../src/data/monsters';
import { DIALOGS } from '../src/data/dialog/hollowmere';
import { SONGS } from '../src/data/songs';
import { STORY } from '../src/data/story';
import { PALETTE } from '../src/data/palette';

const FPS = 60;
const frames = (h: number, m: number, s: number) => (h * 3600 + m * 60 + s) * FPS;

describe('tickPlayTime', () => {
  const hero = () => createPlayer('Wren', []);
  it('a new hero has played no time', () => {
    expect(hero().playFrames).toBe(0);
  });
  it('adds one frame without touching anything else', () => {
    const p = hero();
    const q = tickPlayTime(p);
    expect(q.playFrames).toBe(1);
    expect({ ...q, playFrames: 0 }).toEqual(p);
    expect(p.playFrames).toBe(0);
  });
  it('stops at 999:59:59 and returns the same object there', () => {
    expect(PLAY_FRAMES_MAX).toBe(frames(999, 59, 59) + 59);
    const p = { ...hero(), playFrames: PLAY_FRAMES_MAX - 1 };
    const at = tickPlayTime(p);
    expect(at.playFrames).toBe(PLAY_FRAMES_MAX);
    expect(tickPlayTime(at)).toBe(at);
  });
});

describe('formatPlayTime', () => {
  it.each([
    [0, '0:00'],
    [59, '0:00'],
    [frames(0, 0, 59), '0:00'],
    [frames(0, 1, 0), '0:01'],
    [frames(0, 0, 3599), '0:59'],
    [frames(1, 0, 0), '1:00'],
    [frames(1, 7, 59) + 59, '1:07'],
    [frames(10, 5, 0), '10:05'],
    [PLAY_FRAMES_MAX, '999:59'],
  ])('%i frames reads %s', (f, text) => {
    expect(formatPlayTime(f)).toBe(text);
  });
});

describe('a hidden tab', () => {
  it('a ten-minute gap runs at most the per-frame cap of steps', () => {
    const r = advance(0, 10 * 60 * 1000);
    expect(r.steps).toBeLessThanOrEqual(MAX_STEPS_PER_FRAME);
    expect(r.steps).toBe(5);
    expect(r.remainderMs).toBe(0);
  });
});

const idle = {
  held: () => false,
  pressed: () => false,
  repeat: () => false,
  rearm: () => {},
} as unknown as Input;
const keys = (...down: string[]) =>
  ({
    held: () => false,
    pressed: (a: string) => down.includes(a),
    repeat: (a: string) => down.includes(a),
    rearm: () => {},
  }) as unknown as Input;

function setup(stored: string | null = null) {
  const stack = new StateStack();
  const game = createGame({
    stack,
    input: {} as Input,
    font: { drawText: () => {}, measure: () => 0 } as unknown as Font,
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
    storage: { getItem: () => stored, setItem: () => {} },
    player: createPlayer(STORY.defaultHeroName, STORY.startingItems),
  });
  game.audio.playSfx = () => {};
  game.audio.playSong = () => {};
  game.audio.stopSong = () => {};
  const title = new TitleState(game);
  stack.push(title);
  const run = (n: number, input: Input = idle) => {
    for (let i = 0; i < n; i++) stepGame(game, input);
  };
  const fade = () => {
    for (let i = 0; i < 40 && stack.top instanceof TransitionState; i++) stepGame(game, idle);
  };
  const startNewGame = () => {
    run(1, keys('confirm')); // New Game -> name entry
    run(1, keys('up'));
    run(1, keys('right')); // END
    run(1, keys('confirm'));
    fade();
  };
  return { stack, game, title, run, fade, startNewGame };
}

describe('counting play time', () => {
  it('does not count on the title screen or during name entry', () => {
    const t = setup();
    t.run(300);
    expect(t.game.player.playFrames).toBe(0);
    t.run(1, keys('confirm')); // name entry opens
    t.run(300);
    expect(t.game.player.playFrames).toBe(0);
  });

  it('counts every update once a new game has started', () => {
    const t = setup();
    t.startNewGame();
    expect(t.stack.states.some((s) => s instanceof ExploreState)).toBe(true);
    const before = t.game.player.playFrames;
    t.run(500);
    expect(t.game.player.playFrames).toBe(before + 500);
  });

  it('counts under a dialog, the menu, a battle and a fade', () => {
    const t = setup();
    t.startNewGame();
    t.run(300); // the opening scene's dialog is up, or has finished
    const layers: (() => void)[] = [
      () => t.stack.push(new DialogState(t.game, ['Hello.'])),
      () => t.stack.push(new MenuState(t.game)),
      () =>
        t.stack.push(
          new BattleState(t.game, { monster: Object.values(MONSTERS)[0]!, backdrop: 'barrow', onEnd: () => {} }),
        ),
      () => t.stack.push(new TransitionState(t.stack, { frames: 300, onMid: () => {} })),
    ];
    for (const push of layers) {
      const before = t.game.player.playFrames;
      push();
      t.run(20);
      expect(t.game.player.playFrames).toBe(before + 20);
    }
  });

  it('Continue resumes from the saved value and then counts', () => {
    const saved = { ...createPlayer('Wren', STORY.startingItems), playFrames: 5000 };
    const text = JSON.stringify(toSave(saved, { map: STORY.newGame.map, x: 6, y: 4, facing: 'up' }));
    const t = setup(text);
    t.run(100);
    expect(t.game.player.playFrames).toBe(0);
    t.run(1, keys('confirm')); // Continue
    for (let i = 0; i < 40 && !t.stack.states.some((s) => s instanceof ExploreState); i++) t.run(1);
    expect(t.game.player.playFrames).toBe(5000);
    t.run(60);
    expect(t.game.player.playFrames).toBe(5060);
  });

  it('a death respawn keeps the total and keeps counting', () => {
    const t = setup();
    t.startNewGame();
    t.run(100);
    const explore = t.stack.states.find((s) => s instanceof ExploreState) as ExploreState;
    const before = t.game.player.playFrames;
    (explore as unknown as { endBattle: (o: string) => void }).endBattle('lost');
    expect(t.game.player.playFrames).toBe(before);
    t.run(50);
    expect(t.game.player.playFrames).toBe(before + 50);
  });
});

describe('TIME in Status', () => {
  const lineWidth = 128 - 16 - 8; // window width, minus the left text inset and the right border inset
  it('shows TIME 0:00 for a new hero', () => {
    expect(statusLines(ITEMS, createPlayer('Wren', [])).at(-1)).toBe('TIME 0:00');
  });
  it('shows TIME 1:07 at 1 h 7 min 59 s', () => {
    const p = { ...createPlayer('Wren', []), playFrames: frames(1, 7, 59) };
    expect(statusLines(ITEMS, p)).toContain('TIME 1:07');
  });
  it('every line fits the window text width, even at the cap and with a long name', () => {
    const p = { ...createPlayer('WWWWWWWW', []), playFrames: PLAY_FRAMES_MAX, gold: 65535, xp: 65535 };
    for (const line of statusLines(ITEMS, p)) expect(line.length * 8).toBeLessThanOrEqual(lineWidth);
  });
});
