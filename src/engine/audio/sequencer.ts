import { noteToMidi, midiToFreq } from './notes';
import type { ApuLike, Channel, Duty, NoisePreset } from './apu';

export interface Track {
  channel: Channel;
  duty?: Duty;
  vol?: number;
  rows: (string | null)[];
}

export interface Song {
  id: string;
  tempo: number;
  loopFrom?: number;
  /** Default true. When false the song plays once and ends without cutting the last notes. */
  loop?: boolean;
  tracks: Track[];
}

export const ROWS_PER_BEAT = 4;

const DEFAULT_VOL = 12;
const DEFAULT_DUTY: Duty = 0.5;
const NOISE_PRESETS: readonly string[] = ['k', 's', 'h'];

export function rowDurationSec(tempo: number): number {
  return 60 / tempo / ROWS_PER_BEAT;
}

export function validateSong(song: Song): void {
  if (!(song.tempo > 0)) throw new Error(`song ${song.id}: tempo must be positive`);
  if (song.tracks.length === 0) throw new Error(`song ${song.id}: no tracks`);
  const count = song.tracks[0]!.rows.length;
  if (count === 0) throw new Error(`song ${song.id}: zero rows`);
  song.tracks.forEach((track, ti) => {
    if (track.rows.length !== count) {
      throw new Error(`song ${song.id}: track ${ti} has ${track.rows.length} rows, expected ${count}`);
    }
    track.rows.forEach((row, ri) => {
      if (row === null) return;
      if (track.channel === 'noise') {
        if (!NOISE_PRESETS.includes(row)) {
          throw new Error(`song ${song.id}: track ${ti} row ${ri}: invalid noise preset '${row}'`);
        }
      } else if (row !== 'off') {
        try {
          noteToMidi(row);
        } catch {
          throw new Error(`song ${song.id}: track ${ti} row ${ri}: invalid note '${row}'`);
        }
      }
    });
  });
  if (song.loop === false && song.loopFrom !== undefined) {
    throw new Error(`song ${song.id}: loopFrom is meaningless when loop is false`);
  }
  if (song.loopFrom !== undefined && !(song.loopFrom >= 0 && song.loopFrom < count)) {
    throw new Error(`song ${song.id}: loopFrom ${song.loopFrom} out of range 0..${count - 1}`);
  }
}

export class Sequencer {
  private song: Song | null = null;
  private cursorRow = 0;
  private cursorTime = 0;

  constructor(private readonly apu: ApuLike) {}

  get playing(): boolean {
    return this.song !== null;
  }

  play(song: Song, startTime: number): void {
    validateSong(song);
    this.apu.stopAll(startTime);
    this.song = song;
    this.cursorRow = 0;
    this.cursorTime = startTime;
  }

  stop(atTime: number): void {
    this.apu.stopAll(atTime);
    this.song = null;
  }

  schedule(untilTime: number): void {
    const song = this.song;
    if (!song) return;
    const rowDur = rowDurationSec(song.tempo);
    const rowCount = song.tracks[0]!.rows.length;
    while (this.cursorTime < untilTime) {
      this.emitRow(song, this.cursorRow, this.cursorTime);
      this.cursorRow++;
      this.cursorTime += rowDur;
      if (this.cursorRow >= rowCount) {
        if (song.loop === false) {
          this.song = null;
          return;
        }
        this.cursorRow = song.loopFrom ?? 0;
      }
    }
  }

  private emitRow(song: Song, row: number, time: number): void {
    for (const track of song.tracks) {
      const cell = track.rows[row]!;
      if (cell === null) continue;
      const vol = track.vol ?? DEFAULT_VOL;
      if (track.channel === 'noise') {
        this.apu.noiseHit(cell as NoisePreset, time, vol);
      } else if (cell === 'off') {
        this.apu.noteOff(track.channel, time);
      } else {
        this.apu.noteOn(track.channel, midiToFreq(noteToMidi(cell)), time, {
          duty: track.duty ?? DEFAULT_DUTY,
          vol,
        });
      }
    }
  }
}
