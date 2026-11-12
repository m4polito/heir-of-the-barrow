import type { Song, Track } from '../../engine/audio/sequencer';

// "Fallen": a short descending phrase in A minor, 12 rows. p1 steps down
// A4 G4 F4 E4 with p2 a third below (F4 E4 D4 C4); on the last note the chord
// settles to A minor: E4 over C4 over a low A2 in the triangle. Everything is
// released at row 11.

type Row = string | null;

function rows(cells: Record<number, string>): Row[] {
  const out: Row[] = new Array<Row>(12).fill(null);
  for (const [i, note] of Object.entries(cells)) out[Number(i)] = note;
  return out;
}

const tracks: Track[] = [
  { channel: 'p1', duty: 0.5, vol: 10, rows: rows({ 0: 'A4', 2: 'G4', 4: 'F4', 6: 'E4', 11: 'off' }) },
  { channel: 'p2', duty: 0.25, vol: 6, rows: rows({ 0: 'F4', 2: 'E4', 4: 'D4', 6: 'C4', 11: 'off' }) },
  { channel: 'tri', vol: 13, rows: rows({ 6: 'A2', 11: 'off' }) },
];

export const FALLEN_SONG: Song = { id: 'fallen', tempo: 72, loop: false, tracks };
