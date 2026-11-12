import { HOLLOWMERE } from './hollowmere';
import { ELDER_HOUSE } from './elderHouse';
import { INN } from './inn';
import { FORGE } from './forge';
import { SHOP } from './shop';
import type { GameMap } from '../../game/map';

export const MAPS = {
  hollowmere: HOLLOWMERE,
  elder_house: ELDER_HOUSE,
  inn: INN,
  forge: FORGE,
  shop: SHOP,
} satisfies Record<string, GameMap>;

export type MapId = keyof typeof MAPS;
