import { describe, expect, it } from 'vitest';
import { DIALOGS, type DialogId } from '../src/data/dialog/hollowmere';
import { ScriptRunner, type DialogNode, type DialogScript, type ScriptEnv, type ScriptStep } from '../src/game/dialog/script';
import { wrapText } from '../src/ui/wrap';

const IDS: DialogId[] = [
  'maren_intro', 'maren_fallen', 'maren', 'hesta', 'garrik', 'odo', 'pip', 'bram', 'tobin', 'villager_a', 'villager_b',
];

function run(id: DialogId, flags: string[] = []) {
  const set = new Set(flags);
  const calls: string[] = [];
  const env: ScriptEnv = {
    name: 'Wren',
    has: (f) => set.has(f),
    set: (f) => { set.add(f); calls.push(`set:${f}`); },
    give: (i) => { calls.push(`give:${i}`); return true; },
    gold: () => {},
    heal: () => { calls.push('heal'); },
    sfx: (s) => { calls.push(`sfx:${s}`); },
  };
  const runner = new ScriptRunner(DIALOGS[id], env);
  const steps: ScriptStep[] = [];
  let ended = false;
  for (let i = 0; i < 100; i++) {
    const step = runner.next(true);
    if (step === null) { ended = true; break; }
    steps.push(step);
  }
  return { steps, calls, ended };
}

function strings(script: DialogScript): string[] {
  const out: string[] = [];
  const walk = (nodes: DialogScript) => {
    for (const n of nodes as DialogNode[]) {
      if (typeof n === 'string') out.push(n);
      else if ('if' in n) { walk(n.then); if (n.else) walk(n.else); }
      else if ('choice' in n) { out.push(...n.choice); walk(n.yes); walk(n.no); }
    }
  };
  walk(script);
  return out;
}

describe('Hollowmere dialog content', () => {
  it('defines every dialog id', () => {
    for (const id of IDS) expect(DIALOGS[id]).toBeDefined();
  });

  for (const id of IDS) {
    for (const flags of [[], ['warden_defeated']]) {
      it(`${id} (${flags.join(',') || 'no flags'}) speaks, terminates, and fits two pages`, () => {
        const { steps, ended } = run(id, flags);
        expect(ended).toBe(true);
        expect(steps.some((s) => s.kind === 'text')).toBe(true);
        for (const s of steps) {
          if (s.kind === 'text') expect(wrapText(s.text, 28).length).toBeLessThanOrEqual(8);
        }
      });
    }
  }

  it('maren_intro gives the shield, plays the sound, and sets the flag', () => {
    const { calls } = run('maren_intro');
    expect(calls).toContain('give:aldric_shield');
    expect(calls).toContain('sfx:menuConfirm');
    expect(calls).toContain('set:shield_received');
  });

  it('maren_intro addresses the hero by name', () => {
    const { steps } = run('maren_intro');
    expect(steps.some((s) => s.kind === 'text' && s.text.includes('Wren'))).toBe(true);
  });

  it.each(['tobin', 'maren', 'hesta'] as const)('%s changes once the Warden is defeated', (id) => {
    const first = (flags: string[]) => run(id, flags).steps.find((s) => s.kind === 'text');
    const before = first([]);
    const after = first(['warden_defeated']);
    if (id === 'tobin') expect(after).not.toEqual(before);
    else expect(run(id, ['warden_defeated']).steps).not.toEqual(run(id).steps);
  });

  it.each([[], ['warden_defeated']])('hesta gives one free rest per talk (flags: %s)', (...flags) => {
    expect(run('hesta', flags).calls.filter((c) => c === 'heal')).toHaveLength(1);
  });

  it.each([
    ['maren', 'Maren'], ['hesta', 'Hesta'], ['garrik', 'Garrik'], ['odo', 'Odo'],
    ['pip', 'Pip'], ['bram', 'Bram'], ['tobin', 'Tobin'],
  ] as const)('%s says their own name in the first line', (id, name) => {
    for (const flags of [[], ['warden_defeated']]) {
      const first = run(id, flags).steps.find((s) => s.kind === 'text');
      expect(first && first.kind === 'text' ? first.text : '').toContain(name);
    }
  });

  it("maren_intro's first line names Maren and the hero", () => {
    const first = run('maren_intro').steps.find((s) => s.kind === 'text');
    const text = first && first.kind === 'text' ? first.text : '';
    expect(text).toContain('Maren');
    expect(text).toContain('Wren');
  });

  it('carries no name tags in any string', () => {
    for (const id of IDS) for (const s of strings(DIALOGS[id])) expect(s).not.toMatch(/^[A-Z][a-z]+: /);
  });

  it('contains no banned words in any branch', () => {
    const banned = /dragon|erdrick|tantegel|alefgard|slime|erdwin/i;
    for (const id of IDS) for (const s of strings(DIALOGS[id])) expect(s).not.toMatch(banned);
  });
});
