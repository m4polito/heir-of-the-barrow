import { describe, it, expect } from 'vitest';
import { noteToMidi, midiToFreq } from '../src/engine/audio/notes';

describe('noteToMidi', () => {
  it('maps names to midi numbers', () => {
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('C4')).toBe(60);
    expect(noteToMidi('C#4')).toBe(61);
    expect(noteToMidi('Db4')).toBe(61);
    expect(noteToMidi('C0')).toBe(12);
    expect(noteToMidi('G9')).toBe(127);
  });
  it('throws on invalid names', () => {
    expect(() => noteToMidi('H4')).toThrow('Invalid note: H4');
    expect(() => noteToMidi('C')).toThrow();
    expect(() => noteToMidi('C-1')).toThrow();
  });
});

describe('midiToFreq', () => {
  it('converts midi to Hz', () => {
    expect(midiToFreq(69)).toBe(440);
    expect(midiToFreq(57)).toBeCloseTo(220, 6);
  });
});
