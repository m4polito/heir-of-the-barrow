import type { Action } from './constants';

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
};

export class Input {
  private codes = new Set<string>();
  private down = new Set<Action>();
  private prevDown = new Set<Action>();
  private anyDownFlag = false;
  private anyThisTick = false;

  keyDown(code: string): void {
    if (!this.codes.has(code)) this.anyDownFlag = true;
    this.codes.add(code);
  }

  keyUp(code: string): void {
    this.codes.delete(code);
  }

  clear(): void {
    this.codes.clear();
  }

  /** Call exactly once per tick, before any state reads input. */
  update(): void {
    this.prevDown = this.down;
    this.down = new Set<Action>();
    for (const code of this.codes) {
      const action = KEY_MAP[code];
      if (action) this.down.add(action);
    }
    this.anyThisTick = this.anyDownFlag;
    this.anyDownFlag = false;
  }

  held(a: Action): boolean {
    return this.down.has(a);
  }

  pressed(a: Action): boolean {
    return this.down.has(a) && !this.prevDown.has(a);
  }

  anyPressed(): boolean {
    return this.anyThisTick;
  }

  attach(target: Window): () => void {
    const onKeyDown = (e: KeyboardEvent): void => {
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
