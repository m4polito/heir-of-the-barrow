import { describe, it, expect } from 'vitest';
import { setupRoom, keys } from './helpers/exploreKit';
import { ExploreState } from '../src/game/explore';
import { BattleState } from '../src/game/battle/battleState';
import { DialogState } from '../src/game/dialog/dialogState';
import { ItemsState } from '../src/game/menu/itemsState';
import { MenuState } from '../src/game/menu/menuState';
import type { MonsterDef } from '../src/game/battle/monster';
import { MONSTERS } from '../src/data/monsters';
import { MAPS } from '../src/data/maps';
import { BACKDROPS } from '../src/data/sprites/backdrops';
import { DIALOGS } from '../src/data/dialog/hollowmere';
import { SONGS } from '../src/data/songs';
import { ITEMS } from '../src/data/items';
import { STORY } from '../src/data/story';
import { PALETTE } from '../src/data/palette';
import { monsterArt } from '../src/data/sprites/monsters';
import { validateActions } from '../src/game/battle/ai';
import { applyLevel, createPlayer, hasFlag } from '../src/game/player';
import { addItem } from '../src/game/inventory';
import { sellPrice } from '../src/game/shop';
import type { Trigger } from '../src/game/map';

const FLAG = 'warden_defeated';
const BOSS: Trigger = {
  kind: 'boss',
  x: 3,
  y: 2,
  monster: 'barrow_warden',
  backdrop: 'barrow',
  flag: FLAG,
  dialog: 'warden_fallen',
};

const WARDEN = MONSTERS.barrow_warden as MonsterDef;
const frail: MonsterDef = { ...WARDEN, hp: 1, atk: 0, def: 0, agi: 1, dodge: 0, actions: undefined };
const killer: MonsterDef = { ...WARDEN, hp: 70, atk: 255, def: 0, agi: 255, dodge: 0, actions: undefined };

const lv6 = () => applyLevel(createPlayer(STORY.defaultHeroName, []), 6);

function setup(opts: { monster?: MonsterDef; patch?: Parameters<typeof setupRoom>[0]['patch'] } = {}) {
  const t = setupRoom({
    triggers: [BOSS],
    dark: true,
    pos: { x: 2, y: 2, facing: 'right' },
    patch: { ...lv6(), torch: 50, ...opts.patch },
    dialogs: DIALOGS,
    extraMaps: MAPS,
    monsters: { ...MONSTERS, barrow_warden: opts.monster ?? WARDEN },
  });
  const events: string[] = [];
  const name = (song: unknown) => Object.entries(SONGS).find(([, s]) => s === song)?.[0] ?? '?';
  t.game.audio.playSong = (s) => void events.push(`song:${name(s)}`);
  t.game.audio.stopSong = () => void events.push('stop');
  t.game.audio.playSfx = (id) => void events.push(`sfx:${id}`);
  const tick = (...k: string[]) => t.stack.update(keys({ pressed: k }));
  const walk = (dir: string) => {
    // Eight held ticks start and run the step; one idle tick lets it arrive without a second step starting.
    for (let i = 0; i < 8; i++) t.stack.update(keys({ held: [dir] }));
    t.stack.update(keys());
  };
  const step = () => walk('right');
  const battle = () => t.stack.states.find((s) => s instanceof BattleState) as BattleState | undefined;
  /** Confirm every third tick (cancel on the others when asked) until `done`. */
  const mash = (done: () => boolean, cancel = false, bound = 20000) => {
    for (let i = 0; i < bound && !done(); i++) tick(...(i % 3 === 0 ? ['confirm'] : cancel ? ['cancel'] : []));
    expect(done()).toBe(true);
  };
  const pages = () => t.game.player.inventory.filter((s) => s.item === 'journal_page').reduce((n, s) => n + s.count, 0);
  /** Play a won fight and its aftermath to the end of the dialog. */
  const winAll = (cancel = false) => {
    step();
    mash(() => battle() !== undefined);
    let sawDialog = false;
    mash(() => {
      if (t.stack.top instanceof DialogState) sawDialog = true;
      return sawDialog && t.stack.top === t.explore;
    }, cancel);
  };
  return { ...t, events, tick, walk, step, battle, mash, pages, winAll };
}

