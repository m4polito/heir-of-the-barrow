import type { Font } from '../engine/font';

export function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#FCFCFC';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
}

export function drawMenu(
  ctx: CanvasRenderingContext2D,
  font: Font,
  items: readonly string[],
  cursor: number,
  x: number,
  y: number,
  lineH = 10,
): void {
  for (let i = 0; i < items.length; i++) {
    font.drawText(ctx, items[i] as string, x + 8, y + i * lineH);
  }
  if (cursor >= 0 && cursor < items.length) font.drawText(ctx, '▶', x, y + cursor * lineH);
}
