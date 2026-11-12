import type { Rgba } from './pixels';

export function rgbaToCanvas(img: Rgba): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.w;
  canvas.height = img.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.w, img.h), 0, 0);
  return canvas;
}
