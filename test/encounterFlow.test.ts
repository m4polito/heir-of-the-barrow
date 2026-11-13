import { describe, it, expect, vi } from 'vitest';
import { StateStack } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import type { Action } from '../src/engine/constants';
import type { Font } from '../src/engine/font';
import { AudioManager } from '../src/engine/audio/audio';
import { SpriteCache } from '../src/engine/spriteCache';
import { createRng } from '../src/engine/rng';
import { createGame } from '../src/game/game';
import { createPlayer, setFlag, type PlayerState } from '../src/game/player';
import { ExploreState } from '../src/game/explore';
import { TransitionState } from '../src/game/transition';
import { DialogState } from '../src/game/dialog/dialogState';
import { BattleState } from '../src/game/battle/battleState';
import type { MonsterDef } from '../src/game/battle/monster';
import type { GameMap } from '../src/game/map';
import { TILE_IDS } from '../src/data/tiles';
import { MAPS } from '../src/data/maps';
import { DIALOGS } from '../src/data/dialog/hollowmere';
import { SONGS } from '../src/data/songs';
import { STORY } from '../src/data/story';
import { ITEMS } from '../src/data/items';
import { SPELLS } from '../src/data/spells';
import { SHOPS } from '../src/data/shops';
import { PALETTE } from '../src/data/palette';

function fieldMap(id: string, warp: boolean): GameMap {
  return {
    id,
    width: 8,
    height: 3,
    tiles: new Array<number>(24).fill(TILE_IDS.grass),
    music: 'marsh',
    entry: { start: { x: 0, y: 1, facing: 'right' } },
    npcs: [],
    triggers: warp ? [{ kind: 'warp', x: 4, y: 1, to: 'field2', entry: 'start' }] : [],
    encounters: {
      baseRate: 1,
      zones: { grass: { backdrop: 'grass', monsters: [{ monster: 'weak', weight: 1 }] } },
    },
  };
}

const base = {
  name: 'x',
  sprite: 'mireling',
  palette: 0,
  intro: 'It appears.',
  def: 0,
  dodge: 0,
  runFactor: 1,
};
const MONSTER_TABLE: Record<string, MonsterDef> = {
  weak: { ...base, id: 'weak', hp: 1, atk: 0, agi: 1, gold: [3, 3], xp: 2 },
  meek: { ...base, id: 'meek', hp: 99, atk: 0, agi: 1, runFactor: 0, gold: [7, 7], xp: 9 },
  brute: { ...base, id: 'brute', hp: 99, atk: 100, agi: 99, gold: [3, 3], xp: 2 },
};

function setup(mapId: 'field' | 'field2', player: Partial<PlayerState> = {},
  monsters: Record<string, MonsterDef> = MONSTER_TABLE,
) {
  const stack = new StateStack();
  const basePlayer = setFlag(createPlayer(STORY.defaultHeroName, STORY.startingItems), STORY.opening.flag);
  const game = createGame({
    stack,
    input: {} as Input,
    font: {} as Font,
    audio: new AudioManager(null),
    sprites: new SpriteCache(PALETTE),
    rng: createRng(1),
    maps: { ...MAPS, field: fieldMap('field', true), field2: fieldMap('field2', false) },
    dialogs: DIALOGS,
    songs: SONGS,
    items: ITEMS,
    spells: SPELLS,
    shops: SHOPS,
    monsters,
    story: STORY,
    player: { ...basePlayer, ...player },
  });
  const explore = new ExploreState(game, mapId, 'start');
  stack.push(explore);
  const playSong = vi.spyOn(game.audio, 'playSong');
  const stopSong = vi.spyOn(game.audio, 'stopSong');
  const playSfx = vi.spyOn(game.audio, 'playSfx');
  let down = new Set<Action>();
  const input = {
    pressed: (a: Action) => down.has(a),
    repeat: (a: Action) => down.has(a),
    held: (a: Action) => down.has(a),
    rearm: () => {},
  } as unknown as Input;
  const tick = (...a: Action[]) => {
    down = new Set(a);
    stack.update(input);
  };
  const ticks = (n: number, ...a: Action[]) => {
    for (let i = 0; i < n; i++) tick(...a);
  };
  /** Confirm on every third update, otherwise nothing, until `done` or the bound. */
  const mash = (done: () => boolean, bound = 3000) => {
    for (let i = 0; i < bound && !done(); i++) {
      if (i % 3 === 0) tick('confirm');
      else tick();
    }
    expect(done()).toBe(true);
  };
  const hasBattle = () => stack.states.some((s) => s instanceof BattleState);
  return { stack, game, explore, playSong, stopSong, playSfx, tick, ticks, mash, hasBattle };
}

