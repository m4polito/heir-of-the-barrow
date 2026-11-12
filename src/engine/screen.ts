import { LOGICAL_W, LOGICAL_H } from './constants';

export function computeScale(availW: number, availH: number): number {
  return Math.max(1, Math.floor(Math.min(availW / LOGICAL_W, availH / LOGICAL_H)));
}

export function computeLayout(
  availW: number,
  availH: number,
  dpr: number,
): { scale: number; cssW: number; cssH: number } {
  const scale = computeScale(availW * dpr, availH * dpr);
  return { scale, cssW: (LOGICAL_W * scale) / dpr, cssH: (LOGICAL_H * scale) / dpr };
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

export class Screen {
  readonly ctx: CanvasRenderingContext2D;
  private readonly offscreen: HTMLCanvasElement;
  private readonly visible: HTMLCanvasElement;
  private visibleCtx: CanvasRenderingContext2D;

  constructor(private readonly container: HTMLElement) {
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = LOGICAL_W;
    this.offscreen.height = LOGICAL_H;
    this.ctx = context2d(this.offscreen);

    this.visible = document.createElement('canvas');
    this.visible.style.imageRendering = 'pixelated';
    container.appendChild(this.visible);
    this.visibleCtx = context2d(this.visible);

    this.resize();
  }

  resize(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const { scale, cssW, cssH } = computeLayout(w, h, dpr);
    this.visible.width = LOGICAL_W * scale;
    this.visible.height = LOGICAL_H * scale;
    this.visible.style.width = `${cssW}px`;
    this.visible.style.height = `${cssH}px`;
    // Resizing a canvas resets its context state.
    this.visibleCtx.imageSmoothingEnabled = false;
  }

  present(): void {
    this.visibleCtx.drawImage(this.offscreen, 0, 0, this.visible.width, this.visible.height);
  }
}
