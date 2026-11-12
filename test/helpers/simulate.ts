import { ITEMS } from '../../src/data/items';
import { LEVELS } from '../../src/data/levels';
import { SPELLS } from '../../src/data/spells';
import type { Rng } from '../../src/engine/rng';
import { Battle, type BattleCommand } from '../../src/game/battle/battle';
import { battleKit } from '../../src/game/battle/kit';
import type { MonsterDef } from '../../src/game/battle/monster';
import { addItem, equip } from '../../src/game/inventory';
import { createPlayer, gainXp, type PlayerState } from '../../src/game/player';
import { attackOf, defenseOf } from '../../src/game/stats';

export type Policy = (b: Battle) => BattleCommand;

/** A hero of the given level wearing the given gear and carrying herbs, at full HP and MP. */
export function heroAt(level: number, gear: string[], herbs: number): PlayerState {
  let p = gainXp(createPlayer('Wren', []), LEVELS[level - 1]!.xp).player;
  for (const id of gear) {
    p = addItem(ITEMS, p, id).player;
    p = equip(ITEMS, p, id).player;
  }
  if (herbs > 0) p = addItem(ITEMS, p, 'herb', herbs).player;
  return { ...p, hp: p.maxHp, mp: p.maxMp };
}

export const fightOnly: Policy = () => 'fight';

/** Heal at or below healAt (spell first, then item); otherwise cast a damage spell if MP allows keeping damageReserve; else fight. */
export function healer(healAt: number, damageReserve: number | null): Policy {
  return (b) => {
    if (b.heroHp <= healAt) {
      const heal = b.kit.spells.find((s) => s.effect.kind === 'heal');
      if (heal && b.refusal({ spell: heal.id }) === null) return { spell: heal.id };
      const item = b.kit.items.find((i) => i.effect.kind === 'heal' && b.itemCount(i.id) > 0);
      if (item) return { item: item.id };
    }
    if (damageReserve !== null) {
      const dmg = b.kit.spells.find((s) => s.effect.kind === 'damage');
      if (dmg && b.heroMp >= dmg.mp + damageReserve) return { spell: dmg.id };
    }
    return 'fight';
  };
}

/** Play n fresh battles from p with the policy; means are over wins; 300 rounds counts as a loss. */
export function simulate(
  rng: Rng,
  p: PlayerState,
  monster: MonsterDef,
  policy: Policy,
  n: number,
): { winRate: number; meanRounds: number; meanHpLost: number } {
  const hero = { hp: p.hp, maxHp: p.maxHp, mp: p.mp, atk: attackOf(ITEMS, p), def: defenseOf(ITEMS, p), agi: p.agi };
  let wins = 0;
  let rounds = 0;
  let hpLost = 0;
  for (let i = 0; i < n; i++) {
    const b = new Battle(rng, hero, monster, battleKit(p, SPELLS, ITEMS));
    let r = 0;
    while (b.outcome === null && r < 300) {
      b.act(policy(b));
      r++;
    }
    if (b.outcome === 'won') {
      wins++;
      rounds += r;
      hpLost += hero.hp - b.heroHp;
    }
  }
  return { winRate: wins / n, meanRounds: wins ? rounds / wins : 0, meanHpLost: wins ? hpLost / wins : 0 };
}
