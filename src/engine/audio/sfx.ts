import type { SfxStep } from '../../data/sfx';
import type { ApuLike } from './apu';
import { midiToFreq, noteToMidi } from './notes';

const FPS = 60;

export class SfxPlayer {
  constructor(private readonly apu: ApuLike) {}

  play(steps: SfxStep[], startTime: number): void {
    this.apu.stopAll(startTime);
    let t = startTime;
    for (const step of steps) {
      const dur = step.frames / FPS;
      if (!step.rest) {
        if (step.ch === 'noise') {
          if (step.preset) this.apu.noiseHit(step.preset, t, step.vol);
        } else if (step.note) {
          this.apu.noteOn(step.ch, midiToFreq(noteToMidi(step.note)), t, { duty: step.duty, vol: step.vol });
          this.apu.noteOff(step.ch, t + dur);
        }
      }
      t += dur;
    }
  }
}
