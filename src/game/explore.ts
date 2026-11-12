import { LOGICAL_W, LOGICAL_H, TILE, type Dir } from '../engine/constants';
import type { State } from '../engine/state';
import type { Input } from '../engine/input';
import { compilePixelArt, type PixelArt } from '../engine/pixels';
import { rgbaToCanvas } from '../engine/canvasImage';
import { PALETTE } from '../data/palette';
import { TILES, ANIM_FRAME_LEN } from '../data/tiles';
import { HERO_SPRITES } from '../data/sprites/hero';
import { tileAt, type GameMap } from './map';
import { updateHero, heroPixelOffset, type HeroState } from './hero';
import { cameraOrigin } from './camera';

export class ExploreState implements State {
  private map: GameMap;
  /** Reassigned each update; callers must not assign it. */
  hero: HeroState;
  frame = 0;
  private cache = new Map<PixelArt, HTMLCanvasElement>();

  constructor(deps: { map: GameMap; hero: HeroState }) {
    this.map = deps.map;
    this.hero = deps.hero;
    for (const t of TILES) for (const f of t.frames) this.canvas(f);
    for (const pair of Object.values(HERO_SPRITES)) for (const f of pair) this.canvas(f);
  }

  private canvas(art: PixelArt): HTMLCanvasElement {
    let c = this.cache.get(art);
    if (!c) {
      c = rgbaToCanvas(compilePixelArt(art, PALETTE));
      this.cache.set(art, c);
    }
    return c;
  }

  update(input: Input): void {
    this.frame++;
    const held = (a: Dir) => input.held(a);
    this.hero = updateHero(this.hero, held, this.map);
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    const off = heroPixelOffset(this.hero);
    const hx = this.hero.x * TILE + off.dx;
    const hy = this.hero.y * TILE + off.dy;
    const { ox, oy } = cameraOrigin(this.map, hx, hy);
    const x0 = Math.floor(ox / TILE);
    const x1 = Math.floor((ox + LOGICAL_W - 1) / TILE);
    const y0 = Math.floor(oy / TILE);
    const y1 = Math.floor((oy + LOGICAL_H - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = tileAt(this.map, tx, ty);
        if (!t) continue;
        const art = t.frames[Math.floor(this.frame / ANIM_FRAME_LEN) % t.frames.length]!;
        ctx.drawImage(this.canvas(art), tx * TILE - ox, ty * TILE - oy);
      }
    }
    const sprite = HERO_SPRITES[this.hero.facing][this.hero.walkFrame];
    ctx.drawImage(this.canvas(sprite), hx - ox, hy - oy);
  }
}
