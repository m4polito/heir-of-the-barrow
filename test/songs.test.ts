import { describe, it, expect } from 'vitest';
import { validateSong } from '../src/engine/audio/sequencer';
import { HOLLOWMERE_SONG } from '../src/data/songs/hollowmere';
import { SONGS } from '../src/data/songs';
import { BATTLE_MOTIF } from '../src/data/songs/battle';

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

function pinned(song: { tracks: { channel: string; duty?: number; vol?: number }[] }) {
  return song.tracks.map((t) => [t.channel, t.duty, t.vol]);
}

function lastNonNull(rows: (string | null)[]): number {
  for (let i = rows.length - 1; i >= 0; i--) if (rows[i] !== null) return i;
  return -1;
}

describe('SONGS.marsh', () => {
  const song = SONGS.marsh;

  it('is a valid 16-bar looping song at tempo 96', () => {
    expect(() => validateSong(song)).not.toThrow();
    expect(song.id).toBe('marsh');
    expect(song.tempo).toBe(96);
    expect(song.loopFrom).toBe(0);
    for (const t of song.tracks) expect(t.rows.length).toBe(256);
  });

  it('pins channels, duty and volume', () => {
    expect(pinned(song)).toEqual([
      ['p1', 0.25, 10],
      ['p2', 0.125, 6],
      ['tri', undefined, 14],
      ['noise', undefined, 4],
    ]);
  });

  it('walks: tri has a note on rows 0, 4, 8 and 12 of every bar', () => {
    const tri = song.tracks[2]!.rows;
    for (let b = 0; b < 16; b++) {
      for (const r of [0, 4, 8, 12]) {
        const cell = tri[b * 16 + r];
        expect(cell !== null && cell !== 'off').toBe(true);
      }
    }
  });
});

describe('SONGS.battle', () => {
  const song = SONGS.battle;

  it('is a valid 12-bar song at tempo 152 looping from row 32', () => {
    expect(() => validateSong(song)).not.toThrow();
    expect(song.id).toBe('battle');
    expect(song.tempo).toBe(152);
    expect(song.loopFrom).toBe(32);
    for (const t of song.tracks) expect(t.rows.length).toBe(192);
  });

  it('pins channels, duty and volume', () => {
    expect(pinned(song)).toEqual([
      ['p1', 0.25, 11],
      ['p2', 0.125, 7],
      ['tri', undefined, 14],
      ['noise', undefined, 7],
    ]);
  });

  it('states BATTLE_MOTIF on p1 from row 32', () => {
    expect(BATTLE_MOTIF.length).toBeGreaterThanOrEqual(4);
    expect(BATTLE_MOTIF.length).toBeLessThanOrEqual(6);
    const sounded = song.tracks[0]!.rows.slice(32).filter((c) => c !== null && c !== 'off');
    expect(sounded.slice(0, BATTLE_MOTIF.length)).toEqual(BATTLE_MOTIF);
  });
});

describe('SONGS.victory', () => {
  const song = SONGS.victory;

  it('is a valid one-shot 24-row fanfare at tempo 150', () => {
    expect(() => validateSong(song)).not.toThrow();
    expect(song.id).toBe('victory');
    expect(song.tempo).toBe(150);
    expect(song.loop).toBe(false);
    expect(song.loopFrom).toBeUndefined();
    for (const t of song.tracks) expect(t.rows.length).toBe(24);
  });

  it('pins channels, duty and volume, with no noise', () => {
    expect(pinned(song)).toEqual([
      ['p1', 0.5, 11],
      ['p2', 0.25, 8],
      ['tri', undefined, 14],
    ]);
  });

  it('releases every track by row 20', () => {
    for (const t of song.tracks) {
      const last = lastNonNull(t.rows);
      expect(t.rows[last]).toBe('off');
      expect(last).toBeLessThanOrEqual(20);
    }
  });
});

describe('SONGS.fallen', () => {
  const song = SONGS.fallen;

  it('is a valid one-shot 12-row phrase at tempo 72', () => {
    expect(() => validateSong(song)).not.toThrow();
    expect(song.id).toBe('fallen');
    expect(song.tempo).toBe(72);
    expect(song.loop).toBe(false);
    expect(song.loopFrom).toBeUndefined();
    for (const t of song.tracks) expect(t.rows.length).toBe(12);
  });

  it('pins channels, duty and volume, with no noise', () => {
    expect(pinned(song)).toEqual([
      ['p1', 0.5, 10],
      ['p2', 0.25, 6],
      ['tri', undefined, 13],
    ]);
  });

  it('ends every track with off', () => {
    for (const t of song.tracks) expect(t.rows[lastNonNull(t.rows)]).toBe('off');
  });
});
