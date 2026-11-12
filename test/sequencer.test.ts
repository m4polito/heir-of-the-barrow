import { describe, it, expect } from 'vitest';
import { Sequencer, validateSong, rowDurationSec, type Song } from '../src/engine/audio/sequencer';
import type { ApuLike } from '../src/engine/audio/apu';

interface Call { kind: string; ch?: string; freq?: number; time: number; vol?: number; duty?: number; preset?: string }

class FakeApu implements ApuLike {
  calls: Call[] = [];
  noteOn(ch: string, freq: number, time: number, opts: { duty?: number; vol: number }) {
    this.calls.push({ kind: 'on', ch, freq, time, vol: opts.vol, duty: opts.duty });
  }
  noteOff(ch: string, time: number) { this.calls.push({ kind: 'off', ch, time }); }
  noiseHit(preset: string, time: number, vol: number) { this.calls.push({ kind: 'noise', preset, time, vol }); }
  stopAll(time: number) { this.calls.push({ kind: 'stop', time }); }
}

const C4 = 261.63;
const D4 = 293.66;

describe('sequencer', () => {
  it('emits note rows with exact times and holds on null', () => {
    const apu = new FakeApu();
    const seq = new Sequencer(apu);
    const song: Song = { id: 's', tempo: 120, tracks: [{ channel: 'p1', rows: ['C4', null, 'off', 'E4'] }] };
    seq.play(song, 10);
    seq.schedule(10.4);
    expect(apu.calls).toHaveLength(4);
    expect(apu.calls[0]).toMatchObject({ kind: 'stop' });
    expect(apu.calls[0]!.time).toBeCloseTo(10, 2);
    expect(apu.calls[1]).toMatchObject({ kind: 'on', ch: 'p1', vol: 12, duty: 0.5 });
    expect(apu.calls[1]!.freq).toBeCloseTo(261.63, 2);
    expect(apu.calls[1]!.time).toBeCloseTo(10.0, 2);
    expect(apu.calls[2]).toMatchObject({ kind: 'off' });
    expect(apu.calls[2]!.time).toBeCloseTo(10.25, 2);
    expect(apu.calls[3]!.freq).toBeCloseTo(329.63, 2);
    expect(apu.calls[3]!.time).toBeCloseTo(10.375, 2);
  });

  it('loops from row 0', () => {
    const apu = new FakeApu();
    const seq = new Sequencer(apu);
    expect(rowDurationSec(240)).toBeCloseTo(0.0625, 5);
    seq.play({ id: 's', tempo: 240, tracks: [{ channel: 'p1', rows: ['C4', 'D4'] }] }, 10);
    seq.schedule(10.2);
    const ons = apu.calls.filter((c) => c.kind === 'on');
    expect(ons).toHaveLength(4);
    [10, 10.0625, 10.125, 10.1875].forEach((t, i) => {
      expect(ons[i]!.time).toBeCloseTo(t, 2);
      expect(ons[i]!.freq).toBeCloseTo(i % 2 === 0 ? C4 : D4, 2);
    });
  });

  it('loopFrom 1 repeats only D4', () => {
    const apu = new FakeApu();
    const seq = new Sequencer(apu);
    seq.play({ id: 's', tempo: 240, loopFrom: 1, tracks: [{ channel: 'p1', rows: ['C4', 'D4'] }] }, 10);
    seq.schedule(10.2);
    const ons = apu.calls.filter((c) => c.kind === 'on');
    expect(ons).toHaveLength(4);
    expect(ons[0]!.freq).toBeCloseTo(C4, 2);
    for (const o of ons.slice(1)) expect(o.freq).toBeCloseTo(D4, 2);
  });

  it('noise rows emit noiseHit with track vol', () => {
    const apu = new FakeApu();
    const seq = new Sequencer(apu);
    seq.play({ id: 's', tempo: 120, tracks: [{ channel: 'noise', vol: 9, rows: ['k', null, 's'] }] }, 5);
    seq.schedule(5.3);
    const hits = apu.calls.filter((c) => c.kind === 'noise');
    expect(hits).toHaveLength(2);
    expect(hits[0]).toMatchObject({ preset: 'k', vol: 9 });
    expect(hits[0]!.time).toBeCloseTo(5, 2);
    expect(hits[1]).toMatchObject({ preset: 's', vol: 9 });
    expect(hits[1]!.time).toBeCloseTo(5 + 2 * rowDurationSec(120), 2);
  });

  it('validateSong rejects bad songs', () => {
    const t = (rows: (string | null)[]) => ({ channel: 'p1' as const, rows });
    expect(() => validateSong({ id: 's', tempo: 120, tracks: [t(['C4']), t(['C4', 'D4'])] })).toThrow();
    expect(() => validateSong({ id: 's', tempo: 120, tracks: [t(['X9'])] })).toThrow(/track 0.*row 0/);
    expect(() => validateSong({ id: 's', tempo: 120, loopFrom: 2, tracks: [t(['C4', 'D4'])] })).toThrow();
    expect(() => validateSong({ id: 's', tempo: 120, tracks: [{ channel: 'noise', rows: ['q'] }] })).toThrow();
    expect(() => validateSong({ id: 's', tempo: 120, tracks: [t([])] })).toThrow();
    expect(() => validateSong({ id: 's', tempo: 120, tracks: [t(['C4', 'off', null])] })).not.toThrow();
  });

  it('schedule twice with same untilTime emits nothing new', () => {
    const apu = new FakeApu();
    const seq = new Sequencer(apu);
    seq.play({ id: 's', tempo: 120, tracks: [{ channel: 'p1', rows: ['C4', 'D4'] }] }, 0);
    seq.schedule(1);
    const n = apu.calls.length;
    seq.schedule(1);
    expect(apu.calls).toHaveLength(n);
  });

  it('loop: false plays once and ends without stopAll', () => {
    const apu = new FakeApu();
    const seq = new Sequencer(apu);
    const rows = ['C4', 'D4', 'E4', 'off'];
    seq.play({ id: 's', tempo: 240, loop: false, tracks: [{ channel: 'p1', rows }] }, 0);
    seq.schedule(100);
    expect(apu.calls.filter((c) => c.kind === 'on')).toHaveLength(3);
    expect(apu.calls.filter((c) => c.kind === 'off')).toHaveLength(1);
    expect(apu.calls.filter((c) => c.kind === 'stop')).toHaveLength(1);
    expect(seq.playing).toBe(false);
    const n = apu.calls.length;
    seq.schedule(200);
    expect(apu.calls).toHaveLength(n);
  });

  it('without loop the song restarts at row 0', () => {
    const apu = new FakeApu();
    const seq = new Sequencer(apu);
    seq.play({ id: 's', tempo: 240, tracks: [{ channel: 'p1', rows: ['C4', 'D4', 'E4', 'off'] }] }, 0);
    seq.schedule(1);
    const ons = apu.calls.filter((c) => c.kind === 'on');
    expect(ons.filter((c) => Math.abs(c.freq! - C4) < 0.1).length).toBeGreaterThan(1);
    expect(seq.playing).toBe(true);
  });

  it('validateSong rejects loop: false with loopFrom', () => {
    expect(() => validateSong({ id: 's', tempo: 120, loop: false, loopFrom: 0, tracks: [{ channel: 'p1', rows: ['C4', 'D4', 'off'] }] }))
      .toThrow('song s: loopFrom is meaningless when loop is false');
  });

  it('validateSong requires non-looping tonal tracks to end with off', () => {
    const song = (rows: (string | null)[]) => ({ id: 's', tempo: 120, loop: false, tracks: [{ channel: 'p1' as const, rows }] });
    expect(() => validateSong(song(['C4', 'D4', 'off', null]))).not.toThrow();
    expect(() => validateSong(song(['C4', 'D4']))).toThrow("song s: track 0 must end with 'off' (non-looping)");
    expect(() => validateSong({ id: 's', tempo: 120, loop: false, tracks: [{ channel: 'noise', rows: ['k', 's'] }] })).not.toThrow();
    expect(() => validateSong({ id: 's', tempo: 120, tracks: [{ channel: 'p1', rows: ['C4', 'D4'] }] })).not.toThrow();
  });

  it('stop calls stopAll and ends playing', () => {
    const apu = new FakeApu();
    const seq = new Sequencer(apu);
    seq.play({ id: 's', tempo: 120, tracks: [{ channel: 'p1', rows: ['C4'] }] }, 0);
    expect(seq.playing).toBe(true);
    seq.stop(2);
    expect(seq.playing).toBe(false);
    expect(apu.calls.at(-1)).toMatchObject({ kind: 'stop', time: 2 });
  });
});
