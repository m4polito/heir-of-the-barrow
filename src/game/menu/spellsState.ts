import type { State } from '../../engine/state';
import type { Input } from '../../engine/input';
import { MenuList } from '../../ui/menuList';
import { drawWindow, drawMenu } from '../../ui/window';
import { castInField } from '../fieldUse';
import { spellsKnown } from '../player';
import type { Game } from '../game';
import { showFieldResult } from './fieldResult';
import type { SpellDef } from '../effects';

/** One row per spell: the name padded to ten, then its MP cost in two columns. */
export function spellLines(spells: readonly SpellDef[]): string[] {
  if (spells.length === 0) return ['Nothing'];
  return spells.map((s) => s.name.padEnd(10) + String(s.mp).padStart(2));
}

export class SpellsState implements State {
  private readonly ids: string[];
  private readonly list: MenuList;

  constructor(private readonly game: Game) {
    this.ids = spellsKnown(game.player.level);
    this.list = new MenuList(spellLines(this.ids.map((id) => game.spells[id]!)));
  }

  update(input: Input): void {
    const { audio, stack, player } = this.game;
    if (input.repeat('up')) {
      this.list.up();
      audio.playSfx('menuMove');
    } else if (input.repeat('down')) {
      this.list.down();
      audio.playSfx('menuMove');
    }
    if (input.pressed('confirm')) {
      const id = this.ids[this.list.cursor];
      if (!id) {
        audio.playSfx('error');
        return;
      }
      showFieldResult(this.game, castInField(this.game.rng, this.game.spells, player, id));
    } else if (input.pressed('cancel')) {
      audio.playSfx('menuCancel');
      stack.pop();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { font, player } = this.game;
    drawWindow(ctx, 88, 8, 160, 100);
    font.drawText(ctx, `MP ${player.mp}/${player.maxMp}`, 94, 16);
    drawMenu(ctx, font, this.list.items, this.list.cursor, 94, 28);
  }
}
