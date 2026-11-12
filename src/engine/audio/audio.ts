import { Apu } from './apu';
import { Sequencer, type Song } from './sequencer';

export const MUTE_KEY = 'dimming.mute';

export function readMutePref(storage: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return storage?.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

const FADE_SEC = 0.02;
const LEAD_SEC = 0.05;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private songGain: GainNode | null = null;
  private sequencer: Sequencer | null = null;
  private pending: Song | null = null;
  private mutedPref: boolean;

  constructor(private readonly storage: Storage | null) {
    this.mutedPref = readMutePref(storage);
  }

  get unlocked(): boolean {
    return this.ctx !== null;
  }

  get muted(): boolean {
    return this.mutedPref;
  }

  /** Must be called synchronously from a user-gesture handler (Safari). */
  unlock(): void {
    if (this.ctx) return;
    const ctx = new AudioContext();
    void ctx.resume();
    const master = ctx.createGain();
    master.gain.value = this.mutedPref ? 0 : 1;
    master.connect(ctx.destination);
    const songGain = ctx.createGain();
    songGain.connect(master);
    const apu = new Apu(ctx, songGain);
    const sequencer = new Sequencer(apu);
    this.ctx = ctx;
    this.master = master;
    this.songGain = songGain;
    this.sequencer = sequencer;
    setInterval(() => sequencer.schedule(ctx.currentTime + 0.1), 25);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void ctx.resume();
      });
    }
    if (this.pending) {
      const song = this.pending;
      this.pending = null;
      this.playSong(song);
    }
  }

  installUnlockListener(target: Window): void {
    const onKey = () => {
      this.unlock();
      target.removeEventListener('pointerdown', onPtr);
    };
    const onPtr = () => {
      this.unlock();
      target.removeEventListener('keydown', onKey);
    };
    target.addEventListener('keydown', onKey, { once: true });
    target.addEventListener('pointerdown', onPtr, { once: true });
  }

  playSong(song: Song): void {
    const { ctx, songGain, sequencer } = this;
    if (!ctx || !songGain || !sequencer) {
      this.pending = song;
      return;
    }
    const now = ctx.currentTime;
    let start = now + LEAD_SEC;
    if (sequencer.playing) {
      songGain.gain.setValueAtTime(1, now);
      songGain.gain.linearRampToValueAtTime(0, now + FADE_SEC);
      sequencer.stop(now + FADE_SEC);
      songGain.gain.setValueAtTime(0, start - 0.001);
      songGain.gain.setValueAtTime(1, start);
    }
    sequencer.play(song, start);
  }

  stopSong(): void {
    this.pending = null;
    const { ctx, songGain, sequencer } = this;
    if (!ctx || !songGain || !sequencer) return;
    const now = ctx.currentTime;
    songGain.gain.setValueAtTime(1, now);
    songGain.gain.linearRampToValueAtTime(0, now + FADE_SEC);
    sequencer.stop(now + FADE_SEC);
    songGain.gain.setValueAtTime(1, now + FADE_SEC + 0.001);
  }

  toggleMute(): boolean {
    this.mutedPref = !this.mutedPref;
    try {
      this.storage?.setItem(MUTE_KEY, this.mutedPref ? '1' : '0');
    } catch {
      // storage unavailable; preference lives in memory only
    }
    if (this.master) this.master.gain.value = this.mutedPref ? 0 : 1;
    return this.mutedPref;
  }
}
