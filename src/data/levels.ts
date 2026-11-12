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
  { level: 1, xp: 0, str: 4, agi: 4, maxHp: 15, maxMp: 0 },
  { level: 2, xp: 7, str: 5, agi: 4, maxHp: 22, maxMp: 0 },
  { level: 3, xp: 23, str: 7, agi: 6, maxHp: 24, maxMp: 5, learns: 'heal' },
  { level: 4, xp: 47, str: 7, agi: 8, maxHp: 31, maxMp: 16 },
  { level: 5, xp: 110, str: 12, agi: 10, maxHp: 35, maxMp: 20, learns: 'ember' },
  { level: 6, xp: 220, str: 16, agi: 10, maxHp: 38, maxMp: 24 },
  { level: 7, xp: 450, str: 18, agi: 17, maxHp: 40, maxMp: 26 },
  { level: 8, xp: 800, str: 22, agi: 20, maxHp: 46, maxMp: 29, learns: 'homeward' },
  { level: 9, xp: 1300, str: 30, agi: 22, maxHp: 50, maxMp: 36 },
  { level: 10, xp: 2000, str: 35, agi: 31, maxHp: 54, maxMp: 40 },
];

/** Highest level whose xp threshold is <= xp (capped at the table's last row). */
export function levelForXp(xp: number): number {
  let level = 1;
  for (const row of LEVELS) {
    if (xp >= row.xp) level = row.level;
  }
  return level;
}
