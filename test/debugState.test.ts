import { MONSTERS } from '../src/data/monsters';
import { ITEMS } from '../src/data/items';
import { SPELLS } from '../src/data/spells';
import { SHOPS } from '../src/data/shops';
import { describe, expect, it, vi } from 'vitest';
import { itemLines } from '../src/game/inventory';
import { StateStack } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import type { Font } from '../src/engine/font';
import { AudioManager } from '../src/engine/audio/audio';
import { SpriteCache } from '../src/engine/spriteCache';
import { createRng } from '../src/engine/rng';
import { ExploreState } from '../src/game/explore';
import { TransitionState } from '../src/game/transition';
import { BattleState } from '../src/game/battle/battleState';
import { createGame } from '../src/game/game';
import { createPlayer } from '../src/game/player';
import { DebugState, installDebug } from '../src/game/debug';
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
    items: ITEMS,
    spells: SPELLS,
    shops: SHOPS,
    monsters: MONSTERS,
    story: STORY,
    player: createPlayer(STORY.defaultHeroName, STORY.startingItems),
  });
  stack.push(new ExploreState(game, STORY.newGame.map, STORY.newGame.entry));
  const dbg = new DebugState(game);
  stack.push(dbg);
  return { stack, game, dbg };
}

const keys = (...down: string[]) =>
  ({
    held: () => false,
    pressed: (a: string) => down.includes(a),
    repeat: (a: string) => down.includes(a),
    rearm: () => {},
  }) as unknown as Input;

function pick(dbg: DebugState, row: number): void {
  // cursor wraps; go down `row` times from the top, then confirm
  for (let i = 0; i < row; i++) dbg.update(keys('down'));
  dbg.update(keys('confirm'));
}

