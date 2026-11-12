# Phase 5: Commerce and Rest — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garrik and Odo sell and buy; Hesta's bed costs 6 gold and plays a sleep jingle; Maren saves the game and the title screen offers Continue; a yes/no question shows its text and its answers in one window; balance tests confirm that a level 1 hero who spends the starting gold on the Wooden Club clears road fights comfortably.

**Architecture:** Shops, the inn and saving are all reached from inside a villager's dialog script through four new script steps (`shop`, `pay`, `rest`, `save`), so every keeper's greeting and farewell stay plain story data. `DialogState` performs `pay` itself and hands the other three to a small services object that `ExploreState` supplies, because only the map screen knows the map song and the hero's position. Shop rules and the save format are pure modules with their own tests; `ShopState` and `SleepState` are thin screens over them.

**Tech Stack:** TypeScript 5, Vite 6, Vitest 3 (node), Canvas 2D, Web Audio. No runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-11-11-the-dimming-vertical-slice-design.md` (§5.2, §7, §8, §10.3, §10.4, §11, §12.3, §12.4, §14 Phase 5, §15). Carry-forward: `docs/superpowers/notes/2026-11-12-phase-4-carry-forward.md`; the two-press "Equip it?" item is from `docs/superpowers/notes/2026-11-11-phase-2-carry-forward.md`.

## Execution

- Branch `phase-5` from `master` (`b9bb042`). Subagent-driven, as in Phase 4: Sonnet 5.5 implements and reviews ordinary tasks; Opus reviews audio (Task 5), integration (Tasks 4, 5, 7) and the whole branch; the orchestrator (Fable) reviews the dialog copy (Tasks 4, 5, 7), the inn jingle's written harmony (Task 5) and the balance numbers (Task 8).
- Before Task 1, the orchestrator commits this plan on the branch and points `CLAUDE.md`'s "Current plan" line at it.
- Gated: stop after Task 9 for the owner's play-test. Do not start Phase 6.
- Owner's answers to the open Phase 4 questions (2026-11-12): the Warden's margins are accepted as measured and revisited in Phase 6 tuning; the roughly 20-round Warden fight is accepted for now and must be flagged in the Phase 6 plan as a tuning target (the spec aimed for 10 to 13 rounds); the level table matched Dragon Warrior's and is replaced by an original curve in Task 0.
- Carried in from the Phase 4 play-test (owner, 2026-11-12): the game is tough without a weapon, so an early weapon is the priority (decisions 16 and 17, Task 8); Hesta's free rest ends and the 6-gold inn returns with its original lines (decision 9, Task 5); the two-press "Equip it?" is fixed together with the shop's equip prompt (decision 8, Task 1).

## Decisions made in this plan (owner approved all eighteen on 2026-11-12, and added Task 0)

Numbers below were measured with the real battle code, 20000 fights per case.

Shops:

1. **A shop opens from inside its keeper's lines: greeting, shop, farewell.** Garrik and Odo keep every line you approved in Phase 4; only the order changes, and no new shopkeeper copy is written. Garrik: his name line and "You may need what a fool needs. Look over the racks." before the shop; "He left a wife and a child for a hole in the ground." and "I will not make that mistake. I make blades and sleep sound." after it. Odo: his name line before; "Prices climb with the Dimming. I did not set them. The cold did." after. Cancel during the greeting leaves without opening the shop; cancel during the farewell just ends it.
2. **The shop menu is Buy / Sell / Leave** with a small gold window under it. Cancel on the menu leaves.
3. **The shop's own wording is the same for both keepers** (the price question, the refusals, the sale offer). The exact copy is in Task 4. If you want each keeper to have his own wording, that is extra data, not a redesign.
4. **Either shop buys anything it can, at half price rounded down.** Aldric's Shield and key items cannot be sold ("I cannot buy that."). Gear you are wearing is not on the Sell list; take it off first.
5. **One of each piece of gear**: "You already carry one." counts what you are wearing as well as the pack. Herbs and Torches stack as now.
6. **With a full pack, gear can still be bought if you wear it at once**; the piece it replaces is traded in for its sale price (spec §11.1's "the shop offers to buy it"). If the old piece cannot be sold (Aldric's Shield), the purchase is refused with "You cannot carry more."
7. **Odo sells Torches now**, as his line says, although a Torch does nothing until Phase 6.

Questions:

8. **A yes/no question shows its text and Yes / No in one window.** The question types out as other lines do; Yes and No appear side by side under it when it finishes; a confirm while it is still typing only finishes the typing; the cursor starts on Yes. "Equip it?" in the Items screen becomes one of these, and so do the shop, inn and save questions.

Inn:

9. **Hesta's lines.** Her Phase 4 name lines stay first; her original Phase 2 price lines return with "Stay?" added; the morning, "no" and "not enough gold" lines are new and mine:
   - Before the Warden: "As sure as my name is Hesta, you look more like him every day." / "Aldric drank his last cup in this room. He laughed the whole time." / question "A bed is 6 gold, if you need one. Stay?" — morning "Morning. You slept like a stone. He never could." — no "Then mind the road. The bed will keep." — short of gold "That is not 6 gold. Come back when you have it."
   - After the Warden: "You came back. Sit. I told myself: Hesta, that one will want feeding." / "Your father never did come through that door again." / question "A bed is still 6 gold, and I will not hear otherwise. Stay?" — morning "Morning. Eat before you go. I mean it." — no "Then sit a while anyway." — short of gold "That is not 6 gold. I said I will not hear otherwise."
   - The spec's sample morning line ("You look more like him every day.") is not used because her greeting already says it.
10. **Sleeping takes about 3.7 seconds and cannot be skipped**: fade to black, the jingle, fade back in, then the town theme starts again from its beginning.
11. **The inn jingle** is 3 seconds in F major, soft, one bar each of F, B flat, C and F (Task 5 has the notes).

Saving:

12. **Maren asks "Shall I remember your journey?" straight after her first line**, so a save is a few presses; her other lines follow the answer. Yes: a confirm sound and "It is written." If the browser refuses to store it: "The page will not take the ink. Nothing was written." Her line "Rest here when you need to. I will keep the lamp lit." becomes "Come back when you need to. I will keep the lamp lit.", because rest now costs gold at the inn and she does not heal you.
13. **The save holds what spec §11.3 lists, with two differences.** The mute setting stays in its own storage entry, where it has been since Phase 2 (it must apply before Continue is chosen). Strength, agility and the HP and MP maximums are not stored; they are rebuilt from the level. Torch steps are written as 0 until Phase 6 uses them, so the format does not change then.
14. **Continue appears only when a readable save exists**; it is listed above New Game with the cursor on it. A damaged save is ignored, not deleted. New Game does not erase the old save; the next save at Maren's replaces it.
15. **Nothing saves automatically.** Reloading the page after a death returns you to the last save, which undoes the gold loss. This is how the classic behaves; say if you want death to write the save.

Balance:

16. **No monster or hero numbers change.** The Wooden Club already does what the play-test asked for: a level 1 hero with the Club and the shield beats a road Mireling in 2.2 rounds and loses 1.5 HP (unarmed: 3.1 rounds, 2.3 HP). Buying it leaves 10 gold, enough for one night at the inn or one Herb. At level 3 with the Club the marsh is won 92% of the time without Heal and nearly always with it (unarmed: 29% and 83%); at level 2 with the Club it is still lost four times in five. Task 8 pins these.
17. **Maren's opening scene gains one line that points at the forge**: "Take your coin to Garrik's forge before you try the gate." It goes after "It is dented, and it is yours."

Level table (added by the owner on approval; numbers chosen by the orchestrator with a scratch simulation, 6000 fights per case over six seeds):

- **Task 0 replaces the level table with an original curve of the same overall shape.** Every XP threshold changes, every row's stats change, and every spell moves: Heal to level 2, Ember to level 6, Homeward to level 9. Heal cannot move later, because the level 3 marsh target needs it. A few single cells still equal the old ones (strength 4, 5 and 7 at levels 1 to 3) because the road and marsh targets depend on them. With the new table every Phase 4 target and every Task 8 target passes: road unarmed 3.1 rounds and 2.3 HP; marsh at level 3 with Heal 87%; Warden 0.6% / 30% / 80% / 93% at levels 4 to 7. One side effect: a level 2 hero now has Heal, so with the Club and one Heal the marsh is won about 54% of the time at level 2 (9% without casting).

Records:

18. **The design doc is updated to match** (§8.2 script steps, §11.1 to §11.3), since it is the source of truth.

## Global Constraints

- No runtime dependencies. All art, text and music are TypeScript data; everything original. No shop, inn or save text from Dragon Warrior: never "thou", "thee", "thy", "hath", "dost", "Good morning. Thou seems to have spent a good night", "I shall see thee again", "imprint", "deeds". Use the copy pinned in Tasks 4, 5 and 7.
- 256×240 logical, 16 px tiles, 8×8 font. Message window 4 lines × 28 characters at `(8, 176, 240, 56)`.
- Keys unchanged. Interactions stay one-button.
- **Story-free engine:** nothing under `src/engine/`, `src/game/`, `src/ui/` names a story character, place, monster, item, spell, shop or flag, or imports `data/items`, `data/maps`, `data/dialog`, `data/songs`, `data/story`, `data/monsters`, `data/spells`, `data/shops`. Story tables reach game code through `Game`. Shop ids and the sleep song id arrive from dialog data. The save key is built from `story.storagePrefix`.
- **Stack discipline** (unchanged): a state that ends itself is removed by identity (`stack.remove(this)`); a change of map from a menu or the title uses `stack.reset`; state constructors never touch the DOM or browser storage.
- **Audio must not click.** Master level stays 0.25. A song never starts while a one-shot song is still playing.
- **One key press does one thing.** A press that answers a question never also answers the next one or acts on the screen beneath.
- Owner checks (look and listen in the browser) are the owner's. Implementers list them verbatim and never report them as passed.
- A task is done when `npm test`, `npx tsc --noEmit` and `npm run build` are green. One commit per task. Every commit message ends with a `Co-Authored-By:` trailer naming **the model that wrote the commit**: a Sonnet 5.5 implementer writes `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; a commit the orchestrator writes carries `Claude Fable 5.2`. Run npm from `C:/Projects/VSCode/WarriorsQuest` (uppercase drive).
- Tests that build a `Game` follow `makeGame` in `test/state.test.ts`. Exact-value tests use `seqRng` from `test/helpers/seqRng.ts`. Screen-flow tests drive `stack.update` with a fake `Input` and replace `game.audio.playSfx` / `playSong` / `stopSong` with recorders, as `test/state.test.ts` and `test/menuState.test.ts` do.

