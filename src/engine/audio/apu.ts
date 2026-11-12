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
/** Peak gain per channel at vol 15. Kept low: NES-style square waves are perceptually loud. */
const MAX_GAIN = 0.12;
const DUTIES: Duty[] = [0.125, 0.25, 0.5];
const PITCHED: Pitched[] = ['p1', 'p2', 'tri'];

const NOISE_PRESETS: Record<NoisePreset, { type: BiquadFilterType; freq: number; decay: number }> = {
  k: { type: 'lowpass', freq: 180, decay: 0.06 },
  s: { type: 'bandpass', freq: 1800, decay: 0.12 },
  h: { type: 'highpass', freq: 7000, decay: 0.035 },
};

/**
 * One sounding note or noise hit. `env` shapes the note; `kill` is 1 until stopAll fades it,
 * so its anchor is always exact. Automation is never rewritten.
 */
interface Voice {
  src: OscillatorNode | AudioBufferSourceNode;
  env: GainNode;
  kill: GainNode;
  attackEnd: number;
  level: number;
}

export class Apu implements ApuLike {
  private readonly current: Partial<Record<Pitched, Voice>> = {};
  private readonly live = new Set<Voice>();
  private readonly rampEnd: Record<Pitched, number> = { p1: 0, p2: 0, tri: 0 };
  private readonly waves = new Map<Duty, PeriodicWave>();
  private readonly noiseBuffer: AudioBuffer;

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

    this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  noteOn(ch: Pitched, freq: number, time: number, opts: { duty?: Duty; vol: number }): void {
    const s = Math.max(time, this.rampEnd[ch]);
    const prev = this.current[ch];
    if (prev) this.release(prev, s);
    const osc = this.ctx.createOscillator();
    if (ch === 'tri') osc.type = 'triangle';
    else osc.setPeriodicWave(this.waves.get(opts.duty ?? 0.5)!);
    osc.frequency.value = freq;
    const level = (opts.vol / 15) * MAX_GAIN;
    const env = this.ctx.createGain();
    env.gain.value = 0;
    env.gain.setValueAtTime(0, s);
    env.gain.linearRampToValueAtTime(level, s + RAMP_SEC);
    const kill = this.ctx.createGain();
    kill.gain.value = 1;
    osc.connect(env);
    env.connect(kill);
    kill.connect(this.destination);
    osc.start(s);
    const voice: Voice = { src: osc, env, kill, attackEnd: s + RAMP_SEC, level };
    osc.onended = () => { this.live.delete(voice); };
    this.current[ch] = voice;
    this.live.add(voice);
    this.rampEnd[ch] = s + RAMP_SEC;
  }

  noteOff(ch: Pitched, time: number): void {
    const v = this.current[ch];
    if (!v) return;
    this.release(v, time);
    this.current[ch] = undefined;
    this.rampEnd[ch] = Math.max(this.rampEnd[ch], Math.max(time, v.attackEnd) + RAMP_SEC);
  }

  noiseHit(preset: NoisePreset, time: number, vol: number): void {
    const p = NOISE_PRESETS[preset];
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = p.type;
    filter.frequency.value = p.freq;
    const env = this.ctx.createGain();
    env.gain.value = 0;
    const kill = this.ctx.createGain();
    kill.gain.value = 1;
    src.connect(filter);
    filter.connect(env);
    env.connect(kill);
    kill.connect(this.destination);
    const level = (vol / 15) * MAX_GAIN;
    const g = env.gain;
    g.setValueAtTime(0, time);
    g.linearRampToValueAtTime(level, time + RAMP_SEC);
    g.exponentialRampToValueAtTime(0.0001, time + p.decay);
    const voice: Voice = { src, env, kill, attackEnd: time + RAMP_SEC, level };
    this.live.add(voice);
    src.onended = () => { this.live.delete(voice); };
    src.start(time);
    src.stop(time + p.decay + 0.01);
  }

  /** Fades every sounding or queued voice out from `time` via its kill gain. */
  stopAll(time: number): void {
    for (const v of this.live) {
      v.kill.gain.setValueAtTime(1, time);
      v.kill.gain.linearRampToValueAtTime(0, time + RAMP_SEC);
      try {
        v.src.stop(time + RAMP_SEC + 0.001);
      } catch {
        // already stopped
      }
    }
    this.live.clear();
    for (const ch of PITCHED) {
      this.current[ch] = undefined;
      this.rampEnd[ch] = time + RAMP_SEC;
    }
  }

  /** Anchoring at or after the attack's end means the anchor equals the curve value: no step. */
  private release(v: Voice, t: number): void {
    const t0 = Math.max(t, v.attackEnd);
    v.env.gain.setValueAtTime(v.level, t0);
    v.env.gain.linearRampToValueAtTime(0, t0 + RAMP_SEC);
    try {
      v.src.stop(t0 + RAMP_SEC + 0.001);
    } catch {
      // already stopped
    }
  }
}
