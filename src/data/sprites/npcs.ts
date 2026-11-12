import type { Dir } from '../../engine/constants';
import type { PixelArt } from '../../engine/pixels';

export type NpcSpriteId = 'elder' | 'adult' | 'smith' | 'child' | 'guard' | 'squire';

type Frames = Record<Dir, [PixelArt, PixelArt]>;

function mirror(a: PixelArt): PixelArt {
  return { ...a, rows: a.rows.map((r) => [...r].reverse().join('')) };
}

/** The shared upper rows of a view plus two leg variants (2 rows each) make the two walk frames. */
interface View {
  top: string[];
  a: [string, string];
  b: [string, string];
}

function build(colors: Record<string, number>, down: View, up: View, right: View): Frames {
  const pair = (v: View): [PixelArt, PixelArt] => [
    { w: 16, h: 16, colors, rows: [...v.top, ...v.a] },
    { w: 16, h: 16, colors, rows: [...v.top, ...v.b] },
  ];
  const r = pair(right);
  return { down: pair(down), up: pair(up), right: r, left: [mirror(r[0]), mirror(r[1])] };
}

const E = '................';

// Elder: K outline, G grey hair and beard, S skin, R lavender robe, r violet fold, W wooden staff.
const ELDER = build(
  { K: 0, G: 3, S: 11, R: 18, r: 17, W: 9 },
  {
    top: [E, '.....KKKKKK.....', '....KGGGGGGK....', '...KGGGGGGGGK...', '...KGGSSSSGGK.W.',
      '...KGSKSSKSGK.W.', '...KGSSSSSSGK.W.', '....KGGGGGGK..W.', '...KRRKGGKRRK.W.',
      '..KRrRRGGRRrRKW.', '..KRrRRRRRRrRKW.', '..KRRRRRRRRRRKW.', '..KRRRRrrRRRRKW.', '..KRRRRrrRRRRKW.'],
    a: ['..KRRRRRRRRRRKW.', '..KKKKKKKKKKKKW.'],
    b: ['..KRRRRRRRRRRKW.', '...KKKKKKKKKK.W.'],
  },
  {
    top: [E, '.....KKKKKK.....', '....KGGGGGGK....', '...KGGGGGGGGK...', '...KGGGGGGGGK.W.',
      '...KGGGGGGGGK.W.', '...KGGGGGGGGK.W.', '....KGGGGGGK..W.', '...KRRRRRRRRK.W.',
      '..KRRRRRRRRRRKW.', '..KRrRRRRRRrRKW.', '..KRRRRrrRRRRKW.', '..KRRRRrrRRRRKW.', '..KRRRRrrRRRRKW.'],
    a: ['..KRRRRRRRRRRKW.', '..KKKKKKKKKKKKW.'],
    b: ['..KRRRRRRRRRRKW.', '...KKKKKKKKKK.W.'],
  },
  {
    top: [E, '.....KKKKKK.....', '....KGGGGGK.....', '...KGGGGGGGK....', '...KGGGGSSK.....',
      '...KGGGSSKSK....', '...KGGGSSSSK....', '....KGGGGGK.....', '...KRRRRRRRK.W..',
      '..KRrRRRRRRRKW..', '..KRRRRRRRRRKW..', '..KRRRrRRRRRKW..', '..KRRRrRRRRRKW..', '..KRRRRRRRRRKW..'],
    a: ['..KRRRRRRRRRKW..', '..KKKKKKKKKKKW..'],
    b: ['..KRRRRRRRRRKW..', '...KKKKKKKKK.W..'],
  },
);

// Adult: H brown hair, S skin, t tunic (swapped per palette), L brown trousers. No cloak.
const ADULT_COLORS = { K: 0, H: 9, S: 11, t: 10, L: 9 };
const ADULT_LEGS_A: [string, string] = ['....KLLKKLLK....', '....KKK..KKK....'];
const ADULT_LEGS_B: [string, string] = ['.....KLLLLK.....', '.....KKKKKK.....'];
const ADULT = build(
  ADULT_COLORS,
  {
    top: [E, E, '.....KKKKKK.....', '....KHHHHHHK....', '....KHSSSSHK....', '....KSKSSKSK....',
      '....KSSSSSSK....', '.....KSSSSK.....', '....KttttttK....', '...KSttttttSK...', '...KSttttttSK...',
      '...KSttttttSK...', '....KttttttK....', '....KLLLLLLK....'],
    a: ADULT_LEGS_A, b: ADULT_LEGS_B,
  },
  {
    top: [E, E, '.....KKKKKK.....', '....KHHHHHHK....', '....KHHHHHHK....', '....KHHHHHHK....',
      '....KHHHHHHK....', '.....KHHHHK.....', '....KttttttK....', '...KSttttttSK...', '...KSttttttSK...',
      '...KSttttttSK...', '....KttttttK....', '....KLLLLLLK....'],
    a: ADULT_LEGS_A, b: ADULT_LEGS_B,
  },
  {
    top: [E, E, '.....KKKKKK.....', '....KHHHHHHK....', '....KHHHHSSK....', '....KHHHSKSK....',
      '....KHHSSSSK....', '.....KSSSSK.....', '....KttttttK....', '....KttttSSK....', '....KttttSSK....',
      '....KttttttK....', '....KttttttK....', '....KLLLLLLK....'],
    a: ADULT_LEGS_A, b: ADULT_LEGS_B,
  },
);

