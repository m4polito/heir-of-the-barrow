import type { State } from '../engine/state';
import type { Input } from '../engine/input';
import { MenuList } from '../ui/menuList';
import { drawWindow, drawMenu } from '../ui/window';
import { equip, isEquipment, itemName } from './inventory';
import { DialogState } from './dialog/dialogState';
import type { DialogScript } from './dialog/script';
import { buy, buyAndWear, buyCheck, sell, sellPrice, sellRows, stockRows, type ShopDef } from './shop';
import type { Game } from './game';

type Phase = 'menu' | 'buy' | 'sell';

const REFUSALS = {
  gold: 'You do not have enough gold.',
  owned: 'You already carry one.',
  full: 'You cannot carry more.',
} as const;

export class ShopState implements State {
  private armed = false;
  private _phase: Phase = 'menu';
  private menu = new MenuList(['Buy', 'Sell', 'Leave']);
  private list = new MenuList([]);

  constructor(
    private readonly game: Game,
    private readonly def: ShopDef,
  ) {}

  get phase(): Phase {
    return this._phase;
  }

  get rows(): readonly string[] {
    return this._phase === 'menu' ? [] : this.list.items;
  }

  private open(phase: 'buy' | 'sell'): void {
    const { items, player } = this.game;
    this._phase = phase;
    this.list = new MenuList(phase === 'buy' ? stockRows(items, this.def.stock) : sellRows(items, player));
  }

  /** Rebuilds the sell list after a sale, keeping the cursor on a real row. */
  private refreshSell(): void {
    const cursor = this.list.cursor;
    if (this.game.player.inventory.length === 0) {
      this._phase = 'menu';
      return;
    }
    this.open('sell');
    this.list.cursor = Math.min(cursor, this.list.items.length - 1);
  }

  private say(text: string, error = false): void {
    if (error) this.game.audio.playSfx('error');
    this.game.stack.push(new DialogState(this.game, [text]));
  }

  /** Pushes a question, preceded by an optional line; `then` runs from the dialog's onDone with the answer. */
  private ask(question: string, then: (yes: boolean) => void, line?: string): void {
    let yes = false;
    const script: DialogScript = [...(line ? [line] : []), { choice: ['Yes', 'No'], ask: question, yes: [], no: [] }];
    this.game.stack.push(
      new DialogState(this.game, script, {
        onChoice: (answer) => {
          yes = answer;
        },
        onDone: () => then(yes),
      }),
    );
  }

  private confirmBuy(): void {
    const { game } = this;
    const id = this.def.stock[this.list.cursor];
    if (id === undefined) return;
    const check = buyCheck(game.items, game.player, id);
    if (!check.ok) {
      this.say(REFUSALS[check.why], true);
      return;
    }
    const name = itemName(game.items, id);
    const price = game.items[id]!.price;
    const question = `The ${name}? That will be ${price} gold.`;
    if (check.wearOnly) {
      const line = check.tradeIn
        ? `Your pack is full. You must wear it now, and I will take your ${itemName(game.items, check.tradeIn.id)} for ${check.tradeIn.gold} gold.`
        : 'Your pack is full. You must wear it now.';
      this.ask(
        question,
        (yes) => {
          if (!yes) return;
          game.player = buyAndWear(game.items, game.player, id);
          game.audio.playSfx('buy');
        },
        line,
      );
      return;
    }
    this.ask(question, (yes) => {
      if (!yes) return;
      game.player = buy(game.items, game.player, id);
      game.audio.playSfx('buy');
      if (isEquipment(game.items, id)) {
        this.ask('Will you equip it now?', (wear) => {
          if (!wear) return;
          const r = equip(game.items, game.player, id);
          if (r.ok) game.player = r.player;
          else game.audio.playSfx('error');
        });
      }
    });
  }

  private confirmSell(): void {
    const { game } = this;
    const slot = this.list.cursor;
    const held = game.player.inventory[slot];
    if (!held) return;
    const gold = sellPrice(game.items[held.item]);
    if (gold <= 0) {
      this.say('I cannot buy that.', true);
      return;
    }
    this.ask(`The ${itemName(game.items, held.item)}? I can give you ${gold} gold.`, (yes) => {
      if (!yes) return;
      const r = sell(game.items, game.player, slot);
      if (!r) return;
      game.player = r.player;
      game.audio.playSfx('buy');
      this.refreshSell();
    });
  }

  update(input: Input): void {
    const { audio, stack, player } = this.game;
    if (!this.armed) {
      this.armed = true;
      input.rearm();
    }
    const list = this._phase === 'menu' ? this.menu : this.list;
    if (input.repeat('up')) {
      list.up();
      audio.playSfx('menuMove');
    } else if (input.repeat('down')) {
      list.down();
      audio.playSfx('menuMove');
    }
    if (input.pressed('cancel')) {
      audio.playSfx('menuCancel');
      if (this._phase === 'menu') stack.remove(this);
      else this._phase = 'menu';
      return;
    }
    if (!input.pressed('confirm')) return;
    if (this._phase === 'buy') this.confirmBuy();
    else if (this._phase === 'sell') this.confirmSell();
    else if (this.menu.cursor === 0) {
      audio.playSfx('menuConfirm');
      this.open('buy');
    } else if (this.menu.cursor === 1) {
      if (player.inventory.length === 0) this.say('You have nothing to sell.', true);
      else {
        audio.playSfx('menuConfirm');
        this.open('sell');
      }
    } else {
      audio.playSfx('menuCancel');
      stack.remove(this);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { font, player } = this.game;
    drawWindow(ctx, 8, 8, 72, 40);
    drawMenu(ctx, font, this.menu.items, this._phase === 'menu' ? this.menu.cursor : -1, 14, 16);
    drawWindow(ctx, 8, 52, 72, 24);
    font.drawText(ctx, `${player.gold} G`, 16, 60);
    if (this._phase === 'menu') return;
    drawWindow(ctx, 84, 8, 164, 100);
    drawMenu(ctx, font, this.list.items, this.list.cursor, 90, 16);
  }
}
