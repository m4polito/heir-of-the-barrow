import type { SfxId } from '../../data/sfx';
import { wrapText } from '../../ui/wrap';

export interface Beat {
  text: string;
  sfx?: SfxId;
  fx?: 'shake' | 'flash';
  song?: string;
  /** Hero HP to display from this beat on. */
  heroHp: number;
  /** Hero MP to display from this beat on. */
  heroMp: number;
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
  /** The current beat's text wrapped once, when the beat starts, so typing never re-flows it. */
  private wrapped: string[] = [''];
  private total = 0;

  constructor(private readonly cols = 28) {}

  load(beats: Beat[], waitOnLast: boolean): void {
    this.beats = beats;
    this.waitOnLast = waitOnLast;
    this.index = -1;
    this.shown = 0;
    this.hold = 0;
    this.finished = beats.length === 0;
    this.lastBeat = null;
    this.setWrapped(null);
  }

  get current(): Beat | null {
    return this.index >= 0 ? (this.beats[this.index] ?? null) : this.lastBeat;
  }

  /** The beat after the current one, or null. */
  get next(): Beat | null {
    if (this.finished) return null;
    return this.beats[this.index + 1] ?? null;
  }

  get lines(): string[] {
    if (!this.current) return [];
    const out: string[] = [];
    let left = this.shown;
    for (const line of this.wrapped) {
      if (left <= 0) break;
      out.push(line.slice(0, left));
      left -= line.length;
    }
    return out.length > 0 ? out : [''];
  }

  get revealed(): boolean {
    const c = this.current;
    return c !== null && this.shown >= this.total;
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
    if (this.shown < this.total) {
      if (confirm) this.shown = this.total;
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
    this.setWrapped(this.beats[i]!);
    return this.beats[i]!;
  }

  private setWrapped(beat: Beat | null): void {
    this.wrapped = beat ? wrapText(beat.text, this.cols) : [''];
    this.total = this.wrapped.reduce((n, l) => n + l.length, 0);
  }

  private finish(): void {
    this.lastBeat = this.beats[this.index] ?? null;
    this.finished = true;
  }
}
