import type { Font } from '../engine/font';
import type { Input } from '../engine/input';
import type { Rng } from '../engine/rng';
import type { StateStack } from '../engine/state';
import type { SpriteCache } from '../engine/spriteCache';
import type { AudioManager } from '../engine/audio/audio';
import type { Song } from '../engine/audio/sequencer';
import type { DialogScript } from './dialog/script';
import type { GameMap } from './map';
import type { ItemDef } from './items';
import type { MonsterTable } from './battle/monster';
import type { SpellTable } from './effects';
import type { PlayerState } from './player';
import type { FieldCtx } from './fieldUse';
import type { ShopTable } from './shop';

export interface StoryConfig {
  title: string;
  subtitle: string;
  defaultHeroName: string;
  newGame: { map: string; entry: string };
  opening: { map: string; flag: string; dialog: string };
  /** Where the hero wakes after a lost battle, and what is said. */
  respawn: { map: string; entry: string; dialog: string };
  /** Where a warp spell carries the hero. */
  home: { map: string; entry: string };
  startingItems: { item: string; count: number }[];
  /** Prefix for browser storage keys (for example `<prefix>.mute`). */
  storagePrefix: string;
  /** Flag ids the dev-only debug overlay can toggle. */
  debugFlags: string[];
}

export interface Game {
  readonly stack: StateStack;
  readonly input: Input;
  readonly font: Font;
  readonly audio: AudioManager;
  readonly sprites: SpriteCache;
  readonly rng: Rng;
  readonly maps: Record<string, GameMap>;
  readonly dialogs: Record<string, DialogScript>;
  readonly songs: Record<string, Song>;
  readonly items: Record<string, ItemDef>;
  readonly monsters: MonsterTable;
  readonly spells: SpellTable;
  readonly shops: ShopTable;
  readonly story: StoryConfig;
  /** Browser storage for saves; absent where there is none. */
  readonly storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
  player: PlayerState;
  debug: { noEncounters: boolean };
  debugOpen?: () => void;
  /** Set by the map screen: facts about the current map that field items depend on. */
  fieldCtx?: () => FieldCtx;
}

export function createGame(
  deps: Omit<Game, 'player' | 'debug' | 'debugOpen' | 'fieldCtx'> & { player: PlayerState },
): Game {
  return { ...deps, debug: { noEncounters: false } };
}
