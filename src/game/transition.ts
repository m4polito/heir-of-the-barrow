import { LOGICAL_W, LOGICAL_H } from '../engine/constants';
import type { State, StateStack } from '../engine/state';
import type { Input } from '../engine/input';

/** Fade to black over `out` frames, then back over `inn`; `t` runs 0..out+inn. */
export function transitionAlpha(t: number, out: number, inn: number = out): number {
  return t < out ? Math.min(1, t / out) : Math.max(0, 1 - (t - out) / inn);
}

export class TransitionState implements State {
  private t = 0;
  private readonly frames: number;
  private readonly inFrames: number;
  private readonly onMid: () => void;

  constructor(
    private readonly stack: StateStack,
    opts: { frames?: number; inFrames?: number; onMid: () => void },
  ) {
    this.frames = opts.frames ?? 12;
    this.inFrames = opts.inFrames ?? this.frames;
    this.onMid = opts.onMid;
  }

  update(_input?: Input): void {
    this.t += 1;
    if (this.t === this.frames) {
      this.onMid();
      // onMid may have reset the stack; make sure this is on top again.
      this.stack.remove(this);
      this.stack.push(this);
    } else if (this.t >= this.frames + this.inFrames) {
      this.stack.remove(this);
    }
  }

  render(ctx: CanvasRenderingContext2D, _frame?: number): void {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = transitionAlpha(this.t, this.frames, this.inFrames);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.globalAlpha = prev;
  }
}
