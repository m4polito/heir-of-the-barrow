import { describe, it, expect } from 'vitest';
import { DARK_RADIUS, TORCH_RADIUS, lightRadius, darkRects } from '../src/game/light';
import { setupRoom, keys } from './helpers/exploreKit';
import { ITEMS } from '../src/data/items';
import { SPELLS } from '../src/data/spells';
import { createPlayer } from '../src/game/player';
import { battleKit } from '../src/game/battle/kit';
import { DialogState } from '../src/game/dialog/dialogState';
import { BattleState } from '../src/game/battle/battleState';
import type { EncounterTable } from '../src/game/map';
import { LOGICAL_W, LOGICAL_H } from '../src/engine/constants';

type Rect = { x: number; y: number; w: number; h: number };
const area = (rs: Rect[]) => rs.reduce((n, r) => n + r.w * r.h, 0);
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('lightRadius', () => {
  it('is null on a lit map, the torch radius with a torch, one tile without', () => {
    expect(DARK_RADIUS).toBe(1);
    expect(TORCH_RADIUS).toBe(3);
    expect(lightRadius(false, 50, 3)).toBeNull();
    expect(lightRadius(true, 0, 3)).toBe(1);
    expect(lightRadius(true, 1, 3)).toBe(3);
  });
});

describe('darkRects', () => {
  it('covers the screen outside a 3x3 lit square', () => {
    const rs = darkRects(120, 104, 1);
    const lit: Rect = { x: 104, y: 88, w: 48, h: 48 };
    expect(area(rs)).toBe(LOGICAL_W * LOGICAL_H - 48 * 48);
    for (const r of rs) expect(overlaps(r, lit)).toBe(false);
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) expect(overlaps(rs[i]!, rs[j]!)).toBe(false);
    for (const r of rs) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(LOGICAL_W);
      expect(r.y + r.h).toBeLessThanOrEqual(LOGICAL_H);
    }
  });
  it('leaves out empty rectangles for a hero in a corner', () => {
    const rs = darkRects(0, 0, 1);
    expect(rs.length).toBeGreaterThan(0);
    expect(rs.length).toBeLessThanOrEqual(4);
    for (const r of rs) {
      expect(r.w).toBeGreaterThan(0);
      expect(r.h).toBeGreaterThan(0);
    }
    expect(area(rs)).toBe(LOGICAL_W * LOGICAL_H - 32 * 32);
    for (const r of rs) expect(overlaps(r, { x: 0, y: 0, w: 32, h: 32 })).toBe(false);
  });
  it('radius 3 lights 112x112', () => {
    expect(area(darkRects(120, 104, 3))).toBe(LOGICAL_W * LOGICAL_H - 112 * 112);
  });
});

describe('data', () => {
  it("the Torch's radius is the lit radius and it is not offered in battle", () => {
    const use = ITEMS.torch.use!;
    expect(use.effect.kind === 'light' && use.effect.radius).toBe(TORCH_RADIUS);
    const p = { ...createPlayer('x', []), inventory: [{ item: 'torch', count: 1 }] };
    expect(battleKit(p, SPELLS, ITEMS).items).toEqual([]);
  });
});

