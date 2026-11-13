# Phase 6: The Barrow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The hero can walk into the Sunken Barrow: two dark floors, a Torch that widens the light, chests, stairs, Barrow Mirelings, and the Barrow Warden with its own music and a shorter, retuned fight. Winning drops Aldric's journal page, which can be read; the door beyond is sealed; the villagers have new lines. The game can be built for a shared link.

**Architecture:** The dungeon is ordinary map data plus three new trigger kinds (`chest`, `look`, `boss`) that the map screen handles next to warps. Opened chests and the Warden's defeat are flags, so the Phase 5 save already carries them. Darkness is a pure function from the hero's screen position and a radius to four black rectangles; the Torch is a new item effect that sets a step counter on the player. The Warden moves from a test fixture into the monster table and is started by a `boss` trigger; its script engine was built in Phase 4. Balance is pinned by the existing simulation helper, extended to play a whole expedition.

**Tech Stack:** TypeScript 5, Vite 6, Vitest 3 (node), Canvas 2D, Web Audio. No runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-11-11-the-dimming-vertical-slice-design.md` (§5.4 to §5.7, §6, §8.3, §9.6 to §9.8, §10.3 to §10.5, §12.3, §12.4, §13, §14 Phase 6, §15). Carry-forward: `docs/superpowers/notes/2026-11-12-phase-5-carry-forward.md` and the "Deferred minors" of `docs/superpowers/notes/2026-11-12-phase-4-carry-forward.md`.

## Execution

- Branch `phase-6` from `master` (`a318e59`). Subagent-driven, as in Phase 5: Sonnet 5.5 implements and reviews ordinary tasks; Opus reviews audio (Task 5), integration (Tasks 2, 3, 6) and the whole branch; the orchestrator (Fable) reviews the dialog copy (Task 7), the two songs' written harmony (Task 5), the map layouts (Task 4) and the balance numbers (Task 8).
- Art (Tasks 2, 4, 6) uses the `pixel-art-sprites` skill in `.claude/skills/`; this plan wins on conflicts.
- Before Task 1, the orchestrator commits this plan on the branch and points `CLAUDE.md`'s "Current plan" line at it.
- Gated: stop after Task 10 for the owner's play-test. Nothing is pushed or deployed without the owner saying so (decision 17).
- **Approved by the owner on 2026-11-13 with all 18 decisions**, and these changes, already folded into the text below: `warden_fallen`'s last line in the second person; Pip's "Mum says"; the journal's Tobin line; the bump sound (Task 2); deployment stays prepared and not performed (no repository, no remote, no push); Phase 5's open questions stay as they are.
- Carried in by the owner (2026-11-12): the Warden fight's length is a tuning target (the spec aimed for 10 to 13 rounds; it measured about 19); the Warden's margins are revisited here (decision 1).

## Decisions made in this plan (for the owner's veto)

Numbers were measured with the real battle code in a scratch simulation (4000 to 5000 fights per case); Task 8 re-measures and pins them.

Balance:

1. **The Warden is retuned for a shorter fight: HP 70 → 52, ATK 20 → 26, DEF 14 → 16, Mend 15–25 with a 2-turn wait → 10–16 with a 4-turn wait.** Rot Breath (7–12), agility, the action weights, XP and the four win-rate targets are unchanged. With the intended gear and three Herbs it is won 0.5% / 42% / 90% / 94% of the time at levels 4 / 5 / 6 / 7 (now: 0.6% / 30% / 80% / 93%). A won fight takes about 14 rounds at level 6 and 13 at level 7 (now 19 and 18). Those counts include the turns the hero spends healing; I could not get level 6 under 13 without breaking a win-rate target. If you would rather keep the long fight, veto this and only the Warden's move into game data happens.
2. **Barrow Mirelings are eased: HP 24 → 22, ATK 20 → 16, DEF 14 → 12.** XP 18 and gold 12–18 stay. As they stand, a level 6 hero in full gear loses 16 of 36 HP in every fight, which makes two floors of them a wall. Eased, the same hero loses about 10 HP in 3.5 rounds; at level 5 with the Iron Knife the fight is won 95% of the time but costs 21 HP; at level 4 it is lost four times in five.
3. **The Barrow's floor rolls for a fight at three-quarters of the normal rate** (about one step in 21), and the two floors are laid out so the shortest walk from the entrance to the Warden meets between 2 and 5 fights on average.
4. **A whole trip is tested, not just the boss.** A level 6 hero in the intended gear with three Herbs who wins four Barrow fights on the way in, healing between them, must still beat the Warden at least 75% of the time (measured 84%); a level 5 hero doing the same must win under 30% (measured 8%).
5. **Chest gold: 40 in the marsh copse, 90 on the Barrow's first floor.** The other two chests hold a Torch (floor 1) and the Bronze Sword (floor 2), as the design says.

The dungeon:

6. **The Barrow is entered by walking onto its mouth on the marsh**, which becomes a walkable tile. Stairs work the same way: step on them.
7. **A chest is opened by facing it and pressing confirm**: "You open the chest." then "You find 90 gold." or "You find the Torch." An opened chest shows open and says "The chest is empty." With a full pack: "You cannot carry more." and the chest stays shut for later.
8. **The light is a square**: one tile around the hero in the dark, three with a lit Torch, for 200 steps. Steps only count on dark floors. Lighting a Torch outside the dark ("There is no need for light here.") or while one burns ("Your torch still burns.") is refused and costs nothing. When it runs out: "Your torch gutters out."
9. **The Warden waits on one tile that cannot be walked around.** Stepping on it starts the fight; after a win the tile does nothing. Lose and you wake at Maren's as usual and the Warden is whole again. It plays its own song and cannot be run from.
10. **The journal page does not take a pack slot** (the design calls it slot-free), cannot be sold, and is read from Items without being used up. A reward of 0 gold is not mentioned: "You gain 300 experience."
11. **The sealed door** stands behind the Warden's tile. Facing it and pressing confirm gives the design's line: "The way down is shut. For now."

Copy (all mine, within §8.3; exact text in Task 7):

12. **After the Warden, Garrik, Odo, Pip, Bram and the two villagers get new lines.** Maren, Hesta and Tobin already have theirs. Named villagers still say their own name first; only Maren and Tobin use the third person. The Dimming is not over in these lines: the Warden was only a guard.
13. **The journal page is five short lines in Aldric's voice**: the Warden guards a stair, he sent Tobin back with the shield, and he went down. It does not say whose armor the Warden wears.

Sound and art:

14. **Two new songs**: `barrow` (slow, a low drone, a three-note figure with long silences, irregular soft ticks) and `warden` (the battle theme's motif at half speed and an octave lower, heavy bass). **Four new sounds**: stairs, chest, lighting a torch, and the monster's Mend (it borrowed the hero's heal sound). **And the design's blocked-movement "bump"** (added by the owner on approval): a short low thud when a step is refused by a wall, water or a villager; on the first refused step of a press, then at most once every 16 frames while the direction stays held.
15. **New art**: the Warden at 32×32; tiles for barrow wall, barrow floor, stairs down, stairs up, chest shut, chest open, the sealed door and a two-frame wall sconce; a stone backdrop strip for Barrow fights.

Tools and release:

16. **The debug overlay gains a row that switches the Warden-defeated flag on and off**, so the after-lines can be read without a full run.
17. **Deployment is prepared, not performed.** This repository has no GitHub remote. Task 9 adds a GitHub Pages workflow and a short how-to; creating the GitHub repository and pushing are yours to do or to tell me to do. The play-test before that is local, as in every earlier phase.

Records:

18. **The design doc is updated to match** (§9.8, §10.5 and the trigger kinds in §6.1).

Open questions carried from Phase 5, left as they are unless you say otherwise: the shop's price wording; level 2 heroes having an even chance in the marsh with one Heal; Torches being on sale before this phase (they now have a use).

## Global Constraints

- No runtime dependencies. All art, text and music are TypeScript data; everything original. Nothing from Dragon Warrior or any other published game: no names, sprites, tiles, melodies or text. Never "thou", "thee", "thy", "hath", "Fortune smiles upon thee", "Thou hast found". Use the copy pinned in the tasks verbatim.
- 256×240 logical, 16 px tiles, 8×8 font. Message window 4 lines × 28 characters at `(8, 176, 240, 56)`.
- Keys unchanged. Interactions stay one-button: no Search, Stairs or Door commands.
- **Story-free engine:** nothing under `src/engine/`, `src/game/`, `src/ui/` names a story character, place, monster, item, spell, shop or flag, or imports `data/items`, `data/maps`, `data/dialog`, `data/songs`, `data/story`, `data/monsters`, `data/spells`, `data/shops`. Story tables reach game code through `Game`. Monster ids, flags, dialog ids and song ids arrive from map and item data.
- **Stack discipline** (unchanged): a state that ends itself is removed by identity; a change of map from a menu uses `stack.reset`; state constructors never touch the DOM or browser storage; a dialog whose step opened another state waits until it is on top again.
- **Audio must not click.** Master level stays 0.25. A song never starts while a one-shot song is still playing.
- **One key press does one thing.**
- **Saves made in Phase 5 must still load.** The save version stays 1; new data rides in fields that already exist (flags, torch steps) or is optional.
- Owner checks (look and listen in the browser) are the owner's. Implementers list them verbatim and never report them as passed.
- A task is done when `npm test`, `npx tsc --noEmit` and `npm run build` are green. One commit per task. Every commit message ends with a `Co-Authored-By:` trailer naming **the model that wrote the commit** (`Claude Sonnet 5.5` for a Sonnet implementer; `Claude Fable 5.2` for the orchestrator). Run npm from `C:/Projects/VSCode/WarriorsQuest` (uppercase drive).
- Tests that build a `Game` follow `makeGame` in `test/state.test.ts`; screen-flow tests follow `test/shopState.test.ts`. Exact-value tests use `seqRng`.

## Review Focus

1. **A chest opened twice or lost**: confirm mashed through the chest's lines, cancel during them, a full pack, gold at the cap, a reload, a death. Each chest pays exactly once, stays open afterwards, and a refused chest can be opened later. Pinned in Task 2.
2. **Light at its edges**: a Torch lit where it is refused costs nothing; the last step of a Torch and a random fight on the same step; leaving the dark with steps left and coming back; steps surviving a battle, a save and Continue. Pinned in Task 3.
3. **Getting past or around the Warden**: its tile is the only way to the door beyond; fleeing is impossible; a loss puts it back at full strength; a win sets its flag once and gives the page once, even with a full pack and with cancel pressed through every line; the tile is quiet afterwards. Pinned in Tasks 4 and 6.
4. **Songs around the boss**: the Warden's song starts once; the fanfare, then the level-up jingle (300 XP always levels a hero who can win), then the page's lines, then the Barrow's song once; a loss ends in the town theme at Maren's. Pinned in Task 6.
5. **Old saves and new fields**: a Phase 5 save (no torch steps in use, eight pack entries at most) loads; a save with a lit Torch, a journal page beside a full pack and opened chests round-trips; a save naming a chest or flag this build does not know is still accepted. Pinned in Tasks 1 and 3.

---

## File Structure

```
src/game/map.ts                  + chest, look and boss triggers; warp sound
src/game/explore.ts              + chests, looks, boss tile, darkness, torch steps
src/game/light.ts                darkRects, lightRadius (pure)
src/game/effects.ts              + light and read effects
src/game/fieldUse.ts             + torch and reading; exhaustive effect handling
src/game/menu/fieldResult.ts     + opening a dialog from an item
src/game/player.ts               + PlayerState.torch
src/game/save.ts                 torch steps in and out; key items beside a full pack
src/game/inventory.ts            key items take no pack slot
src/game/battle/monster.ts       + MonsterDef.song
src/game/battle/ai.ts            stricter validateActions
src/game/battle/battle.ts        validates actions; reward text; Mend sound; exhaustive item effects
src/game/battle/battleState.ts   monster song; 32 px sprite
src/game/debug.ts                + flag rows
src/game/game.ts                 + StoryConfig.debugFlags
src/data/tiles.ts                + eight tiles
src/data/maps/barrow1.ts, barrow2.ts, marsh.ts, index.ts
src/data/monsters.ts             Barrow Mireling numbers; barrow_warden
src/data/items.ts                torch and journal uses
src/data/sprites/monsters.ts     + Warden
src/data/sprites/backdrops.ts    + barrow
src/data/songs/barrow.ts, warden.ts, index.ts
src/data/sfx.ts                  + stairs, chest, torch, mend, bump
src/data/dialog/hollowmere.ts    after-lines, journal, Warden's fall, sealed door
src/data/story.ts                + debugFlags
test/helpers/simulate.ts         + expedition; test/helpers/warden.ts removed
.github/workflows/pages.yml, README.md
```

---

### Task 1: Groundwork in the battle and item rules

**Files:**
- Modify: `src/game/battle/monster.ts`, `src/game/battle/ai.ts`, `src/game/battle/battle.ts`, `src/game/battle/battleState.ts`, `src/game/inventory.ts`, `src/game/save.ts`, `src/data/sfx.ts`, and tests `ai.test.ts`, `battle.test.ts`, `battleState.test.ts`, `inventory.test.ts`, `save.test.ts`, `sfx.test.ts`

**Interfaces:**
- Produces:
  - `MonsterDef.song?: string`. `BattleState` plays `game.songs[monster.song ?? 'battle']` and its constructor throws `Error('Unknown song: <id>')` for a missing one.
  - `validateActions` also throws when `weight`, `min`, `max` or `cooldown` is not a finite number, or `cooldown` is not a whole number. `new Battle(...)` calls it when the monster has actions.
  - `Battle`: a prize of 0 gold reads `You gain <xp> experience.`; otherwise unchanged. A monster's Mend plays the new sound `mend` (`[p1('E4', 3, 7, 0.125), p1('G4', 3, 7, 0.125), p1('B4', 6, 7, 0.125)]`), not `heal`.
  - `Battle.useItem` handles only `heal` effects; any other kind throws `Error('cannot act: not for battle')` from `act`, as a warp does now. The switch is exhaustive in the type system (a `never` check).
  - `inventory.ts`: `addItem` never refuses a `key` item for lack of slots; the 8-slot limit counts only entries that are not key items. `export function packSlots(items, p): number` returns that count.
  - `save.ts`: `parseSave` accepts up to `INVENTORY_SLOTS` entries that are not key items plus up to 8 key-item entries; everything else as before.

- [ ] **Step 1: Write failing tests**
  - `validateActions`: `weight: NaN`, `min: NaN`, `max: Infinity`, `cooldown: NaN`, `cooldown: 1.5` each throw; the existing valid lists still pass.
  - `new Battle` with actions `[{ do: 'attack', weight: 0 }]` throws at construction.
  - A monster with `gold: [0, 0]` and `xp: 300` that is defeated: the last beat's text is `You gain 300 experience.`; a monster with gold 2–4 still says `... and N gold.`
  - A monster Mend beat carries `sfx: 'mend'`; the hero's Heal still carries `heal`. `SFX.mend` differs from every other effect.
  - A battle kit item whose effect is not a heal: `act({ item })` throws `cannot act: not for battle` and uses nothing.
  - `BattleState` with a monster `song: 's'` and `songs: { s, battle }` plays `s` on enter; with no `song` plays `battle`; with `song: 'nope'` the constructor throws `Unknown song: nope`.
  - `addItem` of the journal page into a pack of 8 ordinary entries succeeds and `packSlots` is still 8; a ninth ordinary item is still refused; `sellRows`, `itemLines` and `equipLines` still list by pack order.
  - `parseSave`: a good save with 8 ordinary entries plus the journal page parses (Review Focus 5); 9 ordinary entries is still `null`; 9 key entries is `null`.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/ai.test.ts test/battle.test.ts test/battleState.test.ts test/inventory.test.ts test/save.test.ts test/sfx.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** per Interfaces.

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src test
git commit -m "feat: battle groundwork for the boss; key items take no pack slot"
```

