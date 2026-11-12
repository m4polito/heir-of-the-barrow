import type { PixelArt } from '../../engine/pixels';

// Mireling: a pale, slumped, marsh-wet figure. Its head hangs forward (left) off a high humped back;
// one long arm trails to the ground and the legs have melted into a puddle.
// b body, s shade, h highlight, e eye, g eye glint. No outline: the battle field is black.
const MIRELING_ROWS = [
  '........................',
  '........................',
  '........................',
  '......hhhhhh............',
  '.....hbbbbbbb...........',
  '.....bbegbbegb..hhhhh...',
  '.....bbeebbeeb.hbbbbbs..',
  '.....sbbbbbbbbbbbbbbbbs.',
  '.....sbbssssbbbbbbbbbbs.',
  '....sbbbbbbbbbbbbbbbbbs.',
  '...hbbbbbbbbbbbbbbbbbbbs',
  '...bbbhbbbbbbbbbbbbbbbbs',
  '..sbbbbbbbbbbbbbbbbbbbs.',
  '..sbbsbbbbbbbbbbbbbbbbs.',
  '..sbbsbbbbbbbbbbbbbbbs..',
  '..sbbsbbbbbbbbbbbbbbbs..',
  '..sbbs.sbbbbbbbbbbbbs...',
  '..sbbs..sbbbbbbbbbbbs...',
  '..sbbs...sbbbbbbbbbss...',
  '.sbbbbs..ssbbbbbbbbss...',
  '.sbbbbs...ssbbbbbbbs....',
  '..ssss..sbbbbbbbbbbbbss.',
  '.ssbbbbbbbbbbbbbbbbbbbss',
  '..ssssssssssssssssssss..',
];

const MIRELING_PALETTES: Record<string, number>[] = [
  { b: 3, s: 2, h: 1, e: 0, g: 1 }, // pale
  { b: 20, s: 19, h: 22, e: 0, g: 1 }, // bog
  { b: 17, s: 23, h: 18, e: 0, g: 1 }, // barrow
];

const MIRELING: PixelArt[] = MIRELING_PALETTES.map((colors) => ({ w: 24, h: 24, colors, rows: MIRELING_ROWS }));

/** The monster drawing for a sprite id and palette index; identity-stable so the sprite cache can key on it. */
export function monsterArt(sprite: string, palette: number): PixelArt {
  if (sprite !== 'mireling') throw new Error(`Unknown monster sprite: ${sprite}`);
  return MIRELING[palette] ?? MIRELING[0]!;
}
