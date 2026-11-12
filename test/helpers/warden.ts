import type { MonsterDef } from '../../src/game/battle/monster';

/** The Barrow Warden as the balance simulation fights it (spec section 9.8). */
export const WARDEN: MonsterDef = {
  id: 'barrow_warden',
  name: 'Barrow Warden',
  intro: 'The Barrow Warden rises.',
  sprite: 'mireling',
  palette: 0,
  hp: 70,
  atk: 20,
  def: 14,
  agi: 12,
  xp: 300,
  gold: [0, 0],
  dodge: 1 / 32,
  runFactor: Infinity,
  boss: true,
  actions: [
    { do: 'attack', weight: 6 },
    { do: 'blast', name: 'Rot Breath', min: 7, max: 12, weight: 3 },
    { do: 'mend', name: 'Mend', min: 15, max: 25, weight: 2, if: 'hpBelowHalf', cooldown: 2 },
  ],
};
