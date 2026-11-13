import { describe, expect, it } from 'vitest';
import { StateStack } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import { AudioManager } from '../src/engine/audio/audio';
import { createRng } from '../src/engine/rng';
import { ExploreState } from '../src/game/explore';
import { createGame } from '../src/game/game';
import { createPlayer, setFlag } from '../src/game/player';
import { setupRoom, keys } from './helpers/exploreKit';
import { MAPS } from '../src/data/maps';
import { DIALOGS } from '../src/data/dialog/hollowmere';
import { ITEMS } from '../src/data/items';
import { SPELLS } from '../src/data/spells';
import { SHOPS } from '../src/data/shops';
import { MONSTERS } from '../src/data/monsters';
import { SONGS } from '../src/data/songs';
import { STORY } from '../src/data/story';

const lock = (e: ExploreState) => (e as unknown as { arrivalLock: boolean }).arrivalLock;
const setLock = (e: ExploreState, v: boolean) => void ((e as unknown as { arrivalLock: boolean }).arrivalLock = v);

function barrow(start: { map: string; x: number; y: number; facing: 'up' | 'down' } | null = null, maps: typeof MAPS = MAPS) {
  const stack = new StateStack();
  const sounds: string[] = [];
  const game = createGame({
    stack,
    input: {} as Input,
    font: { drawText: () => {} } as never,
    audio: new AudioManager(null),
    sprites: { get: () => ({}) } as never,
    rng: createRng(1),
    maps,
    dialogs: DIALOGS,
    songs: SONGS,
    items: ITEMS,
    spells: SPELLS,
    shops: SHOPS,
    monsters: MONSTERS,
    story: STORY,
    player: setFlag({ ...createPlayer(STORY.defaultHeroName, []), torch: 200 }, STORY.opening.flag),
  });
  game.audio.playSfx = (id: string) => void sounds.push(id);
  game.audio.playSong = () => {};
  game.audio.stopSong = () => {};
  game.debug.noEncounters = true;
  const explore = start
    ? new ExploreState(game, start.map, { x: start.x, y: start.y, facing: start.facing })
    : new ExploreState(game, 'barrow_1', 'stairs');
  stack.push(explore);
  const hold = (n: number, ...k: string[]) => {
    for (let i = 0; i < n; i++) stack.update(keys({ held: k }));
  };
  return { stack, sounds, explore, hold, count: (id: string) => sounds.filter((s) => s === id).length };
}

describe('holding a direction through a warp', () => {
  it('the Barrow stairs: one warp, no bounce, no bump', () => {
    const t = barrow();
    expect(t.explore.hero).toMatchObject({ x: 20, y: 3 });
    t.hold(240, 'up');
    expect(t.count('stairs')).toBe(1);
    expect(t.count('bump')).toBe(0);
    expect(t.explore.mapId).toBe('barrow_2');
    const arrive = MAPS.barrow_2!.entry.stairs!;
    expect(t.explore.hero).toMatchObject({ x: arrive.x, y: arrive.y });
  });

  it('release for one update, press again: the up-stair works', () => {
    const t = barrow();
    t.hold(240, 'up');
    expect(t.explore.mapId).toBe('barrow_2');
    t.stack.update(keys());
    expect(lock(t.explore)).toBe(false);
    t.hold(60, 'up');
    expect(t.explore.mapId).toBe('barrow_1');
    expect(t.count('stairs')).toBe(1);
    expect(t.count('stairsUp')).toBe(1);
  });

  it('leaving the elder house holding Down: house to town to the gate, two warps, no bump, no stop', () => {
    // The opening flag is set so the house's auto dialog does not fire and encounters are off. The town's
    // villagers are removed in a copy of the maps: Bram stands on the gate road at (12,18), a wanderer could block it.
    const maps = { ...MAPS, hollowmere: { ...MAPS.hollowmere!, npcs: [] } } as typeof MAPS;
    const t = barrow({ map: 'elder_house', x: 6, y: 7, facing: 'down' }, maps);
    // Held Down throughout, until the hero is in the marsh (past it the way may be blocked, which bumps).
    for (let i = 0; i < 600 && t.explore.mapId !== 'marsh'; i++) t.hold(1, 'down');
    expect(t.explore.mapId).toBe('marsh');
    expect(t.count('door')).toBe(2);
    expect(t.count('bump')).toBe(0);
  });

  it('with the lock set, a direction toward an ordinary tile walks normally', () => {
    const t = setupRoom({ pos: { x: 2, y: 2, facing: 'up' } });
    setLock(t.explore, true);
    t.hold(8, 'right');
    expect(t.explore.hero.x).toBe(3);
    expect(lock(t.explore)).toBe(true);
    expect(t.count('bump')).toBe(0);
  });

  const warpRoom = () => {
    const other = { ...setupRoom({}).room, id: 'other', entry: { in: { x: 1, y: 1, facing: 'down' as const } } };
    return setupRoom({
      triggers: [{ kind: 'warp', x: 3, y: 1, to: 'other', entry: 'in' }],
      pos: { x: 3, y: 2, facing: 'up' },
      extraMaps: { other },
    });
  };

  it('lock set, one completed step, then held toward a warp tile: the warp is taken', () => {
    const t = warpRoom();
    t.explore.hero.x = 2; // one tile left of the column of the warp
    setLock(t.explore, true);
    t.hold(8, 'right'); // a step onto (3,2), an ordinary tile, runs to its last frame
    expect(lock(t.explore)).toBe(true);
    t.hold(30, 'up'); // it completes, clearing the lock, and the hero walks onto the warp tile
    expect(t.sounds).toContain('door');
  });

  it('lock set, held toward a warp tile: the hero turns, stays and nothing sounds', () => {
    const t = warpRoom();
    t.explore.hero.facing = 'down';
    setLock(t.explore, true);
    t.hold(60, 'up');
    expect(t.explore.hero).toMatchObject({ x: 3, y: 2 });
    expect(t.explore.hero.facing).toBe('up');
    expect(t.sounds).not.toContain('bump');
    expect(t.sounds).not.toContain('door');
    expect(t.stack.top).toBe(t.explore);
    t.idle(1);
    expect(lock(t.explore)).toBe(false);
    t.hold(12, 'up');
    expect(t.sounds).toContain('door');
  });

  it('lock set, held toward a wall: the bump still plays', () => {
    const t = setupRoom({ pos: { x: 1, y: 1, facing: 'left' } });
    setLock(t.explore, true);
    t.hold(2, 'left');
    expect(t.count('bump')).toBe(1);
  });

  it('a fresh screen (Continue, respawn) has no lock and enters a warp at once', () => {
    const t = warpRoom();
    expect(lock(t.explore)).toBe(false);
    t.hold(12, 'up');
    expect(t.sounds).toContain('door');
    expect(t.sounds).not.toContain('bump');
  });
});
