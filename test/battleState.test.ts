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
import { spellLines } from '../src/game/menu/spellsState';
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
  const ends: { outcome: BattleOutcome; hp: number; inventory: typeof base.inventory }[] = [];
  const state = new BattleState(game, {
    monster: { ...MONSTER, ...monster },
    backdrop: 'grass',
    onEnd: (outcome) => ends.push({ outcome, hp: game.player.hp, inventory: game.player.inventory }),
  });
  stack.push(state);
  const fi = fakeInput();
  const tick = (...a: Action[]) => {
    fi.set(...a);
    stack.update(fi.input);
  };
  /** Move the command cursor to a row (tracked here) and confirm it. */
  let row = 0;
  const choose = (target: number) => {
    while (row !== target) {
      tick('down');
      row = (row + 1) % 4;
    }
    tick('confirm');
  };
  /** Every distinct text shown, in order, one entry per change. */
  const texts: string[] = [];
  const seen = () => {
    const t = state.text.join(' ');
    if (texts[texts.length - 1] !== t) texts.push(t);
  };
  return { game, stack, under, state, playSong, playSfx, ends, tick, choose, texts, seen };
}

type Setup = ReturnType<typeof setup>;

function toCommand(t: Setup): void {
  for (let i = 0; i < 2000 && t.state.phase !== 'command'; i++) pump(t.tick, i);
  expect(t.state.phase).toBe('command');
}

/** No input until the beats are over (a note or a round); returns the text left on screen. */
function settle(t: Setup): string {
  for (let i = 0; i < 2000 && t.state.phase === 'beats'; i++) t.tick();
  return t.state.text.join(' ');
}

/** Fight (row 0) whenever a command is asked for, mashing otherwise, until onEnd. */
function fightToEnd(t: Setup): void {
  for (let i = 0; i < 3000 && t.ends.length === 0; i++) {
    if (t.state.phase === 'command') t.choose(0);
    else pump(t.tick, i);
  }
}

/** Spy on `act` and note the hero's hp, to prove a note used no turn. */
function watchTurn(t: Setup) {
  const act = vi.spyOn(t.state.battle, 'act');
  const hp = t.state.battle.heroHp;
  return () => {
    expect(act).not.toHaveBeenCalled();
    expect(t.state.battle.heroHp).toBe(hp);
  };
}

