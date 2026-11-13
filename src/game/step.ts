import type { Input } from '../engine/input';
import { ExploreState } from './explore';
import type { Game } from './game';
import { tickPlayTime } from './playTime';

/**
 * A game is in progress while the map screen is on the stack, under any dialog, menu, shop,
 * battle or fade. The title screen and name entry have none; every screen that changes map
 * resets the stack to a new map screen in one step, so this never lapses mid-game.
 */
export function inProgress(game: Game): boolean {
  return game.stack.states.some((s) => s instanceof ExploreState);
}

/** One fixed update step: play time ticks once, then the top state updates. */
export function stepGame(game: Game, input: Input): void {
  if (inProgress(game)) game.player = tickPlayTime(game.player);
  game.stack.update(input);
}
