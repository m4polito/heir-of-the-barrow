# Phase 2 carry-forward (phase stop for the owner's play-test, 2026-11-12)

> **Commit hashes in this file predate the history rewrite of 2026-11-13 and no longer exist.** The commits are the same, with new hashes; find one by its subject line (`git log --grep="<subject>"`). See "Online" in `docs/superpowers/notes/2026-11-13-phase-6-carry-forward.md`.

Written for the owner's play-test and for the session that acts on its feedback. Everything here was agreed with the owner or ruled by the orchestrator during execution; the plan itself is `docs/superpowers/plans/2026-11-11-phase-2-town-that-talks.md`.

## Where execution stands

- Branch `phase-2` (from `master`, which holds merged Phase 1). Head: `b743657`. **Not merged, not pushed.**
- **All 14 tasks complete and reviewed.** The final whole-branch review (Opus) found one blocker and nine smaller items; one fix wave (`1265cd0`) addressed them, a scoped re-review confirmed it, and one of the nine (the sequencer change) was reverted (`b743657`); see "Final review" below.
- Suite at head: 33 files / 318 tests green; `npx tsc --noEmit` clean; `npm run build` green; the production bundle contains no debug-overlay strings.
- **Next step: the owner's play-test** (list at the end of this file), then fixes from the feedback, then merge. Phase 3 does not start until the owner says so.
- The SDD workspace `.superpowers/sdd/2026-11-11-phase-2-town-that-talks/` (git-ignored) is still on disk with the ledger, briefs, reports and review packages; delete it once the branch is merged.
- Dev server for the owner: `npm run dev` from the uppercase path `C:/Projects/VSCode/WarriorsQuest` (Vite misbehaves from `c:/`).

## Needs owner input (recorded during session 3; work continued without waiting)

1. **Title theme by ear.** The first version's harmony did not sound as written in half its bars (three voices over a D drone). The orchestrator changed five notes: real dominants in bars 8 and 12 (counter-line C#), the root F2 under the final chord, and two clashes removed (bars 6 and 14). Bar 14 is still a suspended colour over the F pedal, not a plain C chord. Listen and say whether it is right; if you want it different, name the bar.
2. **Talk reach.** To talk to people behind a table or counter, confirm reaches across one blocking tile. That also works across any single blocking tile (for example across the well to Pip). Keep, or limit it to counters and tables?
3. **"Equip it?" takes two presses.** The question shows as its own text page, then a separate Yes/No page. A question with Yes/No in one window is needed for the shop and inn in Phase 5 anyway; fix now or then?
4. **Late music rows after a stall.** If the browser stalls for more than about 100 ms (tab in the background, a long GC), sequencer rows can be scheduled in the past and may click. The first fix (skip late rows) was reverted because a short stall at song start could drop a song's first row, which silences the title's drone for about 11 seconds. The better fix is to re-date late rows to "now" or lengthen the song-start lead; both change how music sounds after a hiccup, so they need your ear. Phase 1 behaviour is in place meanwhile.
5. **Commit count.** CLAUDE.md says one commit per task; the branch has one per task plus one per review fix (27 commits for 14 tasks, plus two handoff commits). Squash-merge to keep `master` at one commit per phase, or merge as is?
6. **Commit trailer.** CLAUDE.md and the plan say `Co-Authored-By: Claude Fable 5.1`; this session ran on Fable 5.2 and kept 5.1 because it is your written rule. Change the rule if you want 5.2 from here on.
7. **Sprites touching at a corner.** While the hero or an NPC slides between tiles, the tile being left is not reserved, so two sprites can overlap at a corner for up to 8 frames. No one ever shares a tile. Worth fixing, or fine?

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
| 9 Game context, transitions, warps, NPCs on the map | 25d8fcb..fdecc09 | clean after 1 fix round (Opus; `npcs` readonly, in place) |
| 10 Dialog state, talking, opening scene | fdecc09..8ce2215 | clean after 1 fix round (Opus; confirm-before-tick, snap stepping NPC) |
| 11 Menu: Status, Items, Equip | 8ce2215..a2d40a6 | clean |
| 12 Title, name entry, title theme | a2d40a6..086bd62 | clean after 1 fix round (Opus; title harmony) |
| 13 Debug overlay | 086bd62..67372b2 | clean |
| 14 Story-free cleanup | 67372b2..d956cea | clean |
| Final review fix wave | d956cea..b743657 | re-review clean; finding 9 reverted |

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

## Rulings made during execution (session 3, Tasks 9–14 and the final review)

Each line: what was decided, why, and what it costs if wrong.

