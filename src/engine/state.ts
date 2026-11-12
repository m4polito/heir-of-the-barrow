import type { Input } from './input';

export interface State {
  enter?(): void;
  exit?(): void;
  update(input: Input): void;
  render(ctx: CanvasRenderingContext2D, frame: number): void;
}

export class StateStack {
  private readonly list: State[] = [];

  get states(): readonly State[] {
    return this.list;
  }

  get top(): State | undefined {
    return this.list[this.list.length - 1];
  }

  contains(s: State): boolean {
    return this.list.includes(s);
  }

  /** Exits every state from top to bottom, clears the stack, then pushes `s`. */
  reset(s: State): void {
    while (this.list.length > 0) this.list.pop()?.exit?.();
    this.push(s);
  }

  /** Removes that exact instance wherever it is; no-op if absent. */
  remove(s: State): void {
    const i = this.list.indexOf(s);
    if (i < 0) return;
    this.list.splice(i, 1);
    s.exit?.();
  }

  push(s: State): void {
    this.list.push(s);
    s.enter?.();
  }

  pop(): void {
    this.list.pop()?.exit?.();
  }

  replace(s: State): void {
    this.pop();
    this.push(s);
  }

  update(input: Input): void {
    this.top?.update(input);
  }

  render(ctx: CanvasRenderingContext2D, frame: number): void {
    for (const s of this.list) s.render(ctx, frame);
  }
}
