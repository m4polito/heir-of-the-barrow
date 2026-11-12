import { describe, expect, it } from 'vitest';
import { compilePixelArt, hexToRgb } from '../src/engine/pixels';
import { PALETTE } from '../src/data/palette';

const px = (d: Uint8ClampedArray, w: number, x: number, y: number) =>
  Array.from(d.slice((y * w + x) * 4, (y * w + x) * 4 + 4));

describe('hexToRgb', () => {
  it('parses #RRGGBB', () => {
    expect(hexToRgb('#FCE0A8')).toEqual([252, 224, 168]);
  });
  it('throws on bad input', () => {
    expect(() => hexToRgb('red')).toThrow();
  });
});

describe('compilePixelArt', () => {
  const art = { w: 2, h: 2, colors: { k: 0, w: 1 }, rows: ['k.', '.w'] };
  it('compiles pixels', () => {
    const img = compilePixelArt(art, PALETTE);
    expect(img.data.length).toBe(16);
    expect(px(img.data, 2, 0, 0)).toEqual([0, 0, 0, 255]);
    expect(px(img.data, 2, 1, 0)[3]).toBe(0);
    expect(px(img.data, 2, 1, 1)).toEqual([252, 252, 252, 255]);
  });
  it('throws on wrong row length with row index', () => {
    expect(() => compilePixelArt({ ...art, rows: ['k.', '.w.'] }, PALETTE)).toThrow(/row 1/);
  });
  it('throws on wrong row count', () => {
    expect(() => compilePixelArt({ ...art, rows: ['k.'] }, PALETTE)).toThrow(/2.*1/);
  });
  it('throws on unknown character', () => {
    expect(() => compilePixelArt({ ...art, rows: ['kZ', '.w'] }, PALETTE)).toThrow(/Z/);
  });
  it('throws on palette index out of range', () => {
    expect(() => compilePixelArt({ ...art, colors: { k: 99, w: 1 } }, PALETTE)).toThrow();
  });
});
