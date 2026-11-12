import { HOLLOWMERE_SONG } from './hollowmere';
import { TITLE_SONG } from './title';

export const SONGS = {
  hollowmere: HOLLOWMERE_SONG,
  title: TITLE_SONG,
};

export type SongId = keyof typeof SONGS;
