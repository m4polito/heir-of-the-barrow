import { HOLLOWMERE_SONG } from './hollowmere';

export const SONGS = {
  hollowmere: HOLLOWMERE_SONG,
};

export type SongId = keyof typeof SONGS;
