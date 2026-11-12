import { LOGICAL_W, LOGICAL_H } from '../engine/constants';
import type { State } from '../engine/state';
import { songFrames, type Song } from '../engine/audio/sequencer';
import type { Game } from './game';

/** Frames to fade to black, and to fade back in. */
export const SLEEP_FADE = 20;

/**
 * Fade to black, play a one-shot song in the dark, wake, fade back in, and remove itself.
 * It reads no input: whatever is beneath stays frozen until it is gone.
 */
export class SleepState implements State {
  private t = 0;
  private readonly hold: number;

  constructor(
    private readonly game: Game,
    private readonly opts: { song: Song; onWake: () => void },
  ) {
    this.hold = songFrames(opts.song);
  }

  enter(): void {
    this.game.audio.stopSong();
  }

  update(): void {
    this.t += 1;
    if (this.t === SLEEP_FADE) this.game.audio.playSong(this.opts.song);
    if (this.t === SLEEP_FADE + this.hold) this.opts.onWake();
    if (this.t >= SLEEP_FADE + this.hold + SLEEP_FADE) this.game.stack.remove(this);
  }

  render(ctx: CanvasRenderingContext2D, _frame?: number): void {
    const wake = SLEEP_FADE + this.hold;
    const alpha = this.t < SLEEP_FADE
      ? this.t / SLEEP_FADE
      : this.t <= wake
        ? 1
        : Math.max(0, 1 - (this.t - wake) / SLEEP_FADE);
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.globalAlpha = prev;
  }
}
