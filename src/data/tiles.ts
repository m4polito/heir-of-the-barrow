import type { PixelArt } from '../engine/pixels';

export const TILE_IDS = {
  grass: 0,
  road: 1,
  water: 2,
  tree: 3,
  wall: 4,
  floor: 5,
  door: 6,
  well: 7,
  sign: 8,
  roof: 9,
  floorWood: 10,
  counter: 11,
  bed: 12,
  table: 13,
  marsh: 14,
  hill: 15,
  town: 16,
  barrowMouth: 17,
  deadTree: 18,
  barrowWall: 19,
  barrowFloor: 20,
  stairsDown: 21,
  stairsUp: 22,
  chest: 23,
  chestOpen: 24,
  sealedDoor: 25,
  sconce: 26,
} as const;

export interface TileDef {
  id: number;
  name: string;
  walkable: boolean;
  encounterRate: number;
  frames: PixelArt[];
}

/** Ticks per animation frame (water shimmer). */
export const ANIM_FRAME_LEN = 32;

function art(colors: Record<string, number>, rows: string[]): PixelArt {
  return { w: 16, h: 16, colors, rows };
}

// Grass: green 6 base, light-green 7 flecks.
const GRASS = art({ g: 6, l: 7 }, [
  'gggggggggggggggg',
  'gggglggggggggggg',
  'ggglllgggggggggg',
  'gggggggggggglggg',
  'ggggggggggglllgg',
  'gggggggggggggggg',
  'gllggggggggggggg',
  'glllgggggggggggg',
  'gggggggglggggggg',
  'gggggggglllggggg',
  'gggggggggggggggg',
  'ggggggglgggggggg',
  'gggggllllggggggg',
  'gggggggggggllggg',
  'ggglgggggggggggg',
  'gglllggggggggggg',
]);

// Road: ochre 10 packed earth, sand 11 flecks.
const ROAD = art({ o: 10, s: 11 }, [
  'oooooooooooooooo',
  'ooosoooooooosooo',
  'oooooooooooooooo',
  'oooooosssooooooo',
  'oooooooooooooooo',
  'osooooooooooooso',
  'oooooooooosooooo',
  'oooooooooooooooo',
  'ooosoooooooooooo',
  'oooooooosooooooo',
  'ooooooosssoooooo',
  'oooooooooooooooo',
  'oosoooooooooosoo',
  'oooooooooooooooo',
  'ooooooosooooooso',
  'oooooooooooooooo',
]);

// Water: blue 4 with sky 5 highlights; frame 2 is frame 1 shifted four pixels right.
const WATER_ROWS = [
  'bbbbbbbbbbbbbbbb',
  'bbssbbbbbbbbbbbb',
  'bbbbbbbbbbssbbbb',
  'bbbbbbbbbbbbbbbb',
  'bbbbbbbbbbbbbbbb',
  'bsssbbbbbbbbbbbb',
  'bbbbbbbbbbbbssbb',
  'bbbbbbbbbbbbbbbb',
  'bbbbbbbbbbbbbbbb',
  'bbbbssbbbbbbbbbb',
  'bbbbbbbbbbsssbbb',
  'bbbbbbbbbbbbbbbb',
  'bbbbbbbbbbbbbbbb',
  'bbsbbbbbbbbbbbbb',
  'bbbbbbbbsbbbbbbb',
  'bbbbbbbbbbbbbbbb',
];
const WATER_COLORS = { b: 4, s: 5 };
const WATER = [
  art(WATER_COLORS, WATER_ROWS),
  art(WATER_COLORS, WATER_ROWS.map((r) => r.slice(12) + r.slice(0, 12))),
];

// Tree: dark-green 21 canopy with light-green 7 leaf spots, brown 9 trunk, on grass 6.
const TREE = art({ g: 6, d: 21, l: 7, t: 9 }, [
  'gggggggggggggggg',
  'ggggggddddgggggg',
  'gggddddddddddggg',
  'ggddldddddlddggg',
  'gdddddddddddddgg',
  'gddddlddddddddgg',
  'gdddddddddlddddg',
  'gdlddddddddddddg',
  'gdddddddldddddgg',
  'ggddddddddddddgg',
  'gggddddlddddgggg',
  'ggggggdttdgggggg',
  'gggggggttggggggg',
  'gggggggttggggggg',
  'ggggggttttgggggg',
  'gggggggggggggggg',
]);

