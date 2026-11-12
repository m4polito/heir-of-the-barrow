import { describe, it, expect } from 'vitest';
import { computeScale } from '../src/engine/screen';

describe('computeScale', () => {
  it('picks the largest integer scale that fits', () => {
    expect(computeScale(1920, 1080)).toBe(4);
    expect(computeScale(512, 480)).toBe(2);
  });
  it('never goes below 1', () => {
    expect(computeScale(300, 200)).toBe(1);
    expect(computeScale(100, 100)).toBe(1);
  });
});
