import { describe, it, expect, vi } from 'vitest';
import { StateStack, type State } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import type { Action } from '../src/engine/constants';
import type { Font } from '../src/engine/font';
import { AudioManager } from '../src/engine/audio/audio';
import { SpriteCache } from '../src/engine/spriteCache';
import { createRng } from '../src/engine/rng';
import { createGame } from '../src/game/game';
import { createPlayer } from '../src/game/player';
import { BattleState, battleStatLines } from '../src/game/battle/battleState';
import type { BattleOutcome } from '../src/game/battle/battle';
import type { MonsterDef } from '../src/game/battle/monster';
import { MONSTERS } from '../src/data/monsters';
import { ITEMS } from '../src/data/items';
import { SPELLS } from '../src/data/spells';
import { MAPS } from '../src/data/maps';
import { DIALOGS } from '../src/data/dialog/hollowmere';
import { SONGS } from '../src/data/songs';
import { STORY } from '../src/data/story';
import { PALETTE } from '../src/data/palette';

function fakeInput() {
  let down = new Set<Action>();
  const input = {
    pressed: (a: Action) => down.has(a),
    repeat: (a: Action) => down.has(a),
    held: (a: Action) => down.has(a),
    rearm: () => {},
  } as unknown as Input;
  return {
    input,
    set: (...a: Action[]) => {
      down = new Set(a);
    },
  };
}

const MONSTER: MonsterDef = {
  id: 'testling',
  name: 'Testling',
  intro: 'A Testling appears.',
  sprite: 'mireling',
  palette: 0,
  hp: 20,
  atk: 1,
  def: 0,
  agi: 1,
  xp: 5,
  gold: [3, 3],
  dodge: 0,
  runFactor: 1,
};

function setup(monster: Partial<MonsterDef> = {}, player: Partial<ReturnType<typeof createPlayer>> = {}) {
  const stack = new StateStack();
  const base = createPlayer(STORY.defaultHeroName, STORY.startingItems);
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
    player: { ...base, ...player },
  });
  const under: State = { update: () => {}, render: () => {} };
  stack.push(under);
  const playSong = vi.spyOn(game.audio, 'playSong');
  const playSfx = vi.spyOn(game.audio, 'playSfx');
  const ends: { outcome: BattleOutcome; hp: number }[] = [];
  const state = new BattleState(game, {
    monster: { ...MONSTER, ...monster },
    backdrop: 'grass',
    onEnd: (outcome) => ends.push({ outcome, hp: game.player.hp }),
  });
  stack.push(state);
  const fi = fakeInput();
  const tick = (...a: Action[]) => {
    fi.set(...a);
    stack.update(fi.input);
  };
  return { game, stack, under, state, playSong, playSfx, ends, tick };
}

/** Confirm every third tick, otherwise no input. */
function pump(tick: (...a: Action[]) => void, i: number): void {
  if (i % 3 === 0) tick('confirm');
  else tick();
}

describe('battleStatLines', () => {
  it('pads hp and mp to three', () => {
    expect(battleStatLines('Wren', 15, 0)).toEqual(['Wren', 'HP  15', 'MP   0']);
  });
});

