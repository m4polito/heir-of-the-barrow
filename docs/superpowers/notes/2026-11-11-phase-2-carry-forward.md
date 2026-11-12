# Phase 2 carry-forward (second session stop, 2026-11-11)

Written for the next session that resumes Phase 2. Everything here was agreed with the owner or ruled by the orchestrator during execution; the plan itself is `docs/superpowers/plans/2026-11-11-phase-2-town-that-talks.md`.

## Where execution stands

- Branch `phase-2` (from `master`, which holds merged Phase 1). Head at the time of writing: Task 8 (`62906ac`) plus this handoff commit.
- **Tasks 1–8 complete and reviewed** (ticked in the plan). **Resume at Task 9** (game context, sprite cache, transitions, Explore with warps and NPCs). Tasks 9 and 10 are integration tasks: Opus reviews them; the final whole-branch review after Task 14 is Opus too.
- Suite: 28 files / 250 tests green; `npx tsc --noEmit` clean; `npm run build` green (last run at Task 7; Task 8 ran the suite and tsc).
- The SDD workspace `.superpowers/sdd/2026-11-11-phase-2-town-that-talks/` is git-ignored and was left on disk. Its `progress.md` ledger names this plan and records Tasks 1–8 as complete, with every ruling below; `task-9-brief.md` through `task-14-brief.md` are already generated from the current plan. To resume: invoke `superpowers:subagent-driven-development`, run the skill's `sdd-workspace` script (it prints the same directory), read the ledger, and dispatch Task 9. If the directory is gone, recreate it with `sdd-workspace` and `task-brief` for Tasks 9–14, start a fresh ledger whose first line is `# SDD ledger — plan: docs/superpowers/plans/2026-11-11-phase-2-town-that-talks.md`, record Tasks 1–8 as complete with the commit ranges below, and copy the rulings from this file.
- Dev server for the owner: `npm run dev` from the uppercase path `C:/Projects/VSCode/WarriorsQuest` (Vite misbehaves from `c:/`).

## Owner's standing instructions (apply to every phase)

- Gated phases: stop after the phase's last task (Task 14) and list the owner checks; never start the next phase unprompted.
- Owner checks (look/listen in the browser) are the owner's. Implementers list them verbatim and never report them as passed.
- Models: the orchestrating session (Fable) plans, rules, and reviews creative calls itself (it read the Task 6 dialog and sent prose fixes); Sonnet 5.5 implements; Sonnet reviews ordinary tasks; Opus reviews audio, cross-task integration (Tasks 9, 10), and the whole branch.
- Audio must not click: the owner cares most about music and sound. Master output level is 0.25 (owner found 1.0 painful).
- Stack discipline (owner): `StateStack.reset`/`remove`; `TransitionState` removes itself by identity and re-pushes itself after an `onMid` that resets the stack; new game and debug warps use `reset`; auto triggers fire only from Explore's first `update()` as the top state, never from a constructor or `onMid`. State constructors must be DOM-free so they can be driven on a real stack in node tests.
- Story-free engine (CLAUDE.md): no story names in `src/engine/`, `src/game/`, `src/ui/`; story registries are injected through the `Game` context from `main.ts`.

## Commit ranges

