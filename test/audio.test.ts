import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readMutePref, AudioManager } from '../src/engine/audio/audio';
import { Sequencer, type Song } from '../src/engine/audio/sequencer';

describe('readMutePref', () => {
  it('reads the stored flag defensively', () => {
    expect(readMutePref({ getItem: () => '1' })).toBe(true);
    expect(readMutePref({ getItem: () => '0' })).toBe(false);
    expect(readMutePref({ getItem: () => null })).toBe(false);
    expect(readMutePref({ getItem: () => { throw new Error('x'); } })).toBe(false);
    expect(readMutePref(null)).toBe(false);
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
    } as Storage);
    expect(audio.muted).toBe(false);
    expect(audio.toggleMute()).toBe(true);
    expect(store.get('dimming.mute')).toBe('1');
    expect(audio.toggleMute()).toBe(false);
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
});