// Smith: broad. H dark red hair and beard, S skin, T red shirt, A grey apron, B brown boots.
const SMITH_LEGS_A: [string, string] = ['...KBBBKKBBBK...', '...KKKK..KKKK...'];
const SMITH_LEGS_B: [string, string] = ['....KBBBBBBK....', '....KKKKKKKK....'];
const SMITH_LEG_ROW = '...KBBBBBBBBK...';
const SMITH = build(
  { K: 0, H: 12, S: 11, T: 13, A: 2, B: 9 },
  {
    top: [E, '.....KKKKKK.....', '....KHHHHHHK....', '....KHSSSSHK....', '....KSKSSKSK....',
      '....KSSSSSSK....', '....KHHHHHHK....', '.KTTTTTTTTTTTTK.', '.KSTTAAAAAATTSK.',
      '.KSTAAAAAAAATSK.', '.KSTAAAAAAAATSK.', '..KSAAAAAAAASK..', '...KAAAAAAAAK...', SMITH_LEG_ROW],
    a: SMITH_LEGS_A, b: SMITH_LEGS_B,
  },
  {
    top: [E, '.....KKKKKK.....', '....KHHHHHHK....', '....KHHHHHHK....', '....KHHHHHHK....',
      '....KHHHHHHK....', '....KHHHHHHK....', '.KTTTTTTTTTTTTK.', '.KSTTTTTTTTTTSK.',
      '.KSTTTTTTTTTTSK.', '.KSTTTTTTTTTTSK.', '..KSTTTTTTTTSK..', '...KTTTTTTTTK...', SMITH_LEG_ROW],
    a: SMITH_LEGS_A, b: SMITH_LEGS_B,
  },
  {
    top: [E, '.....KKKKKK.....', '....KHHHHHHK....', '....KHHHHSSK....', '....KHHHSKSK....',
      '....KHHSSSSK....', '....KHHHHSSK....', '.KTTTTTTTTTTTTK.', '..KTTAAAAAASSK..',
      '..KTTAAAAAASSK..', '..KTTAAAAAASSK..', '...KTAAAAAAAK...', '...KTAAAAAAAK...', SMITH_LEG_ROW],
    a: SMITH_LEGS_A, b: SMITH_LEGS_B,
  },
);

// Child: short, big head. H orange hair, S skin, T sky shirt, B brown shorts.
const CHILD_LEGS_A: [string, string] = ['....KBBKKBBK....', '....KKK..KKK....'];
const CHILD_LEGS_B: [string, string] = ['.....KBBBBK.....', '.....KKKKKK.....'];
const CHILD = build(
  { K: 0, H: 15, S: 11, T: 5, B: 9 },
  {
    top: [E, E, E, E, '....KKKKKKKK....', '...KHHHHHHHHK...', '...KHSSSSSSHK...', '...KSSKSSKSSK...',
      '...KSSSSSSSSK...', '....KSSSSSSK....', '.....KTTTTK.....', '...KSTTTTTTSK...',
      '....KTTTTTTK....', '....KBBBBBBK....'],
    a: CHILD_LEGS_A, b: CHILD_LEGS_B,
  },
  {
    top: [E, E, E, E, '....KKKKKKKK....', '...KHHHHHHHHK...', '...KHHHHHHHHK...', '...KHHHHHHHHK...',
      '...KHHHHHHHHK...', '....KHHHHHHK....', '.....KTTTTK.....', '...KSTTTTTTSK...',
      '....KTTTTTTK....', '....KBBBBBBK....'],
    a: CHILD_LEGS_A, b: CHILD_LEGS_B,
  },
  {
    top: [E, E, E, E, '....KKKKKKKK....', '...KHHHHHHHHK...', '...KHHHHHHSSK...', '...KHHHHSKSSK...',
      '...KHHHSSSSSK...', '....KHSSSSSK....', '.....KTTTTK.....', '....KTTTTSSK....',
      '....KTTTTTTK....', '....KBBBBBBK....'],
    a: CHILD_LEGS_A, b: CHILD_LEGS_B,
  },
);

