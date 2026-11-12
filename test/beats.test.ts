import { describe, expect, it } from 'vitest';
import { BeatPlayer, type Beat } from '../src/game/battle/beats';

const beat = (text: string): Beat => ({ text, heroHp: 1, monsterHp: 1 });

describe('BeatPlayer', () => {
  it('types, holds and advances on schedule', () => {
    const p = new BeatPlayer();
    p.load([beat('Hi'), beat('Yo')], false);
    const started: number[] = [];
    for (let t = 1; t <= 55; t++) {
      if (p.tick(false)) started.push(t);
      if (t === 1) expect(p.lines).toEqual(['']);
      if (t === 2) expect(p.lines).toEqual(['H']);
      if (t === 3) {
        expect(p.lines).toEqual(['Hi']);
        expect(p.revealed).toBe(true);
      }
      expect(p.done).toBe(t >= 55);
    }
    expect(started).toEqual([1, 28]);
  });

  it('confirm while typing only reveals the message', () => {
    const p = new BeatPlayer();
    const first = beat('x'.repeat(20));
    const second = beat('Yo');
    p.load([first, second], false);
    p.tick(false);
    expect(p.tick(true)).toBeNull();
    expect(p.revealed).toBe(true);
    expect(p.current).toBe(first);
    expect(p.tick(true)).toBe(second);
  });

  it('waitOnLast needs a confirm', () => {
    const p = new BeatPlayer();
    p.load([beat('Hi')], true);
    for (let i = 0; i < 3; i++) p.tick(false);
    expect(p.revealed).toBe(true);
    for (let i = 0; i < 100; i++) p.tick(false);
    expect(p.done).toBe(false);
    expect(p.waiting).toBe(true);
    p.tick(true);
    expect(p.done).toBe(true);
    expect(p.current?.text).toBe('Hi');
  });

  it('wraps long text to cols', () => {
    const p = new BeatPlayer();
    p.load([beat('aaaa bbbb cccc dddd eeee ffff gggg hhhhh')], false);
    p.tick(false);
    p.tick(true);
    expect(p.lines.length).toBe(2);
    expect(p.lines.every((l) => l.length <= 28)).toBe(true);
  });

  it('never moves a typed word to another line while revealing', () => {
    const text = 'The Bog Mireling takes 12 damage.';
    const full = new BeatPlayer();
    full.load([beat(text)], false);
    full.tick(false);
    full.tick(true);
    const final = full.lines;
    expect(final.length).toBe(2);
    const p = new BeatPlayer();
    p.load([beat(text)], false);
    for (let t = 0; t < text.length + 5; t++) {
      p.tick(false);
      p.lines.forEach((line, i) => expect(final[i]!.startsWith(line)).toBe(true));
    }
    expect(p.lines).toEqual(final);
    expect(p.revealed).toBe(true);
  });

  it('is not waiting once done, and has no current beat right after load', () => {
    const p = new BeatPlayer();
    p.load([beat('Hi')], true);
    expect(p.current).toBeNull();
    for (let i = 0; i < 5; i++) p.tick(false);
    expect(p.waiting).toBe(true);
    p.tick(true);
    expect(p.done).toBe(true);
    expect(p.waiting).toBe(false);
  });

  it('empty load is done', () => {
    const p = new BeatPlayer();
    p.load([], false);
    expect(p.done).toBe(true);
  });
});
