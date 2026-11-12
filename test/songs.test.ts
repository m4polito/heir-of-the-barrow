import { describe, it, expect } from 'vitest';
import { validateSong } from '../src/engine/audio/sequencer';
import { HOLLOWMERE_SONG } from '../src/data/songs/hollowmere';
import { SONGS } from '../src/data/songs';

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

describe('SONGS.title', () => {
  const song = SONGS.title;

  it('is a valid 16-bar 4/4 song at tempo 84', () => {
    expect(() => validateSong(song)).not.toThrow();
    expect(song.tempo).toBe(84);
    for (const t of song.tracks) expect(t.rows.length).toBe(256);
  });

  it('has p1, p2 and tri only, looping from the start', () => {
    expect(song.tracks.map((t) => t.channel)).toEqual(['p1', 'p2', 'tri']);
    expect([undefined, 0]).toContain(song.loopFrom);
  });

  it('pins each track channel, duty and volume', () => {
    const [p1, p2, tri] = song.tracks;
    expect([p1!.channel, p1!.duty, p1!.vol]).toEqual(['p1', 0.5, 11]);
    expect([p2!.channel, p2!.duty, p2!.vol]).toEqual(['p2', 0.25, 7]);
    expect([tri!.channel, tri!.duty, tri!.vol]).toEqual(['tri', undefined, 15]);
  });

  it('ends the drone on F2 so the last bar sounds as F', () => {
    expect(song.tracks[2]!.rows[240]).toBe('F2');
  });
});
