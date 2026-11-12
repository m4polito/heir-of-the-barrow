import type { Song, Track } from '../../engine/audio/sequencer';

// "Marsh": a walking-pace, slightly lonely tune in E minor, 4/4, 16 bars (four
// four-bar phrases). One chord per bar:
//   1  Em | Em | C  | D        (phrase ends on D, long note, rest)
//   2  Em | G  | Am | B        (half close on B)
//   3  C  | G  | Am | Em       (the relative major answers, back home)
//   4  C  | D  | B  | Em       (closes on a low E, then loops to bar 1)
// p1 leaps (fifths, sixths, octaves) between chord tones and ends each phrase
// on a long note and a rest. p2 echoes the last two p1 notes of each phrase one
// beat later and is silent otherwise. tri walks root, fifth, root, fifth in
// quarter notes. The noise track is a soft hat on beats 2 and 4.

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

/** The walking bass: root, fifth, root, fifth on the quarter notes. */
function walk(root: string, fifth: string): Row[] {
  return bar([root, 4], [fifth, 4], [root, 4], [fifth, 4]);
}

/** Soft hat on beats 2 and 4. */
function hat(): Row[] {
  return bar([null, 4], ['h', 4], [null, 4], ['h', 4]);
}

const flat = (bars: Row[][]): Row[] => bars.flat();

const melody = flat([
  // phrase 1
  bar(['E4', 4], ['B4', 4], ['G4', 4], ['E5', 4]),            // Em
  bar(['B4', 6], ['A4', 2], ['G4', 8]),                       // Em
  bar(['C5', 4], ['G4', 4], ['E5', 8]),                       // C
  bar(['F#4', 4], ['D5', 8], ['off', 4]),                     // D
  // phrase 2
  bar(['E5', 6], ['D5', 2], ['B4', 4], ['G4', 4]),            // Em
  bar(['D5', 4], ['G4', 4], ['B4', 4], ['G5', 4]),            // G
  bar(['E5', 4], ['A4', 4], ['C5', 4], ['A5', 4]),            // Am
  bar(['F#5', 4], ['B4', 8], ['off', 4]),                     // B
  // phrase 3
  bar(['E4', 4], ['C5', 4], ['G4', 4], ['E5', 4]),            // C
  bar(['D5', 8], ['B4', 4], ['G4', 4]),                       // G
  bar(['A4', 4], ['E5', 4], ['C5', 4], ['A4', 4]),            // Am
  bar(['G4', 4], ['E5', 8], ['off', 4]),                      // Em
  // phrase 4
  bar(['C5', 4], ['G4', 4], ['E5', 4], ['G5', 4]),            // C
  bar(['A4', 4], ['D5', 4], ['F#5', 4], ['D5', 4]),           // D
  bar(['B4', 4], ['F#5', 4], ['D#5', 4], ['B4', 4]),          // B
  bar(['E5', 4], ['B4', 4], ['E4', 6], ['off', 2]),           // Em
]);

/** Echo of each phrase's last two melody notes, one beat (4 rows) later. */
const echo = flat([
  silent(), silent(), silent(),
  bar([null, 4], ['F#4', 4], ['D5', 6], ['off', 2]),          // D
  silent(), silent(), silent(),
  bar([null, 4], ['F#5', 4], ['B4', 6], ['off', 2]),          // B
  silent(), silent(), silent(),
  bar([null, 4], ['G4', 4], ['E5', 6], ['off', 2]),           // Em
  silent(), silent(), silent(),
  bar([null, 8], ['B4', 4], ['E4', 3], ['off', 1]),           // Em
]);

const bassline = flat([
  walk('E2', 'B2'), walk('E2', 'B2'), walk('C3', 'G2'), walk('D3', 'A2'),
  walk('E2', 'B2'), walk('G2', 'D3'), walk('A2', 'E3'), walk('B2', 'F#2'),
  walk('C3', 'G2'), walk('G2', 'D3'), walk('A2', 'E3'), walk('E2', 'B2'),
  walk('C3', 'G2'), walk('D3', 'A2'), walk('B2', 'F#2'), walk('E2', 'B2'),
]);

const hats = flat(Array.from({ length: 16 }, hat));

const tracks: Track[] = [
  { channel: 'p1', duty: 0.25, vol: 10, rows: melody },
  { channel: 'p2', duty: 0.125, vol: 6, rows: echo },
  { channel: 'tri', vol: 14, rows: bassline },
  { channel: 'noise', vol: 4, rows: hats },
];

export const MARSH_SONG: Song = { id: 'marsh', tempo: 96, loopFrom: 0, tracks };
