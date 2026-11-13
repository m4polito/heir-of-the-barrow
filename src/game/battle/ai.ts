import type { Rng } from '../../engine/rng';

export type MonsterAction = { weight: number; if?: 'hpBelowHalf'; cooldown?: number } & (
  | { do: 'attack' }
  | { do: 'blast'; name: string; min: number; max: number }
  | { do: 'mend'; name: string; min: number; max: number }
);

export const ATTACK: MonsterAction = { do: 'attack', weight: 1 };

export class MonsterBrain {
  private readonly cooling: number[];

  constructor(private readonly actions: readonly MonsterAction[] = []) {
    this.cooling = actions.map(() => 0);
  }

  choose(rng: Rng, state: { hp: number; maxHp: number }): MonsterAction {
    const eligible: number[] = [];
    this.actions.forEach((a, i) => {
      if (this.cooling[i]! > 0) return;
      if (a.if === 'hpBelowHalf' && !(state.hp * 2 < state.maxHp)) return;
      eligible.push(i);
    });
    let pick: number | null = null;
    if (eligible.length === 1) pick = eligible[0]!;
    else if (eligible.length > 1) {
      const total = eligible.reduce((s, i) => s + this.actions[i]!.weight, 0);
      const r = rng.next() * total;
      let run = 0;
      pick = eligible[eligible.length - 1]!;
      for (const i of eligible) {
        run += this.actions[i]!.weight;
        if (run > r) {
          pick = i;
          break;
        }
      }
    }
    if (pick === null) return ATTACK;
    for (let i = 0; i < this.cooling.length; i++) this.cooling[i] = Math.max(0, this.cooling[i]! - 1);
    const chosen = this.actions[pick]!;
    if (chosen.cooldown) this.cooling[pick] = chosen.cooldown;
    return chosen;
  }
}

export function validateActions(actions: readonly MonsterAction[]): void {
  for (const a of actions) {
    if (!Number.isFinite(a.weight) || !(a.weight > 0)) throw new Error(`monster action weight must be above 0: ${a.weight}`);
    if (a.do !== 'attack') {
      if (!Number.isFinite(a.min) || !Number.isFinite(a.max)) throw new Error(`monster action ${a.name} has a range that is not finite`);
      if (a.min < 0 || a.min > a.max) throw new Error(`monster action ${a.name} has a bad range`);
    }
    if (a.cooldown !== undefined) {
      if (!Number.isFinite(a.cooldown) || !Number.isInteger(a.cooldown)) throw new Error('monster action cooldown must be a whole number');
      if (a.cooldown < 0) throw new Error('monster action cooldown must not be negative');
    }
  }
  if (!actions.some((a) => a.if === undefined && !a.cooldown)) {
    throw new Error('monster actions need one with no condition and no cooldown');
  }
}
