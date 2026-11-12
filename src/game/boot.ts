import { LOGICAL_W, LOGICAL_H } from '../engine/constants';
import type { Font } from '../engine/font';
import type { Input } from '../engine/input';
import type { State } from '../engine/state';

const TEXT = 'PRESS ANY KEY';

export class BootState implements State {
  private frame = 0;
  private started = false;

  constructor(private readonly deps: { font: Font; onStart: () => void }) {}

  update(input: Input): void {
    this.frame++;
    if (!this.started && input.anyPressed()) {
      this.started = true;
      this.deps.onStart();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    if (Math.floor(this.frame / 30) % 2 === 0) {
      const { font } = this.deps;
      const x = Math.floor((LOGICAL_W - font.measure(TEXT)) / 2);
      font.drawText(ctx, TEXT, x, 120);
    }
  }
}
