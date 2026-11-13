import { describe, expect, it } from 'vitest';

// Vite reads the files as raw text (the project has no Node typings, so no fs).
const FILES = import.meta.glob<string>(['../.github/workflows/*.yml', '../vite.config.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

const WORKFLOW = '../.github/workflows/pages.yml';
const read = (p: string): string => FILES[p] ?? '';

describe('shareable build', () => {
  it('has a Pages workflow', () => {
    expect(WORKFLOW in FILES).toBe(true);
  });

  it('tests before it builds, and uploads dist', () => {
    const text = read(WORKFLOW);
    const test = text.indexOf('npm test');
    const build = text.indexOf('npm run build');
    expect(test).toBeGreaterThan(-1);
    expect(build).toBeGreaterThan(test);
    expect(text).toMatch(/path:\s*dist\b/);
  });

  it('runs on master and manual dispatch', () => {
    const text = read(WORKFLOW);
    expect(text).toMatch(/branches:\s*\[master\]/);
    expect(text).toContain('workflow_dispatch');
  });

  it('uses only actions owned by actions', () => {
    const uses = [...read(WORKFLOW).matchAll(/uses:\s*([^\s@]+)@/g)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThan(0);
    for (const u of uses) expect(u?.startsWith('actions/')).toBe(true);
  });

  it('keeps a relative base so a sub-path works', () => {
    expect(read('../vite.config.ts')).toMatch(/base:\s*'\.\/'/);
  });
});