## Review Focus

1. **A save that cannot be trusted or stored**: cut-off text, another version, a number out of range, an unknown item or map, a position inside a wall, storage that throws on read or on write. Continue is not offered, or Maren says nothing was written; nothing crashes and the bad save is left alone. Pinned in Tasks 6 and 7.
2. **Buying what you cannot**: too little gold, a full pack, gear you already own. Gold never goes below 0; gold is never taken without the item arriving, and no item arrives without gold being taken; the full-pack trade-in happens whole or not at all. Pinned in Tasks 3 and 4.
3. **Cancel anywhere in a shop, at the inn or at the save question**: it answers No, costs nothing, buys nothing, starts no sleep and writes no save. Pinned in Tasks 1, 2, 4, 5 and 7.
4. **Keys pressed while sleeping, and the song hand-off**: confirm and cancel do nothing during the fade and the jingle; the jingle starts once; the map song starts once, after it; 6 gold is taken exactly once; exactly 6 gold is enough and 5 is not. Pinned in Task 5.
5. **Selling down to nothing**: selling the last of a stack removes its row and keeps the cursor on a real row; selling the last item returns to the shop menu; worn gear is never listed; an unsellable item is refused and kept; gold stops at 65535. Pinned in Tasks 3 and 4.

---

## File Structure

```
src/game/dialog/script.ts        + choice.ask; pay, rest, save, shop steps; ScriptEnv grows
src/game/dialog/model.ts         + question lines on a choice page
src/game/dialog/dialogState.ts   + one-window question; DialogServices; pay and rest effects
src/game/menu/itemsState.ts      "Equip it?" as a one-window question
src/game/shop.ts                 ShopDef, ShopTable, buyCheck, buy, buyAndWear, sell, sellPrice, row text (pure)
src/game/shopState.ts            ShopState
src/game/sleepState.ts           SleepState
src/game/save.ts                 SaveData, toSave, fromSave, parseSave, saveKey, readSave, writeSave (pure)
src/game/explore.ts              + dialog services; start at a saved position
src/game/title.ts                + Continue
src/game/game.ts                 + Game.shops, Game.storage
src/engine/audio/sequencer.ts    + songFrames
src/game/battle/battleState.ts   uses songFrames
src/data/shops.ts                SHOPS
src/data/sfx.ts                  + buy
src/data/songs/inn.ts            INN_SONG
src/data/dialog/hollowmere.ts    garrik, odo, hesta, maren, maren_intro
src/main.ts                      shops and storage wiring
test/shop.test.ts, test/shopState.test.ts, test/sleepState.test.ts, test/save.test.ts, test/continue.test.ts
test/balance.test.ts             + first-purchase cases
```

---

### Task 0: An original level table

**Files:**
- Modify: `src/data/levels.ts`, `docs/superpowers/specs/2026-11-11-the-dimming-vertical-slice-design.md` (§10.1, §9.8), `test/balance.test.ts` (the stated level 6 stats only), and every test that pins a value taken from the table

**Interfaces:**
- Produces: `LEVELS`, same shape and exports as now, with these rows:

| Lv | XP | STR | AGI | MaxHP | MaxMP | Learns |
|---|---|---|---|---|---|---|
| 1 | 0 | 4 | 5 | 16 | 0 | |
| 2 | 8 | 5 | 5 | 19 | 4 | heal |
| 3 | 22 | 7 | 7 | 25 | 6 | |
| 4 | 50 | 9 | 9 | 29 | 12 | |
| 5 | 105 | 13 | 11 | 33 | 17 | |
| 6 | 210 | 17 | 12 | 36 | 23 | ember |
| 7 | 420 | 19 | 15 | 41 | 27 | |
| 8 | 780 | 23 | 19 | 45 | 31 | |
| 9 | 1250 | 28 | 23 | 50 | 35 | homeward |
| 10 | 1900 | 34 | 28 | 55 | 40 | |

