import { DIR_VECTORS, TILE, type Dir } from '../engine/constants';

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

export function updateHero(
  h: HeroState,
  held: (a: Dir) => boolean,
  canEnter: (x: number, y: number) => boolean,
  onArrive?: (x: number, y: number) => boolean,
): HeroState {
  const s = { ...h };
  if (s.stepFrame > 0) {
    s.stepFrame -= 1;
    if (s.stepFrame > 0) return s;
    if (onArrive?.(s.x, s.y)) return s;
  }
  const dir = PRIORITY.find((d) => held(d));
  if (dir === undefined) return s;
  s.facing = dir;
  const v = DIR_VECTORS[dir];
  const tx = s.x + v.dx;
  const ty = s.y + v.dy;
  if (canEnter(tx, ty)) {
    s.x = tx;
    s.y = ty;
    s.stepFrame = STEP_FRAMES;
    s.walkFrame = s.walkFrame === 0 ? 1 : 0;
  }
  return s;
}

export function facingTile(h: HeroState): { x: number; y: number } {
  const v = DIR_VECTORS[h.facing];
  return { x: h.x + v.dx, y: h.y + v.dy };
}

export function opposite(d: Dir): Dir {
  return { up: 'down', down: 'up', left: 'right', right: 'left' }[d] as Dir;
}

export function heroIdle(h: HeroState): boolean {
  return h.stepFrame === 0;
}

export function heroPixelOffset(h: HeroState): { dx: number; dy: number } {
  const v = DIR_VECTORS[h.facing];
  const t = h.stepFrame / STEP_FRAMES;
  return { dx: -v.dx * t * TILE + 0, dy: -v.dy * t * TILE + 0 };
}
