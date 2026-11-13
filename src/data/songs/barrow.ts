import type { Song, Track } from '../../engine/audio/sequencer';

// "Barrow": sparse and uneasy, 4/4 at a slow 60, D minor, 8 bars of 16 rows that
// loop from row 0. The harmony never moves off a drone; the unease is the gaps.
//   bar  1  2  3  4  5  6  7  8
//   tri  D2 D2 D2 D2 C2 C2 D2 D2     (a low drone, held; released on the last row)
//   p1   -  f1 -  f2 -  f1 -  -      (f1 = D4 F4 E4, f2 = D4 F4 A4, its answer)
//   p2   -  -  -  -  -  -  -  A3     (one held A3, released on the last row)
// p1 plays one three-note figure in bars 2 and 6, and its answer (the last note
// lifted to A4) in bar 4, then releases; it is silent in the other bars. Over the
// C2 drone (bars 5-6) the same D4 F4 E4 sounds as a C bass under D minor tones,
// a b7 pull that leaves the figure unresolved. The noise track is a quiet hat
// at rows that never settle into a pulse: within a bar no two gaps are equal.

type Row = string | null;
type Ev = [note: string | null, rows: number];

const BAR = 16;

/** One bar of (note, length-in-rows) events; null is a silent stretch, 'off' a release. Must total 16 rows. */
function bar(...events: Ev[]): Row[] {
  const out: Row[] = [];
  for (const [note, len] of events) {
    out.push(note);
    for (let i = 1; i < len; i++) out.push(null);
  }
  if (out.length !== BAR) throw new Error(`bar has ${out.length} rows, expected ${BAR}`);
  return out;
}

const silent = (): Row[] => bar([null, BAR]);

/** A hat tick at each listed row of the bar. */
function ticks(...rows: number[]): Row[] {
  const out: Row[] = Array.from({ length: BAR }, () => null);
  for (const r of rows) out[r] = 'h';
  return out;
}

const flat = (bars: Row[][]): Row[] => bars.flat();

/** A drone note held for the whole bar. Bar 8 releases on its last row so the held D2 does not run into the loop's restart. */
const drone = (note: string): Row[] => bar([note, BAR]);

const bass = flat([
  drone('D2'), drone('D2'), drone('D2'), drone('D2'),
  drone('C2'), drone('C2'),
  drone('D2'), bar(['D2', 15], ['off', 1]),
]);

const lead = flat([
  silent(),
  bar([null, 4], ['D4', 3], ['F4', 3], ['E4', 5], ['off', 1]),    // figure
  silent(),
  bar([null, 4], ['D4', 3], ['F4', 3], ['A4', 5], ['off', 1]),    // its answer
  silent(),
  bar([null, 4], ['D4', 3], ['F4', 3], ['E4', 5], ['off', 1]),    // figure
  silent(),
  silent(),
]);

const answer = flat([
  silent(), silent(), silent(), silent(), silent(), silent(), silent(),
  bar([null, 4], ['A3', 11], ['off', 1]),
]);

const hats = flat([
  ticks(2, 7, 15), ticks(5, 9), ticks(0, 6, 8), ticks(3, 13),
  silent(), ticks(6, 11, 14), silent(), silent(),
]);

const tracks: Track[] = [
  { channel: 'p1', duty: 0.25, vol: 6, rows: lead },
  { channel: 'p2', duty: 0.125, vol: 4, rows: answer },
  { channel: 'tri', vol: 14, rows: bass },
  { channel: 'noise', vol: 3, rows: hats },
];

export const BARROW_SONG: Song = { id: 'barrow', tempo: 60, loopFrom: 0, tracks };
