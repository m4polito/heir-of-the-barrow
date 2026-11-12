import { BATTLE_SONG } from './battle';
import { FALLEN_SONG } from './fallen';
import { HOLLOWMERE_SONG } from './hollowmere';
import { LEVELUP_SONG } from './levelup';
import { MARSH_SONG } from './marsh';
import { TITLE_SONG } from './title';
import { VICTORY_SONG } from './victory';

export const SONGS = {
  battle: BATTLE_SONG,
  fallen: FALLEN_SONG,
  hollowmere: HOLLOWMERE_SONG,
  levelup: LEVELUP_SONG,
  marsh: MARSH_SONG,
  title: TITLE_SONG,
  victory: VICTORY_SONG,
};

export type SongId = keyof typeof SONGS;