describe('the Warden guards its tile', () => {
  it('stepping on starts its battle: the sting, then its song once; run is always refused', () => {
    const t = setup();
    t.step();
    t.mash(() => t.battle() !== undefined);
    expect(t.events.slice(0, 3)).toEqual(['stop', 'sfx:encounter', 'song:warden']);
    expect(t.events.filter((e) => e === 'song:warden')).toHaveLength(1);
    const b = t.battle()!;
    const toCommand = () => {
      for (let i = 0; i < 3000 && b.phase !== 'command'; i++) t.tick(i % 3 === 0 ? 'confirm' : '');
      expect(b.phase).toBe('command');
    };
    for (let n = 0; n < 3; n++) {
      toCommand();
      if (n === 0) for (let i = 0; i < 3; i++) t.tick('down');
      t.tick('confirm');
      for (let i = 0; i < 400 && !b.text.join(' ').includes('blocks the way!'); i++) t.tick();
      expect(b.text.join(' ')).toContain('The Barrow Warden blocks the way!');
    }
    expect(b.battle.outcome).toBeNull();
  });

  it('a win: fanfare, level-up, then flag, dialog, one page, and the map song once', () => {
    const t = setup({ monster: frail });
    const level = t.game.player.level;
    t.step();
    t.mash(() => t.battle() !== undefined);
    const mark = t.events.length;
    let flagWhenDialogOpened: boolean | undefined;
    let sawDialog = false;
    t.mash(() => {
      if (t.stack.top instanceof DialogState && flagWhenDialogOpened === undefined) {
        flagWhenDialogOpened = hasFlag(t.game.player, FLAG);
        expect(t.battle()).toBeUndefined();
      }
      if (t.stack.top instanceof DialogState) sawDialog = true;
      return sawDialog && t.stack.top === t.explore;
    });
    expect(flagWhenDialogOpened).toBe(true);
    const after = t.events.slice(mark).filter((e) => e.startsWith('song:'));
    expect(after.slice(0, 2)).toEqual(['song:victory', 'song:levelup']);
    expect(after.filter((e) => e === 'song:marsh')).toHaveLength(1);
    expect(after[after.length - 1]).toBe('song:marsh');
    expect(t.game.player.level).toBeGreaterThan(level);
    expect(t.pages()).toBe(1);
    expect(t.game.player.gold).toBe(lv6().gold);
  });

  it('cancel pressed through the whole sequence still ends with one page and the flag set', () => {
    const t = setup({ monster: frail });
    t.winAll(true);
    expect(hasFlag(t.game.player, FLAG)).toBe(true);
    expect(t.pages()).toBe(1);
    expect(t.stack.states.some((s) => s instanceof MenuState)).toBe(false);
  });

  it('the page arrives even with eight ordinary pack entries', () => {
    let p = lv6();
    for (const id of ['wooden_club', 'iron_knife', 'bronze_sword', 'cloth_tunic', 'leather_armor', 'plank_shield', 'herb', 'torch'])
      p = addItem(ITEMS, p, id).player;
    expect(p.inventory).toHaveLength(8);
    const t = setup({ monster: frail, patch: { inventory: p.inventory } });
    t.winAll();
    expect(t.pages()).toBe(1);
    expect(t.game.player.inventory).toHaveLength(9);
  });

  it('after the win the tile is ordinary floor: no battle, no dialog', () => {
    const t = setup({ monster: frail });
    t.winAll();
    t.walk('right');
    t.walk('left');
    expect(t.explore.hero.x).toBe(3);
    expect(t.stack.top).toBe(t.explore);
    expect(t.battle()).toBeUndefined();
    expect(t.pages()).toBe(1);
  });

  it('with the flag set the tile rolls no encounter at all', () => {
    const t = setup({ patch: { flags: [FLAG] } });
    (t.room as { encounters?: unknown }).encounters = {
      baseRate: 1,
      zones: { barrowFloor: { backdrop: 'barrow', monsters: [{ monster: 'barrow_warden', weight: 1 }] } },
    };
    (t.explore as unknown as { grace: number }).grace = 0;
    let draws = 0;
    const next = t.game.rng.next.bind(t.game.rng);
    t.game.rng.next = () => (draws++, next());
    t.step();
    expect(t.explore.hero.x).toBe(3);
    expect(t.stack.top).toBe(t.explore);
    expect(draws).toBe(0);
    // Control: the next tile does roll.
    t.walk('right');
    expect(draws).toBeGreaterThan(0);
  });

  it('a hero who already has the flag never triggers the fight', () => {
    const t = setup({ patch: { flags: [FLAG] } });
    t.step();
    expect(t.stack.top).toBe(t.explore);
    expect(t.battle()).toBeUndefined();
  });

  it('a lost fight wakes the hero at the respawn point; the fight starts again at full HP', () => {
    const t = setup({ monster: killer, patch: { hp: 5, maxHp: 5 } });
    t.step();
    t.mash(() => t.stack.top instanceof ExploreState && t.stack.top !== t.explore);
    expect((t.stack.top as ExploreState).mapId).toBe(STORY.respawn.map);
    expect(hasFlag(t.game.player, FLAG)).toBe(false);
    expect(t.pages()).toBe(0);
    t.stack.reset(new ExploreState(t.game, 'room', { x: 2, y: 2, facing: 'right' }));
    t.game.player = { ...t.game.player, hp: t.game.player.maxHp };
    t.walk('right');
    t.mash(() => t.battle() !== undefined);
    expect(t.battle()!.battle.monsterHp).toBe(killer.hp);
  });

  it('a torch that dies on the boss tile starts the battle with no torch line', () => {
    const t = setup({ monster: frail, patch: { torch: 1 } });
    t.step();
    expect(t.game.player.torch).toBe(0);
    for (let i = 0; i < 60; i++) {
      expect(t.stack.top instanceof DialogState).toBe(false);
      t.tick();
    }
    t.mash(() => t.battle() !== undefined);
  });
});

