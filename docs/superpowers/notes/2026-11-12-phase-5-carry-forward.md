# Phase 5 carry-forward (phase stop for the owner's play-test, 2026-11-12)

> **Commit hashes in this file predate the history rewrite of 2026-11-13 and no longer exist.** The commits are the same, with new hashes; find one by its subject line (`git log --grep="<subject>"`). See "Online" in `docs/superpowers/notes/2026-11-13-phase-6-carry-forward.md`.

Written for the owner's play-test and for the session that acts on its feedback. The plan is `docs/superpowers/plans/2026-11-12-phase-5-commerce-and-rest.md`; the owner approved it and all eighteen of its decisions on 2026-11-12 and added Task 0 (an original level table).

## Where execution stands

- Branch `phase-5` from `master` (`b9bb042`). **Not merged, not pushed.**
- **Tasks 0 to 9 complete and reviewed.** The whole-branch review (Opus) found no Critical and no Important issues; one fix wave (`ce7d3c7`) addressed three of its minor findings and the test gaps queued from the task reviews.
- Suite at `ce7d3c7`: 53 files / 749 tests green; `npx tsc --noEmit` clean; `npm run build` green; the production bundle contains no debug-overlay strings.
- **Next step: the owner's play-test** (list at the end of this file), then fixes from the feedback, then merge. Phase 6 does not start until the owner says so.
- Dev server: `npm run dev` from the uppercase path `C:/Projects/VSCode/WarriorsQuest`.

## The new level table (Task 0)

The old table matched Dragon Warrior's row for row (stats and XP thresholds). The replacement, chosen with a scratch simulation and confirmed by the balance tests:

| Lv | XP | STR | AGI | HP | MP | Learns |
|---|---|---|---|---|---|---|
| 1 | 0 | 4 | 5 | 16 | 0 | |
| 2 | 8 | 5 | 5 | 19 | 4 | Heal |
| 3 | 22 | 7 | 7 | 25 | 6 | |
| 4 | 50 | 9 | 9 | 29 | 12 | |
| 5 | 105 | 13 | 11 | 33 | 17 | |
| 6 | 210 | 17 | 12 | 36 | 23 | Ember |
| 7 | 420 | 19 | 15 | 41 | 27 | |
| 8 | 780 | 23 | 19 | 45 | 31 | |
| 9 | 1250 | 28 | 23 | 50 | 35 | Homeward |
| 10 | 1900 | 34 | 28 | 55 | 40 | |

- Every XP threshold, every row and every spell level changed. Strength at levels 1 to 3 (4, 5, 7) is the same as before, because the road and marsh targets depend on it.
- Heal moved to level 2, not later: the level 3 marsh target needs it by level 3.
- No monster, item, spell or formula number changed, and no balance threshold moved.

## Balance: measured with the real battle code

4000 simulated fights per case (`test/balance.test.ts`, seeded).

| Case | Phase 4 | Now | Target |
|---|---|---|---|
| Road Mireling, level 1, shield only | 2.3 HP lost, 3.1 rounds | 2.3 HP lost, 3.1 rounds | about 3 HP or less |
| Road Mireling, level 1, Club and shield | | 1.4 HP lost, 2.2 rounds, 100% wins | comfortable |
| Marsh, level 3, shield only, casting Heal | 83% | about 87% | more often than not |
| Marsh, level 3, Club and shield, casting Heal / never casting | | 99.8% / 94.5% | |
| Marsh, level 2, Club and shield, never casting | | 9.6% | not opened a level early |
| Warden at level 4 / 5 / 6 / 7 | 0.7% / 32% / 72% / 93% | about 0.6% / 30% / 80% / 93% | near 0 / under 50 / over 70 / over 90 |

- The starting 40 gold buys the Club and leaves 10: one night at the inn, or one Herb.
- Side effect of Heal at level 2: a level 2 hero with the Club who casts their one Heal wins a marsh fight about 54% of the time (scratch simulation; not pinned by a test).
- The Warden rows after "Now" for levels 4 to 7 are from the scratch simulation over six seeds; the tests pin the bands, not these exact values.

## Owner's answers already given (2026-11-12)

