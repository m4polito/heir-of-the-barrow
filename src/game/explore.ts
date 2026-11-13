import { LOGICAL_W, LOGICAL_H, TILE, DIR_VECTORS, type Dir } from '../engine/constants';
import type { State } from '../engine/state';
import type { Input } from '../engine/input';
import { TILE_IDS, TILES, ANIM_FRAME_LEN } from '../data/tiles';
import { HERO_SPRITES } from '../data/sprites/hero';
import { npcArt } from '../data/sprites/npcs';
import { isWalkable, tileAt, warpAt, chestAt, lookAt, bossAt, chestFlag, type GameMap, type ChestTrigger, type BossTrigger } from './map';
import type { SfxId } from '../data/sfx';
import { createHero, updateHero, heroPixelOffset, facingTile, opposite, heroIdle, type HeroState } from './hero';
import { createNpc, updateNpc, npcPixelOffset, type NpcState } from './npc';
import { cameraOrigin } from './camera';
import { TransitionState } from './transition';
import { DialogState, type DialogServices } from './dialog/dialogState';
import { ShopState } from './shopState';
import { SleepState } from './sleepState';
import { MenuState } from './menu/menuState';
import { toSave, saveKey, writeSave } from './save';
import { setFlag, hasFlag, applyDeath, GOLD_MAX } from './player';
import { addItem } from './inventory';
import { encounterStep, ENCOUNTER_GRACE } from './encounter';
import { lightRadius, darkRects, TORCH_RADIUS } from './light';
import { backdropArt } from '../data/sprites/backdrops';
import { BattleState } from './battle/battleState';
import type { BattleOutcome } from './battle/battle';
import type { Game } from './game';

/** Frames between bumps while a direction is held against something. */
export const BUMP_REPEAT = 16;

type Entry = string | { x: number; y: number; facing: Dir };

function lookup(game: Game, mapId: string, entry: Entry): { map: GameMap; hero: HeroState } {
  const map = game.maps[mapId];
  if (!map) throw new Error(`Unknown map: ${mapId}`);
  let e: { x: number; y: number; facing: Dir } | undefined;
  if (typeof entry === 'string') {
    e = map.entry[entry];
    if (!e) throw new Error(`Unknown entry '${entry}' on map ${mapId}`);
  } else {
    e = entry;
    const inMap = e.x >= 0 && e.y >= 0 && e.x < map.width && e.y < map.height;
    if (!inMap || !isWalkable(map, e.x, e.y)) throw new Error(`Bad position on map ${mapId}`);
  }
  if (!game.songs[map.music]) throw new Error(`Unknown song '${map.music}' for map ${mapId}`);
  return { map, hero: createHero(e.x, e.y, e.facing) };
}

export class ExploreState implements State {
  private _map: GameMap;
  private _hero: HeroState;
  /** Set whenever a map is entered; consumed by the first update() as the top state. */
  private enteredMap: boolean;
  /** Dialog shown once, from the first update as the top state with no auto trigger firing. */
  private pendingDialog: string | undefined;
  /** Steps left before an encounter can start. */
  private grace = ENCOUNTER_GRACE;
  /** Frames until the next bump may sound; 0 means the next refused step sounds at once. */
  private bumpWait = 0;
  /** Set when a warp places the hero: the first step off the arrival tile may not land on a warp tile. Clears at the first completed step or when no key is held. */
  private arrivalLock = false;
  /** Set when this update's refused step was the silent arrival-lock refusal, which is not a bump. */
  private lockRefused = false;
  readonly npcs: NpcState[];