// Guard: C blue cap, H hair, S skin, T blue tunic, Y yellow belt, B grey trousers, W spear shaft, P tip.
const GUARD_LEGS_A: [string, string] = ['....KBBKKBBK..W.', '....KKK..KKK..W.'];
const GUARD_LEGS_B: [string, string] = ['.....KBBBBK...W.', '.....KKKKKK...W.'];
const GUARD_TIP = ['..............P.', '..............W.', '.....KKKKKK...W.'];
const GUARD_HANDS = '..KSTTTTTTTSKSW.';
const GUARD_BELT = ['...KTTTTTTTTK.W.', '...KYYYYYYYYK.W.', '....KBBBBBBK..W.'];
const GUARD = build(
  { K: 0, C: 4, H: 9, S: 11, T: 4, Y: 16, B: 2, W: 9, P: 1 },
  {
    top: [...GUARD_TIP, '....KCCCCCCK..W.', '...KCCCCCCCCK.W.', '....KSSSSSSK..W.',
      '....KSKSSKSK..W.', '....KSSSSSSK..W.', '.....KSSSSK...W.', '..KTTTTTTTTTK.W.', GUARD_HANDS, ...GUARD_BELT],
    a: GUARD_LEGS_A, b: GUARD_LEGS_B,
  },
  {
    top: [...GUARD_TIP, '....KCCCCCCK..W.', '...KCCCCCCCCK.W.', '....KCCCCCCK..W.',
      '....KHHHHHHK..W.', '....KHHHHHHK..W.', '.....KHHHHK...W.', '..KTTTTTTTTTK.W.', GUARD_HANDS, ...GUARD_BELT],
    a: GUARD_LEGS_A, b: GUARD_LEGS_B,
  },
  {
    top: [...GUARD_TIP, '....KCCCCCCK..W.', '...KCCCCCCCCK.W.', '....KCCSSSSK..W.',
      '....KHHSSKSK..W.', '....KHHSSSSK..W.', '.....KHSSSK...W.', '...KTTTTTTTK..W.',
      GUARD_HANDS, '...KTTTTTTTK..W.', '...KYYYYYYYK..W.', GUARD_BELT[2]!],
    a: GUARD_LEGS_A, b: GUARD_LEGS_B,
  },
);

// Squire: slumped. H ochre hair, S skin, T violet tunic, B brown trousers, G/g green bottle.
const SQUIRE_LEGS_A: [string, string] = ['....KBBKKBBK....', '....KKK..KKK....'];
const SQUIRE_LEGS_B: [string, string] = ['.....KBBBBK.....', '.....KKKKKK.....'];
const SQUIRE = build(
  { K: 0, H: 10, S: 11, T: 17, B: 9, G: 7, g: 6 },
  {
    top: [E, E, E, '.....KKKKKK.....', '....KHHHHHHK....', '....KHSSSSHK....', '....KSKSSKSK....',
      '....KSSSSSSK....', '...KTTKSSKTTK...', '..KTTTTTTTTTTK..', '..KSTTTTTTTSKg..',
      '..KTTTTTTTTTKGG.', '...KTTTTTTTTKGG.', '....KBBBBBBK....'],
    a: SQUIRE_LEGS_A, b: SQUIRE_LEGS_B,
  },
  {
    top: [E, E, E, '.....KKKKKK.....', '....KHHHHHHK....', '....KHHHHHHK....', '....KHHHHHHK....',
      '....KHHHHHHK....', '...KTTTTTTTTK...', '..KTTTTTTTTTTK..', '..KSTTTTTTTSK...',
      '..KTTTTTTTTTTK..', '...KTTTTTTTTK...', '....KBBBBBBK....'],
    a: SQUIRE_LEGS_A, b: SQUIRE_LEGS_B,
  },
  {
    top: [E, E, E, '.....KKKKKK.....', '....KHHHHHHK....', '....KHHHHSSK....', '....KHHHSKSK....',
      '....KHHSSSSK....', '...KTTTTSSK.....', '..KTTTTTTTTK....', '..KTTTTTTTTSKg..',
      '..KTTTTTTTTSKGG.', '...KTTTTTTTKGG..', '....KBBBBBBK....'],
    a: SQUIRE_LEGS_A, b: SQUIRE_LEGS_B,
  },
);

export const NPC_SPRITES: Record<NpcSpriteId, Frames> = {
  elder: ELDER,
  adult: ADULT,
  smith: SMITH,
  child: CHILD,
  guard: GUARD,
  squire: SQUIRE,
};

/** The adult colour map with the tunic swapped: 0 ochre, 1 teal, 2 purple. */
export function adultPalette(index: 0 | 1 | 2): Record<string, number> {
  return { ...ADULT_COLORS, t: [10, 20, 23][index] ?? 10 };
}

const ADULT_VARIANTS: Frames[] = ([0, 1, 2] as const).map((i) => {
  const colors = adultPalette(i);
  const swap = (p: [PixelArt, PixelArt]): [PixelArt, PixelArt] => [
    { ...p[0], colors },
    { ...p[1], colors },
  ];
  return {
    down: swap(ADULT.down),
    up: swap(ADULT.up),
    left: swap(ADULT.left),
    right: swap(ADULT.right),
  };
});

export function npcArt(sprite: string, palette: number | undefined, dir: Dir, frame: 0 | 1): PixelArt {
  if (!(sprite in NPC_SPRITES)) throw new Error(`Unknown NPC sprite: ${sprite}`);
  if (sprite === 'adult') {
    const v = palette === 1 || palette === 2 ? palette : 0;
    return ADULT_VARIANTS[v]![dir][frame];
  }
  return NPC_SPRITES[sprite as NpcSpriteId][dir][frame];
}
