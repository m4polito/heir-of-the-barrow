import type { State } from '../../engine/state';
import type { Input } from '../../engine/input';
import { drawWindow } from '../../ui/window';
import { statusLines } from '../stats';
import type { Game } from '../game';

export class StatusState implements State {
  constructor(private readonly game: Game) {}

  update(input: Input): void {
    if (input.pressed('cancel')) {
      this.game.audio.playSfx('menuCancel');
      this.game.stack.pop();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawWindow(ctx, 8, 8, 128, 112);
    statusLines(this.game.items, this.game.player).forEach((line, i) => this.game.font.drawText(ctx, line, 16, 16 + i * 10));
  }
}
