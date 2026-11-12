import { describe, it, expect } from 'vitest';
import { createRng } from '../src/engine/rng';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let n = 0; n < 5; n++) expect(a.next()).toBe(b.next());
  });

  it('int(1, 6) stays in range and hits every value', () => {
    const r = createRng(7);
    const seen = new Set<number>();
    for (let n = 0; n < 1000; n++) {
      const v = r.int(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect(seen.size).toBe(6);
  });

  it('next() is in [0, 1)', () => {
    const r = createRng(123);
    for (let n = 0; n < 1000; n++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