// Wall: gray 2 stone blocks, light-gray 3 highlights, black 0 mortar lines.
const WALL = art({ k: 0, s: 2, h: 3 }, [
  'hhhhhhhhhhhhhhhh',
  'hsssssssksssssss',
  'ssssssssksssssss',
  'ssssssssksssssss',
  'kkkkkkkkkkkkkkkk',
  'hhhhhhhhhhhhhhhh',
  'ssssksssssssksss',
  'ssssksssssssksss',
  'ssssksssssssksss',
  'kkkkkkkkkkkkkkkk',
  'hhhhhhhhhhhhhhhh',
  'hsssssssksssssss',
  'ssssssssksssssss',
  'ssssssssksssssss',
  'kkkkkkkkkkkkkkkk',
  'ssssssssssssssss',
]);

// Floor: light-gray 3 cobbles with gray 2 gaps.
const FLOOR = art({ c: 3, s: 2 }, [
  'cccccsccccccsccc',
  'cccccsccccccsccc',
  'cccccsccccccsccc',
  'ssssssssssssssss',
  'ccsccccccsccccsc',
  'ccsccccccsccccsc',
  'ccsccccccsccccsc',
  'ssssssssssssssss',
  'cccccsccccccsccc',
  'cccccsccccccsccc',
  'cccccsccccccsccc',
  'ssssssssssssssss',
  'ccsccccccsccccsc',
  'ccsccccccsccccsc',
  'ccsccccccsccccsc',
  'ssssssssssssssss',
]);

// Door: brown 9 planks, ochre 10 highlights, black 0 frame.
const DOOR = art({ k: 0, b: 9, o: 10 }, [
  'kkkkkkkkkkkkkkkk',
  'kbbbbbbbbbbbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kbbbbbbbbbbbbbbk',
  'kkkkkkkkkkkkkkkk',
]);

// Well: gray 2/3 stone ring, blue 4 water, brown 9 crossbar, on grass 6.
const WELL = art({ g: 6, s: 2, h: 3, w: 4, t: 9, k: 0 }, [
  'gggggggggggggggg',
  'ggggttttttttgggg',
  'ggggtggggggtgggg',
  'gggghhhhhhhhgggg',
  'ggghhsssssshhggg',
  'gghhswwwwwwshhgg',
  'gghswwwwwwwwshgg',
  'gghswwwwwwwwshgg',
  'gghswwwwwwwwshgg',
  'gghhswwwwwwshhgg',
  'ggshhsssssshhsgg',
  'ggsshhhhhhhhssgg',
  'gggkssssssssksgg',
  'gggkkkkkkkkkkggg',
  'gggggggggggggggg',
  'gggggggggggggggg',
]);

// Sign: brown 9 post, sand 11 board, on grass 6.
const SIGN = art({ g: 6, l: 7, t: 9, b: 11, k: 0 }, [
  'gggggggggggggggg',
  'gggggggggggggggg',
  'gggkkkkkkkkkkggg',
  'gggkbbbbbbbbkggg',
  'gggkbtttbtttkggg',
  'gggkbbbbbbbbkggg',
  'gggkbtttttbbkggg',
  'gggkbbbbbbbbkggg',
  'gggkkkkkkkkkkggg',
  'ggggggkttkgggggg',
  'ggggggkttkgggggg',
  'ggggggkttkgggggg',
  'ggggggkttkgggggg',
  'gggglgkttkggglgg',
  'ggggggkttkgggggg',
  'gggggkkkkkkggggg',
]);

// Roof: dark-red 12 clay tiles, red 13 highlights, black 0 lines.
const ROOF = art({ k: 0, d: 12, r: 13 }, [
  'rrrrrrrrrrrrrrrr',
  'dddddddddddddddd',
  'kkkkkkkkkkkkkkkk',
  'rrrrrrrrrrrrrrrr',
  'ddddkdddddddkddd',
  'ddddkdddddddkddd',
  'kkkkkkkkkkkkkkkk',
  'rrrrrrrrrrrrrrrr',
  'dddddddddddddddd',
  'kkkkkkkkkkkkkkkk',
  'rrrrrrrrrrrrrrrr',
  'ddddkdddddddkddd',
  'ddddkdddddddkddd',
  'kkkkkkkkkkkkkkkk',
  'rrrrrrrrrrrrrrrr',
  'dddddddddddddddd',
]);

