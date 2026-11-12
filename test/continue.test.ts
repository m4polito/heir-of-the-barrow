import { describe, expect, it } from 'vitest';
import { StateStack } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import type { Font } from '../src/engine/font';
import { AudioManager } from '../src/engine/audio/audio';
import { SpriteCache } from '../src/engine/spriteCache';
import { createRng } from '../src/engine/rng';
import { ExploreState } from '../src/game/explore';
import { TitleState } from '../src/game/title';
import { NameEntryState } from '../src/game/nameEntry';
import { TransitionState } from '../src/game/transition';
import { DialogState } from '../src/game/dialog/dialogState';
import { createGame } from '../src/game/game';
import { createPlayer, setFlag, type PlayerState } from '../src/game/player';
import { fromSave, readSave, toSave } from '../src/game/save';
import { attackOf } from '../src/game/stats';
import { MAPS } from '../src/data/maps';
import { ITEMS } from '../src/data/items';
import { SPELLS } from '../src/data/spells';
import { SHOPS } from '../src/data/shops';
import { MONSTERS } from '../src/data/monsters';
import { DIALOGS } from '../src/data/dialog/hollowmere';
import { SONGS } from '../src/data/songs';
import { STORY } from '../src/data/story';
import { PALETTE } from '../src/data/palette';

const KEY = 'dimming.save.v1';
const ctx = new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D;
const drawn: string[] = [];
const font = { drawText: (_c: unknown, t: string) => drawn.push(t) } as unknown as Font;

const keys = (...down: string[]) =>
  ({
    held: () => false,
    pressed: (a: string) => down.includes(a),
    repeat: (a: string) => down.includes(a),
    rearm: () => {},
  }) as unknown as Input;

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function mapStore(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial));
  const calls = { get: 0, set: 0 };
  const store: Store = {
    getItem: (k) => {
      calls.get++;
      return m.get(k) ?? null;
    },
    setItem: (k, v) => {
      calls.set++;
      m.set(k, v);
    },
  };
  return { m, store, calls };
}

function build(storage: Store | null | undefined, patch: Partial<PlayerState> = {}) {
  const stack = new StateStack();
  const sounds: string[] = [];
  const base = createPlayer(STORY.defaultHeroName, STORY.startingItems);
  const game = createGame({
    stack,
    input: {} as Input,
    font,
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
    player: setFlag({ ...base, ...patch }, STORY.opening.flag),
    ...(storage === undefined ? {} : { storage }),
  });
  game.audio.playSfx = (id: string) => void sounds.push(id);
  game.audio.playSong = () => {};
  game.audio.stopSong = () => {};
  return { stack, game, sounds };
}

function maren(storage: Store | null | undefined, patch: Partial<PlayerState> = {}) {
  const t = build(storage, patch);
  const explore = new ExploreState(t.game, 'elder_house', 'start');
  t.stack.push(explore);
  const idle = (n = 200) => {
    for (let i = 0; i < n; i++) t.stack.update(keys());
  };
  const press = (...k: string[]) => t.stack.update(keys(...k));
  const confirm = () => {
    idle();
    press('confirm');
  };
  const shown = () => {
    drawn.length = 0;
    t.stack.top!.render(ctx, 1);
    return drawn.filter((s) => !['▶', '▼', 'Yes', 'No'].includes(s)).join(' ');
  };
  press('confirm'); // talk
  confirm(); // first line -> the question
  idle(); // reveal Yes / No
  return { ...t, explore, idle, press, confirm, shown };
}

const title = (storage: Store | null | undefined) => {
  const t = build(storage);
  const state = new TitleState(t.game);
  return { ...t, state };
};

describe('saving at Maren', () => {
  it('Yes writes the save under the story key, with the hero tile and facing', () => {
    const { m, store } = mapStore();
    const t = maren(store);
    t.sounds.length = 0;
    t.press('confirm'); // Yes
    expect([...m.keys()]).toEqual([KEY]);
    const saved = readSave(store, KEY, { items: ITEMS, maps: MAPS })!;
    expect(saved.map).toBe('elder_house');
    expect({ x: saved.x, y: saved.y }).toEqual({ x: t.explore.hero.x, y: t.explore.hero.y });
    expect(saved.facing).toBe('up');
    expect(fromSave(saved)).toEqual(t.game.player);
    t.idle();
    expect(t.shown()).toContain('It is written.');
    expect(t.sounds.filter((s) => s === 'menuConfirm')).toHaveLength(2);
  });

  it('No writes nothing and carries on to the next line', () => {
    const { m, store } = mapStore();
    const t = maren(store);
    t.press('right'); // move the cursor to No
    t.press('confirm');
    expect(m.size).toBe(0);
    t.idle();
    expect(t.shown()).toContain('We stopped saying the word years ago. The cold stayed anyway.');
  });

  it('cancel on the first line or at the question writes nothing', () => {
    const a = mapStore();
    const first = build(a.store);
    first.stack.push(new ExploreState(first.game, 'elder_house', 'start'));
    first.stack.update(keys('confirm'));
    first.stack.update(keys('cancel'));
    for (let i = 0; i < 100; i++) first.stack.update(keys());
    expect(a.m.size).toBe(0);

    const b = mapStore();
    const q = maren(b.store);
    q.press('cancel');
    q.idle();
    expect(b.m.size).toBe(0);
  });

  it('a failing setItem says nothing was written and does not throw', () => {
    const store: Store = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    const t = maren(store);
    expect(() => t.press('confirm')).not.toThrow();
    t.idle();
    expect(t.shown()).toContain('The page will not take the ink. Nothing was written.');
  });

  it('no storage at all says the same', () => {
    const t = maren(undefined);
    t.press('confirm');
    t.idle();
    expect(t.shown()).toContain('The page will not take the ink. Nothing was written.');
  });

  it('saving twice replaces the entry', () => {
    const { m, store } = mapStore();
    const t = maren(store);
    t.press('confirm');
    const first = readSave(store, KEY, { items: ITEMS, maps: MAPS })!;
    t.game.player = { ...t.game.player, gold: first.gold + 40 };
    t.confirm(); // "It is written." -> "We stopped saying..."
    t.confirm(); // -> "Come back when you need to..."
    t.confirm(); // dialog ends
    expect(t.stack.top).toBe(t.explore);
    t.press('confirm'); // talk again
    t.confirm(); // first line -> the question
    t.idle();
    t.press('confirm'); // Yes
    expect(m.size).toBe(1);
    expect(readSave(store, KEY, { items: ITEMS, maps: MAPS })!.gold).toBe(first.gold + 40);
  });
});

