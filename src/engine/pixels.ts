export interface PixelArt {
  w: number;
  h: number;
  colors: Record<string, number>;
  rows: string[];
}

export interface Rgba {
  w: number;
  h: number;
  data: Uint8ClampedArray;
}

export function hexToRgb(hex: string): [number, number, number] {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`Invalid hex color: ${hex}`);
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function compilePixelArt(art: PixelArt, palette: readonly string[]): Rgba {
  const { w, h, colors, rows } = art;
  if (rows.length !== h) throw new Error(`Expected ${h} rows, got ${rows.length}`);
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const row = rows[y] ?? '';
    if (row.length !== w) {
      throw new Error(`Pixel art row ${y} has length ${row.length}, expected ${w}`);
    }
    for (let x = 0; x < w; x++) {
      const ch = row.charAt(x);
      if (ch === '.') continue;
      const index = colors[ch];
      if (index === undefined) throw new Error(`Unknown pixel character '${ch}' at row ${y}, col ${x}`);
      const hex = palette[index];
      if (hex === undefined) throw new Error(`Palette index ${index} out of range for '${ch}'`);
      const [r, g, b] = hexToRgb(hex);
      const o = (y * w + x) * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = 255;
    }
  }
  return { w, h, data };
}
