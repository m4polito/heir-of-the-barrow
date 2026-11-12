import { describe, it, expect } from 'vitest';
import { advance, snapElapsed, STEP_MS, MAX_STEPS_PER_FRAME } from '../src/engine/loop';

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

describe('snapElapsed', () => {
  it('snaps near-step elapsed to exactly one step', () => {
    expect(snapElapsed(STEP_MS + 0.4)).toBe(STEP_MS);
    expect(snapElapsed(STEP_MS - 0.9)).toBe(STEP_MS);
  });
  it('leaves other values unchanged', () => {
    expect(snapElapsed(STEP_MS + 1.5)).toBe(STEP_MS + 1.5);
    expect(snapElapsed(5)).toBe(5);
  });
  it('yields one step on every frame at a jittery 60 Hz', () => {
    let acc = 0;
    for (let i = 0; i < 120; i++) {
      const r = advance(acc, snapElapsed(STEP_MS + 0.3));
      acc = r.remainderMs;
      expect(r.steps).toBe(1);
    }
  });
});
