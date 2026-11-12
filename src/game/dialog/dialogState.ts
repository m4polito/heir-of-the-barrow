import type { State } from '../../engine/state';
import type { Input } from '../../engine/input';
import { drawWindow } from '../../ui/window';
import { addItem } from '../inventory';
import { hasFlag, setFlag } from '../player';
import type { Game } from '../game';
import { DialogModel } from './model';
import { ScriptRunner, type DialogScript, type ScriptEnv } from './script';

/** Modal dialog box over the state beneath it. Constructing one never touches the DOM. */
export class DialogState implements State {
  private readonly model: DialogModel;
  private readonly onDone?: () => void;
  private readonly onChoice?: (answer: boolean) => void;
  private completed = false;
  private muted = false;

  constructor(
    private readonly game: Game,
    script: DialogScript,
    opts: { onDone?: () => void; onChoice?: (answer: boolean) => void } = {},
  ) {
    this.onDone = opts.onDone;
    this.onChoice = opts.onChoice;
    const env: ScriptEnv = {
      name: game.player.name,
      has: (flag) => hasFlag(game.player, flag),
      set: (flag) => {
        game.player = setFlag(game.player, flag);
      },
      give: (item) => {
        const r = addItem(game.items, game.player, item);
        if (r.ok) game.player = r.player;
        return r.ok;
      },
      gold: (n) => {
        game.player = { ...game.player, gold: game.player.gold + n };
      },
      heal: () => {
        game.player = { ...game.player, hp: game.player.maxHp, mp: game.player.maxMp };
      },
      sfx: (id) => {
        if (!this.muted) game.audio.playSfx(id);
      },
    };
    this.model = new DialogModel(new ScriptRunner(script, env));
  }

  private shownChars(): number {
    const shown = this.model.isChoice ? this.model.ask : this.model.lines;
    return shown.reduce((n, l) => n + l.length, 0);
  }

  update(input: Input): void {
    if (this.completed) return;
    const { audio } = this.game;
    const model = this.model;
    if (input.pressed('cancel')) {
      // cancel wins over confirm: the rest of the script runs silently, choices resolve as No
      audio.playSfx('menuCancel');
      this.muted = true;
      model.skipAll(this.onChoice ? () => this.onChoice?.(false) : undefined);
    } else if (input.pressed('confirm')) {
      if (model.isChoice && model.revealed) {
        audio.playSfx('menuConfirm');
        this.onChoice?.(model.choiceCursor === 0);
      }
      model.confirm();
    }
    if (model.isChoice && model.revealed) {
      if (input.pressed('up') || input.pressed('down') || input.pressed('left') || input.pressed('right')) {
        model.moveChoice(1);
        audio.playSfx('menuMove');
      }
    } else {
      if (model.tick() && (this.shownChars() - 1) % 2 === 0) audio.playSfx('blip');
    }
    if (model.done) {
      this.completed = true;
      this.game.stack.remove(this);
      this.onDone?.();
    }
  }

  render(ctx: CanvasRenderingContext2D, frame: number): void {
    const { font } = this.game;
    const model = this.model;
    drawWindow(ctx, 8, 176, 240, 56);
    if (model.isChoice) {
      const ask = model.ask;
      ask.forEach((line, i) => font.drawText(ctx, line, 16, 184 + 10 * i));
      if (!model.revealed) return;
      const [a, b] = model.lines;
      const y = 184 + 10 * Math.max(1, ask.length);
      font.drawText(ctx, a ?? '', 32, y);
      font.drawText(ctx, b ?? '', 96, y);
      font.drawText(ctx, '▶', model.choiceCursor === 0 ? 24 : 88, y);
      return;
    }
    model.lines.forEach((line, i) => font.drawText(ctx, line, 16, 184 + 10 * i));
    if (model.revealed && model.hasMore && Math.floor(frame / 16) % 2 === 0) {
      font.drawText(ctx, '▼', 232, 220);
    }
  }
}
