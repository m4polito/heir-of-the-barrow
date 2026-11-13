import type { PixelArt } from '../../engine/pixels';

// Three 16x24 strips that tile sideways behind a battle. Both edges match, so repeats are seamless.

// Grass: the ground surface is row 8, with tufts rising above it and turf below. 6 green, 7 light green, 21 dark green.
const GRASS: PixelArt = {
  w: 16,
  h: 24,
  colors: { g: 6, l: 7, d: 21 },
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '.......l........',
    '...l...l...l..l.',
    '..ll...l...l..l.',
    'gggggggggggggggg',
    'gggglggggggglggg',
    'ggggggggggggdggg',
    'dgggggldgggggggg',
    'ggggggggggglgggg',
    'gdgggggggggggdgg',
    'gggglgggggggggdg',
    'ggddgggggggggggg',
    'gggggggldggggggg',
    'gglgggggggggdggg',
    'ggggggdgggglgggg',
    'dggggggggggggggg',
    'gggldgggggggggdg',
    'gggggggggglggggg',
    'ggdgggggggggggld',
    'gggglgggggggggdg',
  ],
};

// Murk: flat dark water whose surface is row 8, with reed stubs rising above it. 19 deep teal, 20 teal, 21 dark green.
const MURK: PixelArt = {
  w: 16,
  h: 24,
  colors: { w: 19, t: 20, r: 21 },
  rows: [
    '................',
    '................',
    '................',
    '....r.......r...',
    '....r.......r...',
    '...rr...r...rr..',
    '...rr...r...rr..',
    '...rr...r...rr..',
    'wwwrrwwwrwwwrrww',
    'wwwwwwwwwwwwwwww',
    'wwtttwwwwwwwtttw',
    'wwwwwwwwwwwwwwww',
    'wwwwwwtttwwwwwww',
    'wwwwwwwwwwwwwwww',
    'wtttwwwwwwtttwww',
    'wwwwwwwwwwwwwwww',
    'wwwwwtttwwwwwwww',
    'wwwwwwwwwwwwwwww',
    'wwwtttwwwwwwwwtt',
    'wwwwwwwwwwwwwwww',
    'wwwwwwwwwtttwwww',
    'wwtwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwww',
    'wwwwtttwwwwwwwtt',
  ],
};

// Barrow: courses of worked stone; the wall face starts at row 8, mortar lines in gray 2, lit edges in light gray 3,
// stone body deep teal 19. Joints stagger and the first and last columns match, so it tiles sideways.
const BARROW: PixelArt = {
  w: 16,
  h: 24,
  colors: { s: 19, m: 2, l: 3 },
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    'mmmmmmmmmmmmmmmm',
    'lssssssmsssssssl',
    'lssssssssssssssl',
    'lsssssssmssssssl',
    'mmmmmmmmmmmmmmmm',
    'smsssssssssssmss',
    'sssssmsssssssmss',
    'smsssssssssssmss',
    'mmmmmmmmmmmmmmmm',
    'lssssssmsssssssl',
    'lssssssssssssssl',
    'lsssssssmssssssl',
    'mmmmmmmmmmmmmmmm',
    'smsssssssssssmss',
    'sssssmsssssssmss',
    'smsssssssssssmss',
  ],
};

export const BACKDROPS: Record<string, PixelArt> = { grass: GRASS, murk: MURK, barrow: BARROW };

export function backdropArt(id: string): PixelArt {
  const art = BACKDROPS[id];
  if (!art) throw new Error(`Unknown backdrop: ${id}`);
  return art;
}
