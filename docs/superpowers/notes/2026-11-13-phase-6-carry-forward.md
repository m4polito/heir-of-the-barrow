# Phase 6 carry-forward (phase stop for the owner's play-test, 2026-11-13)

Written for the owner's play-test and for the session that acts on its feedback. The plan is `docs/superpowers/plans/2026-11-12-phase-6-the-barrow.md`; the owner approved it and all eighteen of its decisions on 2026-11-13, with changes (second-person "You found Aldric's Journal, Page 1."; Pip's "Mum says"; the journal's Tobin line; a bump sound; deployment prepared and not performed; Phase 5's open questions unchanged).

## Where execution stands

- Branch `phase-6` from `master` (`a318e59`). **Not merged, not pushed. The repository has no git remote and none was added.**
- **Tasks 1 to 10 complete and reviewed.** The whole-branch review (Opus) found no Critical issue and one Important one (the hero bounced between floors when a key was held through the stairs); one fix wave (`6c53597`, with a follow-up `6b45d88`) fixed it with three smaller items and the test gaps queued from the task reviews.
- Suite at the phase stop: 60 files / 936 tests green; `npx tsc --noEmit` clean; `npm run build` green; the production bundle contains no debug-overlay strings.
- **Next step: the owner's play-test** (list at the end of this file), then fixes from the feedback, then merge. Putting the game online waits for the owner.
- Dev server: `npm run dev` from the uppercase path `C:/Projects/VSCode/WarriorsQuest`.

## Balance: measured with the real battle code

`test/balance.test.ts`, seeded; 4000 fights per case, 2000 trips per trip case. Every threshold passed on the first run; no number, threshold, policy or seed was adjusted.

| Case | Before | Now | Target |
|---|---|---|---|
| Warden won at level 4 / 5 / 6 / 7 (intended gear, three Herbs) | 0.6% / 30% / 80% / 93% | 0.6% / 41.0% / 90.4% / 94.3% | under 3 / under 50 / over 70 / over 90 |
| Warden fight length, won fights, level 6 / 7 | about 19 / 18 rounds | 14.4 / 12.7 rounds | at most 15.5 / 13.5 |
| Barrow Mireling, level 6 in full gear | 16 HP lost per fight | 100% wins, 3.5 rounds, 9.5 HP lost | at least 99%, at most 4 rounds, at most 11 HP |
| Barrow Mireling, level 5 / level 4, Iron Knife | | 95.2% / 22.6% wins | at least 85% / under 40% |
| Whole trip: four Barrow fights, then the Warden, level 5 / 6 / 7 | | 8.3% / 83.1% / 93.3% | under 30 / at least 75 / at least 88 |

- The Warden is HP 52, ATK 26, DEF 16; Mend heals 10–16 with a 4-turn wait. The Barrow Mireling is HP 22, ATK 16, DEF 12.
- Round counts include the turns the hero spends healing. The spec aimed for 10 to 13 rounds; level 7 is inside that and level 6 is one round over.
- The shortest walk from the Barrow's mouth to the Warden is 64 steps (36 on floor 1, 28 on floor 2), which at the Barrow's encounter rate is about three fights.

## Questions for the owner

1. **Torch after death.** A lit Torch keeps burning through a death or a Homeward: you wake at Maren's with steps left, and a new Torch cannot be lit until they are walked off in the dark. Leave it, or put the Torch out on death?
2. **The page's name.** Items lists it as "Journal Page"; the line that finds it says "Aldric's Journal, Page 1." Rename the item to match?
3. **The stairs sound** is one falling figure used both going down and climbing up. Fine, or should climbing rise?
4. **Round count at level 6** is 14.4 against the spec's 10 to 13. Accept, or tune further after you have played it?
5. Still open and unchanged, by your instruction: the shop's price wording; level 2 heroes having an even chance in the marsh with one Heal; Torches on sale before the Barrow.
6. Still open from Phase 4 and not asked again: whether the road being unable to kill a shielded hero is right; the heal sound; the spell sound against the Run-away sound; Tobin's shortened narration; the battle window position.

