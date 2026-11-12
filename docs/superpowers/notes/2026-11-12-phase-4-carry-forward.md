# Phase 4 carry-forward (phase stop for the owner's play-test, 2026-11-12)

Written for the owner's play-test and for the session that acts on its feedback. The plan is `docs/superpowers/plans/2026-11-12-phase-4-growing-stronger.md`; the owner approved it and all sixteen of its decisions on 2026-11-12, with one change to Task 9's copy (only Maren and Tobin speak of themselves in the third person).

## Where execution stands

- Branch `phase-4` from `master` (`aafdd4a`). **Not merged, not pushed.**
- **All 10 tasks complete and reviewed.** The whole-branch review (Opus) found no Critical and no Important issues; one fix wave (`4ea93f9`) addressed three of its minor findings.
- Suite at `4ea93f9`: 48 files / 560 tests green; `npx tsc --noEmit` clean; `npm run build` green; the production bundle contains no debug-overlay strings.
- **Next step: the owner's play-test** (list at the end of this file), then fixes from the feedback, then merge. Phase 5 does not start until the owner says so.
- Dev server: `npm run dev` from the uppercase path `C:/Projects/VSCode/WarriorsQuest`.

## Balance: measured with the real battle code

4000 simulated fights per case (`test/balance.test.ts`, seeded). "Before" is the same test against the Phase 3 numbers.

| Case | Before | After | Owner's target |
|---|---|---|---|
| Road Mireling, level 1, shield only | 5.3 HP lost, 6.3 rounds | 2.3 HP lost, 3.1 rounds, 100% wins | about 3 HP or less |
| Marsh, level 3, shield only, casting Heal at 8 HP or less | 29% wins | 83% wins | more often than not |
| Marsh, level 3, never casting Heal | | 29% wins | |
| Marsh, level 1 / level 2 | | 0% / about 1% wins | stays deadly |
| Warden at level 4 / 5 / 6 / 7 (Bronze Sword, Leather Armor, shield, 3 Herbs) | | 0.7% / 32% / 72% / 93% | near 0 / under 50 / over 70 / over 90 |

What changed: road Mireling HP 6 → 4 and DEF 3 → 1; Bog Mireling DEF 8 → 6; Warden ATK 22 → 20 and Rot Breath 8–14 → 7–12 (the Warden lives in `test/helpers/warden.ts` until Phase 6). The hero table is untouched. The design doc's §10.5 and §9.8 carry the new numbers.

More from the final reviewer's probes, for the play-test:

- The road Mireling can now only ever do 1 damage a hit to a hero with the shield equipped, so the road can no longer kill: a new hero won about 59 road fights in a row without resting.
- Marsh trips from full HP and MP, without resting between fights, average 0.9 wins before a loss at level 3, 2.9 at level 4 and 9.1 at level 5.
- Warden wins take about 20 rounds on average.

## Questions for the owner

1. **Warden margins.** Level 6 clears "over 70%" by 2 to 4 points and level 7 clears "over 90%" by 3 to 4, across six seeds. The numbers you approved were kept. Leave as is until Phase 6's play-test, or ease the Warden a little more now?
2. **Warden fight length.** Design doc §9.8 still says "the fight runs roughly 10–13 rounds"; simulated wins take about 20 (healing turns, misses and Mend). Is a 20-round boss fight what you want, or should Phase 6 shorten it (less HP, or a weaker Mend)? The sentence is unedited until you say.
3. **The road is now safe.** Is "the road cannot kill a hero who has the shield on" right for the first minutes of the game, or too soft?
4. **Heal sound.** The plan's heal sound turned out to be the last three notes of the Run-away sound at half speed, so it was changed to a falling, settling figure (E6 C6 G5 C6). The rising version is one line to restore.
5. **Spell sound against the Run-away sound.** Both are five rising notes ending on the same pitch; they differ in tone colour and key. If they sound alike to you, the spell can end higher or change rhythm.
6. **Tobin's second line.** With his new first line spoken clearly ("Let Tobin drink. Tobin has nothing to say to you."), the narration after it was shortened from "He keeps his eyes on his cup and mumbles." to "He keeps his eyes on his cup." You did not ask for that line to change; say if you want it back.
7. **Battle window position.** The plan's window positions covered the bottom 4 pixels of the ground strip, so both battle windows sit 4 pixels lower and are 4 pixels shorter than the plan said. A look check.
8. **Familiar numbers.** The reviewer noted that the level table (§10.1) and the spells' costs and ranges (§10.2) appear to match Dragon Warrior's published values. They are mechanics, which the rules allow to mirror the classic, and they are from the approved design doc; names, text and melodies are original. Flagged so you know a fan could recognise them.

