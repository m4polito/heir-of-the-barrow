import type { State } from '../../engine/state';
import type { Input } from '../../engine/input';
import { LOGICAL_W } from '../../engine/constants';
import { rowDurationSec } from '../../engine/audio/sequencer';
import { MenuList } from '../../ui/menuList';
import { drawWindow, drawMenu } from '../../ui/window';
import { monsterArt } from '../../data/sprites/monsters';
import { backdropArt } from '../../data/sprites/backdrops';
import type { Game } from '../game';
import { gainXp, settleBattle } from '../player';
import { spellLines } from '../menu/spellsState';
import { attackOf, defenseOf } from '../stats';
import { TransitionState } from '../transition';
import { Battle, type BattleCommand, type BattleOutcome } from './battle';
import { battleKit } from './kit';
import { levelUpBeats } from './levelBeats';
import { BeatPlayer, type Beat } from './beats';
import type { MonsterDef } from './monster';

const SHAKE_FRAMES = 4;
const FLASH_FRAMES = 8;
const BACKDROP_TILES = 16;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The backdrop strip fills y 96-119; these windows sit below it and above the message window (y 176). */
export const COMMAND_WINDOW: Rect = { x: 8, y: 120, w: 72, h: 52 };
export const SUB_WINDOW: Rect = { x: 84, y: 120, w: 164, h: 52 };
/** Menu rows start this far below a window's top, and this far in from its left. */
const MENU_DY = 8;
const MENU_DX = 8;

export type BattlePhase = 'beats' | 'command' | 'spell' | 'item' | 'ending';

/** A sub-list open beside the command menu: the rows shown and the id each one stands for. */
interface SubList {
  kind: 'spell' | 'item';
  menu: MenuList;
  ids: string[];
}

export function battleStatLines(name: string, hp: number, mp: number): string[] {
  return [name, 'HP ' + String(hp).padStart(3), 'MP ' + String(mp).padStart(3)];
}

/** One battle, shown over whatever is beneath it. Constructing one never touches the DOM. */
export class BattleState implements State {
  private readonly _battle: Battle;
  private readonly beats = new BeatPlayer();
  private readonly menu = new MenuList(['Fight', 'Spell', 'Item', 'Run']);
  private readonly onEnd: (outcome: BattleOutcome) => void;
  private readonly monster: MonsterDef;
  private readonly backdrop: string;
  private _phase: BattlePhase = 'beats';
  private sub: SubList | null = null;
  private shownHeroHp: number;
  private shownHeroMp: number;
  private shownMonsterHp: number;
  private shake = 0;
  private flash = 0;
  /** Frames to ignore confirm while a one-shot song (fanfare, fallen phrase) plays out. */
  private songHold = 0;

  constructor(
    private readonly game: Game,
    opts: { monster: MonsterDef; backdrop: string; onEnd: (outcome: BattleOutcome) => void },
  ) {
    const p = game.player;
    this.monster = opts.monster;
    this.backdrop = opts.backdrop;
    this.onEnd = opts.onEnd;
    this._battle = new Battle(
      game.rng,
      { hp: p.hp, maxHp: p.maxHp, mp: p.mp, atk: attackOf(game.items, p), def: defenseOf(game.items, p), agi: p.agi },
      opts.monster,
      battleKit(p, game.spells, game.items),
    );
    this.shownHeroHp = this._battle.heroHp;
    this.shownHeroMp = this._battle.heroMp;
    this.shownMonsterHp = this._battle.monsterHp;
    this.beats.load(this._battle.intro(), false);
  }

  get phase(): BattlePhase {
    return this._phase;
  }

  /** The hero's stat window lines as rendered. */
  get stats(): string[] {
    return battleStatLines(this.game.player.name, this.shownHeroHp, this.shownHeroMp);
  }

  /** The message window's text as currently revealed. */
  get text(): string[] {
    return this.beats.lines;
  }

  get battle(): Battle {
    return this._battle;
  }

  enter(): void {
    this.game.audio.playSong(this.game.songs['battle']!);
  }

  update(input: Input): void {
    if (this.shake > 0) this.shake--;
    if (this.flash > 0) this.flash--;
    if (this.songHold > 0) this.songHold--;
    if (this._phase === 'beats') this.updateBeats(input);
    else if (this._phase === 'command') this.updateCommand(input);
    else if (this._phase === 'spell' || this._phase === 'item') this.updateSub(input);
  }

  private updateBeats(input: Input): void {
    // A beat that starts a song waits for the one-shot song still playing.
    if (this.songHold > 0 && this.beats.revealed && this.beats.next?.song) return;
    const beat = this.beats.tick(this.songHold === 0 && input.pressed('confirm'));
    if (beat) this.playBeat(beat);
    if (!this.beats.done) return;
    if (this._battle.outcome === null) {
      input.rearm();
      this._phase = 'command';
    } else {
      this.beginEnding(this._battle.outcome);
    }
  }

  private playBeat(beat: Beat): void {
    const { audio, songs } = this.game;
    if (beat.sfx) audio.playSfx(beat.sfx);
    const song = beat.song ? songs[beat.song] : undefined;
    if (song) {
      audio.playSong(song);
      if (song.loop === false) {
        this.songHold = Math.ceil(song.tracks[0]!.rows.length * rowDurationSec(song.tempo) * 60);
      }
    }
    if (beat.fx === 'shake') this.shake = SHAKE_FRAMES;
    else if (beat.fx === 'flash') this.flash = FLASH_FRAMES;
    this.shownHeroHp = beat.heroHp;
    this.shownHeroMp = beat.heroMp;
    this.shownMonsterHp = beat.monsterHp;
  }

