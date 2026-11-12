import type { MonsterAction } from './ai';

export interface MonsterDef {
  id: string;
  name: string;
  intro: string;
  sprite: string;
  palette: number;
  hp: number;
  atk: number;
  def: number;
  agi: number;
  xp: number;
  gold: [number, number];
  dodge: number;
  runFactor: number;
  boss?: boolean;
  actions?: MonsterAction[];
}

export type MonsterTable = Record<string, MonsterDef>;