| Task | Commits | Review |
|---|---|---|
| 1 Player/levels/items/inventory | ab33d9a..9634f53 | clean |
| 2 Key repeat + RNG | 9634f53..8154e55 | clean |
| 3 UI primitives | 8154e55..e84027f | clean |
| 4 SFX path + Apu redesign | e84027f..ba99b2d | clean after 2 fix rounds (Opus) |
| 5 Dialog script + model | 2da809e..f89c4bf | clean |
| 6 Hollowmere dialog | f89c4bf..b68e510 | clean after 2 fix rounds (orchestrator's prose findings) |
| 7 Map triggers, interiors, NPC placements, hero arrive hook | b68e510..018cbd8 | clean after 1 fix round (floorWood colours) |
| 8 NPC sprites + wander | 018cbd8..62906ac | clean |

(Between Task 4 and Task 5: `aa7b933` first handoff, `2da809e` story-free rule docs.)

## Rulings made during execution (session 1, Tasks 1–4)

- Interior warp tiles are the door tiles themselves (walkable; trigger fires on arrival), per spec §6.2. Cost if wrong: move eight trigger coordinates.
- Task 1: the brief's "equip with a full inventory and an occupied slot → ok:false" was impossible (equipping frees a slot first); replaced by "swap succeeds on a full inventory" and "unequip fails when full".
- Task 4: `menuConfirm` duty 0.5 (brief omitted it).
- Task 4, round 1 (overturned): interpolate the gain at `time` and anchor `stopAll` there. Wrong because `cancelScheduledValues` snaps an in-flight ramp back immediately.
- Task 4, round 2 (stands): per-note voices with kill gains, no cancellation anywhere (see the plan's Task 4 "Delivered" note). Released voices stay in `live` until `ended`; the noise envelope's trailing `setValueAtTime(0)` was dropped.

## Rulings made during execution (session 2, Tasks 5–8): later tasks must honour these

- **Task 10 talk reach (changes Task 10's text):** Maren, Hesta, Garrik, and Odo stand behind a table or counter, so the hero's facing tile is furniture. Task 10's talk check: look at `facingTile(hero)`; if no NPC is there and that tile is not walkable, also check the next tile in the facing direction (talk across a counter, as the classic does). Both tiles must be inside the map. Cost if wrong: a few lines in `explore.ts`.
- **Task 9:** `src/data/story.ts` exports `STORY` with `as const` and no annotation; Task 9 adds `satisfies StoryConfig` once `src/game/game.ts` declares the interface. `GameMap.music` is already `string`; interiors use `'hollowmere'` and rely on the audio manager's same-song no-op so the town theme keeps playing indoors.
- **Task 11:** `equipLines(p).candidates` is `string[]` from the start (story-free; Task 14 would otherwise change it).
- **Task 13:** `DebugState` builds its warp list from `game.maps`; it does not import `MAPS` (the brief's "Consumes" line is stale).
- Task 5: `DialogModel.hasMore` reflects remaining pages of the current text step only (peeking the runner would run effects early). On a choice page `lines` are the two options, `revealed` is true at once, `choiceCursor` resets to 0 per choice page, `moveChoice` wraps; `confirm()` when `done` is a no-op; `next(answer)` without a pending choice ignores `answer`, and a missing answer after a choice selects `no`.
- Task 6 (prose): Maren's "It listens, I think." replaced (the Dimming has no agency in spec §5.1); Hesta's free bed replaced (Phase 5 inn is a fixed 6 gold); the shield gift is a spoken line before `{ give }` and a narration line `"{name} received Aldric's Shield."` after `{ set }`. Third-person narration lines ("He keeps his eyes on his cup and mumbles.") are accepted.
- Task 7: exterior door → interior: (12,4) `elder_house`, (4,9) `inn`, (19,9) `forge`, (4,16) `shop`; hollowmere's four new entries are named after the interior ids at the tile below each door facing down; interior door at column 6 of the bottom wall; `entry.door` above it facing up; `elder_house.entry.start` = (6,4) facing up (Maren at (6,2), table on row 3). The story-free guard test reads sources with `import.meta.glob(..., '?raw')` (no Node typings); its `EXCLUDED` list is empty. Shared interior legend in `src/data/maps/legend.ts`.
- Task 8: `npcArt`/`adultPalette` live in `src/data/sprites/npcs.ts`; `src/game/npc.ts` imports nothing from `src/data/`. `npcArt` throws on an unknown sprite, applies the palette only to `adult` (fallback 0), and returns identity-stable objects (Task 9's `SpriteCache` keys by `PixelArt` identity). Direction pick order `['up','down','left','right']`.

## Deferred minors (from per-task reviews; triage at the final whole-branch review)

- Task 1: `applyLevel` computes `floor(max * (hp/maxHp))`; `floor((max*hp)/maxHp)` is exact. `addItem` does not validate `n <= 0` or fractional `n`. No partial-fit-atomicity or no-mutation tests.
- Task 2: no test for two key codes mapped to one action keeping the repeat count, or for `clear()` resetting counters. `rng.int` does not validate bounds.
- Task 3: a long word starting mid-line flushes the partial line rather than filling it; `wrapText` ignores `\n`; `substitute` keys cannot contain digits; no tests for `drawText` scale, `drawWindow`, `drawMenu`.
- Task 4: `setPeriodicWave` is set at voice creation. Malformed `SfxStep`s are skipped silently. No `SONG_LEVEL` regression test. Door/error tests do not assert `stopAll`, vol, or duty. The continuity test checks only `setValueAtTime` anchors; no release-during-attack scenario; the fake treats `.value` as a default.
- Task 4 / sequencer (pre-existing): the sequencer never clamps scheduled times to `ctx.currentTime`; after a long stall it can emit rows in the past. Fix: clamp or skip past-dated rows in `Sequencer.schedule`.
- Task 4: frequency is fixed per voice; vibrato and pitch slides (spec §12.1) will need per-voice frequency automation.
- Task 5: `moveChoice` ignores `delta` (two options, wraps) and no double-move test; `next(answer)` behaviour with a stray or missing answer is undocumented; test gaps: choice page after a text page, empty text step, text exactly `cols` wide, empty choice branch; `rows <= 0` would loop (unreachable).
- Task 6: the `it.each` branch test leaves `before`/`after` unused for maren/hesta; the `strings()` walker skips unknown nodes silently; hard-coded id list instead of `Object.keys(DIALOGS)`; the ≤ 8-line check is by execution, not a tree walk (would miss text behind a future `choice`); commit `af92d75` does not compile on its own (repaired by `b68e510`); two double-quoted strings differ from the file's escaped-single-quote style.
- Task 7: bed/table tiles have no seam rows, so they patch against the wood floor (owner look-check); the round-trip test never asserts it visited four warps; no assertion that `D` is at (6,8) or that the warp tile coincides with it; border unasserted; `as Dir` cast in `opposite()`; the guard bans only single-quoted literals.
- Task 8: `sprite in NPC_SPRITES` admits prototype keys (use `Object.hasOwn`); the stepping-offset assertion is conditional and could pass vacuously; no tests that `npcArt` returns distinct objects per palette, that the registry's adult colours stay `t: 10`, or for the adult variants' height; `npcPixelOffset` duplicates `heroPixelOffset`; the bodies use 5–9 palette keys including outline versus spec §13's 3–4 (same standing art-sign-off item as the hero).

## Owner checks accumulated so far (unperformed; list them again at the phase stop)

- Tasks 9–13 each list their own checks in the plan; none are performed yet.
- Task 7 art: the four interior tiles (wood floor, counter, bed, table) read at 1× in the browser.
- Task 8 art: the six NPC bodies (elder, adult in three tunic colours, smith, child, guard, squire) read at 1× and are told apart from each other and from the hero; the smith and guard widths and the squire's bottle are the likeliest to need tweaks.

## Story-free engine rule: existing violations to clean up in Task 14

Rule (CLAUDE.md): engine and systems code (`src/engine/`, `src/game/`, `src/ui/`) must not reference story-specific names; story content lives in `src/data/`; the starting map, entry, and opening scene come from `src/data/story.ts`. Tasks 5–8 follow it (`src/game/map.ts`'s `SongId` union is gone; the guard test in `test/interiors.test.ts` passes with an empty exclusion list). Remaining violations, all outside the guard's string list, for Task 14:

- `src/game/player.ts` imports `ItemId` from `src/data/items` and types `InventorySlot.item` and `equipment` with it; `createPlayer` seeds `'herb'`. Cleanup: `string`, with validation at the inventory boundary; the starting inventory comes from `STORY` or `createPlayer`'s caller.
- `src/game/inventory.ts` imports `ITEMS` and `ItemId`; `addItem`/`removeItem`/`equip` take `ItemId` and index `ITEMS`. Cleanup: take `string`; look items up through an injected item table (or keep `ITEMS` as a presentation-neutral registry if the owner rules item *data* generic; the ids themselves are story names, so the union type must go).
- `src/game/stats.ts` imports `ITEMS` for `attackOf`/`defenseOf`. Same cleanup as inventory.
- `src/engine/audio/audio.ts:6` has `MUTE_KEY = 'dimming.mute'`, which embeds the game title in engine code. Cleanup: pass the storage key prefix in from `main.ts` or `story.ts`.
- `src/main.ts` imports `HOLLOWMERE` and `HOLLOWMERE_SONG` directly (Phase 1). `main.ts` is wiring and may import data; Task 9 replaces these with the `STORY` config and registries anyway.
- Tests under `test/` are outside the rule.

## Still open from Phase 1 notes (unchanged)

- Hero uses six palette colours (well 6, sign 5) against spec §13's three or four; owner said the look was good, so leave unless asked.
- Idle hero does not animate; owner accepted.
- DPR change without a window resize is not detected.
