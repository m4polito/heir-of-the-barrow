export type Channel = 'p1' | 'p2' | 'tri' | 'noise';
export type Duty = 0.125 | 0.25 | 0.5;
export type NoisePreset = 'k' | 's' | 'h';

/**
 * Calls for a given channel must arrive in non-decreasing time order;
 * at equal times the last call wins.
 */
export interface ApuLike {
  noteOn(ch: Exclude<Channel, 'noise'>, freq: number, time: number, opts: { duty?: Duty; vol: number }): void;
  noteOff(ch: Exclude<Channel, 'noise'>, time: number): void;
  noiseHit(preset: NoisePreset, time: number, vol: number): void;
  stopAll(time: number): void;
}

type Pitched = Exclude<Channel, 'noise'>;

const RAMP_SEC = 0.003;

interface Segment { start: number; end: number; from: number; to: number }

/** Value of a linear ramp segment at `time` (holds `from` before, `to` after). */
export function lerpSegment(seg: Segment, time: number): number {
  if (time <= seg.start) return seg.from;
  if (time >= seg.end) return seg.to;
  return seg.from + ((seg.to - seg.from) * (time - seg.start)) / (seg.end - seg.start);
}

/** Value of a noise hit's exponential decay (peak -> 0.0001) at `time`, after its attack. */
export function noiseGainAt(peak: number, attackEnd: number, decayEnd: number, time: number): number {
  if (time >= decayEnd) return 0;
  if (time <= attackEnd) return peak;
  return peak * Math.pow(0.0001 / peak, (time - attackEnd) / (decayEnd - attackEnd));
}
/** Peak gain per channel at vol 15. Kept low: NES-style square waves are perceptually loud. */
const MAX_GAIN = 0.12;
const DUTIES: Duty[] = [0.125, 0.25, 0.5];
const PITCHED: Pitched[] = ['p1', 'p2', 'tri'];

const NOISE_PRESETS: Record<NoisePreset, { type: BiquadFilterType; freq: number; decay: number }> = {
  k: { type: 'lowpass', freq: 180, decay: 0.06 },
  s: { type: 'bandpass', freq: 1800, decay: 0.12 },
  h: { type: 'highpass', freq: 7000, decay: 0.035 },
};

export class Apu implements ApuLike {
  private readonly osc = {} as Record<Pitched, OscillatorNode>;
  private readonly gain = {} as Record<Pitched, GainNode>;
  private readonly lastGain: Record<Pitched, number> = { p1: 0, p2: 0, tri: 0 };
  private readonly rampEnd: Record<Pitched, number> = { p1: 0, p2: 0, tri: 0 };
  private readonly duty: Record<'p1' | 'p2', Duty> = { p1: 0.5, p2: 0.5 };
  private readonly waves = new Map<Duty, PeriodicWave>();
  private readonly noiseBuffer: AudioBuffer;
  private readonly liveNoise = new Map<
    AudioBufferSourceNode,
    { gain: GainNode; peak: number; attackEnd: number; decayEnd: number }
  >();
  private readonly seg: Record<Pitched, Segment> = {
    p1: { start: 0, end: 0, from: 0, to: 0 },
    p2: { start: 0, end: 0, from: 0, to: 0 },
    tri: { start: 0, end: 0, from: 0, to: 0 },
  };

  constructor(
    private readonly ctx: AudioContext,
    private readonly destination: AudioNode,
  ) {
    for (const d of DUTIES) {
      const real = new Float32Array(65);
      const imag = new Float32Array(65);
      for (let n = 1; n <= 64; n++) {
        real[n] = Math.sin(2 * Math.PI * n * d) / (n * Math.PI);
        imag[n] = (1 - Math.cos(2 * Math.PI * n * d)) / (n * Math.PI);
      }
      this.waves.set(d, ctx.createPeriodicWave(real, imag, { disableNormalization: false }));
    }

    for (const ch of PITCHED) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      if (ch === 'tri') osc.type = 'triangle';
      else osc.setPeriodicWave(this.waves.get(0.5)!);
      osc.connect(gain);
      gain.connect(destination);
      osc.start();
      this.osc[ch] = osc;
      this.gain[ch] = gain;
    }

