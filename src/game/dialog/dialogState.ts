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
  private readonly quiet: boolean;

  constructor(
    private readonly game: Game,
    script: DialogScript,
    opts: { onDone?: () => void; onChoice?: (answer: boolean) => void; quiet?: boolean } = {},
  ) {
    this.onDone = opts.onDone;
    this.onChoice = opts.onChoice;
    this.quiet = opts.quiet ?? false;
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
    return this.model.isChoice ? 0 : this.model.lines.reduce((n, l) => n + l.length, 0);
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
      if (model.isChoice) {
        audio.playSfx('menuConfirm');
        this.onChoice?.(model.choiceCursor === 0);
      }
      model.confirm();
    }
    if (model.isChoice) {
      if (input.pressed('up') || input.pressed('down') || input.pressed('left') || input.pressed('right')) {
        model.moveChoice(1);
        audio.playSfx('menuMove');
      }
    } else {
      if (model.tick() && !this.quiet && (this.shownChars() - 1) % 2 === 0) audio.playSfx('blip');
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
      const [a, b] = model.lines;
      font.drawText(ctx, a ?? '', 32, 194);
      font.drawText(ctx, b ?? '', 32, 204);
      font.drawText(ctx, '▶', 24, model.choiceCursor === 0 ? 194 : 204);
      return;
    }
    model.lines.forEach((line, i) => font.drawText(ctx, line, 16, 184 + 10 * i));
    if (model.revealed && model.hasMore && Math.floor(frame / 16) % 2 === 0) {
      font.drawText(ctx, '▼', 232, 220);
    }
  }
}