## Rulings made during execution

Each line: what was decided, why, and what it costs if wrong.

- Tasks ran in the order 1, 2, 9, 3, 5, 4, 6, 7, 8, so each review of the map screen finished before the next task changed it. Cost: none.
- The songs were written before the maps, so the maps used the Barrow's song from the start. Cost: none.
- The sealed door's line was added with the maps (Task 4), not with the rest of the copy (Task 7), so no commit could crash on confirm at the door. Cost: none.
- The Warden's drums are kick, kick, snare, kick. The plan asked for a kick on every beat and a snare on beat 3; one noise voice cannot play both at once. Cost: none.
- The Barrow's drone is three long held notes, not one restarted every bar, and the Warden's bass notes each stop a row early so they read as beats. Why: the audio review's advice on ticks and articulation. Cost: the owner may hear it differently; both are one-line changes.
- On a dark map the hero is drawn after every villager, so the darkness can sit between them. No dark map has villagers. Cost: a villager added to a dark map later would always draw under the hero.
- A step that lands on a warp still burns one Torch step. Cost: none.
- The torch running out stops the hero (review fix). Before the fix, a held key started another step underneath the line.
- **After a warp, the hero's first step off the arrival tile cannot land on another warp tile while the key is still held, and that refusal is silent** (no bump). Releasing the key, or taking one step anywhere else, ends it. Why: holding Up through the stairs carried the hero straight back, over and over. My first form of this rule lasted until every key was released; the re-review showed it would stop a player who holds Down from the elder's house one tile short of the town gate, so it was narrowed (`6b45d88`). Cost: pushing at a stair you have just used does nothing until you let go of the key.
- Recorded, not reachable with today's data: a chest or shop holding a key item the player already has would report success and add nothing.
- **A key item already held is not added again.** Why: the debug flag row could produce a second journal page, and more than eight key entries would have made a save unreadable. Cost: a later key item meant to stack would need this revisited.
- The reviewer's suggested data rule (no warp next to an arrival point in the walking direction) was not added: the lock above makes such layouts safe, and the town gate already has one. Cost: none.
- The trip tests give level 5 and level 7 heroes the same gear as the Warden band tests (Bronze Sword). Cost: none; it is the plan's "intended gear".
- Task 1's code was written before its tests, so no failing run was recorded for it; the reviewer checked that each new test fails against the old code.

## Final review (Opus, whole branch) and what was done

- **Traced and found sound:** a full run from New Game to reading the page and saving; one key press does one thing at every hand-off; no stray screen left on the stack; each chest pays once and a refused chest opens later; the Warden cannot be fled, bypassed or fought twice, and a loss restores it; the page cannot be missed (it is given before any menu or save can be reached); songs start once and never over a jingle; death and Homeward from the Barrow lose and duplicate nothing; a Phase 5 save still loads and a save with a lit Torch, opened chests and the page beside a full pack restores identically; darkness draws correctly at map edges and under fades; the Torch and the page are not offered in battle; the engine names no story content; the production bundle has no debug strings and uses relative paths; nothing in the new copy, art or music resembles a published game as far as data shows.
- **Important, fixed:** the stairs bounce.
- **Minor, fixed:** floor 1's way out played the door sound; a second journal page through the debug row; test gaps.
- **Left for the owner:** questions 1 to 3 above.

## Deferred minors

From this phase:

- The bump sound infers "refused" from "a key is held and the hero is not stepping" except for the arrival lock, which is explicit. A turn-in-place delay added later would need the step code to report refusals.
- A villager standing directly behind a chest or a look tile would take the confirm. No map has this.
- `explore.ts` is past 420 lines; the chest rules could move to their own module.
- The chest art's two wood letters share one colour.
- Off-map bump and confirm mashed mid-text on a chest have no test; the stairs sound's test checks notes and lengths only.
- `bar()` is copied into each song file.
- `build.test.ts` matches `npm test` and `npm run build` anywhere in the workflow text.
- The debug overlay's flag row is wider than its window (dev builds only).
- Small test-robustness notes on `debugState.test.ts`, `barrow.test.ts` and `battleState.test.ts` are in the SDD ledger.

