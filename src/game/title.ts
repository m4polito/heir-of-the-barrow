import { LOGICAL_W, LOGICAL_H } from '../engine/constants';
import type { State } from '../engine/state';
import type { Input } from '../engine/input';
import { NameEntryState } from './nameEntry';
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
  constructor(private readonly game: Game) {}

  enter(): void {
    this.game.audio.playSong(this.game.songs['title']!);
  }

  update(input: Input): void {
    if (input.pressed('confirm')) {
      this.game.audio.playSfx('menuConfirm');
      this.game.stack.push(new NameEntryState(this.game));
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { font, story } = this.game;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    for (const l of titleLayout((t, sc) => font.measure(t, sc), story.title, story.subtitle)) {
      font.drawText(ctx, l.text, l.x, l.y, l.scale);
    }
    font.drawText(ctx, '▶', 104, 150);
    font.drawText(ctx, 'New Game', 112, 150);
  }
}
