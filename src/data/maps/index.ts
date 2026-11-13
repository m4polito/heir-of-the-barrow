import { HOLLOWMERE } from './hollowmere';
import { ELDER_HOUSE } from './elderHouse';
import { INN } from './inn';
import { FORGE } from './forge';
import { SHOP } from './shop';
import { MARSH } from './marsh';
import { BARROW_1 } from './barrow1';
import { BARROW_2 } from './barrow2';
import type { GameMap } from '../../game/map';

export const MAPS = {
  hollowmere: HOLLOWMERE,
  elder_house: ELDER_HOUSE,
  inn: INN,
  forge: FORGE,
  shop: SHOP,
  marsh: MARSH,
  barrow_1: BARROW_1,
  barrow_2: BARROW_2,
} satisfies Record<string, GameMap>;

export type MapId = keyof typeof MAPS;