// Wood floor: ochre 10 planks, brown 9 seams and staggered joints, sand 11 highlights.
const FLOOR_WOOD = art({ o: 10, b: 9, h: 11 }, [
  'ooohoooboooooooo',
  'oooooooboooohooo',
  'oooooooboooooooo',
  'bbbbbbbbbbbbbbbb',
  'oohoooooooooooob',
  'ooooooooohooooob',
  'ooooooooooooooob',
  'bbbbbbbbbbbbbbbb',
  'oooooooooboooooo',
  'ooohooooobooooho',
  'oooooooooboooooo',
  'bbbbbbbbbbbbbbbb',
  'oboooooooooooooo',
  'obooohoooooooooo',
  'oboooooooooooooo',
  'bbbbbbbbbbbbbbbb',
]);

// Counter: ochre 10 top highlight, brown 9 top, black 0 dark front.
const COUNTER = art({ k: 0, b: 9, o: 10 }, [
  'oooooooooooooooo',
  'bbbbbbbbbbbbbbbb',
  'bbbbbbbbbbbbbbbb',
  'bbbbbbbbbbbbbbbb',
  'bbbbbbbbbbbbbbbb',
  'bbbbbbbbbbbbbbbb',
  'kkkkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkkkk',
  'kbbbbbbbbbbbbbbk',
  'kkkkkkkkkkkkkkkk',
]);

// Bed: brown 9 frame, white 1 sheet and pillow, red 13 blanket, on wood floor 10.
const BED = art({ o: 10, b: 9, w: 1, r: 13 }, [
  'oooooooooooooooo',
  'obbbbbbbbbbbbbbo',
  'obwwwwwwwwwwwwbo',
  'obwwwwwwwwwwwwbo',
  'obwwwwwwwwwwwwbo',
  'obrrrrrrrrrrrrbo',
  'obrrrrrrrrrrrrbo',
  'obrrrrrrrrrrrrbo',
  'obrrrrrrrrrrrrbo',
  'obrrrrrrrrrrrrbo',
  'obrrrrrrrrrrrrbo',
  'obrrrrrrrrrrrrbo',
  'obrrrrrrrrrrrrbo',
  'obbbbbbbbbbbbbbo',
  'obbooooooooobbbo',
  'oooooooooooooooo',
]);

// Table: brown 9 top, ochre 10 highlight and floor, black 0 edge shadow.
const TABLE = art({ o: 10, b: 9, k: 0 }, [
  'oooooooooooooooo',
  'oooooooooooooooo',
  'obbbbbbbbbbbbbbo',
  'obooooooooooooko',
  'obbbbbbbbbbbbbko',
  'obbbbbbbbbbbbbko',
  'obbbbbbbbbbbbbko',
  'obbbbbbbbbbbbbko',
  'obbbbbbbbbbbbbko',
  'obbbbbbbbbbbbbko',
  'okkkkkkkkkkkkkko',
  'okboooooooooobko',
  'okboooooooooobko',
  'oooooooooooooooo',
  'oooooooooooooooo',
  'oooooooooooooooo',
]);

// Marsh: deep-teal 19 standing water, dark-green 21 reed stems with pale-lime 22 tips.
const MARSH = art({ m: 19, d: 21, l: 22 }, [
  'mmmmmmmmmmmmmmmm',
  'mmmlmmmmmmmmlmmm',
  'mmmdmmmmmmmmdmmm',
  'mmldmmmmmmmlddmm',
  'mmmdmmmmmmmmdmmm',
  'mmmmmmmmmmmmmmmm',
  'mmmmmmmlmmmmmmmm',
  'mmlmmmmdmmmmmmmm',
  'mmdmmmmdlmmmmmlm',
  'mmdmmmmdmmmmmmdm',
  'mmmmmmmmmmmmmmdm',
  'mmmmmmmmmmmmmmmm',
  'mmmmlmmmmlmmmmmm',
  'mmmmdmmmmdmmmmmm',
  'mmmldmmmddmmmmmm',
  'mmmmmmmmmmmmmmmm',
]);

// Hill: grass 6 ground, light-green 7 mound, dark-green 21 shaded flank.
const HILL = art({ g: 6, l: 7, d: 21 }, [
  'gggggggggggggggg',
  'gggggggggggggggg',
  'gggggggggggggggg',
  'gggggggggggggggg',
  'ggggggllllgggggg',
  'gggggllllllggggg',
  'ggggllllllllgggg',
  'gggllllllllllggg',
  'gglllllllllllddg',
  'gllllllllllllddg',
  'gllllllllllllddg',
  'gllllllllllldddg',
  'gddddddddddddddg',
  'gggddddddddddggg',
  'gggggggggggggggg',
  'gggggggggggggggg',
]);

