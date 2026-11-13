# Phase 6 carry-forward (phase stop for the owner's play-test, 2026-11-13)

> **Commit hashes in this file predate the history rewrite of 2026-11-13 and no longer exist.** The commits are the same, with new hashes; find one by its subject line (`git log --grep="<subject>"`). See "Online" in `docs/superpowers/notes/2026-11-13-phase-6-carry-forward.md`.

Written for the owner's play-test and for the session that acts on its feedback. The plan is `docs/superpowers/plans/2026-11-12-phase-6-the-barrow.md`; the owner approved it and all eighteen of its decisions on 2026-11-13, with changes (second-person "You found Aldric's Journal, Page 1."; Pip's "Mum says"; the journal's Tobin line; a bump sound; deployment prepared and not performed; Phase 5's open questions unchanged).

## Where execution stands

- Branch `phase-6` from `master` (`a318e59`), merged into `master` on 2026-11-13 after the play-test and pushed to GitHub on the owner's instruction.
- **Tasks 1 to 10 complete and reviewed.** The whole-branch review (Opus) found no Critical issue and one Important one (the hero bounced between floors when a key was held through the stairs); one fix wave (`6c53597`, with a follow-up `6b45d88`) fixed it with three smaller items and the test gaps queued from the task reviews.
- Suite at the phase stop: 61 files / 974 tests green; `npx tsc --noEmit` clean; `npm run build` green; the production bundle contains no debug-overlay strings.
- The owner play-tested on 2026-11-13; the changes they asked for are in, the branch is merged and the game is online (see "Play-test result" and "Online").
- Dev server: `npm run dev` from the uppercase path `C:/Projects/VSCode/WarriorsQuest`.

## Play-test result (owner, 2026-11-13)

"Phase 6 works well." Answers and changes, all made on `phase-6` before the merge:

- **Torch:** death puts it out; Homeward leaves it lit. Done (`2c27885`).
- **The item is "Aldric's Journal"** wherever it is listed. Done (`2c27885`). The name is one character too long for the shop's sell row, so key items are now left out of the sell list (they could not be sold anyway).
- **Stairs:** climbing plays a rising figure; going down keeps the falling one. Done (`2c27885`).
- **Fight length:** 14.4 rounds at level 6 accepted.
- **Warden sprite:** the bare left arm read as detached; both arms now join the body at the shoulders and roughly mirror each other. Done (`2c27885`).
- **Play time:** a total counter, saved as an optional field (old saves load with 0), shown as `TIME h:mm` in Status. It counts update steps while a game is in progress: not on the title screen, not during name entry, and not while the tab is hidden. Done (`e008537`).
- **Pacing report:** below.
- Then, on the owner's instruction: merge into `master`, a public GitHub repository `heir-of-the-barrow`, and GitHub Pages. See "Online" at the end of this file.

**Owner checks for these changes, not performed by anyone:** the Warden's arms read as attached; climbing sounds rising and descending sounds falling; the item reads "Aldric's Journal" in Items and is absent from the shop's Sell list; after dying with a lit Torch a new one can be lit in the Barrow; Status shows TIME, and it advances by a minute after a minute of play, stays still on the title screen and while the tab is hidden, and carries on after save, reload and Continue; a save made before this change still offers Continue and shows TIME 0:00.

Questions 1 to 4 below are answered by this.

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

## Pacing estimate: a natural playthrough without debug

Requested by the owner after the play-test (they levelled with debug). This is arithmetic from the encounter rates, rewards and prices in the game data, not a recorded playthrough. The fight counts are firm; the minutes rest on two assumptions that nobody has timed: about 20 seconds for a road fight and 30 for a marsh fight, walking included.

How often fights come (a step takes 8 frames; three quiet steps follow every fight):

| Ground | One fight per | Monster | XP | Gold |
|---|---|---|---|---|
| Road | about 35 steps | Mireling | 2 | 2–4 |
| Grass | about 19 steps | Mireling | 2 | 2–4 |
| Marsh and hills | about 14 steps | Bog Mireling | 7 | 6–10 |
| Barrow floor | about 24 steps | Barrow Mireling | 18 | 12–18 |

Levels, for a player who fights Mirelings to level 3 and then moves into the marsh (which the balance tests open at level 3):

