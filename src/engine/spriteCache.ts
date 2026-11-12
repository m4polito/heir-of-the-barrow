import { compilePixelArt, type PixelArt } from './pixels';
import { rgbaToCanvas } from './canvasImage';

/** Compiles pixel art to canvases lazily, once per PixelArt object identity. */
export class SpriteCache {
  private readonly cache = new Map<PixelArt, HTMLCanvasElement>();

  constructor(private readonly palette: readonly string[]) {}

  get(art: PixelArt): HTMLCanvasElement {
    let c = this.cache.get(art);
    if (!c) {
      c = rgbaToCanvas(compilePixelArt(art, this.palette));
      this.cache.set(art, c);
    }
    return c;
  }
}
