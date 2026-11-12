import type { State } from '../../engine/state';
import type { Input } from '../../engine/input';
import { MenuList } from '../../ui/menuList';
import { drawWindow, drawMenu } from '../../ui/window';
import type { Game } from '../game';
import { StatusState } from './statusState';
import { ItemsState } from './itemsState';
import { EquipState } from './equipState';

/** Top-level in-game menu: Status, Items, Equip. */
export class MenuState implements State {
  private readonly list = new MenuList(['Status', 'Items', 'Equip']);

  constructor(private readonly game: Game) {}

  update(input: Input): void {
    const { audio, stack } = this.game;
    if (input.repeat('up')) {
      this.list.up();
      audio.playSfx('menuMove');
    } else if (input.repeat('down')) {
      this.list.down();
      audio.playSfx('menuMove');
    }
    if (input.pressed('confirm')) {
      audio.playSfx('menuConfirm');
      if (this.list.cursor === 0) stack.push(new StatusState(this.game));
      else if (this.list.cursor === 1) stack.push(new ItemsState(this.game));
      else stack.push(new EquipState(this.game));
    } else if (input.pressed('cancel')) {
      audio.playSfx('menuCancel');
      stack.pop();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawWindow(ctx, 8, 8, 72, 40);
    drawMenu(ctx, this.game.font, this.list.items, this.list.cursor, 14, 16);
  }
}
