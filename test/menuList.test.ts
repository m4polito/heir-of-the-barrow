import { describe, expect, it } from 'vitest';
import { MenuList } from '../src/ui/menuList';

describe('MenuList', () => {
  it('wraps down and up', () => {
    const m = new MenuList(['a', 'b', 'c']);
    expect(m.selected).toBe('a');
    m.down(); m.down();
    expect(m.selected).toBe('c');
    m.down();
    expect(m.cursor).toBe(0);
    m.up();
    expect(m.cursor).toBe(2);
    expect(m.selected).toBe('c');
  });
  it('handles empty items', () => {
    const m = new MenuList([]);
    m.down(); m.up();
    expect(m.cursor).toBe(0);
    expect(m.selected).toBe('');
  });
});
