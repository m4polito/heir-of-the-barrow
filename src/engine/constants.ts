export const LOGICAL_W = 256;
export const LOGICAL_H = 240;
export const TILE = 16;
export const VIEW_COLS = 16;
export const VIEW_ROWS = 15;
export const CENTER_COL = 7;
export const CENTER_ROW = 7;

export type Dir = 'up' | 'down' | 'left' | 'right';
export type Action = Dir | 'confirm' | 'cancel' | 'mute' | 'debug';

export const DIR_VECTORS: Record<Dir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};
