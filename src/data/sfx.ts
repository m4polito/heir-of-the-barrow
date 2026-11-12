import type { Channel, Duty, NoisePreset } from '../engine/audio/apu';

export type SfxId = 'blip' | 'menuMove' | 'menuConfirm' | 'menuCancel' | 'door' | 'error';

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
};
