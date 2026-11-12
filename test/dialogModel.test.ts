import { describe, it, expect } from 'vitest';
import { ScriptRunner, type DialogScript, type ScriptEnv } from '../src/game/dialog/script';
import { DialogModel } from '../src/game/dialog/model';

function model(script: DialogScript, name = 'Wren', cols?: number, rows?: number) {
  const env: ScriptEnv = {
    name,
    has: () => false,
    set: () => {},
    give: () => true,
    gold: () => {},
    heal: () => {},
    sfx: () => {},
  };
  return new DialogModel(new ScriptRunner(script, env), cols, rows);
}

describe('DialogModel', () => {
  it('types one character per tick; false on a space', () => {
    const m = model(["You have your father's eyes, Wren."]);
    for (let i = 0; i < 5; i++) m.tick();
    expect(m.lines[0]).toBe('You h');
    expect(m.revealed).toBe(false);
    const m2 = model(['ab cd']);
    expect(m2.tick()).toBe(true);
    expect(m2.tick()).toBe(true);
    expect(m2.tick()).toBe(false);
  });

  it('confirm before revealed reveals all without advancing', () => {
    const m = model(['Hello there']);
    m.confirm();
    expect(m.revealed).toBe(true);
    expect(m.done).toBe(false);
    expect(m.lines).toEqual(['Hello there']);
    expect(m.tick()).toBe(false);
    m.confirm();
    expect(m.done).toBe(true);
  });

  it('confirm when done is a no-op', () => {
    const m = model(['Hi']);
    m.confirm();
    m.confirm();
    expect(m.done).toBe(true);
    m.confirm();
    expect(m.done).toBe(true);
  });

  it('is done from the start for an empty script', () => {
    expect(model([]).done).toBe(true);
  });

  it('paginates a long text into pages of 4 lines', () => {
    const m = model(['word '.repeat(30).trim()]);
    m.confirm();
    expect(m.lines.length).toBe(4);
    expect(m.hasMore).toBe(true);
    m.confirm();
    expect(m.done).toBe(false);
    expect(m.revealed).toBe(false);
    m.confirm();
    expect(m.lines.length).toBeGreaterThan(0);
    expect(m.hasMore).toBe(false);
    m.confirm();
    expect(m.done).toBe(true);
  });

  it('hasMore is false on the last page even when more steps follow', () => {
    const m = model(['one', 'two']);
    m.confirm();
    expect(m.hasMore).toBe(false);
  });

  it('splits a 40-char word to at most 28 columns', () => {
    const m = model(['x'.repeat(40)]);
    m.confirm();
    expect(m.lines.every((l) => l.length <= 28)).toBe(true);
    expect(m.lines.join('')).toBe('x'.repeat(40));
  });

  it('wraps within 28 after name substitution', () => {
    const m = model(['Greetings {name}, welcome to our little town, friend of the road.'], 'Wrenwren');
    m.confirm();
    expect(m.lines.join(' ')).toContain('Wrenwren');
    expect(m.lines.every((l) => l.length <= 28)).toBe(true);
  });

  it('shows partial lines only up to the one being typed', () => {
    const m = model(['aaaa bbbb cccc dddd eeee ffff gggg'], 'Wren', 10, 4);
    for (let i = 0; i < 12; i++) m.tick();
    expect(m.lines).toEqual(['aaaa bbbb', 'ccc']);
  });

  it('choice page: no answer submits false and the no text follows', () => {
    const m = model([{ choice: ['Yes', 'No'], yes: ['Y'], no: ['N'] }]);
    expect(m.isChoice).toBe(true);
    expect(m.revealed).toBe(true);
    expect(m.lines).toEqual(['Yes', 'No']);
    expect(m.choiceCursor).toBe(0);
    expect(m.tick()).toBe(false);
    m.moveChoice(1);
    expect(m.choiceCursor).toBe(1);
    m.confirm();
    expect(m.isChoice).toBe(false);
    m.confirm();
    expect(m.lines).toEqual(['N']);
  });

  it('choice page: cursor 0 submits true', () => {
    const m = model([{ choice: ['Yes', 'No'], yes: ['Y'], no: ['N'] }]);
    m.confirm();
    m.confirm();
    expect(m.lines).toEqual(['Y']);
    m.confirm();
    expect(m.done).toBe(true);
  });
});
