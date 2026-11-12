import { LOGICAL_W, LOGICAL_H } from '../engine/constants';
import type { State } from '../engine/state';
import type { Input } from '../engine/input';
import { NameEntryState } from './nameEntry';
import type { Game } from './game';

export class TitleState implements State {
  constructor(private readonly game: Game) {}

  enter(): void {
    this.game.audio.playSong(this.game.songs['title']!);
  }

  update(input: Input): void {
    if (input.pressed('confirm')) {
      this.game.audio.playSfx('menuConfirm');
      this.game.stack.push(new NameEntryState(this.game));
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { font, story } = this.game;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    font.drawText(ctx, story.title, Math.floor((LOGICAL_W - font.measure(story.title, 2)) / 2), 64, 2);
    font.drawText(ctx, '▶', 104, 150);
    font.drawText(ctx, 'New Game', 112, 150);
  }
}
