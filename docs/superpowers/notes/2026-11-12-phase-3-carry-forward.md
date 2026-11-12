# Phase 3 carry-forward (phase stop for the owner's play-test, 2026-11-12)

Written for the owner's play-test and for the session that acts on its feedback. The plan is `docs/superpowers/plans/2026-11-12-phase-3-out-the-gate.md`; the owner approved it and all eleven of its decisions on 2026-11-12.

## Owner's play-test result (2026-11-12) and what Phase 4 inherits

The owner played the build: everything worked; the one complaint is that monsters are too strong (dying easily; the marsh is hopeless at level 1). Answers to the five questions below:

1. Keep the confirm wait after a win or death.
2. Monsters are too strong. Done on this branch: Hesta gives a free full rest when spoken to (a dialog `heal` effect), until Phase 5's inn replaces it at 6 gold. **Required in the Phase 4 plan:** a balance pass with a simulation test covering the early curve:
   - an unarmed level 1 hero loses no more than about 3 HP per road Mireling on average;
   - a level 3 hero with Heal survives marsh fights more often than not;
   - the spec §9.8 Warden targets stay as they are.
3. Keep the current battle and marsh melodies.
4. The commit trailer names the model that wrote the commit; `CLAUDE.md` now says so. Phase 4 implementer briefs must tell each implementer to use its own model's name.
5. The Bog Mireling's shade is now dark green (palette 21) instead of deep teal (19), so it differs from the murk water. Owner look check, not performed: it reads against the murk strip. If not, palette 4 (blue) is the stronger alternative.

Also done before the merge: the parked sequencer test now ends its rows with `'off'` and asserts the `loopFrom` message; removing the rule was shown to fail it. The rest of this file is the record as it stood at the phase stop.

## Where execution stands

- Branch `phase-3` from `master` (`fb5daed`). **Not merged, not pushed.**
- **All 10 tasks complete and reviewed.** The whole-branch review (Opus) found no Critical issues, two Important and six Minor; one fix wave (`33c6f73`) addressed them; see "Final review" below.
- Suite at `33c6f73`: 42 files / 452 tests green; `npx tsc --noEmit` clean; `npm run build` green; the production bundle contains no debug-overlay strings.
- **Next step: the owner's play-test** (list at the end of this file), then fixes from the feedback, then merge. Phase 4 does not start until the owner says so.
- Dev server: `npm run dev` from the uppercase path `C:/Projects/VSCode/WarriorsQuest`.
- Confirmed before starting: the two Phase 2 pre-merge changes are on `master` (title *Heir of the Barrow* / subtitle *The Dimming*, `698dc07`; cancel ends a dialog and still applies its effects, `69d74cd`), so no Task 0 was needed.

## Questions for the owner

1. **Wait after a win or a death.** Confirm is ignored until the victory fanfare (2.4 s) or the fallen phrase (2.5 s) has finished, so the music is never cut off. Too long? The alternative is to let the player move on at once and have the next song wait for the short one to end.
2. **Early fights without shops or healing.** Measured over 5000 simulated fights: an unarmed level 1 hero with the shield needs about 6 rounds per road Mireling and loses about 5 of 15 HP per win; that hero never beats a Bog Mireling; the marsh begins 5 tiles from town. With the Wooden Club (not buyable until Phase 5) it is about 3 rounds and 2.5 HP, as the design intends. Is this acceptable for a Phase 3 build, using the debug overlay's Level +1 and Full heal, or should something move earlier (for example Maren healing you when you talk to her)?
3. **Battle and marsh melodies.** Both were reworked once after review (more development of the battle hook; octave leaps and an audible echo in the marsh tune). The first versions are in git at `e1e5f3d` if you prefer them. The battle melody climbs to C6 and may sound shrill.
4. **Commit trailer.** Every commit on this branch carries `Claude Fable 5.2`, including those written by Sonnet implementers, because the session is Fable's and the plan pinned it. If "the model actually running the session" should mean the model that wrote the commit, say so for Phase 4.
5. **Bog Mireling on the murk strip.** Its shade colour is the same deep teal as the murk water, so its puddle merges into the ground. Intended look, or change one of them?

## Rulings made during execution

Each line: what was decided, why, and what it costs if wrong.

- Test fixtures set the hero's strength directly and pick any random seed that gives the stated outcome; the plan's "attack 50 (level raised with applyLevel)" was self-inconsistent. Cost: none.
- Commit trailer is `Claude Fable 5.2` on every commit (question 4). Cost: trailer text.
- Battle backdrop strips put the ground at row 8 of 24; the plan placed the monster 8 px into the strip but never said where the ground was, and the first strips left it floating. Cost: redraw two strips.
- `Beat` lives in `beats.ts`, so its sound id was tightened there, not in `battle.ts` as the plan said. Cost: none.
- Three musical items from the song review were sent back for a fix round although the reviewer rated them Minor (battle motif development, marsh octave leaps, marsh echo), because the owner cares most about music and Phase 6 quotes the battle motif. Cost: the owner may prefer the first version (`e1e5f3d`).
- A battle message whose song id is missing from the song table is skipped silently, while entering a battle asserts the battle song exists. Cost: a missing victory or fallen song would go unnoticed; the song tests pin all three.
- The plan's "won" test could not catch a missing grace reset after a battle; Task 10 replaced it with one that walks into the battle and back, and added a "fled" test. Cost: none.
- Task 10's code was done by the implementer; this note and the plan's ticks were written by the orchestrator. Cost: none.
- Final review: one-shot songs block confirm until they finish (question 1) rather than queueing in the sequencer. Cost: shorten the hold or build the queue.
- Final review: battle text is wrapped once and revealed across the wrapped lines; the plan's wording made words hop between lines. Cost: none.
- Final review: no confirm blip when Run is chosen, because Run's own result sound follows at once and would cut it. Cost: one line.