- Commit trailer stays `Claude Fable 5.1`: CLAUDE.md is the owner's written rule. Cost: trailer text on this session's commits.
- Task 10: when talking to an NPC that is mid-step, snap it to its tile before turning it, rather than ignoring the press. A press is never swallowed; the NPC jumps forward less than a tile. Cost: one line.
- Task 12 (creative): five note changes to the title theme (drone F2 at bar 16; counter-line bar 6 → E4 C4, bar 8 → C#5 A4, bar 12 → A4 C#4, bar 14 → G4 C5); the 12-bar D drone and the melody are unchanged. Cost: five notes; the owner's ear decides.
- Task 12: the melody's five quarter notes stand although the plan asked for half and whole notes. Cost: lengthen five notes.
- Task 12: a spaces-only name falls back to the default name; a test pins each title track's duty and volume. Cost: none.
- Task 14 design: `ItemDef` lives in `src/game/items.ts`; `Game.items` is injected from `main.ts`; inventory and stats functions take the item table as their first argument; `StoryConfig` gains `startingItems` and `storagePrefix`; `AudioManager(ctx, { muteKey })` persists mute only when given a key, and `main.ts` passes `'dimming.mute'` so a saved mute setting survives. Cost: signatures in three modules.
- Task 14 guard: the story-free guard also bans imports of `data/items`, `data/maps`, `data/dialog`, `data/songs`, `data/story` from engine, game and ui code; tiles, sprites, sfx, levels and the palette stay importable (levels are a numeric table with no story names). Cost: one regex.
- Final review, overturning the Task 5 `hasMore` ruling: `▼` also shows when a later script step is pending (`ScriptRunner.hasPending`, side-effect free). The old ruling meant `▼` never appeared, against spec §8.1. Cost: `▼` would show on a last page followed only by effect nodes; no script does that today.
- Final review, plan defect: the Equip window widens to its longest line (right edge fixed at x = 248); the Status window is 128 wide. The plan fixed both a 160 px window and a label that cannot fit in it. Cost: two rectangles.
- Final review: a text blip is dropped while another sound effect is still sounding, so the shield jingle, the error buzz and the menu confirm are heard. Cost: a few silent letters after a jingle.
- Final review: the nine smaller findings went into the one fix wave with the blocker. Cost: one commit to revert.
- Final review, reversing my own ruling: the sequencer's "skip late rows" change was reverted to Phase 1 behaviour (see "Needs owner input" 4). Cost: the rare stall click stays until it is fixed properly.
- Final review: the `hasPending` false positive (above) is parked. Cost: a stray `▼` if a script ever ends in a bare effect.

## Final review (Opus, whole branch) and what was done

- **Blocker, fixed:** in all four interiors the door glyph was at column 5 while the exit warp and the door entry were at column 6, so the hero could not leave any building, including the one the game starts in. The rows now read `'######D#####'`; tests assert that every warp sits on a walkable door tile, every door tile has a warp, and a hero walking down from each interior's door arrives in town.
- **Fixed:** blips cutting other sound effects; `▼` never showing; the Equip and Status windows overflowing; the menu or debug cursor auto-scrolling when opened with a direction held (`Input.rearm()`); the name-entry cursor jumping on the BACK/END row; `applyLevel` losing a point on re-apply; the stale header comment in the title song.
- **Reverted:** the sequencer change (above).
- **Checked and clean:** the state stack across Title → NameEntry → Transition → Explore → Dialog → Menu → Debug (no input leaks, no state acting after removal, no stuck transition); the hero cannot spawn inside an NPC; the town theme does not restart indoors; the story-free rule; originality of text, sprites and the title melody against Dragon Warrior / Dragon Quest.
- **Triage of the deferred minors below:** all "LEAVE" except the items fixed above (Task 1 `applyLevel`, Task 7 door assertions and 4-warp count, Task 9 ExploreState walk-out test, Task 12 header comment) and the Task 4 sequencer item (open, owner input 4). Already fixed in passing: Task 9's stale NPC snapshot, silent missing song and unused import; Task 10's `ItemId` import; Task 11's cast.

## Deferred minors (from per-task reviews; triaged at the final whole-branch review, see above)

- Task 9: no further open items beyond sprite corner overlap (owner input 7).
- Task 10: test gaps (talking to an NPC on the facing tile directly, confirm mid-step, give → full inventory through `DialogState`, close-does-not-reopen with an edge-triggered fake input); `shownChars()` is roundabout; the opening script's behaviour on a failed give is undefined (unreachable today).
- Task 11: Items and Equip lists do not scroll (fine for 8 slots); a new `MenuList` per frame; a misleading test comment.
- Task 12: no regression test for the Boot key not leaking into Title (safe by construction); the counter-line is in sixths for most but not all attacks; Title and NameEntry render paths are untested (owner look-check).
- Task 13: the "every row reachable" test only asserts no throw; `warpStart = 6` is duplicated in the test; the debug key is gated on the hero being idle.
- Task 14: the guard reports one offending file at a time; no test pins the mute key string; no test for `equip` with an unknown id (now `ok:false`, was a throw) or `createPlayer` with no starting items; `ItemDef.id` is `string`, so a typo in a data entry's `id` field is not type-checked.

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

## Owner play-test for Phase 2 (none of these has been performed by anyone)

Run `npm run dev` from `C:/Projects/VSCode/WarriorsQuest`. Spec §14 list:

- Start a new game, name the hero, receive the shield.
- Talk to every villager.
- Open the menu, equip the shield.
- Enter and exit every building.
- Open the debug overlay with the backquote key and set your level; see `ENC OFF` after toggling encounters.
- Confirm `npm run build` output contains no debug code (`grep -l "Gold +1000" dist/assets/*.js | wc -l` prints 0 in Git Bash).

Per-task checks:

- Title and new game (Task 12): after PRESS ANY KEY the title shows with its own theme; New Game opens the name grid; type a name, END, fade to black, wake in Maren's house facing her and the opening scene runs with your name in it; the town theme plays inside; walk out the door into Hollowmere. Listen to the title theme: slow, stately, minor resolving upward, no clicks, loops cleanly. The cursor on the name grid's BACK / END row moves sensibly.
- Doors and NPCs (Task 9): walk out and into each of the four doors, fade to black, arrive inside facing up, walk back out through the door and arrive outside it; the door sound plays on each warp; Pip and two villagers wander near their homes and never walk through you or onto a door; Bram, Tobin, Maren, Hesta, Garrik, Odo stand still; the town theme does not restart when entering a building; no console errors.
- Talking (Task 10): face an NPC and press confirm, they turn to you, text types out letter by letter with a blip, confirm skips to the end of the page, confirm again advances, `▼` blinks when there is more; the opening scene runs by itself after the fade-in completes, ending with Aldric's Shield in your items, and the shield jingle is audible; talking to Maren again gives her normal line; every villager has a line; Tobin's line is different from the others' tone; you can talk to Maren, Hesta, Garrik and Odo across their table or counter; no console errors.
- Menu (Task 11): press X in town to open the menu with a sound; Status shows the hero's numbers and an 8-letter name fits inside the window; Items lists the Herb and, after the opening scene, Aldric's Shield; Equip shows three slots and "SHIELD: Aldric's Shield" fits inside its window; equipping the shield raises DEF from 2 to 6 in Status; trying to use the Herb plays the error sound and says you cannot use it now; cancel backs out with a sound at each level; the menu cannot open while the hero is between tiles; opening the menu while holding a direction does not make the cursor run.
- Debug overlay (Task 13): every row of the list is reachable and visible; each warp lands on that map.

Art checks carried from earlier tasks:

- Task 7 art: the four interior tiles (wood floor, counter, bed, table) read at 1× in the browser.
- Task 8 art: the six NPC bodies (elder, adult in three tunic colours, smith, child, guard, squire) read at 1× and are told apart from each other and from the hero; the smith and guard widths and the squire's bottle are the likeliest to need tweaks.

## Story-free engine rule: violations cleaned up in Task 14 (done, `d956cea`)

All items below were removed in Task 14, and the guard test now also bans story-table imports. Kept for the record. Rule (CLAUDE.md): engine and systems code (`src/engine/`, `src/game/`, `src/ui/`) must not reference story-specific names; story content lives in `src/data/`; the starting map, entry, and opening scene come from `src/data/story.ts`. Tasks 5–8 follow it (`src/game/map.ts`'s `SongId` union is gone; the guard test in `test/interiors.test.ts` passes with an empty exclusion list). Remaining violations, all outside the guard's string list, for Task 14:

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

## Owner play-test result and answers (2026-11-12)

The owner played Phase 2 and accepted it ("gameplay is good and true to the classic"). Answers to "Needs owner input":

1. Title theme sounds right. Closed.
2. Talk reach across one blocking tile stays. Closed.
3. Two-press "Equip it?": deferred to Phase 5 (fix it with the shop and inn windows).
4. Late music rows after a stall: deferred; no date set.
5. Merge `phase-2` as is with `--no-ff`. Done.
6. Commit trailer names the model actually running the session; CLAUDE.md updated.
7. Sprite corner overlap: not fixing.

Two changes the owner asked for before the merge, both built and reviewed (Sonnet review, no Critical or Important findings):

- **Title** (`698dc07`): the game is *Heir of the Barrow*, subtitle *The Dimming* (Act 1). Ruling: at scale 2 the title is 288 px wide on a 256 px screen, so it wraps ("HEIR OF THE" / "BARROW") with the subtitle beneath — cost if wrong: one layout function in `src/game/title.ts`. `storagePrefix` stays `dimming`.
- **Escape from dialog** (`69d74cd`): cancel ends a dialog at once; the rest of the script runs silently, effects apply, choices resolve as No, the only sound is `menuCancel`.

Deferred minors from that review: no test for cancel and confirm on the same tick; `onChoice` runs inside the drain before the dialog is removed (no current caller pushes a state from it); the subtitle offset uses `GLYPH_W` where glyph height is meant; a failed `give` shows no "cannot carry more" text when the dialog is escaped.

Owner checks for these two changes (not performed by anyone): the title screen layout by eye; cancel during the opening scene still leaves the shield in the inventory and does not open the menu; cancel on "Equip it?" leaves the item unequipped.

**Next:** write the Phase 3 plan in a fresh session and stop for the owner's review. Phase 3 execution has not been authorised.
