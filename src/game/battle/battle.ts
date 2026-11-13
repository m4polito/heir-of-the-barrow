import type { Rng } from '../../engine/rng';
import { rollEffect } from '../effects';
import { MonsterBrain, validateActions } from './ai';
import type { Beat } from './beats';
import type { BattleKit } from './kit';
import type { MonsterDef } from './monster';
import { heroStrike, monsterFirst, monsterStrike, runSucceeds } from './rules';

export type BattleCommand = 'fight' | 'run' | { spell: string } | { item: string };
export type BattleOutcome = 'won' | 'lost' | 'fled';

export interface HeroStats {
  hp: number;
  maxHp: number;
  mp: number;
  atk: number;
  def: number;
  agi: number;
}

export class Battle {
  private hp: number;
  private mp: number;
  private readonly brain: MonsterBrain;
  private readonly used: string[] = [];
  private mHp: number;
  private result: BattleOutcome | null = null;
  private prize: { xp: number; gold: number } | null = null;

  constructor(
    private readonly rng: Rng,
    private readonly hero: HeroStats,
    readonly monster: MonsterDef,
    readonly kit: BattleKit = { spells: [], items: [] },
  ) {
    this.hp = hero.hp;
    this.mp = hero.mp;
    if (monster.actions) validateActions(monster.actions);
    this.brain = new MonsterBrain(monster.actions);
    this.mHp = monster.hp;
  }

  get heroHp(): number {
    return this.hp;
  }

  get heroMp(): number {
    return this.mp;
  }

  get itemsUsed(): readonly string[] {
    return this.used;
  }

  /** How many of an item remain for this battle. */
  itemCount(id: string): number {
    const held = this.kit.items.find((i) => i.id === id)?.count ?? 0;
    return held - this.used.filter((u) => u === id).length;
  }

  /** Why a command cannot be used right now, or null when it can (or is not a known spell or item). */
  refusal(cmd: BattleCommand): string | null {
    if (typeof cmd === 'string') return null;
    if ('spell' in cmd) {
      const sp = this.kit.spells.find((x) => x.id === cmd.spell);
      if (!sp) return null;
      if (sp.mp > this.mp) return 'Not enough MP.';
      if (sp.effect.kind === 'heal' && this.hp >= this.hero.maxHp) return 'You are not hurt.';
      return null;
    }
    const it = this.kit.items.find((x) => x.id === cmd.item);
    if (it && it.effect.kind === 'heal' && this.hp >= this.hero.maxHp) return 'You are not hurt.';
    return null;
  }

  /** One message beat with the current hp and mp; changes nothing. */
  note(text: string): Beat[] {
    return [this.beat(text, { sfx: 'error' })];
  }

  get monsterHp(): number {
    return this.mHp;
  }

  get outcome(): BattleOutcome | null {
    return this.result;
  }

  get reward(): { xp: number; gold: number } | null {
    return this.prize;
  }

  intro(): Beat[] {
    return [this.beat(this.monster.intro)];
  }

  act(cmd: BattleCommand): Beat[] {
    if (this.result) throw new Error('battle is over');
    const beats: Beat[] = [];
    if (typeof cmd === 'object') {
      const sp = 'spell' in cmd ? this.kit.spells.find((x) => x.id === cmd.spell) : undefined;
      const it = 'item' in cmd ? this.kit.items.find((x) => x.id === cmd.item) : undefined;
      if (!sp && !it) throw new Error('cannot act: not available');
      if (it && this.itemCount(it.id) < 1) throw new Error('cannot act: none left');
      const why = this.refusal(cmd);
      if (why) throw new Error(`cannot act: ${why}`);
      if (sp && sp.effect.kind !== 'heal' && sp.effect.kind !== 'damage') throw new Error('cannot act: not for battle');
      if (it && it.effect.kind !== 'heal') throw new Error('cannot act: not for battle');
    }
    if (cmd === 'run') {
      const { agi } = this.hero;
      if (runSucceeds(this.rng, agi, this.monster.agi, this.monster.runFactor)) {
        this.result = 'fled';
        beats.push(this.beat('You got away.', { sfx: 'runOk' }));
      } else {
        beats.push(this.beat(`The ${this.monster.name} blocks the way!`, { sfx: 'runFail' }));
        this.monsterTurn(beats);
      }
      return beats;
    }
    if (monsterFirst(this.rng, this.hero.agi, this.monster.agi)) {
      this.monsterTurn(beats);
      if (!this.result) this.heroTurn(beats, cmd);
    } else {
      this.heroTurn(beats, cmd);
      if (!this.result) this.monsterTurn(beats);
    }
    return beats;
  }

  private beat(text: string, extra: Partial<Beat> = {}): Beat {
    return { text, ...extra, heroHp: this.hp, heroMp: this.mp, monsterHp: this.mHp };
  }

  private heroTurn(beats: Beat[], cmd: BattleCommand): void {
    if (typeof cmd === 'object') {
      if ('spell' in cmd) this.castSpell(beats, cmd.spell);
      else this.useItem(beats, cmd.item);
      return;
    }
    this.fight(beats);
  }