| Reach | XP | Fights for this step | Fights in all | Minutes in all (estimate) |
|---|---|---|---|---|
| Level 2 | 8 | 4 Mirelings | 4 | 4 |
| Level 3 | 22 | 7 more Mirelings | 11 | 7 |
| Level 4 | 50 | 4 Bog Mirelings | 15 | 10 |
| Level 5 | 105 | 8 more | 23 | 15 |
| Level 6 | 210 | 15 more | 38 | 25 |
| Level 7 | 420 | 30 more in the marsh, or 12 in the Barrow | | |

- The minutes include about three for the opening, the town and the first shopping trip, and a walk back to the inn every five or six fights.
- The Barrow run itself (the road, 64 steps of corridor plus the chest detours, about five fights, the Warden at about 14 rounds) adds roughly 8 to 10 minutes. A first clean run from New Game to the journal page comes to about 35 minutes; each death adds the walk back.

Gold (start 40; average 3 per Mireling, 8 per Bog Mireling; chests 40 in the copse and 90 in the Barrow):

| When | Gold in hand | What it buys |
|---|---|---|
| Start | 40 | Wooden Club (30), leaving 10 |
| Level 3, after 11 fights | about 43, less 6 for each night at the inn | Iron Knife: 60, or 45 after trading in the Club. One to three more fights away. |
| Level 3, with the copse chest | about 83 | Iron Knife at once, leaving about 38 |
| Level 4, fight 15 or so (with the copse chest) | about 70 | Leather Armor (70) |
| Late level 4, fight 23 or so (without the chest) | about 72 | Leather Armor (70) |
| Level 5 to 6, 15 fights | about 120 more | Herbs (10 each), Torches (8 each), inn nights; about 70 to 100 left over |

- **Iron Knife:** affordable at about level 3, twelve to fourteen fights in, sooner with the copse chest.
- **Leather Armor:** affordable at level 4 with the copse chest, or just before level 5 without it. Each inn night (6 gold) pushes it back by about one fight.
- **Bronze Sword (180):** not affordable from battle gold by level 6 (about 330 gold earned in all, about 145 spent on the Club, Knife and Armor, the rest on Herbs, Torches and the inn). It comes from the Barrow's second floor, as designed. That means a level 6 hero walks into the Barrow with the Iron Knife and fights the first floor's Mirelings with it (measured at level 5 with the Knife: 95% wins but 21 HP a fight; level 6 is easier but was not measured with the Knife). The whole-trip balance test assumes the Sword from the start of the trip, so it is kinder than a real first descent.

What stands out:

- **Level 5 to 6 is the long stretch:** fifteen marsh fights, about eight minutes, with nothing new to buy once the Armor is on. The Barrow is the alternative (six Barrow fights give the same XP) but is hard at level 5.
- **Levels 1 to 3 are eleven fights against the same monster** for 2 XP each. Short (about four minutes of fighting), but the least varied part.
- **The copse chest matters:** it moves the Armor forward by about eight fights.

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

## Online (done 2026-11-13, on the owner's instruction)

- `phase-6` was merged into `master` with `--no-ff` (`dd1d3e0`).
- Public repository: https://github.com/m4polito/heir-of-the-barrow (`origin`); `master` pushed.
- GitHub Pages' source is "GitHub Actions". **Live at https://m4polito.github.io/heir-of-the-barrow/**
- The first workflow run tested and built, then its deploy step was refused: "Branch master is not allowed to deploy to github-pages due to environment protection rules." The `github-pages` environment allows only `main` by default. Fix: `master` was added to that environment's allowed branches (a repository setting, no code change) and the failed job was re-run; it passed. The published script is the same build as the local one.
- Every later push to `master` tests, builds and publishes again.
- **History rewrite (2026-11-13, the owner's instruction).** The first push published the owner's personal email as author and committer of every commit. All 121 commits on `master` were rewritten to the owner's GitHub noreply address (file contents unchanged, `Co-Authored-By` trailers untouched), the merged `phase-*` branches were deleted, and `master` was force-pushed. Because GitHub still served the old commits by hash, the repository was then deleted and recreated under the same name, with Pages' source and the `master` environment rule set again; the first run of the new repository built and deployed, and the old hashes no longer resolve through GitHub's API. This repository's `user.email` is now the noreply address.
- **Every commit hash written in these notes and plans before the rewrite is gone.** The merges are now: Phase 3 `857937e`, Phase 4 `5065793`, Phase 5 `6baba09`, Phase 6 `0943401`.
- The workflow log warns that the actions it uses run on a Node version GitHub is retiring; raise their major versions when new ones are out.

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
