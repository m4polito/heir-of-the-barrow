import type { SfxId } from '../../data/sfx';
import { substitute } from '../../ui/wrap';

export type DialogNode =
  | string
  | { if: string | { not: string }; then: DialogScript; else?: DialogScript }
  | { choice: [string, string]; yes: DialogScript; no: DialogScript }
  | { set: string }
  | { give: string }
  | { gold: number }
  | { heal: true }
  | { sfx: SfxId };

export type DialogScript = DialogNode[];

export interface ScriptEnv {
  name: string;
  has(flag: string): boolean;
  set(flag: string): void;
  give(item: string): boolean;
  gold(n: number): void;
  heal(): void;
  sfx(id: SfxId): void;
}

export type ScriptStep =
  | { kind: 'text'; text: string }
  | { kind: 'choice'; options: [string, string] };

type Choice = { choice: [string, string]; yes: DialogScript; no: DialogScript };

interface Frame {
  nodes: DialogScript;
  index: number;
}

/**
 * Walks a dialog script. Effects run silently in order until a text or choice
 * step is reached. Nested scripts are flattened with a frame stack, so after a
 * branch finishes execution continues after the node that opened it.
 */
export class ScriptRunner {
  private readonly stack: Frame[];
  private pendingChoice: Choice | null = null;

  constructor(
    script: DialogScript,
    private readonly env: ScriptEnv,
  ) {
    this.stack = [{ nodes: script, index: 0 }];
  }

  next(answer?: boolean): ScriptStep | null {
    if (this.pendingChoice) {
      const choice = this.pendingChoice;
      this.pendingChoice = null;
      this.stack.push({ nodes: answer === true ? choice.yes : choice.no, index: 0 });
    }
    for (;;) {
      const frame = this.stack[this.stack.length - 1];
      if (!frame) return null;
      if (frame.index >= frame.nodes.length) {
        this.stack.pop();
        continue;
      }
      const node = frame.nodes[frame.index++] as DialogNode;
      const step = this.run(node);
      if (step) return step;
    }
  }

  private text(text: string): ScriptStep {
    return { kind: 'text', text: substitute(text, { name: this.env.name }) };
  }

  private run(node: DialogNode): ScriptStep | null {
    if (typeof node === 'string') return this.text(node);
    if ('if' in node) {
      const cond = node.if;
      const holds = typeof cond === 'string' ? this.env.has(cond) : !this.env.has(cond.not);
      const branch = holds ? node.then : node.else;
      if (branch) this.stack.push({ nodes: branch, index: 0 });
      return null;
    }
    if ('choice' in node) {
      this.pendingChoice = node;
      const [a, b] = node.choice;
      const vars = { name: this.env.name };
      return { kind: 'choice', options: [substitute(a, vars), substitute(b, vars)] };
    }
    if ('set' in node) this.env.set(node.set);
    else if ('give' in node) {
      if (!this.env.give(node.give)) return this.text('You cannot carry more.');
    } else if ('gold' in node) this.env.gold(node.gold);
    else if ('heal' in node) this.env.heal();
    else this.env.sfx(node.sfx);
    return null;
  }
}
