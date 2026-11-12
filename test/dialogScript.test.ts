import { describe, it, expect } from 'vitest';
import { ScriptRunner, type DialogScript, type ScriptEnv, type ScriptStep } from '../src/game/dialog/script';

function makeEnv(opts: { flags?: string[]; giveResult?: boolean; name?: string } = {}) {
  const flags = new Set(opts.flags ?? []);
  const calls: string[] = [];
  const env: ScriptEnv = {
    name: opts.name ?? 'Wren',
    has: (f) => flags.has(f),
    set: (f) => {
      flags.add(f);
      calls.push(`set:${f}`);
    },
    give: (i) => {
      calls.push(`give:${i}`);
      return opts.giveResult ?? true;
    },
    gold: (n) => calls.push(`gold:${n}`),
    heal: () => calls.push('heal'),
    sfx: (id) => calls.push(`sfx:${id}`),
  };
  return { env, flags, calls };
}

function texts(script: DialogScript, env: ScriptEnv): string[] {
  const r = new ScriptRunner(script, env);
  const out: string[] = [];
  for (let s: ScriptStep | null = r.next(); s; s = r.next()) {
    if (s.kind === 'text') out.push(s.text);
  }
  return out;
}

describe('ScriptRunner', () => {
  it('yields two text steps then null', () => {
    const { env } = makeEnv();
    const r = new ScriptRunner(['one', 'two'], env);
    expect(r.next()).toEqual({ kind: 'text', text: 'one' });
    expect(r.next()).toEqual({ kind: 'text', text: 'two' });
    expect(r.next()).toBeNull();
  });

  it('branches on a flag', () => {
    const script: DialogScript = [{ if: 'x', then: ['A'], else: ['B'] }];
    expect(texts(script, makeEnv().env)).toEqual(['B']);
    expect(texts(script, makeEnv({ flags: ['x'] }).env)).toEqual(['A']);
  });

  it('inverts with not', () => {
    const script: DialogScript = [{ if: { not: 'x' }, then: ['A'], else: ['B'] }];
    expect(texts(script, makeEnv().env)).toEqual(['A']);
    expect(texts(script, makeEnv({ flags: ['x'] }).env)).toEqual(['B']);
  });

  it('continues after a branch finishes', () => {
    const script: DialogScript = ['a', { if: 'x', then: ['b'] }, 'c'];
    expect(texts(script, makeEnv({ flags: ['x'] }).env)).toEqual(['a', 'b', 'c']);
    expect(texts(script, makeEnv().env)).toEqual(['a', 'c']);
  });

  it('sets a flag before the following text', () => {
    const { env, flags } = makeEnv();
    const r = new ScriptRunner([{ set: 'met' }, 'hi'], env);
    expect(r.next()).toEqual({ kind: 'text', text: 'hi' });
    expect(flags.has('met')).toBe(true);
  });

  it('runs other effects in order', () => {
    const { env, calls } = makeEnv();
    texts([{ gold: 5 }, { heal: true }, { sfx: 'door' }, 'x'], env);
    expect(calls).toEqual(['gold:5', 'heal', 'sfx:door']);
  });

  it('give success is silent', () => {
    const { env, calls } = makeEnv({ giveResult: true });
    expect(texts([{ give: 'aldric_shield' }, 'after'], env)).toEqual(['after']);
    expect(calls).toEqual(['give:aldric_shield']);
  });

  it('give failure yields the cannot-carry text and continues', () => {
    const { env } = makeEnv({ giveResult: false });
    expect(texts([{ give: 'aldric_shield' }, 'after'], env)).toEqual(['You cannot carry more.', 'after']);
  });

  it('choice runs the yes or no branch then continues', () => {
    const script: DialogScript = [{ choice: ['Yes', 'No'], yes: ['Y'], no: ['N'] }, 'end'];
    const r1 = new ScriptRunner(script, makeEnv().env);
    expect(r1.next()).toEqual({ kind: 'choice', options: ['Yes', 'No'] });
    expect(r1.next(true)).toEqual({ kind: 'text', text: 'Y' });
    expect(r1.next()).toEqual({ kind: 'text', text: 'end' });
    expect(r1.next()).toBeNull();
    const r2 = new ScriptRunner(script, makeEnv().env);
    r2.next();
    expect(r2.next(false)).toEqual({ kind: 'text', text: 'N' });
  });

  it('substitutes {name} in text and choice options', () => {
    const { env } = makeEnv({ name: 'Wren' });
    const r = new ScriptRunner(['Hello, {name}.', { choice: ['Yes {name}', 'No'], yes: [], no: [] }], env);
    expect(r.next()).toEqual({ kind: 'text', text: 'Hello, Wren.' });
    expect(r.next()).toEqual({ kind: 'choice', options: ['Yes Wren', 'No'] });
  });

  it('a choice carries its question, with {name} substituted', () => {
    const { env } = makeEnv({ name: 'Wren' });
    const r = new ScriptRunner([{ choice: ['Yes', 'No'], ask: 'Ready, {name}?', yes: [], no: [] }], env);
    expect(r.next()).toEqual({ kind: 'choice', options: ['Yes', 'No'], ask: 'Ready, Wren?' });
    const r2 = new ScriptRunner([{ choice: ['Yes', 'No'], yes: [], no: [] }], env);
    const step = r2.next() as Extract<ScriptStep, { kind: 'choice' }>;
    expect(typeof step.ask).not.toBe('string');
  });

  it('reads the name when text is produced', () => {
    const { env } = makeEnv({ name: 'Wren' });
    const r = new ScriptRunner(['{name}'], env);
    env.name = 'Bo';
    expect(r.next()).toEqual({ kind: 'text', text: 'Bo' });
  });
});
