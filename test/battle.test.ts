import { describe, expect, it } from 'vitest';
import { createRng } from '../src/engine/rng';
import { Battle, type HeroStats } from '../src/game/battle/battle';
import type { MonsterDef } from '../src/game/battle/monster';
import { seqRng } from './helpers/seqRng';

const M: MonsterDef = {
  id: 'm',
  name: 'Mireling',
  intro: 'A Mireling slumps out of the reeds.',
  sprite: 's',
  palette: 0,
  hp: 6,
  atk: 5,
  def: 3,
  agi: 3,
  xp: 2,
  gold: [2, 4],
  dodge: 1 / 32,
  runFactor: 1,
};
const HERO: HeroStats = { hp: 15, atk: 4, def: 6, agi: 4 };

const texts = (b: { text: string }[]) => b.map((x) => x.text);

describe('Battle', () => {
  it('intro is one beat', () => {
    const b = new Battle(seqRng([]), HERO, M);
    expect(b.intro()).toEqual([{ text: M.intro, heroHp: 15, monsterHp: 6 }]);
  });

  it('hero first, both hit', () => {
    const b = new Battle(seqRng([0, 0.99, 0.5, 0.5, 0.5, 0, 0.5, 0]), HERO, M);
    const beats = b.act('fight');
    expect(texts(beats)).toEqual(['You attack!', 'The Mireling takes 1 damage.', 'The Mireling attacks!', 'You take 1 damage.']);
    expect(beats[1]).toEqual({ text: 'The Mireling takes 1 damage.', sfx: 'monsterHit', fx: 'flash', heroHp: 15, monsterHp: 5 });
    expect(beats[3]).toEqual({ text: 'You take 1 damage.', sfx: 'heroHit', fx: 'shake', heroHp: 14, monsterHp: 5 });
    expect(b.outcome).toBeNull();
  });

  it('monster first', () => {
    const b = new Battle(seqRng([0.99, 0, 0.5, 0, 0.5, 0.5, 0.5, 0]), HERO, M);
    expect(b.act('fight')[0]!.text).toBe('The Mireling attacks!');
  });

  it('kill ends the battle with a reward', () => {
    const b = new Battle(seqRng([0, 0.99, 0.5, 0.5, 0.5, 0, 0.99]), HERO, { ...M, hp: 1 });
    const beats = b.act('fight');
    expect(texts(beats).slice(-2)).toEqual(['The Mireling is defeated.', 'You gain 2 experience and 4 gold.']);
    const defeated = beats[beats.length - 2]!;
    expect(defeated.song).toBe('victory');
    expect(defeated.monsterHp).toBe(0);
    expect(texts(beats).some((t) => t.endsWith('attacks!'))).toBe(false);
    expect(b.outcome).toBe('won');
    expect(b.reward).toEqual({ xp: 2, gold: 4 });
    expect(() => b.act('fight')).toThrow('battle is over');
  });

  it('loss ends the battle', () => {
    const b = new Battle(seqRng([0.99, 0, 0.5, 0]), { ...HERO, hp: 1 }, M);
    const beats = b.act('fight');
    expect(beats[beats.length - 1]).toEqual({ text: 'You have fallen.', song: 'fallen', heroHp: 0, monsterHp: 6 });
    expect(texts(beats)).not.toContain('You attack!');
    expect(b.outcome).toBe('lost');
    expect(b.reward).toBeNull();
  });

  it('overkill clamps hero hp at 0', () => {
    const b = new Battle(seqRng([0.99, 0, 0.5, 0]), { ...HERO, hp: 3 }, { ...M, atk: 100 });
    const beats = b.act('fight');
    expect(beats.every((x) => x.heroHp >= 0)).toBe(true);
    expect(beats[beats.length - 1]!.heroHp).toBe(0);
    expect(b.heroHp).toBe(0);
  });

  it('crit', () => {
    const b = new Battle(seqRng([0, 0.99, 0.5, 0.5, 0.01, 0, 0.5, 0]), HERO, M);
    const beats = b.act('fight');
    expect(texts(beats).slice(0, 3)).toEqual(['You attack!', 'A crushing blow!', 'The Mireling takes 2 damage.']);
    expect(beats[1]!.sfx).toBe('critical');
  });

  it('miss and dodge beats', () => {
    let b = new Battle(seqRng([0, 0.99, 0, 0.01]), HERO, M);
    expect(texts(b.act('fight'))).toEqual(['You attack!', 'You missed!', 'The Mireling attacks!', 'It misses you.']);
    b = new Battle(seqRng([0, 0.99, 0.5, 0, 0.5, 0]), HERO, M);
    expect(texts(b.act('fight'))[1]).toBe('The Mireling dodges!');
  });

  it('shrugs it off and glances off', () => {
    let b = new Battle(seqRng([0, 0.99, 0.5, 0.5, 0.5, 0, 0.5, 0]), { ...HERO, atk: 1 }, { ...M, def: 40 });
    expect(texts(b.act('fight'))[1]).toBe('The Mireling shrugs it off.');
    b = new Battle(seqRng([0, 0.99, 0.5, 0.5, 0.5, 0, 0.5, 0]), { ...HERO, def: 40 }, { ...M, atk: 1 });
    expect(texts(b.act('fight')).pop()).toBe('The blow glances off.');
  });

  it('run succeeds', () => {
    const b = new Battle(seqRng([0.99, 0]), HERO, M);
    expect(b.act('run')).toEqual([{ text: 'You got away.', sfx: 'runOk', heroHp: 15, monsterHp: 6 }]);
    expect(b.outcome).toBe('fled');
  });

  it('run fails then the monster strikes', () => {
    const b = new Battle(seqRng([0, 0.99, 0.5, 0]), HERO, M);
    expect(texts(b.act('run'))).toEqual(['The Mireling blocks the way!', 'The Mireling attacks!', 'You take 1 damage.']);
    expect(b.outcome).toBeNull();
  });

  it('infinite runFactor never escapes', () => {
    const b = new Battle(seqRng([0.01]), HERO, { ...M, runFactor: Infinity });
    expect(texts(b.act('run'))).toEqual(['The Mireling blocks the way!', 'The Mireling attacks!', 'It misses you.']);
  });

  it('500 fight-only battles all end', () => {
    const rng = createRng(3);
    for (let i = 0; i < 500; i++) {
      const b = new Battle(rng, HERO, M);
      let rounds = 0;
      while (!b.outcome && rounds < 200) {
        b.act('fight');
        rounds++;
      }
      expect(['won', 'lost']).toContain(b.outcome);
    }
  });
});
