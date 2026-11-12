import { describe, it, expect, vi } from 'vitest';
import { StateStack, type State } from '../src/engine/state';
import type { Input } from '../src/engine/input';
import { TransitionState, transitionAlpha } from '../src/game/transition';

const input = {} as Input;

function fakeState(): State & { enter: ReturnType<typeof vi.fn> } {
  return { enter: vi.fn(), update: () => {}, render: () => {} };
}

describe('transitionAlpha', () => {
  it('ramps up then down', () => {
    expect(transitionAlpha(0, 12)).toBe(0);
    expect(transitionAlpha(6, 12)).toBe(0.5);
    expect(transitionAlpha(12, 12)).toBe(1);
    expect(transitionAlpha(18, 12)).toBe(0.5);
    expect(transitionAlpha(24, 12)).toBe(0);
  });
});

describe('transitionAlpha with unequal halves', () => {
  it('fades out over `out` and in over `inn`', () => {
    expect(transitionAlpha(15, 30, 10)).toBe(0.5);
    expect(transitionAlpha(30, 30, 10)).toBe(1);
    expect(transitionAlpha(35, 30, 10)).toBe(0.5);
    expect(transitionAlpha(40, 30, 10)).toBe(0);
  });
});

describe('TransitionState', () => {
  it('honours a separate inFrames', () => {
    const stack = new StateStack();
    const onMid = vi.fn();
    const t = new TransitionState(stack, { frames: 30, inFrames: 10, onMid });
    stack.push(t);
    for (let i = 1; i <= 45; i++) {
      stack.update(input);
      if (i === 29) expect(onMid).not.toHaveBeenCalled();
      if (i === 30) expect(onMid).toHaveBeenCalledTimes(1);
      if (i === 39) expect(stack.states).toContain(t);
      if (i === 40) expect(stack.states).not.toContain(t);
    }
    expect(onMid).toHaveBeenCalledTimes(1);
  });

  it('calls onMid once and removes itself by update 24', () => {
    const stack = new StateStack();
    const onMid = vi.fn();
    const t = new TransitionState(stack, { frames: 12, onMid });
    stack.push(t);
    for (let i = 1; i <= 30; i++) {
      stack.update(input);
      if (i === 11) expect(onMid).not.toHaveBeenCalled();
      if (i === 12) expect(onMid).toHaveBeenCalledTimes(1);
      if (i === 23) expect(stack.states).toContain(t);
      if (i === 24) expect(stack.states).not.toContain(t);
    }
    expect(onMid).toHaveBeenCalledTimes(1);
  });

  it('survives onMid resetting the stack', () => {
    const stack = new StateStack();
    const c = fakeState();
    const t = new TransitionState(stack, { frames: 12, onMid: () => stack.reset(c) });
    stack.push(t);
    for (let i = 1; i <= 30; i++) stack.update(input);
    expect(stack.states).toEqual([c]);
    expect(c.enter).toHaveBeenCalledTimes(1);
  });

  it('fills black at the midpoint', () => {
    const stack = new StateStack();
    const t = new TransitionState(stack, { frames: 12, onMid: () => {} });
    stack.push(t);
    for (let i = 0; i < 12; i++) t.update(input);
    const alphas: number[] = [];
    const ctx = {
      fillRect: () => alphas.push(ctx.globalAlpha),
      globalAlpha: 1,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D;
    t.render(ctx, 0);
    expect(alphas).toEqual([1]);
    expect(ctx.globalAlpha).toBe(1);
  });
});
