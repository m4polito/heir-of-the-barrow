import { Apu } from './apu';
import { SfxPlayer } from './sfx';
import { SFX, type SfxId } from '../../data/sfx';
import { Sequencer, type Song } from './sequencer';

export function readMutePref(storage: Pick<Storage, 'getItem'> | null, key?: string): boolean {
  if (key === undefined) return false;
  try {
    return storage?.getItem(key) === '1';
  } catch {
    return false;
  }
}

/** Music sits about 6 dB under effects. */
export const SONG_LEVEL = 0.5;
const FADE_SEC = 0.02;
const LEAD_SEC = 0.05;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  /** Overall output level when unmuted (about -12 dB). Owner found 1.0 painfully loud. */
  static readonly MASTER_LEVEL = 0.25;
  private songGain: GainNode | null = null;
  private sequencer: Sequencer | null = null;
  private sfxApu: Apu | null = null;
  private sfx: SfxPlayer | null = null;
  private pending: Song | null = null;
  private currentSongId: string | null = null;
  private mutedPref: boolean;
  /** Audio-clock time until which a non-blip effect is still sounding. */
  private sfxBusyUntil = 0;

  private readonly muteKey: string | undefined;

  constructor(
    private readonly storage: Storage | null,
    opts: { muteKey?: string } = {},
  ) {
    this.muteKey = opts.muteKey;
    this.mutedPref = readMutePref(storage, this.muteKey);
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
    void ctx.resume().catch(() => {});
    const master = ctx.createGain();
    master.gain.value = this.mutedPref ? 0 : AudioManager.MASTER_LEVEL;
    master.connect(ctx.destination);
    const songGain = ctx.createGain();
    songGain.gain.value = SONG_LEVEL;
    songGain.connect(master);
    const apu = new Apu(ctx, songGain);
    const sequencer = new Sequencer(apu);
    const sfxGain = ctx.createGain();
    sfxGain.gain.value = 1;
    sfxGain.connect(master);
    this.sfxApu = new Apu(ctx, sfxGain);
    this.sfx = new SfxPlayer(this.sfxApu);
    this.ctx = ctx;
    this.master = master;
    this.songGain = songGain;
    this.sequencer = sequencer;
    setInterval(() => sequencer.schedule(ctx.currentTime + 0.1), 25);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void ctx.resume().catch(() => {});
      });
    }
    if (this.pending) {
      const song = this.pending;
      this.pending = null;
      this.currentSongId = null;
      this.playSong(song);
    }
  }

  installUnlockListener(target: Window): void {
    const removeAll = () => {
      target.removeEventListener('keydown', onGesture);
      target.removeEventListener('pointerdown', onGesture);
      target.removeEventListener('pointerup', onGesture);
    };
    const onGesture = () => {
      this.unlock();
      void this.ctx?.resume().then(() => {
        if (this.ctx?.state === 'running') removeAll();
      }).catch(() => {});
    };
    target.addEventListener('keydown', onGesture);
    target.addEventListener('pointerdown', onGesture);
    target.addEventListener('pointerup', onGesture);
  }

  playSong(song: Song): void {
    const { ctx, songGain, sequencer } = this;
    if (this.currentSongId === song.id && (this.pending !== null || sequencer?.playing)) return;
    this.currentSongId = song.id;
    if (!ctx || !songGain || !sequencer) {
      this.pending = song;
      return;
    }
    const now = ctx.currentTime;
    let start = now + LEAD_SEC;
    if (sequencer.playing) {
      songGain.gain.setValueAtTime(SONG_LEVEL, now);
      songGain.gain.linearRampToValueAtTime(0, now + FADE_SEC);
      sequencer.stop(now + FADE_SEC);
      songGain.gain.setValueAtTime(0, start - 0.001);
    }
    songGain.gain.setValueAtTime(SONG_LEVEL, start);
    sequencer.play(song, start);
  }

  playSfx(id: SfxId): void {
    if (!this.ctx || !this.sfx) return;
    const t = this.ctx.currentTime + 0.005;
    // A text blip must not cut off a longer effect that is still sounding.
    if (id === 'blip' && t < this.sfxBusyUntil) return;
    const steps = SFX[id];
    this.sfx.play(steps, t);
    this.sfxBusyUntil = id === 'blip' ? 0 : t + steps.reduce((n, s) => n + s.frames, 0) / 60;
  }

  stopSong(): void {
    this.pending = null;
    this.currentSongId = null;
    const { ctx, songGain, sequencer } = this;
    if (!ctx || !songGain || !sequencer) return;
    const now = ctx.currentTime;
    songGain.gain.setValueAtTime(SONG_LEVEL, now);
    songGain.gain.linearRampToValueAtTime(0, now + FADE_SEC);
    sequencer.stop(now + FADE_SEC);
  }

  toggleMute(): boolean {
    this.mutedPref = !this.mutedPref;
    try {
      if (this.muteKey !== undefined) this.storage?.setItem(this.muteKey, this.mutedPref ? '1' : '0');
    } catch {
      // storage unavailable; preference lives in memory only
    }
    if (this.master) {
      this.master.gain.setTargetAtTime(this.mutedPref ? 0 : AudioManager.MASTER_LEVEL, this.ctx!.currentTime, 0.01);
    }
    return this.mutedPref;
  }
}