- Rules for this task:
  - No monster number, item number, spell number, formula or balance threshold changes. In `test/balance.test.ts` only the "level 6 hero has the stats the spec states" case changes (attack 27, defence 14).
  - A test that pins a number derived from the table (a level's stats, an XP threshold, the level a spell is learned at, a level-up message) is updated to the new number, keeping what it proves. A test set up "at level 3 so the hero knows Heal" may stay at level 3. Do not weaken or delete a test.
  - If any balance test fails with the new table, stop and report the measured numbers. Do not retune anything.
  - Design doc: §10.1's table becomes the table above, and its closing sentence becomes "Numbers are original to this game; tune in play-test."; §10.2's Homeward row says "Learned at 9"; §9.8's sentence about the level 6 hero states attack 27 and defence 14 and drops the per-hit and round figures that no longer hold ("does 5–9 per hit and takes about 5 per round, so the fight runs roughly 10–13 rounds" becomes "the fight is long: about 19 rounds in simulation, a Phase 6 tuning target (the aim is 10–13)"); the note under §10.5 gains "Level table replaced 2026-11-12 with an original curve.".

- [ ] **Step 1: Change `LEVELS`** to the table (Homeward at 9).
- [ ] **Step 2: Run the suite and list every failure**
Run: `npm test`
Expected: FAIL only in tests that pin table values; every case in `test/balance.test.ts` except the stated level 6 stats PASSES. If another balance case fails, stop and report.
- [ ] **Step 3: Update the pinned values** in those tests, one by one, by the rules above; update the design doc.
- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.
- [ ] **Step 5: Commit**
```bash
git add src/data/levels.ts test docs/superpowers/specs
git commit -m "feat: an original level table; Heal at 2, Ember at 6, Homeward at 9"
```

Owner checks to list (not to perform): a new hero's Status shows HP 16 and AGI 5; level 2 arrives after four road fights and teaches Heal; Ember arrives at level 6.

---

### Task 1: A question and its answers in one window

**Files:**
- Modify: `src/game/dialog/script.ts`, `src/game/dialog/model.ts`, `src/game/dialog/dialogState.ts`, `src/game/menu/itemsState.ts`, `test/dialogScript.test.ts`, `test/dialogModel.test.ts`, `test/menuState.test.ts`

**Interfaces:**
- Produces:
  - `script.ts`: the choice node becomes `{ choice: [string, string]; ask?: string; yes: DialogScript; no: DialogScript }`; the choice step becomes `{ kind: 'choice'; options: [string, string]; ask?: string }`, with `{name}` substituted in `ask`.
  - `model.ts`, on a choice page:
    - the question is wrapped to `cols`; more than 3 lines throws `Error('Choice question too long: <ask>')`.
    - `get ask(): string[]` — the part of the question typed so far, by the same rule as `lines` on a text page; `[]` when there is no question or the page is not a choice.
    - `revealed` is true only once the whole question is shown (at once when there is none). `tick()` types the question and returns true for a non-space character.
    - `confirm()` on a question still typing shows the rest of it and does nothing else. `moveChoice` does nothing until `revealed`.
    - `lines` still returns the two options.
  - `dialogState.ts`:
    - A confirm on a choice page that is not `revealed` only reveals: no `menuConfirm`, no `onChoice`.
    - The typing blip counts question characters the same way it counts text characters.
    - Render: question lines at `(16, 184 + 10·i)`. The options are drawn only when `revealed`, on one row at `y = 184 + 10 × max(1, question line count)`: first option at x 32, second at x 96, `▶` at x 24 or x 88.
  - `itemsState.ts`: the script becomes `[{ choice: ['Yes', 'No'], ask: 'Equip it?', yes: [], no: [] }]`.

- [ ] **Step 1: Write failing tests**
  - `dialogScript.test.ts`: `[{ choice: ['Yes', 'No'], ask: 'Ready, {name}?', yes: [], no: [] }]` with name `Wren` → first step `{ kind: 'choice', options: ['Yes', 'No'], ask: 'Ready, Wren?' }`. A choice without `ask` yields a step with no `ask` key set to a string.
  - `dialogModel.test.ts`, question `'Equip it?'`: `isChoice` true and `revealed` false at once; `ask` equals `['Equ']` after 3 ticks and `['Equip it?']` after 9, when `revealed` is true; `tick()` returns false for nothing left. `moveChoice(1)` before reveal leaves `choiceCursor` 0; after reveal it becomes 1.
  - `confirm()` after 3 ticks: `revealed` true, `isChoice` still true, the runner has not advanced (a `yes: [{ set: 'y' }]` branch has not run). A second `confirm()` runs it.
  - A choice with no `ask`: `revealed` true at once; `ask` equals `[]`.
  - A question that wraps to 4 lines at 28 columns throws `Choice question too long`. `'A bed is still 6 gold, and I will not hear otherwise. Stay?'` (3 lines) does not.
  - `skipAll` on a question still typing answers No once (Review Focus 3).
  - `menuState.test.ts`, Items screen with a Wooden Club in the pack, sounds recorded:
    - confirm on the Club opens one dialog; after 9 idle updates, one confirm equips it (`equipment.weapon === 'wooden_club'`) and the dialog is gone. This is the two-press fix.
    - confirm on the Club, then a confirm on the very next update: the Club is not equipped, the dialog is still up, and `menuConfirm` has played once (for opening), not twice. One more confirm equips.
    - cancel while the question is typing or shown: not equipped, dialog gone.
    - Render with a text-recording font: before reveal neither `Yes` nor `No` is drawn; after reveal `Yes` is drawn at `(32, 194)`, `No` at `(96, 194)`, `▶` at `(24, 194)`; after one `right`, `▶` at `(88, 194)`.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/dialogScript.test.ts test/dialogModel.test.ts test/menuState.test.ts`
Expected: FAIL (`ask` unknown; two presses still needed).

- [ ] **Step 3: Implement** per Interfaces.

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src/game/dialog src/game/menu/itemsState.ts test/dialogScript.test.ts test/dialogModel.test.ts test/menuState.test.ts
git commit -m "feat: a question and its answers share one window; Equip it? takes one press"
```

Owner checks to list (not to perform): in Items, choosing a piece of gear shows "Equip it?" with Yes and No beneath it in the same window; one press on Yes equips.

---

### Task 2: Dialog steps for paying, resting, saving and opening a shop

**Files:**
- Modify: `src/game/dialog/script.ts`, `src/game/dialog/dialogState.ts`, `test/dialogScript.test.ts`, `test/state.test.ts`, `test/dialogContent.test.ts` (its fake `ScriptEnv` and its `strings()` walker only)

**Interfaces:**
- Consumes: Task 1's choice step.
- Produces:
  - `script.ts`, four new nodes:
    - `{ pay: number; then: DialogScript; else?: DialogScript }` — runs `then` if `env.pay(n)` is true, otherwise `else` if present.
    - `{ rest: string }` — calls `env.rest(songId)`.
    - `{ save: true; ok: DialogScript; fail: DialogScript }` — runs `ok` if `env.save()` is true, otherwise `fail`.
    - `{ shop: string }` — calls `env.shop(id)`.
  - `ScriptEnv` gains `pay(n: number): boolean`, `rest(song: string): void`, `save(): boolean`, `shop(id: string): void`.
  - `dialogState.ts`:
    - `export interface DialogServices { shop(id: string): void; rest(song: string): void; save(): boolean }`; the constructor's options gain `services?: Partial<DialogServices>`.
    - `pay`: when `player.gold >= n`, subtracts `n` and returns true; otherwise changes nothing and returns false.
    - `rest`: sets HP and MP to their maximums, then calls `services.rest` unless the dialog is being skipped by cancel.
    - `shop`: calls `services.shop` unless the dialog is being skipped.
    - `save`: returns `services.save?.() ?? false`.
  - `dialogContent.test.ts`: `strings()` also walks `ask`, `pay.then`, `pay.else`, `save.ok` and `save.fail`.

- [ ] **Step 1: Write failing tests**
  - Runner, with a recording env: `[{ pay: 6, then: ['a'], else: ['b'] }]` → text `a` when `pay` returns true, `b` when false, and `pay` was called once with 6. Without `else` and a false `pay`, the script goes on to the node after it.
  - `[{ save: true, ok: ['w'], fail: ['f'] }]` → `w` or `f` by `env.save()`.
  - `['x', { shop: 's' }, { rest: 'r' }, 'y']`: after the first step, the next `next()` calls `shop('s')` then `rest('r')`, in that order, once each, and returns `y`.
  - `DialogState`, player with 6 gold: `[{ pay: 6, then: ['ok'] }]` leaves 0 gold; with 5 gold the same script leaves 5 and ends without text (Review Focus 4).
  - `DialogState`, hurt player, `['hi', { rest: 'r' }, 'bye']` with a recording `services.rest`: confirming past `hi` restores HP and MP and calls the service once with `'r'`; the dialog is still on the stack showing `bye`.
  - The same script cancelled at `hi`: HP and MP are restored, the service is not called, the dialog is gone.
  - `['hi', { shop: 's' }, 'bye']` with a `services.shop` that pushes a fake state: after confirming past `hi` the fake state is on top and the dialog is under it; removing the fake state and confirming shows `bye`, then the dialog ends. Cancelled at `hi`: the service is not called (Review Focus 3).
  - `[{ save: true, ok: ['w'], fail: ['f'] }]` with no services shows `f`.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/dialogScript.test.ts test/state.test.ts`
Expected: FAIL (nodes unknown).

- [ ] **Step 3: Implement** per Interfaces.

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src/game/dialog test/dialogScript.test.ts test/state.test.ts test/dialogContent.test.ts
git commit -m "feat: dialog steps for paying, resting, saving and opening a shop"
```

---

### Task 3: Shop rules (pure) and shop data

**Files:**
- Create: `src/game/shop.ts`, `src/data/shops.ts`, `test/shop.test.ts`
- Modify: `src/game/game.ts`, `src/main.ts`, `src/data/sfx.ts`, `test/sfx.test.ts`, `test/interiors.test.ts` (story-free guard), every test that calls `createGame(` (add `shops`)

**Interfaces:**
- Consumes: `ItemTable`, `ItemDef`, `PlayerState`, `addItem`, `removeItem`, `isEquipment`, `itemLines`, `GOLD_MAX`.
- Produces, in `shop.ts`:
  - `interface ShopDef { stock: string[] }`; `type ShopTable = Record<string, ShopDef>`.
  - `sellPrice(def: ItemDef | undefined): number` — `floor(price / 2)`; 0 for a key item, a price of 0, or an unknown item. 0 means "cannot be sold".
  - `owns(p: PlayerState, id: string): boolean` — in the pack or worn.
  - `type BuyCheck = { ok: true; wearOnly: boolean; tradeIn: { id: string; gold: number } | null } | { ok: false; why: 'gold' | 'owned' | 'full' }`
  - `buyCheck(items, p, id): BuyCheck`, rules in this order:
    1. price above the player's gold → `gold`;
    2. gear the player `owns` → `owned`;
    3. it fits in the pack → ok, `wearOnly: false`, `tradeIn: null`;
    4. gear, and its slot is empty → ok, `wearOnly: true`, `tradeIn: null`;
    5. gear, and the worn piece has a `sellPrice` above 0 → ok, `wearOnly: true`, `tradeIn: { id: <worn piece>, gold: <its sellPrice> }`;
    6. otherwise → `full`.
  - `buy(items, p, id): PlayerState` — for a check with `wearOnly: false`: gold minus the price, the item in the pack. Throws `Error('Cannot buy: <id>')` for any other check.
  - `buyAndWear(items, p, id): PlayerState` — for a check with `wearOnly: true`: gold minus the price plus any trade-in gold (capped at `GOLD_MAX`), the item worn, the old piece gone, the pack untouched. Throws `Error('Cannot buy: <id>')` otherwise.
  - `sell(items, p, slot: number): { player: PlayerState; gold: number } | null` — sells one of the item in that pack slot; `null` for an empty slot or a `sellPrice` of 0. Gold is capped at `GOLD_MAX`.
  - `stockRows(items, stock: readonly string[]): string[]` and `sellRows(items, p): string[]` — each row is `label.padEnd(15) + price.padStart(3)`; a stock label is the item's name; a sell label is the matching `itemLines` entry and its price is `sellPrice`, or `-` when that is 0. `sellRows` of an empty pack is `[]`.
  - `game.ts`: `Game.shops: ShopTable` (required); `main.ts` passes `SHOPS`.
  - `data/shops.ts`: `SHOPS = { forge: { stock: ['wooden_club', 'iron_knife', 'bronze_sword', 'cloth_tunic', 'leather_armor', 'plank_shield'] }, goods: { stock: ['herb', 'torch'] } }`.
  - `data/sfx.ts`: `SfxId` gains `'buy'`: `[p1('B5', 2, 8, 0.5), p1('F#6', 6, 8, 0.5)]`.
  - Story-free guard: the banned-import pattern gains `shops`; the banned strings gain `'forge'`, `'goods'`, `'wooden_club'`, `'garrik`, `'odo'`, `'hesta`, `'inn'`.

- [ ] **Step 1: Write failing tests** in `test/shop.test.ts` (items from `ITEMS`):
  - `sellPrice`: Wooden Club 15, Herb 5, Torch 4, Plank Shield 12, Aldric's Shield 0, Journal Page 0, `undefined` 0.
  - A new player (40 gold, one Herb): `buyCheck(wooden_club)` → `{ ok: true, wearOnly: false, tradeIn: null }`; `buy` → gold 10, pack is the Herb and the Club; the input player is unchanged. `buyCheck(iron_knife)` → `gold`.
  - Exactly 30 gold buys the Club and leaves 0; 29 → `gold` (Review Focus 2).
  - Club in the pack → `owned`; Club worn and not in the pack → `owned`; a second Herb is never `owned`.
  - Eight pack slots filled, one of them `herb ×3`: `buyCheck(herb)` ok (it stacks). The same with `herb ×6` → `full`.
  - Full pack, no weapon worn, 100 gold: `buyCheck(iron_knife)` → `wearOnly: true, tradeIn: null`; `buyAndWear` → weapon `iron_knife`, gold 40, pack identical.
  - Full pack, Wooden Club worn, 100 gold: `buyCheck(iron_knife)` → `tradeIn: { id: 'wooden_club', gold: 15 }`; `buyAndWear` → weapon `iron_knife`, gold 55, no Club anywhere, pack identical.
  - Full pack, Aldric's Shield worn: `buyCheck(plank_shield)` → `full`.
  - Too little gold wins over every other reason: full pack, Club owned, 0 gold → `gold`.
  - `buy` on a `wearOnly` or refused check throws `Cannot buy`; `buyAndWear` on a plain check throws.
  - `sell`: a `herb ×3` slot → gold +5 and `herb ×2`; a `herb ×1` slot → the slot is gone; Aldric's Shield → `null` and the player unchanged; slot 9 → `null`; 65530 gold selling a Bronze Sword → 65535 (Review Focus 5).
  - Rows: `stockRows(ITEMS, SHOPS.forge.stock)[0]` is `'Wooden Club     30'` and `[2]` is `'Bronze Sword   180'`; `sellRows` for a pack of `herb ×3` and Aldric's Shield is `['Herb x3          5', "Aldric's Shield  -"]`; every row of both shops is 18 characters.
  - Data: every stock id of every shop is in `ITEMS` with a price above 0 and appears once.
  - `sfx.test.ts`: `buy` exists and its note sequence equals no other effect's.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/shop.test.ts test/sfx.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement** per Interfaces; add `shops: SHOPS` to each test's `createGame` call.

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src/game/shop.ts src/data/shops.ts src/game/game.ts src/main.ts src/data/sfx.ts test
git commit -m "feat: shop rules, shop stock and the buy sound"
```

---

### Task 4: The shop screen, Garrik and Odo

**Files:**
- Create: `src/game/shopState.ts`, `test/shopState.test.ts`
- Modify: `src/game/explore.ts`, `src/data/dialog/hollowmere.ts`, `test/dialogContent.test.ts`

**Interfaces:**
- Consumes: Task 2's `DialogServices` and `shop` step; Task 3's `ShopDef`, `buyCheck`, `buy`, `buyAndWear`, `sell`, `sellPrice`, `stockRows`, `sellRows`; `equip`, `itemName`, `MenuList`, `drawWindow`, `drawMenu`, `DialogState`.
- Produces:
  - `new ShopState(game, def: ShopDef)` with `get phase(): 'menu' | 'buy' | 'sell'` and `get rows(): readonly string[]` (the open list's rows; `[]` on the menu).
  - Windows: menu `(8, 8, 72, 40)` with rows `Buy`, `Sell`, `Leave`; gold `(8, 52, 72, 24)` showing `<gold> G`; list `(84, 8, 164, 100)`, drawn only in `buy` and `sell`.
  - Menu: Buy opens the stock list. Sell opens the pack list, or with an empty pack plays `error` and says `You have nothing to sell.` Leave, or cancel, removes the shop by identity with `menuCancel`.
  - Buy list, confirm on a row, by `buyCheck`:
    - refused → `error` and one line: `You do not have enough gold.` / `You already carry one.` / `You cannot carry more.`
    - ok, not `wearOnly` → question `The <name>? That will be <price> gold.` Yes → `buy`, sound `buy`; then, for gear, question `Will you equip it now?` Yes → `equip`.
    - ok, `wearOnly` → one line first, `Your pack is full. You must wear it now.` or, with a trade-in, `Your pack is full. You must wear it now, and I will take your <old name> for <gold> gold.`; then the same price question. Yes → `buyAndWear`, sound `buy`.
    - No or cancel at any question changes nothing.
  - Sell list, confirm on a row: a `sellPrice` of 0 → `error` and `I cannot buy that.`; otherwise question `The <name>? I can give you <gold> gold.` Yes → `sell`, sound `buy`. The list is rebuilt after every sale with the cursor kept on a real row; when the pack is empty the shop returns to its menu.
  - Cancel in a list returns to the menu with `menuCancel`. Opening a list plays `menuConfirm`; cursor moves play `menuMove`.
  - Every question and line is a `DialogState` pushed over the shop; the shop acts on the answer in that dialog's `onDone`.
  - `explore.ts`: the constructor's third parameter becomes `entry: string | { x: number; y: number; facing: Dir }`; a position off the map or on a tile that is not walkable throws `Error('Bad position on map <id>')`. (Tests in this task and Task 5 use it to stand the hero at a counter; Task 7 uses it for Continue.)
  - `explore.ts`: every dialog the map screen opens (talk, auto trigger, pending dialog) is given `services`. `shop(id)` pushes `new ShopState(game, game.shops[id])` and throws `Error('Unknown shop: <id>')` for a missing id. `rest` and `save` arrive in Tasks 5 and 7.
  - `hollowmere.ts`:
    ```ts
    garrik: [
      'Aldric was a fool. I am Garrik the smith, and I say so to anyone.',
      'You may need what a fool needs. Look over the racks.',
      { shop: 'forge' },
      'He left a wife and a child for a hole in the ground.',
      'I will not make that mistake. I make blades and sleep sound.',
    ],
    odo: [
      "Odo's Goods, and Odo himself. Herbs and torches, that is all I carry.",
      { shop: 'goods' },
      'Prices climb with the Dimming. I did not set them. The cold did.',
    ],
    ```

- [ ] **Step 1: Write failing tests** in `test/shopState.test.ts` (real maps and dialogs; sounds recorded; a helper presses confirm until the top state changes or a question is revealed):
  - `new ExploreState(game, 'elder_house', { x: 6, y: 4, facing: 'left' })` → hero at (6, 4) facing left; `{ x: 0, y: 0, facing: 'up' }` and `{ x: 99, y: 0, facing: 'up' }` throw `Bad position on map elder_house`.
  - In `forge`, standing at (5, 4) facing up (Garrik is across the counter) with a new player: confirming through his two lines puts a `ShopState` on top with a `DialogState` under it, `phase` `menu`.
  - Buy → `rows` equals `stockRows(ITEMS, SHOPS.forge.stock)`. Confirm on the Wooden Club, Yes, Yes → gold 10, `equipment.weapon === 'wooden_club'`, the Club is not in the pack, `buy` played once, and the shop is back on the Buy list.
  - The same with No at `Will you equip it now?` → gold 10, the Club in the pack, nothing worn as a weapon.
  - One press per answer (Global Constraints): from the revealed price question, exactly one confirm leaves the equip question on top, still unanswered, with the Club already in the pack.
  - Cancel at the price question → gold 40, no Club, no `buy` sound (Review Focus 3). Cancel at the equip question → the Club is bought and stays in the pack.
  - Confirm on the Iron Knife with 40 gold → `error`, the text `You do not have enough gold.`, gold 40 (Review Focus 2). A second Club → `You already carry one.`
  - Full pack, Club worn, 100 gold, confirm on the Iron Knife: the first text contains `I will take your Wooden Club for 15 gold`; Yes → weapon `iron_knife`, gold 55; No instead → nothing changes.
  - Sell with a pack of `herb ×2` and Aldric's Shield: `rows` equals `sellRows(...)`; selling a Herb twice leaves gold +10, the list showing only the shield and the cursor on row 0; confirm on the shield → `I cannot buy that.` and it is kept (Review Focus 5).
  - Sell with one Herb only: after the sale `phase` is `menu`. Sell with an empty pack: `You have nothing to sell.`, `phase` stays `menu`.
  - Leave: the shop is gone and the dialog shows `He left a wife and a child for a hole in the ground.`; confirming to the end returns to the map screen with nothing else on the stack.
  - Cancel on Garrik's first line: no `ShopState` is ever pushed; the map screen is on top.
  - In `shop`, standing at (5, 5) facing up, talking to Odo opens a shop whose Buy rows are `['Herb            10', 'Torch            8']`.
  - `explore` with a dialog `[{ shop: 'nope' }]` throws `Unknown shop: nope`.
  - `dialogContent.test.ts`: `garrik` calls `shop:forge` once and `odo` calls `shop:goods` once; the own-name test still passes for both.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/shopState.test.ts test/dialogContent.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement** per Interfaces.

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src/game/shopState.ts src/game/explore.ts src/data/dialog/hollowmere.ts test/shopState.test.ts test/dialogContent.test.ts
git commit -m "feat: the shop screen; Garrik and Odo open for business"
```

Owner checks to list (not to perform): Garrik greets, the shop shows Buy / Sell / Leave with your gold under it, and nothing is cut off or overlapping; the Buy list lines up names and prices; buying plays a coin-like sound that is not the confirm blip; the Club can be bought and equipped with the starting 40 gold, and Status then shows ATK 6; selling pays half; Garrik's last two lines play on leaving and cancel skips them; Odo sells Herbs and Torches.

---

### Task 5: The inn

**Files:**
- Create: `src/game/sleepState.ts`, `src/data/songs/inn.ts`, `test/sleepState.test.ts`
- Modify: `src/engine/audio/sequencer.ts`, `src/game/battle/battleState.ts`, `src/data/songs/index.ts`, `src/game/explore.ts`, `src/data/dialog/hollowmere.ts`, `test/songs.test.ts`, `test/sequencer.test.ts`, `test/dialogContent.test.ts`

**Interfaces:**
- Consumes: Task 2's `pay` and `rest` steps and `DialogServices`; Task 1's `ask`.
- Produces:
  - `sequencer.ts`: `songFrames(song: Song): number` — `Math.ceil(rows × rowDurationSec(tempo) × 60)`. `battleState.ts` uses it in place of its own arithmetic.
  - `inn.ts`: `INN_SONG`, id `inn`, tempo 80, 16 rows (3.0 s), `loop: false`, F major, registered in `SONGS`:
    - p1, duty 0.25, vol 8: `C5` row 0, `A4` 2, `A#4` 4, `D5` 6, `C5` 8, `G4` 10, `A4` 12, `off` 15.
    - p2, duty 0.25, vol 5: `F4` row 0, `F4` 4, `E4` 8, `F4` 12, `off` 15.
    - tri, vol 12: `F2` row 0, `A#2` 4, `C3` 8, `F2` 12, `off` 15.
    - Harmony, one chord every four rows: F (F A C), B flat (B♭ D F), C (C E G), F. A header comment states this, as `levelup.ts` does.
  - `sleepState.ts`: `new SleepState(game, { song: Song; onWake: () => void })`, `SLEEP_FADE = 20`:
    - `enter()`: `audio.stopSong()`.
    - update 20: `audio.playSong(song)`. Black until update `20 + songFrames(song)`, when `onWake()` is called once; then a 20-update fade in; then it removes itself by identity.
    - It reads no input. Render: a black rectangle whose alpha rises to 1, holds, and falls.
  - `explore.ts`: `services.rest(id)` pushes `new SleepState(game, { song: game.songs[id], onWake: () => <play the map song> })` and throws `Error('Unknown song: <id>')` for a missing id.
  - `hollowmere.ts`, replacing the free rest and its comment (copy from decision 9):
    ```ts
    hesta: [
      {
        if: 'warden_defeated',
        then: [
          'You came back. Sit. I told myself: Hesta, that one will want feeding.',
          'Your father never did come through that door again.',
          {
            choice: ['Yes', 'No'],
            ask: 'A bed is still 6 gold, and I will not hear otherwise. Stay?',
            yes: [{ pay: 6, then: [{ rest: 'inn' }, 'Morning. Eat before you go. I mean it.'], else: ['That is not 6 gold. I said I will not hear otherwise.'] }],
            no: ['Then sit a while anyway.'],
          },
        ],
        else: [
          'As sure as my name is Hesta, you look more like him every day.',
          'Aldric drank his last cup in this room. He laughed the whole time.',
          {
            choice: ['Yes', 'No'],
            ask: 'A bed is 6 gold, if you need one. Stay?',
            yes: [{ pay: 6, then: [{ rest: 'inn' }, 'Morning. You slept like a stone. He never could.'], else: ['That is not 6 gold. Come back when you have it.'] }],
            no: ['Then mind the road. The bed will keep.'],
          },
        ],
      },
    ],
    ```

- [ ] **Step 1: Write failing tests**
  - `sequencer.test.ts`: `songFrames(INN_SONG)` is 180; `songFrames(VICTORY_SONG)` equals the value `battleState` computed before (24 rows at tempo 150 → 144).
  - `songs.test.ts`: `INN_SONG` passes `validateSong`, does not loop, lasts between 2.5 and 3.5 seconds, and every pitched track ends with `off`.
  - `sleepState.test.ts`, audio calls recorded, a 4-row test song at tempo 150 (`songFrames` 24):
    - after `push`: `stopSong` once, nothing else.
    - `playSong(song)` is called on update 20 and only then; `onWake` on update 44 and only then; the state leaves the stack on update 64 and the state under it is untouched.
    - An input that reports confirm and cancel pressed on every update changes none of that (Review Focus 4).
  - In `inn`, standing at (5, 4) facing up (Hesta is across the counter), a player at 3 HP with 10 gold: confirm to the question, Yes → gold 4, HP and MP full, a `SleepState` on top. Running it out leaves the dialog showing `Morning. You slept like a stone. He never could.`; the recorded songs are, in order, the inn song once and then the map's song once. Confirming to the end returns to the map screen.
  - The same with 5 gold → `That is not 6 gold. Come back when you have it.`, gold 5, HP 3, no `SleepState`. With exactly 6 gold → gold 0 and the sleep runs.
  - No → `Then mind the road. The bed will keep.`, nothing changes. Cancel on the first line, and cancel at the question → gold and HP unchanged, no `SleepState`, the map screen on top (Review Focus 3).
  - With `warden_defeated` set and 10 gold, Yes → the morning line is `Morning. Eat before you go. I mean it.`
  - `dialogContent.test.ts`: the "one free rest per talk" test is replaced. On both branches, answering Yes with enough gold calls `pay:6` once and `rest:inn` once and never `heal`; answering Yes without enough gold calls `pay:6` once and no `rest`; answering No calls neither. Every `ask` in `DIALOGS` wraps to 3 lines or fewer at 28 columns; every `rest` id is a non-looping song in `SONGS`; every `pay` in `hesta` is 6. (The test's fake env takes the answer and whether `pay` succeeds as parameters.)
  - `explore` with a dialog `[{ rest: 'nope' }]` throws `Unknown song: nope`.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/sleepState.test.ts test/songs.test.ts test/sequencer.test.ts test/dialogContent.test.ts`
Expected: FAIL (modules missing).

- [ ] **Step 3: Implement** per Interfaces.

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src/game/sleepState.ts src/data/songs src/engine/audio/sequencer.ts src/game/battle/battleState.ts src/game/explore.ts src/data/dialog/hollowmere.ts test
git commit -m "feat: the inn: six gold, a sleep jingle, and Hesta's lines"
```

Owner checks to list (not to perform): Hesta's question shows with Yes and No under it and all three lines of the longer one fit; Yes takes 6 gold, the screen fades to black, a soft three-second lullaby plays, the screen fades back and she speaks her morning line; the town theme starts again after the jingle with no click; keys do nothing while you sleep; with 5 gold she refuses; the lullaby sounds like its own tune, not like the victory or level-up sounds.

---

### Task 6: The save format (pure)

**Files:**
- Create: `src/game/save.ts`, `test/save.test.ts`

**Interfaces:**
- Consumes: `PlayerState`, `EquipSlot`, `InventorySlot`, `LEVELS`, `XP_MAX`, `GOLD_MAX`, `INVENTORY_SLOTS`, `ItemTable`, `GameMap`, `isWalkable`, `Dir`, `NAME_MAX`, `NAME_GRID`.
- Produces:
  - `SAVE_VERSION = 1`
  - `interface SaveData { version: 1; name: string; level: number; xp: number; hp: number; mp: number; gold: number; equipment: Partial<Record<EquipSlot, string>>; inventory: InventorySlot[]; flags: string[]; map: string; x: number; y: number; facing: Dir; torchSteps: number }`
  - `toSave(p: PlayerState, at: { map: string; x: number; y: number; facing: Dir }): SaveData` — `torchSteps` is 0. Copies; shares no arrays with `p`.
  - `fromSave(s: SaveData): PlayerState` — strength, agility and both maximums come from the `LEVELS` row for `s.level`.
  - `interface SaveContext { items: ItemTable; maps: Record<string, GameMap> }`
  - `parseSave(text: string | null, ctx: SaveContext): SaveData | null` — never throws. Returns `null` unless every one of these holds:
    - the text is JSON for an object whose `version` is 1;
    - `name` is 1 to `NAME_MAX` characters, each one a character of the name-entry grid's five character rows;
    - `level` is a whole number from 1 to the table's last level; `xp` a whole number 0 to `XP_MAX`; `gold` 0 to `GOLD_MAX`; `hp` 1 to that level's maximum HP; `mp` 0 to that level's maximum MP;
    - each `equipment` entry is under `weapon`, `armor` or `shield` and names a known item of that kind;
    - `inventory` is an array of at most `INVENTORY_SLOTS` entries, each a known item with a whole-number `count` from 1 to that item's `stack`;
    - `flags` is an array of at most 64 distinct strings of 1 to 32 characters;
    - `map` is a known map; `x` and `y` are whole numbers naming a walkable tile of it; `facing` is one of the four directions;
    - `torchSteps` is a whole number 0 to 65535.
    The result carries only the fields above; anything else in the text is dropped.
  - `saveKey(prefix: string): string` — `<prefix>.save.v1`.
  - `writeSave(storage: Pick<Storage, 'setItem'> | null | undefined, key: string, data: SaveData): boolean` — false for no storage or a throwing one.
  - `readSave(storage: Pick<Storage, 'getItem'> | null | undefined, key: string, ctx: SaveContext): SaveData | null` — `null` for no storage or a throwing one.

- [ ] **Step 1: Write failing tests** in `test/save.test.ts` (`ITEMS`, `MAPS`; a good save is `toSave` of a level 4 hero with a Club worn, `herb ×2` and Aldric's Shield in the pack, flags `['intro_done', 'shield_received']`, at `elder_house` (6, 4) facing `up`):
  - Round trip: `fromSave(parseSave(JSON.stringify(toSave(p, at)), ctx)!)` equals `p`; `map`, `x`, `y`, `facing` equal `at`; `torchSteps` is 0.
  - A hero raised by the debug overlay (level 5 with 0 XP) round-trips at level 5 with level 5's strength and maximums.
  - `toSave` output changed afterwards (push to `inventory`, `flags`) leaves `p` unchanged.
  - Table-driven, one change to the good save each, every one → `null` (Review Focus 1): `version` 2; `version` missing; `name` `''`, nine characters, `'Wr{n'`, a number; `level` 0, 11, 2.5, `'3'`; `xp` −1, 65536; `gold` −1, 65536, 1.5; `hp` 0, one above the level's maximum; `mp` −1, one above the maximum; `equipment` `{ weapon: 'herb' }`, `{ weapon: 'nope' }`, `{ hat: 'wooden_club' }`; `inventory` not an array, nine entries, `{ item: 'nope', count: 1 }`, `herb` with count 0, 7 and 1.5, `wooden_club` with count 2; `flags` not an array, containing a number, containing `''`, a 33-character flag, a repeated flag, 65 flags; `map` `'nope'`; `x` −1, 12, 1.5; a wall tile (0, 0); `facing` `'north'`; `torchSteps` −1, 65536.
  - `parseSave` of `null`, `''`, `'{'`, `'null'`, `'[]'`, `'42'` and the good text cut in half → `null`, no throw.
  - An extra field in the text is absent from the result.
  - `saveKey('x')` is `'x.save.v1'`.
  - `writeSave` with a Map-backed storage returns true and stores text that `readSave` reads back equal; with `null` → false; with a `setItem` that throws → false. `readSave` with a `getItem` that throws → `null`.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/save.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement** per Interfaces.

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src/game/save.ts test/save.test.ts
git commit -m "feat: the save format: write, read back, and reject anything damaged"
```

---

### Task 7: Saving at Maren's and Continue on the title

**Files:**
- Create: `test/continue.test.ts`
- Modify: `src/game/game.ts`, `src/main.ts`, `src/game/explore.ts`, `src/game/title.ts`, `src/data/dialog/hollowmere.ts`, `test/title.test.ts`, `test/dialogContent.test.ts`

**Interfaces:**
- Consumes: Task 6's `toSave`, `fromSave`, `saveKey`, `readSave`, `writeSave`; Task 2's `save` step.
- Produces:
  - `game.ts`: `Game.storage?: Pick<Storage, 'getItem' | 'setItem'> | null`. `main.ts` passes the result of `safeLocalStorage()` (one call, shared with the audio manager).
  - `explore.ts` (the position form of the constructor is from Task 4):
    - `services.save()` returns `writeSave(game.storage, saveKey(game.story.storagePrefix), toSave(game.player, { map, x, y, facing }))` for the hero's current tile and facing.
  - `title.ts`:
    - `enter()` reads the save with `readSave` (never in the constructor). `get rows(): string[]` is `['Continue', 'New Game']` with a save and `['New Game']` without; the cursor starts on row 0.
    - Up and down move the cursor with `menuMove` when there are two rows. Rows are drawn at `(112, 150)` and `(112, 162)`, `▶` at x 104.
    - Continue: `menuConfirm`, `game.player = fromSave(save)`, then a `TransitionState` whose midpoint does `stack.reset(new ExploreState(game, save.map, { x, y, facing }))`. Further presses during the fade do nothing.
    - New Game is unchanged and writes nothing.
  - `hollowmere.ts` (copy from decisions 12 and 17):
    ```ts
    maren: [
      {
        if: 'warden_defeated',
        then: ["You went down there. And you came back to Maren's door."],
        else: ["Sit by old Maren's fire a moment. The Dimming is worse at night."],
      },
      {
        choice: ['Yes', 'No'],
        ask: 'Shall I remember your journey?',
        yes: [{ save: true, ok: [{ sfx: 'menuConfirm' }, 'It is written.'], fail: ['The page will not take the ink. Nothing was written.'] }],
        no: [],
      },
      {
        if: 'warden_defeated',
        then: ['What did you find, {name}?', 'No. Tell me later. I am not ready.'],
        else: [
          'We stopped saying the word years ago. The cold stayed anyway.',
          'Come back when you need to. I will keep the lamp lit.',
        ],
      },
    ],
    ```
    and in `maren_intro`, after `'It is dented, and it is yours.'`: `"Take your coin to Garrik's forge before you try the gate."`

- [ ] **Step 1: Write failing tests** in `test/continue.test.ts` (a Map-backed storage passed as `storage`; the opening flag set unless stated):
  - In `elder_house` at the `start` entry, talk to Maren, confirm to the question, Yes → the storage holds one entry under `dimming.save.v1`; `readSave` of it gives `map` `elder_house`, the hero's tile, facing `up`, and `fromSave` of it equals `game.player`; the dialog shows `It is written.` and `menuConfirm` played for it.
  - No → the storage is empty and the next text is `We stopped saying the word years ago. The cold stayed anyway.` Cancel on the first line, and cancel at the question → the storage is empty (Review Focus 3).
  - A storage whose `setItem` throws, Yes → the text is `The page will not take the ink. Nothing was written.`; no throw. No `storage` on the game at all → the same line (Review Focus 1).
  - Saving twice replaces the entry: after gaining gold and saving again, the stored gold is the new amount.
  - Title with that saved entry, after `enter()`: `rows` equals `['Continue', 'New Game']`. Confirm, then updates until no `TransitionState` remains → the stack is one `ExploreState` on `elder_house` at the saved tile and facing; `game.player` equals the saved player (a different object from the one that saved); no `DialogState` appears in the next 100 updates (the opening scene does not replay).
  - A hero saved with a Club worn, then Continue: `attackOf` is 6 at level 1.
  - Title with `'{'` stored under the key, with a version 2 save, and with a `getItem` that throws → `rows` equals `['New Game']`; the stored text is unchanged afterwards (Review Focus 1).
  - Title with a save, down, confirm → the name-entry screen is on top and the stored text is unchanged.
  - Title with no save: down does nothing and plays no sound; confirm opens name entry (existing behaviour).
  - Constructing `TitleState` calls `getItem` zero times; `enter()` calls it once.
  - `title.test.ts`: with a text-recording font and a save, `Continue` is drawn at `(112, 150)` and `New Game` at `(112, 162)`; without one, `New Game` at `(112, 150)`.
  - `dialogContent.test.ts`: `maren` with a successful save reaches `It is written.` on both branches and calls `save` once; with a failing save reaches the "will not take the ink" line; answering No calls `save` zero times; `maren_intro` contains the forge line and still ends with `Stay as long as you like. The fire is warm.`; `maren_intro` and `maren_fallen` never call `save`.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/continue.test.ts test/title.test.ts test/dialogContent.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** per Interfaces.

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src/game/game.ts src/main.ts src/game/explore.ts src/game/title.ts src/data/dialog/hollowmere.ts test
git commit -m "feat: Maren remembers the journey; Continue on the title screen"
```

Owner checks to list (not to perform): Maren asks "Shall I remember your journey?" after her first line; Yes plays a blip and says "It is written."; reload the page and the title shows Continue above New Game with the cursor on Continue; Continue fades into Maren's house where you stood, with your level, gold, gear and items as saved, and the opening scene does not replay; the title layout still looks right with two rows; in a private window with storage blocked, Maren says nothing was written and the game carries on.

---

### Task 8: Balance tests for the first purchase

**Files:**
- Modify: `test/balance.test.ts`

**Interfaces:**
- Consumes: `heroAt`, `simulate`, `fightOnly`, `healer` from `test/helpers/simulate.ts`; Task 3's `buyCheck` and `buy`; `equip`, `createPlayer`, `STORY`, `ITEMS`, `MONSTERS`.
- Produces: a `describe('the first purchase')` block. No game numbers change (decision 16). If a threshold below fails with the real code, stop and report the measured numbers to the orchestrator; do not move a threshold or a game number.

- [ ] **Step 1: Write the tests** (`N = 4000`, a fixed seed each; values measured with Task 0's table are in brackets):
  - The starting purse buys the Club: for `createPlayer('Wren', STORY.startingItems)`, `buyCheck(ITEMS, p, 'wooden_club')` is ok and not `wearOnly`; after `buy`, gold is 10, which is at least the inn's 6 and at least the Herb's price.
  - Road, comfortably: that same player, after `buy`, `equip` of the Club, and Aldric's Shield added and equipped, at full HP, against `mireling` with `fightOnly`: win rate ≥ 0.99; mean rounds ≤ 2.5 [2.17]; mean HP lost ≤ 2.0 [1.36].
  - The Club is felt: its mean rounds are at least 0.5 fewer than the shield-only hero's from the same test file [3.11 against 2.17].
  - Spec §15's pacing line: mean rounds ≤ 4 and mean HP lost under 20% of maximum HP (3.0) for the Club-and-shield hero.
  - Marsh at level 3 with the Club and shield: `healer(8, null)` wins ≥ 0.95 [0.999]; `fightOnly` wins ≥ 0.8 [0.947].
  - Marsh at level 2 with the Club and shield, `fightOnly`: wins < 0.4 [0.093], so the Club does not open the marsh a level early.

- [ ] **Step 2: Run them**
Run: `npx vitest run test/balance.test.ts`
Expected: PASS, including the Phase 4 cases unchanged.

- [ ] **Step 3: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 4: Commit**
```bash
git add test/balance.test.ts
git commit -m "test: the starting gold buys a Club that makes the road comfortable"
```

---

### Task 9: Records and the phase stop (orchestrator)

**Files:**
- Modify: `docs/superpowers/specs/2026-11-11-the-dimming-vertical-slice-design.md`, this plan
- Create: `docs/superpowers/notes/2026-11-12-phase-5-carry-forward.md`

- [ ] **Step 1: Update the design doc** (decision 18): §8.2 gains `ask` on a choice and the `pay`, `rest`, `save` and `shop` steps, and says shops and the inn are opened from dialog scripts; §11.1 gains the Leave row, the one-of-each rule and the full-pack trade-in as built; §11.2 carries Hesta's lines; §11.3 says the mute setting keeps its own entry and that stats are rebuilt from the level.
- [ ] **Step 2: Verify the branch**
Run: `npm test && npx tsc --noEmit && npm run build`, then search the built bundle for `Give: ` and `Fight: `.
Expected: PASS; clean; no matches.
- [ ] **Step 3: Write the carry-forward note**: where execution stands, the measured balance table, rulings with their cost if wrong, the final review's findings, deferred minors (including those still open from Phase 4), questions for the owner (including the Phase 4 questions still unanswered), and the owner play-test list below plus every task's owner checks. Mark the list as not performed by anyone.
- [ ] **Step 4: Tick this plan's steps and add an "Execution status" section** listing where the delivered code differs from the task text.
- [ ] **Step 5: Commit**
```bash
git add docs
git commit -m "docs: Phase 5 complete — design doc in step, rulings, owner play-test list"
```

**Stop here for the owner's play-test.** Spec §14 list: buy and equip a weapon; feel the damage difference; sleep at the inn; save; reload the page; Continue and find yourself where you saved.