---

### Task 2: Dungeon tiles, chests, looks and stairs

**Files:**
- Modify: `src/data/tiles.ts`, `src/game/map.ts`, `src/game/explore.ts`, `src/data/sfx.ts`, `src/data/maps/marsh.ts`, tests `tiles.test.ts`, `art.test.ts`, `sfx.test.ts`, `marsh.test.ts`, `interiors.test.ts`, the map screen's test file
- Create: `test/chests.test.ts`

**Interfaces:**
- Produces:
  - `TILE_IDS` gains `barrowWall: 19`, `barrowFloor: 20`, `stairsDown: 21`, `stairsUp: 22`, `chest: 23`, `chestOpen: 24`, `sealedDoor: 25`, `sconce: 26`. Walkable: `barrowFloor` (encounter rate 0.75), `stairsDown`, `stairsUp` (rate 0). The rest are not walkable. `sconce` has two frames. Tile names equal the keys.
  - Art (16×16, palette indices, in the file's existing style): rough dark stone for the wall; a darker, plainer floor that the hero reads against; stairs that read as going down and up; a banded chest shut and open on dark earth (it must also read on the marsh's grass); a heavy door with a bar across it; a sconce whose flame flickers between its two frames.
  - `map.ts`:
    - `WarpTrigger.sfx?: SfxId` (default `door`).
    - `interface ChestTrigger { kind: 'chest'; x: number; y: number; id: string; gold?: number; item?: string }` — exactly one of `gold` and `item`.
    - `interface LookTrigger { kind: 'look'; x: number; y: number; dialog: string }`.
    - `Trigger` includes both; `chestAt(map, x, y)` and `lookAt(map, x, y)` mirror `warpAt`.
    - `chestFlag(id: string): string` — `'chest_' + id`.
  - `explore.ts`:
    - Confirm while standing still, when no villager is the talk target: a `chest` trigger on the facing tile opens it; otherwise a `look` trigger on the facing tile shows its dialog.
    - Opening, when the chest's flag is not set: for gold, add it (capped at `GOLD_MAX`), set the flag, play `chest`, and show `You open the chest.` then `You find <n> gold.`; for an item, `addItem` first, and on success set the flag, play `chest` and show `You open the chest.` then `You find the <name>.`; on failure play `error`, show `You cannot carry more.` and leave the flag unset. The player is changed before the dialog opens, so cancel cannot undo or repeat it.
    - A chest whose flag is set: `The chest is empty.`
    - Render: a `chest` tile whose trigger's flag is set is drawn with the `chestOpen` art.
    - A warp plays its trigger's `sfx`.
    - Bump: `export const BUMP_REPEAT = 16`. When the hero stands still, a direction is held and the step is refused (the tile is not walkable, is off the map, or holds a villager), play `bump` if the bump wait is 0 and set the wait to `BUMP_REPEAT`. The wait falls by one each update and returns to 0 at once when no direction is held or a step begins. So: the first refused step of a press sounds at once; a held direction sounds again every 16 frames; a release and a new press sounds at once.
  - `sfx.ts`: `bump` — `[{ ch: 'tri', note: 'G2', frames: 3, vol: 10 }, { ch: 'tri', note: 'D2', frames: 3, vol: 10 }]`; `stairs` — `[p1('E4', 3, 8, 0.5), p1('C4', 3, 8, 0.5), p1('A3', 3, 8, 0.5), p1('F3', 5, 8, 0.5)]`; `chest` — `[{ ch: 'noise', preset: 'k', frames: 1, vol: 9 }, p1('G5', 2, 8, 0.25), p1('D6', 6, 8, 0.25)]`.
  - `marsh.ts`: the copse tile at `MARSH_POINTS.copse` becomes a `chest` tile with trigger `{ kind: 'chest', x: 3, y: 36, id: 'copse', gold: 40 }`; `barrowMouth` becomes walkable (encounter rate 0). The warp into the Barrow arrives in Task 4.

