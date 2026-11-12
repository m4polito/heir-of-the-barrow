import { describe, it, expect } from 'vitest';
import { Apu, lerpSegment, noiseGainAt } from '../src/engine/audio/apu';

describe('lerpSegment', () => {
  const seg = { start: 10, end: 10.003, from: 0.1, to: 0 };
  it('interpolates, holding outside the segment', () => {
    expect(lerpSegment(seg, 10.0015)).toBeCloseTo(0.05, 6);
    expect(lerpSegment(seg, 9)).toBe(0.1);
    expect(lerpSegment(seg, 11)).toBe(0);
  });
});

describe('noiseGainAt', () => {
  it('follows the exponential decay', () => {
    expect(noiseGainAt(0.1, 10, 10.06, 10)).toBe(0.1);
    expect(Math.abs(noiseGainAt(0.1, 10, 10.06, 10.06))).toBeLessThan(1e-6);
    expect(noiseGainAt(0.1, 10, 10.06, 10.1)).toBe(0);
    const mid = noiseGainAt(0.1, 10, 10.06, 10.03);
    expect(mid).toBeGreaterThan(0.0001);
    expect(mid).toBeLessThan(0.1);
  });
});

interface Rec { method: string; value: number; time: number }

function param() {
  const calls: Rec[] = [];
  return {
    calls,
    value: 0,
    setValueAtTime(value: number, time: number) { calls.push({ method: 'set', value, time }); },
    linearRampToValueAtTime(value: number, time: number) { calls.push({ method: 'ramp', value, time }); },
    exponentialRampToValueAtTime(value: number, time: number) { calls.push({ method: 'exp', value, time }); },
    cancelScheduledValues(time: number) { calls.push({ method: 'cancel', value: 0, time }); },
  };
}

describe('Apu.stopAll', () => {
  it('fades from the gain actually sounding', () => {
    const gains: ReturnType<typeof param>[] = [];
    const ctx = {
      sampleRate: 44100,
      createGain() { const g = { gain: param(), connect() {} }; gains.push(g.gain); return g; },
      createOscillator() { return { type: 'sine', frequency: param(), setPeriodicWave() {}, connect() {}, start() {} }; },
      createPeriodicWave() { return {}; },
      createBuffer() { return { getChannelData() { return new Float32Array(4); } }; },
    };
    const apu = new Apu(ctx as unknown as AudioContext, {} as AudioNode);
    apu.noteOn('p1', 440, 10, { vol: 15 });
    apu.noteOff('p1', 10.03);
    apu.stopAll(10.031);
    const calls = gains[0]!.calls;
    const i = calls.findIndex((c) => c.method === 'cancel' && c.time === 10.031);
    expect(i).toBeGreaterThan(-1);
    const set = calls[i + 1]!;
    expect(set.method).toBe('set');
    expect(set.time).toBe(10.031);
    expect(set.value).toBeGreaterThan(0);
    expect(set.value).toBeCloseTo(0.08, 2);
    expect(calls[i + 2]).toMatchObject({ method: 'ramp', value: 0 });
    expect(calls[i + 2]!.time).toBeCloseTo(10.034, 6);
  });
});
