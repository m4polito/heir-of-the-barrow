import { FONT_GLYPHS } from '../data/fontGlyphs';
import { compilePixelArt, type PixelArt } from './pixels';
import { rgbaToCanvas } from './canvasImage';

export const GLYPH_W = 8;
export const GLYPH_H = 8;

function buildChars(): string {
  let s = '';
  for (let c = 32; c <= 126; c++) s += String.fromCharCode(c);
  return s + '▼▶♥';
}

export const FONT_CHARS: string = buildChars();

const CHAR_LIST = Array.from(FONT_CHARS);
const FALLBACK_INDEX = CHAR_LIST.indexOf('?');

export function glyphIndex(ch: string): number {
  const i = CHAR_LIST.indexOf(ch);
  return i < 0 ? FALLBACK_INDEX : i;
}

export function composeFontArt(): PixelArt {
  const rows: string[] = [];
  for (let r = 0; r < GLYPH_H; r++) {
    rows.push(CHAR_LIST.map((ch) => (FONT_GLYPHS[ch] as string[])[r]).join(''));
  }
  return { w: CHAR_LIST.length * GLYPH_W, h: GLYPH_H, colors: { X: 1 }, rows };
}

export function buildFontSheet(palette: readonly string[]): HTMLCanvasElement {
  return rgbaToCanvas(compilePixelArt(composeFontArt(), palette));
}

export class Font {
  constructor(private readonly sheet: HTMLCanvasElement) {}

  drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
    const chars = Array.from(text);
    for (let i = 0; i < chars.length; i++) {
      const gi = glyphIndex(chars[i] as string);
      ctx.drawImage(this.sheet, gi * GLYPH_W, 0, GLYPH_W, GLYPH_H, x + i * GLYPH_W, y, GLYPH_W, GLYPH_H);
    }
  }

  measure(text: string): number {
    return Array.from(text).length * GLYPH_W;
  }
}
