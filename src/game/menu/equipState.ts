import type { State } from '../../engine/state';
import type { Input } from '../../engine/input';
import { MenuList } from '../../ui/menuList';
import { drawWindow, drawMenu } from '../../ui/window';
import { equip, equipLines, itemName, unequip } from '../inventory';
import type { EquipSlot } from '../player';
import type { Game } from '../game';

const SLOTS: EquipSlot[] = ['weapon', 'armor', 'shield'];

export class EquipState implements State {
  private list = new MenuList([]);
  private candidates: string[] = [];

  constructor(private readonly game: Game) {
    this.sync();
  }

  /** Rebuilds slot rows then candidate rows from the player, keeping the cursor in range. */
  private sync(): void {
    const { slots, candidates } = equipLines(this.game.items, this.game.player);
    this.candidates = candidates;
    const items = [...slots, ...candidates.map((id) => itemName(this.game.items, id))];
    const cursor = this.list.cursor;
    this.list = new MenuList(items);
    this.list.cursor = Math.min(cursor, items.length - 1);
  }

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
      const row = this.list.cursor;
      const r =
        row < SLOTS.length
          ? unequip(this.game.items, this.game.player, SLOTS[row]!)
          : equip(this.game.items, this.game.player, this.candidates[row - SLOTS.length]!);
      if (r.ok) {
        this.game.player = r.player;
        audio.playSfx('menuConfirm');
      } else {
        audio.playSfx('error');
      }
      this.sync();
    } else if (input.pressed('cancel')) {
      audio.playSfx('menuCancel');
      stack.pop();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.sync();
    drawWindow(ctx, 88, 8, 160, 100);
    const lineH = this.list.items.length > 9 ? 8 : 10;
    drawMenu(ctx, this.game.font, this.list.items, this.list.cursor, 94, 16, lineH);
  }
}
