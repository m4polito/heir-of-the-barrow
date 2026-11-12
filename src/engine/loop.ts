export const STEP_MS = 1000 / 60;
export const MAX_STEPS_PER_FRAME = 5;

export function advance(
  accumulatorMs: number,
  elapsedMs: number,
): { steps: number; remainderMs: number } {
  const total = accumulatorMs + elapsedMs;
  const steps = Math.floor(total / STEP_MS + 1e-9);
  if (steps > MAX_STEPS_PER_FRAME) {
    return { steps: MAX_STEPS_PER_FRAME, remainderMs: 0 };
  }
  return { steps, remainderMs: Math.max(0, total - steps * STEP_MS) };
}

/** Browser rAF timestamps are coarse; treat near-one-step frames as exactly one step. */
export function snapElapsed(elapsedMs: number): number {
  return Math.abs(elapsedMs - STEP_MS) < 1 ? STEP_MS : elapsedMs;
}

export function startLoop(update: () => void, render: () => void): () => void {
  let lastTime: number | null = null;
  let accumulator = 0;
  let handle = 0;

  const frame = (now: number): void => {
    const elapsed = lastTime === null ? 0 : now - lastTime;
    lastTime = now;
    const result = advance(accumulator, snapElapsed(elapsed));
    accumulator = result.remainderMs;
    for (let i = 0; i < result.steps; i++) update();
    render();
    handle = requestAnimationFrame(frame);
  };

  handle = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(handle);
}