## Final review (Opus, whole branch) and what was done

- **Checked and found sound:** every combat formula against spec §9.3–9.6 and the monster table against §10.5; equipment counted in battle stats; the state stack across title, naming, walking, gate, encounter, battle, win, flee, death and respawn (no input leaks, nothing firing twice, no stranded transition; the menu, debug overlay and dialog cannot overlap an encounter); the music hand-offs (no click paths found in code); the story-free rule; town-to-overworld warps in both directions; Bram cannot block the gate; originality of text, names, art and melodies.
- **Important, fixed:** the victory fanfare and fallen phrase were cut off by a prompt confirm; battle text re-wrapped while typing.
- **Minor, fixed:** Run's confirm blip was cut off; the monster vanished on the killing blow without its flash; an unknown backdrop now fails when the battle starts; debug gold respects the 65535 cap; non-looping songs must end every pitched track with `off`; tests count that the fanfare and fallen phrase start exactly once.
- **Fixed by the orchestrator:** a blank line lost from `CLAUDE.md`.
- **Re-review of the fix wave (Opus):** seven of the eight items confirmed fixed with no new breakage in the game code; one test-only item is left open and parked (first line under "Fix wave" in the deferred list below).

## Deferred minors (from per-task reviews; the final review ruled none must be fixed before merge)

- Task 1: the statistical strike test mixes in dodge; `settleBattle` has no NaN guard.
- Task 2: the "monster first" test asserts only the first message.
- Task 3: no failing run was recorded before the monster tests passed; unneeded non-null assertions; the Mireling has six drip marks where three to five were asked for.
- Task 4: the sound-effect table mixes a helper and literal objects; the hero-hit test does not assert the triangle's volume.
- Task 5: song helper functions are copied into each song file; the battle header's chord chart still prints "E" for two bars that are E7; the marsh echo test would pass if the echo were deleted.
- Task 6: no test at the exact weight boundary; negative weights are not rejected.
- Task 7: the barrow, town and hill tiles use five colours counting grass (spec says three or four; same standing item as the hero sprite); a second dead willow stands at (31, 16).
- Task 8: `rearm` is not asserted; screen size is written as literals in one place; a redundant field.
- Task 9: the order "opening scene before death dialog" is untested (it cannot happen today); border-tile drawing is untested; a private method shares a name with an exported function.
- Task 10: the debug tests read a private method through a cast; the fled test assumes Run is the second menu row.
- Fix wave (parked after its re-review; do this first when the branch is next touched): `test/sequencer.test.ts`'s "rejects loop: false with loopFrom" fixture ends on a note, so it now throws the new "must end with 'off'" error first and no longer tests the `loopFrom` rule. Change its rows to end with `'off'` and assert the `loopFrom` message. Also from that re-review: the two "song plays to its end" tests would still pass with a hold 12 to 30 frames short.
- Not judged, by design: debug Level ±1 overwrites earned XP with the level's threshold (levelling is Phase 4); a stalled browser tab can still schedule late music rows (Phase 2 item, undated).

## Owner play-test for Phase 3 (none of these has been performed by anyone)

Run `npm run dev` from `C:/Projects/VSCode/WarriorsQuest`. Spec §14 list:

- Leave town.
- Get into fights; win some; run from some.
- Die once and wake up at Maren's with half your gold.

Leaving town and the overworld (Task 7):

- Walk down through Hollowmere's gate past Bram; fade; arrive on the overworld just below a small town icon with the marsh theme playing.
- The map scrolls with the hero centred; water, not black, shows past the map's edge.
- Marsh, hill, town, barrow mound and dead willow each read clearly at 1×.
- Follow the road north-east past the dead willow to the barrow mound (it cannot be entered yet).
- Walk back onto the town icon and arrive inside the gate facing up with the town theme.

Fights (Tasks 8 and 9, and the final fixes):

- Walk the road outside town: after a few steps the music cuts, a sharp sting plays, the screen fades to black and the battle screen fades in as the battle theme starts. No fight ever starts on the first three steps out of the gate or right after a fight.
- Battle screen: a pale Mireling stands on a grass strip (its feet on the ground, not floating); your name, HP and MP are top-left; the message types out, then Fight / Run appears. Messages move on by themselves; confirm hurries them. Words never jump from one line to the next while typing.
- Fight: the Mireling blinks and a hit sound plays when you strike it, including on the killing blow; the screen shakes and a thud plays when it strikes you; your HP drops as the message appears; a miss has its own soft sound.
- Win: the fanfare plays through to its end, "The Mireling is defeated." then the experience and gold line; confirm fades back to the map; the marsh theme starts again; Status shows the new gold and XP.
- Run: choose Run; either "You got away." with a quick rising sound and back to the map, or "The Mireling blocks the way!" with a falling sound and it attacks.
- Walk into the marsh tiles: fights are more frequent, the Mireling is teal on a murky strip, and it hits much harder.
- Die there: "You have fallen." with a short falling phrase that plays to its end; a slow fade; you wake in Maren's house facing her at full HP; she speaks (and does not say where you fell); your gold is half what it was; the town theme plays. Talking to Maren again gives her normal lines.
- Listen: the marsh theme (walking pace, lonely, an echo answering each phrase, loops cleanly), the battle theme (fast, tense, the intro is not repeated on the loop, not shrill), the encounter sting, no clicks at any music change.
- With the debug overlay's encounters OFF, no fights happen.

Debug and art (Tasks 3 and 10):

- Open the debug overlay and use `Fight: barrow_mireling` to see the third colour; the Mireling's three colours read as one creature in three places, and it reads as a slumped figure, not a blob.
- Say whether unarmed level 1 fights feel too slow before shops exist (question 2).
