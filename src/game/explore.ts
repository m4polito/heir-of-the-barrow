import { LOGICAL_W, LOGICAL_H, TILE, DIR_VECTORS, type Dir } from '../engine/constants';
import type { State } from '../engine/state';
import type { Input } from '../engine/input';
import { TILE_IDS, ANIM_FRAME_LEN } from '../data/tiles';
import { HERO_SPRITES } from '../data/sprites/hero';
import { npcArt } from '../data/sprites/npcs';
import { isWalkable, tileAt, warpAt, type GameMap } from './map';
import { createHero, updateHero, heroPixelOffset, facingTile, opposite, heroIdle, type HeroState } from './hero';
import { createNpc, updateNpc, npcPixelOffset, type NpcState } from './npc';
import { cameraOrigin } from './camera';
import { TransitionState } from './transition';
import { DialogState } from './dialog/dialogState';
import { MenuState } from './menu/menuState';
import { setFlag, hasFlag } from './player';
import type { Game } from './game';

function lookup(game: Game, mapId: string, entry: string): { map: GameMap; hero: HeroState } {
  const map = game.maps[mapId];
  if (!map) throw new Error(`Unknown map: ${mapId}`);
  const e = map.entry[entry];
  if (!e) throw new Error(`Unknown entry '${entry}' on map ${mapId}`);
  if (!game.songs[map.music]) throw new Error(`Unknown song '${map.music}' for map ${mapId}`);
  return { map, hero: createHero(e.x, e.y, e.facing) };
}

export class ExploreState implements State {
  private _map: GameMap;
  private _hero: HeroState;
  /** Set whenever a map is entered; consumed by the first update() as the top state. */
  private enteredMap: boolean;
  readonly npcs: NpcState[];

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
    this.game.audio.playSong(this.game.songs[this._map.music]!);
  }

  warpTo(mapId: string, entry: string): void {
    const target = lookup(this.game, mapId, entry);
    this.game.audio.playSfx('door');
    this.game.stack.push(
      new TransitionState(this.game.stack, {
        onMid: () => {
          this._map = target.map;
          this._hero = target.hero;
          this.npcs.splice(0, this.npcs.length, ...target.map.npcs.map(createNpc));
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

  private npcOn(x: number, y: number): NpcState | undefined {
    return this.npcs.find((n) => n.x === x && n.y === y);
  }

  /** The NPC the hero can talk to: on the facing tile, or across one non-walkable tile (a counter). */
  private talkTarget(): NpcState | undefined {
    const map = this._map;
    const inMap = (x: number, y: number) => x >= 0 && y >= 0 && x < map.width && y < map.height;
    const near = facingTile(this._hero);
    if (!inMap(near.x, near.y)) return undefined;
    const direct = this.npcOn(near.x, near.y);
    if (direct) return direct;
    if (isWalkable(map, near.x, near.y)) return undefined;
    const v = DIR_VECTORS[this._hero.facing];
    const far = { x: near.x + v.dx, y: near.y + v.dy };
    return inMap(far.x, far.y) ? this.npcOn(far.x, far.y) : undefined;
  }

  private script(id: string) {
    const s = this.game.dialogs[id];
    if (!s) throw new Error(`Unknown dialog: ${id}`);
    return s;
  }

  private runAutoTrigger(): boolean {
    for (const t of this._map.triggers) {
      if (t.kind !== 'auto' || hasFlag(this.game.player, t.flag)) continue;
      const flag = t.flag;
      this.game.stack.push(
        new DialogState(this.game, this.script(t.dialog), {
          onDone: () => {
            this.game.player = setFlag(this.game.player, flag);
          },
        }),
      );
      return true;
    }
    return false;
  }

  update(input: Input): void {
    if (this.enteredMap) {
      this.enteredMap = false;
      if (this.runAutoTrigger()) return;
    }
    if (input.pressed('confirm') && heroIdle(this._hero)) {
      const npc = this.talkTarget();
      if (npc) {
        npc.stepFrame = 0; // snap to its tile so the turn cannot shift the sprite
        npc.facing = opposite(this._hero.facing);
        this.game.stack.push(new DialogState(this.game, this.script(npc.def.dialog)));
        return;
      }
    }
    if (input.pressed('cancel') && heroIdle(this._hero)) {
      this.game.audio.playSfx('menuConfirm');
      this.game.stack.push(new MenuState(this.game));
      return;
    }
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
    for (let i = 0; i < this.npcs.length; i++) {
      const n = this.npcs[i]!;
      this.npcs[i] = updateNpc(
        n,
        this.game.rng,
        (x, y) =>
          isWalkable(map, x, y) &&
          !this.npcAt(x, y, n) &&
          !(this._hero.x === x && this._hero.y === y) &&
          !this.reserved(x, y),
      );
    }
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
