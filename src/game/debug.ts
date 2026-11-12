import type { State } from '../engine/state';
import type { Input } from '../engine/input';
import { MenuList } from '../ui/menuList';
import { drawWindow, drawMenu } from '../ui/window';
import type { Game } from './game';
import type { GameMap } from './map';
import { applyLevel } from './player';
import { ExploreState } from './explore';

const VISIBLE_ROWS = 10;

function defaultEntry(map: GameMap): string {
  return 'start' in map.entry ? 'start' : Object.keys(map.entry)[0]!;
}

/** Dev-only overlay: level, gold, encounters, heal, warp, fight. Never imported by production code. */
export class DebugState implements State {
  private readonly list: MenuList;
  private readonly mapIds: string[];
  private readonly monsterIds: string[];

  constructor(private readonly game: Game) {
    this.mapIds = Object.keys(game.maps);
    this.monsterIds = Object.keys(game.monsters);
    this.list = new MenuList(this.labels());
  }

  private labels(): string[] {
    return [
      'Level +1',
      'Level -1',
      'Gold +100',
      'Gold +1000',
      this.game.debug.noEncounters ? 'Encounters: OFF' : 'Encounters: ON',
      'Full heal',
      ...this.mapIds.map((id) => `Warp: ${id}`),
      ...this.monsterIds.map((id) => `Fight: ${id}`),
      'Close',
    ];
  }

  private activate(index: number): void {
    const { game } = this;
    const warpStart = 6;
    const fightStart = warpStart + this.mapIds.length;
    if (index === 0) game.player = applyLevel(game.player, game.player.level + 1);
    else if (index === 1) game.player = applyLevel(game.player, game.player.level - 1);
    else if (index === 2) game.player = { ...game.player, gold: game.player.gold + 100 };
    else if (index === 3) game.player = { ...game.player, gold: game.player.gold + 1000 };
    else if (index === 4) game.debug.noEncounters = !game.debug.noEncounters;
    else if (index === 5) game.player = { ...game.player, hp: game.player.maxHp, mp: game.player.maxMp };
    else if (index < warpStart + this.mapIds.length) {
      const id = this.mapIds[index - warpStart]!;
      game.stack.reset(new ExploreState(game, id, defaultEntry(game.maps[id]!)));
    } else if (index < fightStart + this.monsterIds.length) {
      game.stack.pop();
      const top = game.stack.top;
      if (top instanceof ExploreState) top.startBattle(this.monsterIds[index - fightStart]!, 'grass');
    } else {
      game.stack.pop();
    }
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
      audio.playSfx('menuConfirm');
      this.activate(this.list.cursor);
    } else if (input.pressed('cancel')) {
      audio.playSfx('menuCancel');
      stack.pop();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const items = this.labels();
    const top = this.list.cursor < VISIBLE_ROWS ? 0 : this.list.cursor - (VISIBLE_ROWS - 1);
    drawWindow(ctx, 8, 8, 176, 120);
    drawMenu(ctx, this.game.font, items.slice(top, top + VISIBLE_ROWS), this.list.cursor - top, 14, 16);
  }
}

export function installDebug(game: Game): void {
  game.debugOpen = () => game.stack.push(new DebugState(game));
}
