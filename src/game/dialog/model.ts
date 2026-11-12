import { wrapText } from '../../ui/wrap';
import type { ScriptRunner } from './script';

type Page = { kind: 'text'; lines: string[] } | { kind: 'choice'; options: [string, string] };

/**
 * Typewriter and pagination model for one dialog. A text step is wrapped to
 * `cols` and split into pages of `rows` lines; a choice step is a single page.
 * `hasMore` (the blinking marker) also peeks at the runner, but only through
 * the side-effect-free `hasPending`, so script effects never run early.
 */
export class DialogModel {
  choiceCursor: 0 | 1 = 0;

  private pages: Page[] = [];
  private pageIndex = 0;
  private shown = 0; // characters of the current text page revealed so far
  private finished = false;

  constructor(
    private readonly runner: ScriptRunner,
    private readonly cols = 28,
    private readonly rows = 4,
  ) {
    this.load(this.runner.next());
  }

  private get page(): Page | undefined {
    return this.pages[this.pageIndex];
  }

  private get pageLength(): number {
    const p = this.page;
    return p && p.kind === 'text' ? p.lines.reduce((n, l) => n + l.length, 0) : 0;
  }

  /**
   * Revealed text of the current page: fully shown lines, then the partially
   * shown line. Lines not yet started are omitted. A choice page returns its
   * two option strings.
   */
  get lines(): string[] {
    const p = this.page;
    if (!p) return [];
    if (p.kind === 'choice') return [...p.options];
    const out: string[] = [];
    let left = this.shown;
    for (const line of p.lines) {
      if (left <= 0) break;
      out.push(line.slice(0, left));
      left -= line.length;
    }
    return out;
  }

  get revealed(): boolean {
    const p = this.page;
    return !p || p.kind === 'choice' || this.shown >= this.pageLength;
  }

  /** More pages within the current step; the only thing confirm() advances through. */
  private get hasMorePages(): boolean {
    return this.pageIndex < this.pages.length - 1;
  }

  /** True when confirming leads to another page or step (marker shown). */
  get hasMore(): boolean {
    if (this.hasMorePages) return true;
    return this.page?.kind === 'text' && this.runner.hasPending;
  }

  get isChoice(): boolean {
    return this.page?.kind === 'choice';
  }

  get done(): boolean {
    return this.finished;
  }

  /** Reveals one more character. Returns true if that character was not a space. */
  tick(): boolean {
    const p = this.page;
    if (this.finished || !p || p.kind !== 'text' || this.revealed) return false;
    let index = this.shown;
    this.shown++;
    for (const line of p.lines) {
      if (index < line.length) return line[index] !== ' ';
      index -= line.length;
    }
    return false;
  }

  confirm(): void {
    if (this.finished) return;
    if (!this.revealed) {
      this.shown = this.pageLength;
      return;
    }
    const p = this.page;
    if (p?.kind === 'choice') this.load(this.runner.next(this.choiceCursor === 0));
    else if (this.hasMorePages) {
      this.pageIndex++;
      this.shown = 0;
    } else this.load(this.runner.next());
  }

  moveChoice(_delta: -1 | 1): void {
    // two options: either direction wraps to the other one
    if (this.isChoice) this.choiceCursor = this.choiceCursor === 0 ? 1 : 0;
  }

  private load(step: ReturnType<ScriptRunner['next']>): void {
    this.pageIndex = 0;
    this.shown = 0;
    this.choiceCursor = 0;
    if (!step) {
      this.pages = [];
      this.finished = true;
    } else if (step.kind === 'choice') {
      this.pages = [{ kind: 'choice', options: step.options }];
    } else {
      const wrapped = wrapText(step.text, this.cols);
      this.pages = [];
      for (let i = 0; i < wrapped.length; i += this.rows) {
        this.pages.push({ kind: 'text', lines: wrapped.slice(i, i + this.rows) });
      }
    }
  }
}
