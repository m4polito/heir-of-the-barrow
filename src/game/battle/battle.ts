import type { Rng } from '../../engine/rng';
import type { Beat } from './beats';
import type { MonsterDef } from './monster';
import { heroStrike, monsterFirst, monsterStrike, runSucceeds } from './rules';

export type BattleCommand = 'fight' | 'run';
export type BattleOutcome = 'won' | 'lost' | 'fled';

export interface HeroStats {
  hp: number;
  atk: number;
  def: number;
  agi: number;
}

export class Battle {
  private hp: number;
  private mHp: number;
  private result: BattleOutcome | null = null;
  private prize: { xp: number; gold: number } | null = null;

  constructor(
    private readonly rng: Rng,
    private readonly hero: HeroStats,
    readonly monster: MonsterDef,
  ) {
    this.hp = hero.hp;
    this.mHp = monster.hp;
  }

  get heroHp(): number {
    return this.hp;
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
      if (!this.result) this.heroTurn(beats);
    } else {
      this.heroTurn(beats);
      if (!this.result) this.monsterTurn(beats);
    }
    return beats;
  }

  private beat(text: string, extra: Partial<Beat> = {}): Beat {
    return { text, ...extra, heroHp: this.hp, monsterHp: this.mHp };
  }

  private heroTurn(beats: Beat[]): void {
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
    if (this.mHp === 0) {
      const { xp, gold } = this.monster;
      this.prize = { xp, gold: this.rng.int(gold[0], gold[1]) };
      this.result = 'won';
      beats.push(this.beat(`The ${m} is defeated.`, { song: 'victory' }));
      beats.push(this.beat(`You gain ${xp} experience and ${this.prize.gold} gold.`));
    }
  }

  private monsterTurn(beats: Beat[]): void {
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
