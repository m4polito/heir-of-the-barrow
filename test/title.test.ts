import { describe, it, expect } from 'vitest';
import { titleLayout, TitleState } from '../src/game/title';
import type { Font } from '../src/engine/font';
import type { Game } from '../src/game/game';
import { createPlayer } from '../src/game/player';
import { toSave } from '../src/game/save';
import { ITEMS } from '../src/data/items';
import { MAPS } from '../src/data/maps';
import { LOGICAL_W } from '../src/engine/constants';
import { GLYPH_W } from '../src/engine/font';
import { STORY } from '../src/data/story';

const ctx = new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D;

const drawnAt: { t: string; x: number; y: number }[] = [];
const textFont = {
  drawText: (_c: unknown, t: string, x: number, y: number) => void drawnAt.push({ t, x, y }),
  measure: (t: string, sc: number) => Array.from(t).length * GLYPH_W * sc,
} as unknown as Font;

function titleGame(stored: string | null) {
  return {
    font: textFont,
    story: STORY,
    songs: { title: {} },
    items: ITEMS,
    maps: MAPS,
    storage: { getItem: () => stored, setItem: () => {} },
    audio: { playSong: () => {}, playSfx: () => {} },
  } as unknown as Game;
}

const width = (text: string, scale: number) => Array.from(text).length * GLYPH_W * scale;

describe('titleLayout', () => {
  it('wraps a long title at scale 2, centres every line, subtitle below at scale 1', () => {
    const out = titleLayout(width, STORY.title, STORY.subtitle);
    const titles = out.filter((e) => e.scale === 2);
    const subs = out.filter((e) => e.scale === 1);
    expect(titles.length).toBeGreaterThan(1);
    expect(subs.map((e) => e.text)).toEqual([STORY.subtitle]);
    for (const e of out) {
      expect(e.x).toBeGreaterThanOrEqual(0);
      expect(e.x + width(e.text, e.scale)).toBeLessThanOrEqual(LOGICAL_W);
      expect(e.x).toBe(Math.floor((LOGICAL_W - width(e.text, e.scale)) / 2));
    }
    expect(titles[0]!.y).toBe(56);
    expect(titles[1]!.y - titles[0]!.y).toBe(18);
    const last = titles[titles.length - 1]!;
    expect(subs[0]!.y).toBe(last.y + 16 + 8);
    expect(subs[0]!.y + 8).toBeLessThan(150);
  });

  it.each([
    [true, [['Continue', 150], ['New Game', 162]]],
    [false, [['New Game', 150]]],
  ] as const)('draws the rows at x 112 (save: %s)', (withSave, rows) => {
    const hero = createPlayer('Wren', []);
    const stored = withSave
      ? JSON.stringify(toSave(hero, { map: 'elder_house', x: 6, y: 4, facing: 'up' }))
      : null;
    const state = new TitleState(titleGame(stored));
    state.enter();
    drawnAt.length = 0;
    state.render(ctx);
    for (const [text, y] of rows) expect(drawnAt).toContainEqual({ t: text, x: 112, y });
    expect(drawnAt.filter((d) => d.t === '▶')).toEqual([{ t: '▶', x: 104, y: 150 }]);
  });

  it('keeps a short title on one line', () => {
    const out = titleLayout(width, 'HERO', 'SUB');
    expect(out.map((e) => e.text)).toEqual(['HERO', 'SUB']);
    expect(out[0]!.y).toBe(56);
    expect(out[1]!.y).toBe(56 + 16 + 8);
  });
});
