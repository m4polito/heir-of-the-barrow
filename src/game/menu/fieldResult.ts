import type { Game } from '../game';
import type { FieldResult } from '../fieldUse';
import { DialogState } from '../dialog/dialogState';
import { ExploreState } from '../explore';
import { TransitionState } from '../transition';

/** Show the outcome of a field spell or item: sound and message, and the fade home for a warp. */
export function showFieldResult(game: Game, result: FieldResult): void {
  const { audio, stack } = game;
  if (!result.ok) {
    audio.playSfx('error');
    stack.push(new DialogState(game, [result.text]));
    return;
  }
  game.player = result.player;
  audio.playSfx(result.sfx);
  if (result.dialog !== undefined) {
    const script = game.dialogs[result.dialog];
    if (!script) throw new Error(`Unknown dialog: ${result.dialog}`);
    stack.push(new DialogState(game, script));
    return;
  }
  const { home } = game.story;
  stack.push(
    new DialogState(game, [result.text], {
      onDone: result.warp
        ? () =>
            stack.push(
              new TransitionState(stack, {
                frames: 12,
                onMid: () => stack.reset(new ExploreState(game, home.map, home.entry)),
              }),
            )
        : undefined,
    }),
  );
}
