import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/data/items';
import { MONSTERS } from '../src/data/monsters';
import { STORY } from '../src/data/story';
import { createRng } from '../src/engine/rng';
import { validateActions } from '../src/game/battle/ai';
import { addItem, equip } from '../src/game/inventory';
import { createPlayer } from '../src/game/player';
import { buy, buyCheck } from '../src/game/shop';
import { attackOf, defenseOf } from '../src/game/stats';
import { expedition, fightOnly, healer, heroAt, simulate } from './helpers/simulate';

const N = 4000;
const WARDEN = MONSTERS.barrow_warden;

describe('early-game balance', () => {
  it('road: an unarmed level 1 hero with the shield beats a Mireling quickly and cheaply', () => {
    const r = simulate(createRng(1), heroAt(1, ['aldric_shield'], 0), MONSTERS.mireling!, fightOnly, N);
    expect(r.winRate).toBeGreaterThanOrEqual(0.99);
    expect(r.meanHpLost).toBeLessThanOrEqual(3.0);
    expect(r.meanRounds).toBeLessThanOrEqual(4);
  });

  it('marsh: a level 3 hero usually wins with Heal and usually loses without', () => {
    const hero = heroAt(3, ['aldric_shield'], 0);
    const heal = simulate(createRng(2), hero, MONSTERS.bog_mireling!, healer(8, null), N);
    const plain = simulate(createRng(3), hero, MONSTERS.bog_mireling!, fightOnly, N);
    expect(heal.winRate).toBeGreaterThan(0.6);
    expect(plain.winRate).toBeLessThanOrEqual(heal.winRate - 0.2);
  });

  it('marsh: a level 1 hero is still outmatched', () => {
    const r = simulate(createRng(4), heroAt(1, ['aldric_shield'], 0), MONSTERS.bog_mireling!, fightOnly, N);
    expect(r.winRate).toBeLessThan(0.05);
  });
});

describe('Barrow Warden win-rate bands', () => {
  const gear = ['bronze_sword', 'leather_armor', 'aldric_shield'];
  const run = (level: number, seed: number) =>
    simulate(createRng(seed), heroAt(level, gear, 3), WARDEN, healer(18, 8), N);

  it('the Warden fixture has valid actions', () => {
    expect(() => validateActions(WARDEN.actions!)).not.toThrow();
  });

  it('a level 6 hero has the stats the spec states', () => {
    const p = heroAt(6, gear, 3);
    expect(attackOf(ITEMS, p)).toBe(27);
    expect(defenseOf(ITEMS, p)).toBe(14);
  });

  it('level 4 almost never wins', () => {
    const r = run(4, 5);
    expect(r.winRate).toBeLessThan(0.03);
  });
  it('level 5 wins under half the time', () => {
    const r = run(5, 6);
    expect(r.winRate).toBeLessThan(0.5);
  });
  it('level 6 usually wins', () => {
    const r = run(6, 7);
    expect(r.winRate).toBeGreaterThan(0.7);
  });
  it('level 7 almost always wins', () => {
    const r = run(7, 8);
    expect(r.winRate).toBeGreaterThan(0.9);
  });
  it('the fight is short: won fights average at most 15.5 rounds at level 6 and 13.5 at level 7', () => {
    expect(run(6, 7).meanRounds).toBeLessThanOrEqual(15.5);
    expect(run(7, 8).meanRounds).toBeLessThanOrEqual(13.5);
  });
});

describe('Barrow Mireling', () => {
  const MIRELING = MONSTERS.barrow_mireling;
  const full = ['bronze_sword', 'leather_armor', 'aldric_shield'];
  const knife = ['iron_knife', 'leather_armor', 'aldric_shield'];

  it('level 6 in full gear wins nearly always, quickly and cheaply', () => {
    const r = simulate(createRng(21), heroAt(6, full, 3), MIRELING, fightOnly, N);
    expect(r.winRate).toBeGreaterThanOrEqual(0.99);
    expect(r.meanRounds).toBeLessThanOrEqual(4);
    expect(r.meanHpLost).toBeLessThanOrEqual(11);
  });
  it('level 5 with the Iron Knife usually wins', () => {
    const r = simulate(createRng(22), heroAt(5, knife, 3), MIRELING, fightOnly, N);
    expect(r.winRate).toBeGreaterThanOrEqual(0.85);
  });
  it('level 4 with the Iron Knife usually loses', () => {
    const r = simulate(createRng(23), heroAt(4, knife, 3), MIRELING, fightOnly, N);
    expect(r.winRate).toBeLessThan(0.4);
  });
});