- [ ] **Step 1: Write failing tests**
  - Tiles: the eight ids, names and walkable flags above; `barrowFloor.encounterRate` is 0.75; `sconce` has two different frames; every new tile's art is 16×16 and uses only palette indices that exist (the existing art test's rule).
  - `chestAt`, `lookAt`, `chestFlag('copse') === 'chest_copse'`.
  - Data rule: every chest trigger in `MAPS` sits on a `chest` tile, every `chest` tile has a trigger, each has exactly one of `gold` and `item` (an item known to `ITEMS`), and chest ids are unique across all maps and at most 26 characters.
  - `test/chests.test.ts`, on a small test map (hero facing a chest), sounds recorded:
    - gold chest: one confirm → gold +40, flag set, `chest` played once, text `You open the chest.`; confirming on shows `You find 40 gold.`; after the dialog, confirm again → `The chest is empty.`, gold unchanged (Review Focus 1).
    - cancel on the first line: gold +40 and flag set all the same; a second confirm says the chest is empty.
    - at 65530 gold a 40-gold chest leaves 65535.
    - item chest with room: the item is in the pack, text `You find the Torch.`; with a full pack: `error`, `You cannot carry more.`, flag unset, pack unchanged; after freeing a slot the chest opens.
    - a player who already has the flag (as after Continue or a death) finds it empty.
    - render with a recording sprite cache: the chest tile draws `chest` art before and `chestOpen` art after.
    - a `look` trigger on the facing tile shows its dialog; with a villager as talk target, the villager wins.
    - a warp with `sfx: 'stairs'` plays `stairs`; one without plays `door`.
  - Bump (in `test/explore.test.ts` or the file that already tests refused steps), sounds recorded, hero facing a wall with the direction held: update 1 plays `bump` once; updates 2 to 16 play none; update 17 plays the second; after 48 held updates exactly three have played. Release for one update and press again: `bump` plays on that update. The same against water and against a villager. A step that succeeds plays no `bump`, and walking into a wall after a successful step plays it on the first refused update. `SFX.bump` differs from every other effect.
  - Marsh: the copse tile is a chest reachable only by facing it from (3, 35); the barrow mouth is walkable; the existing road and copse tests still hold.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/tiles.test.ts test/chests.test.ts test/marsh.test.ts test/sfx.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** per Interfaces (use the `pixel-art-sprites` skill for the tiles).

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src test
git commit -m "feat: dungeon tiles, chests, things to look at, stairs, and a bump"
```

Owner checks to list (not to perform): the chest in the marsh copse reads as a chest on grass, opens with its own sound, pays 40 gold once and then shows open; walking into a wall, water or a villager gives a short low thud that repeats slowly, not as a rattle, while the key is held; the new tiles are judged in Task 4's maps.

---

### Task 3: Darkness and the Torch

**Files:**
- Create: `src/game/light.ts`, `test/light.test.ts`
- Modify: `src/game/game.ts`, `src/game/effects.ts`, `src/game/fieldUse.ts`, `src/game/menu/itemsState.ts`, `src/game/menu/fieldResult.ts`, `src/game/player.ts`, `src/game/save.ts`, `src/game/explore.ts`, `src/data/items.ts`, `src/data/sfx.ts`, tests `fieldUse.test.ts`, `menuState.test.ts`, `save.test.ts`, `player.test.ts`, `sfx.test.ts`

**Interfaces:**
- Produces:
  - `player.ts`: `PlayerState.torch: number` (steps of torchlight left); `createPlayer` gives 0. `save.ts` writes it as `torchSteps` and reads it back.
  - `effects.ts`: `Effect` gains `{ kind: 'light'; radius: number; steps: number }` and `{ kind: 'read'; dialog: string }`. `rollEffect` draws nothing for either.
  - `light.ts`:
    - `DARK_RADIUS = 1`, `TORCH_RADIUS = 3`.
    - `lightRadius(dark: boolean, torch: number, torchRadius: number): number | null` — `null` on a map that is not dark; else `torchRadius` when `torch > 0`, else `DARK_RADIUS`.
    - `darkRects(heroX: number, heroY: number, radius: number): { x: number; y: number; w: number; h: number }[]` — the up-to-four rectangles that cover the 256×240 screen outside the square of `(2·radius + 1)` tiles centred on the 16 px tile at screen position `(heroX, heroY)`. Rectangles with no area are left out; none overlaps the square.
  - `fieldUse.ts`: `useItemInField(rng, items, p, itemId, ctx: { dark: boolean })` and `FieldResult`'s success form gains `dialog?: string`.
    - `light`: not dark → refused, `There is no need for light here.`; `p.torch > 0` → refused, `Your torch still burns.`; else the item is used up, `torch` becomes `steps`, text `You light the <name>.`, sound `torch`.
    - `read`: nothing is used up; success with `dialog: <id>`, empty text, sound `menuConfirm`.
    - `heal`, `damage`, `warp` as now. The effect switch is exhaustive (a `never` check); spells with `light` or `read` effects are refused with `You cannot use that now.`
  - `fieldResult.ts`: a result with `dialog` opens `game.dialogs[id]` (throwing `Error('Unknown dialog: <id>')` if missing) and shows no other line.
  - `explore.ts`:
    - `get lightRadius(): number | null` — `lightRadius(map.dark === true, player.torch, TORCH_RADIUS)`. The lit radius is that constant; the Torch's `radius` in item data must equal it (a data test checks).
    - Each completed step on a dark map with `torch > 0` lowers it by one. When it reaches 0 and that step started no battle and no warp, show `Your torch gutters out.`; if a battle or warp started, the light simply drops.
    - Render, on a dark map: after the tiles and before the hero, fill `darkRects(...)` black.
  - `game.ts`: `Game.fieldCtx?: () => { dark: boolean }`. The map screen sets it in `enter()` to report its current map; the Items screen calls it (defaulting to `{ dark: false }`) when an item is used.
  - `items.ts`: `torch` gains `use: { where: 'field', effect: { kind: 'light', radius: 3, steps: 200 } }`.
  - `sfx.ts`: `torch` — `[{ ch: 'noise', preset: 'h', frames: 2, vol: 8 }, p1('D4', 2, 7, 0.125), p1('A4', 2, 7, 0.125), p1('F#5', 6, 7, 0.125)]`.

- [ ] **Step 1: Write failing tests**
  - `darkRects(120, 104, 1)`: the lit square is x 104–151, y 88–135; the rectangles cover exactly the rest of the screen (check by area: 256×240 − 48×48) and none overlaps it. `darkRects(0, 0, 1)` (hero in a corner) returns only rectangles with area and still totals the right area. Radius 3 lights 112×112.
  - `lightRadius(false, 50, 3)` → `null`; `(true, 0, 3)` → 1; `(true, 1, 3)` → 3.
  - Torch in the dark with `torch 0`: used up, `torch 200`, text `You light the Torch.`, sound `torch`. Not dark: refused with the "no need" line, Torch kept, `torch` unchanged. Already lit: refused with `Your torch still burns.`, Torch kept (Review Focus 2).
  - A `read` item: success with `dialog` set, item kept, player otherwise unchanged.
  - Items screen flow: on a dark test map, choosing the Torch shows `You light the Torch.` and the count drops; on a lit map it shows the refusal and plays `error`.
  - Map-screen flow on a dark test map: with `torch 2`, two steps leave 0 and the second shows `Your torch gutters out.`; with encounters forced on the last step, the battle starts and no torch dialog appears before or after it; on a map that is not dark, steps leave `torch` alone; a battle fought with `torch 50` ends with 50.
  - Render: on a dark map the recording context receives black `fillRect` calls equal to `darkRects` for the hero's screen position, after the tile draws and before the hero's draw; on a lit map none.
  - Save: `torch 137` round-trips through `toSave`, `parseSave`, `fromSave`; a Phase 5 save text (with `torchSteps: 0`) still loads with `torch 0` (Review Focus 5).
  - Data: the Torch's `radius` equals `TORCH_RADIUS`; the Torch is not offered in battle (`battleKit` leaves it out).

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/light.test.ts test/fieldUse.test.ts test/menuState.test.ts test/save.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** per Interfaces.

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src test
git commit -m "feat: darkness, and a Torch that pushes it back"
```

