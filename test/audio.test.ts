import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readMutePref, AudioManager } from '../src/engine/audio/audio';
import { SfxPlayer } from '../src/engine/audio/sfx';
import { SFX } from '../src/data/sfx';
import { Sequencer, type Song } from '../src/engine/audio/sequencer';

describe('readMutePref', () => {
  it('reads the stored flag defensively', () => {
    expect(readMutePref({ getItem: () => '1' }, 'k')).toBe(true);
    expect(readMutePref({ getItem: () => '0' }, 'k')).toBe(false);
    expect(readMutePref({ getItem: () => null }, 'k')).toBe(false);
    expect(readMutePref({ getItem: () => { throw new Error('x'); } }, 'k')).toBe(false);
    expect(readMutePref(null, 'k')).toBe(false);
    expect(readMutePref({ getItem: () => '1' })).toBe(false);
  });
});

describe('AudioManager', () => {
  let constructed = 0;
  beforeEach(() => {
    constructed = 0;
    vi.useFakeTimers();
    const param = () => ({ value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} });
    vi.stubGlobal('AudioContext', class {
      currentTime = 0;
      destination = {};
      sampleRate = 44100;
      state = 'running';
      constructor() { constructed++; }
      resume() { return Promise.resolve(); }
      createGain() { return { gain: param(), connect() {} }; }
      createOscillator() { return { type: 'sine', frequency: param(), setPeriodicWave() {}, connect() {}, start() {} }; }
      createPeriodicWave() { return {}; }
      createBuffer() { return { getChannelData() { return new Float32Array(16); } }; }
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('unlocks synchronously inside the keydown handler, once', async () => {
    const handlers: Record<string, () => void> = {};
    const removed: string[] = [];
    const win = {
      addEventListener: (t: string, h: () => void) => { handlers[t] = h; },
      removeEventListener: (t: string) => { removed.push(t); },
    } as unknown as Window;
    const audio = new AudioManager(null);
    audio.installUnlockListener(win);
    expect(Object.keys(handlers).sort()).toEqual(['keydown', 'pointerdown', 'pointerup']);
    expect(audio.unlocked).toBe(false);
    handlers.keydown!();
    expect(audio.unlocked).toBe(true);
    expect(constructed).toBe(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(removed.sort()).toEqual(['keydown', 'pointerdown', 'pointerup']);
    handlers.keydown!();
    expect(constructed).toBe(1);
  });

  it('toggleMute flips pref and persists', () => {
    const store = new Map<string, string>();
    const audio = new AudioManager({
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
    } as Storage, { muteKey: 'test.mute' });
    expect(audio.muted).toBe(false);
    expect(audio.toggleMute()).toBe(true);
    expect(store.get('test.mute')).toBe('1');
    expect(audio.toggleMute()).toBe(false);
  });

  it('toggleMute does not touch storage without a muteKey', () => {
    const store = new Map<string, string>();
    const audio = new AudioManager({
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
    } as Storage);
    expect(audio.toggleMute()).toBe(true);
    expect(store.size).toBe(0);
  });

  it('playSong is a no-op for the song already playing', () => {
    let isPlaying = false;
    vi.spyOn(Sequencer.prototype, 'playing', 'get').mockImplementation(() => isPlaying);
    const play = vi.spyOn(Sequencer.prototype, 'play').mockImplementation(() => { isPlaying = true; });
    const a = { id: 'a' } as unknown as Song;
    const b = { id: 'b' } as unknown as Song;
    const audio = new AudioManager(null);
    audio.unlock();
    audio.playSong(a);
    audio.playSong(a);
    expect(play).toHaveBeenCalledTimes(1);
    audio.playSong(b);
    expect(play).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });

  it('playSfx is a no-op before unlock', () => {
    const audio = new AudioManager(null);
    expect(() => audio.playSfx('blip')).not.toThrow();
  });

  it('playSfx plays the effect after unlock', () => {
    const play = vi.spyOn(SfxPlayer.prototype, 'play').mockImplementation(() => {});
    const audio = new AudioManager(null);
    audio.unlock();
    audio.playSfx('blip');
    expect(play).toHaveBeenCalledTimes(1);
    expect(play.mock.calls[0]![0]).toBe(SFX.blip);
  });

  describe('blip priority', () => {
    function setup() {
      const play = vi.spyOn(SfxPlayer.prototype, 'play').mockImplementation(() => {});
      const audio = new AudioManager(null);
      audio.unlock();
      const clock = (audio as unknown as { ctx: { currentTime: number } }).ctx;
      return { play, audio, clock };
    }
    const dur = (id: keyof typeof SFX) => SFX[id].reduce((n, s) => n + s.frames, 0) / 60;

    it('drops a blip while another effect is sounding', () => {
      const { play, audio } = setup();
      audio.playSfx('menuConfirm');
      audio.playSfx('blip');
      expect(play).toHaveBeenCalledTimes(1);
      expect(play.mock.calls[0]![0]).toBe(SFX.menuConfirm);
    });
    it('plays a blip once the effect has finished', () => {
      const { play, audio, clock } = setup();
      audio.playSfx('menuConfirm');
      clock.currentTime = dur('menuConfirm') + 0.01;
      audio.playSfx('blip');
      expect(play).toHaveBeenCalledTimes(2);
      expect(play.mock.calls[1]![0]).toBe(SFX.blip);
    });
    it('blips do not block each other', () => {
      const { play, audio } = setup();
      audio.playSfx('blip');
      audio.playSfx('blip');
      expect(play).toHaveBeenCalledTimes(2);
    });
  });
});
