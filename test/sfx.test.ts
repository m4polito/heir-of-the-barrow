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

describe('save effect', () => {
  it('exists, differs from every other effect, and lasts long enough to be heard', () => {
    expect(SFX.save).toBeDefined();
    for (const [id, steps] of Object.entries(SFX)) {
      if (id !== 'save') expect(JSON.stringify(steps), id).not.toBe(JSON.stringify(SFX.save));
    }
    const frames = SFX.save.reduce((n, s) => n + s.frames, 0);
    expect(frames).toBeGreaterThanOrEqual(20);
    expect(frames).toBeLessThanOrEqual(30);
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

describe('mend effect', () => {
  it('is the pinned phrase and differs from every other effect', () => {
    expect(SFX.mend).toEqual([
      { ch: 'p1', note: 'E4', duty: 0.125, frames: 3, vol: 7 },
      { ch: 'p1', note: 'G4', duty: 0.125, frames: 3, vol: 7 },
      { ch: 'p1', note: 'B4', duty: 0.125, frames: 6, vol: 7 },
    ]);
    for (const [id, steps] of Object.entries(SFX)) {
      if (id !== 'mend') expect(JSON.stringify(steps), id).not.toBe(JSON.stringify(SFX.mend));
    }
  });
});

describe('dungeon effects', () => {
  it('bump, stairs and chest are the pinned phrases and differ from every other effect', () => {
    expect(SFX.bump).toEqual([
      { ch: 'tri', note: 'G2', frames: 3, vol: 10 },
      { ch: 'tri', note: 'D2', frames: 3, vol: 10 },
    ]);
    expect(SFX.stairs.map((s) => s.note)).toEqual(['E4', 'C4', 'A3', 'F3']);
    expect(SFX.stairs.map((s) => s.frames)).toEqual([3, 3, 3, 5]);
    expect(SFX.chest).toEqual([
      { ch: 'noise', preset: 'k', frames: 1, vol: 9 },
      { ch: 'p1', note: 'G5', duty: 0.25, frames: 2, vol: 8 },
      { ch: 'p1', note: 'D6', duty: 0.25, frames: 6, vol: 8 },
    ]);
    for (const id of ['bump', 'stairs', 'chest'] as const)
      for (const [other, steps] of Object.entries(SFX))
        if (other !== id) expect(JSON.stringify(steps), `${id} vs ${other}`).not.toBe(JSON.stringify(SFX[id]));
  });
});

describe('torch effect', () => {
  it('is the pinned phrase and differs from every other effect', () => {
    expect(SFX.torch).toEqual([
      { ch: 'noise', preset: 'h', frames: 2, vol: 8 },
      { ch: 'p1', note: 'D4', duty: 0.125, frames: 2, vol: 7 },
      { ch: 'p1', note: 'A4', duty: 0.125, frames: 2, vol: 7 },
      { ch: 'p1', note: 'F#5', duty: 0.125, frames: 6, vol: 7 },
    ]);
    for (const [other, steps] of Object.entries(SFX))
      if (other !== 'torch') expect(JSON.stringify(steps), `torch vs ${other}`).not.toBe(JSON.stringify(SFX.torch));
  });
});