  private updateCommand(input: Input): void {
    const { audio } = this.game;
    if (input.repeat('up')) {
      this.menu.up();
      audio.playSfx('menuMove');
    } else if (input.repeat('down')) {
      this.menu.down();
      audio.playSfx('menuMove');
    }
    if (!input.pressed('confirm')) return;
    const row = this.menu.selected;
    if (row === 'Spell') this.openSub('spell');
    else if (row === 'Item') this.openSub('item');
    else this.perform(row === 'Fight' ? 'fight' : 'run');
  }

  private openSub(kind: 'spell' | 'item'): void {
    const { kit } = this._battle;
    const spell = kind === 'spell';
    const held = kit.items.filter((i) => this._battle.itemCount(i.id) > 0);
    const empty = spell ? kit.spells.length === 0 : held.length === 0;
    if (empty) {
      this.say(spell ? 'You know no spells.' : 'You carry nothing to use.');
      return;
    }
    this.game.audio.playSfx('menuConfirm');
    const ids = spell ? kit.spells.map((s) => s.id) : held.map((i) => i.id);
    const rows = spell ? spellLines(kit.spells) : held.map((i) => `${i.name} x${this._battle.itemCount(i.id)}`);
    this.sub = { kind, menu: new MenuList(rows), ids };
    this._phase = kind;
  }

  private updateSub(input: Input): void {
    const { audio } = this.game;
    const sub = this.sub!;
    if (input.repeat('up')) {
      sub.menu.up();
      audio.playSfx('menuMove');
    } else if (input.repeat('down')) {
      sub.menu.down();
      audio.playSfx('menuMove');
    }
    if (input.pressed('cancel')) {
      audio.playSfx('menuCancel');
      this.closeSub();
    } else if (input.pressed('confirm')) {
      const id = sub.ids[sub.menu.cursor]!;
      const cmd: BattleCommand = sub.kind === 'spell' ? { spell: id } : { item: id };
      const why = this._battle.refusal(cmd);
      this.closeSub();
      if (why) this.say(why);
      else this.perform(cmd);
    }
  }

  private closeSub(): void {
    this.sub = null;
    this._phase = 'command';
  }

  /** Show one message that changes nothing, then return to the command menu. */
  private say(text: string): void {
    this.beats.load(this._battle.note(text), false);
    this._phase = 'beats';
  }

  private perform(cmd: BattleCommand): void {
    const beats = this._battle.act(cmd);
    // Accepting a command always answers with a sound: the blip, unless the first beat brings its own.
    if (!beats[0]?.sfx) this.game.audio.playSfx('menuConfirm');
    if (this._battle.outcome === 'won') {
      const up = gainXp(this.game.player, this._battle.reward?.xp ?? 0).levelUp;
      if (up) {
        const name = (id: string) => this.game.spells[id]?.name ?? id;
        const shown = { heroHp: this._battle.heroHp, heroMp: this._battle.heroMp, monsterHp: 0 };
        beats.push(...levelUpBeats(up, name, shown));
      }
    }
    this.beats.load(beats, this._battle.outcome !== null);
    this._phase = 'beats';
  }

  private beginEnding(outcome: BattleOutcome): void {
    this._phase = 'ending';
    const { stack } = this.game;
    stack.push(
      new TransitionState(stack, {
        frames: outcome === 'lost' ? 30 : 12,
        onMid: () => {
          stack.remove(this);
          this.game.player = settleBattle(
            this.game.player,
            { hp: this._battle.heroHp, mp: this._battle.heroMp, itemsUsed: this._battle.itemsUsed },
            this._battle.reward,
          );
          this.onEnd(outcome);
        },
      }),
    );
  }

  render(ctx: CanvasRenderingContext2D, frame: number): void {
    const { font, sprites } = this.game;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 256, 240);
    const dx = this.shake > 0 ? (frame % 2 === 0 ? -2 : 2) : 0;
    ctx.save();
    ctx.translate(dx, 0);

    const bg = backdropArt(this.backdrop);
    const bgImg = sprites.get(bg);
    for (let i = 0; i < BACKDROP_TILES; i++) ctx.drawImage(bgImg, i * bg.w, 96);

    const flashHidden = this.flash > 0 && Math.floor(frame / 2) % 2 === 0;
    if ((this.shownMonsterHp > 0 || this.flash > 0) && !flashHidden) {
      const art = monsterArt(this.monster.sprite, this.monster.palette);
      ctx.drawImage(sprites.get(art), Math.floor((LOGICAL_W - art.w) / 2), 104 - art.h);
    }

    drawWindow(ctx, 8, 8, 80, 48);
    this.stats.forEach((line, i) =>
      font.drawText(ctx, line, 16, 16 + 10 * i),
    );

    if (this._phase === 'command' || this.sub) {
      const c = COMMAND_WINDOW;
      drawWindow(ctx, c.x, c.y, c.w, c.h);
      drawMenu(ctx, font, this.menu.items, this._phase === 'command' ? this.menu.cursor : -1, c.x + MENU_DX, c.y + MENU_DY);
    }
    if (this.sub) {
      const w = SUB_WINDOW;
      drawWindow(ctx, w.x, w.y, w.w, w.h);
      drawMenu(ctx, font, this.sub.menu.items, this.sub.menu.cursor, w.x + MENU_DX, w.y + MENU_DY);
    }

    drawWindow(ctx, 8, 176, 240, 56);
    this.beats.lines.forEach((line, i) => font.drawText(ctx, line, 16, 184 + 10 * i));
    if (this.beats.waiting && this.songHold === 0 && Math.floor(frame / 16) % 2 === 0) font.drawText(ctx, '▼', 232, 220);
    ctx.restore();
  }
}
