import { describe, expect, it } from 'vitest';
import { substitute, wrapText } from '../src/ui/wrap';

describe('wrapText', () => {
  it('wraps greedily on spaces', () => {
    expect(wrapText("You have your father's eyes, Wren.", 28)).toEqual(["You have your father's eyes,", 'Wren.']);
  });
  it('hard-splits a long word', () => {
    expect(wrapText('a'.repeat(40), 28)).toEqual(['a'.repeat(28), 'a'.repeat(12)]);
  });
  it('returns one empty line for empty text', () => {
    expect(wrapText('', 28)).toEqual(['']);
  });
  it('keeps an exactly-full line whole', () => {
    const s = 'a'.repeat(28);
    expect(wrapText(s, 28)).toEqual([s]);
  });
});

describe('substitute', () => {
  it('replaces known keys', () => {
    expect(substitute('Hi {name}!', { name: 'Wren' })).toBe('Hi Wren!');
  });
  it('leaves unknown keys', () => {
    expect(substitute('Hi {who}!', { name: 'Wren' })).toBe('Hi {who}!');
  });
});
