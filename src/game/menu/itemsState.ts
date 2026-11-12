import type { State } from '../../engine/state';
import type { Input } from '../../engine/input';
import { MenuList } from '../../ui/menuList';
import { drawWindow, drawMenu } from '../../ui/window';
import { equip, isEquipment, itemLines } from '../inventory';
import { DialogState } from '../dialog/dialogState';
import type { Game } from '../game';

export class ItemsState implements State {
  private list: MenuList;

  constructor(private readonly game: Game) {
    this.list = new MenuList(itemLines(game.items, game.player));
  }

  /** Rebuilds the list from the player, keeping the cursor in range. */
  private sync(): void {
    const items = itemLines(this.game.items, this.game.player);
    const cursor = Math.min(this.list.cursor, items.length - 1);
    this.list = new MenuList(items);
    this.list.cursor = Math.max(0, cursor);
  }

  update(input: Input): void {
    const { audio, stack, player } = this.game;
    this.sync();
    if (input.repeat('up')) {
      this.list.up();
      audio.playSfx('menuMove');
    } else if (input.repeat('down')) {
      this.list.down();
      audio.playSfx('menuMove');
    }
    if (input.pressed('confirm')) {
      const slot = player.inventory[this.list.cursor];
      if (!slot) return;
      if (isEquipment(this.game.items, slot.item)) {
        audio.playSfx('menuConfirm');
        let yes = false;
        stack.push(
          new DialogState(this.game, ['Equip it?', { choice: ['Yes', 'No'], yes: [], no: [] }], {
            onChoice: (answer) => {
              yes = answer;
            },
            onDone: () => {
              if (!yes) return;
              const r = equip(this.game.items, this.game.player, slot.item);
              if (r.ok) this.game.player = r.player;
              else this.game.audio.playSfx('error');
            },
          }),
        );
      } else {
        audio.playSfx('error');
        stack.push(new DialogState(this.game, ['You cannot use that now.']));
      }
    } else if (input.pressed('cancel')) {
      audio.playSfx('menuCancel');
      stack.pop();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.sync();
    drawWindow(ctx, 88, 8, 160, 100);
    drawMenu(ctx, this.game.font, this.list.items, this.list.cursor, 94, 16);
  }
}
