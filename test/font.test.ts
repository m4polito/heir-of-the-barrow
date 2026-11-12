import { describe, expect, it } from 'vitest';
import { FONT_CHARS, composeFontArt, glyphIndex } from '../src/engine/font';
import { FONT_GLYPHS } from '../src/data/fontGlyphs';
import { compilePixelArt } from '../src/engine/pixels';
import { PALETTE } from '../src/data/palette';

describe('font charset', () => {
  it('has 95 ASCII chars plus three symbols', () => {
    expect(FONT_CHARS.length).toBe(95 + 3);
    expect(FONT_CHARS[0]).toBe(' ');
    expect(FONT_CHARS.endsWith('▼▶♥')).toBe(true);
  });
});

describe('font glyphs', () => {
  it('every char has 8 rows of 8 X/. chars', () => {
    for (const ch of Array.from(FONT_CHARS)) {
      const g = FONT_GLYPHS[ch];
      expect(g, `glyph for ${ch}`).toBeDefined();
      expect(g).toHaveLength(8);
      for (const row of g as string[]) expect(row).toMatch(/^[X.]{8}$/);
    }
  });
  it('leaves column 7 blank on every glyph', () => {
    for (const ch of Array.from(FONT_CHARS)) {
      for (const row of FONT_GLYPHS[ch] as string[]) expect(row[7]).toBe('.');
    }
  });
  it('space is blank and I is not', () => {
    expect((FONT_GLYPHS[' '] as string[]).join('')).toMatch(/^\.+$/);
    expect((FONT_GLYPHS['I'] as string[]).join('')).toContain('X');
  });
  it('all glyphs are visually distinct', () => {
    const seen = new Map<string, string>();
    for (const ch of Array.from(FONT_CHARS)) {
      if (ch === ' ') continue;
      const key = (FONT_GLYPHS[ch] as string[]).join('');
      expect(seen.get(key), `${ch} duplicates ${seen.get(key)}`).toBeUndefined();
      seen.set(key, ch);
    }
  });
});

describe('glyphIndex', () => {
  it('maps known and unknown chars', () => {
    expect(glyphIndex('A')).toBe(FONT_CHARS.indexOf('A'));
    expect(glyphIndex('é')).toBe(FONT_CHARS.indexOf('?'));
    expect(glyphIndex('▼')).toBe(95);
  });
});

describe('composeFontArt', () => {
  it('builds a single-row sheet that compiles', () => {
    const art = composeFontArt();
    expect(art.w).toBe(98 * 8);
    expect(art.h).toBe(8);
    expect(art.rows).toHaveLength(8);
    for (const row of art.rows) expect(row).toHaveLength(98 * 8);
    expect(() => compilePixelArt(art, PALETTE)).not.toThrow();
  });
});
