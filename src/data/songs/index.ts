import { BARROW_SONG } from './barrow';
import { BATTLE_SONG } from './battle';
import { FALLEN_SONG } from './fallen';
import { HOLLOWMERE_SONG } from './hollowmere';
import { INN_SONG } from './inn';
import { LEVELUP_SONG } from './levelup';
import { MARSH_SONG } from './marsh';
import { TITLE_SONG } from './title';
import { VICTORY_SONG } from './victory';
import { WARDEN_SONG } from './warden';

export const SONGS = {
  barrow: BARROW_SONG,
  battle: BATTLE_SONG,
  fallen: FALLEN_SONG,
  hollowmere: HOLLOWMERE_SONG,
  inn: INN_SONG,
  levelup: LEVELUP_SONG,
  marsh: MARSH_SONG,
  title: TITLE_SONG,
  victory: VICTORY_SONG,
  warden: WARDEN_SONG,
};

export type SongId = keyof typeof SONGS;
