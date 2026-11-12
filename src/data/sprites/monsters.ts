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

/** The monster drawing for a sprite id and palette index; identity-stable so the sprite cache can key on it. */
export function monsterArt(sprite: string, palette: number): PixelArt {
  if (sprite !== 'mireling') throw new Error(`Unknown monster sprite: ${sprite}`);
  return MIRELING[palette] ?? MIRELING[0]!;
}