// Town: red 13 roofs with dark-red 12 eaves, gray 2 wall with a gate gap, on grass 6.
const TOWN = art({ g: 6, r: 13, d: 12, s: 2 }, [
  'gggggggggggggggg',
  'gggggggggggggggg',
  'gggggggggggggggg',
  'ggggrrgggggrrggg',
  'gggrrrrgggrrrrgg',
  'ggrrrrrrgrrrrrrg',
  'ggddddddgddddddg',
  'gssssssssssssssg',
  'gssssssssssssssg',
  'gssssssssssssssg',
  'gssssssssssssssg',
  'gssssssggssssssg',
  'gssssssggssssssg',
  'gggggggggggggggg',
  'gggggggggggggggg',
  'gggggggggggggggg',
]);

// Barrow mouth: light-green 7 mound on grass 6, gray 2/3 stones round a black 0 opening.
const BARROW_MOUTH = art({ g: 6, l: 7, s: 2, h: 3, k: 0 }, [
  'gggggggggggggggg',
  'gggggggggggggggg',
  'ggggggllllgggggg',
  'ggggllllllllgggg',
  'ggllllllllllllgg',
  'gglllhhhhhhlllgg',
  'glllhsssssshlllg',
  'glllsskkkksslllg',
  'glllsskkkksslllg',
  'glllsskkkksslllg',
  'glllsskkkksslllg',
  'glllsskkkksslllg',
  'glsssssssssssslg',
  'gggggggggggggggg',
  'gggggggggggggggg',
  'gggggggggggggggg',
]);

// Dead tree: a bare willow, brown 9 trunk and gray 2 drooping boughs, on grass 6.
const DEAD_TREE = art({ g: 6, b: 9, s: 2 }, [
  'gggggggggggggggg',
  'gggggggggggggggg',
  'gggsgggggggsgggg',
  'gggsgbgggbgsgggg',
  'gggsgbbgbbgsgggg',
  'ggsgggbbbbgsgggg',
  'ggggsgbbbggsgggg',
  'gggggggbbbgggggg',
  'ggggggbbbggggggg',
  'gggggbbbbggggggg',
  'gggggbbbgggggggg',
  'ggggbbbbgggggggg',
  'gggsbbbbbbsggggg',
  'gggggggggggggggg',
  'gggggggggggggggg',
  'gggggggggggggggg',
]);

// Barrow wall: deep-teal 19 rough blocks, black 0 mortar, gray 2 chips.
const BARROW_WALL = art({ k: 0, s: 19, h: 2 }, [
  'kkkkkkkkkkkkkkkk',
  'sshsssssksssssss',
  'sssssssskssshsss',
  'sssssssskssssssh',
  'ssssssssksssssss',
  'kkkkkkkkkkkkkkkk',
  'ssskssssssssksss',
  'ssskssshssssksss',
  'ssskssssssssksss',
  'ssskssssssssksss',
  'kkkkkkkkkkkkkkkk',
  'sshsssssksssssss',
  'sssssssskssshsss',
  'sssssssskssssssh',
  'ssssssssksssssss',
  'kkkkkkkkkkkkkkkk',
]);

// Barrow floor: black 0 earth with a few deep-teal 19 flecks; darker and plainer than the wall.
const BARROW_FLOOR = art({ k: 0, f: 19 }, [
  'kkkkkkkkkkkkkkkk',
  'kkkkkkkkkkkfkkkk',
  'kkfkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkkkk',
  'kkkkkkfkkkkkkkkk',
  'kkkkkkkkkkkkkfkk',
  'kkkkkkkkkkkkkkkk',
  'kfkkkkkkkkkkkkkk',
  'kkkkkkkkkfkkkkkk',
  'kkkkkkkkkkkkkkkk',
  'kkkkfkkkkkkkkkfk',
  'kkkkkkkkkkkkkkkk',
  'kkfkkkkkkkfkkkkk',
  'kkkkkkkkkkkkkkkk',
  'kkkkkkfkkkkkkkkk',
  'kkkkkkkkkkkkfkkk',
]);

