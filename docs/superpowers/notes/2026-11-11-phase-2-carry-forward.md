# Phase 2 carry-forward (session stop 2026-11-11)

Written for the next session that resumes Phase 2. Everything here was agreed with the owner or ruled by the orchestrator during execution; the plan itself is `docs/superpowers/plans/2026-11-11-phase-2-town-that-talks.md`.

## Where execution stands

- Branch `phase-2` (from `master`, which holds merged Phase 1). Head at the time of writing: the Task 4 synth fix plus this handoff commit.
- **Tasks 1–4 complete and reviewed** (ticked in the plan). **Resume at Task 5** (dialog script interpreter and typewriter model).
- Suite: 23 files / 138 tests green; `npx tsc --noEmit` clean; `npm run build` green.
- The SDD workspace (`.superpowers/sdd/2026-11-11-phase-2-town-that-talks/`) is git-ignored. To resume with subagent-driven development: run the skill's `sdd-workspace` and `task-brief` scripts again for Tasks 5–13, start a fresh ledger whose Tasks section records Tasks 1–4 as complete with the commit ranges below, and continue.
- Dev server for the owner: `npm run dev` from the uppercase path `C:/Projects/VSCode/WarriorsQuest` (Vite misbehaves from `c:/`).

## Owner's standing instructions (apply to every phase)

- Gated phases: stop after the phase's last task and list the owner checks; never start the next phase unprompted.
- Owner checks (look/listen in the browser) are the owner's. Implementers list them verbatim and never report them as passed.
- Models: this session (Fable) orchestrates, plans, reviews creative calls; Sonnet 5.5 implements; Sonnet reviews ordinary tasks; Opus reviews audio, cross-task integration, and the whole branch.
- Audio must not click: the owner cares most about music and sound. Master output level is 0.25 (owner found 1.0 painful).
- Stack discipline (owner, this session): `StateStack.reset`/`remove`; `TransitionState` removes itself by identity and re-pushes itself after an `onMid` that resets the stack; new game and debug warps use `reset`; auto triggers fire only from Explore's first `update()` as the top state, never from a constructor or `onMid`. State constructors must be DOM-free so they can be driven on a real stack in node tests.

## Commit ranges

| Task | Commits | Review |
|---|---|---|
| 1 Player/levels/items/inventory | ab33d9a..9634f53 | clean |
| 2 Key repeat + RNG | 9634f53..8154e55 | clean |
| 3 UI primitives | 8154e55..e84027f | clean |
| 4 SFX path + Apu redesign | e84027f..ba99b2d | clean after 2 fix rounds (Opus) |

## Rulings made during execution

- Interior warp tiles are the door tiles themselves (walkable; trigger fires on arrival), per spec §6.2. Cost if wrong: move eight trigger coordinates.
- Task 1: the brief's "equip with a full inventory and an occupied slot → ok:false" was impossible (equipping frees a slot first); replaced by "swap succeeds on a full inventory" and "unequip fails when full".
- Task 4: `menuConfirm` duty 0.5 (brief omitted it).
- Task 4, round 1 (overturned): interpolate the gain at `time` and anchor `stopAll` there. Wrong because `cancelScheduledValues` snaps an in-flight ramp back immediately.
- Task 4, round 2 (stands): per-note voices with kill gains, no cancellation anywhere (see the plan's Task 4 "Delivered" note). Released voices stay in `live` until `ended`; the noise envelope's trailing `setValueAtTime(0)` was dropped.

## Deferred minors (from per-task reviews; triage at the final whole-branch review)

- Task 1: `applyLevel` computes `floor(max * (hp/maxHp))`; `floor((max*hp)/maxHp)` is exact. `addItem` does not validate `n <= 0` or fractional `n`. No partial-fit-atomicity or no-mutation tests.
- Task 2: no test for two key codes mapped to one action keeping the repeat count, or for `clear()` resetting counters. `rng.int` does not validate bounds.
- Task 3: a long word starting mid-line flushes the partial line rather than filling it; `wrapText` ignores `\n`; `substitute` keys cannot contain digits; no tests for `drawText` scale, `drawWindow`, `drawMenu`.
- Task 4: `setPeriodicWave` is set at voice creation (fine now; duty is per voice). Malformed `SfxStep`s (noise without preset, pitched without note) are skipped silently and the validation test would not catch them. No `SONG_LEVEL` regression test. Door/error tests do not assert `stopAll`, vol, or duty. The continuity test checks only `setValueAtTime` anchors, not ramp insertions or start/stop edges, and has no release-during-attack scenario. The fake treats `.value` as a default rather than a hidden `set` at `currentTime`.
- Task 4 / sequencer (pre-existing): the sequencer never clamps scheduled times to `ctx.currentTime`; after a long main-thread stall it can emit rows in the past, which with the `.value` setters can mute a late note and blip on its release. Fix: clamp or skip past-dated rows in `Sequencer.schedule` (the Phase 1 notes already list "no catch-up policy").
- Task 4: frequency is fixed per voice; vibrato and pitch slides (spec §12.1) will need per-voice frequency automation.

## Story-free engine rule: existing violations to clean up at the end of Phase 2

Rule (CLAUDE.md, added after Task 4): engine and systems code (`src/engine/`, `src/game/`, `src/ui/`) must not reference story-specific names; story content lives in `src/data/`; the starting map, entry, and opening scene come from `src/data/story.ts`. Tasks 5–13 follow it (plan updated). Do not refactor these now; a cleanup task at the end of the phase handles them:

- `src/game/map.ts:4` — `export type SongId = 'hollowmere'` (Phase 1). Task 9 removes it; `GameMap.music` becomes `string`.
- `src/game/player.ts` — imports `ItemId` from `src/data/items` and types `InventorySlot.item` and `equipment` with it. Cleanup: `string`, with validation at the inventory boundary.
- `src/game/inventory.ts` — imports `ITEMS` and `ItemId`; `addItem`/`removeItem`/`equip` take `ItemId` and index `ITEMS`. Cleanup: take `string`; look items up through an injected item table (or keep `ITEMS` as a presentation-neutral registry if the owner rules item *data* generic — the ids themselves are story names, so the union type must go).
- `src/game/stats.ts` — imports `ITEMS` for `attackOf`/`defenseOf`. Same cleanup as inventory.
- `src/engine/audio/audio.ts:6` — `MUTE_KEY = 'dimming.mute'` embeds the game title in engine code. Cleanup: pass the storage key prefix in from `main.ts` or `story.ts`.
- `src/main.ts` imports `HOLLOWMERE`, `HOLLOWMERE_SONG` directly (Phase 1). `main.ts` is wiring and is allowed to import data, but Task 9 replaces these with the `STORY` config and registries anyway.
- Tests under `test/` are outside the rule.

## Still open from Phase 1 notes (unchanged)

- Hero uses six palette colours (well 6, sign 5) against spec §13's three or four; owner said the look was good, so leave unless asked.
- Idle hero does not animate; owner accepted.
- DPR change without a window resize is not detected.
