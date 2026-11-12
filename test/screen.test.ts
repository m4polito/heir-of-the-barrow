import { describe, it, expect } from 'vitest';
import { computeScale, computeLayout } from '../src/engine/screen';

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

describe('computeLayout', () => {
  it('matches computeScale at dpr 1', () => {
    expect(computeLayout(1920, 1080, 1)).toEqual({ scale: 4, cssW: 1024, cssH: 960 });
  });
  it('uses integer device-pixel scale at fractional dpr', () => {
    const l = computeLayout(1536, 864, 1.25);
    expect(l.scale).toBe(4);
    expect(l.cssW).toBeCloseTo(819.2);
    expect(l.cssH).toBeCloseTo(768);
  });
  it('never goes below scale 1', () => {
    expect(computeLayout(300, 200, 2).scale).toBe(1);
  });
});
