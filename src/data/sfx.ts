import type { Channel, Duty, NoisePreset } from '../engine/audio/apu';

export type SfxId =
  | 'blip'
  | 'menuMove'
  | 'menuConfirm'
  | 'menuCancel'
  | 'door'
  | 'error'
  | 'encounter'
  | 'heroHit'
  | 'monsterHit'
  | 'miss'
  | 'critical'
  | 'runOk'
  | 'runFail'
  | 'spell'
  | 'heal';

/** `frames` are 60 fps frames; a step lasts frames / 60 seconds. */
export interface SfxStep {
  ch: Channel;
  frames: number;
  vol: number;
  note?: string;
  preset?: NoisePreset;
  duty?: Duty;
  rest?: true;
}

const p1 = (note: string, frames: number, vol: number, duty: Duty): SfxStep => ({ ch: 'p1', note, duty, frames, vol });

export const SFX: Record<SfxId, SfxStep[]> = {
  blip: [{ ch: 'p1', note: 'C6', duty: 0.25, frames: 2, vol: 6 }],
  menuMove: [{ ch: 'p1', note: 'E5', duty: 0.5, frames: 2, vol: 8 }],
  menuConfirm: [
    { ch: 'p1', note: 'C5', duty: 0.5, frames: 2, vol: 9 },
    { ch: 'p1', note: 'G5', duty: 0.5, frames: 4, vol: 9 },
  ],
  menuCancel: [{ ch: 'p1', note: 'G4', duty: 0.5, frames: 3, vol: 8 }],
  door: [
    { ch: 'noise', preset: 'k', frames: 1, vol: 10 },
    { ch: 'tri', note: 'C3', frames: 5, vol: 12 },
  ],
  error: [
    { ch: 'p1', note: 'G#3', duty: 0.125, frames: 4, vol: 9 },
    { ch: 'p1', rest: true, frames: 2, vol: 0 },
    { ch: 'p1', note: 'G#3', duty: 0.125, frames: 4, vol: 9 },
  ],
  encounter: [
    p1('C4', 3, 10, 0.125), p1('F#4', 3, 10, 0.125), p1('C5', 3, 10, 0.125), p1('F#5', 3, 10, 0.125),
    p1('C4', 3, 10, 0.125), p1('F#4', 3, 10, 0.125), p1('C5', 3, 10, 0.125), p1('F#5', 3, 10, 0.125),
    p1('C6', 8, 10, 0.125),
  ],
  heroHit: [
    { ch: 'noise', preset: 's', frames: 1, vol: 12 },
    { ch: 'tri', note: 'A2', frames: 4, vol: 12 },
    { ch: 'tri', note: 'E2', frames: 5, vol: 12 },
  ],
  monsterHit: [
    { ch: 'noise', preset: 'h', frames: 1, vol: 10 },
    p1('A5', 2, 9, 0.125),
    p1('E5', 2, 9, 0.125),
  ],
  miss: [
    p1('B4', 2, 6, 0.125),
    { ch: 'p1', rest: true, frames: 1, vol: 0 },
    p1('F#4', 3, 5, 0.125),
  ],
  critical: [
    { ch: 'noise', preset: 's', frames: 1, vol: 13 },
    p1('C6', 2, 11, 0.25), p1('G5', 2, 11, 0.25), p1('C6', 2, 11, 0.25), p1('G6', 5, 11, 0.25),
  ],
  runOk: [
    p1('C5', 2, 8, 0.5), p1('E5', 2, 8, 0.5), p1('G5', 2, 8, 0.5), p1('C6', 2, 8, 0.5), p1('E6', 3, 8, 0.5),
  ],
  runFail: [p1('E4', 3, 9, 0.125), p1('C4', 3, 9, 0.125), p1('G#3', 6, 9, 0.125)],
  // Placeholders; Task 5 gives these their real sound.
  spell: [p1('A4', 2, 9, 0.125), p1('E5', 2, 9, 0.125), p1('A5', 2, 9, 0.125), p1('C#6', 2, 9, 0.125), p1('E6', 4, 9, 0.125)],
  heal: [p1('G5', 4, 7, 0.5), p1('C6', 4, 7, 0.5), p1('E6', 6, 7, 0.5)],
};