describe('random encounters', () => {
  it('start after the grace steps, with a fade into the battle', () => {
    const { stack, explore, stopSong, playSfx, ticks, hasBattle } = setup('field2');
    ticks(32, 'right'); // three completed steps; the fourth is under way
    expect(stack.top).toBe(explore);
    expect(hasBattle()).toBe(false);
    ticks(1, 'right'); // fourth step completed
    expect(stack.top).toBeInstanceOf(TransitionState);
    expect(playSfx.mock.calls.filter((c) => c[0] === 'bump')).toHaveLength(0);
    expect(stopSong).toHaveBeenCalledTimes(1);
    expect(playSfx.mock.calls.filter((c) => c[0] === 'encounter')).toHaveLength(1);
    expect(hasBattle()).toBe(false);
    ticks(30, 'right');
    expect(hasBattle()).toBe(true);
    expect(explore.hero.x).toBe(4);
    expect(explore.hero.stepFrame).toBe(0);
  });

  it('never start while encounters are off', () => {
    const { stack, game, explore, ticks } = setup('field2');
    game.debug.noEncounters = true;
    for (let i = 0; i < 57; i++) {
      ticks(1, 'right');
      expect(stack.states).toEqual([explore]);
    }
  });

  it('a warp on the arrival tile wins, and entering a map resets the grace', () => {
    const { stack, explore, ticks, hasBattle } = setup('field');
    for (let i = 0; i < 33 + 24; i++) {
      ticks(1, 'right');
      expect(hasBattle()).toBe(false);
    }
    expect(explore.mapId).toBe('field2');
    expect(stack.states).toEqual([explore]);
    for (let i = 0; i < 32; i++) {
      ticks(1, 'right');
      expect(stack.states).toEqual([explore]);
    }
    ticks(1, 'right');
    expect(stack.top).toBeInstanceOf(TransitionState);
  });

  /** Walk right until the fourth step starts a battle, then let the fade finish. */
  function walkIntoBattle(t: ReturnType<typeof setup>): void {
    t.ticks(33, 'right');
    expect(t.stack.top).toBeInstanceOf(TransitionState);
    t.ticks(30, 'right');
    expect(t.hasBattle()).toBe(true);
  }

  /** Three steps back the way we came start nothing; the fourth does. */
  function expectGraceRestarted(t: ReturnType<typeof setup>): void {
    t.ticks(32, 'left');
    expect(t.stack.states).toEqual([t.explore]);
    t.ticks(1, 'left');
    expect(t.stack.top).toBeInstanceOf(TransitionState);
  }

  it('a won battle pays out, replays the map song and restarts the grace', () => {
    const t = setup('field2', { str: 50 });
    const { stack, game, explore, playSong, mash } = t;
    const gold = game.player.gold;
    const xp = game.player.xp;
    walkIntoBattle(t);
    mash(() => stack.top === explore);
    expect(game.player.gold).toBe(gold + 3);
    expect(game.player.xp).toBe(xp + 2);
    expect(playSong.mock.lastCall?.[0]).toBe(SONGS.marsh);
    expectGraceRestarted(t);
  });

  it('a fled battle changes nothing, replays the map song and restarts the grace', () => {
    // 'meek' can never stop the hero running; it stands in for the map's 'weak'
    const t = setup('field2', {}, { ...MONSTER_TABLE, weak: MONSTER_TABLE.meek! });
    const { stack, game, explore, playSong, tick, mash } = t;
    const gold = game.player.gold;
    const xp = game.player.xp;
    walkIntoBattle(t);
    const battle = stack.states.find((s) => s instanceof BattleState) as BattleState;
    mash(() => battle.phase === 'command', 600);
    tick('down');
    tick('down');
    tick('down');
    mash(() => stack.top === explore);
    expect(game.player.gold).toBe(gold);
    expect(game.player.xp).toBe(xp);
    expect(playSong.mock.lastCall?.[0]).toBe(SONGS.marsh);
    expectGraceRestarted(t);
  });
});