## Rulings made during execution

Each line: what was decided, why, and what it costs if wrong.

- Task 6's "Cast Heal" test uses a monster worth 2 XP or less so the win does not level the hero up and move MP. Cost: none.
- Task 9's rewritten lines for Hesta, Garrik and Bram (owner's change) were written and reviewed by the orchestrator: first person or a quoted address, same content and voice. Cost: one-line edits if the owner prefers other wording.
- `SFX.heal` changed from the plan's G5 C6 E6 (duty 0.5) to E6 C6 G5 C6 (duty 0.25), because the plan's notes repeated the Run-away sound's tail and the victory opening (question 4). Cost: one line.
- The plan's "Herb in a lost fight" tests used a monster with agility 99, which kills before the Herb is used; they use agility 0. Cost: none (test only).
- Level-up tests use a monster with attack 0 and agility 0; `BattleState` gained `text` and `stats` getters for tests. Cost: a little public surface.
- Confirm blip in battle: first ruled "no blip for spells" (the cast sound would cut it), then, after the final review showed that left a spell silent when the monster moves first, made uniform: the blip plays unless the first resulting message has its own sound. Cost: one line.
- A `quiet` option on dialogs was added in Task 7 so typing blips would not cut the heal sound, then removed: the audio manager already drops a blip while a longer sound plays, so the premise was wrong. Cost: none; the plan stands as written.
- Task 7's warp test presses confirm and cancel only while the fade is on top; presses afterwards legitimately open a dialog or the menu. Cost: none (test only).
- The Warden numbers were accepted as approved despite thin margins (question 1). Cost: the Warden may be slightly hard at level 6 until Phase 6 tunes it.
- The "Tuned" note sits under the §10.5 table only; §9.8's change is prose. Cost: none.
- Task 10 was split as in Phase 3: the implementer did the debug rows; the orchestrator wrote this note and ticked the plan. Cost: two commits for one task.
- Battle windows moved to `(8, 120, 72, 52)` and `(84, 120, 164, 52)` (question 7). Cost: two rectangles.
- Tobin's narration shortened (question 6). Cost: one string.

## Final review (Opus, whole branch) and what was done

- **Checked and found sound:** what is stored and what is shown agree for HP, MP, XP, level and known spells through single and multiple level-ups, the XP cap and level 10; items and MP are spent exactly once and stay spent on a win, a flight and a death; death restores HP and MP only; a monster that strikes first and kills costs no MP and no Herb; every refusal costs nothing and no turn; the state stack through menus, dialogs, battles and the warp spell; one key press never does two things; the fanfare-then-jingle hand-off and the return to the map song (no new click paths found in code); the story-free rule; the balance tests drive the real battle code and pin all three owner requirements; originality of text, names and the jingle.
- **Minor, fixed in the fix wave:** a spell choice was silent when the monster moved first; the battle windows covered the bottom of the backdrop; Tobin's narration contradicted his new line. Two tests were added for a monster-first Heal.
- **Minor, handled here:** the play-test list below describes the heal sound as it now is and includes the spell-against-Run-away listen.
- **Left for the owner:** the stale "10–13 rounds" sentence (question 2).

## Deferred minors

Do before or with Phase 6's Torch work:

- `fieldUse.ts` and `Battle.useItem` treat every effect that is not damage or warp as a heal. A Torch with a new effect kind would answer "You are not hurt." Make both switches exhaustive when a new kind arrives.

Do before Phase 6 moves the Warden into `src/data`:

- `validateActions` lets `NaN` through for `min`, `max` and `cooldown` and accepts a fractional cooldown. Consider validating when a battle starts, not only in a test.
- A monster's Mend reuses the hero's heal sound.

Can stay deferred:

- Task 1: no failing run was recorded before the tests passed; `gainXp`'s `learned` repeats `spellsKnown`'s loop; `LEVELS[i].level === i + 1` is assumed, not asserted; no test combines a levelling reward with used items.
- Task 2: `fieldUse.ts` has two unreachable branches; its tests lack a capped-heal MP check and synthetic-table cases.
- Task 3: the brain does not tick cooldowns on a turn where nothing is eligible (unreachable for validated lists).
- Task 4: three imports from one module in `kit.ts`; the 500-battle test checks monster HP per round, not per beat.
- Task 5: the `rows()` helper is copied into each short song file (standing item from Phase 3).
- Task 6: `battleState.ts` is about 290 lines.
- Task 7: an import cycle explore → menu → fieldResult → explore (harmless today: `ExploreState` is used only inside a closure); the module `fieldResult.ts` shares a name with the `FieldResult` type.
- Task 8: the simulation's healer does not ask `refusal` before choosing a heal item (unreachable with the pinned thresholds); the Warden's level 6 margin depends on the battle's draw order.
- Task 9: the own-name test would report a missing text step unhelpfully.
- Task 10: the failed-give test does not assert the overlay stays open; the give test does not show that one press adds exactly one.
- Not judged, by design: the Items screen is silent on confirming "Nothing" while Spells plays an error (Phase 2 behaviour); debug Give rows can duplicate unique gear and put key items in bag slots; debug rows play a confirm blip and then their own sound.

## Owner play-test for Phase 4 (none of these has been performed by anyone)

Run `npm run dev` from `C:/Projects/VSCode/WarriorsQuest`. Spec §14 list:

- Grind from 1 to 5.
- Learn Heal and Ember; use both.
- Use an Herb mid-fight.

The debug overlay (backquote) has `Give: herb` for when you run out, and `Give: wooden_club` to compare the climb with a weapon (Garrik opens in Phase 5).

Balance (Task 8):

- At level 1 with only the shield, road fights take about three rounds and cost two or three HP; several can be won before a rest at Hesta's.
- At level 1 or 2 the marsh still kills you.
- At level 3, with Heal, a marsh fight is hard but usually won; without casting Heal it is usually lost.
- Say whether road fights now feel fair unarmed, whether the marsh at level 3 feels hard but possible, and whether the climb from 3 to 5 without a weapon is too slow.

Battle screen (Task 6 and the final fixes):

- The battle menu shows Fight / Spell / Item / Run and does not cover the monster, the ground strip or the message window.
- At level 1, Spell says "You know no spells." and the Mireling does not get a free hit.
- Item → Herb: "You use the Herb.", a soft settling sound, HP climbs in the top-left window, then the Mireling takes its turn. The Herb is gone from Items afterwards.
- Win enough fights to reach level 2: the fanfare plays to its end, then a short bright jingle with "You reach level 2." and the stat lines; confirm does nothing until the jingle is over; Status shows the new numbers.
- At level 3: "You learned Heal!"; in the next fight Spell → Heal shows its cost, plays a glittering sound, restores HP and lowers MP in the top-left window.
- Heal at full HP says "You are not hurt." and costs nothing.
- At level 5 (debug Level +1 is fine): Ember hurts the Mireling and never misses.
- Every choice in the battle menu makes a sound at once: either the confirm blip or the action's own sound, whether you or the monster moves first.
- Listen: the spell, heal and level-up sounds are distinct from each other and from the victory fanfare; the spell sound and the Run-away sound are told apart; no clicks.

Field menu (Task 7):

- The menu reads Status / Items / Spells / Equip; Status shows NEXT and nothing is cut off at the bottom of its window.
- Hurt, outside battle: Items → Herb restores HP with the heal sound and the Herb count drops; at full HP it says "You are not hurt." and the Herb stays.
- At level 3 or above: Spells shows MP and Heal with its cost; casting it restores HP and lowers MP.
- At level 5: choosing Ember in the field says "You cannot use that now."
- With the debug overlay at level 8, out on the marsh: Homeward fades you to Hollowmere's gate with the town theme.

Villagers (Task 9):

- Start a new game and talk to all seven; each says their own name in their first line and it sounds like something that person would say; no line carries a "Name:" tag; Tobin still will not meet your eyes.
- Hesta, Garrik and Bram name themselves in the first person or through someone else's words; only Maren and Tobin speak of themselves in the third person.