describe('Continue on the title', () => {
  function saved(patch: Partial<PlayerState> = {}) {
    const hero = { ...createPlayer(STORY.defaultHeroName, STORY.startingItems), ...patch };
    const { m, store, calls } = mapStore();
    const data = toSave(setFlag(hero, STORY.opening.flag), { map: 'elder_house', x: 6, y: 4, facing: 'up' });
    m.set(KEY, JSON.stringify(data));
    return { m, store, calls, data };
  }

  it('lists Continue above New Game after enter()', () => {
    const { store } = saved();
    const t = title(store);
    t.stack.push(t.state);
    expect(t.state.rows).toEqual(['Continue', 'New Game']);
  });

  it('Continue fades into Explore at the saved tile with the saved player', () => {
    const { store } = saved({ gold: 77 });
    const t = title(store);
    t.stack.push(t.state);
    const before = t.game.player;
    t.stack.update(keys('confirm'));
    expect(t.stack.top).toBeInstanceOf(TransitionState);
    t.stack.update(keys('confirm')); // presses during the fade do nothing
    let dialogs = 0;
    for (let i = 0; i < 200 && t.stack.states.some((s) => s instanceof TransitionState); i++) {
      t.stack.update(keys('confirm'));
    }
    for (let i = 0; i < 100; i++) {
      t.stack.update(keys());
      if (t.stack.states.some((s) => s instanceof DialogState)) dialogs++;
    }
    expect(t.stack.states).toHaveLength(1);
    const ex = t.stack.top as ExploreState;
    expect(ex).toBeInstanceOf(ExploreState);
    expect(ex.mapId).toBe('elder_house');
    expect({ x: ex.hero.x, y: ex.hero.y, facing: ex.hero.facing }).toEqual({ x: 6, y: 4, facing: 'up' });
    expect(t.game.player.gold).toBe(77);
    expect(t.game.player).not.toBe(before);
    expect(dialogs).toBe(0);
  });

  it('keeps worn gear', () => {
    const { store } = saved({ equipment: { weapon: 'wooden_club' } });
    const t = title(store);
    t.stack.push(t.state);
    t.stack.update(keys('confirm'));
    for (let i = 0; i < 200 && t.stack.states.some((s) => s instanceof TransitionState); i++) t.stack.update(keys());
    expect(attackOf(ITEMS, t.game.player)).toBe(6);
  });

  it.each([
    ['broken JSON', '{'],
    ['a version 2 save', JSON.stringify({ ...saved().data, version: 2 })],
  ])('%s shows New Game only and leaves the text alone', (_n, text) => {
    const { m, store } = mapStore({ [KEY]: text });
    const t = title(store);
    t.stack.push(t.state);
    expect(t.state.rows).toEqual(['New Game']);
    expect(m.get(KEY)).toBe(text);
  });

  it('a throwing getItem shows New Game only', () => {
    const t = title({
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {},
    });
    expect(() => t.stack.push(t.state)).not.toThrow();
    expect(t.state.rows).toEqual(['New Game']);
  });

  it('down then confirm starts New Game and leaves the save untouched', () => {
    const { m, store } = saved();
    const text = m.get(KEY);
    const t = title(store);
    t.stack.push(t.state);
    t.stack.update(keys('down'));
    t.stack.update(keys('confirm'));
    expect(t.stack.top).toBeInstanceOf(NameEntryState);
    expect(m.get(KEY)).toBe(text);
  });

  it('with no save, down does nothing silently and confirm opens name entry', () => {
    const { store } = mapStore();
    const t = title(store);
    t.stack.push(t.state);
    t.sounds.length = 0;
    t.stack.update(keys('down'));
    expect(t.sounds).toEqual([]);
    expect(t.state.rows).toEqual(['New Game']);
    t.stack.update(keys('confirm'));
    expect(t.stack.top).toBeInstanceOf(NameEntryState);
  });

  it('reads storage in enter(), once, never in the constructor', () => {
    const { store, calls } = saved();
    const t = title(store);
    expect(calls.get).toBe(0);
    t.stack.push(t.state);
    expect(calls.get).toBe(1);
  });
});
