import { describe, it, expect } from 'vitest';
import { validateSong } from '../src/engine/audio/sequencer';
import { HOLLOWMERE_SONG } from '../src/data/songs/hollowmere';

describe('HOLLOWMERE_SONG', () => {
  it('is a valid song', () => {
    expect(HOLLOWMERE_SONG.id).toBe('hollowmere');
    expect(() => validateSong(HOLLOWMERE_SONG)).not.toThrow();
  });

  it('has equal-length tracks, whole 3/4 bars, at least 16 bars', () => {
    const counts = HOLLOWMERE_SONG.tracks.map((t) => t.rows.length);
    expect(new Set(counts).size).toBe(1);
    expect(counts[0]! % 12).toBe(0);
    expect(counts[0]!).toBeGreaterThanOrEqual(192);
  });

  it('has one p1, one p2, one tri and at most one noise track', () => {
    const n = (c: string) => HOLLOWMERE_SONG.tracks.filter((t) => t.channel === c).length;
    expect(n('p1')).toBe(1);
    expect(n('p2')).toBe(1);
    expect(n('tri')).toBe(1);
    expect(n('noise')).toBeLessThanOrEqual(1);
  });

  it('loops from the start at a sane tempo', () => {
    expect([undefined, 0]).toContain(HOLLOWMERE_SONG.loopFrom);
    expect(HOLLOWMERE_SONG.tempo).toBeGreaterThanOrEqual(100);
    expect(HOLLOWMERE_SONG.tempo).toBeLessThanOrEqual(150);
  });
});
