import { wrapText } from '../../ui/wrap';

export interface Beat {
  text: string;
  sfx?: string;
  fx?: 'shake' | 'flash';
  song?: string;
  /** Hero HP to display from this beat on. */
  heroHp: number;
  /** Monster HP to display from this beat on. */
  monsterHp: number;
}

export const BEAT_HOLD = 24;

/** Plays beats one at a time: typewriter reveal, a short hold, then the next beat. */
export class BeatPlayer {
  private beats: Beat[] = [];
  private index = -1;
  private shown = 0;
  private hold = 0;
  private finished = true;
  private waitOnLast = false;
  private lastBeat: Beat | null = null;

  constructor(private readonly cols = 28) {}

  load(beats: Beat[], waitOnLast: boolean): void {
    this.beats = beats;
    this.waitOnLast = waitOnLast;
    this.index = -1;
    this.shown = 0;
    this.hold = 0;
    this.finished = beats.length === 0;
    this.lastBeat = null;
  }

  get current(): Beat | null {
    return this.index >= 0 ? (this.beats[this.index] ?? null) : this.lastBeat;
  }

  get lines(): string[] {
    const c = this.current;
    return c ? wrapText(c.text.slice(0, this.shown), this.cols) : [];
  }

  get revealed(): boolean {
    const c = this.current;
    return c !== null && this.shown >= c.text.length;
  }

  get waiting(): boolean {
    return !this.finished && this.revealed && this.index === this.beats.length - 1 && this.waitOnLast;
  }

  get done(): boolean {
    return this.finished;
  }

  tick(confirm: boolean): Beat | null {
    if (this.finished) return null;
    if (this.index < 0) return this.start(0);
    const cur = this.beats[this.index]!;
    if (this.shown < cur.text.length) {
      if (confirm) this.shown = cur.text.length;
      else this.shown++;
      return null;
    }
    if (this.waiting) {
      if (confirm) this.finish();
      return null;
    }
    if (confirm || this.hold >= BEAT_HOLD) return this.advance();
    this.hold++;
    return null;
  }

  private advance(): Beat | null {
    if (this.index + 1 >= this.beats.length) {
      this.finish();
      return null;
    }
    return this.start(this.index + 1);
  }

  private start(i: number): Beat {
    this.index = i;
    this.shown = 0;
    this.hold = 0;
    return this.beats[i]!;
  }

  private finish(): void {
    this.lastBeat = this.beats[this.index] ?? null;
    this.finished = true;
  }
}