Owner checks to list (not to perform): judged in Task 4's maps: in the Barrow you see one tile around you; lighting a Torch from Items widens it to three with a small flare sound; walking 200 steps ends it with a line of text; a Torch cannot be lit in town.

---

### Task 4: The two floors of the Barrow

**Files:**
- Create: `src/data/maps/barrow1.ts`, `src/data/maps/barrow2.ts`, `test/barrow.test.ts`
- Modify: `src/data/maps/index.ts`, `src/data/maps/marsh.ts`, `src/data/sprites/backdrops.ts`, `src/game/map.ts`, tests `interiors.test.ts`, `art.test.ts`

**Interfaces:**
- Consumes: Task 2's tiles and triggers; Task 3's darkness.
- Produces:
  - `map.ts`: `interface BossTrigger { kind: 'boss'; x: number; y: number; monster: string; backdrop: string; flag: string; dialog: string }`, part of `Trigger`; `bossAt(map, x, y)`. (The map screen acts on it in Task 6.)
  - `barrow_1` and `barrow_2`: each 24×24, `dark: true`, `music: 'barrow'` (the song arrives in Task 5; until then use `marsh` and Task 5 switches it), `border` the barrow wall, encounters `{ baseRate: 1 / 16, zones: { barrowFloor: { backdrop: 'barrow', monsters: [{ monster: 'barrow_mireling', weight: 1 }] } } }`.
  - Floor 1: entry `mouth` just inside; a warp tile back to the marsh's new entry `barrow` at (40, 7) facing down; chests `barrow_gold` (90 gold) and `barrow_torch` (a Torch), each off the main way; `stairsDown` warping to floor 2's entry `stairs` with `sfx: 'stairs'`.
  - Floor 2: `stairsUp` back to floor 1's entry `stairs`; chest `barrow_sword` (Bronze Sword) at the end of a corridor one tile wide and at least 8 tiles long that is not on the way to the Warden; the Warden's tile (a `boss` trigger: monster `barrow_warden`, backdrop `barrow`, flag `warden_defeated`, dialog `warden_fallen`) at the mouth of a chamber; inside the chamber two sconces on the walls and, on the far wall, the `sealedDoor` tile with a `look` trigger whose dialog is `sealed_door`.
  - Marsh: the barrow mouth tile gets a warp to `barrow_1` / `mouth`; the marsh gains entry `barrow`.
  - `backdrops.ts`: `barrow`, a 16×24 strip of worked stone that tiles sideways; black above row 8, like the others.
  - Layout is the implementer's, within these rules and the tests below. Corridors may be one or two tiles wide; avoid large open rooms (in the dark they read as nothing).

