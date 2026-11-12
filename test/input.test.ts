import { describe, it, expect } from 'vitest';
import { Input } from '../src/engine/input';

describe('Input', () => {
  it('reports pressed on first tick only, held while down', () => {
    const i = new Input();
    i.keyDown('KeyW');
    i.update();
    expect(i.held('up')).toBe(true);
    expect(i.pressed('up')).toBe(true);
    i.update();
    expect(i.pressed('up')).toBe(false);
    expect(i.held('up')).toBe(true);
  });

  it('does not re-trigger pressed on auto-repeat keydown', () => {
    const i = new Input();
    i.keyDown('KeyW');
    i.update();
    i.keyDown('KeyW');
    i.update();
    expect(i.pressed('up')).toBe(false);
  });

  it('releases on keyUp', () => {
    const i = new Input();
    i.keyDown('ArrowLeft');
    i.update();
    i.keyUp('ArrowLeft');
    i.update();
    expect(i.held('left')).toBe(false);
  });

  it('maps confirm, cancel and mute keys', () => {
    const cases: [string, 'confirm' | 'cancel' | 'mute'][] = [
      ['KeyZ', 'confirm'], ['Enter', 'confirm'], ['Space', 'confirm'],
      ['KeyX', 'cancel'], ['Escape', 'cancel'], ['KeyM', 'mute'],
    ];
    for (const [code, action] of cases) {
      const i = new Input();
      i.keyDown(code);
      i.update();
      expect(i.pressed(action)).toBe(true);
    }
  });

  it('anyPressed is true for unmapped keys without holding an action', () => {
    const i = new Input();
    i.keyDown('KeyQ');
    i.update();
    expect(i.anyPressed()).toBe(true);
    for (const a of ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'mute'] as const) {
      expect(i.held(a)).toBe(false);
    }
    i.update();
    expect(i.anyPressed()).toBe(false);
  });

  it('clear releases held keys', () => {
    const i = new Input();
    i.keyDown('KeyW');
    i.update();
    i.clear();
    i.update();
    expect(i.held('up')).toBe(false);
  });

  it('keeps action held while another key for it remains down', () => {
    const i = new Input();
    i.keyDown('KeyW');
    i.keyDown('ArrowUp');
    i.keyUp('KeyW');
    i.update();
    expect(i.held('up')).toBe(true);
  });
});
