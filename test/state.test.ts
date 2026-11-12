import { describe, it, expect } from 'vitest';
import { StateStack, type State } from '../src/engine/state';
import type { Input } from '../src/engine/input';

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
});
