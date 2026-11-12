import { describe, it, expect } from 'vitest';
import { SFX } from '../src/data/sfx';
import { SfxPlayer } from '../src/engine/audio/sfx';
import { noteToMidi } from '../src/engine/audio/notes';
import type { ApuLike, Channel, Duty, NoisePreset } from '../src/engine/audio/apu';

interface Call { kind: string; ch?: Channel; freq?: number; time: number; vol?: number; duty?: Duty; preset?: NoisePreset }

class FakeApu implements ApuLike {
  calls: Call[] = [];
  noteOn(ch: Exclude<Channel, 'noise'>, freq: number, time: number, o: { duty?: Duty; vol: number }) {
    this.calls.push({ kind: 'noteOn', ch, freq, time, vol: o.vol, duty: o.duty });
  }
  noteOff(ch: Exclude<Channel, 'noise'>, time: number) { this.calls.push({ kind: 'noteOff', ch, time }); }
  noiseHit(preset: NoisePreset, time: number, vol: number) { this.calls.push({ kind: 'noiseHit', preset, time, vol }); }
  stopAll(time: number) { this.calls.push({ kind: 'stopAll', time }); }
}

function run(steps: typeof SFX.blip) {
  const apu = new FakeApu();
  new SfxPlayer(apu).play(steps, 10);
  return apu.calls;
}

describe('SfxPlayer', () => {
  it('plays blip', () => {
    const c = run(SFX.blip);
    expect(c[0]).toMatchObject({ kind: 'stopAll', time: 10 });
    expect(c[1]).toMatchObject({ kind: 'noteOn', ch: 'p1', duty: 0.25, vol: 6 });
    expect(c[1]!.freq).toBeCloseTo(1046.5, 1);
    expect(c[1]!.time).toBeCloseTo(10, 3);
    expect(c[2]).toMatchObject({ kind: 'noteOff', ch: 'p1' });
    expect(c[2]!.time).toBeCloseTo(10.0333, 3);
  });

  it('plays door', () => {
    const c = run(SFX.door);
    expect(c[1]).toMatchObject({ kind: 'noiseHit', preset: 'k', vol: 10 });
    expect(c[1]!.time).toBeCloseTo(10, 3);
    expect(c[2]).toMatchObject({ kind: 'noteOn', ch: 'tri' });
    expect(c[2]!.freq).toBeCloseTo(130.81, 2);
    expect(c[2]!.time).toBeCloseTo(10.0167, 3);
    expect(c[3]).toMatchObject({ kind: 'noteOff', ch: 'tri' });
    expect(c[3]!.time).toBeCloseTo(10.1, 3);
  });

  it('error schedules second note after the rest', () => {
    const ons = run(SFX.error).filter((x) => x.kind === 'noteOn');
    expect(ons).toHaveLength(2);
    expect(ons[1]!.time).toBeCloseTo(10 + 6 / 60, 3);
    expect(ons[1]!.freq).toBeCloseTo(ons[0]!.freq!, 3);
  });

  it('plays heroHit', () => {
    const c = run(SFX.heroHit);
    expect(c[1]).toMatchObject({ kind: 'noiseHit', preset: 's', vol: 12 });
    expect(c[1]!.time).toBeCloseTo(10, 3);
    const ons = c.filter((x) => x.kind === 'noteOn');
    const offs = c.filter((x) => x.kind === 'noteOff');
    expect(ons).toHaveLength(2);
    expect(ons[0]).toMatchObject({ ch: 'tri' });
    expect(ons[0]!.freq).toBeCloseTo(110.0, 1);
    expect(ons[0]!.time).toBeCloseTo(10.0167, 3);
    expect(ons[1]).toMatchObject({ ch: 'tri' });
    expect(ons[1]!.freq).toBeCloseTo(82.41, 2);
    expect(ons[1]!.time).toBeCloseTo(10.0833, 3);
    expect(offs.at(-1)).toMatchObject({ ch: 'tri' });
    expect(offs.at(-1)!.time).toBeCloseTo(10.1667, 3);
  });

  it('battle effects are every id with steps and the right lengths', () => {
    for (const [id, steps] of Object.entries(SFX)) {
      expect(steps.length, id).toBeGreaterThan(0);
    }
    const total = (id: keyof typeof SFX) => SFX[id].reduce((n, s) => n + s.frames, 0);
    expect(total('encounter')).toBe(32);
    expect(total('spell')).toBe(12);
    expect(total('heal')).toBe(14);
    for (const id of ['heroHit', 'monsterHit', 'miss', 'critical', 'runOk', 'runFail'] as const) {
      expect(total(id), id).toBeLessThanOrEqual(16);
    }
  });

  it('heal is not a contiguous slice of runOk', () => {
    const notes = (id: 'heal' | 'runOk') => SFX[id].map((x) => x.note ?? '-');
    const h = notes('heal');
    const r = notes('runOk');
    let found = false;
    for (let k = 0; k + h.length <= r.length; k++) {
      if (h.every((n, i) => n === r[k + i])) found = true;
    }
    expect(found).toBe(false);
  });

  it('validates every entry', () => {
    for (const steps of Object.values(SFX)) {
      for (const s of steps) {
        if (s.note) expect(() => noteToMidi(s.note!)).not.toThrow();
        expect(s.frames).toBeGreaterThan(0);
      }
    }
  });
});

describe('buy effect', () => {
  it('exists and differs from every other effect', () => {
    expect(SFX.buy).toBeDefined();
    for (const [id, steps] of Object.entries(SFX)) {
      if (id !== 'buy') expect(JSON.stringify(steps), id).not.toBe(JSON.stringify(SFX.buy));
    }
  });
});
