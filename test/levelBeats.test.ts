import { describe, expect, it } from 'vitest';
import { levelUpBeats } from '../src/game/battle/levelBeats';
import { wrapText } from '../src/ui/wrap';

const name = (id: string) => (id === 'heal' ? 'Heal' : id);

describe('levelUpBeats', () => {
  it('leaves out zero parts and carries the raised hp', () => {
    const beats = levelUpBeats({ from: 1, to: 2, str: 1, agi: 0, maxHp: 7, maxMp: 0, learned: [] }, name, { heroHp: 9, heroMp: 0, monsterHp: 0 });
    expect(beats.map((b) => b.text)).toEqual(['You reach level 2.', 'Strength +1.', 'Max HP +7.']);
    expect(beats[0]!.song).toBe('levelup');
    expect(beats.every((b) => b.heroHp === 16 && b.heroMp === 0 && b.monsterHp === 0)).toBe(true);
  });

  it('full set with a learned spell, all wrapping to two lines', () => {
    const beats = levelUpBeats({ from: 2, to: 3, str: 2, agi: 2, maxHp: 2, maxMp: 5, learned: ['heal'] }, name, { heroHp: 9, heroMp: 1, monsterHp: 0 });
    expect(beats.map((b) => b.text)).toEqual(['You reach level 3.', 'Strength +2. Agility +2.', 'Max HP +2. Max MP +5.', 'You learned Heal!']);
    expect(beats.every((b) => b.heroMp === 6)).toBe(true);
    for (const b of beats) expect(wrapText(b.text, 28).length).toBeLessThanOrEqual(2);
  });
});
