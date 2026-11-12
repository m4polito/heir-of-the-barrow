export type Channel = 'p1' | 'p2' | 'tri' | 'noise';
export type Duty = 0.125 | 0.25 | 0.5;
export type NoisePreset = 'k' | 's' | 'h';

export interface ApuLike {
  noteOn(ch: Exclude<Channel, 'noise'>, freq: number, time: number, opts: { duty?: Duty; vol: number }): void;
  noteOff(ch: Exclude<Channel, 'noise'>, time: number): void;
  noiseHit(preset: NoisePreset, time: number, vol: number): void;
  stopAll(time: number): void;
}

type Pitched = Exclude<Channel, 'noise'>;

const RAMP_SEC = 0.003;
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
  private readonly duty: Record<Pitched, Duty> = { p1: 0.5, p2: 0.5, tri: 0.5 };
  private readonly waves = new Map<Duty, PeriodicWave>();
  private readonly noiseFilter: BiquadFilterNode;
  private readonly noiseGain: GainNode;

  constructor(ctx: AudioContext, destination: AudioNode) {
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

    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0;
    src.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(destination);
    src.start();
  }

  noteOn(ch: Pitched, freq: number, time: number, opts: { duty?: Duty; vol: number }): void {
    if (ch !== 'tri') {
      const duty = opts.duty ?? this.duty[ch];
      if (duty !== this.duty[ch]) {
        this.osc[ch].setPeriodicWave(this.waves.get(duty)!);
        this.duty[ch] = duty;
      }
    }
    this.osc[ch].frequency.setValueAtTime(freq, time);
    this.ramp(ch, (opts.vol / 15) * MAX_GAIN, time);
  }

  noteOff(ch: Pitched, time: number): void {
    this.ramp(ch, 0, time);
  }

  noiseHit(preset: NoisePreset, time: number, vol: number): void {
    const p = NOISE_PRESETS[preset];
    this.noiseFilter.type = p.type;
    this.noiseFilter.frequency.setValueAtTime(p.freq, time);
    const g = this.noiseGain.gain;
    g.setValueAtTime(0, time);
    g.linearRampToValueAtTime((vol / 15) * MAX_GAIN, time + RAMP_SEC);
    g.exponentialRampToValueAtTime(0.0001, time + p.decay);
    g.setValueAtTime(0, time + p.decay + 0.001);
  }

  stopAll(time: number): void {
    for (const ch of PITCHED) this.ramp(ch, 0, time);
    this.noiseGain.gain.setValueAtTime(0, time);
  }

  private ramp(ch: Pitched, target: number, time: number): void {
    const g = this.gain[ch].gain;
    g.setValueAtTime(this.lastGain[ch], time);
    g.linearRampToValueAtTime(target, time + RAMP_SEC);
    this.lastGain[ch] = target;
  }
}
