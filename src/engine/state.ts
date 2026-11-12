import type { Input } from './input';

export interface State {
  enter?(): void;
  exit?(): void;
  update(input: Input): void;
  render(ctx: CanvasRenderingContext2D, frame: number): void;
}

export class StateStack {
  private readonly states: State[] = [];

  get top(): State | undefined {
    return this.states[this.states.length - 1];
  }

  push(s: State): void {
    this.states.push(s);
    s.enter?.();
  }

  pop(): void {
    this.states.pop()?.exit?.();
  }

  replace(s: State): void {
    this.pop();
    this.push(s);
  }

  update(input: Input): void {
    this.top?.update(input);
  }

  render(ctx: CanvasRenderingContext2D, frame: number): void {
    for (const s of this.states) s.render(ctx, frame);
  }
}
