import { describe, it, expect } from 'vitest';
import { compilePixelArt } from '../src/engine/pixels';
import { PALETTE } from '../src/data/palette';
import { TILES } from '../src/data/tiles';
import { HERO_SPRITES } from '../src/data/sprites/hero';

describe('art compiles', () => {
  for (const t of TILES) {
    it(`tile ${t.name} frames compile to 16x16`, () => {
      expect(t.frames.length).toBeGreaterThanOrEqual(1);
      for (const f of t.frames) {
        const out = compilePixelArt(f, PALETTE);
        expect(out.w).toBe(16);
        expect(out.h).toBe(16);
      }
    });
  }
  for (const [dir, frames] of Object.entries(HERO_SPRITES)) {
    it(`hero ${dir} frames compile to 16x16`, () => {
      for (const f of frames) {
        const out = compilePixelArt(f, PALETTE);
        expect(out.w).toBe(16);
        expect(out.h).toBe(16);
      }
    });
  }
});