- Warden margins: accepted as measured; revisit in Phase 6 tuning. (The new table widened level 6's margin.)
- Warden fight length: accepted for now. **The Phase 6 plan must flag it as a tuning target**: about 19 rounds in simulation against the spec's aim of 10 to 13. Design doc §9.8 now says so.
- Level table: replaced (Task 0).

## Play-test result (owner, 2026-11-12)

Everything on the list checked out except one thing: saving made no sound of its own. Fixed after the play-test: a successful save now plays a new `save` effect (two soft taps and a held note a fifth higher) in place of the confirm blip that the answer's blip was swallowing. **Owner listen check, not performed by anyone:** save at Maren's and hear a sound that is clearly not the confirm blip, the buy sound or the heal sound; a failed save (storage blocked) stays silent apart from the answer blip. Question 1 below is answered by this.

## Questions for the owner

1. **Maren's save sound.** The confirm blip on "It is written." starts in the same instant as the blip from answering Yes and replaces it, so a successful save and a failed one sound the same; only the text differs. A distinct save sound would be new audio. Want one?
2. **Shop price line.** "The Wooden Club? That will be 30 gold." and the trade-in line follow the same pattern as the classic's shop lines, in modern words. The wording came from the design doc's own sample and no words are copied. Reword for more distance?
3. **Level 2 and the marsh.** With Heal at level 2, a Club-carrying level 2 hero has roughly an even chance in a marsh fight if they heal. Is that welcome, or should level 2 be weaker (lower HP) in Phase 6 tuning?
4. **Torches.** Odo sells them now and they do nothing until Phase 6. Fine for this play-test, or hide them until then?
5. Still open from Phase 4 and not asked again in this phase: whether the road being unable to kill a shielded hero is right; the heal sound; the spell sound against the Run-away sound; Tobin's shortened narration; the battle window position.

## Rulings made during execution

Each line: what was decided, why, and what it costs if wrong.

- Tasks ran in the order 0, 1, 3, 2, 6, 4, 5, 7, 8, so each review could finish before the next task touched the same files. Cost: none.
- The shop rules answer "not enough gold" for an item id they do not know. Stock ids are checked against the item table by a test. Cost: a mistyped id would read as a refusal instead of failing loudly.
- A dialog whose step opened another screen (shop, sleep) does nothing more in that update and finishes when it is on top again. The plan was silent about a script that ends on a shop step. Cost: a few lines.
- `pay` with a negative or fractional price throws; the plan only said "when gold is enough". Cost: none.
- `songFrames` for the victory fanfare is 145, not the plan's 144: floating point in the formula the plan pinned, and identical to what the battle screen computed before. Cost: none.
- Task 7 changed `save.ts`, outside its file list, to break an import cycle that would have stopped the game loading; the fix wave then removed the cycle properly by moving the name grid to its own file. Cost: none.
- Task 8's pacing bound is 20% of maximum HP (3.2 at 16 HP), as the spec words it, not the plan's literal 3.0. Cost: none; measured 1.4.
- Task 8 was reviewed by the orchestrator alone (a 63-line test-only change checked against the scratch measurements). Cost: one fewer independent read of that file.
- Held direction keys scrolled the shop menu when it opened; the shop now ignores a key that is already down. Cost: a few lines.
- **A saved HP or MP above the level's maximum is now accepted and held to the maximum on load, not rejected.** This changes Task 6's rule. Why: otherwise lowering a maximum in Phase 6 tuning would make older saves unreadable, with no message. Cost: a hand-edited save cannot be rejected for high HP, only corrected.
- The dialog `gold` step is held to 0 to 65535. Cost: none.
- Not changed, left as questions 1 and 2: Maren's save sound and the shop price wording.

## Final review (Opus, whole branch) and what was done

- **Checked and found sound:** a damaged or blocked save never crashes and is never overwritten by the title; gold cannot go below 0 or above 65535 on any path (buy, sell, trade-in, inn, death, battle reward, debug); the full-pack trade-in happens whole; cancel answers No everywhere and never charges, sleeps or saves; the sleep ignores keys, the jingle and the map song each start once with silence between them; selling down to nothing keeps the cursor on a real row; no stray screen is left on the stack and no completion runs twice on any traced path; a buy-equip-sell-save-Continue run restores an identical hero, including a full pack at 65535 gold and a debug-levelled hero; level-up messages and spells per level follow the new table; the engine names no story content; the production bundle boots to the title and through Continue.
- **Minor, fixed in the fix wave:** the shop menu scrolling under a held key; saves that a retune would have orphaned; the unbounded dialog gold step; the import cycle; sixteen test gaps from the task reviews (hostile save input, the sell-list cursor, inn MP and gold checks, Continue's restored hero, and others).
- **Left for the owner:** questions 1 and 2 above.

## Notes for the Phase 6 plan

- Flag the Warden fight length as a tuning target (owner's instruction).
- If tuning lowers a level's maximum HP or MP, existing saves still load (HP and MP are held to the new maximum). If the save's shape changes, raise the save version.
- Torch steps are already in the save as 0; Phase 6 fills them in.
- A script must not start with a `shop`, `rest`, `pay` or `save` step (a test now enforces this for the town's dialogs): the first step runs before the dialog is on screen.
- Reaching level 9 for Homeward is still only possible with the debug overlay in the slice.

## Deferred minors

From this phase:

- Task 1: no test types a multi-line question character by character.
- Task 3: a `def.kind as EquipSlot` cast in `shop.ts`.
- Task 4: a redundant in-map check in `explore.ts`; an unreachable error branch after equipping in `shopState.ts`; no failing run was recorded before the shop tests passed.
- Task 6: tests and code were written together (the failing run was shown afterwards by moving the module aside).
- The older import loop explore → menu → field result → explore, and explore ↔ battle, remains; every use is inside a function, so load order cannot break today.
- Design doc §9.8 says "has a long fight" where Task 0's brief said "the fight is long".

Still open from Phase 4 (unchanged): the Torch and Warden items listed in `docs/superpowers/notes/2026-11-12-phase-4-carry-forward.md` under "Do before or with Phase 6's Torch work" and "Do before Phase 6 moves the Warden into `src/data`", and its "Can stay deferred" list.

## Owner play-test for Phase 5 (none of these has been performed by anyone)

Run `npm run dev` from `C:/Projects/VSCode/WarriorsQuest`. Spec §14 list:

- Buy and equip a weapon; feel the damage difference.
- Sleep at the inn.
- Save, reload the page, Continue and find yourself where you saved.

Level table (Task 0):

- A new hero's Status shows HP 16 and AGI 5.
- Level 2 arrives after four road fights and teaches Heal.
- Ember arrives at level 6.

Questions (Task 1):

- In Items, choosing a piece of gear shows "Equip it?" with Yes and No beneath it in the same window; one press on Yes equips.

Shops (Task 4):

- Garrik greets, the shop shows Buy / Sell / Leave with your gold under it, and nothing is cut off or overlapping. An empty message window sits at the bottom while the shop is open; that is his farewell waiting, and is expected.
- The Buy list lines up names and prices.
- Buying plays a coin-like sound that is not the confirm blip.
- The Club can be bought and equipped with the starting 40 gold, and Status then shows ATK 6.
- Selling pays half.
- Garrik's last two lines play on leaving, and cancel skips them.
- Odo sells Herbs and Torches.
- Holding a direction key while talking to Garrik does not make the shop menu scroll.

Inn (Task 5):

- Hesta's question shows with Yes and No under it, and all three lines of the longer one (after the Warden; use a debug-set flag or wait for Phase 6) fit.
- Yes takes 6 gold, the screen fades to black, a soft three-second lullaby plays, the screen fades back and she speaks her morning line.
- The town theme starts again after the jingle with no click.
- Keys do nothing while you sleep.
- With 5 gold she refuses.
- The lullaby sounds like its own tune, not like the victory or level-up sounds, and not like any inn tune you know from another game.

Saving (Task 7):

- Maren asks "Shall I remember your journey?" after her first line; Yes plays a blip and says "It is written."
- Reload the page: the title shows Continue above New Game with the cursor on Continue.
- Continue fades into Maren's house where you stood, with your level, gold, gear and items as saved, and the opening scene does not replay.
- The title layout still looks right with two rows.
- In a private window with storage blocked, Maren says nothing was written and the game carries on.
- Maren's opening scene now includes "Take your coin to Garrik's forge before you try the gate."

Balance (Task 8):

- With the Club, road fights take about two rounds and cost one or two HP; say whether the first ten minutes now feel right.
- At level 3 with the Club, the marsh is usually won even without Heal.
