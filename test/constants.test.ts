import { describe, it, expect } from 'vitest';
import { LOGICAL_W, LOGICAL_H, TILE, VIEW_COLS, VIEW_ROWS, DIR_VECTORS } from '../src/engine/constants';

describe('constants', () => {
  it('view grid matches logical resolution', () => {
    expect(VIEW_COLS * TILE).toBe(LOGICAL_W);
    expect(VIEW_ROWS * TILE).toBe(LOGICAL_H);
  });
  it('up vector points to negative y', () => {
    expect(DIR_VECTORS.up).toEqual({ dx: 0, dy: -1 });
  });
});
