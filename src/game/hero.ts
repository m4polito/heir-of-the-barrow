import { DIR_VECTORS, TILE, type Dir } from '../engine/constants';
import { isWalkable, type GameMap } from './map';

export const STEP_FRAMES = 8;

export interface HeroState {
  x: number;
  y: number;
  facing: Dir;
  stepFrame: number;
  walkFrame: 0 | 1;
}

const PRIORITY: Dir[] = ['up', 'down', 'left', 'right'];

export function createHero(x: number, y: number, facing: Dir): HeroState {
  return { x, y, facing, stepFrame: 0, walkFrame: 0 };
}

export function updateHero(h: HeroState, held: (a: Dir) => boolean, map: GameMap): HeroState {
  const s = { ...h };
  if (s.stepFrame > 0) {
    s.stepFrame -= 1;
    if (s.stepFrame > 0) return s;
  }
  const dir = PRIORITY.find((d) => held(d));
  if (dir === undefined) return s;
  s.facing = dir;
  const v = DIR_VECTORS[dir];
  const tx = s.x + v.dx;
  const ty = s.y + v.dy;
  if (isWalkable(map, tx, ty)) {
    s.x = tx;
    s.y = ty;
    s.stepFrame = STEP_FRAMES;
    s.walkFrame = s.walkFrame === 0 ? 1 : 0;
  }
  return s;
}

export function heroPixelOffset(h: HeroState): { dx: number; dy: number } {
  const v = DIR_VECTORS[h.facing];
  const t = h.stepFrame / STEP_FRAMES;
  return { dx: -v.dx * t * TILE + 0, dy: -v.dy * t * TILE + 0 };
}
