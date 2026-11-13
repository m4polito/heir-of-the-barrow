import { LOGICAL_W, LOGICAL_H, TILE } from '../engine/constants';

/** Tiles of light around the hero on a dark map with no torch burning. */
export const DARK_RADIUS = 1;
/** Tiles of light around the hero while a torch burns. */
export const TORCH_RADIUS = 3;

/** `null` on a map that is not dark; else the lit radius in tiles. */
export function lightRadius(dark: boolean, torch: number, torchRadius: number): number | null {
  if (!dark) return null;
  return torch > 0 ? torchRadius : DARK_RADIUS;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Up to four rectangles covering the screen outside the square of (2·radius + 1) tiles
 * centred on the tile whose top-left is at screen position (heroX, heroY).
 */
export function darkRects(heroX: number, heroY: number, radius: number): Rect[] {
  const x0 = Math.min(LOGICAL_W, Math.max(0, heroX - radius * TILE));
  const y0 = Math.min(LOGICAL_H, Math.max(0, heroY - radius * TILE));
  const x1 = Math.min(LOGICAL_W, Math.max(x0, heroX + TILE + radius * TILE));
  const y1 = Math.min(LOGICAL_H, Math.max(y0, heroY + TILE + radius * TILE));
  const all: Rect[] = [
    { x: 0, y: 0, w: LOGICAL_W, h: y0 },
    { x: 0, y: y1, w: LOGICAL_W, h: LOGICAL_H - y1 },
    { x: 0, y: y0, w: x0, h: y1 - y0 },
    { x: x1, y: y0, w: LOGICAL_W - x1, h: y1 - y0 },
  ];
  return all.filter((r) => r.w > 0 && r.h > 0);
}
