import { describe, it, expect } from 'vitest';
import { advance, STEP_MS, MAX_STEPS_PER_FRAME } from '../src/engine/loop';

describe('advance', () => {
  it('runs one step for one step of elapsed time', () => {
    const r = advance(0, STEP_MS);
    expect(r.steps).toBe(1);
    expect(r.remainderMs).toBeCloseTo(0);
  });
  it('carries the fractional remainder', () => {
    const r = advance(0, STEP_MS * 2.5);
    expect(r.steps).toBe(2);
    expect(r.remainderMs).toBeCloseTo(STEP_MS * 0.5);
  });
  it('combines accumulator and elapsed time', () => {
    expect(advance(STEP_MS * 0.5, STEP_MS * 0.5).steps).toBe(1);
  });
  it('caps catch-up and drops excess time', () => {
    const r = advance(0, 60000);
    expect(r.steps).toBe(MAX_STEPS_PER_FRAME);
    expect(r.remainderMs).toBe(0);
  });
});