describe('map screen on a dark map', () => {
  const steps = (t: ReturnType<typeof setupRoom>, n: number, dir: string) => {
    // one completed step takes 9 updates; the next begins on the 9th when the key is still held
    for (let i = 0; i < n * 9; i++) t.stack.update(keys({ held: [dir] }));
  };
  const shortOfEdge = { x: 1, y: 4, facing: 'right' as const };

  it('reports the map as dark through the game', () => {
    const t = setupRoom({ dark: true });
    expect(t.game.fieldCtx!()).toEqual({ dark: true });
    expect(t.explore.lightRadius).toBe(DARK_RADIUS);
    t.game.player = { ...t.game.player, torch: 3 };
    expect(t.explore.lightRadius).toBe(TORCH_RADIUS);
  });

  it('a lit map has no light radius', () => {
    const t = setupRoom({});
    expect(t.explore.lightRadius).toBeNull();
    expect(t.game.fieldCtx!()).toEqual({ dark: false });
  });

  it('two steps burn a torch of 2 out, and the second says so', () => {
    const t = setupRoom({ dark: true, pos: shortOfEdge, patch: { torch: 2 } });
    t.hold(9, 'right');
    // the first step has completed (the second is already under way)
    expect(t.game.player.torch).toBe(1);
    expect(t.stack.top).toBe(t.explore);
    t.hold(9, 'right');
    expect(t.game.player.torch).toBe(0);
    expect(t.stack.top).toBeInstanceOf(DialogState);
    t.idle(60); // let the text print
    expect(t.shown()).toContain('Your torch gutters out.');
  });

  it('a torch already out stays at 0 and says nothing', () => {
    const t = setupRoom({ dark: true, pos: shortOfEdge, patch: { torch: 0 } });
    steps(t, 2, 'right');
    expect(t.game.player.torch).toBe(0);
    expect(t.stack.top).toBe(t.explore);
  });

  it('a lit map leaves the torch alone', () => {
    const t = setupRoom({ pos: shortOfEdge, patch: { torch: 5 } });
    steps(t, 2, 'right');
    expect(t.game.player.torch).toBe(5);
  });

  const forced: EncounterTable = {
    baseRate: 2,
    zones: { barrowFloor: { backdrop: 'grass', monsters: [{ monster: 'mireling', weight: 1 }] } },
  };

  it('a battle on the last step: no torch dialog before or after, and the light drops', () => {
    // three grace steps, then the fourth (x 1 -> 5) starts the battle as the torch reaches 0
    const t = setupRoom({ dark: true, pos: shortOfEdge, patch: { torch: 4 }, encounters: forced });
    t.hold(36, 'right');
    expect(t.game.player.torch).toBe(0);
    expect(t.stack.states.some((s) => s instanceof DialogState)).toBe(false);
    t.hold(40, 'right');
    expect(t.stack.states.some((s) => s instanceof BattleState)).toBe(true);
    expect(t.stack.states.some((s) => s instanceof DialogState)).toBe(false);
    expect(t.explore.lightRadius).toBe(DARK_RADIUS);
  });

  it('a battle fought with torch 50 ends with 50', () => {
    const t = setupRoom({ dark: true, pos: shortOfEdge, patch: { torch: 50, str: 99 }, encounters: forced });
    t.hold(36, 'right');
    // the step that began the fight burned one; fight on with confirm until the map is back
    expect(t.game.player.torch).toBe(46);
    const before = t.game.player.torch;
    for (let i = 0; i < 3000 && t.stack.top !== t.explore; i++) {
      t.stack.update(keys(i % 3 === 0 ? { pressed: ['confirm'] } : {}));
    }
    expect(t.stack.top).toBe(t.explore);
    expect(t.game.player.torch).toBe(before);
  });
});

describe('render', () => {
  function record(dark: boolean) {
    const calls: { op: string; args: unknown[]; style?: unknown }[] = [];
    const state = { fillStyle: '' };
    const ctx = {
      set fillStyle(v: string) {
        state.fillStyle = v;
      },
      fillRect(...args: unknown[]) {
        calls.push({ op: 'fillRect', args, style: state.fillStyle });
      },
      drawImage(...args: unknown[]) {
        calls.push({ op: 'drawImage', args });
      },
    } as unknown as CanvasRenderingContext2D;
    const t = setupRoom({ dark });
    t.explore.render(ctx, 1);
    return calls;
  }

  it('fills black darkRects after the tiles and before the hero', () => {
    const calls = record(true);
    // hero at tile (2,2) of a 7x6 map centred on screen: origin (-72,-72) => screen (104,104)
    const expected = darkRects(104, 104, DARK_RADIUS);
    const rects = calls.filter((c) => c.op === 'fillRect').slice(1); // the first clears the screen
    expect(rects.map((c) => c.args)).toEqual(expected.map((r) => [r.x, r.y, r.w, r.h]));
    for (const r of rects) expect(r.style).toBe('#000');
    const lastDraw = calls.map((c) => c.op).lastIndexOf('drawImage');
    const draws = calls.map((c, i) => (c.op === 'drawImage' ? i : -1)).filter((i) => i >= 0);
    const lastTile = draws[draws.length - 2]!; // the hero is the final drawImage
    const idx = (c: (typeof calls)[number]) => calls.indexOf(c);
    for (const r of rects) {
      expect(idx(r)).toBeGreaterThan(lastTile);
      expect(idx(r)).toBeLessThan(lastDraw);
    }
    // the hero is the last thing drawn, with no darkness over it
    expect(calls.slice(lastDraw + 1)).toEqual([]);
    const tileDraws = calls.filter((c) => c.op === 'drawImage');
    expect(tileDraws.length).toBeGreaterThan(1);
  });

  it('a lit map draws no darkness', () => {
    const calls = record(false);
    expect(calls.filter((c) => c.op === 'fillRect')).toHaveLength(1);
  });
});