describe('the Warden as data', () => {
  it('has the fixture numbers, valid actions and a known song', () => {
    expect(WARDEN).toMatchObject({
      id: 'barrow_warden',
      name: 'Barrow Warden',
      intro: 'The Barrow Warden rises.',
      sprite: 'warden',
      song: 'warden',
      palette: 0,
      hp: 52,
      atk: 26,
      def: 16,
      agi: 12,
      xp: 300,
      gold: [0, 0],
      dodge: 1 / 32,
      runFactor: Infinity,
      boss: true,
    });
    expect(() => validateActions(WARDEN.actions!)).not.toThrow();
    expect(Object.keys(SONGS)).toContain(WARDEN.song);
  });

  it('its sprite is 32x32 and uses only palette entries', () => {
    const art = monsterArt('warden', 0);
    expect(art.w).toBe(32);
    expect(art.h).toBe(32);
    expect(art.rows).toHaveLength(32);
    for (const r of art.rows) expect(r).toHaveLength(32);
    const used = new Set(art.rows.join('').replace(/\./g, ''));
    for (const ch of used) expect(PALETTE[art.colors[ch]!]).toBeDefined();
    expect(used.size).toBeLessThanOrEqual(4);
  });

  it('every monster sprite id is known to monsterArt', () => {
    for (const m of Object.values(MONSTERS) as MonsterDef[]) expect(() => monsterArt(m.sprite, m.palette)).not.toThrow();
  });
});

describe('reading the journal page', () => {
  it('opens its page, keeps it, sets the flag; it sells for nothing', () => {
    const t = setup({ patch: { inventory: [{ item: 'journal_page', count: 1 }] } });
    expect(ITEMS.journal_page.price).toBe(0);
    expect(sellPrice(ITEMS.journal_page)).toBe(0);
    t.stack.push(new ItemsState(t.game));
    t.tick('confirm');
    expect(t.stack.top).toBeInstanceOf(DialogState);
    t.mash(() => t.stack.top instanceof ItemsState);
    expect(t.pages()).toBe(1);
    expect(hasFlag(t.game.player, 'journal_read')).toBe(true);
  });
});

describe('the battle screen places any sprite height on one floor line', () => {
  function drawn(monster: MonsterDef) {
    const t = setup();
    const calls: { img: unknown; x: number; y: number }[] = [];
    const ctx = new Proxy(
      {},
      { get: (_o, k) => (k === 'drawImage' ? (img: unknown, x: number, y: number) => calls.push({ img, x, y }) : () => {}) },
    ) as unknown as CanvasRenderingContext2D;
    (t.game as { sprites: unknown }).sprites = { get: (a: unknown) => a };
    const b = new BattleState(t.game, { monster, backdrop: 'barrow', onEnd: () => {} });
    b.render(ctx, 1);
    return calls.find((c) => c.img === monsterArt(monster.sprite, monster.palette))!;
  }
  it('a 32 px sprite is at y 72 and centred; a 24 px one at y 80', () => {
    expect(drawn(WARDEN)).toMatchObject({ x: 112, y: 72 });
    expect(drawn(MONSTERS.mireling as MonsterDef)).toMatchObject({ x: 116, y: 80 });
  });
});

describe('trigger data across every map', () => {
  it('each boss names a known monster, backdrop and dialog; each look names a dialog', () => {
    let bosses = 0;
    for (const m of Object.values(MAPS))
      for (const t of m.triggers) {
        if (t.kind === 'boss') {
          bosses++;
          expect(Object.keys(MONSTERS)).toContain(t.monster);
          expect(Object.keys(BACKDROPS)).toContain(t.backdrop);
          expect(Object.keys(DIALOGS)).toContain(t.dialog);
        } else if (t.kind === 'look') {
          expect(Object.keys(DIALOGS)).toContain(t.dialog);
        }
      }
    expect(bosses).toBe(1);
  });
});