- [ ] **Step 1: Write failing tests** in `test/barrow.test.ts`:
  - Both maps are 24×24, dark, registered in `MAPS` under their ids; every warp between marsh, floor 1 and floor 2 lands on a walkable tile and round-trips (stepping back from an arrival tile is possible without immediately re-warping: an arrival tile is never itself a warp tile).
  - Every walkable tile on each floor can be reached from its entries, except that on floor 2 the chamber is reached only through the Warden's tile: remove that tile from the walkable set and neither the sealed door's facing tile nor any chamber tile is reachable from the stairs (Review Focus 3).
  - Each chest is reachable (a walkable tile faces it); the sword's corridor rule holds (the facing tile's only way out is a run of at least 8 tiles each with exactly two walkable neighbours).
  - The shortest walk from floor 1's `mouth` to the Warden's tile, counted in steps across both floors, is between 45 and 105 (decision 3: that is 2 to 5 fights at one step in 21, after the 3 quiet steps on each floor).
  - Each chest is a detour: the tile that faces it is at least 6 steps from the nearest tile of the test's shortest walk.
  - Floor 2 has exactly one `boss` trigger, one `sealedDoor` tile with one `look` trigger facing into the chamber, and two `sconce` tiles in the chamber's walls.
  - `interiors.test.ts`: the registry lists eight maps; the list of warps that are not on door tiles is updated; the "interior" rules skip the two Barrow floors.
  - `backdropArt('barrow')` exists, is 16×24, and its left and right columns match for tiling.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/barrow.test.ts test/interiors.test.ts`
Expected: FAIL.

- [ ] **Step 3: Author the maps** as ASCII with a legend, as `marsh.ts` does, and the backdrop (with the `pixel-art-sprites` skill).

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src test
git commit -m "feat: the Sunken Barrow, two floors in the dark"
```

