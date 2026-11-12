import type { Song, Track } from '../../engine/audio/sequencer';

// "Battle": fast and driving, 4/4, A minor coloured with Bb (the flat second)
// and G# (the leading tone), 12 bars of 16 rows. Bars 1-2 are a rising alarm
// heard once; bars 3-12 (row 32 on) loop. One chord per bar:
//   intro  Am | E
//   loop   Am | Am | Bb | E      (the motif, developed, then a Bb jolt and E)
//          Am | Dm | F  | Bb
//          E  | E                (dominant; G#4 leads back up to A4 at row 32)
// p1 states BATTLE_MOTIF at row 32 and develops it. p2 repeats eighth notes on
// two chord tones per bar. tri pumps eighths, root and octave (for A and Bb the
// octave reaches A3 and Bb3, a little above the usual bass ceiling). Noise is
// kick on 1 and 3, snare on 2 and 4, hat on the off-eighths.

/** The battle theme's four-to-six note hook; the boss theme quotes it slower. */
export const BATTLE_MOTIF: string[] = ['A4', 'C5', 'E5', 'F5', 'E5'];

type Row = string | null;
type Ev = [note: string, rows: number];

const BAR = 16;

/** One bar of (note, length-in-rows) events; 'off' is a rest. Must total 16 rows. */
function bar(...events: Ev[]): Row[] {
  const out: Row[] = [];
  for (const [note, len] of events) {
    out.push(note);
    for (let i = 1; i < len; i++) out.push(null);
  }
  if (out.length !== BAR) throw new Error(`bar has ${out.length} rows, expected ${BAR}`);
  return out;
}

/** Ostinato: four repeated eighths on `a`, then four on `b`. */
function eighths(a: string, b: string): Row[] {
  return bar([a, 2], [a, 2], [a, 2], [a, 2], [b, 2], [b, 2], [b, 2], [b, 2]);
}

/** Pumping bass: root and octave on alternating eighths. */
function pump(root: string, octave: string): Row[] {
  return bar([root, 2], [octave, 2], [root, 2], [octave, 2], [root, 2], [octave, 2], [root, 2], [octave, 2]);
}

/** Kick on 1 and 3, snare on 2 and 4, hat on the off-eighths. */
function drums(): Row[] {
  return bar(['k', 2], ['h', 2], ['s', 2], ['h', 2], ['k', 2], ['h', 2], ['s', 2], ['h', 2]);
}

/** Intro bar 2: the groove, then a snare roll into the loop. */
function roll(): Row[] {
  return bar(['k', 2], ['h', 2], ['s', 2], ['h', 2], ['s', 2], ['s', 2], ['s', 2], ['s', 1], ['s', 1]);
}

const flat = (bars: Row[][]): Row[] => bars.flat();

const melody = flat([
  // intro: rising alarm
  bar(['A4', 2], ['C5', 2], ['E5', 2], ['A5', 2], ['C5', 2], ['E5', 2], ['A5', 2], ['C6', 2]),   // Am
  bar(['B4', 2], ['E5', 2], ['G#5', 2], ['B5', 2], ['E5', 2], ['G#5', 2], ['B5', 2], ['off', 2]), // E
  // loop, row 32: the motif, then development
  bar(['A4', 2], ['C5', 2], ['E5', 2], ['F5', 2], ['E5', 4], ['C5', 2], ['A4', 2]),               // Am
  bar(['E5', 2], ['A5', 2], ['E5', 2], ['C5', 2], ['A4', 4], ['C5', 2], ['E5', 2]),               // Am
  bar(['Bb4', 2], ['D5', 2], ['F5', 2], ['G5', 2], ['F5', 4], ['D5', 2], ['Bb4', 2]),             // Bb
  bar(['G#4', 2], ['B4', 2], ['E5', 2], ['D5', 2], ['B4', 4], ['G#4', 4]),                        // E
  bar(['A4', 2], ['C5', 2], ['E5', 2], ['A5', 2], ['E5', 4], ['C5', 4]),                          // Am
  bar(['D5', 2], ['F5', 2], ['A5', 2], ['F5', 2], ['D5', 4], ['A4', 2], ['D5', 2]),               // Dm
  bar(['C5', 2], ['F5', 2], ['A5', 2], ['F5', 2], ['C5', 4], ['A4', 4]),                          // F
  bar(['D5', 2], ['F5', 2], ['Bb5', 2], ['F5', 2], ['D5', 4], ['Bb4', 4]),                        // Bb
  bar(['B4', 2], ['E5', 2], ['G#5', 2], ['E5', 2], ['B4', 4], ['G#4', 2], ['E5', 2]),             // E
  bar(['E5', 2], ['D5', 2], ['B4', 2], ['G#4', 2], ['B4', 2], ['D5', 2], ['E5', 2], ['G#4', 2]),  // E
]);

const ostinato = flat([
  eighths('E4', 'C5'), eighths('B3', 'G#4'),                                                       // intro: Am, E
  eighths('E4', 'C5'), eighths('E4', 'C5'), eighths('F4', 'D5'), eighths('B3', 'G#4'),             // Am Am Bb E
  eighths('E4', 'C5'), eighths('A3', 'F4'), eighths('C4', 'A4'), eighths('F4', 'D5'),              // Am Dm F Bb
  eighths('B3', 'G#4'), eighths('B3', 'G#4'),                                                      // E E
]);

const bassline = flat([
  pump('A2', 'A3'), pump('E2', 'E3'),                                                              // intro: Am, E
  pump('A2', 'A3'), pump('A2', 'A3'), pump('Bb2', 'Bb3'), pump('E2', 'E3'),                        // Am Am Bb E
  pump('A2', 'A3'), pump('D2', 'D3'), pump('F2', 'F3'), pump('Bb2', 'Bb3'),                        // Am Dm F Bb
  pump('E2', 'E3'), pump('E2', 'E3'),                                                              // E E
]);

const beat = flat([drums(), roll(), ...Array.from({ length: 10 }, drums)]);

const tracks: Track[] = [
  { channel: 'p1', duty: 0.25, vol: 11, rows: melody },
  { channel: 'p2', duty: 0.125, vol: 7, rows: ostinato },
  { channel: 'tri', vol: 14, rows: bassline },
  { channel: 'noise', vol: 7, rows: beat },
];

export const BATTLE_SONG: Song = { id: 'battle', tempo: 152, loopFrom: 32, tracks };
