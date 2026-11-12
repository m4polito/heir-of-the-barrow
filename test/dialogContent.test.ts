import { describe, expect, it } from 'vitest';
import { DIALOGS, type DialogId } from '../src/data/dialog/hollowmere';
import { ScriptRunner, type DialogNode, type DialogScript, type ScriptEnv, type ScriptStep } from '../src/game/dialog/script';
import { SONGS } from '../src/data/songs';
import { wrapText } from '../src/ui/wrap';

const IDS: DialogId[] = [
  'maren_intro', 'maren_fallen', 'maren', 'hesta', 'garrik', 'odo', 'pip', 'bram', 'tobin', 'villager_a', 'villager_b',
];

function run(id: DialogId, flags: string[] = [], answer = true, canPay = true, canSave = true) {
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
    pay: (n) => { calls.push(`pay:${n}`); return canPay; },
    save: () => { calls.push('save'); return canSave; },
    rest: (song) => { calls.push(`rest:${song}`); },
    shop: (id) => { calls.push(`shop:${id}`); },
  };
  const runner = new ScriptRunner(DIALOGS[id], env);
  const steps: ScriptStep[] = [];
  let ended = false;
  for (let i = 0; i < 100; i++) {
    const step = runner.next(answer);
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
      else if ('choice' in n) { if (n.ask) out.push(n.ask); out.push(...n.choice); walk(n.yes); walk(n.no); }
      else if ('pay' in n) { walk(n.then); if (n.else) walk(n.else); }
      else if ('save' in n) { walk(n.ok); walk(n.fail); }
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

  describe.each([[[]], [['warden_defeated']]])('hesta the innkeeper (flags: %j)', (flags) => {
    it('Yes with enough gold pays 6 once and rests once, never heals', () => {
      const { calls } = run('hesta', flags, true, true);
      expect(calls.filter((c) => c === 'pay:6')).toHaveLength(1);
      expect(calls.filter((c) => c === 'rest:inn')).toHaveLength(1);
      expect(calls).not.toContain('heal');
    });
    it('Yes without enough gold pays once and does not rest', () => {
      const { calls } = run('hesta', flags, true, false);
      expect(calls.filter((c) => c === 'pay:6')).toHaveLength(1);
      expect(calls.some((c) => c.startsWith('rest:'))).toBe(false);
    });
    it('No neither pays nor rests', () => {
      const { calls } = run('hesta', flags, false);
      expect(calls.some((c) => c.startsWith('pay:') || c.startsWith('rest:'))).toBe(false);
    });
  });

  it('every ask fits three lines, every rest is a one-shot song, every hesta price is 6', () => {
    const walk = (nodes: DialogScript, visit: (n: Exclude<DialogNode, string>) => void) => {
      for (const n of nodes as DialogNode[]) {
        if (typeof n === 'string') continue;
        visit(n);
        if ('if' in n) { walk(n.then, visit); if (n.else) walk(n.else, visit); }
        else if ('choice' in n) { walk(n.yes, visit); walk(n.no, visit); }
        else if ('pay' in n) { walk(n.then, visit); if (n.else) walk(n.else, visit); }
        else if ('save' in n) { walk(n.ok, visit); walk(n.fail, visit); }
      }
    };
    for (const id of IDS) {
      walk(DIALOGS[id], (n) => {
        if ('choice' in n && n.ask) expect(wrapText(n.ask, 28).length).toBeLessThanOrEqual(3);
        if ('rest' in n) {
          const song = (SONGS as Record<string, { loop?: boolean } | undefined>)[n.rest];
          expect(song).toBeDefined();
          expect(song!.loop).toBe(false);
        }
        if ('pay' in n && id === 'hesta') expect(n.pay).toBe(6);
      });
    }
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

  it.each([['garrik', 'forge'], ['odo', 'goods']] as const)('%s opens the %s shop once', (id, shop) => {
    expect(run(id).calls.filter((c) => c.startsWith('shop:'))).toEqual([`shop:${shop}`]);
  });

  describe.each([[[]], [['warden_defeated']]])('maren saves (flags: %j)', (flags) => {
    const texts = (r: ReturnType<typeof run>) => r.steps.flatMap((s) => (s.kind === 'text' ? [s.text] : []));
    it('Yes saves once and says it is written', () => {
      const r = run('maren', flags, true, true, true);
      expect(r.calls.filter((c) => c === 'save')).toHaveLength(1);
      expect(texts(r)).toContain('It is written.');
    });
    it('Yes with a failing save says the page will not take the ink', () => {
      const r = run('maren', flags, true, true, false);
      expect(r.calls.filter((c) => c === 'save')).toHaveLength(1);
      expect(texts(r)).toContain('The page will not take the ink. Nothing was written.');
      expect(texts(r)).not.toContain('It is written.');
    });
    it('No never saves', () => {
      expect(run('maren', flags, false).calls).not.toContain('save');
    });
  });

  it('maren_intro sends the hero to the forge and still ends on the fire', () => {
    const { steps, calls } = run('maren_intro');
    const texts = steps.flatMap((s) => (s.kind === 'text' ? [s.text] : []));
    expect(texts).toContain("Take your coin to Garrik's forge before you try the gate.");
    expect(texts[texts.length - 1]).toBe('Stay as long as you like. The fire is warm.');
    expect(calls).not.toContain('save');
  });

  it('maren_fallen never saves', () => {
    expect(run('maren_fallen').calls).not.toContain('save');
  });

  it('carries no name tags in any string', () => {
    for (const id of IDS) for (const s of strings(DIALOGS[id])) expect(s).not.toMatch(/^[A-Z][a-z]+: /);
  });

  it('contains no banned words in any branch', () => {
    const banned = /dragon|erdrick|tantegel|alefgard|slime|erdwin/i;
    for (const id of IDS) for (const s of strings(DIALOGS[id])) expect(s).not.toMatch(banned);
  });
});
