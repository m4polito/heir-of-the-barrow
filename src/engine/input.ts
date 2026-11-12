import type { Action } from './constants';

export const REPEAT_DELAY = 16;
export const REPEAT_INTERVAL = 5;

export const KEY_MAP: Record<string, Action> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  KeyZ: 'confirm',
  Enter: 'confirm',
  Space: 'confirm',
  KeyX: 'cancel',
  Escape: 'cancel',
  KeyM: 'mute',
  Backquote: 'debug',
};

export class Input {
  private codes = new Set<string>();
  private down = new Set<Action>();
  private prevDown = new Set<Action>();
  private anyDownFlag = false;
  private anyThisTick = false;
  private heldTicks = new Map<Action, number>();
  private rearmed = new Set<Action>();

  keyDown(code: string): void {
    if (!this.codes.has(code)) this.anyDownFlag = true;
    this.codes.add(code);
  }

  keyUp(code: string): void {
    this.codes.delete(code);
  }

  clear(): void {
    this.codes.clear();
    this.heldTicks.clear();
    this.rearmed.clear();
  }

  /** Call exactly once per tick, before any state reads input. */
  update(): void {
    this.prevDown = this.down;
    this.down = new Set<Action>();
    for (const code of this.codes) {
      const action = KEY_MAP[code];
      if (action) this.down.add(action);
    }
    for (const a of [...this.heldTicks.keys()]) {
      if (!this.down.has(a)) this.heldTicks.delete(a);
    }
    for (const a of [...this.rearmed]) {
      if (!this.down.has(a)) this.rearmed.delete(a);
    }
    for (const a of this.down) this.heldTicks.set(a, (this.heldTicks.get(a) ?? 0) + 1);
    this.anyThisTick = this.anyDownFlag;
    this.anyDownFlag = false;
  }

  held(a: Action): boolean {
    return this.down.has(a);
  }

  pressed(a: Action): boolean {
    return this.down.has(a) && !this.prevDown.has(a);
  }

  /** Every action held right now yields no `repeat` until released and pressed again. */
  rearm(): void {
    for (const a of this.heldTicks.keys()) this.rearmed.add(a);
  }

  repeat(a: Action): boolean {
    if (this.rearmed.has(a)) return false;
    const ticks = this.heldTicks.get(a) ?? 0;
    if (ticks === 1) return true;
    return ticks > REPEAT_DELAY && (ticks - REPEAT_DELAY - 1) % REPEAT_INTERVAL === 0;
  }

  anyPressed(): boolean {
    return this.anyThisTick;
  }

  attach(target: Window): () => void {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (KEY_MAP[e.code]) e.preventDefault();
      this.keyDown(e.code);
    };
    const onKeyUp = (e: KeyboardEvent): void => {
      if (KEY_MAP[e.code]) e.preventDefault();
      this.keyUp(e.code);
    };
    const onBlur = (): void => this.clear();
    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
    target.addEventListener('blur', onBlur);
    return () => {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', onBlur);
    };
  }
}
