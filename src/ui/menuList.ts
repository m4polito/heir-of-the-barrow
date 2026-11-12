export class MenuList {
  cursor = 0;

  constructor(readonly items: readonly string[]) {}

  up(): void {
    if (this.items.length === 0) return;
    this.cursor = (this.cursor + this.items.length - 1) % this.items.length;
  }

  down(): void {
    if (this.items.length === 0) return;
    this.cursor = (this.cursor + 1) % this.items.length;
  }

  get selected(): string {
    return this.items[this.cursor] ?? '';
  }
}