describe('DebugState', () => {
  it('Level +1 raises the level, clamped at 10', () => {
    const { game, dbg } = setup();
    dbg.update(keys('confirm'));
    expect(game.player.level).toBe(2);
    game.player = { ...game.player, level: 10 };
    dbg.update(keys('confirm'));
    expect(game.player.level).toBe(10);
  });

  it('Level -1 lowers the level, clamped at 1', () => {
    const { game, dbg } = setup();
    dbg.update(keys('confirm')); // 2
    dbg.update(keys('down'));
    dbg.update(keys('confirm'));
    expect(game.player.level).toBe(1);
    dbg.update(keys('confirm'));
    expect(game.player.level).toBe(1);
  });

  it('Gold +100 adds gold', () => {
    const { game, dbg } = setup();
    const before = game.player.gold;
    pick(dbg, 2);
    expect(game.player.gold).toBe(before + 100);
  });

  it('Encounters row toggles noEncounters', () => {
    const { game, dbg } = setup();
    pick(dbg, 4);
    expect(game.debug.noEncounters).toBe(true);
    dbg.update(keys('confirm'));
    expect(game.debug.noEncounters).toBe(false);
  });

  it('Full heal restores hp and mp', () => {
    const { game, dbg } = setup();
    game.player = { ...game.player, hp: 1, mp: 0 };
    pick(dbg, 5);
    expect(game.player.hp).toBe(game.player.maxHp);
    expect(game.player.mp).toBe(game.player.maxMp);
  });

  it('a warp entry resets the stack to one ExploreState on that map', () => {
    const { stack, game, dbg } = setup();
    const ids = Object.keys(game.maps);
    const target = ids[ids.length - 1]!;
    pick(dbg, 6 + ids.length - 1);
    expect(stack.top).toBeInstanceOf(ExploreState);
    expect((stack.top as ExploreState).mapId).toBe(target);
    stack.pop();
    expect(stack.top).toBeUndefined();
  });

  it('lists one Fight row per monster, between the warp rows and the Give rows', () => {
    const { dbg } = setup();
    const labels = (dbg as unknown as { labels(): string[] }).labels();
    const lastWarp = labels.map((l) => l.startsWith('Warp: ')).lastIndexOf(true);
    const firstGive = labels.findIndex((l) => l.startsWith('Give: '));
    const close = labels.indexOf('Close');
    expect(labels.slice(lastWarp + 1, firstGive)).toEqual(Object.keys(MONSTERS).map((id) => `Fight: ${id}`));
    for (const id of ['mireling', 'bog_mireling', 'barrow_mireling']) expect(labels).toContain(`Fight: ${id}`);
    expect(close).toBe(labels.length - 1);
  });

  it('a Fight row closes the overlay and starts that battle over explore', () => {
    const { stack, game, dbg } = setup();
    const labels = (dbg as unknown as { labels(): string[] }).labels();
    pick(dbg, labels.indexOf('Fight: barrow_mireling'));
    expect(stack.states.includes(dbg)).toBe(false);
    expect(stack.top).toBeInstanceOf(TransitionState);
    for (let i = 0; i < 30; i++) stack.update(keys());
    const battle = stack.states.find((s) => s instanceof BattleState) as BattleState;
    expect(battle.battle.monster.id).toBe('barrow_mireling');
    expect(game.monsters.barrow_mireling).toBeDefined();
  });

  it('lists one Give row per item, between the Fight rows and Close', () => {
    const { dbg } = setup();
    const labels = (dbg as unknown as { labels(): string[] }).labels();
    const lastFight = labels.map((l) => l.startsWith('Fight: ')).lastIndexOf(true);
    const close = labels.indexOf('Close');
    expect(labels.slice(lastFight + 1, close)).toEqual(Object.keys(ITEMS).map((id) => `Give: ${id}`));
    expect(labels).toContain('Give: herb');
  });

  it('a Give row adds one item each time and keeps the overlay open', () => {
    const { stack, game, dbg } = setup();
    const labels = (dbg as unknown as { labels(): string[] }).labels();
    const row = labels.indexOf('Give: herb');
    pick(dbg, row);
    dbg.update(keys('confirm'));
    expect(itemLines(game.items, game.player)).toEqual(['Herb x3']);
    expect(stack.top).toBe(dbg);
  });

  it('a Give row that does not fit plays error and changes nothing', () => {
    const { game, dbg } = setup();
    const ids = Object.keys(game.items).filter((id) => game.items[id]!.kind !== 'consumable');
    game.player = { ...game.player, inventory: Array.from({ length: 8 }, (_, i) => ({ item: ids[i % ids.length]!, count: 1 })) };
    const before = game.player.inventory;
    const sfx = vi.spyOn(game.audio, 'playSfx');
    const labels = (dbg as unknown as { labels(): string[] }).labels();
    pick(dbg, labels.indexOf('Give: herb'));
    expect(sfx).toHaveBeenCalledWith('error');
    expect(game.player.inventory).toEqual(before);
  });

  it('Close and cancel pop back to explore', () => {
    const a = setup();
    a.dbg.update(keys('cancel'));
    expect(a.stack.top).toBeInstanceOf(ExploreState);
    const b = setup();
    pick(b.dbg, 6 + Object.keys(b.game.maps).length + Object.keys(b.game.monsters).length + Object.keys(b.game.items).length);
    expect(b.stack.top).toBeInstanceOf(ExploreState);
  });

  it('every row, including the last, is reachable', () => {
    const { dbg } = setup();
    const n = 7 + Object.keys(MAPS).length + Object.keys(MONSTERS).length + Object.keys(ITEMS).length;
    for (let i = 0; i < n - 1; i++) dbg.update(keys('down'));
    // (list is private; reaching Close above proves the last row is addressable)
    expect(() => dbg.update(keys('confirm'))).not.toThrow();
  });

  it('installDebug sets game.debugOpen, which pushes a DebugState', () => {
    const { stack, game } = setup();
    stack.pop();
    expect(game.debugOpen).toBeUndefined();
    installDebug(game);
    game.debugOpen!();
    expect(stack.top).toBeInstanceOf(DebugState);
  });
});
