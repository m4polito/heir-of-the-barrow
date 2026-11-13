import { describe, expect, it } from 'vitest';
import { createRng } from '../src/engine/rng';
import { Battle, type HeroStats } from '../src/game/battle/battle';
import type { BattleKit } from '../src/game/battle/kit';
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
const HERO: HeroStats = { hp: 15, maxHp: 24, mp: 0, atk: 4, def: 6, agi: 4 };

const texts = (b: { text: string }[]) => b.map((x) => x.text);

describe('Battle', () => {
  it('intro is one beat', () => {
    const b = new Battle(seqRng([]), HERO, M);
    expect(b.intro()).toEqual([{ text: M.intro, heroHp: 15, heroMp: 0, monsterHp: 6 }]);
  });

  it('hero first, both hit', () => {
    const b = new Battle(seqRng([0, 0.99, 0.5, 0.5, 0.5, 0, 0.5, 0]), HERO, M);
    const beats = b.act('fight');
    expect(texts(beats)).toEqual(['You attack!', 'The Mireling takes 1 damage.', 'The Mireling attacks!', 'You take 1 damage.']);
    expect(beats[1]).toEqual({ text: 'The Mireling takes 1 damage.', sfx: 'monsterHit', fx: 'flash', heroHp: 15, heroMp: 0, monsterHp: 5 });
    expect(beats[3]).toEqual({ text: 'You take 1 damage.', sfx: 'heroHit', fx: 'shake', heroHp: 14, heroMp: 0, monsterHp: 5 });
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
    expect(beats[beats.length - 1]).toEqual({ text: 'You have fallen.', song: 'fallen', heroHp: 0, heroMp: 0, monsterHp: 6 });
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
    expect(b.act('run')).toEqual([{ text: 'You got away.', sfx: 'runOk', heroHp: 15, heroMp: 0, monsterHp: 6 }]);
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

const HEAL = { id: 'heal', name: 'Heal', mp: 4, where: 'both', effect: { kind: 'heal', min: 10, max: 17 } } as const;
const EMBER = { id: 'ember', name: 'Ember', mp: 2, where: 'battle', effect: { kind: 'damage', min: 5, max: 12 } } as const;
const HERB = { id: 'herb', name: 'Herb', count: 1, effect: { kind: 'heal', min: 20, max: 30 } } as const;
const KIT: BattleKit = { spells: [HEAL, EMBER], items: [HERB] };
const base = { atk: 4, def: 6, agi: 4 };

describe('Battle spells, items and monster actions', () => {
  it('heal spell', () => {
    const b = new Battle(seqRng([0, 0.99, 0, 0.5, 0]), { ...base, hp: 5, maxHp: 24, mp: 5 }, M, KIT);
    const beats = b.act({ spell: 'heal' });
    expect(texts(beats)).toEqual(['You cast Heal.', 'You recover 10 HP.', 'The Mireling attacks!', 'You take 1 damage.']);
    expect(beats[0]).toMatchObject({ sfx: 'spell', heroHp: 5, heroMp: 1 });
    expect(beats[1]).toMatchObject({ sfx: 'heal', heroHp: 15 });
    expect(b.heroHp).toBe(14);
    expect(b.heroMp).toBe(1);
  });

  it('monster first, then Heal: the blow lands before the cast and the heal is added once', () => {
    const b = new Battle(seqRng([0.99, 0, 0.5, 0, 0]), { ...base, hp: 8, maxHp: 24, mp: 5 }, M, KIT);
    const beats = b.act({ spell: 'heal' });
    expect(texts(beats)).toEqual(['The Mireling attacks!', 'You take 1 damage.', 'You cast Heal.', 'You recover 10 HP.']);
    expect(beats[2]).toMatchObject({ heroHp: 7, heroMp: 1 });
    expect(b.heroMp).toBe(1);
    expect(b.heroHp).toBe(8 - 1 + 10);
    expect(b.outcome).toBeNull();
  });

  it('monster first and the blow kills: no cast, no MP spent, nothing used', () => {
    const b = new Battle(seqRng([0.99, 0, 0.5, 0]), { ...base, hp: 1, maxHp: 24, mp: 5 }, M, KIT);
    const beats = b.act({ spell: 'heal' });
    expect(texts(beats)).not.toContain('You cast Heal.');
    expect(texts(beats).pop()).toBe('You have fallen.');
    expect(b.outcome).toBe('lost');
    expect(b.heroMp).toBe(5);
    expect(b.itemsUsed).toEqual([]);
  });

  it('heal clamps to max hp', () => {
    const b = new Battle(seqRng([0, 0.99, 0.99, 0.5, 0]), { ...base, hp: 20, maxHp: 24, mp: 5 }, M, KIT);
    const beats = b.act({ spell: 'heal' });
    expect(beats[1]!.text).toBe('You recover 4 HP.');
    expect(beats[1]!.heroHp).toBe(24);
  });

  it('ember damages without miss, dodge or crit draws', () => {
    const b = new Battle(seqRng([0, 0.99, 0.99, 0.99]), { ...base, hp: 15, maxHp: 24, mp: 20 }, M, KIT);
    const beats = b.act({ spell: 'ember' });
    expect(texts(beats)).toEqual(['You cast Ember.', 'The Mireling takes 12 damage.', 'The Mireling is defeated.', 'You gain 2 experience and 4 gold.']);
    expect(beats[1]).toMatchObject({ sfx: 'monsterHit', fx: 'flash' });
    expect(b.heroMp).toBe(18);
    expect(b.outcome).toBe('won');
  });

  it('herb', () => {
    const b = new Battle(seqRng([0, 0.99, 0, 0.5, 0]), { ...base, hp: 3, maxHp: 15, mp: 0 }, M, KIT);
    const beats = b.act({ item: 'herb' });
    expect(texts(beats)).toEqual(['You use the Herb.', 'You recover 12 HP.', 'The Mireling attacks!', 'You take 1 damage.']);
    expect(beats[1]!.sfx).toBe('heal');
    expect(b.itemsUsed).toEqual(['herb']);
    expect(b.itemCount('herb')).toBe(0);
    expect(() => b.act({ item: 'herb' })).toThrow('cannot act');
  });

  it('refusals change nothing', () => {
    const low = new Battle(seqRng([]), { ...base, hp: 5, maxHp: 24, mp: 3 }, M, KIT);
    expect(low.refusal({ spell: 'heal' })).toBe('Not enough MP.');
    expect(() => low.act({ spell: 'heal' })).toThrow('cannot act');
    expect(low.refusal('fight')).toBeNull();
    expect(low.refusal('run')).toBeNull();
    expect(() => low.act({ spell: 'nope' })).toThrow('cannot act');
    expect(low.heroMp).toBe(3);
    const full = new Battle(seqRng([]), { ...base, hp: 24, maxHp: 24, mp: 20 }, M, KIT);
    expect(full.refusal({ spell: 'heal' })).toBe('You are not hurt.');
    expect(full.refusal({ item: 'herb' })).toBe('You are not hurt.');
    expect(() => full.act({ spell: 'heal' })).toThrow('cannot act');
    expect(() => full.act({ item: 'herb' })).toThrow('cannot act');
    expect(full.heroMp).toBe(20);
    expect(full.heroHp).toBe(24);
    expect(full.itemCount('herb')).toBe(1);
    expect(full.note('x')).toEqual([{ text: 'x', sfx: 'error', heroHp: 24, heroMp: 20, monsterHp: 6 }]);
  });

  it('blast', () => {
    const blaster: MonsterDef = { ...M, actions: [{ do: 'blast', name: 'Rot Breath', min: 8, max: 14, weight: 1 }] };
    const rolls = [0.99, 0, 0, 0.5, 0.5, 0.5, 0];
    let b = new Battle(seqRng(rolls), { ...base, hp: 15, maxHp: 24, mp: 0 }, blaster);
    const beats = b.act('fight');
    expect(texts(beats).slice(0, 2)).toEqual(['The Mireling uses Rot Breath!', 'You take 8 damage.']);
    expect(beats[1]).toMatchObject({ sfx: 'heroHit', fx: 'shake' });
    b = new Battle(seqRng(rolls), { ...base, hp: 5, maxHp: 24, mp: 0 }, blaster);
    const dead = b.act('fight');
    expect(texts(dead).pop()).toBe('You have fallen.');
    expect(b.outcome).toBe('lost');
  });

  it('mend never overheals', () => {
    const mender: MonsterDef = { ...M, actions: [{ do: 'mend', name: 'Mend', min: 15, max: 25, weight: 1 }] };
    const b = new Battle(seqRng([0, 0.99, 0.5, 0.5, 0.5, 0, 0]), { ...base, hp: 15, maxHp: 24, mp: 0 }, mender);
    const beats = b.act('fight');
    expect(texts(beats)).toEqual(['You attack!', 'The Mireling takes 1 damage.', 'The Mireling uses Mend!', 'The Mireling recovers 1 HP.']);
    expect(beats[3]!.sfx).toBe('mend');
    expect(b.monsterHp).toBe(6);
  });

  it('500 battles with actions all end, monster hp never above max', () => {
    const rng = createRng(3);
    const tough: MonsterDef = {
      ...M,
      hp: 30,
      actions: [
        { do: 'attack', weight: 3 },
        { do: 'blast', name: 'Rot Breath', min: 4, max: 8, weight: 1, cooldown: 2 },
        { do: 'mend', name: 'Mend', min: 5, max: 10, weight: 2, if: 'hpBelowHalf', cooldown: 3 },
      ],
    };
    for (let i = 0; i < 500; i++) {
      const b = new Battle(rng, { ...base, hp: 60, maxHp: 60, mp: 0 }, tough);
      let rounds = 0;
      while (!b.outcome && rounds < 300) {
        b.act('fight');
        expect(b.monsterHp).toBeLessThanOrEqual(30);
        rounds++;
      }
      expect(b.outcome).not.toBeNull();
    }
  });
});

describe('Battle groundwork for bosses', () => {
  const win = (m: MonsterDef) => {
    const b = new Battle(seqRng([0, 0.99, 0.99, 0.99, 0.5]), { ...base, hp: 15, maxHp: 24, mp: 20 }, m, KIT);
    return b.act({ spell: 'ember' });
  };

  it('validates monster actions on construction', () => {
    expect(() => new Battle(seqRng([]), HERO, { ...M, actions: [{ do: 'attack', weight: 0 }] })).toThrow();
    expect(() => new Battle(seqRng([]), HERO, { ...M, actions: [{ do: 'attack', weight: 1 }] })).not.toThrow();
  });

  it('a prize of no gold reads experience only; a prize with gold still names it', () => {
    const none = win({ ...M, hp: 1, xp: 300, gold: [0, 0] });
    expect(none[none.length - 1]!.text).toBe('You gain 300 experience.');
    const some = win({ ...M, hp: 1, gold: [2, 4] });
    expect(some[some.length - 1]!.text).toMatch(/^You gain 2 experience and [2-4] gold\.$/);
  });

  it('a monster Mend plays mend, the hero Heal plays heal', () => {
    const boss: MonsterDef = { ...M, hp: 20, actions: [{ do: 'mend', name: 'Mend', min: 5, max: 5, weight: 1 }] };
    const b = new Battle(createRng(7), { ...base, hp: 15, maxHp: 24, mp: 10 }, boss, KIT);
    const beats = [...b.act({ spell: 'ember' }), ...b.act({ spell: 'heal' })];
    expect(beats.find((x) => x.text.startsWith('The Mireling recovers'))?.sfx).toBe('mend');
    expect(beats.find((x) => x.text.startsWith('You recover'))?.sfx).toBe('heal');
  });

  it('an item whose effect is not a heal cannot be used in battle', () => {
    const bomb = { id: 'bomb', name: 'Bomb', count: 1, effect: { kind: 'damage', min: 1, max: 2 } } as const;
    const b = new Battle(seqRng([]), { ...base, hp: 10, maxHp: 24, mp: 0 }, M, { spells: [], items: [bomb] });
    expect(() => b.act({ item: 'bomb' })).toThrow('cannot act: not for battle');
    expect(b.itemsUsed).toEqual([]);
    expect(b.itemCount('bomb')).toBe(1);
  });
});
