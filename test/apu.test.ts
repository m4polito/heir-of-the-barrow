import { describe, it, expect } from 'vitest';
import { Apu } from '../src/engine/audio/apu';
import { SfxPlayer } from '../src/engine/audio/sfx';
import { SFX } from '../src/data/sfx';

interface Ev { kind: 'set' | 'lin' | 'exp'; value: number; time: number }

class FakeParam {
  events: Ev[] = [];
  value = 0;
  /** Continuity violations: a `set` whose value differs from the curve at its time. */
  violations: string[] = [];
  valueAt(t: number, events: Ev[] = this.events): number {
    let pv = this.value;
    let pt = -Infinity;
    for (const e of events) {
      if (e.time <= t) { pv = e.value; pt = e.time; continue; }
      if (e.kind === 'lin') return pt === -Infinity ? e.value : pv + ((e.value - pv) * (t - pt)) / (e.time - pt);
      if (e.kind === 'exp') return pv === 0 || pt === -Infinity ? pv : pv * Math.pow(e.value / pv, (t - pt) / (e.time - pt));
      return pv;
    }
    return pv;
  }
  private add(e: Ev) {
    if (e.kind === 'set') {
      const before = this.events.filter((x) => x.time <= e.time);
      const cur = this.valueAt(e.time, before);
      if (Math.abs(cur - e.value) > 1e-9) this.violations.push(`set(${e.value}) at ${e.time}, curve ${cur}`);
    }
    let i = this.events.length;
    while (i > 0 && this.events[i - 1]!.time > e.time) i--;
    this.events.splice(i, 0, e);
  }
  setValueAtTime(value: number, time: number) { this.add({ kind: 'set', value, time }); }
  linearRampToValueAtTime(value: number, time: number) { this.add({ kind: 'lin', value, time }); }
  exponentialRampToValueAtTime(value: number, time: number) { this.add({ kind: 'exp', value, time }); }
  cancelScheduledValues(): never { throw new Error('cancelScheduledValues must never be called'); }
}

function makeCtx() {
  const params: FakeParam[] = [];
  const gains: { gain: FakeParam }[] = [];
  const sources: { stops: number[]; starts: number[] }[] = [];
  const param = () => { const p = new FakeParam(); params.push(p); return p; };
  const node = () => ({ connect() {} });
  const ctx = {
    sampleRate: 100,
    createGain() { const g = { ...node(), gain: param() }; gains.push(g); return g; },
    createOscillator() {
      const o = { ...node(), type: 'sine', frequency: param(), starts: [] as number[], stops: [] as number[],
        setPeriodicWave() {}, start(t: number) { o.starts.push(t); }, stop(t: number) { o.stops.push(t); } };
      sources.push(o);
      return o;
    },
    createPeriodicWave() { return {}; },
    createBuffer() { return { getChannelData() { return new Float32Array(4); } }; },
    createBufferSource() {
      const s = { ...node(), buffer: null, loop: false, starts: [] as number[], stops: [] as number[],
        start(t: number) { s.starts.push(t); }, stop(t: number) { s.stops.push(t); } };
      sources.push(s);
      return s;
    },
    createBiquadFilter() { return { ...node(), type: '', frequency: param() }; },
  };
  const apu = new Apu(ctx as unknown as AudioContext, {} as AudioNode);
  return { apu, params, gains, sources };
}

function expectContinuous(params: FakeParam[]) {
  for (const p of params) expect(p.violations).toEqual([]);
}

describe('Apu voices', () => {
  it('(a) stopAll after noteOff fades the kill gain from exactly 1', () => {
    const { apu, params, gains } = makeCtx();
    apu.noteOn('p1', 440, 10, { vol: 15 });
    apu.noteOff('p1', 10.03);
    apu.stopAll(10.031);
    expectContinuous(params);
    // gains: [env, kill] for the one voice
    const kill = gains[1]!.gain;
    expect(kill.events).toEqual([
      { kind: 'set', value: 1, time: 10.031 },
      { kind: 'lin', value: 0, time: expect.closeTo(10.034, 6) },
    ]);
  });

  it('(b) repeated stopAll + noteOn at the same start time stays continuous', () => {
    const { apu, params } = makeCtx();
    apu.stopAll(10);
    apu.noteOn('p1', 440, 10, { vol: 9 });
    apu.stopAll(10);
    apu.noteOn('p1', 440, 10, { vol: 9 });
    apu.noteOff('p1', 10.03);
    expectContinuous(params);
  });

  it('(c) stopAll inside the rest of SFX.error stays continuous', () => {
    const { apu, params } = makeCtx();
    new SfxPlayer(apu).play(SFX.error, 10);
    apu.stopAll(10.08);
    expectContinuous(params);
  });

  it('(d) stopAll mid-decay of SFX.door noise stays continuous', () => {
    const { apu, params } = makeCtx();
    new SfxPlayer(apu).play(SFX.door, 10);
    apu.stopAll(10.03);
    expectContinuous(params);
  });

  it('(e) legato noteOn releases the first voice at the second start', () => {
    const { apu, params, gains } = makeCtx();
    apu.noteOn('p1', 440, 10, { vol: 12 });
    apu.noteOn('p1', 660, 10.05, { vol: 12 });
    expectContinuous(params);
    const first = gains[0]!.gain.events;
    expect(first).toContainEqual({ kind: 'set', value: expect.any(Number), time: 10.05 });
    expect(first[first.length - 1]).toMatchObject({ kind: 'lin', value: 0 });
    expect(first[first.length - 1]!.time).toBeCloseTo(10.053, 6);
    const second = gains[2]!.gain.events;
    expect(second[0]).toEqual({ kind: 'set', value: 0, time: 10.05 });
  });
});