  constructor(
    private readonly game: Game,
    mapId: string,
    entry: Entry,
    opts: { dialog?: string } = {},
  ) {
    if (opts.dialog !== undefined && !game.dialogs[opts.dialog]) {
      throw new Error(`Unknown dialog: ${opts.dialog}`);
    }
    this.pendingDialog = opts.dialog;
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

  /** Tiles of light around the hero, or null on a map that is not dark. */
  get lightRadius(): number | null {
    return lightRadius(this._map.dark === true, this.game.player.torch, TORCH_RADIUS);
  }

  enter(): void {
    this.game.fieldCtx = () => ({ dark: this._map.dark === true });
    this.playMapSong();
  }

  private playMapSong(): void {
    this.game.audio.playSong(this.game.songs[this._map.music]!);
  }

  warpTo(mapId: string, entry: string, sfx: SfxId = 'door'): void {
    const target = lookup(this.game, mapId, entry);
    this.game.audio.playSfx(sfx);
    this.game.stack.push(
      new TransitionState(this.game.stack, {
        onMid: () => {
          this._map = target.map;
          this._hero = target.hero;
          this.npcs.splice(0, this.npcs.length, ...target.map.npcs.map(createNpc));
          this.playMapSong();
          this.grace = ENCOUNTER_GRACE;
          this.enteredMap = true;
          this.arrivalLock = true;
        },
      }),
    );
  }

  /** Fade out, fight `monsterId` on `backdrop`, and handle the outcome; `onWon` runs after a victory. */
  startBattle(monsterId: string, backdrop: string, onWon?: () => void): void {
    const { game } = this;
    const monster = game.monsters[monsterId];
    if (!monster) throw new Error(`Unknown monster: ${monsterId}`);
    backdropArt(backdrop); // throws now, not from render, if the backdrop is unknown
    const { stack } = game;
    game.audio.stopSong();
    game.audio.playSfx('encounter');
    stack.push(
      new TransitionState(stack, {
        frames: 30,
        inFrames: 10,
        onMid: () => stack.push(new BattleState(game, { monster, backdrop, onEnd: (o) => this.endBattle(o, onWon) })),
      }),
    );
  }

  private endBattle(outcome: BattleOutcome, onWon?: () => void): void {
    const { game } = this;
    if (outcome === 'lost') {
      game.player = applyDeath(game.player);
      const r = game.story.respawn;
      game.stack.reset(new ExploreState(game, r.map, r.entry, { dialog: r.dialog }));
      return;
    }
    this.grace = ENCOUNTER_GRACE;
    this.playMapSong();
    if (outcome === 'won') onWon?.();
  }

  /** A boss tile whose flag is unset starts its fight; a win sets the flag, then shows the dialog once the map is back on top. */
  private startBoss(b: BossTrigger): void {
    this.startBattle(b.monster, b.backdrop, () => {
      this.game.player = setFlag(this.game.player, b.flag);
      this.pendingDialog = b.dialog;
    });
  }

  private rollEncounter(x: number, y: number): boolean {
    const { game } = this;
    const table = this._map.encounters;
    const tile = tileAt(this._map, x, y);
    if (!table || !tile || game.debug.noEncounters) return false;
    const r = encounterStep(game.rng, table, tile, this.grace);
    this.grace = r.grace;
    if (!r.hit) return false;
    this.startBattle(r.hit.monster, r.hit.backdrop);
    return true;
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

  /** What a dialog opened on this screen may ask the screen to do. */
  private services(): Partial<DialogServices> {
    const { game } = this;
    return {
      shop: (id) => {
        const def = game.shops[id];
        if (!def) throw new Error(`Unknown shop: ${id}`);
        game.stack.push(new ShopState(game, def));
      },
      rest: (id) => {
        const song = game.songs[id];
        if (!song) throw new Error(`Unknown song: ${id}`);
        game.stack.push(new SleepState(game, { song, onWake: () => this.playMapSong() }));
      },
      save: () =>
        writeSave(
          game.storage,
          saveKey(game.story.storagePrefix),
          toSave(game.player, { map: this._map.id, x: this._hero.x, y: this._hero.y, facing: this._hero.facing }),
        ),
    };
  }

  private showLines(lines: string[]): void {
    this.game.stack.push(new DialogState(this.game, lines, { services: this.services() }));
  }

  /** Opens the chest, or says it is empty. The player is changed before the dialog opens. */
  private openChest(c: ChestTrigger): void {
    const { game } = this;
    if (hasFlag(game.player, chestFlag(c.id))) {
      this.showLines(['The chest is empty.']);
      return;
    }
    let found: string;
    let player = game.player;
    if (c.gold !== undefined) {
      player = { ...player, gold: Math.min(GOLD_MAX, player.gold + c.gold) };
      found = `You find ${c.gold} gold.`;
    } else {
      const id = c.item;
      const def = id === undefined ? undefined : game.items[id];
      if (id === undefined || !def) throw new Error(`Unknown item: ${id}`);
      const r = addItem(game.items, player, id);
      if (!r.ok) {
        game.audio.playSfx('error');
        this.showLines(['You cannot carry more.']);
        return;
      }
      player = r.player;
      found = `You find the ${def.name}.`;
    }
    game.player = setFlag(player, chestFlag(c.id));
    game.audio.playSfx('chest');
    this.showLines(['You open the chest.', found]);
  }

  private runAutoTrigger(): boolean {
    for (const t of this._map.triggers) {
      if (t.kind !== 'auto' || hasFlag(this.game.player, t.flag)) continue;
      const flag = t.flag;
      this.game.stack.push(
        new DialogState(this.game, this.script(t.dialog), {
          services: this.services(),
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
    if (this.pendingDialog !== undefined) {
      const id = this.pendingDialog;
      this.pendingDialog = undefined;
      this.game.stack.push(new DialogState(this.game, this.script(id), { services: this.services() }));
      return;
    }
    if (input.pressed('confirm') && heroIdle(this._hero)) {
      const npc = this.talkTarget();
      if (npc) {
        npc.stepFrame = 0; // snap to its tile so the turn cannot shift the sprite
        npc.facing = opposite(this._hero.facing);
        this.game.stack.push(new DialogState(this.game, this.script(npc.def.dialog), { services: this.services() }));
        return;
      }
      const near = facingTile(this._hero);
      const chest = chestAt(this._map, near.x, near.y);
      if (chest) {
        this.openChest(chest);
        return;
      }
      const look = lookAt(this._map, near.x, near.y);
      if (look) {
        this.game.stack.push(new DialogState(this.game, this.script(look.dialog), { services: this.services() }));
        return;
      }
    }
    if (input.pressed('cancel') && heroIdle(this._hero)) {
      this.game.audio.playSfx('menuConfirm');
      input.rearm();
      this.game.stack.push(new MenuState(this.game));
      return;
    }
    if (input.pressed('debug') && heroIdle(this._hero) && this.game.debugOpen) {
      input.rearm();
      this.game.debugOpen();
      return;
    }
    const held = (a: Dir) => input.held(a);
    const map = this._map;
    const before = this._hero;
    if (this.arrivalLock && !(['up', 'down', 'left', 'right'] as const).some(held)) this.arrivalLock = false;
    this.lockRefused = false;
    this._hero = updateHero(
      this._hero,
      held,
      (x, y) => {
        if (!isWalkable(map, x, y) || this.npcAt(x, y)) return false;
        if (this.arrivalLock && warpAt(map, x, y)) {
          this.lockRefused = true;
          return false;
        }
        return true;
      },
      (x, y) => this.onStep(x, y),
    );
    this.updateBump(input, before);
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

  /** A step has completed: burn the torch, then warp or roll for a battle. Returns true if something took over. */
  private onStep(x: number, y: number): boolean {
    const { game } = this;
    this.arrivalLock = false; // the hero has left the arrival tile
    const burned = this._map.dark === true && game.player.torch > 0;
    if (burned) game.player = { ...game.player, torch: game.player.torch - 1 };
    const w = warpAt(this._map, x, y);
    let took = false;
    if (w) {
      this.warpTo(w.to, w.entry, w.sfx);
      took = true;
    } else {
      const boss = bossAt(this._map, x, y);
      if (!boss) took = this.rollEncounter(x, y);
      else if (!hasFlag(game.player, boss.flag)) {
        this.startBoss(boss);
        took = true;
      }
    }
    if (burned && game.player.torch === 0 && !took && game.stack.top === this) {
      this.showLines(['Your torch gutters out.']);
      return true; // the hero stops here; nothing starts underneath the dialog

    }
    return took;
  }

  /** A thud when a held direction is refused: at once, then every BUMP_REPEAT frames. */
  private updateBump(input: Input, before: HeroState): void {
    const anyHeld = (['up', 'down', 'left', 'right'] as const).some((d) => input.held(d));
    const hero = this._hero;
    const stepping = hero.stepFrame > 0 || hero.x !== before.x || hero.y !== before.y;
    if (!anyHeld || stepping || this.lockRefused) {
      this.bumpWait = 0;
      return;
    }
    if (this.game.stack.top !== this) return; // a warp or battle took over this frame
    if (this.bumpWait > 0) this.bumpWait--;
    if (this.bumpWait === 0) {
      this.game.audio.playSfx('bump');
      this.bumpWait = BUMP_REPEAT;
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
        const t = tileAt(map, tx, ty) ?? (map.border === undefined ? undefined : TILES[map.border]);
        if (!t) continue;
        const shown =
          t.id === TILE_IDS.chest && hasFlag(this.game.player, chestFlag(chestAt(map, tx, ty)?.id ?? ''))
            ? TILES[TILE_IDS.chestOpen]!
            : t;
        const art = shown.frames[Math.floor(frame / ANIM_FRAME_LEN) % shown.frames.length]!;
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
    const radius = this.lightRadius;
    if (radius === null) {
      for (const it of items) it.draw();
    } else {
      // Tiles and villagers, then the dark over them, then the hero on top of it.
      for (const it of items) if (!it.hero) it.draw();
      ctx.fillStyle = '#000';
      for (const r of darkRects(hx - ox, hy - oy, radius)) ctx.fillRect(r.x, r.y, r.w, r.h);
      for (const it of items) if (it.hero) it.draw();
    }
    if (this.game.debug.noEncounters) this.game.font.drawText(ctx, 'ENC OFF', 192, 8);
  }
}