Owner checks to list (not to perform): walk from the gate to the mound and step onto it: fade, and you stand inside in the dark; walls, floor, stairs, chests and the sconces read clearly at one tile of light and at three; the way to the stairs can be found without a Torch but is easier with one; the sword's corridor feels like a detour worth taking; stairs play a descending sound; Barrow fights show a stone backdrop; no chest or stair is hidden in a way that needs luck.

---

### Task 5: The Barrow's song and the Warden's song

**Files:**
- Create: `src/data/songs/barrow.ts`, `src/data/songs/warden.ts`
- Modify: `src/data/songs/index.ts`, `src/data/maps/barrow1.ts`, `src/data/maps/barrow2.ts`, `test/songs.test.ts`

**Interfaces:**
- Produces, each with a header comment stating its key, bar plan and what each voice does, as `marsh.ts` does:
  - `BARROW_SONG`, id `barrow`, tempo 60, 8 bars of 16 rows, loops from row 0. D minor. The triangle holds a low drone: D2 for bars 1–4, C2 for bars 5–6, D2 for bars 7–8. Pulse 1 (duty 0.25, vol 6) plays one three-note figure, D4 F4 E4, in bars 2 and 6 and its answer, D4 F4 A4, in bar 4, and is silent in bars 1, 3, 5, 7 and 8. Pulse 2 (duty 0.125, vol 4) answers once, in bar 8, with a single held A3. The noise track is a soft hat at rows that form no regular pulse: no two gaps between consecutive ticks are equal within a bar, and there are between 8 and 14 ticks in all.
  - `WARDEN_SONG`, id `warden`, tempo 104, 8 bars of 16 rows, loops from row 0. A minor, one chord per bar: Am | Am | F | E | Am | Dm | B♭ | E. Pulse 1 (duty 0.5, vol 11) opens with `BATTLE_MOTIF` an octave lower, each note twice as long as in the battle theme, and returns to it in bar 5. Pulse 2 holds two chord tones per bar in long notes. The triangle plays the bar's root on every beat, low. Noise: kick on every beat, snare on beat 3.
  - Both registered in `SONGS`; both Barrow maps use `music: 'barrow'`.

- [ ] **Step 1: Write failing tests** in `test/songs.test.ts`:
  - Both songs pass `validateSong`, have 128 rows and loop.
  - `barrow`: the triangle's sounded notes are only D2 and C2; pulse 1 sounds only in bars 2, 4 and 6; the noise track has 8 to 14 ticks and within each bar no two consecutive gaps are equal.
  - `warden`: pulse 1's first five sounded notes are `BATTLE_MOTIF` one octave down, and the rows between their starts are twice those of the battle theme's statement; every triangle note is the root of its bar's chord (A, A, F, E, A, D, A#, E) and lies below C3; the tempo is lower than the battle theme's.
  - Each Barrow map's `music` is `barrow`.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/songs.test.ts`
Expected: FAIL.