const HERO3 = { level: 3, xp: 23, str: 7, agi: 6, maxHp: 24, maxMp: 5, hp: 5, mp: 5 };

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
    expect(ends.map((e) => ({ outcome: e.outcome, hp: e.hp }))).toEqual([{ outcome: 'lost', hp: 0 }]);
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
    tick('down');
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
    tick('down');
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

  describe('Spell and Item', () => {
    it('spellLines pads the name to ten and the cost to two', () => {
      expect(spellLines([SPELLS.heal, SPELLS.ember])).toEqual(['Heal       4', 'Ember      2']);
      expect(spellLines([])).toEqual(['Nothing']);
    });

    it('Spell with no spells says so and uses no turn', () => {
      const t = setup();
      const noTurn = watchTurn(t);
      toCommand(t);
      t.choose(1);
      expect(settle(t)).toBe('You know no spells.');
      noTurn();
      expect(t.playSfx).toHaveBeenCalledWith('error');
      expect(t.state.phase).toBe('command');
      expect(t.state.battle.monsterHp).toBe(20);
    });

    it('Cast Heal plays the spell and heal sounds and spends the MP', () => {
      const t = setup({ hp: 1, atk: 0, xp: 2 }, HERO3);
      toCommand(t);
      t.choose(1);
      expect(t.state.phase).toBe('spell');
      t.tick('confirm');
      expect(t.state.phase).toBe('beats');
      const played = (id: string) => t.playSfx.mock.calls.some((c) => c[0] === id);
      for (let i = 0; i < 400 && !played('heal'); i++) t.tick();
      expect(t.playSfx).toHaveBeenCalledWith('spell');
      expect(t.playSfx).toHaveBeenCalledWith('heal');
      expect(t.ends).toHaveLength(0);
      expect(t.state.stats[2]).toBe('MP   1');
      fightToEnd(t);
      expect(t.ends[0]?.outcome).toBe('won');
      expect(t.game.player.mp).toBe(1);
    });

    it('a refused spell uses no turn and no MP', () => {
      const full = setup({ atk: 0 }, { ...HERO3, hp: 24 });
      const fullNoTurn = watchTurn(full);
      toCommand(full);
      full.choose(1);
      full.tick('confirm');
      expect(settle(full)).toBe('You are not hurt.');
      expect(full.state.phase).toBe('command');
      expect(full.state.battle.heroMp).toBe(5);
      expect(full.state.battle.monsterHp).toBe(20);
      fullNoTurn();

      const dry = setup({ atk: 0 }, { ...HERO3, mp: 3 });
      const dryNoTurn = watchTurn(dry);
      toCommand(dry);
      dry.choose(1);
      dry.tick('confirm');
      expect(settle(dry)).toBe('Not enough MP.');
      expect(dry.state.phase).toBe('command');
      expect(dry.state.battle.heroMp).toBe(3);
      dryNoTurn();
    });

    it('accepting a spell plays no confirm blip, accepting an item does', () => {
      const spell = setup({ atk: 0 }, HERO3);
      toCommand(spell);
      spell.choose(1);
      const before = spell.playSfx.mock.calls.length;
      spell.tick('confirm');
      expect(spell.playSfx.mock.calls.slice(before).map((c) => c[0])).not.toContain('menuConfirm');

      const item = setup({ atk: 0 }, { hp: 3, inventory: [{ item: 'herb', count: 1 }] });
      toCommand(item);
      item.choose(2);
      const b2 = item.playSfx.mock.calls.length;
      item.tick('confirm');
      expect(item.playSfx.mock.calls.slice(b2).map((c) => c[0])).toContain('menuConfirm');
    });

    it('cancel leaves the spell list without acting', () => {
      const t = setup({ atk: 0 }, HERO3);
      const act = vi.spyOn(t.state.battle, 'act');
      toCommand(t);
      t.choose(1);
      expect(t.state.phase).toBe('spell');
      t.tick('cancel');
      expect(t.state.phase).toBe('command');
      expect(t.playSfx).toHaveBeenCalledWith('menuCancel');
      expect(act).not.toHaveBeenCalled();
    });

    it('a Herb used in a won fight is gone afterwards', () => {
      const t = setup({ hp: 1, atk: 0 }, { hp: 3, str: 50, inventory: [{ item: 'herb', count: 1 }] });
      toCommand(t);
      t.choose(2);
      expect(t.state.phase).toBe('item');
      t.tick('confirm');
      fightToEnd(t);
      expect(t.ends[0]?.outcome).toBe('won');
      expect(t.game.player.inventory.some((s) => s.item === 'herb')).toBe(false);
    });

    it('a Herb used in a lost fight is gone by the time onEnd runs', () => {
      // agi 0: the monster never moves first, so the Herb is used before the killing blow
      const t = setup({ atk: 100, agi: 0, hp: 999 }, { hp: 3, inventory: [{ item: 'herb', count: 1 }] });
      toCommand(t);
      t.choose(2);
      t.tick('confirm');
      fightToEnd(t); // the cursor goes back to Fight after the Herb
      expect(t.ends[0]?.outcome).toBe('lost');
      expect(t.ends[0]?.inventory.some((s) => s.item === 'herb')).toBe(false);
    });

    it('Item with nothing usable says so', () => {
      const t = setup({ atk: 0 }, { inventory: [{ item: 'torch', count: 1 }] });
      const noTurn = watchTurn(t);
      toCommand(t);
      t.choose(2);
      expect(settle(t)).toBe('You carry nothing to use.');
      noTurn();
      expect(t.state.phase).toBe('command');
    });

    it('level-up: the jingle waits for the fanfare, then the stat lines show', () => {
      const t = setup({ hp: 1, atk: 0, agi: 0, xp: 2 }, { xp: 5, hp: 9 });
      let victory = -1;
      let jingle = -1;
      let ended = -1;
      for (let i = 0; i < 3000 && t.ends.length === 0; i++) {
        t.tick('confirm');
        t.seen();
        if (t.ends.length > 0) ended = i;
        if (victory < 0 && t.playSong.mock.calls.some((c) => c[0] === SONGS.victory)) victory = i;
        if (jingle < 0 && t.playSong.mock.calls.some((c) => c[0] === SONGS.levelup)) jingle = i;
      }
      expect(t.ends[0]?.outcome).toBe('won');
      expect(t.playSong.mock.calls.filter((c) => c[0] === SONGS.victory)).toHaveLength(1);
      expect(t.playSong.mock.calls.filter((c) => c[0] === SONGS.levelup)).toHaveLength(1);
      expect(victory).toBeGreaterThanOrEqual(0);
      expect(jingle - victory).toBeGreaterThanOrEqual(144);
      expect(ended - jingle).toBeGreaterThanOrEqual(60); // the jingle's hold: 10 rows at tempo 150
      const order = ['You reach level 2.', 'Strength +1.', 'Max HP +7.'].map((x) => t.texts.indexOf(x));
      expect(order.every((i) => i >= 0)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      // whatever the draws, the level-up adds 7 to the hp the battle ended with
      expect(t.game.player).toMatchObject({ level: 2, xp: 7 });
      expect(t.game.player.hp).toBe(t.state.battle.heroHp + 7);
    });

    it('learning a spell is announced', () => {
      const t = setup({ hp: 1, atk: 0, xp: 2 }, { level: 2, xp: 22, str: 5, maxHp: 22, hp: 22 });
      for (let i = 0; i < 3000 && t.ends.length === 0; i++) {
        t.tick('confirm');
        t.seen();
      }
      expect(t.texts).toContain('You learned Heal!');
      expect(t.game.player).toMatchObject({ level: 3, mp: 5 });
    });
  });
});