describe('the whole trip: four Barrow fights, then the Warden', () => {
  const gear = ['bronze_sword', 'leather_armor', 'aldric_shield'];
  const trip = (level: number, seed: number) =>
    expedition(
      createRng(seed),
      heroAt(level, gear, 3),
      { fights: 4, road: MONSTERS.barrow_mireling, roadPolicy: healer(10, null), boss: WARDEN, bossPolicy: healer(18, 8) },
      2000,
    );

  it('level 6 usually crosses the Barrow and wins', () => {
    expect(trip(6, 31).winRate).toBeGreaterThanOrEqual(0.75);
  }, 60000);
  it('level 5 rarely does', () => {
    expect(trip(5, 32).winRate).toBeLessThan(0.3);
  }, 60000);
  it('level 7 almost always does', () => {
    expect(trip(7, 33).winRate).toBeGreaterThanOrEqual(0.88);
  }, 60000);
});

describe('the first purchase', () => {
  const INN_PRICE = 6;
  const bought = () => {
    const start = createPlayer('Wren', STORY.startingItems);
    return { start, after: buy(ITEMS, start, 'wooden_club') };
  };
  const clubAndShield = () => {
    let p = bought().after;
    p = equip(ITEMS, p, 'wooden_club').player;
    p = addItem(ITEMS, p, 'aldric_shield').player;
    p = equip(ITEMS, p, 'aldric_shield').player;
    return { ...p, hp: p.maxHp, mp: p.maxMp };
  };
  const clubAndShieldAt = (level: number) => heroAt(level, ['wooden_club', 'aldric_shield'], 0);

  it('the starting purse buys the Club and leaves the price of a night and an Herb', () => {
    const { start, after } = bought();
    const check = buyCheck(ITEMS, start, 'wooden_club');
    expect(check.ok).toBe(true);
    expect(check.ok && check.wearOnly).toBe(false);
    expect(after.gold).toBe(10);
    expect(after.gold).toBeGreaterThanOrEqual(INN_PRICE);
    expect(after.gold).toBeGreaterThanOrEqual(ITEMS.herb!.price);
  });

  it('road: the Club and shield make a Mireling comfortable', () => {
    const r = simulate(createRng(11), clubAndShield(), MONSTERS.mireling!, fightOnly, N);
    expect(r.winRate).toBeGreaterThanOrEqual(0.99);
    expect(r.meanRounds).toBeLessThanOrEqual(2.5);
    expect(r.meanHpLost).toBeLessThanOrEqual(2.0);
  });

  it('the Club is felt: at least half a round faster than the shield alone', () => {
    const club = simulate(createRng(11), clubAndShield(), MONSTERS.mireling!, fightOnly, N);
    const bare = simulate(createRng(1), heroAt(1, ['aldric_shield'], 0), MONSTERS.mireling!, fightOnly, N);
    expect(club.meanRounds).toBeLessThanOrEqual(bare.meanRounds - 0.5);
  });

  it('spec pacing: under 4 rounds and under 20% of max HP lost per fight', () => {
    const p = clubAndShield();
    const r = simulate(createRng(11), p, MONSTERS.mireling!, fightOnly, N);
    expect(r.meanRounds).toBeLessThanOrEqual(4);
    expect(r.meanHpLost).toBeLessThan(p.maxHp * 0.2);
  });

  it('marsh at level 3: Heal wins nearly always, fighting alone usually wins', () => {
    const hero = clubAndShieldAt(3);
    const heal = simulate(createRng(12), hero, MONSTERS.bog_mireling!, healer(8, null), N);
    const plain = simulate(createRng(13), hero, MONSTERS.bog_mireling!, fightOnly, N);
    expect(heal.winRate).toBeGreaterThanOrEqual(0.95);
    expect(plain.winRate).toBeGreaterThanOrEqual(0.8);
  });

  it('marsh at level 2: the Club does not open it a level early', () => {
    const r = simulate(createRng(14), clubAndShieldAt(2), MONSTERS.bog_mireling!, fightOnly, N);
    expect(r.winRate).toBeLessThan(0.4);
  });
});
