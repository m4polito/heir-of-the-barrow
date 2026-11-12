import { describe, it, expect } from 'vitest';
import { cameraOrigin } from '../src/game/camera';
import { HOLLOWMERE } from '../src/data/maps/hollowmere';
import type { GameMap } from '../src/game/map';

const mk = (width: number, height: number): GameMap => ({
  ...HOLLOWMERE,
  width,
  height,
  tiles: new Array(width * height).fill(0),
});

describe('cameraOrigin', () => {
  it('centres on the hero for a map larger than the viewport', () => {
    expect(cameraOrigin(HOLLOWMERE, 160, 160)).toEqual({ ox: 48, oy: 48 });
  });
  it('centres a small map in the viewport', () => {
    expect(cameraOrigin(mk(10, 8), 0, 0)).toEqual({ ox: -48, oy: -56 });
    expect(cameraOrigin(mk(10, 8), 90, 70)).toEqual({ ox: -48, oy: -56 });
  });
  it('handles a wide, short map per axis', () => {
    expect(cameraOrigin(mk(20, 10), 160, 160)).toEqual({ ox: 48, oy: -40 });
  });
});
