import { StateStack } from '../../src/engine/state';
import type { Input } from '../../src/engine/input';
import type { Font } from '../../src/engine/font';
import { AudioManager } from '../../src/engine/audio/audio';
import type { PixelArt } from '../../src/engine/pixels';
import { createRng } from '../../src/engine/rng';
import { ExploreState } from '../../src/game/explore';
import { createGame } from '../../src/game/game';
import { createPlayer, type PlayerState } from '../../src/game/player';
import { parseAsciiMap, type GameMap, type Trigger, type NpcPlacement } from '../../src/game/map';
import type { DialogScript } from '../../src/game/dialog/script';
import type { Dir } from '../../src/engine/constants';
import { ITEMS } from '../../src/data/items';
import { SPELLS } from '../../src/data/spells';
import { SHOPS } from '../../src/data/shops';
import { MONSTERS } from '../../src/data/monsters';
import { SONGS } from '../../src/data/songs';
import { STORY } from '../../src/data/story';
import { TILE_IDS } from '../../src/data/tiles';

const drawn: string[] = [];
const font = { drawText: (_c: unknown, t: string) => drawn.push(t) } as unknown as Font;
const ctx = new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D;

export interface Keys {
  held?: string[];
  pressed?: string[];
}

export const keys = ({ held = [], pressed = [] }: Keys = {}) =>
  ({
    held: (a: string) => held.includes(a),
    pressed: (a: string) => pressed.includes(a),
    repeat: (a: string) => pressed.includes(a),
    rearm: () => {},
  }) as unknown as Input;

/**
 * A 7x6 room: a chest at (2,1), water at (1,3), walls round the edge.
 *   #######
 *   #fcfff#
 *   #fffff#
 *   #~ffff#
 *   #fffff#
 *   #######
 */
const ROWS = ['#######', '#fcfff#', '#fffff#', '#~ffff#', '#fffff#', '#######'];
const LEGEND = {
  '#': TILE_IDS.barrowWall,
  f: TILE_IDS.barrowFloor,
  c: TILE_IDS.chest,
  '~': TILE_IDS.water,
};

export function roomMap(triggers: Trigger[], npcs: NpcPlacement[] = []): GameMap {
  return {
    id: 'room',
    ...parseAsciiMap(ROWS, LEGEND),
    music: 'marsh',
    entry: {},
    npcs,
    triggers,
  };
}

export function setupRoom(opts: {
  triggers?: Trigger[];
  npcs?: NpcPlacement[];
  pos?: { x: number; y: number; facing: Dir };
  patch?: Partial<PlayerState>;
  dialogs?: Record<string, DialogScript>;
  extraMaps?: Record<string, GameMap>;
  sprites?: { get(art: PixelArt): unknown };
}) {
  const stack = new StateStack();
  const sounds: string[] = [];
  const room = roomMap(opts.triggers ?? [], opts.npcs);
  const game = createGame({
    stack,
    input: {} as Input,
    font,
    audio: new AudioManager(null),
    sprites: (opts.sprites ?? { get: () => ({}) }) as never,
    rng: createRng(1),
    maps: { room, ...(opts.extraMaps ?? {}) },
    dialogs: opts.dialogs ?? {},
    songs: SONGS,
    items: ITEMS,
    spells: SPELLS,
    shops: SHOPS,
    monsters: MONSTERS,
    story: STORY,
    player: { ...createPlayer(STORY.defaultHeroName, []), ...opts.patch },
  });
  game.audio.playSfx = (id: string) => void sounds.push(id);
  game.audio.playSong = () => {};
  game.audio.stopSong = () => {};
  const explore = new ExploreState(game, 'room', opts.pos ?? { x: 2, y: 2, facing: 'up' });
  stack.push(explore);
  const press = (...k: string[]) => stack.update(keys({ pressed: k }));
  const hold = (n: number, ...k: string[]) => {
    for (let i = 0; i < n; i++) stack.update(keys({ held: k }));
  };
  const idle = (n = 200) => {
    for (let i = 0; i < n; i++) stack.update(keys());
  };
  /** The text the top state shows right now. */
  const shown = () => {
    drawn.length = 0;
    stack.top!.render(ctx, 1);
    return drawn.filter((t) => !['▶', '▼', 'Yes', 'No'].includes(t)).join(' ');
  };
  const count = (id: string) => sounds.filter((s) => s === id).length;
  return { stack, game, explore, sounds, press, hold, idle, shown, count, ctx, room };
}