// Stairs down: steps narrowing into the dark; light-gray 3 treads, gray 2 risers, deep-teal 19 depths.
const STAIRS_DOWN = art({ k: 0, h: 3, s: 2, d: 19 }, [
  'kkkkkkkkkkkkkkkk',
  'khhhhhhhhhhhhhhk',
  'kssssssssssssssk',
  'kkhhhhhhhhhhhhkk',
  'kksssssssssssskk',
  'kkksssssssssskkk',
  'kkkddddddddddkkk',
  'kkkksssssssskkkk',
  'kkkkddddddddkkkk',
  'kkkkkddddddkkkkk',
  'kkkkkddddddkkkkk',
  'kkkkkkddddkkkkkk',
  'kkkkkkddddkkkkkk',
  'kkkkkkkddkkkkkkk',
  'kkkkkkkddkkkkkkk',
  'kkkkkkkkkkkkkkkk',
]);

// Stairs up: the same flight turned about, widening toward the hero.
const STAIRS_UP = art({ k: 0, h: 3, s: 2, d: 19 }, [
  'kkkkkkkkkkkkkkkk',
  'kkkkkkkddkkkkkkk',
  'kkkkkkkddkkkkkkk',
  'kkkkkkddddkkkkkk',
  'kkkkkkddddkkkkkk',
  'kkkkkddddddkkkkk',
  'kkkkkddddddkkkkk',
  'kkkkddddddddkkkk',
  'kkkksssssssskkkk',
  'kkkddddddddddkkk',
  'kkksssssssssskkk',
  'kksssssssssssskk',
  'kkhhhhhhhhhhhhkk',
  'kssssssssssssssk',
  'khhhhhhhhhhhhhhk',
  'kkkkkkkkkkkkkkkk',
]);

// Chest: ochre 10 banded wood, gray 2 iron bands, yellow 16 lock, black 0 outline, on brown 9 earth.
const CHEST = art({ e: 9, k: 0, o: 10, b: 10, i: 2, y: 16 }, [
  'eeeeeeeeeeeeeeee',
  'eeeeeeeeeeeeeeee',
  'eekkkkkkkkkkkkee',
  'eekooiooooiookee',
  'eekooiooooiookee',
  'eekooiooooiookee',
  'eekkkkkyykkkkkee',
  'eekbbibyybibbkee',
  'eekbbibbbbibbkee',
  'eekbbibbbbibbkee',
  'eekbbibbbbibbkee',
  'eekkkkkkkkkkkkee',
  'eeeeeeeeeeeeeeee',
  'eeeeeeeeeeeeeeee',
  'eeeeeeeeeeeeeeee',
  'eeeeeeeeeeeeeeee',
]);

// Open chest: the lid stands back over a deep-teal 19 hollow with a yellow 16 glint.
const CHEST_OPEN = art({ e: 9, k: 0, o: 10, b: 10, i: 2, y: 16, t: 19 }, [
  'eeeeeeeeeeeeeeee',
  'eekkkkkkkkkkkkee',
  'eekooiooooiookee',
  'eekooiooooiookee',
  'eekooiooooiookee',
  'eekkkkkkkkkkkkee',
  'eekttttttttttkee',
  'eektttyttttttkee',
  'eekbbibbbbibbkee',
  'eekbbibbbbibbkee',
  'eekbbibbbbibbkee',
  'eekkkkkkkkkkkkee',
  'eeeeeeeeeeeeeeee',
  'eeeeeeeeeeeeeeee',
  'eeeeeeeeeeeeeeee',
  'eeeeeeeeeeeeeeee',
]);

// Sealed door: brown 9 planks, ochre 10 highlights, a gray 2 bar across with yellow 16 studs, black 0 frame.
const SEALED_DOOR = art({ k: 0, b: 9, o: 10, h: 3, i: 2, y: 16 }, [
  'kkkkkkkkkkkkkkkk',
  'kbbbbbbbbbbbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'khhhhhhhhhhhhhhk',
  'kiyiiiiiiiiiiyik',
  'kkkkkkkkkkkkkkkk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kobbobbbbobbbbbk',
  'kbbbbbbbbbbbbbbk',
  'kkkkkkkkkkkkkkkk',
]);

// Sconce: a brown 9 bracket on barrow wall holds a flame (yellow 16, orange 15, red 13); two frames.
const SCONCE_A = art({ k: 0, s: 19, h: 2, y: 16, o: 15, r: 13, b: 9 }, [
  'kkkkkkkkkkkkkkkk',
  'sshsssssksssssss',
  'ssssssssyssshsss',
  'sssssssyyssssssh',
  'sssssssoosssssss',
  'kkkkkkkrrkkkkkkk',
  'ssskssssbsssksss',
  'sssksssbbsssksss',
  'sssksssbbsssksss',
  'ssskssssbsssksss',
  'kkkkkkkkkkkkkkkk',
  'sshsssssksssssss',
  'sssssssskssshsss',
  'sssssssskssssssh',
  'ssssssssksssssss',
  'kkkkkkkkkkkkkkkk',
]);

