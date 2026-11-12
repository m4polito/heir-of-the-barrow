import type { LevelUp } from '../player';
import type { Beat } from './beats';

/** The messages for a level gained at the end of a battle; the hero's shown hp and mp rise with them. */
export function levelUpBeats(
  up: LevelUp,
  spellName: (id: string) => string,
  shown: { heroHp: number; heroMp: number; monsterHp: number },
): Beat[] {
  const at = { heroHp: shown.heroHp + up.maxHp, heroMp: shown.heroMp + up.maxMp, monsterHp: shown.monsterHp };
  const beats: Beat[] = [{ text: `You reach level ${up.to}.`, song: 'levelup', ...at }];
  const join = (parts: string[]) => parts.join(' ');
  const stats = join([up.str ? `Strength +${up.str}.` : '', up.agi ? `Agility +${up.agi}.` : ''].filter(Boolean));
  if (stats) beats.push({ text: stats, ...at });
  const max = join([up.maxHp ? `Max HP +${up.maxHp}.` : '', up.maxMp ? `Max MP +${up.maxMp}.` : ''].filter(Boolean));
  if (max) beats.push({ text: max, ...at });
  for (const id of up.learned) beats.push({ text: `You learned ${spellName(id)}!`, ...at });
  return beats;
}
