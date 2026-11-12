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
    pay: () => true,
    rest: () => {},
    save: () => true,
    shop: () => {},
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

  it('hasMore is true on a step that has later steps, false on the last one', () => {
    const m = model(['one', 'two']);
    m.confirm();
    expect(m.revealed).toBe(true);
    expect(m.hasMore).toBe(true);
    m.confirm();
    m.confirm();
    expect(m.lines).toEqual(['two']);
    expect(m.hasMore).toBe(false);
  });

  it('reading hasMore runs no script effects', () => {
    const log: string[] = [];
    const env: ScriptEnv = {
      name: 'Wren',
      has: () => false,
      set: (f) => log.push(`set:${f}`),
      give: (i) => (log.push(`give:${i}`), true),
      gold: () => {},
      heal: () => {},
      sfx: () => {},
      pay: () => true,
      rest: () => {},
      save: () => true,
      shop: () => {},
    };
    const m = new DialogModel(new ScriptRunner(['one', { set: 'f' }, { give: 'x' }, 'two'], env));
    m.confirm();
    for (let i = 0; i < 5; i++) expect(m.hasMore).toBe(true);
    expect(log).toEqual([]);
    m.confirm();
    expect(log).toEqual(['set:f', 'give:x']);
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

describe('DialogModel.skipAll', () => {
  function tracked(script: DialogScript) {
    const log: string[] = [];
    const env: ScriptEnv = {
      name: 'Wren',
      has: () => false,
      set: (f) => log.push('set:' + f),
      give: (i) => (log.push('give:' + i), true),
      gold: (n) => log.push('gold:' + n),
      heal: () => log.push('heal'),
      sfx: (id) => log.push('sfx:' + id),
      pay: () => true,
      rest: () => {},
      save: () => true,
      shop: () => {},
    };
    return { log, m: new DialogModel(new ScriptRunner(script, env)) };
  }

  it('applies remaining effects, answers every choice No, and finishes', () => {
    const { m, log } = tracked([
      'one',
      { give: 'a' },
      { choice: ['Y', 'N'], yes: [{ set: 'yes' }], no: [{ set: 'no' }] },
      { gold: 5 },
      { choice: ['Y2', 'N2'], yes: [{ set: 'yes2' }], no: [{ set: 'no2' }] },
    ]);
    let n = 0;
    m.skipAll(() => n++);
    expect(m.done).toBe(true);
    expect(n).toBe(2);
    expect(log).toEqual(['give:a', 'set:no', 'gold:5', 'set:no2']);
  });

  it('counts a choice page that is currently showing', () => {
    const { m, log } = tracked([{ choice: ['Y', 'N'], yes: [{ set: 'yes' }], no: [{ set: 'no' }] }]);
    expect(m.isChoice).toBe(true);
    let n = 0;
    m.skipAll(() => n++);
    expect(n).toBe(1);
    expect(log).toEqual(['set:no']);
    expect(m.done).toBe(true);
  });
});

describe('DialogModel choice with a question', () => {
  const ask = (q: string) => model([{ choice: ['Yes', 'No'], ask: q, yes: [], no: [] }]);

  it('types the question, then reveals', () => {
    const m = ask('Equip it?');
    expect(m.isChoice).toBe(true);
    expect(m.revealed).toBe(false);
    for (let i = 0; i < 3; i++) m.tick();
    expect(m.ask).toEqual(['Equ']);
    for (let i = 0; i < 6; i++) m.tick();
    expect(m.ask).toEqual(['Equip it?']);
    expect(m.revealed).toBe(true);
    expect(m.tick()).toBe(false);
    expect(m.lines).toEqual(['Yes', 'No']);
  });

  it('tick returns true for a non-space question character', () => {
    const m = ask('a b');
    expect(m.tick()).toBe(true);
    expect(m.tick()).toBe(false);
    expect(m.tick()).toBe(true);
  });

  it('moveChoice waits for the reveal', () => {
    const m = ask('Equip it?');
    m.moveChoice(1);
    expect(m.choiceCursor).toBe(0);
    for (let i = 0; i < 9; i++) m.tick();
    m.moveChoice(1);
    expect(m.choiceCursor).toBe(1);
  });

  it('confirm while typing only reveals the rest', () => {
    const sets: string[] = [];
    const env: ScriptEnv = { name: 'Wren', has: () => false, set: (f) => sets.push(f), give: () => true, gold: () => {}, heal: () => {}, sfx: () => {}, pay: () => true, rest: () => {}, save: () => true, shop: () => {} };
    const m2 = new DialogModel(new ScriptRunner([{ choice: ['Yes', 'No'], ask: 'Equip it?', yes: [{ set: 'y' }], no: [] }], env));
    for (let i = 0; i < 3; i++) m2.tick();
    m2.confirm();
    expect(m2.revealed).toBe(true);
    expect(m2.isChoice).toBe(true);
    expect(m2.ask).toEqual(['Equip it?']);
    expect(sets).toEqual([]);
    m2.confirm();
    expect(sets).toEqual(['y']);
  });

  it('a choice with no question is revealed at once with an empty ask', () => {
    const m = model([{ choice: ['Yes', 'No'], yes: [], no: [] }]);
    expect(m.revealed).toBe(true);
    expect(m.ask).toEqual([]);
  });

  it('a question over 3 lines throws; 3 lines is fine', () => {
    const long = 'word '.repeat(24).trim();
    expect(() => ask(long)).toThrow('Choice question too long');
    expect(() => ask('A bed is still 6 gold, and I will not hear otherwise. Stay?')).not.toThrow();
  });

  it('skipAll on a typing question answers No once', () => {
    const log: string[] = [];
    const env: ScriptEnv = { name: 'Wren', has: () => false, set: (f) => log.push(f), give: () => true, gold: () => {}, heal: () => {}, sfx: () => {}, pay: () => true, rest: () => {}, save: () => true, shop: () => {} };
    const m = new DialogModel(new ScriptRunner([{ choice: ['Yes', 'No'], ask: 'Equip it?', yes: [{ set: 'yes' }], no: [{ set: 'no' }] }], env));
    m.tick();
    let n = 0;
    m.skipAll(() => n++);
    expect(n).toBe(1);
    expect(log).toEqual(['no']);
    expect(m.done).toBe(true);
  });
});
