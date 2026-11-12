import type { Song, Track } from '../../engine/audio/sequencer';

// "Title": slow and stately, 4/4, 16 bars of 16 rows. A D pedal runs under the
// first twelve bars (D minor), with dominant colour (A) in bars 4, 8 and 12.
// From bar 13 the pedal moves to F (the relative major): C3 in bar 15, and F2
// again under the final chord. The melody and counter-line move over the pedal
// rather than following a chord per bar.

type Row = string | null;
type Ev = [note: string, rows: number];

const BAR = 16;

/** Melody bar: (note, length-in-rows) events; 'off' is a rest. Must total 16 rows. */
function bar(...events: Ev[]): Row[] {
  const out: Row[] = [];
  for (const [note, len] of events) {
    out.push(note);
    for (let i = 1; i < len; i++) out.push(null);
  }
  if (out.length !== BAR) throw new Error(`bar has ${out.length} rows, expected ${BAR}`);
  return out;
}

const flat = (bars: Row[][]): Row[] => bars.flat();

const melody = flat([
  // phrase 1: rising from the low D, ending on the dominant with a breath
  bar(['D4', 8], ['F4', 8]),
  bar(['D5', 12], ['C5', 4]),
  bar(['Bb4', 8], ['A4', 4], ['G4', 4]),
  bar(['A4', 11], ['B4', 1], ['A4', 2], ['off', 2]),
  // phrase 2: a step higher
  bar(['F4', 8], ['A4', 8]),
  bar(['C5', 10], ['D5', 1], ['C5', 1], ['G4', 4]),
  bar(['D5', 8], ['F5', 8]),
  bar(['E5', 12], ['D5', 4]),
  // phrase 3: the peak, a half close
  bar(['D5', 8], ['Bb4', 8]),
  bar(['A4', 8], ['D5', 8]),
  bar(['F5', 12], ['E5', 1], ['F5', 1], ['D5', 2]),
  bar(['E5', 14], ['off', 2]),
  // phrase 4: into the major, climbing to the high A
  bar(['A4', 8], ['C5', 8]),
  bar(['E5', 8], ['G5', 8]),
  bar(['F5', 12], ['E5', 1], ['F5', 1], ['G5', 2]),
  bar(['A5', 14], ['off', 2]),
]);

/** Slow counter-line: two half notes per bar, about a sixth under the melody. */
function pair(a: string, b: string): Row[] {
  const out: Row[] = new Array<Row>(BAR).fill(null);
  out[0] = a;
  out[8] = b;
  return out;
}

const finalCounter: Row[] = new Array<Row>(BAR).fill(null);
finalCounter[0] = 'C5';
finalCounter[14] = 'off';

const counter = flat([
  pair('F3', 'A3'), pair('F4', 'D4'), pair('D4', 'Bb3'), pair('C#4', 'E4'),
  pair('A3', 'C4'), pair('E4', 'C4'), pair('F4', 'A4'), pair('C#5', 'A4'),
  pair('F4', 'D4'), pair('C4', 'F4'), pair('A4', 'F4'), pair('A4', 'C#4'),
  pair('C4', 'E4'), pair('G4', 'C5'), pair('A4', 'Bb4'), finalCounter,
]);

/** Drone: D2 re-struck every four bars for twelve bars, then F2, C3, F2 in the major. */
const drone: Row[] = new Array<Row>(256).fill(null);
drone[0] = 'D2';
drone[64] = 'D2';
drone[128] = 'D2';
drone[192] = 'F2';
drone[224] = 'C3';
drone[240] = 'F2';
drone[255] = 'off';

const tracks: Track[] = [
  { channel: 'p1', duty: 0.5, vol: 11, rows: melody },
  { channel: 'p2', duty: 0.25, vol: 7, rows: counter },
  { channel: 'tri', vol: 15, rows: drone },
];

export const TITLE_SONG: Song = { id: 'title', tempo: 84, loopFrom: 0, tracks };
