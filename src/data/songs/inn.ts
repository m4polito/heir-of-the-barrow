import type { Song, Track } from '../../engine/audio/sequencer';

// "Inn": a three-second lullaby in F major, 16 rows at tempo 80, played once.
// One chord every four rows:
//   rows 0-3:   F major       (F, A, C)
//   rows 4-7:   B flat major  (B flat, D, F)
//   rows 8-11:  C major       (C, E, G)
//   rows 12-15: F major       (F, A, C)
// p1 sings a slow tune over it, p2 holds a chord tone (F, F, E, F), the E leading back to F, tri walks the bass.
// Everything is released at row 15.

type Row = string | null;

function rows(cells: Record<number, string>): Row[] {
  const out: Row[] = new Array<Row>(16).fill(null);
  for (const [i, note] of Object.entries(cells)) out[Number(i)] = note;
  return out;
}

const tracks: Track[] = [
  {
    channel: 'p1', duty: 0.25, vol: 8,
    rows: rows({ 0: 'C5', 2: 'A4', 4: 'A#4', 6: 'D5', 8: 'C5', 10: 'G4', 12: 'A4', 15: 'off' }),
  },
  {
    channel: 'p2', duty: 0.25, vol: 5,
    rows: rows({ 0: 'F4', 4: 'F4', 8: 'E4', 12: 'F4', 15: 'off' }),
  },
  {
    channel: 'tri', vol: 12,
    rows: rows({ 0: 'F2', 4: 'A#2', 8: 'C3', 12: 'F2', 15: 'off' }),
  },
];

export const INN_SONG: Song = { id: 'inn', tempo: 80, loop: false, tracks };