  private castSpell(beats: Beat[], id: string): void {
    const sp = this.kit.spells.find((x) => x.id === id)!;
    this.mp -= sp.mp;
    beats.push(this.beat(`You cast ${sp.name}.`, { sfx: 'spell' }));
    if (sp.effect.kind === 'heal') this.heroHeal(beats, rollEffect(this.rng, sp.effect));
    else this.hitMonster(beats, rollEffect(this.rng, sp.effect));
  }

  private useItem(beats: Beat[], id: string): void {
    const it = this.kit.items.find((x) => x.id === id)!;
    const effect = it.effect;
    switch (effect.kind) {
      case 'heal':
        this.used.push(id);
        beats.push(this.beat(`You use the ${it.name}.`));
        this.heroHeal(beats, rollEffect(this.rng, effect));
        return;
      case 'damage':
      case 'warp':
      case 'light':
      case 'read':
        throw new Error('cannot act: not for battle');
      default: {
        const unreachable: never = effect;
        throw new Error(`unknown effect: ${JSON.stringify(unreachable)}`);
      }
    }
  }

  private heroHeal(beats: Beat[], roll: number): void {
    const n = Math.min(roll, this.hero.maxHp - this.hp);
    this.hp += n;
    beats.push(this.beat(`You recover ${n} HP.`, { sfx: 'heal' }));
  }

  /** Spell damage lands without a miss, dodge or crit. */
  private hitMonster(beats: Beat[], damage: number): void {
    this.mHp = Math.max(0, this.mHp - damage);
    beats.push(this.beat(`The ${this.monster.name} takes ${damage} damage.`, { sfx: 'monsterHit', fx: 'flash' }));
    this.checkDefeat(beats);
  }

  private checkDefeat(beats: Beat[]): void {
    if (this.mHp > 0) return;
    const m = this.monster.name;
    const { xp, gold } = this.monster;
    this.prize = { xp, gold: this.rng.int(gold[0], gold[1]) };
    this.result = 'won';
    beats.push(this.beat(`The ${m} is defeated.`, { song: 'victory' }));
    const { gold: won } = this.prize;
    beats.push(this.beat(won === 0 ? `You gain ${xp} experience.` : `You gain ${xp} experience and ${won} gold.`));
  }

  private fight(beats: Beat[]): void {
    const m = this.monster.name;
    beats.push(this.beat('You attack!'));
    const s = heroStrike(this.rng, this.hero.atk, this.monster);
    if (s.kind === 'miss') {
      beats.push(this.beat('You missed!', { sfx: 'miss' }));
      return;
    }
    if (s.kind === 'dodge') {
      beats.push(this.beat(`The ${m} dodges!`, { sfx: 'miss' }));
      return;
    }
    if (s.kind === 'crit') {
      beats.push(this.beat('A crushing blow!', { sfx: 'critical' }));
      this.mHp = Math.max(0, this.mHp - s.damage);
      beats.push(this.beat(`The ${m} takes ${s.damage} damage.`, { fx: 'flash' }));
    } else if (s.damage >= 1) {
      this.mHp = Math.max(0, this.mHp - s.damage);
      beats.push(this.beat(`The ${m} takes ${s.damage} damage.`, { sfx: 'monsterHit', fx: 'flash' }));
    } else {
      beats.push(this.beat(`The ${m} shrugs it off.`, { sfx: 'miss' }));
      return;
    }
    this.checkDefeat(beats);
  }

  private monsterTurn(beats: Beat[]): void {
    const m = this.monster.name;
    const act = this.brain.choose(this.rng, { hp: this.mHp, maxHp: this.monster.hp });
    if (act.do === 'blast') {
      beats.push(this.beat(`The ${m} uses ${act.name}!`));
      const n = this.rng.int(act.min, act.max);
      this.hp = Math.max(0, this.hp - n);
      beats.push(this.beat(`You take ${n} damage.`, { sfx: 'heroHit', fx: 'shake' }));
      if (this.hp === 0) {
        this.result = 'lost';
        beats.push(this.beat('You have fallen.', { song: 'fallen' }));
      }
      return;
    }
    if (act.do === 'mend') {
      beats.push(this.beat(`The ${m} uses ${act.name}!`));
      const n = Math.min(this.rng.int(act.min, act.max), this.monster.hp - this.mHp);
      this.mHp += n;
      beats.push(this.beat(`The ${m} recovers ${n} HP.`, { sfx: 'mend' }));
      return;
    }
    beats.push(this.beat(`The ${this.monster.name} attacks!`));
    const s = monsterStrike(this.rng, this.monster.atk, this.hero.def);
    if (s.kind === 'miss') {
      beats.push(this.beat('It misses you.', { sfx: 'miss' }));
      return;
    }
    if (s.damage < 1) {
      beats.push(this.beat('The blow glances off.', { sfx: 'miss' }));
      return;
    }
    this.hp = Math.max(0, this.hp - s.damage);
    beats.push(this.beat(`You take ${s.damage} damage.`, { sfx: 'heroHit', fx: 'shake' }));
    if (this.hp === 0) {
      this.result = 'lost';
      beats.push(this.beat('You have fallen.', { song: 'fallen' }));
    }
  }
}
