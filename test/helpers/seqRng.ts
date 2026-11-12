import type { Rng } from '../../src/engine/rng';

/** Scripted rng: next() yields the given values in order and throws once exhausted. */
export function seqRng(values: number[]): Rng {
  let i = 0;
  const next = (): number => {
    if (i >= values.length) throw new Error('seqRng exhausted');
    return values[i++]!;
  };
  return { next, int: (min, max) => min + Math.floor(next() * (max - min + 1)) };
}
