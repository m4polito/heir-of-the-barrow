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
import type { PlayerState } from './player';

export interface StoryConfig {
  title: string;
  subtitle: string;
  defaultHeroName: string;
  newGame: { map: string; entry: string };
  opening: { map: string; flag: string; dialog: string };
  startingItems: { item: string; count: number }[];
  /** Prefix for browser storage keys (for example `<prefix>.mute`). */
  storagePrefix: string;
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
  readonly story: StoryConfig;
  player: PlayerState;
  debug: { noEncounters: boolean };
  debugOpen?: () => void;
}

export function createGame(
  deps: Omit<Game, 'player' | 'debug' | 'debugOpen'> & { player: PlayerState },
): Game {
  return { ...deps, debug: { noEncounters: false } };
}
