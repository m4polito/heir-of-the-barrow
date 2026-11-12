import { describe, expect, it } from 'vitest';
import { MONSTERS } from '../src/data/monsters';
import type { MonsterDef } from '../src/game/battle/monster';
import { ITEMS } from '../src/data/items';
import { PALETTE } from '../src/data/palette';
import { compilePixelArt } from '../src/engine/pixels';
import { createRng } from '../src/engine/rng';
import { monsterArt } from '../src/data/sprites/monsters';
import { BACKDROPS, backdropArt } from '../src/data/sprites/backdrops';
import { Battle } from '../src/game/battle/battle';
import { addItem, equip } from '../src/game/inventory';
import { createPlayer } from '../src/game/player';
import { attackOf, defenseOf } from '../src/game/stats';
import { wrapText } from '../src/ui/wrap';

const ROWS = [
  ['mireling', 'Mireling', 0, 6, 5, 3, 3, 2, [2, 4], 1 / 32, 'A Mireling slumps out of the reeds.'],
  ['bog_mireling', 'Bog Mireling', 1, 14, 11, 8, 6, 7, [6, 10], 1 / 16, 'A Bog Mireling drags itself from the mud.'],
  ['barrow_mireling', 'Barrow Mireling', 2, 24, 20, 14, 10, 18, [12, 18], 1 / 16, 'A Barrow Mireling unfolds from the dark.'],
] as const;

describe('monster table', () => {
  for (const [id, name, palette, hp, atk, def, agi, xp, gold, dodge, intro] of ROWS) {
    it(`${id} matches the spec`, () => {
      expect(MONSTERS[id]).toMatchObject({ id, name, palette, hp, atk, def, agi, xp, gold, dodge, intro, sprite: 'mireling', runFactor: 1 });
      expect((MONSTERS[id] as MonsterDef).boss).toBeUndefined();
      expect(MONSTERS[id]!.id).toBe(id);
    });
  }
  it('has exactly three monsters', () => {
    expect(Object.keys(MONSTERS)).toHaveLength(3);
  });
});

describe('monster art', () => {
  it('each monster compiles at 24x24', () => {
    for (const m of Object.values(MONSTERS)) {
      const out = compilePixelArt(monsterArt(m.sprite, m.palette), PALETTE);
      expect(out.w).toBe(24);
      expect(out.h).toBe(24);
    }
  });
  it('three palettes share rows but differ in colours', () => {
    const [a, b, c] = [0, 1, 2].map((p) => monsterArt('mireling', p));
    expect(a!.rows).toEqual(b!.rows);
    expect(a!.rows).toEqual(c!.rows);
    expect(a!.colors).not.toEqual(b!.colors);
    expect(a!.colors).not.toEqual(c!.colors);
    expect(b!.colors).not.toEqual(c!.colors);
  });
  it("the bog palette's shade is not the murk water colour", () => {
    expect(monsterArt('mireling', MONSTERS.bog_mireling!.palette).colors.s).not.toBe(BACKDROPS.murk!.colors.w);
  });
  it('is identity-stable, falls back to palette 0, throws on unknown sprite', () => {
    expect(monsterArt('mireling', 1)).toBe(monsterArt('mireling', 1));
    expect(monsterArt('mireling', 9)).toBe(monsterArt('mireling', 0));
    expect(() => monsterArt('nope', 0)).toThrow();
  });
});

describe('backdrops', () => {
  it('compile at 16x24', () => {
    for (const art of Object.values(BACKDROPS)) {
      const out = compilePixelArt(art, PALETTE);
      expect(out.w).toBe(16);
      expect(out.h).toBe(24);
    }
    for (const art of Object.values(BACKDROPS)) {
      expect(art.rows[8]).not.toContain('.');
      for (const row of art.rows.slice(9)) expect(row).not.toContain('.');
    }
    expect(Object.keys(BACKDROPS).sort()).toEqual(['grass', 'murk']);
  });
  it('throws on unknown id', () => {
    expect(() => backdropArt('nope')).toThrow();
    expect(backdropArt('grass')).toBe(BACKDROPS.grass);
  });
});

describe('monster text', () => {
  it('lines fit two rows of 28 columns and avoid banned phrasing', () => {
    for (const m of Object.values(MONSTERS)) {
      expect(wrapText(m.intro, 28).length).toBeLessThanOrEqual(2);
      expect(wrapText(`The ${m.name} takes 99 damage.`, 28).length).toBeLessThanOrEqual(2);
      expect(m.intro).not.toMatch(/draws near|thou|thee|slime|dragon/i);
    }
  });
});

describe('early-game pacing', () => {
  it('a level 1 hero with club and shield beats the Mireling quickly and cheaply', () => {
    let p = createPlayer('Wren', []);
    p = addItem(ITEMS, p, 'wooden_club').player;
    p = addItem(ITEMS, p, 'aldric_shield').player;
    p = equip(ITEMS, p, 'wooden_club').player;
    p = equip(ITEMS, p, 'aldric_shield').player;
    const hero = { hp: p.hp, atk: attackOf(ITEMS, p), def: defenseOf(ITEMS, p), agi: p.agi };
    expect(hero.atk).toBe(6);
    expect(hero.def).toBe(6);
    const rng = createRng(11);
    const N = 2000;
    let rounds = 0;
    let lost = 0;
    let wins = 0;
    for (let i = 0; i < N; i++) {
      const b = new Battle(rng, hero, MONSTERS.mireling!);
      while (b.outcome === null) {
        b.act('fight');
        rounds++;
      }
      if (b.outcome === 'won') wins++;
      lost += hero.hp - b.heroHp;
    }
    expect(rounds / N).toBeLessThanOrEqual(4);
    expect(lost / N).toBeLessThan(3);
    expect(wins / N).toBeGreaterThanOrEqual(0.99);
  });
});