// Sconce, second frame: the flame leans.
const SCONCE_B = art({ k: 0, s: 19, h: 2, y: 16, o: 15, r: 13, b: 9 }, [
  'kkkkkkkkkkkkkkkk',
  'sshsssssksssssss',
  'sssssssykssshsss',
  'sssssssyyssssssh',
  'sssssssoysssssss',
  'kkkkkkkrrkkkkkkk',
  'ssskssssbsssksss',
  'sssksssbbsssksss',
  'sssksssbbsssksss',
  'ssskssssbsssksss',
  'kkkkkkkkkkkkkkkk',
  'sshsssssksssssss',
  'sssssssskssshsss',
  'sssssssskssssssh',
  'ssssssssksssssss',
  'kkkkkkkkkkkkkkkk',
]);

export const TILES: readonly TileDef[] = [
  { id: TILE_IDS.grass, name: 'grass', walkable: true, encounterRate: 1, frames: [GRASS] },
  { id: TILE_IDS.road, name: 'road', walkable: true, encounterRate: 0.5, frames: [ROAD] },
  { id: TILE_IDS.water, name: 'water', walkable: false, encounterRate: 0, frames: WATER },
  { id: TILE_IDS.tree, name: 'tree', walkable: false, encounterRate: 0, frames: [TREE] },
  { id: TILE_IDS.wall, name: 'wall', walkable: false, encounterRate: 0, frames: [WALL] },
  { id: TILE_IDS.floor, name: 'floor', walkable: true, encounterRate: 0, frames: [FLOOR] },
  { id: TILE_IDS.door, name: 'door', walkable: true, encounterRate: 0, frames: [DOOR] },
  { id: TILE_IDS.well, name: 'well', walkable: false, encounterRate: 0, frames: [WELL] },
  { id: TILE_IDS.sign, name: 'sign', walkable: false, encounterRate: 0, frames: [SIGN] },
  { id: TILE_IDS.roof, name: 'roof', walkable: false, encounterRate: 0, frames: [ROOF] },
  { id: TILE_IDS.floorWood, name: 'floorWood', walkable: true, encounterRate: 0, frames: [FLOOR_WOOD] },
  { id: TILE_IDS.counter, name: 'counter', walkable: false, encounterRate: 0, frames: [COUNTER] },
  { id: TILE_IDS.bed, name: 'bed', walkable: false, encounterRate: 0, frames: [BED] },
  { id: TILE_IDS.table, name: 'table', walkable: false, encounterRate: 0, frames: [TABLE] },
  { id: TILE_IDS.marsh, name: 'marsh', walkable: true, encounterRate: 1.5, frames: [MARSH] },
  { id: TILE_IDS.hill, name: 'hill', walkable: true, encounterRate: 1.5, frames: [HILL] },
  { id: TILE_IDS.town, name: 'town', walkable: true, encounterRate: 0, frames: [TOWN] },
  { id: TILE_IDS.barrowMouth, name: 'barrowMouth', walkable: true, encounterRate: 0, frames: [BARROW_MOUTH] },
  { id: TILE_IDS.deadTree, name: 'deadTree', walkable: false, encounterRate: 0, frames: [DEAD_TREE] },
  { id: TILE_IDS.barrowWall, name: 'barrowWall', walkable: false, encounterRate: 0, frames: [BARROW_WALL] },
  { id: TILE_IDS.barrowFloor, name: 'barrowFloor', walkable: true, encounterRate: 0.75, frames: [BARROW_FLOOR] },
  { id: TILE_IDS.stairsDown, name: 'stairsDown', walkable: true, encounterRate: 0, frames: [STAIRS_DOWN] },
  { id: TILE_IDS.stairsUp, name: 'stairsUp', walkable: true, encounterRate: 0, frames: [STAIRS_UP] },
  { id: TILE_IDS.chest, name: 'chest', walkable: false, encounterRate: 0, frames: [CHEST] },
  { id: TILE_IDS.chestOpen, name: 'chestOpen', walkable: false, encounterRate: 0, frames: [CHEST_OPEN] },
  { id: TILE_IDS.sealedDoor, name: 'sealedDoor', walkable: false, encounterRate: 0, frames: [SEALED_DOOR] },
  { id: TILE_IDS.sconce, name: 'sconce', walkable: false, encounterRate: 0, frames: [SCONCE_A, SCONCE_B] },
];
