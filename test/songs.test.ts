import { describe, it, expect } from 'vitest';
import { validateSong, rowDurationSec } from '../src/engine/audio/sequencer';
import { HOLLOWMERE_SONG } from '../src/data/songs/hollowmere';
import { SONGS } from '../src/data/songs';
import { noteToMidi } from '../src/engine/audio/notes';
import { INN_SONG } from '../src/data/songs/inn';
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

describe('SONGS.levelup', () => {
  const song = SONGS.levelup;
  const intervals = (rows: (string | null)[]) => {
    const m = rows.filter((c): c is string => c !== null && c !== 'off').map(noteToMidi);
    return m.slice(1).map((n, i) => n - m[i]!);
  };

  it('is a valid one-shot 10-row jingle at tempo 150', () => {
    expect(() => validateSong(song)).not.toThrow();
    expect(song.id).toBe('levelup');
    expect(song.tempo).toBe(150);
    expect(song.loop).toBe(false);
    expect(song.loopFrom).toBeUndefined();
    for (const t of song.tracks) expect(t.rows.length).toBe(10);
  });

  it('pins channels, duty and volume, with no noise', () => {
    expect(pinned(song)).toEqual([
      ['p1', 0.5, 11],
      ['p2', 0.25, 8],
      ['tri', undefined, 14],
    ]);
  });

  it('ends every track with off at or before row 9', () => {
    for (const t of song.tracks) {
      const last = lastNonNull(t.rows);
      expect(t.rows[last]).toBe('off');
      expect(last).toBeLessThanOrEqual(9);
    }
  });

  it('never steps through the victory figure (5, 4, 3 semitones) on p1 or p2', () => {
    for (const t of song.tracks.slice(0, 2)) {
      const a = intervals(t.rows);
      for (let k = 0; k + 3 <= a.length; k++) {
        expect(a.slice(k, k + 3), `${t.channel} window ${k}`).not.toEqual([5, 4, 3]);
      }
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

describe('marsh and battle development', () => {
  const sounded = (rows: (string | null)[]) => rows.filter((c): c is string => c !== null && c !== 'off');

  it('marsh p1 has at least three octave leaps', () => {
    const notes = sounded(SONGS.marsh.tracks[0]!.rows).map(noteToMidi);
    let leaps = 0;
    for (let i = 1; i < notes.length; i++) if (Math.abs(notes[i]! - notes[i - 1]!) === 12) leaps++;
    expect(leaps).toBeGreaterThanOrEqual(3);
  });

  it('marsh echo sounds alone: p1 is silent whenever p2 sounds in the phrase-end bars', () => {
    const [p1, p2] = SONGS.marsh.tracks;
    let s1 = false;
    let s2 = false;
    p1!.rows.forEach((_, r) => {
      const a = p1!.rows[r]!;
      const b = p2!.rows[r]!;
      if (a !== null) s1 = a !== 'off';
      if (b !== null) s2 = b !== 'off';
      if ([3, 7, 11, 15].includes(Math.floor(r / 16)) && s2) expect(s1, `row ${r}`).toBe(false);
    });
    expect(s1 || s2).toBe(false);
  });

  it('battle breaks the rhythm in at least three loop bars', () => {
    const rows = SONGS.battle.tracks[0]!.rows;
    let varied = 0;
    for (let b = 2; b <= 11; b++) {
      let hit = false;
      for (let r = b * 16; r < b * 16 + 16; r++) {
        const c = rows[r]!;
        if (c === 'off' || (c !== null && rows[r + 1] !== null && rows[r + 1] !== undefined)) hit = true;
      }
      if (hit) varied++;
    }
    expect(varied).toBeGreaterThanOrEqual(3);
  });
});

describe('INN_SONG', () => {
  it('is registered, valid, plays once, and lasts about three seconds', () => {
    expect(SONGS.inn).toBe(INN_SONG);
    expect(INN_SONG.id).toBe('inn');
    expect(() => validateSong(INN_SONG)).not.toThrow();
    expect(INN_SONG.loop).toBe(false);
    const sec = INN_SONG.tracks[0]!.rows.length * rowDurationSec(INN_SONG.tempo);
    expect(sec).toBeGreaterThanOrEqual(2.5);
    expect(sec).toBeLessThanOrEqual(3.5);
  });

  it('ends every pitched track with off', () => {
    for (const t of INN_SONG.tracks) {
      if (t.channel === 'noise') continue;
      const last = [...t.rows].reverse().find((r) => r !== null);
      expect(last).toBe('off');
    }
  });
});

describe('barrow and warden', () => {
  const soundedAt = (rows: (string | null)[]) =>
    rows.map((c, i) => [i, c] as const).filter(([, c]) => c !== null && c !== 'off') as [number, string][];
  const tick = (rows: (string | null)[]) => rows.map((c, i) => [i, c] as const).filter(([, c]) => c !== null);
  const byChannel = (song: (typeof SONGS)['barrow'], ch: string) => song.tracks.find((t) => t.channel === ch)!;

  for (const id of ['barrow', 'warden'] as const) {
    it(`${id} is a valid 128-row song looping from row 0`, () => {
      const song = SONGS[id];
      expect(() => validateSong(song)).not.toThrow();
      expect(song.id).toBe(id);
      expect(song.loopFrom).toBe(0);
      expect(song.loop).not.toBe(false);
      for (const t of song.tracks) expect(t.rows.length).toBe(128);
    });
  }

  it('barrow tempo and voices', () => {
    expect(SONGS.barrow.tempo).toBe(60);
    expect(pinned(SONGS.barrow)).toEqual([
      ['p1', 0.25, 6],
      ['p2', 0.125, 4],
      ['tri', undefined, expect.any(Number)],
      ['noise', undefined, expect.any(Number)],
    ]);
  });

  it('barrow triangle drone sounds only D2 (bars 1-4, 7-8) and C2 (bars 5-6)', () => {
    const tri = byChannel(SONGS.barrow, 'tri').rows;
    const notes = soundedAt(tri);
    for (const [row, n] of notes) {
      const bar = Math.floor(row / 16);
      expect(n, `row ${row}`).toBe(bar === 4 || bar === 5 ? 'C2' : 'D2');
    }
    expect(new Set(notes.map(([, n]) => n))).toEqual(new Set(['D2', 'C2']));
  });

  it('barrow pulse 1 sounds only in bars 2, 4 and 6 with the pinned figures', () => {
    const p1 = byChannel(SONGS.barrow, 'p1').rows;
    const bars = (b: number) => soundedAt(p1.slice(b * 16, b * 16 + 16)).map(([, n]) => n);
    for (let b = 0; b < 8; b++) {
      if (b === 1 || b === 5) expect(bars(b)).toEqual(['D4', 'F4', 'E4']);
      else if (b === 3) expect(bars(b)).toEqual(['D4', 'F4', 'A4']);
      else expect(bars(b), `bar ${b + 1}`).toEqual([]);
    }
  });

  it('barrow pulse 2 answers once, with a held A3 in bar 8, and releases before the loop', () => {
    const p2 = byChannel(SONGS.barrow, 'p2').rows;
    expect(soundedAt(p2)).toHaveLength(1);
    const [row, n] = soundedAt(p2)[0]!;
    expect(n).toBe('A3');
    expect(Math.floor(row / 16)).toBe(7);
    expect(p2[127]).toBe('off');
  });

  it('barrow noise has 8 to 14 ticks and no equal gaps within a bar', () => {
    const ticks = tick(byChannel(SONGS.barrow, 'noise').rows).map(([i]) => i);
    expect(ticks.length).toBeGreaterThanOrEqual(8);
    expect(ticks.length).toBeLessThanOrEqual(14);
    for (let b = 0; b < 8; b++) {
      const inBar = ticks.filter((r) => Math.floor(r / 16) === b);
      const gaps = inBar.slice(1).map((r, i) => r - inBar[i]!);
      expect(new Set(gaps).size, `bar ${b + 1} gaps ${gaps}`).toBe(gaps.length);
    }
  });

  it('warden pulse 1 opens with BATTLE_MOTIF an octave down, at twice the battle theme gaps', () => {
    const down = BATTLE_MOTIF.map((n) => n.replace(/\d+$/, (o) => String(Number(o) - 1)));
    const p1 = soundedAt(byChannel(SONGS.warden, 'p1').rows).slice(0, BATTLE_MOTIF.length);
    expect(p1.map(([, n]) => n)).toEqual(down);
    const battle = soundedAt(SONGS.battle.tracks[0]!.rows.slice(32)).slice(0, BATTLE_MOTIF.length);
    const gaps = (a: [number, string][]) => a.slice(1).map(([r], i) => r - a[i]![0]);
    expect(gaps(p1)).toEqual(gaps(battle).map((g) => g * 2));
  });

  it('warden returns to the motif in bar 5', () => {
    const rows = byChannel(SONGS.warden, 'p1').rows.slice(64, 80);
    expect(soundedAt(rows).slice(0, 4).map(([, n]) => n)).toEqual(['A3', 'C4', 'E4', 'F4']);
  });

  it('warden triangle plays each bar root on every beat, below C3', () => {
    const roots = ['A', 'A', 'F', 'E', 'A', 'D', 'A#', 'E'];
    const tri = byChannel(SONGS.warden, 'tri').rows;
    for (let b = 0; b < 8; b++) {
      for (const r of [0, 4, 8, 12]) {
        const n = tri[b * 16 + r];
        expect(n, `bar ${b + 1} beat ${r / 4 + 1}`).not.toBeNull();
        expect(n!.replace(/\d+$/, '')).toBe(roots[b]);
        expect(noteToMidi(n!)).toBeLessThan(noteToMidi('C3'));
      }
    }
    for (const [, n] of soundedAt(tri)) expect(noteToMidi(n)).toBeLessThan(noteToMidi('C3'));
  });

  it('warden pulse 2 holds two long chord tones per bar', () => {
    const p2 = byChannel(SONGS.warden, 'p2').rows;
    for (let b = 0; b < 8; b++) {
      const bar = soundedAt(p2.slice(b * 16, b * 16 + 16));
      expect(bar.map(([r]) => r), `bar ${b + 1}`).toEqual([0, 8]);
    }
  });

  it('warden noise: kick on every beat but 3, snare on beat 3', () => {
    const noise = byChannel(SONGS.warden, 'noise').rows;
    for (let b = 0; b < 8; b++) {
      expect([0, 4, 8, 12].map((r) => noise[b * 16 + r])).toEqual(['k', 'k', 's', 'k']);
    }
  });

  it('warden is slower than the battle theme', () => {
    expect(SONGS.warden.tempo).toBe(104);
    expect(SONGS.warden.tempo).toBeLessThan(SONGS.battle.tempo);
  });
});
