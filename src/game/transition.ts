import { LOGICAL_W, LOGICAL_H } from '../engine/constants';
import type { State, StateStack } from '../engine/state';
import type { Input } from '../engine/input';

/** Fade to black over `frames`, then back over `frames`; `t` runs 0..2*frames. */
export function transitionAlpha(t: number, frames: number): number {
  return t < frames ? Math.min(1, t / frames) : Math.max(0, 2 - t / frames);
}

export class TransitionState implements State {
  private t = 0;
  private readonly frames: number;
  private readonly onMid: () => void;

  constructor(
    private readonly stack: StateStack,
    opts: { frames?: number; onMid: () => void },
  ) {
    this.frames = opts.frames ?? 12;
    this.onMid = opts.onMid;
  }

  update(_input?: Input): void {
    this.t += 1;
    if (this.t === this.frames) {
      this.onMid();
      // onMid may have reset the stack; make sure this is on top again.
      this.stack.remove(this);
      this.stack.push(this);
    } else if (this.t >= this.frames * 2) {
      this.stack.remove(this);
    }
  }

  render(ctx: CanvasRenderingContext2D, _frame?: number): void {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = transitionAlpha(this.t, this.frames);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.globalAlpha = prev;
  }
}
