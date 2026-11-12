# Heir of the Barrow (Warrior's Quest)

A browser JRPG in the style of 8-bit NES-era Dragon Warrior: TypeScript, Vite, HTML5 canvas, Web Audio. Original story, characters, art, and music.

The game's title is *Heir of the Barrow*; *The Dimming* is its subtitle (Act 1). The repo and the design file keep their older names.

## Source of truth

- Design: `docs/superpowers/specs/2026-11-11-the-dimming-vertical-slice-design.md`
- Current plan: `docs/superpowers/plans/2026-11-11-phase-2-town-that-talks.md`

When they disagree, the design doc wins. Do not restate design details here; read them there.

## Rules

- **No runtime dependencies.** Dev dependencies only (Vite, TypeScript, Vitest). No game framework.
- **Originality.** Nothing copied, traced, or adapted from Dragon Warrior or any other published game: no names, sprites, tiles, fonts, melodies, or text. Mechanics may mirror the classic; content may not.
- **Gated phases.** Build one phase at a time. Stop after each phase for the owner's play-test; do not start the next phase until the owner gives feedback.
- **Owner checks.** Manual look-and-listen checks are the owner's. Implementers list them; they never report them as passed.
- **Tests pass before a task is done.** `npm test` and `npm run build` must be green.
- **One commit per task.** Commit messages end with a `Co-Authored-By:` trailer naming the model actually running the session (for example `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`).
- **Story-free engine.** Engine and systems code (src/engine/, src/game/, src/ui/) must not reference story-specific names (characters, places, items, flags). Story content lives in src/data/; the starting map, entry, and opening scene come from a single src/data/story.ts config.
- **Art tasks** use the `pixel-art-sprites` skill in `.claude/skills/`. The plan wins on conflicts.

## Commands

```
npm run dev      # local play
npm test         # vitest
npm run build    # typecheck + production build
```
