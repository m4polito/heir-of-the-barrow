import { LOGICAL_W, LOGICAL_H, TILE, CENTER_COL, CENTER_ROW } from '../engine/constants';
import type { GameMap } from './map';

/** Map-pixel coordinate drawn at the viewport's top-left. */
export function cameraOrigin(map: GameMap, heroPxX: number, heroPxY: number): { ox: number; oy: number } {
  const mw = map.width * TILE;
  const mh = map.height * TILE;
  const ox = mw > LOGICAL_W ? heroPxX - CENTER_COL * TILE : -Math.floor((LOGICAL_W - mw) / 2);
  const oy = mh > LOGICAL_H ? heroPxY - CENTER_ROW * TILE : -Math.floor((LOGICAL_H - mh) / 2);
  return { ox, oy };
}
