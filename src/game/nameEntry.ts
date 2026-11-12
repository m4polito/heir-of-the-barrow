import type { State } from '../engine/state';
import type { Input } from '../engine/input';
import { drawWindow } from '../ui/window';
import { createPlayer } from './player';
import { ExploreState } from './explore';
import { TransitionState } from './transition';
import type { Game } from './game';

import { NAME_GRID, NAME_MAX } from './nameGrid';

export { NAME_GRID, NAME_MAX };

const ACTION_ROW = NAME_GRID.length - 1;
const ACTIONS = ['back', 'end'] as const;

export type NameConfirm = 'char' | 'back' | 'end' | 'full';

/** Cursor and text of the name grid. The last row has two cells: BACK and END. */
export class NameEntryModel {
  name = '';
  cx = 0;
  cy = 0;
  private finished = false;

  constructor(private readonly defaultName: string) {}

  private rowWidth(y: number): number {
    return y === ACTION_ROW ? ACTIONS.length : NAME_GRID[y]!.length;
  }

  move(dx: number, dy: number): void {
    const rows = NAME_GRID.length;
    if (dy !== 0) {
      const from = this.cy;
      this.cy = (this.cy + dy + rows) % rows;
      // Map by drawn position: BACK is column 0, END is column 6 of the 13-column rows.
      if (this.cy === ACTION_ROW && from !== ACTION_ROW) this.cx = this.cx >= 4 ? 1 : 0;
      else if (from === ACTION_ROW && this.cy !== ACTION_ROW) this.cx = this.cx ? 6 : 0;
      else this.cx = Math.min(this.cx, this.rowWidth(this.cy) - 1);
    }
    if (dx !== 0) {
      const w = this.rowWidth(this.cy);
      this.cx = (this.cx + dx + w) % w;
    }
  }

  confirm(): NameConfirm {
    if (this.cy === ACTION_ROW) {
      if (ACTIONS[this.cx] === 'back') {
        this.cancel();
        return 'back';
      }
      this.finished = true;
      return 'end';
    }
    if (this.name.length >= NAME_MAX) return 'full';
    this.name += NAME_GRID[this.cy]![this.cx]!;
    return 'char';
  }

  cancel(): void {
    this.name = this.name.slice(0, -1);
  }

  get done(): boolean {
    return this.finished;
  }

  get finalName(): string {
    return this.name.trim().length > 0 ? this.name : this.defaultName;
  }
}

const CELL_W = 16;
const GRID_X = 32;
const GRID_Y = 72;
const ROW_H = 12;
const BACK_X = GRID_X;
const END_X = GRID_X + 6 * CELL_W;

export class NameEntryState implements State {
  private readonly model: NameEntryModel;
  private leaving = false;

  constructor(private readonly game: Game) {
    this.model = new NameEntryModel(game.story.defaultHeroName);
  }

  update(input: Input): void {
    if (this.leaving) return;
    const { audio } = this.game;
    if (input.repeat('left')) {
      this.model.move(-1, 0);
      audio.playSfx('menuMove');
    } else if (input.repeat('right')) {
      this.model.move(1, 0);
      audio.playSfx('menuMove');
    }
    if (input.repeat('up')) {
      this.model.move(0, -1);
      audio.playSfx('menuMove');
    } else if (input.repeat('down')) {
      this.model.move(0, 1);
      audio.playSfx('menuMove');
    }

    if (input.pressed('confirm')) {
      const result = this.model.confirm();
      audio.playSfx(result === 'full' ? 'error' : 'menuConfirm');
      if (this.model.done) this.finish();
    } else if (input.pressed('cancel')) {
      this.model.cancel();
      audio.playSfx('menuCancel');
    }
  }

  private finish(): void {
    this.leaving = true;
    const game = this.game;
    game.player = createPlayer(this.model.finalName, game.story.startingItems);
    game.stack.push(
      new TransitionState(game.stack, {
        onMid: () =>
          game.stack.reset(new ExploreState(game, game.story.newGame.map, game.story.newGame.entry)),
      }),
    );
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { font } = this.game;
    drawWindow(ctx, 16, 32, 224, 176);
    font.drawText(ctx, `NAME: ${this.model.name.padEnd(NAME_MAX, '_')}`, 32, 48);
    for (let y = 0; y < NAME_GRID.length; y++) {
      const py = GRID_Y + y * ROW_H;
      if (y === ACTION_ROW) {
        font.drawText(ctx, 'BACK', BACK_X, py);
        font.drawText(ctx, 'END', END_X, py);
      } else {
        const row = NAME_GRID[y]!;
        for (let x = 0; x < row.length; x++) font.drawText(ctx, row[x]!, GRID_X + x * CELL_W, py);
      }
    }
    const { cx, cy } = this.model;
    const cursorX = cy === ACTION_ROW ? (cx === 0 ? BACK_X : END_X) : GRID_X + cx * CELL_W;
    font.drawText(ctx, '▶', cursorX - 8, GRID_Y + cy * ROW_H);
  }
}
