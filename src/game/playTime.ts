import type { PlayerState } from './player';

const FPS = 60;

/** 999:59:59 in 60 fps update steps. */
export const PLAY_FRAMES_MAX = 999 * 3600 * FPS + 59 * 60 * FPS + 59 * FPS + 59;

/** One more update step played, held at the cap. */
export function tickPlayTime(p: PlayerState): PlayerState {
  return p.playFrames >= PLAY_FRAMES_MAX ? p : { ...p, playFrames: p.playFrames + 1 };
}

/** `h:mm`: hours unpadded, minutes two digits, seconds dropped. */
export function formatPlayTime(frames: number): string {
  const minutes = Math.floor(frames / (60 * FPS));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h + ':' + (m < 10 ? '0' : '') + m;
}