describe('death and respawn', () => {
  for (const [before, after] of [
    [41, 20],
    [1, 0],
  ] as const) {
    it(`wakes at the respawn point with ${after} gold from ${before}`, () => {
      // a brute that never moves first, so the Herb is used before the killing blow
      const monsters = { ...MONSTER_TABLE, brute: { ...MONSTER_TABLE.brute!, agi: 0 } };
      const { stack, game, explore, tick, ticks, mash, hasBattle } = setup(
        'field2',
        {
          gold: before,
          hp: 1,
          inventory: [
            { item: 'herb', count: 1 },
            { item: 'torch', count: 1 },
          ],
        },
        monsters,
      );
      const was = game.player;
      explore.startBattle('brute', 'grass');
      mash(hasBattle, 600);
      const battle = stack.states.find((s) => s instanceof BattleState) as BattleState;
      mash(() => battle.phase === 'command', 600);
      tick('down');
      tick('down');
      tick('confirm'); // Item
      tick('confirm'); // Herb
      tick('up');
      tick('up'); // back to Fight, so the mashing below always progresses
      mash(() => stack.states.length === 1 && stack.top instanceof ExploreState && stack.top !== explore);
      const woke = stack.top as ExploreState;
      const entry = MAPS[STORY.respawn.map as keyof typeof MAPS].entry[STORY.respawn.entry]!;
      expect(woke.mapId).toBe(STORY.respawn.map);
      expect(woke.hero).toMatchObject({ x: entry.x, y: entry.y, facing: entry.facing });
      expect(game.player.gold).toBe(after);
      expect(game.player.hp).toBe(was.maxHp);
      expect(game.player.mp).toBe(was.maxMp);
      expect(game.player.xp).toBe(was.xp);
      expect(game.player.inventory).toEqual([{ item: 'torch', count: 1 }]);
      expect(game.player.flags).toEqual(was.flags);

      tick();
      expect(stack.top).toBeInstanceOf(DialogState);
      mash(() => stack.top === woke, 500);
      let seen = false;
      for (let i = 0; i < 100; i++) {
        ticks(1);
        if (stack.states.some((s) => s instanceof DialogState)) seen = true;
      }
      expect(seen).toBe(false);
    });
  }
});

describe('guards', () => {
  it('startBattle rejects an unknown monster', () => {
    const { explore } = setup('field2');
    expect(() => explore.startBattle('nope', 'grass')).toThrow('Unknown monster: nope');
  });

  it('startBattle rejects an unknown backdrop and pushes nothing', () => {
    const { stack, explore } = setup('field2');
    expect(() => explore.startBattle('weak', 'nope')).toThrow('Unknown backdrop: nope');
    expect(stack.states).toEqual([explore]);
  });

  it('the constructor rejects an unknown dialog', () => {
    const { game } = setup('field2');
    expect(() => new ExploreState(game, 'field', 'start', { dialog: 'nope' })).toThrow('Unknown dialog: nope');
  });
});
