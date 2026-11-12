import { describe, it, expect } from 'vitest';
import { compilePixelArt } from '../src/engine/pixels';
import { PALETTE } from '../src/data/palette';
import { TILES } from '../src/data/tiles';
import { HERO_SPRITES } from '../src/data/sprites/hero';
import { NPC_SPRITES, adultPalette } from '../src/data/sprites/npcs';

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
  for (const [name, dirs] of Object.entries(NPC_SPRITES)) {
    for (const [dir, frames] of Object.entries(dirs)) {
      it(`npc ${name} ${dir} frames compile to 16x16`, () => {
        for (const f of frames) {
          const out = compilePixelArt(f, PALETTE);
          expect(out.w).toBe(16);
          expect(out.h).toBe(16);
        }
      });
    }
  }
  for (const i of [0, 1, 2] as const) {
    it(`adult palette ${i} compiles`, () => {
      for (const frames of Object.values(NPC_SPRITES.adult))
        for (const f of frames) {
          const out = compilePixelArt({ ...f, colors: adultPalette(i) }, PALETTE);
          expect(out.w).toBe(16);
        }
    });
  }
});
