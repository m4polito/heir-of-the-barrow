import { describe, it, expect } from 'vitest';
import { titleLayout } from '../src/game/title';
import { LOGICAL_W } from '../src/engine/constants';
import { GLYPH_W } from '../src/engine/font';
import { STORY } from '../src/data/story';

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

  it('keeps a short title on one line', () => {
    const out = titleLayout(width, 'HERO', 'SUB');
    expect(out.map((e) => e.text)).toEqual(['HERO', 'SUB']);
    expect(out[0]!.y).toBe(56);
    expect(out[1]!.y).toBe(56 + 16 + 8);
  });
});
