import { describe, expect, it } from 'vitest';
import { ATTACK, MonsterBrain, validateActions, type MonsterAction } from '../src/game/battle/ai';
import { seqRng } from './helpers/seqRng';

const A: MonsterAction[] = [
  { do: 'attack', weight: 6 },
  { do: 'blast', name: 'Rot Breath', min: 8, max: 14, weight: 3 },
  { do: 'mend', name: 'Mend', min: 15, max: 25, weight: 2, if: 'hpBelowHalf', cooldown: 2 },
];

describe('MonsterBrain', () => {
  it('attacks without drawing when it has no actions or only one', () => {
    expect(new MonsterBrain().choose(seqRng([]), { hp: 6, maxHp: 6 })).toBe(ATTACK);
    expect(new MonsterBrain([]).choose(seqRng([]), { hp: 6, maxHp: 6 })).toBe(ATTACK);
    const only: MonsterAction = { do: 'blast', name: 'Rot Breath', min: 8, max: 14, weight: 3 };
    expect(new MonsterBrain([only]).choose(seqRng([]), { hp: 6, maxHp: 6 })).toBe(only);
  });

  it('picks by running weight at full health', () => {
    const s = { hp: 70, maxHp: 70 };
    expect(new MonsterBrain(A).choose(seqRng([0]), s)).toBe(A[0]);
    expect(new MonsterBrain(A).choose(seqRng([0.7]), s)).toBe(A[1]);
  });

  it('does not offer the mend at exactly half health', () => {
    expect(new MonsterBrain(A).choose(seqRng([0.99]), { hp: 35, maxHp: 70 })).toBe(A[1]);
  });

  it('applies the mend cooldown of two turns', () => {
    const b = new MonsterBrain(A);
    const s = { hp: 34, maxHp: 70 };
    expect(b.choose(seqRng([0.9]), s)).toBe(A[2]);
    expect(b.choose(seqRng([0.99]), s)).toBe(A[1]);
    expect(b.choose(seqRng([0.99]), s)).toBe(A[1]);
    expect(b.choose(seqRng([0.99]), s)).toBe(A[2]);
  });
});

describe('validateActions', () => {
  it('accepts A', () => {
    expect(() => validateActions(A)).not.toThrow();
  });
  it('rejects bad weights, ranges, cooldowns and lists with no free action', () => {
    expect(() => validateActions([{ do: 'attack', weight: 0 }])).toThrow();
    expect(() => validateActions([{ do: 'attack', weight: NaN }])).toThrow();
    expect(() => validateActions([ATTACK, { do: 'blast', name: 'X', min: 9, max: 8, weight: 1 }])).toThrow();
    expect(() => validateActions([ATTACK, { do: 'blast', name: 'X', min: -1, max: 8, weight: 1 }])).toThrow();
    expect(() => validateActions([{ do: 'attack', weight: 1, cooldown: -1 }, ATTACK])).toThrow();
    expect(() => validateActions([A[2]!])).toThrow();
  });
});
