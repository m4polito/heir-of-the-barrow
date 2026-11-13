import type { PixelArt } from '../../engine/pixels';

// Mireling: a pale, slumped, marsh-wet figure seen from the front. Its head sits sunk between steeply
// sloping shoulders, two long arms hang apart from the torso, and short bent legs melt into a puddle.
// b body, s shade, h highlight, e eye, g eye glint. No outline: the battle field is black.
const MIRELING_ROWS = [
  '........................',
  '........................',
  '........................',
  '........hhhhhh..........',
  '.......hbbbbbbbs........',
  '.......bbegbbegb........',
  '.......bbeebbeeb........',
  '......hbbsssssbbs.......',
  '.....hbbbbbbbbbbbs......',
  '...hbbbbbbbbbbbbbbbs....',
  '..hbb.bbbbbbbbbbbs.bbs..',
  '..hbb.bbsbbbbbbbbs.bbs..',
  '..bbs.bbsbbbbbbbbs.bbs..',
  '..bbs.bbbbbbsbbbbs.bbs..',
  '..bbs..bbbbbbbbbs..bbs..',
  '..bbs..bsbbbbbbbs..bbs..',
  '..bbs..bbbbbbsbbs..bbs..',
  '..bbs...bbbbbbbs...bbs..',
  '..bbbs..bbsbbbbs..bbbs..',
  '..bbbs..bbbs.sbbs.......',
  '..sss...bbs...bbbs......',
  '......bbbbs.sbbbbs......',
  '....sbbbbbbbbbbbbbbs....',
  '....ssssssssssssssss....',
];

const MIRELING_PALETTES: Record<string, number>[] = [
  { b: 3, s: 2, h: 1, e: 0, g: 1 }, // pale
  { b: 20, s: 21, h: 22, e: 0, g: 1 }, // bog: dark green shade, so its puddle shows on the deep teal murk
  { b: 17, s: 23, h: 18, e: 0, g: 1 }, // barrow
];

const MIRELING: PixelArt[] = MIRELING_PALETTES.map((colors) => ({ w: 24, h: 24, colors, rows: MIRELING_ROWS }));

// Barrow Warden: a long-dead figure facing the viewer, in the remains of ridged plate. The helm has a
// central crest, the left pauldron (viewer's left) is gone and leaves a bare bone arm, the right one is
// domed. Nothing is raised; the hands hang empty. b plate, s shade, h highlight, e eye. No outline.
const WARDEN_ROWS = [
  '................................',
  '...............hh...............',
  '..............hbbh..............',
  '............hbbhhbbh............',
  '...........bbbbhhbbbb...........',
  '..........bbbbshhsbbbb..........',
  '..........bsbbbhhbbbsb..........',
  '..........bsseebbeessb..........',
  '..........bbsssbbsssbb..........',
  '...........bbs.hh.sbb...........',
  '.............sbs..sbs...........',
  '.......s.s.sbbhhhhbbsbhhhhss....',
  '.......bs..bbbsbbsbbbbbbbbhs....',
  '.......bs..bbsbbbbsbbbsbbbbs....',
  '.......bs..bsbhhhhbsbbssssbs....',
  '.......bs..bbbbbbbbbb.bbs.......',
  '.......s...bbsbbbbsbb.bbs.......',
  '.......s...bbbhhhhbbb.bbs.......',
  '.......bs..bbssbbssbb.bbs.......',
  '.......bs..sbbbbbbbbs.bbs.......',
  '.......sbs.ssbbbbbbss.sbbs......',
  '..........sbbbsbbsbbbs..........',
  '..........sbbs.bb.sbbs..........',
  '..........bbs..bb..sbb..........',
  '...........bhbs..sbhb...........',
  '...........bbbs..sbbb...........',
  '...........bsbs..sbsb...........',
  '...........bbbs..sbbb...........',
  '...........bbbs..sbbb...........',
  '.........sbbbbs..sbbbbs.........',
  '........sbbbbbs..sbbbbbs........',
  '........sssssss..sssssss........',
];

const WARDEN: PixelArt = { w: 32, h: 32, colors: { b: 2, s: 9, h: 3, e: 12 }, rows: WARDEN_ROWS };

/** The monster drawing for a sprite id and palette index; identity-stable so the sprite cache can key on it. */
export function monsterArt(sprite: string, palette: number): PixelArt {
  if (sprite === 'warden') return WARDEN;
  if (sprite !== 'mireling') throw new Error(`Unknown monster sprite: ${sprite}`);
  return MIRELING[palette] ?? MIRELING[0]!;
}
