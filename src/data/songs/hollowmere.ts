import type { Song, Track } from '../../engine/audio/sequencer';

// "Hollowmere": a warm 3/4 waltz in F major, 16 bars (A, A', B, A'').
// One chord per bar:
//   A   F  | C  | Dm | Bb
//   A'  F  | C  | Bb C | F
//   B   Dm | Am | Bb | F
//   A'' Gm | C  | Bb C | F

type Row = string | null;
type Ev = [note: string, rows: number];

const BAR = 12;

/** Melody bar: (note, length-in-rows) events; 'off' is a rest. Must total 12 rows. */
function bar(...events: Ev[]): Row[] {
  const out: Row[] = [];
  for (const [note, len] of events) {
    out.push(note);
    for (let i = 1; i < len; i++) out.push(null);
  }
  if (out.length !== BAR) throw new Error(`bar has ${out.length} rows, expected ${BAR}`);
  return out;
}

/** Waltz harmony bar: rest on beat 1, a 2-row chord tone on beats 2 and 3 (null = rest). */
function harm(beat2: string | null, beat3: string | null): Row[] {
  const out: Row[] = new Array<Row>(BAR).fill(null);
  if (beat2) { out[4] = beat2; out[6] = 'off'; }
  if (beat3) { out[8] = beat3; out[10] = 'off'; }
  return out;
}

/** Bass bar: root on beat 1, fifth (or second chord's root) on beat 3, each held 3 rows. */
function bass(beat1: string, beat3: string): Row[] {
  const out: Row[] = new Array<Row>(BAR).fill(null);
  out[0] = beat1; out[3] = 'off';
  out[8] = beat3; out[11] = 'off';
  return out;
}

/** Soft hat on beat 2. */
function hat(): Row[] {
  const out: Row[] = new Array<Row>(BAR).fill(null);
  out[4] = 'h';
  return out;
}

const flat = (bars: Row[][]): Row[] => bars.flat();

const melody = flat([
  // A
  bar(['C5', 8], ['A4', 4]),
  bar(['G4', 4], ['F4', 4], ['E4', 4]),
  bar(['F4', 4], ['G4', 4], ['A4', 4]),
  bar(['Bb4', 8], ['A4', 3], ['off', 1]),
  // A'
  bar(['C5', 8], ['A4', 4]),
  bar(['G4', 4], ['A4', 4], ['C5', 4]),
  bar(['D5', 4], ['C5', 4], ['G4', 4]),
  bar(['F4', 10], ['off', 2]),
  // B
  bar(['D5', 4], ['E5', 4], ['F5', 4]),
  bar(['E5', 4], ['F5', 2], ['E5', 2], ['C5', 4]),
  bar(['D5', 4], ['E5', 2], ['F5', 6]),
  bar(['A5', 6], ['G5', 2], ['F5', 3], ['off', 1]),
  // A''
  bar(['D5', 8], ['Bb4', 4]),
  bar(['G4', 4], ['A4', 4], ['C5', 4]),
  bar(['D5', 6], ['C5', 2], ['G4', 4]),
  bar(['F4', 8], ['off', 4]),
]);

const harmony = flat([
  harm('A4', 'C4'), harm('G3', 'G3'), harm('A3', 'F4'), harm('D4', 'F4'),
  harm('A4', 'C4'), harm('E4', 'E4'), harm('F4', 'E4'), harm('A3', 'C4'),
  harm('A4', 'A4'), harm('E4', 'E4'), harm('D4', 'F4'), harm('C5', 'A4'),
  harm('Bb4', 'D4'), harm('E4', 'E4'), harm('F4', 'E4'), harm('A3', null),
]);

const bassline = flat([
  bass('F2', 'C3'), bass('C3', 'G2'), bass('D3', 'A2'), bass('Bb2', 'F3'),
  bass('F2', 'C3'), bass('C3', 'G2'), bass('Bb2', 'C3'), bass('F2', 'C3'),
  bass('D3', 'A2'), bass('A2', 'E3'), bass('Bb2', 'F3'), bass('F2', 'C3'),
  bass('G2', 'D3'), bass('C3', 'G2'), bass('Bb2', 'C3'), bass('F2', 'C3'),
]);

const hats = flat(Array.from({ length: 16 }, hat));

const tracks: Track[] = [
  { channel: 'p1', duty: 0.5, vol: 12, rows: melody },
  { channel: 'p2', duty: 0.25, vol: 8, rows: harmony },
  { channel: 'tri', vol: 15, rows: bassline },
  { channel: 'noise', vol: 4, rows: hats },
];

export const HOLLOWMERE_SONG: Song = { id: 'hollowmere', tempo: 132, tracks };