- [ ] **Step 3: Compose** per Interfaces.

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src test
git commit -m "feat: songs for the Barrow and its Warden"
```

Owner checks to list (not to perform): the Barrow's song is sparse and uneasy and loops without a seam or a click; the Warden's song is recognisably the battle theme's tune, slower and heavier; neither reminds you of a tune from another game.

---

### Task 6: The Barrow Warden

**Files:**
- Modify: `src/data/sprites/monsters.ts`, `src/data/monsters.ts`, `src/game/explore.ts`, `src/game/battle/battleState.ts`, `src/data/items.ts`, `src/data/dialog/hollowmere.ts` (two placeholder scripts that Task 7 replaces: `warden_fallen` giving the page, `journal_page_1` setting its flag), tests `battleState.test.ts`, `monsters.test.ts`, `art.test.ts`, `balance.test.ts` (import only)
- Create: `test/warden.test.ts`
- Delete: `test/helpers/warden.ts`

**Interfaces:**
- Consumes: Task 1's `MonsterDef.song` and key-item rule; Task 3's `read` effect; Task 4's `boss` trigger; Task 5's `warden` song.
- Produces:
  - `monsters.ts`: `barrow_warden`, with the numbers the test fixture holds today (HP 70, ATK 20, DEF 14, AGI 12, XP 300, gold 0–0, dodge 1/32, cannot be run from, boss, the three actions) plus `intro: 'The Barrow Warden rises.'`, `sprite: 'warden'`, `song: 'warden'`. Task 8 changes the numbers. `balance.test.ts` imports it from the table.
  - `sprites/monsters.ts`: `monsterArt('warden', 0)`, 32×32: a long-dead figure, taller than a Mireling and facing the viewer, in the remains of plate armor of a make seen nowhere else in the game (a ridged helm, one pauldron gone); no weapon raised; two dim eyes. Three or four colours and black gaps, no outline (the field is black). It must not resemble any published game's knight or skeleton sprite.
  - `battleState.ts` draws a sprite of any height with its feet on the same line as now.
  - `explore.ts`:
    - Completing a step onto a `boss` trigger whose flag is not set starts that battle (the trigger's monster and backdrop) in place of the encounter roll; with the flag set, the tile is ordinary floor with no encounter roll.
    - When that battle is won: set the trigger's flag, then show the trigger's dialog. The flag is set before the dialog opens.
    - A lost battle is handled as any other.
  - `items.ts`: `journal_page` gains `use: { where: 'field', effect: { kind: 'read', dialog: 'journal_page_1' } }`.
  - Placeholder scripts: `warden_fallen: [{ give: 'journal_page' }, 'You found a page.']` and `journal_page_1: ['A page.', { set: 'journal_read' }]`.

- [ ] **Step 1: Write failing tests** in `test/warden.test.ts` (a small dark test map: floor, a boss tile, floor beyond; songs and sounds recorded; a rigged monster where the outcome must be forced):
  - Stepping onto the boss tile starts a battle with the trigger's monster: the encounter sting, then the monster's song once (Review Focus 4). Run is refused with `The <name> blocks the way!` every time.
  - Won (monster with 1 HP, 300 XP, hero at level 6): the fanfare beat, the level-up beats, then after the battle closes the flag is set, the trigger's dialog is on top, and when it ends the map's song has been played once since the battle and the pack holds exactly one page.
  - Cancel pressed through every beat and line of that sequence: flag set once, one page (Review Focus 3).
  - Won with 8 ordinary pack entries: the page still arrives.
  - Stepping off and back onto the tile after the win: no battle, no dialog, no encounter roll on that tile.
  - Lost (monster that kills): the hero wakes at the respawn point with the flag unset; walking back onto the tile starts the fight again with the monster at full HP.
  - A hero who already has the flag (as after Continue) never triggers the fight.
  - `MONSTERS.barrow_warden`: `validateActions` passes; `song` is in `SONGS`; `monsterArt('warden', 0)` is 32×32 and uses only existing palette indices; every monster's sprite id is known to `monsterArt`.
  - Reading: with the page in the pack, Items → the page opens `journal_page_1`; afterwards the page is still held and `journal_read` is set; the page's `sellPrice` is 0.
  - Battle render with the 32-pixel sprite: it is drawn at y 72 (feet at 104), and a 24-pixel one still at y 80.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/warden.test.ts test/monsters.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** per Interfaces (the sprite with the `pixel-art-sprites` skill).

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean (the balance bands still pass: the numbers have not moved).

- [ ] **Step 5: Commit**
```bash
git add -A src test
git commit -m "feat: the Barrow Warden guards its tile"
```

Owner checks to list (not to perform): the Warden reads as a dead thing in someone else's armor and is clearly bigger than a Mireling; it does not overlap the stat window or the message window; its song starts with the fight; "Run" never works; after winning, the fanfare and level-up jingle play in turn and then the page is found; walking over its tile again does nothing.

---

### Task 7: The journal page, the sealed door and what the town says afterwards

**Files:**
- Modify: `src/data/dialog/hollowmere.ts`, `src/data/story.ts`, `src/game/game.ts`, `src/game/debug.ts`, `src/game/player.ts`, tests `dialogContent.test.ts`, `debugState.test.ts`, `player.test.ts`

**Interfaces:**
- Produces:
  - `player.ts`: `clearFlag(p, flag): PlayerState`.
  - `game.ts`: `StoryConfig.debugFlags: string[]`; `story.ts` sets `['warden_defeated']`. `debug.ts` adds one row per entry, `Flag: <id> ON` / `Flag: <id> OFF`, between the Give rows and Close, toggling the flag.
  - `DialogId` gains `warden_fallen`, `journal_page_1`, `sealed_door`.
  - Scripts (exact copy):
    ```ts
    warden_fallen: [
      'The Warden folds, and is only armor.',
      'Among the rusted plates lies a page, folded small.',
      { give: 'journal_page' },
      { sfx: 'chest' },
      "You found Aldric's Journal, Page 1.",
    ],
    journal_page_1: [
      'The hand is cramped and quick.',
      'The thing at the door is only a warden. It guards a stair, not a grave.',
      'What sours the land is below it. I can hear water moving down there.',
      'Tobin will go no further. I have sent him home with my shield. Let it guard you, if I cannot.',
      'If my child ever reads this: I did not leave you. I went down to finish it.',
      { set: 'journal_read' },
    ],
    sealed_door: ['The way down is shut. For now.'],
    ```
  - After the Warden (each wrapped in `{ if: 'warden_defeated', then: [...], else: [<today's lines>] }`; shop steps stay where they are):
    - `garrik` before the shop: `'I am Garrik the smith, and I was wrong about one thing. You came back.'`, `'Look over the racks. You will be going down again.'`; after the shop: `'Your father was still a fool. I will not say it of you yet.'`
    - `odo` before the shop: `"Odo's Goods, and Odo himself. They say you walked out of the Barrow."`; after: `'Prices have not come down. Give the cold time to hear the news.'`
    - `pip`: `"I'm Pip! Is it true? Did you fight the thing in the Barrow?"`, `'Mum says Aldric was real after all.'`, `'Can I hold the sword? Just once?'`
    - `bram`: `'They will shout "Bram, open up!" for you now, at any hour.'`, `'I walked your father to this gate. I should have walked you.'`, `'The marsh is no quieter. But you came back through it.'`
    - `villager_a`: `'Thin crops still. But they say the Barrow is quiet, so I planted anyway.'`
    - `villager_b`: `'The river is as cold as ever. I put my hand in this morning to be sure.'`

- [ ] **Step 1: Write failing tests**
  - Every named villager's first line contains their name on both branches (the existing test, now meaningful for six more branches); no line has a name tag; none uses a banned word; every text step fits two pages; every `ask` fits three lines.
  - `garrik` and `odo` open their shop exactly once on both branches.
  - Each of Garrik, Odo, Pip, Bram and the two villagers says something different once the flag is set.
  - `warden_fallen` gives the page once and plays `chest`; `journal_page_1` sets `journal_read`, gives nothing and has five text lines; `sealed_door` is the one line above.
  - No script begins with a `shop`, `rest`, `pay` or `save` step (the existing rule, over the new scripts too).
  - `clearFlag` removes a flag and leaves others; clearing an absent flag returns the same player.
  - Debug: the row reads `Flag: warden_defeated OFF`, confirm sets the flag and the row reads `ON`, confirm again clears it; the production bundle check in Task 10 still finds no `Flag: `.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/dialogContent.test.ts test/debugState.test.ts test/player.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** per Interfaces.

- [ ] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 5: Commit**
```bash
git add src test
git commit -m "feat: the journal page, the sealed door, and a town that noticed"
```

Owner checks to list (not to perform): with the debug flag row switched on, talk to all nine townsfolk and read the after-lines; each still sounds like that person and nobody declares the Dimming over; Hesta's longer inn question fits its window; the journal reads as Aldric and leaves you wanting the next page; the door's line appears when you face it.

---

### Task 8: Balance: the Warden, the Barrow Mireling and the whole trip

**Files:**
- Modify: `src/data/monsters.ts`, `test/helpers/simulate.ts`, `test/balance.test.ts`, `test/monsters.test.ts`, `docs/superpowers/specs/2026-11-11-the-dimming-vertical-slice-design.md` (§9.8, §10.5)

**Interfaces:**
- Produces:
  - `barrow_warden`: HP 52, ATK 26, DEF 16; Mend `min 10, max 16, cooldown 4`. Everything else as Task 6 left it.
  - `barrow_mireling`: HP 22, ATK 16, DEF 12.
  - `simulate.ts`: `expedition(rng, p, opts: { fights: number; road: MonsterDef; roadPolicy: Policy; boss: MonsterDef; bossPolicy: Policy }, n): { reachRate: number; winRate: number }` — plays `fights` battles against `road` in a row, carrying HP, MP and used items forward (no XP), casting the hero's heal spell between fights while at least 13 HP are missing and MP allows; then the boss. `winRate` is over all `n` trips.
  - If a threshold below fails with the real code, stop and report the measured numbers; do not move a threshold or a number.

- [ ] **Step 1: Change the numbers and write the tests** (`N = 4000` unless stated; scratch measurements in brackets):
  - The four Warden bands, unchanged: level 4 under 3% [0.5%], level 5 under 50% [42%], level 6 over 70% [90%], level 7 over 90% [94%].
  - Length: mean rounds of won fights is at most 15.5 at level 6 [14.4] and at most 13.5 at level 7 [12.6].
  - The stated level 6 stats: attack 27, defence 14.
  - Barrow Mireling, fight only: level 6 in full gear wins at least 99%, in at most 4 rounds [3.5], losing at most 11 HP [9.6]; level 5 with Iron Knife, Leather Armor and shield wins at least 85% [95%]; level 4 with the same wins under 40% [22%].
  - The trip (decision 4), `N = 2000`: level 6, full gear, three Herbs, four Barrow fights with `healer(10, null)`, then the Warden with `healer(18, 8)`: `winRate` at least 0.75 [0.84]; level 5 the same: under 0.30 [0.08]; level 7 the same: at least 0.88 [0.94].
  - Design doc: §10.5's Barrow Mireling and Warden rows, §9.8's numbers, and §9.8's sentence about the fight's length ("about 14 rounds at level 6 in simulation, healing turns included").

- [ ] **Step 2: Run them**
Run: `npx vitest run test/balance.test.ts test/monsters.test.ts`
Expected: PASS, including every earlier case unchanged.

- [ ] **Step 3: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; clean.

- [ ] **Step 4: Commit**
```bash
git add src test docs/superpowers/specs
git commit -m "feat: a shorter Warden fight and a Barrow that can be crossed"
```

Owner checks to list (not to perform): at level 6 with the Bronze Sword, Leather Armor and a few Herbs, the walk to the Warden costs some HP and MP but leaves enough to fight; the Warden fight is tense and over in a dozen or so rounds; at level 5 it usually kills you; say which fights felt too easy or too hard.

---

### Task 9: A build that can be shared

**Files:**
- Create: `.github/workflows/pages.yml`, `README.md`
- Modify: `vite.config.ts` only if the test below shows a path problem

**Interfaces:**
- Produces:
  - A workflow named `Deploy to GitHub Pages` that runs on a push to `master` and on manual dispatch: checkout, Node 22, `npm ci`, `npm test`, `npm run build`, then the official `actions/configure-pages`, `actions/upload-pages-artifact` (path `dist`) and `actions/deploy-pages` actions, with the permissions those need (`pages: write`, `id-token: write`, `contents: read`) and a `pages` concurrency group. No secrets, no third-party actions.
  - `README.md`: what the game is (two sentences), the three commands, the keys, and "Putting it online": create an empty GitHub repository, add it as `origin`, push `master`, set Pages' source to "GitHub Actions"; the link's form. It names nothing as done.
  - Nothing is pushed, and no remote is added, in this task.

- [ ] **Step 1: Write a failing test** (`test/build.test.ts`, reading files as raw text as `interiors.test.ts` does): the workflow file exists, mentions `npm test` before `npm run build`, uploads `dist`, and uses only actions whose owner is `actions`; `vite.config.ts` keeps `base: './'` (so the build works under a sub-path).

- [ ] **Step 2: Run it to verify it fails**
Run: `npx vitest run test/build.test.ts`
Expected: FAIL (no workflow).

- [ ] **Step 3: Write the workflow and the README.**

- [ ] **Step 4: Run everything, then check the built page**
Run: `npm test && npx tsc --noEmit && npm run build`, then confirm `dist/index.html` refers to its script with a relative path.
Expected: PASS; clean; relative.

- [ ] **Step 5: Commit**
```bash
git add .github README.md test/build.test.ts
git commit -m "chore: a GitHub Pages workflow and a README"
```

---

### Task 10: Records and the phase stop (orchestrator)

**Files:**
- Modify: `docs/superpowers/specs/2026-11-11-the-dimming-vertical-slice-design.md`, this plan
- Create: `docs/superpowers/notes/2026-11-13-phase-6-carry-forward.md`

- [ ] **Step 1: Update the design doc** (decision 18): §6.1's trigger kinds (warp, auto, chest, look, boss) and the walk-onto Barrow mouth; §10.4's Torch rules as built; §10.5 and §9.8 if Task 8 left anything out.
- [ ] **Step 2: Verify the branch**
Run: `npm test && npx tsc --noEmit && npm run build`, then search the built bundle for `Give: `, `Fight: ` and `Flag: `.
Expected: PASS; clean; no matches.
- [ ] **Step 3: Write the carry-forward note**: where execution stands, the measured balance table, rulings with their cost if wrong, the final review's findings, deferred minors, questions for the owner, the steps to put the game online, and the owner play-test list below plus every task's owner checks. Mark the list as not performed by anyone.
- [ ] **Step 4: Tick this plan's steps and add an "Execution status" section** listing where the delivered code differs from the task text.
- [ ] **Step 5: Commit**
```bash
git add docs
git commit -m "docs: Phase 6 complete — design doc in step, rulings, owner play-test list"
```

**Stop here for the owner's play-test.** Spec §14: a full run from New Game to the journal page; note which fights felt too easy or too hard. The shared link comes after the owner creates the repository and pushes, or says to.
