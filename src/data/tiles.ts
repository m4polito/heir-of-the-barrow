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
];
