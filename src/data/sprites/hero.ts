import type { Dir } from '../../engine/constants';
import type { PixelArt } from '../../engine/pixels';

// K outline, H hair brown, S skin sand, C cloak deep teal, c cloak highlight teal,
// T tunic ochre, B boots brown. A young traveler in a short cloak; no helmet, no sword.
const COLORS = { K: 0, H: 9, S: 11, C: 19, c: 20, T: 10, B: 9 };

function art(rows: string[]): PixelArt {
  return { w: 16, h: 16, colors: COLORS, rows };
}

function mirror(a: PixelArt): PixelArt {
  return { ...a, rows: a.rows.map((r) => [...r].reverse().join('')) };
}

const HEAD_TOP = [
  '................',
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
];

const LEGS_APART = ['...KBBK.KBBK....', '...KKKK.KKKK....'];
const LEGS_APART_FRONT = ['....KBBK.KBBK...', '....KKKK.KKKK...'];
const LEGS_TOGETHER = ['.....KBBBBK.....', '.....KKKKKK.....'];

const DOWN_BODY = [
  '...KHHSSSSHHK...',
  '...KHSSSSSSHK...',
  '...KSSKSSKSSK...',
  '....KSSSSSSK....',
  '...KCCKSSKCCK...',
  '..KCcCTTTTCcCK..',
  '..KCcCTTTTCcCK..',
  '..KCCCTTTTCCCK..',
];

const UP_BODY = [
  '...KHHHHHHHHK...',
  '...KHHHHHHHHK...',
  '...KHHHHHHHHK...',
  '....KHHHHHHK....',
  '...KCCCCCCCCK...',
  '..KCCCCccCCCCK..',
  '..KCCCCccCCCCK..',
  '..KCCCCCCCCCCK..',
];

const RIGHT_BODY = [
  '...KHHHHSSSSK...',
  '...KHHHSSSSSK...',
  '...KHHHSSKSSK...',
  '....KHHSSSSK....',
  '....KCCKSSK.....',
  '...KCCcTTTTK....',
  '...KCCcTTTTK....',
  '...KCCCTTTSK....',
];

const down0 = art([...HEAD_TOP, ...DOWN_BODY, '..KSKCTTTTCKSK..', '...KKCCCCCCKK...', ...LEGS_APART_FRONT]);
const down1 = art([...HEAD_TOP, ...DOWN_BODY, '..KCKCTTTTCKCK..', '....KCCCCCCK....', ...LEGS_TOGETHER]);
const up0 = art([...HEAD_TOP, ...UP_BODY, '..KSKCCCCCCKSK..', '...KKCCCCCCKK...', ...LEGS_APART_FRONT]);
const up1 = art([...HEAD_TOP, ...UP_BODY, '..KCKCCCCCCKCK..', '....KCCCCCCK....', ...LEGS_TOGETHER]);
const right0 = art([...HEAD_TOP, ...RIGHT_BODY, '...KCCCTTTK.....', '....KCCCCCK.....', ...LEGS_APART]);
const right1 = art([...HEAD_TOP, ...RIGHT_BODY, '...KCCCTTTK.....', '....KCCCCCK.....', ...LEGS_TOGETHER]);

export const HERO_SPRITES: Record<Dir, [PixelArt, PixelArt]> = {
  down: [down0, down1],
  up: [up0, up1],
  right: [right0, right1],
  left: [mirror(right0), mirror(right1)],
};