describe('BattleState', () => {
  it('starts the battle song on enter', () => {
    const { playSong } = setup();
    expect(playSong).toHaveBeenCalledWith(SONGS.battle);
  });

  it('one press does one thing', () => {
    const { state, tick } = setup();
    for (let i = 0; i < 25; i++) tick(); // intro fully revealed, still holding
    expect(state.phase).toBe('beats');
    tick('confirm');
    for (let i = 0; i < 5; i++) tick();
    expect(state.phase).toBe('command');
    expect(state.battle.monsterHp).toBe(20);
  });

  it('won: pays out, plays victory, leaves the stack as it was', () => {
    const { game, stack, under, ends, playSong, tick } = setup({ hp: 1 }, { str: 50, hp: 15 });
    const gold = game.player.gold;
    const xp = game.player.xp;
    for (let i = 0; i < 2000 && ends.length === 0; i++) pump(tick, i);
    for (let i = 0; i < 100; i++) tick();
    expect(ends.map((e) => e.outcome)).toEqual(['won']);
    expect(playSong.mock.calls.filter((c) => c[0] === SONGS.victory)).toHaveLength(1);
    expect(game.player.gold).toBe(gold + 3);
    expect(game.player.xp).toBe(xp + MONSTER.xp);
    expect(stack.states).toEqual([under]);
  });

  it('lost: hp is settled to 0 before onEnd and the fallen song plays', () => {
    const { game, stack, under, ends, playSong, tick } = setup({ atk: 100, agi: 99, hp: 999 }, { hp: 1 });
    for (let i = 0; i < 2000 && ends.length === 0; i++) pump(tick, i);
    for (let i = 0; i < 100; i++) tick();
    expect(ends).toEqual([{ outcome: 'lost', hp: 0 }]);
    expect(game.player.hp).toBe(0);
    expect(playSong.mock.calls.filter((c) => c[0] === SONGS.fallen)).toHaveLength(1);
    expect(stack.states).toEqual([under]);
  });

  it('fled: Run succeeds against a slow monster and pays nothing', () => {
    const { game, ends, playSfx, state, tick } = setup({ agi: 1 }, { agi: 99 });
    const gold = game.player.gold;
    const xp = game.player.xp;
    for (let i = 0; i < 2000 && state.phase !== 'command'; i++) pump(tick, i);
    tick('down');
    tick('confirm');
    for (let i = 0; i < 2000 && ends.length === 0; i++) pump(tick, i);
    for (let i = 0; i < 100; i++) tick();
    expect(ends.map((e) => e.outcome)).toEqual(['fled']);
    expect(game.player.gold).toBe(gold);
    expect(game.player.xp).toBe(xp);
    expect(playSfx).toHaveBeenCalledWith('runOk');
  });

  it('Run does not play the confirm blip over its own sound', () => {
    const { playSfx, state, tick } = setup({ agi: 1 }, { agi: 99 });
    for (let i = 0; i < 2000 && state.phase !== 'command'; i++) pump(tick, i);
    tick('down');
    const before = playSfx.mock.calls.length;
    tick('confirm');
    for (let i = 0; i < 10; i++) tick();
    const after = playSfx.mock.calls.slice(before).map((c) => c[0]);
    expect(after).not.toContain('menuConfirm');
    expect(after.some((s) => s === 'runOk' || s === 'runFail')).toBe(true);
  });

  /** Confirm on every tick; returns the tick a song first started and the tick onEnd ran. */
  function holdRun(songId: 'victory' | 'fallen', monster: Partial<MonsterDef>, player: Parameters<typeof setup>[1]) {
    const t = setup(monster, player);
    const song = SONGS[songId];
    let started = -1;
    let ended = -1;
    for (let i = 0; i < 3000 && ended < 0; i++) {
      t.tick('confirm');
      if (started < 0 && t.playSong.mock.calls.some((c) => c[0] === song)) started = i;
      if (t.ends.length > 0) ended = i;
    }
    return { ...t, song, started, ended };
  }

  it('lost: a prompt confirm cannot cut the fallen phrase short', () => {
    const r = holdRun('fallen', { atk: 100, agi: 99, hp: 999 }, { hp: 1 });
    expect(r.started).toBeGreaterThanOrEqual(0);
    expect(r.ended).toBeGreaterThanOrEqual(0);
    expect(r.ended - r.started).toBeGreaterThanOrEqual(150);
    expect(r.playSong.mock.calls.filter((c) => c[0] === SONGS.fallen)).toHaveLength(1);
  });

  it('won: a prompt confirm cannot cut the victory fanfare short', () => {
    const r = holdRun('victory', { hp: 1 }, { str: 50, hp: 15 });
    expect(r.started).toBeGreaterThanOrEqual(0);
    expect(r.ended).toBeGreaterThanOrEqual(0);
    expect(r.ended - r.started).toBeGreaterThanOrEqual(144);
  });

  it('plays hit sounds for blows on each side', () => {
    const a = setup({ atk: 100, agi: 1, hp: 999 }, { hp: 1000, maxHp: 1000, str: 50 });
    for (let i = 0; i < 3000 && !a.playSfx.mock.calls.some((c) => c[0] === 'heroHit'); i++) {
      pump(a.tick, i);
    }
    expect(a.playSfx).toHaveBeenCalledWith('heroHit');
    const b = setup({ hp: 999 }, { str: 50 });
    for (let i = 0; i < 3000 && !b.playSfx.mock.calls.some((c) => c[0] === 'monsterHit'); i++) {
      pump(b.tick, i);
    }
    expect(b.playSfx).toHaveBeenCalledWith('monsterHit');
  });
});
