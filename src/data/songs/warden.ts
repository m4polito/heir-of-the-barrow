import type { Song, Track } from '../../engine/audio/sequencer';

// "Warden": the boss theme, slow and heavy, 4/4 at 104, A minor, 8 bars of 16 rows
// that loop from row 0. One chord per bar:
//   Am | Am | F | E          (the battle motif, then its tail; F; the dominant)
//   Am | Dm | Bb | E         (the motif again, climbing through Dm and Bb to E)
// p1 plays the battle theme's hook (BATTLE_MOTIF) one octave down and each note
// twice as long (four rows apart, the last held for eight), in bars 1-2 and again
// in bar 5; the other bars carry chord tones in the same four-row pulse. A D
// natural passing over E in bar 4 makes it E7; bar 8's G#3 leads into the A3
// at the loop. p2 holds two chord tones a bar, eight rows each, high above.
// tri plays the bar's root on each beat (three rows, then a one-row release), all below C3. Noise is a kick on beats
// 1, 2 and 4 and the snare on beat 3 (one noise voice, so beat 3 gives up its kick).

type Row = string | null;
type Ev = [note: string | null, rows: number];

const BAR = 16;

/** One bar of (note, length-in-rows) events; null is a silent stretch. Must total 16 rows. */
function bar(...events: Ev[]): Row[] {
  const out: Row[] = [];
  for (const [note, len] of events) {
    out.push(note);
    for (let i = 1; i < len; i++) out.push(null);
  }
  if (out.length !== BAR) throw new Error(`bar has ${out.length} rows, expected ${BAR}`);
  return out;
}

/** The bar's root on each beat: sounded for three rows, released for one, so the beats read as a pulse. */
function roots(root: string): Row[] {
  return bar([root, 3], ['off', 1], [root, 3], ['off', 1], [root, 3], ['off', 1], [root, 3], ['off', 1]);
}

/** Two chord tones, eight rows each. */
function pair(a: string, b: string): Row[] {
  return bar([a, 8], [b, 8]);
}

/** Kick on beats 1, 2 and 4, snare on beat 3. */
function drums(): Row[] {
  return bar(['k', 4], ['k', 4], ['s', 4], ['k', 4]);
}

const flat = (bars: Row[][]): Row[] => bars.flat();

const melody = flat([
  bar(['A3', 4], ['C4', 4], ['E4', 4], ['F4', 4]),                  // Am: the motif, slowed...
  bar(['E4', 8], ['C4', 4], ['A3', 4]),                             // Am: ...and its tail
  bar(['A3', 4], ['C4', 4], ['F4', 8]),                             // F
  bar(['G#3', 4], ['B3', 4], ['E4', 4], ['D4', 2], ['B3', 2]),      // E (D4 passing: E7)
  bar(['A3', 4], ['C4', 4], ['E4', 4], ['F4', 4]),                  // Am: the motif returns
  bar(['D4', 4], ['F4', 4], ['A4', 4], ['A#4', 4]),                 // Dm (motif)
  bar(['A#3', 4], ['D4', 4], ['F4', 4], ['G4', 4]),                 // Bb (motif)
  bar(['G#3', 4], ['B3', 4], ['E4', 4], ['B3', 2], ['G#3', 2]),     // E, G#3 leads to A3
]);

const chords = flat([
  pair('C5', 'E5'), pair('C5', 'E5'), pair('A4', 'C5'), pair('G#4', 'B4'),
  pair('C5', 'E5'), pair('D5', 'F5'), pair('D5', 'F5'), pair('G#4', 'B4'),
]);

const bassline = flat([
  roots('A2'), roots('A2'), roots('F2'), roots('E2'),
  roots('A2'), roots('D2'), roots('A#2'), roots('E2'),
]);

const beat = flat(Array.from({ length: 8 }, drums));

const tracks: Track[] = [
  { channel: 'p1', duty: 0.5, vol: 11, rows: melody },
  { channel: 'p2', duty: 0.25, vol: 6, rows: chords },
  { channel: 'tri', vol: 14, rows: bassline },
  { channel: 'noise', vol: 8, rows: beat },
];

export const WARDEN_SONG: Song = { id: 'warden', tempo: 104, loopFrom: 0, tracks };
