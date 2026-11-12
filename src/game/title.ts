import { LOGICAL_W, LOGICAL_H } from '../engine/constants';
import type { State } from '../engine/state';
import type { Input } from '../engine/input';
import { NameEntryState } from './nameEntry';
import { ExploreState } from './explore';
import { TransitionState } from './transition';
import { fromSave, readSave, saveKey, type SaveData } from './save';
import { MenuList } from '../ui/menuList';
import { GLYPH_W } from '../engine/font';
import { wrapText } from '../ui/wrap';
import type { Game } from './game';

export interface TitleLine {
  text: string;
  x: number;
  y: number;
  scale: number;
}

/** Pure layout: title wrapped at scale 2, subtitle at scale 1 beneath, all centred. */
export function titleLayout(
  measure: (text: string, scale: number) => number,
  title: string,
  subtitle: string,
): TitleLine[] {
  const centre = (text: string, scale: number) => Math.floor((LOGICAL_W - measure(text, scale)) / 2);
  const cols = Math.floor(LOGICAL_W / (GLYPH_W * 2));
  const out: TitleLine[] = wrapText(title, cols).map((text, i) => ({
    text,
    x: centre(text, 2),
    y: 56 + 18 * i,
    scale: 2,
  }));
  const last = out[out.length - 1]!;
  out.push({ text: subtitle, x: centre(subtitle, 1), y: last.y + GLYPH_W * 2 + 8, scale: 1 });
  return out;
}

export class TitleState implements State {
  private save: SaveData | null = null;
  private list = new MenuList(['New Game']);
  private leaving = false;

  constructor(private readonly game: Game) {}

  get rows(): string[] {
    return [...this.list.items];
  }

  enter(): void {
    const { game } = this;
    this.save = readSave(game.storage, saveKey(game.story.storagePrefix), { items: game.items, maps: game.maps });
    this.list = new MenuList(this.save ? ['Continue', 'New Game'] : ['New Game']);
    game.audio.playSong(game.songs['title']!);
  }

  update(input: Input): void {
    if (this.leaving) return;
    const { audio } = this.game;
    if (this.list.items.length > 1) {
      if (input.repeat('up')) {
        this.list.up();
        audio.playSfx('menuMove');
      } else if (input.repeat('down')) {
        this.list.down();
        audio.playSfx('menuMove');
      }
    }
    if (!input.pressed('confirm')) return;
    audio.playSfx('menuConfirm');
    if (this.list.selected === 'Continue' && this.save) this.continueGame(this.save);
    else this.game.stack.push(new NameEntryState(this.game));
  }

  private continueGame(save: SaveData): void {
    const { game } = this;
    this.leaving = true;
    game.player = fromSave(save);
    const at = { x: save.x, y: save.y, facing: save.facing };
    game.stack.push(
      new TransitionState(game.stack, {
        onMid: () => game.stack.reset(new ExploreState(game, save.map, at)),
      }),
    );
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { font, story } = this.game;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    for (const l of titleLayout((t, sc) => font.measure(t, sc), story.title, story.subtitle)) {
      font.drawText(ctx, l.text, l.x, l.y, l.scale);
    }
    this.list.items.forEach((row, i) => font.drawText(ctx, row, 112, 150 + 12 * i));
    font.drawText(ctx, '▶', 104, 150 + 12 * this.list.cursor);
  }
}
