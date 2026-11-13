import { ITEMS } from '../../src/data/items';
import { LEVELS } from '../../src/data/levels';
import { SPELLS } from '../../src/data/spells';
import type { Rng } from '../../src/engine/rng';
import { Battle, type BattleCommand } from '../../src/game/battle/battle';
import { battleKit } from '../../src/game/battle/kit';
import type { MonsterDef } from '../../src/game/battle/monster';
import { castInField } from '../../src/game/fieldUse';
import { addItem, equip, removeItem } from '../../src/game/inventory';
import { createPlayer, gainXp, spellsKnown, type PlayerState } from '../../src/game/player';
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

/** Play one battle from p with the policy; 300 rounds counts as a loss. */
function fight(rng: Rng, p: PlayerState, monster: MonsterDef, policy: Policy): { b: Battle; rounds: number } {
  const hero = { hp: p.hp, maxHp: p.maxHp, mp: p.mp, atk: attackOf(ITEMS, p), def: defenseOf(ITEMS, p), agi: p.agi };
  const b = new Battle(rng, hero, monster, battleKit(p, SPELLS, ITEMS));
  let rounds = 0;
  while (b.outcome === null && rounds < 300) {
    b.act(policy(b));
    rounds++;
  }
  return { b, rounds };
}

/** Play n fresh battles from p with the policy; means are over wins; 300 rounds counts as a loss. */
export function simulate(
  rng: Rng,
  p: PlayerState,
  monster: MonsterDef,
  policy: Policy,
  n: number,
): { winRate: number; meanRounds: number; meanHpLost: number } {
  let wins = 0;
  let rounds = 0;
  let hpLost = 0;
  for (let i = 0; i < n; i++) {
    const r = fight(rng, p, monster, policy);
    if (r.b.outcome === 'won') {
      wins++;
      rounds += r.rounds;
      hpLost += p.hp - r.b.heroHp;
    }
  }
  return { winRate: wins / n, meanRounds: wins ? rounds / wins : 0, meanHpLost: wins ? hpLost / wins : 0 };
}

export interface ExpeditionOpts {
  fights: number;
  road: MonsterDef;
  roadPolicy: Policy;
  boss: MonsterDef;
  bossPolicy: Policy;
}

/** Between fights: cast the heal spell while at least 13 HP are missing and MP allows. */
function restBetweenFights(rng: Rng, p: PlayerState): PlayerState {
  const heal = Object.values(SPELLS).find((s) => s.effect.kind === 'heal' && spellsKnown(p.level).includes(s.id));
  if (!heal) return p;
  while (p.maxHp - p.hp >= 13 && p.mp >= heal.mp) {
    const r = castInField(rng, SPELLS, p, heal.id);
    if (!r.ok) break;
    p = r.player;
  }
  return p;
}

/** The hero after a won battle: HP and MP carried, used items gone (no XP). */
function afterBattle(p: PlayerState, b: Battle): PlayerState {
  let next = { ...p, hp: b.heroHp, mp: b.heroMp };
  for (const id of b.itemsUsed) {
    const removed = removeItem(next, id);
    if (!removed.ok) throw new Error(`used an item not held: ${id}`);
    next = removed.player;
  }
  return next;
}

/** n trips: `fights` road battles in a row, healing between them, then the boss. */
export function expedition(rng: Rng, p: PlayerState, opts: ExpeditionOpts, n: number): { reachRate: number; winRate: number } {
  let reached = 0;
  let wins = 0;
  for (let i = 0; i < n; i++) {
    let hero = p;
    let alive = true;
    for (let f = 0; f < opts.fights && alive; f++) {
      const r = fight(rng, hero, opts.road, opts.roadPolicy);
      if (r.b.outcome === 'won') hero = restBetweenFights(rng, afterBattle(hero, r.b));
      else alive = false;
    }
    if (!alive) continue;
    reached++;
    if (fight(rng, hero, opts.boss, opts.bossPolicy).b.outcome === 'won') wins++;
  }
  return { reachRate: reached / n, winRate: wins / n };
}
