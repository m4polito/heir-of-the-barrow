import type { Song, Track } from '../../engine/audio/sequencer';

// "Victory": a two-second fanfare in C major, one chord (C, E, G) throughout,
// 24 rows. A rising figure (G C E G) is answered by a second, then the three
// voices land on a held C major chord: p1 G5, p2 E5, tri C3. Everything is
// released at row 20; the last rows are silence.

type Row = string | null;

function rows(cells: Record<number, string>): Row[] {
  const out: Row[] = new Array<Row>(24).fill(null);
  for (const [i, note] of Object.entries(cells)) out[Number(i)] = note;
  return out;
}

const tracks: Track[] = [
  {
    channel: 'p1', duty: 0.5, vol: 11,
    rows: rows({ 0: 'G4', 2: 'C5', 4: 'E5', 6: 'G5', 8: 'C5', 10: 'E5', 12: 'G5', 20: 'off' }),
  },
  {
    channel: 'p2', duty: 0.25, vol: 8,
    rows: rows({ 0: 'E4', 2: 'G4', 4: 'C5', 6: 'E5', 8: 'G4', 10: 'C5', 12: 'E5', 20: 'off' }),
  },
  {
    channel: 'tri', vol: 14,
    rows: rows({ 0: 'C3', 4: 'G2', 8: 'C3', 12: 'C3', 20: 'off' }),
  },
];

export const VICTORY_SONG: Song = { id: 'victory', tempo: 150, loop: false, tracks };
