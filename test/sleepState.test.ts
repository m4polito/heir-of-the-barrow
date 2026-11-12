import { describe, expect, it } from 'vitest';
import { StateStack, type State } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import type { Font } from '../src/engine/font';
import { AudioManager } from '../src/engine/audio/audio';
import { songFrames, type Song } from '../src/engine/audio/sequencer';
import { SpriteCache } from '../src/engine/spriteCache';
import { createRng } from '../src/engine/rng';
import { ExploreState } from '../src/game/explore';
import { createGame } from '../src/game/game';
import { applyLevel, createPlayer, type PlayerState } from '../src/game/player';
import { DialogState } from '../src/game/dialog/dialogState';
import { SleepState, SLEEP_FADE } from '../src/game/sleepState';
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

const TEST_SONG: Song = {
  id: 'test',
  tempo: 150,
  loop: false,
  tracks: [{ channel: 'p1', rows: ['C4', null, null, 'off'] }],
};

function setup(patch: Partial<PlayerState> = {}, dialogs: typeof DIALOGS = DIALOGS) {
  const stack = new StateStack();
  const songs: string[] = [];
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
  game.audio.playSfx = () => {};
  game.audio.playSong = (s: Song) => void songs.push(s.id);
  game.audio.stopSong = () => void songs.push('stop');
  const explore = new ExploreState(game, 'inn', { x: 5, y: 4, facing: 'up' });
  stack.push(explore);
  songs.length = 0; // the map song started on push
  const idle = (n = 200) => {
    for (let i = 0; i < n; i++) stack.update(keys());
  };
  const press = (...k: string[]) => stack.update(keys(...k));
  const shown = () => {
    drawn.length = 0;
    stack.top!.render(ctx, 1);
    return drawn.filter((t) => !['▶', '▼', 'Yes', 'No'].includes(t)).join(' ');
  };
  return { stack, game, explore, songs, idle, press, shown };
}

type Setup = ReturnType<typeof setup>;

describe('SleepState', () => {
  it('stops the song, plays the jingle on update 20, wakes on 44, leaves on 64', () => {
    const stack = new StateStack();
    const calls: string[] = [];
    const audio = {
      stopSong: () => void calls.push('stop'),
      playSong: (s: Song) => void calls.push(`play:${s.id}`),
    };
    let wakes = 0;
    const under: State = { update: () => {}, render: () => {} };
    let underUpdates = 0;
    under.update = () => void (underUpdates += 1);
    stack.push(under);
    const sleep = new SleepState({ audio, stack } as never, { song: TEST_SONG, onWake: () => void (wakes += 1) });
    stack.push(sleep);
    expect(SLEEP_FADE).toBe(20);
    expect(songFrames(TEST_SONG)).toBe(24);
    expect(calls).toEqual(['stop']);
    const always = keys('confirm', 'cancel');
    const playAt: number[] = [];
    const wakeAt: number[] = [];
    let leftAt = 0;
    for (let n = 1; n <= 70; n++) {
      const plays = calls.filter((c) => c.startsWith('play')).length;
      const w = wakes;
      stack.update(always);
      if (calls.filter((c) => c.startsWith('play')).length > plays) playAt.push(n);
      if (wakes > w) wakeAt.push(n);
      if (!leftAt && !stack.states.includes(sleep)) leftAt = n;
      if (n < 64) expect(underUpdates).toBe(0);
    }
    expect(playAt).toEqual([20]);
    expect(wakeAt).toEqual([44]);
    expect(leftAt).toBe(64);
    expect(calls).toEqual(['stop', 'play:test']);
    expect(underUpdates).toBe(6);
  });
});

describe('the inn', () => {
  const talk = (patch: Partial<PlayerState>) => {
    const t = setup({ ...applyLevel(createPlayer(STORY.defaultHeroName, []), 3), hp: 3, mp: 0, gold: 10, ...patch });
    t.press('confirm'); // talk to Hesta
    return t;
  };
  /** Types out the line, then confirms it. */
  const next = (t: Setup) => {
    t.idle();
    t.press('confirm');
  };
  const toQuestion = (t: Setup) => {
    next(t);
    next(t);
    t.idle();
  };
  const sleeping = (t: Setup) => t.stack.states.some((s) => s instanceof SleepState);
  const SLEPT = 20 + 180 + 20 + 5;

  it('six gold buys a full rest, the jingle, then the map song again', () => {
    const t = talk({});
    toQuestion(t);
    t.press('confirm'); // Yes
    expect(t.game.player.gold).toBe(4);
    expect(t.game.player.maxMp).toBeGreaterThan(0);
    expect(t.game.player.hp).toBe(t.game.player.maxHp);
    expect(t.game.player.mp).toBe(t.game.player.maxMp);
    expect(t.stack.top).toBeInstanceOf(SleepState);
    t.idle(SLEPT);
    expect(t.stack.top).toBeInstanceOf(DialogState);
    t.idle();
    expect(t.shown()).toContain('Morning. You slept like a stone. He never could.');
    expect(t.songs).toEqual(['stop', 'inn', SONGS.hollowmere.id]);
    next(t);
    expect(t.stack.top).toBe(t.explore);
    expect(t.game.player.gold).toBe(4);
  });

  it('exactly six gold is enough', () => {
    const t = talk({ gold: 6 });
    toQuestion(t);
    t.press('confirm');
    expect(t.game.player.gold).toBe(0);
    expect(t.stack.top).toBeInstanceOf(SleepState);
    t.idle(SLEPT);
    t.idle();
    expect(t.shown()).toContain('Morning. You slept like a stone. He never could.');
    expect(t.game.player.hp).toBe(t.game.player.maxHp);
    expect(t.game.player.mp).toBe(t.game.player.maxMp);
  });

  it('five gold is refused', () => {
    const t = talk({ gold: 5 });
    toQuestion(t);
    t.press('confirm');
    t.idle();
    expect(t.shown()).toContain('That is not 6 gold. Come back when you have it.');
    expect(t.game.player.gold).toBe(5);
    expect(t.game.player.hp).toBe(3);
    expect(sleeping(t)).toBe(false);
  });

  it('No changes nothing', () => {
    const t = talk({});
    toQuestion(t);
    t.press('down');
    t.press('confirm');
    t.idle();
    expect(t.shown()).toContain('Then mind the road. The bed will keep.');
    expect(t.game.player.gold).toBe(10);
    expect(t.game.player.hp).toBe(3);
    expect(sleeping(t)).toBe(false);
  });

  it('cancel on the first line or at the question costs nothing', () => {
    const a = talk({});
    a.idle(5);
    a.press('cancel');
    const b = talk({});
    toQuestion(b);
    b.press('cancel');
    for (const t of [a, b]) {
      expect(t.game.player.gold).toBe(10);
      expect(t.game.player.hp).toBe(3);
      expect(sleeping(t)).toBe(false);
      expect(t.stack.top).toBe(t.explore);
    }
  });

  it('after the Warden the morning line changes', () => {
    const t = talk({ flags: ['warden_defeated'] });
    toQuestion(t);
    t.press('confirm');
    t.idle(SLEPT);
    t.idle();
    expect(t.shown()).toContain('Morning. Eat before you go. I mean it.');
  });
});

describe('explore rest service', () => {
  it('throws for an unknown song id', () => {
    const t = setup({}, { ...DIALOGS, hesta: [{ rest: 'nope' }] });
    expect(() => t.press('confirm')).toThrow('Unknown song: nope');
  });
});
