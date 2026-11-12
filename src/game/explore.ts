import { LOGICAL_W, LOGICAL_H, TILE, type Dir } from '../engine/constants';
import type { State } from '../engine/state';
import type { Input } from '../engine/input';
import { TILES, TILE_IDS, ANIM_FRAME_LEN } from '../data/tiles';
import { HERO_SPRITES } from '../data/sprites/hero';
import { npcArt } from '../data/sprites/npcs';
import { isWalkable, tileAt, warpAt, type GameMap } from './map';
import { createHero, updateHero, heroPixelOffset, type HeroState } from './hero';
import { createNpc, updateNpc, npcPixelOffset, type NpcState } from './npc';
import { cameraOrigin } from './camera';
import { TransitionState } from './transition';
import type { Game } from './game';

function lookup(game: Game, mapId: string, entry: string): { map: GameMap; hero: HeroState } {
  const map = game.maps[mapId];
  if (!map) throw new Error(`Unknown map: ${mapId}`);
  const e = map.entry[entry];
  if (!e) throw new Error(`Unknown entry '${entry}' on map ${mapId}`);
  return { map, hero: createHero(e.x, e.y, e.facing) };
}

export class ExploreState implements State {
  private _map: GameMap;
  private _hero: HeroState;
  /** Set whenever a map is entered; consumed in Task 10. */
  private enteredMap: boolean;
  npcs: NpcState[];

  constructor(
    private readonly game: Game,
    mapId: string,
    entry: string,
  ) {
    const { map, hero } = lookup(game, mapId, entry);
    this._map = map;
    this._hero = hero;
    this.npcs = map.npcs.map(createNpc);
    this.enteredMap = true;
  }

  get hero(): HeroState {
    return this._hero;
  }

  get map(): GameMap {
    return this._map;
  }

  get mapId(): string {
    return this._map.id;
  }

  enter(): void {
    this.playMapSong();
  }

  private playMapSong(): void {
    const song = this.game.songs[this._map.music];
    if (song) this.game.audio.playSong(song);
  }

  warpTo(mapId: string, entry: string): void {
    const target = lookup(this.game, mapId, entry);
    this.game.audio.playSfx('door');
    this.game.stack.push(
      new TransitionState(this.game.stack, {
        onMid: () => {
          this._map = target.map;
          this._hero = target.hero;
          this.npcs = target.map.npcs.map(createNpc);
          this.playMapSong();
          this.enteredMap = true;
        },
      }),
    );
  }

  private npcAt(x: number, y: number, except?: NpcState): boolean {
    return this.npcs.some((n) => n !== except && n.x === x && n.y === y);
  }

  private reserved(x: number, y: number): boolean {
    const map = this._map;
    if (tileAt(map, x, y)?.id === TILE_IDS.door) return true;
    if (warpAt(map, x, y)) return true;
    return Object.values(map.entry).some((e) => e.x === x && e.y === y);
  }

  update(input: Input): void {
    const held = (a: Dir) => input.held(a);
    const map = this._map;
    this._hero = updateHero(
      this._hero,
      held,
      (x, y) => isWalkable(map, x, y) && !this.npcAt(x, y),
      (x, y) => {
        const w = warpAt(map, x, y);
        if (!w) return false;
        this.warpTo(w.to, w.entry);
        return true;
      },
    );
    this.npcs = this.npcs.map((n) =>
      updateNpc(n, this.game.rng, (x, y) =>
        isWalkable(map, x, y) &&
        !this.npcAt(x, y, n) &&
        !(this._hero.x === x && this._hero.y === y) &&
        !this.reserved(x, y),
      ),
    );
  }

  render(ctx: CanvasRenderingContext2D, frame: number): void {
    const { sprites } = this.game;
    const map = this._map;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    const off = heroPixelOffset(this._hero);
    const hx = this._hero.x * TILE + off.dx;
    const hy = this._hero.y * TILE + off.dy;
    const { ox, oy } = cameraOrigin(map, hx, hy);
    const x0 = Math.floor(ox / TILE);
    const x1 = Math.floor((ox + LOGICAL_W - 1) / TILE);
    const y0 = Math.floor(oy / TILE);
    const y1 = Math.floor((oy + LOGICAL_H - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = tileAt(map, tx, ty);
        if (!t) continue;
        const art = t.frames[Math.floor(frame / ANIM_FRAME_LEN) % t.frames.length]!;
        ctx.drawImage(sprites.get(art), tx * TILE - ox, ty * TILE - oy);
      }
    }
    interface Drawable {
      y: number;
      hero: boolean;
      draw: () => void;
    }
    const items: Drawable[] = this.npcs.map((n) => {
      const o = npcPixelOffset(n);
      const px = n.x * TILE + o.dx;
      const py = n.y * TILE + o.dy;
      return {
        y: py,
        hero: false,
        draw: () =>
          ctx.drawImage(
            sprites.get(npcArt(n.def.sprite, n.def.palette, n.facing, n.walkFrame)),
            px - ox,
            py - oy,
          ),
      };
    });
    items.push({
      y: hy,
      hero: true,
      draw: () =>
        ctx.drawImage(sprites.get(HERO_SPRITES[this._hero.facing][this._hero.walkFrame]), hx - ox, hy - oy),
    });
    items.sort((a, b) => a.y - b.y || Number(a.hero) - Number(b.hero));
    for (const it of items) it.draw();
  }
}