    this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  noteOn(ch: Pitched, freq: number, time: number, opts: { duty?: Duty; vol: number }): void {
    if (ch !== 'tri') {
      const duty = opts.duty ?? this.duty[ch];
      if (duty !== this.duty[ch]) {
        this.osc[ch].setPeriodicWave(this.waves.get(duty)!);
        this.duty[ch] = duty;
      }
    }
    const s = this.ramp(ch, (opts.vol / 15) * MAX_GAIN, time);
    this.osc[ch].frequency.setValueAtTime(freq, s);
  }

  noteOff(ch: Pitched, time: number): void {
    this.ramp(ch, 0, time);
  }

  noiseHit(preset: NoisePreset, time: number, vol: number): void {
    const p = NOISE_PRESETS[preset];
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = p.type;
    filter.frequency.value = p.freq;
    const gain = this.ctx.createGain();
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.destination);
    const g = gain.gain;
    g.setValueAtTime(0, time);
    g.linearRampToValueAtTime((vol / 15) * MAX_GAIN, time + RAMP_SEC);
    g.exponentialRampToValueAtTime(0.0001, time + p.decay);
    g.setValueAtTime(0, time + p.decay + 0.001);
    this.liveNoise.set(src, { gain, peak: (vol / 15) * MAX_GAIN, attackEnd: time + RAMP_SEC, decayEnd: time + p.decay });
    src.onended = () => { this.liveNoise.delete(src); };
    src.start(time);
    src.stop(time + p.decay + 0.01);
  }

  /** Only place cancelScheduledValues is allowed: silences notes queued after `time`. */
  stopAll(time: number): void {
    for (const [src, hit] of this.liveNoise) {
      const v = time < hit.attackEnd
        ? hit.peak * Math.max(0, time - (hit.attackEnd - RAMP_SEC)) / RAMP_SEC
        : noiseGainAt(hit.peak, hit.attackEnd, hit.decayEnd, time);
      const g = hit.gain.gain;
      g.cancelScheduledValues(time);
      g.setValueAtTime(v, time);
      g.linearRampToValueAtTime(0, time + RAMP_SEC);
      try {
        src.stop(time + RAMP_SEC + 0.001);
      } catch {
        // already stopped
      }
    }
    this.liveNoise.clear();
    for (const ch of PITCHED) {
      const g = this.gain[ch].gain;
      g.cancelScheduledValues(time);
      this.osc[ch].frequency.cancelScheduledValues(time);
      const v = this.gainAt(ch, time);
      g.setValueAtTime(v, time);
      g.linearRampToValueAtTime(0, time + RAMP_SEC);
      this.seg[ch] = { start: time, end: time + RAMP_SEC, from: v, to: 0 };
      this.lastGain[ch] = 0;
      this.rampEnd[ch] = time + RAMP_SEC;
    }
  }

  private gainAt(ch: Pitched, time: number): number {
    return lerpSegment(this.seg[ch], time);
  }

  /** Schedules a gain ramp starting no earlier than the previous ramp's end; returns its start time. */
  private ramp(ch: Pitched, target: number, time: number): number {
    const g = this.gain[ch].gain;
    const s = Math.max(time, this.rampEnd[ch]);
    g.setValueAtTime(this.lastGain[ch], s);
    g.linearRampToValueAtTime(target, s + RAMP_SEC);
    this.seg[ch] = { start: s, end: s + RAMP_SEC, from: this.lastGain[ch], to: target };
    this.lastGain[ch] = target;
    this.rampEnd[ch] = s + RAMP_SEC;
    return s;
  }
}
