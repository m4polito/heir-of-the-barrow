import type { State } from '../../engine/state';
import type { Input } from '../../engine/input';
import { LOGICAL_W } from '../../engine/constants';
import { rowDurationSec } from '../../engine/audio/sequencer';
import { MenuList } from '../../ui/menuList';
import { drawWindow, drawMenu } from '../../ui/window';
import { monsterArt } from '../../data/sprites/monsters';
import { backdropArt } from '../../data/sprites/backdrops';
import type { Game } from '../game';
import { settleBattle } from '../player';
import { attackOf, defenseOf } from '../stats';
import { TransitionState } from '../transition';
import { Battle, type BattleOutcome } from './battle';
import { BeatPlayer, type Beat } from './beats';
import type { MonsterDef } from './monster';

const SHAKE_FRAMES = 4;
const FLASH_FRAMES = 8;
const BACKDROP_TILES = 16;

export function battleStatLines(name: string, hp: number, mp: number): string[] {
  return [name, 'HP ' + String(hp).padStart(3), 'MP ' + String(mp).padStart(3)];
}

/** One battle, shown over whatever is beneath it. Constructing one never touches the DOM. */
export class BattleState implements State {
  private readonly _battle: Battle;
  private readonly beats = new BeatPlayer();
  private readonly menu = new MenuList(['Fight', 'Run']);
  private readonly onEnd: (outcome: BattleOutcome) => void;
  private readonly monster: MonsterDef;
  private readonly backdrop: string;
  private _phase: 'beats' | 'command' | 'ending' = 'beats';
  private shownHeroHp: number;
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
      { hp: p.hp, atk: attackOf(game.items, p), def: defenseOf(game.items, p), agi: p.agi },
      opts.monster,
    );
    this.shownHeroHp = this._battle.heroHp;
    this.shownMonsterHp = this._battle.monsterHp;
    this.beats.load(this._battle.intro(), false);
  }

  get phase(): 'beats' | 'command' | 'ending' {
    return this._phase;
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
  }

  private updateBeats(input: Input): void {
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
    if (input.pressed('confirm')) {
      // Run's first beat carries its own sound; a blip here would be cut off by it.
      if (this.menu.cursor === 0) audio.playSfx('menuConfirm');
      const beats = this._battle.act(this.menu.cursor === 0 ? 'fight' : 'run');
      this.beats.load(beats, this._battle.outcome !== null);
      this._phase = 'beats';
    }
  }

  private beginEnding(outcome: BattleOutcome): void {
    this._phase = 'ending';
    const { stack } = this.game;
    stack.push(
      new TransitionState(stack, {
        frames: outcome === 'lost' ? 30 : 12,
        onMid: () => {
          stack.remove(this);
          this.game.player = settleBattle(this.game.player, this._battle.heroHp, this._battle.reward);
          this.onEnd(outcome);
        },
      }),
    );
  }

  render(ctx: CanvasRenderingContext2D, frame: number): void {
    const { font, sprites, player } = this.game;
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
    battleStatLines(player.name, this.shownHeroHp, player.mp).forEach((line, i) =>
      font.drawText(ctx, line, 16, 16 + 10 * i),
    );

    if (this._phase === 'command') {
      drawWindow(ctx, 8, 132, 72, 36);
      drawMenu(ctx, font, this.menu.items, this.menu.cursor, 16, 140);
    }

    drawWindow(ctx, 8, 176, 240, 56);
    this.beats.lines.forEach((line, i) => font.drawText(ctx, line, 16, 184 + 10 * i));
    if (this.beats.waiting && this.songHold === 0 && Math.floor(frame / 16) % 2 === 0) font.drawText(ctx, '▼', 232, 220);
    ctx.restore();
  }
}