Still open from earlier phases: the "Can stay deferred" list in `docs/superpowers/notes/2026-11-12-phase-4-carry-forward.md` and the deferred minors in `docs/superpowers/notes/2026-11-12-phase-5-carry-forward.md`.

## Putting the game online (not done; the owner's to do or to order)

The workflow `.github/workflows/pages.yml` and `README.md` are in place. Nothing has been created or pushed.

1. Create an empty GitHub repository.
2. `git remote add origin <its URL>` and push `master` (after this phase is merged).
3. In the repository's settings, set Pages' source to "GitHub Actions".
4. The workflow tests, builds and publishes on each push to `master`; the game appears at `https://<user>.github.io/<repository>/`.

## Owner play-test for Phase 6 (none of these has been performed by anyone)

Run `npm run dev` from `C:/Projects/VSCode/WarriorsQuest`. Spec §14: **a full run from New Game to the journal page; note which fights felt too easy or too hard.**

A caution about the debug overlay's new row, `Flag: warden_defeated`: Maren saves when you say Yes to her. If you switch the flag ON to read the townsfolk's after-lines, switch it OFF again before talking to Maren, or do that check in a throwaway New Game. Otherwise the save holds the flag without the page.

Bump and chests (Task 2):

- Walking into a wall, water or a villager gives a short low thud that repeats slowly, not as a rattle, while the key is held.
- The chest in the marsh copse reads as a chest on grass, opens with its own sound, pays 40 gold once and then shows open.

Darkness and the Torch (Task 3):

- In the Barrow you see one tile around you; lighting a Torch from Items widens it to three with a small flare sound.
- Walking 200 steps ends it with a line of text.
- A Torch cannot be lit in town.

The two floors (Task 4):

- Walk from the gate to the mound and step onto it: fade, and you stand inside in the dark.
- Walls, floor, stairs, chests and the sconces read clearly at one tile of light and at three. The hero's outline and the floor are both black, and the hero's cloak shares a colour with the walls: say whether the hero stands out.
- The way to the stairs can be found without a Torch but is easier with one.
- The sword's corridor feels like a detour worth taking.
- Stairs play a descending sound, including the way out of floor 1.
- Hold Up while taking the stairs: you arrive once and stay; let go and press again to go back. Walking through a town door while holding the key still carries you on, and leaving the elder's house holding Down walks you down the road with no silent stop (Bram stands on the road by the gate, as before).
- Barrow fights show a stone backdrop.
- No chest or stair is hidden in a way that needs luck.

Songs (Task 5):

- The Barrow's song is sparse and uneasy and loops without a seam or a click; the low drone can be heard on your speakers and does not tick.
- The Warden's song is recognisably the battle theme's tune, slower and heavier, and not much louder than the battle theme.
- Neither reminds you of a tune from another game.

The Warden (Task 6):

- The Warden reads as a dead thing in someone else's armor and is clearly bigger than a Mireling. Look at its bare left arm: say whether it reads as attached.
- It does not overlap the stat window or the message window.
- Its song starts with the fight; "Run" never works.
- When a monster mends itself, the sound differs from the hero's Heal.
- After winning, the fanfare and level-up jingle play in turn and then the page is found; walking over its tile again does nothing.

Copy (Task 7):

- With the debug flag row switched on (see the caution above), talk to the townsfolk and read the after-lines; each still sounds like that person and nobody declares the Dimming over.
- Hesta's longer inn question fits its window.
- The journal reads as Aldric and leaves you wanting the next page.
- The door's line appears when you face it.

Balance (Task 8):

- At level 6 with the Bronze Sword, Leather Armor and a few Herbs, the walk to the Warden costs some HP and MP but leaves enough to fight.
- The Warden fight is tense and over in a dozen or so rounds.
- At level 5 it usually kills you.
- Say which fights felt too easy or too hard.
