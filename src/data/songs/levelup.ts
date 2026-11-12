import type { Song, Track } from '../../engine/audio/sequencer';

// "Level up": a one-second jingle in D major, 10 rows. A quick rising run
// climbs through G major and A major, then lands on a held D major chord.
//   rows 0-1: G major (G, B, D)   p1 G4 B4, p2 D4 G4, tri G2
//   rows 2-3: A major (A, C#, E)  p1 C#5 E5, p2 A4 C#5, tri A2
//   rows 4-8: D major (D, F#, A)  p1 A5, p2 F#5, tri D3, all held
// Everything is released at row 9.

type Row = string | null;

function rows(cells: Record<number, string>): Row[] {
  const out: Row[] = new Array<Row>(10).fill(null);
  for (const [i, note] of Object.entries(cells)) out[Number(i)] = note;
  return out;
}

const tracks: Track[] = [
  {
    channel: 'p1', duty: 0.5, vol: 11,
    rows: rows({ 0: 'G4', 1: 'B4', 2: 'C#5', 3: 'E5', 4: 'A5', 9: 'off' }),
  },
  {
    channel: 'p2', duty: 0.25, vol: 8,
    rows: rows({ 0: 'D4', 1: 'G4', 2: 'A4', 3: 'C#5', 4: 'F#5', 9: 'off' }),
  },
  {
    channel: 'tri', vol: 14,
    rows: rows({ 0: 'G2', 2: 'A2', 4: 'D3', 9: 'off' }),
  },
];

export const LEVELUP_SONG: Song = { id: 'levelup', tempo: 150, loop: false, tracks };
