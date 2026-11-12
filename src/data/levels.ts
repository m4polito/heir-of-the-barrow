export type SpellId = 'heal' | 'ember' | 'homeward';

export interface LevelRow {
  level: number;
  xp: number;
  str: number;
  agi: number;
  maxHp: number;
  maxMp: number;
  learns?: SpellId;
}

export const LEVELS: readonly LevelRow[] = [
  { level: 1, xp: 0, str: 4, agi: 5, maxHp: 16, maxMp: 0 },
  { level: 2, xp: 8, str: 5, agi: 5, maxHp: 19, maxMp: 4, learns: 'heal' },
  { level: 3, xp: 22, str: 7, agi: 7, maxHp: 25, maxMp: 6 },
  { level: 4, xp: 50, str: 9, agi: 9, maxHp: 29, maxMp: 12 },
  { level: 5, xp: 105, str: 13, agi: 11, maxHp: 33, maxMp: 17 },
  { level: 6, xp: 210, str: 17, agi: 12, maxHp: 36, maxMp: 23, learns: 'ember' },
  { level: 7, xp: 420, str: 19, agi: 15, maxHp: 41, maxMp: 27 },
  { level: 8, xp: 780, str: 23, agi: 19, maxHp: 45, maxMp: 31 },
  { level: 9, xp: 1250, str: 28, agi: 23, maxHp: 50, maxMp: 35, learns: 'homeward' },
  { level: 10, xp: 1900, str: 34, agi: 28, maxHp: 55, maxMp: 40 },
];

/** Highest level whose xp threshold is <= xp (capped at the table's last row). */
export function levelForXp(xp: number): number {
  let level = 1;
  for (const row of LEVELS) {
    if (xp >= row.xp) level = row.level;
  }
  return level;
}
