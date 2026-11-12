import { describe, it, expect } from 'vitest';
import { StateStack, type State } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import { TransitionState } from '../src/game/transition';

function fake(name: string, log: string[]): State {
  return {
    enter: () => log.push(`${name}.enter`),
    exit: () => log.push(`${name}.exit`),
    update: () => log.push(`${name}.update`),
    render: (_c, frame) => log.push(`${name}.render:${frame}`),
  };
}
const input = {} as Input;
const ctx = {} as CanvasRenderingContext2D;

describe('StateStack', () => {
  it('updates only the top state', () => {
    const log: string[] = [];
    const s = new StateStack();
    s.push(fake('a', log));
    s.push(fake('b', log));
    log.length = 0;
    s.update(input);
    expect(log).toEqual(['b.update']);
  });
  it('renders bottom to top', () => {
    const log: string[] = [];
    const s = new StateStack();
    s.push(fake('a', log));
    s.push(fake('b', log));
    log.length = 0;
    s.render(ctx, 7);
    expect(log).toEqual(['a.render:7', 'b.render:7']);
  });
  it('replace exits the top then enters the new one', () => {
    const log: string[] = [];
    const s = new StateStack();
    s.push(fake('a', log));
    s.push(fake('b', log));
    const c = fake('c', log);
    log.length = 0;
    s.replace(c);
    expect(log).toEqual(['b.exit', 'c.enter']);
    expect(s.top).toBe(c);
  });
  it('pop on empty does not throw', () => {
    expect(() => new StateStack().pop()).not.toThrow();
  });
  it('reset exits top to bottom, then enters the new state', () => {
    const log: string[] = [];
    const s = new StateStack();
    s.push(fake('a', log));
    s.push(fake('b', log));
    const c = fake('c', log);
    log.length = 0;
    s.reset(c);
    expect(log).toEqual(['b.exit', 'a.exit', 'c.enter']);
    expect(s.states).toEqual([c]);
  });
  it('remove takes out that exact instance and keeps the top', () => {
    const log: string[] = [];
    const s = new StateStack();
    const a = fake('a', log);
    const b = fake('b', log);
    const c = fake('c', log);
    s.push(a);
    s.push(b);
    s.push(c);
    log.length = 0;
    s.remove(b);
    expect(log).toEqual(['b.exit']);
    expect(s.states).toEqual([a, c]);
    expect(s.top).toBe(c);
    expect(s.contains(b)).toBe(false);
    expect(s.contains(c)).toBe(true);
    expect(() => s.remove(b)).not.toThrow();
  });
  it('a transition under a pushed state removes only itself', () => {
    const log: string[] = [];
    const s = new StateStack();
    const a = fake('a', log);
    const b = fake('b', log);
    const t = new TransitionState(s, { frames: 3, onMid: () => {} });
    s.push(a);
    s.push(t);
    s.push(b);
    for (let i = 0; i < 6; i++) t.update(input);
    expect(s.states).toEqual([a, b]);
  });
});
