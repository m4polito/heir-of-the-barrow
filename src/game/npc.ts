import { DIR_VECTORS, TILE, type Dir } from '../engine/constants';
import type { Rng } from '../engine/rng';
import { STEP_FRAMES } from './hero';
import type { NpcPlacement } from './map';

export interface NpcState {
  def: NpcPlacement;
  x: number;
  y: number;
  facing: Dir;
  stepFrame: number;
  walkFrame: 0 | 1;
  wait: number;
}

const PICK: Dir[] = ['up', 'down', 'left', 'right'];
const TETHER = 2;

export function createNpc(def: NpcPlacement): NpcState {
  return { def, x: def.x, y: def.y, facing: def.facing, stepFrame: 0, walkFrame: 0, wait: 60 };
}

export function updateNpc(
  n: NpcState,
  rng: Rng,
  canEnter: (x: number, y: number) => boolean,
): NpcState {
  const s = { ...n };
  if (s.stepFrame > 0) {
    s.stepFrame -= 1;
    return s;
  }
  if (s.wait > 0) {
    s.wait -= 1;
    return s;
  }
  if (!s.def.wander) return s;
  const dir = PICK[rng.int(0, 3)]!;
  s.facing = dir;
  const v = DIR_VECTORS[dir];
  const tx = s.x + v.dx;
  const ty = s.y + v.dy;
  const home = Math.max(Math.abs(tx - s.def.x), Math.abs(ty - s.def.y)) <= TETHER;
  if (home && canEnter(tx, ty)) {
    s.x = tx;
    s.y = ty;
    s.stepFrame = STEP_FRAMES;
    s.walkFrame = s.walkFrame === 0 ? 1 : 0;
  }
  s.wait = rng.int(45, 150);
  return s;
}

export function npcPixelOffset(n: NpcState): { dx: number; dy: number } {
  const v = DIR_VECTORS[n.facing];
  const t = n.stepFrame / STEP_FRAMES;
  return { dx: -v.dx * t * TILE + 0, dy: -v.dy * t * TILE + 0 };
}
