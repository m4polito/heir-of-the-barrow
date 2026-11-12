# Phase 2: A Town That Talks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From the title screen, name the hero, wake in Maren's house, receive Aldric's Shield in the opening scene, walk Hollowmere talking to every villager, enter every building, open a menu to see status and equip the shield, with a title theme, text blips, and menu sounds; plus a dev-only debug overlay.

**Architecture:** Phase 1's engine stays. A `Game` context object (player state, maps, sprite cache, audio, font, stack) is passed to states so new states (Title, NameEntry, Dialog, Menu, Transition, Debug) compose on the stack. Dialog is a pure script interpreter plus a pure typewriter/pagination model, rendered by a thin state. NPCs are map placements with pure wander logic. Sound effects go through a second synth instance on their own gain. Interiors are small maps linked by warp triggers.

**Tech Stack:** TypeScript 5, Vite 6, Vitest 3 (node), Canvas 2D, Web Audio. No runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-11-11-the-dimming-vertical-slice-design.md` (§4.4, §4.6, §5.2–5.3, §6.1, §7, §8, §10.1–10.4, §12.3–12.5, §13, §14 Phase 2). Carry-forward notes: `docs/superpowers/notes/2026-11-11-phase-1-review-notes.md`.

## Execution status (updated 2026-11-12, phase stop)

- **All 14 tasks complete and reviewed; the final whole-branch review and its fix wave are done (head `b743657`). Stopped for the owner's play-test; not merged.** Rulings, open questions for the owner, and the play-test list are in the carry-forward notes. Amendments made during Tasks 9–14 that differ from the task text below: Task 10 talks across one non-walkable tile and snaps a stepping NPC before turning it; Task 11's `candidates` is `string[]` and the Equip window widens to fit its longest line (Status is 128 wide); Task 5's `hasMore` is also true when a later script step is pending; a text blip no longer interrupts another sound effect; Task 14 injects the item table through `Game.items`.
- History: branch `phase-2` from `master` (Phase 1 merged). Execution method: subagent-driven; Sonnet implementers, Sonnet reviewers, Opus for audio (Task 4 done), integration (Tasks 9, 10) and the final whole-branch review; the orchestrator (Fable) reviews creative calls (dialog text, art) itself. Gated: stop after Task 14 for the owner's play-test.
- Handoff notes for the next session: `docs/superpowers/notes/2026-11-11-phase-2-carry-forward.md` (rulings, deferred minors, what the SDD ledger held). The SDD workspace under `.superpowers/sdd/` is git-ignored; if it is still on disk the next session reuses its ledger and briefs, otherwise it recreates the briefs with the skill's `task-brief` script and treats Tasks 1–8 as done.
- Agreed and already folded into the tasks below: the owner's stack/transition discipline (Global Constraints and Tasks 9, 10, 12, 13); the Task 1 test replacement; `menuConfirm` duty 0.5; the Task 4 synth redesign (see Task 4's "Delivered" note); the owner's **story-free engine rule** (CLAUDE.md; Global Constraints; Tasks 5, 7, 9, 10, 12, 13 updated; Task 14 cleans up Tasks 1–4 and Phase 1 code at the end of the phase). Rulings made while executing Tasks 5–8 that later tasks must honour are in the carry-forward notes under "Rulings made during execution (session 2)"; the one that changes a task's text is **Task 10's talk reach** (talk across one non-walkable tile so counters work).

## Global Constraints

- No runtime dependencies. All art, text, and music are TypeScript data; everything original (nothing from Dragon Warrior or any published game).
- 256×240 logical, 16 px tiles, 8×8 font (`Font.drawText`, `measure`). Dialog window: 4 lines × 28 characters.
- Keys unchanged: move Arrows/WASD; confirm Z/Enter/Space; cancel/menu X/Escape; mute M. New: debug overlay on Backquote (dev builds only).
- Interactions are one-button and walk-into: doors warp on step, confirm talks to the NPC you face. No Stairs/Door/Search commands.
- Owner checks (look/listen in the browser) are the owner's. Implementers list them verbatim and never report them as passed.
- Art tasks (NPC sprites, interior tiles) load `.claude/skills/pixel-art-sprites/SKILL.md`; the plan wins on conflicts.
- Debug overlay code must be absent from `npm run build` output (`import.meta.env.DEV` guard + dynamic import).
- **Stack discipline (owner):** `StateStack.reset(state)` exits and clears every state then pushes; `StateStack.remove(state)` removes by identity. `TransitionState` removes itself by identity, never `pop()`. New game and debug warps use `reset`. Auto triggers never fire from a constructor or a transition's `onMid`; Explore marks "entered map" and fires pending auto triggers on its first `update()` as the top state, after the fade-in has finished.
- State constructors (`ExploreState`, `DialogState`, `TransitionState`) must not touch the DOM so they can be driven on a real `StateStack` in node tests; `SpriteCache` compiles lazily on first `get`, and `Font` is only used in `render`.
- **Story-free engine (owner, added after Task 4):** engine and systems code (`src/engine/`, `src/game/`, `src/ui/`) must not reference story-specific names (characters, places, items, flags). Story content lives in `src/data/`; the starting map, entry, and opening scene come from a single `src/data/story.ts` config. Interpretation for Tasks 5–13: no literal story identifiers (`'hollowmere'`, `'maren_intro'`, `'aldric_shield'`, `'Wren'`, `'intro_done'`, "THE DIMMING") and no union types enumerating them in those folders; ids there are `string`. Story registries (`MAPS`, `DIALOGS`, `SONGS`, `STORY`) are injected through the `Game` context from `main.ts`, never imported into `src/game/`. Presentation registries keyed by generic archetypes (`TILES`, `HERO_SPRITES`, `NPC_SPRITES`, `SFX`) may be imported. Tasks 1–4 are not refactored now; their violations are listed in the carry-forward notes for cleanup at the end of the phase.
- Every commit message ends with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Run npm from `C:/Projects/VSCode/WarriorsQuest` (uppercase drive).
- Phase ends when the automated suite passes and the owner checks are listed; stop for owner feedback before Phase 3.

## Review Focus

1. **A dialog line longer than 4 wrapped lines, or a word longer than 28 characters**: paginate and hard-split; text never overflows the window. Pinned in Task 5.
2. **Confirm pressed while text is still typing**: that press reveals the page and nothing more; the next press advances. One press never does both. Pinned in Task 5.
3. **Giving an item when the inventory is full** (8 slots): the script says "You cannot carry more." and continues; nothing is lost silently. Pinned in Tasks 1 and 5.
4. **An NPC wandering onto a door, entry, or the hero's tile**, or placed on one: never happens, so the hero never spawns inside an NPC. Pinned in Tasks 7 and 8.
5. **Opening the menu or talking mid-step**: only when the hero is idle on a tile, so the hero never freezes between tiles. Pinned in Task 10 (talk) and Task 11 (menu) via `heroIdle`.

---

## File Structure

```
src/engine/input.ts            + repeat(action) with delay/interval
src/engine/rng.ts              createRng (mulberry32)
src/engine/font.ts             drawText gains scale
src/engine/spriteCache.ts      SpriteCache (shared art → canvas)
src/engine/audio/sfx.ts        SfxPlayer over ApuLike
src/engine/audio/audio.ts      + sfx Apu/gain, playSfx, SONG_LEVEL
src/ui/window.ts               drawWindow, drawMenu
src/ui/wrap.ts                 wrapText, substitute
src/ui/menuList.ts             MenuList (cursor model)
src/data/levels.ts             LEVELS table (§10.1), levelForXp
src/data/items.ts              ITEMS (§10.3–10.4)
src/data/sfx.ts                SFX sequences
src/data/songs/index.ts        SONGS registry, SongId
src/data/songs/title.ts        title theme
src/data/dialog/hollowmere.ts  DIALOGS: every NPC script + Maren intro
src/data/sprites/npcs.ts       NPC_SPRITES (6 bodies × 4 dirs × 2 frames)
src/data/tiles.ts              + floorWood, counter, bed, table
src/data/maps/{elderHouse,inn,forge,shop}.ts  interiors
src/data/maps/hollowmere.ts    + npcs, door warps
src/data/maps/index.ts         MAPS registry, MapId
src/game/player.ts             PlayerState, createPlayer, flags, applyLevel
src/game/stats.ts              attackOf, defenseOf, statusLines
src/game/inventory.ts          addItem, removeItem, equip, unequip, lines
src/game/map.ts                + MapId, Trigger, NpcPlacement, triggerAt
src/game/hero.ts               updateHero(canEnter, onArrive), facingTile, opposite, heroIdle
src/game/npc.ts                NpcState, updateNpc (wander)
src/game/dialog/script.ts      DialogScript types, ScriptRunner
src/game/dialog/model.ts       DialogModel (typewriter + pages + choice)
src/game/dialog/dialogState.ts DialogState
src/game/game.ts               Game context, createGame
src/game/transition.ts         TransitionState, transitionAlpha
src/game/explore.ts            refactor: Game ctx, warps, NPCs, talk, auto triggers
src/game/menu/{menuState,statusState,itemsState,equipState}.ts
src/game/title.ts              TitleState
src/game/nameEntry.ts          NameEntryModel, NameEntryState
src/game/debug.ts              DebugState + installDebug (dev only)
src/main.ts                    Game wiring, Boot → Title
test/*.test.ts                 one per pure module
```

---

### Task 1: Player state, levels, items, inventory

**Files:**
- Create: `src/data/levels.ts`, `src/data/items.ts`, `src/game/player.ts`, `src/game/stats.ts`, `src/game/inventory.ts`, `test/player.test.ts`, `test/inventory.test.ts`

**Interfaces:**
- Produces:
  - `type SpellId = 'heal'|'ember'|'homeward'`; `interface LevelRow { level; xp; str; agi; maxHp; maxMp; learns?: SpellId }`; `LEVELS: readonly LevelRow[]` = exactly spec §10.1's ten rows; `levelForXp(xp: number): number`.
  - `type ItemId = 'aldric_shield'|'wooden_club'|'iron_knife'|'bronze_sword'|'cloth_tunic'|'leather_armor'|'plank_shield'|'herb'|'torch'|'journal_page'`; `type ItemKind = 'weapon'|'armor'|'shield'|'consumable'|'key'`; `interface ItemDef { id: ItemId; name: string; kind: ItemKind; atk?: number; def?: number; price: number; stack: number }`; `ITEMS: Record<ItemId, ItemDef>` with names "Aldric's Shield", "Wooden Club", "Iron Knife", "Bronze Sword", "Cloth Tunic", "Leather Armor", "Plank Shield", "Herb", "Torch", "Journal Page"; stats and prices from §10.3–10.4 (`price: 0` for unsold); `stack` 6 for consumables, 1 otherwise.
  - `type EquipSlot = 'weapon'|'armor'|'shield'`; `interface InventorySlot { item: ItemId; count: number }`; `interface PlayerState { name; level; xp; hp; mp; gold; str; agi; maxHp; maxMp; equipment: Partial<Record<EquipSlot, ItemId>>; inventory: InventorySlot[]; flags: string[] }`; `createPlayer(name: string): PlayerState` (level 1 from `LEVELS[0]`, hp = maxHp, mp = maxMp, gold 40, inventory `[{ item: 'herb', count: 1 }]`, no equipment, no flags); `hasFlag(p, flag): boolean`; `setFlag(p, flag): PlayerState` (pure; no duplicates); `applyLevel(p, level): PlayerState` (sets `level, str, agi, maxHp, maxMp` from the table, keeps hp and mp at the same ratio of max, rounded down, min 1 hp; xp set to that row's threshold).
  - `attackOf(p): number` = `str + (weapon atk ?? 0)`; `defenseOf(p): number` = `floor(agi / 2) + (armor def ?? 0) + (shield def ?? 0)`.
  - `INVENTORY_SLOTS = 8`; `addItem(p, id, n = 1): { player: PlayerState; ok: boolean }` (fills existing stacks up to `ITEMS[id].stack`, then new slots; `ok: false` and unchanged player if it cannot all fit); `removeItem(p, id, n = 1): { player; ok }`; `equip(p, id): { player; ok }` (item must be in inventory and be weapon/armor/shield; it leaves the inventory; a previously equipped item in that slot returns to the inventory, `ok: false` unchanged if that would not fit); `unequip(p, slot): { player; ok }`.

- [x] **Step 1: Write failing tests**
  - `test/player.test.ts`: `LEVELS.length === 10`; `LEVELS[2]` is `{ level: 3, xp: 23, str: 7, agi: 6, maxHp: 24, maxMp: 5, learns: 'heal' }`; `levelForXp(0) === 1`, `levelForXp(22) === 2`, `levelForXp(23) === 3`, `levelForXp(2000) === 10`, `levelForXp(99999) === 10`; `createPlayer('Wren')` → `{ level: 1, hp: 15, maxHp: 15, mp: 0, gold: 40, str: 4, agi: 4 }`, inventory one herb, `flags: []`; `setFlag` twice leaves one flag and does not mutate the input; `applyLevel(p, 5)` → `str 12, agi 10, maxHp 35, maxMp 20, xp 110`, and a player at 10/15 hp becomes 23/35; `attackOf(createPlayer('x')) === 4`; after equipping `aldric_shield`, `defenseOf === 6`; `ITEMS.bronze_sword.price === 180`, `ITEMS.herb.stack === 6`.
  - `test/inventory.test.ts`: adding 7 herbs yields slots `[6, 1]`; filling 8 slots then adding a club → `ok: false` and the player unchanged (Review Focus 3); `removeItem` across stacks; `equip` moves the shield from inventory to `equipment.shield`; equipping a second shield swaps them (old one back in inventory); equip with a full inventory and an occupied slot → `ok: false`; `unequip` returns the item; equipping a consumable → `ok: false`.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/player.test.ts test/inventory.test.ts`
Expected: FAIL (modules missing).

- [x] **Step 3: Implement the five files** per Interfaces. All functions pure (spread, never mutate).

- [x] **Step 4: Run tests to verify they pass**
Run: `npx vitest run test/player.test.ts test/inventory.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**
```bash
git add src/data/levels.ts src/data/items.ts src/game/player.ts src/game/stats.ts src/game/inventory.ts test/player.test.ts test/inventory.test.ts
git commit -m "feat: player state, level table, items, inventory"
```

---

### Task 2: Input key-repeat and seeded RNG

**Files:**
- Create: `src/engine/rng.ts`, `test/rng.test.ts`
- Modify: `src/engine/input.ts`, `src/engine/constants.ts`, `test/input.test.ts`

**Interfaces:**
- Produces:
  - `Action` gains `'debug'`; `KEY_MAP.Backquote = 'debug'`.
  - `Input.repeat(a: Action): boolean` — true on the tick the action is first pressed, then, while held, true again after `REPEAT_DELAY = 16` ticks and every `REPEAT_INTERVAL = 5` ticks after that. Both exported constants.
  - `interface Rng { next(): number; int(min: number, max: number): number }` (`next` in [0,1); `int` inclusive both ends); `createRng(seed: number): Rng` (mulberry32).

- [x] **Step 1: Write failing tests**
  - `test/input.test.ts` additions: hold `KeyS` and call `update()` 30 times recording `repeat('down')` → true at ticks 1, 17, 22, 27 only; releasing and re-pressing fires immediately again; `keyDown('Backquote'); update()` → `pressed('debug')`.
  - `test/rng.test.ts`: two rngs with seed 42 produce the same first 5 `next()` values; 1000 `int(1, 6)` draws are all within 1..6 and hit every value; `next()` always `< 1` and `>= 0` over 1000 draws.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/input.test.ts test/rng.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement.** `Input` keeps `heldTicks: Map<Action, number>` updated in `update()`.

- [x] **Step 4: Run tests to verify they pass**
Run: `npx vitest run test/input.test.ts test/rng.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**
```bash
git add src/engine/rng.ts src/engine/input.ts src/engine/constants.ts test/rng.test.ts test/input.test.ts
git commit -m "feat: key repeat for menus and seeded rng"
```

---

### Task 3: UI primitives (window, wrap, menu list, scaled text)

**Files:**
- Create: `src/ui/window.ts`, `src/ui/wrap.ts`, `src/ui/menuList.ts`, `test/wrap.test.ts`, `test/menuList.test.ts`
- Modify: `src/engine/font.ts`

**Interfaces:**
- Consumes: `Font`.
- Produces:
  - `Font.drawText(ctx, text, x, y, scale = 1)` (draws each glyph at `8*scale` px); `Font.measure(text, scale = 1)`.
  - `drawWindow(ctx, x, y, w, h): void` — black fill, 1 px white border at the edge, second 1 px white border inset by 3 px (double line, §8.1). `drawMenu(ctx, font, items: readonly string[], cursor: number, x, y, lineH = 10): void` draws `▶` at `x` on the cursor row and each item at `x + 8`.
  - `wrapText(text: string, cols: number): string[]` — greedy word wrap on spaces; a word longer than `cols` is hard-split; empty text → `['']`. `substitute(text: string, vars: Record<string, string>): string` replaces `{key}`.
  - `class MenuList { constructor(items: readonly string[]); readonly items; cursor: number; up(): void; down(): void; get selected(): string }` wrapping at both ends.

- [x] **Step 1: Write failing tests**
  - `test/wrap.test.ts`: `wrapText('You have your father\'s eyes, Wren.', 28)` → `["You have your father's eyes,", "Wren."]`; a 40-char word at cols 28 → two lines of 28 and 12; `wrapText('', 28)` → `['']`; a line of exactly 28 chars stays one line; `substitute('Hi {name}!', { name: 'Wren' })` → `'Hi Wren!'`.
  - `test/menuList.test.ts`: 3 items, `down` ×3 wraps to 0, `up` from 0 → 2, `selected` matches.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/wrap.test.ts test/menuList.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** the four files and the `scale` parameter.

- [x] **Step 4: Run tests to verify they pass**
Run: `npx vitest run` and `npx tsc --noEmit`
Expected: PASS; clean.

- [x] **Step 5: Commit**
```bash
git add src/ui src/engine/font.ts test/wrap.test.ts test/menuList.test.ts
git commit -m "feat: window drawing, text wrap, menu list, scaled text"
```

---

### Task 4: Sound effects path

**Files:**
- Create: `src/data/sfx.ts`, `src/engine/audio/sfx.ts`, `test/sfx.test.ts`, `test/apu.test.ts` (added in review)
- Modify: `src/engine/audio/audio.ts`, `test/audio.test.ts`, `src/engine/audio/apu.ts` (scope widened in review)

**Delivered (differs from the Phase 1 description of `Apu`; `ApuLike` unchanged):** the review found that any `cancelScheduledValues` on an in-flight ramp snaps the gain back immediately, so interrupting one SFX with another clicked. `Apu` is now **per-note voices**: every `noteOn` creates oscillator → env gain → kill gain → destination, started at `s = max(time, rampEnd[ch])`, with a 3 ms attack; a new note on the same channel releases the previous voice at `s` (3 ms crossfade); `noteOff` anchors the env at its level no earlier than the attack's end, then ramps to 0 and stops the source; `noiseHit` is the same shape with its filter and decay; `stopAll(time)` ramps every live voice's kill gain 1→0 over 3 ms and stops it. No automation is ever cancelled anywhere, so every anchor equals the curve value. `test/apu.test.ts` drives the real `Apu` through a fake `AudioContext` that models the automation curve, throws on cancel, and asserts continuity at every `setValueAtTime`. Consequences for later phases: frequency is fixed per voice (vibrato/slides in spec §12.1 will need per-voice automation), and the sequencer should clamp scheduled times to `ctx.currentTime` before emitting (deferred).

**Interfaces:**
- Consumes: `ApuLike`, `Apu`, `noteToMidi`, `midiToFreq`.
- Produces:
  - `type SfxId = 'blip'|'menuMove'|'menuConfirm'|'menuCancel'|'door'|'error'`; `interface SfxStep { ch: Channel; frames: number; vol: number; note?: string; preset?: NoisePreset; duty?: Duty; rest?: true }`; `SFX: Record<SfxId, SfxStep[]>`:
    - blip: `[{ ch: 'p1', note: 'C6', duty: 0.25, frames: 2, vol: 6 }]`
    - menuMove: `[{ ch: 'p1', note: 'E5', duty: 0.5, frames: 2, vol: 8 }]`
    - menuConfirm: `[{ p1 'C5' 2f vol 9 }, { p1 'G5' 4f vol 9 }]`
    - menuCancel: `[{ p1 'G4' duty 0.5 3f vol 8 }]`
    - door: `[{ ch: 'noise', preset: 'k', frames: 1, vol: 10 }, { ch: 'tri', note: 'C3', frames: 5, vol: 12 }]`
    - error: `[{ p1 'G#3' duty 0.125 4f vol 9 }, { ch: 'p1', rest: true, frames: 2, vol: 0 }, { p1 'G#3' duty 0.125 4f vol 9 }]`
  - `class SfxPlayer { constructor(apu: ApuLike); play(steps: SfxStep[], startTime: number): void }` — calls `apu.stopAll(startTime)`, then schedules steps sequentially: pitched → `noteOn(ch, freq, t, { duty, vol })` and `noteOff(ch, t + frames/60)`; noise → `noiseHit(preset, t, vol)`; rest → advances time only. `t` advances by `frames/60` per step.
  - `AudioManager`: `SONG_LEVEL = 0.5` (replaces the `1` that `playSong` restores `songGain` to); on unlock also creates `sfxGain` (gain 1 → master) and a second `Apu` into it, plus a `SfxPlayer`; `playSfx(id: SfxId): void` (no-op before unlock; else `play(SFX[id], ctx.currentTime + 0.005)`).

- [x] **Step 1: Write failing tests**
  - `test/sfx.test.ts` with a `FakeApu` recording calls: `play(SFX.blip, 10)` → `stopAll@10`, `noteOn p1 ≈1046.5 @10 duty 0.25 vol 6`, `noteOff p1 @10.0333`; `play(SFX.door, 10)` → `noiseHit k @10 vol 10`, `noteOn tri ≈130.81 @10.0167`, `noteOff tri @10.1`; `play(SFX.error, 10)` → second `G#3` noteOn at `10 + 6/60`; every `SFX` entry validates (`noteToMidi` on each note does not throw).
  - `test/audio.test.ts`: `playSfx('blip')` before unlock does not throw; after a stubbed unlock, `vi.spyOn(SfxPlayer.prototype, 'play')` is called once with `SFX.blip`.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/sfx.test.ts test/audio.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** per Interfaces.

- [x] **Step 4: Run tests to verify they pass**
Run: `npx vitest run` and `npx tsc --noEmit`
Expected: PASS; clean.

- [x] **Step 5: Commit**
```bash
git add src/data/sfx.ts src/engine/audio/sfx.ts src/engine/audio/audio.ts test/sfx.test.ts test/audio.test.ts
git commit -m "feat: sound effects path with second synth and song ducking"
```

---

### Task 5: Dialog script interpreter and typewriter model (pure)

**Files:**
- Create: `src/game/dialog/script.ts`, `src/game/dialog/model.ts`, `test/dialogScript.test.ts`, `test/dialogModel.test.ts`

**Interfaces:**
- Consumes: `SfxId`, `wrapText`, `substitute`. (Story-free: item ids are plain strings here; the env validates them against item data.)
- Produces:
  - `type DialogNode = string | { if: string | { not: string }; then: DialogScript; else?: DialogScript } | { choice: [string, string]; yes: DialogScript; no: DialogScript } | { set: string } | { give: string } | { gold: number } | { heal: true } | { sfx: SfxId }`; `type DialogScript = DialogNode[]`.
  - `interface ScriptEnv { name: string; has(flag: string): boolean; set(flag: string): void; give(item: string): boolean; gold(n: number): void; heal(): void; sfx(id: SfxId): void }`.
  - `type ScriptStep = { kind: 'text'; text: string } | { kind: 'choice'; options: [string, string] }`; `class ScriptRunner { constructor(script: DialogScript, env: ScriptEnv); next(answer?: boolean): ScriptStep | null }` — runs effects silently until a text or choice; `{name}` substituted; a failed `give` yields the text `"You cannot carry more."` in place of the effect; after a `choice` step the caller passes `answer` to the next `next()`; `null` when finished. Nested scripts run in place.
  - `class DialogModel { constructor(runner: ScriptRunner, cols = 28, rows = 4); get lines(): string[] (revealed text of the current page); get revealed(): boolean; get hasMore(): boolean; get isChoice(): boolean; choiceCursor: 0 | 1; get done(): boolean; tick(): boolean (reveals one more character; true if that character was not a space); confirm(): void; moveChoice(delta: -1 | 1): void }` — a text step is wrapped to `cols` and split into pages of `rows` lines; `confirm()` on an unrevealed page reveals it fully and does nothing else; on a revealed page it advances (next page, next step, or submits the choice as `answer = cursor === 0`); `done` after the runner returns `null`. A choice step is its own page showing the two options; `revealed` is true immediately for it.

- [x] **Step 1: Write failing tests**
  - `test/dialogScript.test.ts` with a fake env (flags in a Set, give returns a configurable boolean, records calls): a 2-line script yields two text steps then null; `{ if: 'x', then: ['A'], else: ['B'] }` yields `B` when unset and `A` when set; `{ if: { not: 'x' } … }` inverts; `{ set: 'met' }` sets the flag before the following text; `{ give: 'aldric_shield' }` calls `give` and, when it returns false, yields the text `"You cannot carry more."`; a `choice` step followed by `next(true)` yields the `yes` branch and `next(false)` the `no` branch; `"Hello, {name}."` substitutes the env name.
  - `test/dialogModel.test.ts`: with text `"You have your father's eyes, Wren."`, after 5 `tick()`s `lines[0] === 'You h'`; `tick()` returns false on the space; `confirm()` before revealed reveals all and `revealed === true` but `done === false` (Review Focus 2); the second `confirm()` on a 1-step script sets `done`; a 150-char text at 28×4 produces two pages (`hasMore` true after the first page is revealed, false on the second); a 40-char word is split and never yields a line longer than 28 (Review Focus 1); a choice step has `isChoice`, `moveChoice(1)` sets cursor 1, `confirm()` submits `answer false` and the `no` text follows; a text with an 8-char name substituted still wraps within 28.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/dialogScript.test.ts test/dialogModel.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** both modules.

- [x] **Step 4: Run tests to verify they pass**
Run: `npx vitest run test/dialogScript.test.ts test/dialogModel.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**
```bash
git add src/game/dialog/script.ts src/game/dialog/model.ts test/dialogScript.test.ts test/dialogModel.test.ts
git commit -m "feat: dialog script interpreter and typewriter model"
```

---

### Task 6: Hollowmere dialog content

**Files:**
- Create: `src/data/dialog/hollowmere.ts`, `test/dialogContent.test.ts`

**Interfaces:**
- Consumes: `DialogScript`, `ScriptRunner`.
- Produces: `DIALOGS: Record<DialogId, DialogScript>` with `type DialogId = 'maren_intro'|'maren'|'hesta'|'garrik'|'odo'|'pip'|'bram'|'tobin'|'villager_a'|'villager_b'`. Flags used: `shield_received` (set by `maren_intro`), `warden_defeated` (checked by `tobin`, `maren`, `hesta` for Phase 6 lines; unset now).

- [x] **Step 1: Write failing tests** in `test/dialogContent.test.ts`: every `DialogId` key exists; running each script through `ScriptRunner` with a fake env (no flags, `give` → true) yields at least one text step and terminates; every text step wraps to ≤ 8 lines at 28 cols (two pages max); `maren_intro` calls `give('aldric_shield')` and `set('shield_received')`; `tobin` yields a different first text when `warden_defeated` is set; no text contains the words "Dragon", "Erdrick", "Tantegel", "Alefgard", or "Slime".

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/dialogContent.test.ts`
Expected: FAIL.

- [x] **Step 3: Write the scripts** following spec §5.1, §5.3 and §8.3. Beats to hit, one idea per line, second person, no name tags:
  - `maren_intro` (runs once, in Maren's house, new game): it is the hero's coming-of-age morning; Maren gives Aldric's shield (`{ give: 'aldric_shield' }`, `{ sfx: 'menuConfirm' }`, `{ set: 'shield_received' }`); she says the squire carried it out of the Barrow twenty years ago and never spoke of it; she does not ask the hero to go.
  - `maren`: quiet, a little afraid; mentions the Dimming; if `warden_defeated`: she asks what the hero found down there.
  - `hesta`: loved Aldric; "you look more like him every day"; a bed costs 6 gold (no inn logic yet).
  - `garrik`: thinks Aldric was a fool who left a family; sells what a fool needs (no shop logic yet).
  - `odo`: herbs and torches; prices are going up with the Dimming.
  - `pip`: thinks Aldric is a bedtime story; asks if the hero has seen a real sword.
  - `bram`: "I walked your father to this gate. North-east, past the dead willow. I'll not walk you."
  - `tobin`: default: won't meet your eyes, mumbles, "Leave it." If `warden_defeated`: he finally speaks: the Warden wasn't wearing Aldric's armor.
  - `villager_a`, `villager_b`: one line each about thin crops / the cold river.

- [x] **Step 4: Run tests to verify they pass**
Run: `npx vitest run test/dialogContent.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**
```bash
git add src/data/dialog/hollowmere.ts test/dialogContent.test.ts
git commit -m "feat: Hollowmere dialog scripts"
```

---

### Task 7: Map model extensions, interior tiles and maps, NPC placements

**Files:**
- Create: `src/data/story.ts`, `src/data/maps/elderHouse.ts`, `src/data/maps/inn.ts`, `src/data/maps/forge.ts`, `src/data/maps/shop.ts`, `src/data/maps/index.ts`, `test/interiors.test.ts`
- Modify: `src/game/map.ts`, `src/game/hero.ts`, `src/data/tiles.ts`, `src/data/maps/hollowmere.ts`, `test/hero.test.ts`, `test/map.test.ts`, `test/tiles.test.ts`

**Interfaces:**
- Consumes: `Dir`, `DIR_VECTORS`. (Story-free: `src/game/map.ts` uses `string` ids; the unions live in `src/data/`.)
- Produces:
  - In `src/game/map.ts`: `interface NpcPlacement { id: string; sprite: string; palette?: number; x; y; facing: Dir; wander: boolean; dialog: string }` (`palette` is a swap index for the `adult` body: 0 default, 1, 2); `interface WarpTrigger { kind: 'warp'; x; y; to: string; entry: string }`; `interface AutoTrigger { kind: 'auto'; flag: string; dialog: string }`; `type Trigger = WarpTrigger | AutoTrigger`; `GameMap` gains `npcs: NpcPlacement[]`, `triggers: Trigger[]`; `id` and `music` stay `string` (remove the Phase 1 `SongId` union from this file); `warpAt(map, x, y): WarpTrigger | undefined`.
  - In `src/data/maps/index.ts`: `MAPS` (the five maps) and `type MapId = keyof typeof MAPS`. In `src/data/dialog/hollowmere.ts` `DialogId` already exists (Task 6); `NpcSpriteId` is defined in Task 8's `src/data/sprites/npcs.ts`. Map data files may use those unions for their own type safety.
  - `src/data/story.ts`: `export const STORY = { title: 'THE DIMMING', defaultHeroName: 'Wren', newGame: { map: 'elder_house', entry: 'start' }, opening: { map: 'elder_house', flag: 'intro_done', dialog: 'maren_intro' } } as const` — the single source for the starting map, entry, and opening scene. `elderHouse.ts` builds its auto trigger from `STORY.opening` (`{ kind: 'auto', flag: STORY.opening.flag, dialog: STORY.opening.dialog }`) rather than repeating the literals. The generic shape `interface StoryConfig { title: string; defaultHeroName: string; newGame: { map: string; entry: string }; opening: { map: string; flag: string; dialog: string } }` is declared in Task 9's `src/game/game.ts`; `STORY` must satisfy it.
  - `updateHero(h, held, canEnter: (x: number, y: number) => boolean, onArrive?: (x: number, y: number) => boolean): HeroState` — `canEnter` replaces `map`; `onArrive` is called once when a step's `stepFrame` reaches 0 this tick; if it returns `true` the hero does not chain into the next step. `facingTile(h): { x; y }`; `opposite(d: Dir): Dir`; `heroIdle(h): boolean` (`stepFrame === 0`).
  - `TILE_IDS` gains `floorWood: 10, counter: 11, bed: 12, table: 13` (walkable: floorWood only; encounterRate 0). Legend chars for maps: `w`, `c`, `b`, `T`.
  - `MAPS: Record<MapId, GameMap>` in `src/data/maps/index.ts`.
  - Interiors 12×9 each: `#` border, `w` floor, a `D` door centered in the bottom wall row with a warp to `hollowmere` at the tile *below* that building's exterior door (facing `down`); `entry.door` is the tile above the interior door facing `up`. Hollowmere's four exterior door tiles each get a warp to the interior's `door` entry. Furnishings: elder house (table, bed; Maren `elder` behind the table, not wandering; `entry.start` = the tile in front of Maren facing `up`; triggers include `{ kind: 'auto', flag: 'intro_done', dialog: 'maren_intro' }`), inn (counter with Hesta `adult` palette 1 behind it, three beds), forge (counter with Garrik `smith`, a table), shop (counter with Odo `adult` palette 2). Hollowmere NPCs: Pip `child` near the well (wander), Bram `guard` just inside the gate (facing down, no wander), Tobin `squire` behind the inn (no wander), villager_a and villager_b `adult` (wander) on grass. No NPC on a door, entry, or warp tile.

- [x] **Step 1: Write failing tests**
  - `test/hero.test.ts`: existing cases pass with `canEnter = (x, y) => isWalkable(map, x, y)`; `onArrive` is called exactly once with `(1, 1)` on the tick the step completes; returning `true` leaves `stepFrame === 0` with no new step even though `right` is held; returning `false` chains; `facingTile` for `(1,1,'up')` → `(1,0)`; `opposite('left') === 'right'`; `heroIdle`.
  - `test/tiles.test.ts`: `TILES.length === 14`; `floorWood` walkable; `counter`, `bed`, `table` not.
  - `test/interiors.test.ts`: `MAPS` has all five ids and each `map.id` matches its key; every interior is 12×9 and has exactly one `D`; every warp's target map and entry exist; every warp round-trips: from each hollowmere door warp, the interior's `door` entry tile is walkable and its own door warp leads back to a walkable hollowmere tile adjacent to the originating door; flood fill from each interior's `door` entry reaches every walkable tile; no NPC in any map stands on a door tile, an entry tile, or a warp tile, and no two NPCs share a tile (Review Focus 4); every NPC `dialog` is a key of `DIALOGS` and every NPC `sprite` is a key of `NPC_SPRITES` once Task 8 lands (write the sprite check against a local list of the six archetype names for now); `MAPS[STORY.newGame.map].entry[STORY.newGame.entry]` exists; `MAPS[STORY.opening.map].triggers` contains an auto trigger with `STORY.opening.flag` and `STORY.opening.dialog`; `grep`-style guard: no file under `src/game/` or `src/engine/` contains the strings `'hollowmere'`, `'elder_house'`, `'maren`, `'aldric`, `'intro_done'` (read the files in the test with `fs`; this pins the story-free rule for the new code; list the Task 1–4 files that still violate it as exclusions with a comment pointing at the carry-forward notes).
  - `test/map.test.ts`: `warpAt(HOLLOWMERE, 12, 4)` is the elder-house warp; `warpAt(HOLLOWMERE, 0, 0)` undefined.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/hero.test.ts test/tiles.test.ts test/interiors.test.ts test/map.test.ts`
Expected: FAIL.

- [x] **Step 3: Draw the four interior tiles** (pixel-art skill loaded; original; 3–4 colours): wood floor (ochre planks, brown seams), counter (brown top, dark front), bed (white sheet, red blanket, brown frame), table (brown top with ochre highlight).

- [x] **Step 4: Implement** the map/hero changes, the four interior maps, hollowmere's NPCs and warps, and the registry.

- [x] **Step 5: Run tests to verify they pass**
Run: `npx vitest run` and `npx tsc --noEmit`
Expected: PASS; clean (note: `src/game/explore.ts` must still compile; adapt its `updateHero` call to `canEnter`).

- [x] **Step 6: Commit**
```bash
git add src/game/map.ts src/game/hero.ts src/data/tiles.ts src/data/maps test/hero.test.ts test/map.test.ts test/tiles.test.ts test/interiors.test.ts src/game/explore.ts
git commit -m "feat: map triggers, interiors, NPC placements, hero arrive hook"
```

---

### Task 8: NPC sprites and wander logic

**Files:**
- Create: `src/data/sprites/npcs.ts`, `src/game/npc.ts`, `test/npc.test.ts`
- Modify: `test/art.test.ts`

**Interfaces:**
- Consumes: `NpcPlacement`, `NpcSpriteId`, `Rng`, `PixelArt`, `Dir`, `DIR_VECTORS`.
- Produces:
  - `NPC_SPRITES: Record<NpcSpriteId, Record<Dir, [PixelArt, PixelArt]>>` — six original 16×16 bodies: `elder` (long robe, grey hair, staff), `adult` (tunic; colour key `t` for the tunic so palettes swap it), `smith` (apron, broad), `child` (short, big head), `guard` (helmet-less cap, spear), `squire` (slumped shoulders, bottle). `left` mirrored from `right`. `adultPalette(index: 0|1|2): Record<string, number>` returns the `adult` colour map with the tunic colour swapped (0 ochre 10, 1 teal 20, 2 purple 23); `npcArt(sprite, palette, dir, frame): PixelArt`.
  - `interface NpcState { def: NpcPlacement; x; y; facing: Dir; stepFrame: number; walkFrame: 0|1; wait: number }`; `createNpc(def): NpcState` (`wait` 60); `updateNpc(n: NpcState, rng: Rng, canEnter: (x, y) => boolean): NpcState` — pure: if `stepFrame > 0` decrement and return; else if `wait > 0` decrement; else if `def.wander`: pick a random `Dir` (`rng.int(0,3)`), set `facing`, and if the target is within 2 tiles of `def.x/def.y` (Chebyshev) and `canEnter(target)`, step (`stepFrame = STEP_FRAMES`, toggle `walkFrame`); then `wait = rng.int(45, 150)`. Non-wandering NPCs never move. `npcPixelOffset(n)` like the hero's.

- [x] **Step 1: Write failing tests**
  - `test/npc.test.ts` with `createRng(1)`: a non-wander NPC never changes position over 600 updates; a wander NPC on an open 7×7 grid stays within 2 tiles of home over 2000 updates; a wander NPC with `canEnter` always false never moves but still changes facing; `canEnter` is called with the target tile (so the caller can exclude doors, entries, the hero, and other NPCs — Review Focus 4); `adultPalette(1).t === 20`.
  - `test/art.test.ts`: every `NPC_SPRITES` frame (6 bodies × 4 dirs × 2) and each `adultPalette` variant compiles against `PALETTE` at 16×16.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/npc.test.ts test/art.test.ts`
Expected: FAIL.

- [x] **Step 3: Draw the six bodies** (pixel-art skill loaded; original; silhouettes distinguishable from each other and from the hero at 1×).

- [x] **Step 4: Implement `src/game/npc.ts`.**

- [x] **Step 5: Run tests to verify they pass**
Run: `npx vitest run test/npc.test.ts test/art.test.ts`
Expected: PASS.

- [x] **Step 6: Commit**
```bash
git add src/data/sprites/npcs.ts src/game/npc.ts test/npc.test.ts test/art.test.ts
git commit -m "feat: NPC sprites and wander logic"
```

---

### Task 9: Game context, sprite cache, transitions, Explore with warps and NPCs

**Files:**
- Create: `src/game/game.ts`, `src/engine/spriteCache.ts`, `src/game/transition.ts`, `src/data/songs/index.ts`, `test/transition.test.ts`
- Modify: `src/engine/state.ts`, `test/state.test.ts`, `src/game/explore.ts`, `src/game/map.ts`, `src/main.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `SONGS` in `src/data/songs/index.ts` with `type SongId = keyof typeof SONGS`; nothing under `src/game/` imports it (story-free rule); `GameMap.music` is a `string` looked up in `game.songs`.
  - `StateStack` additions: `reset(s: State): void` (calls `exit` on every state from top to bottom, clears, then `push(s)`); `remove(s: State): void` (removes that exact instance wherever it is, calling its `exit`; no-op if absent); `get states(): readonly State[]`; `contains(s: State): boolean`.
  - `class SpriteCache { get(art: PixelArt): HTMLCanvasElement }` — compiles lazily on first `get` per `PixelArt` identity; the constructor touches nothing.
  - `interface StoryConfig { title: string; defaultHeroName: string; newGame: { map: string; entry: string }; opening: { map: string; flag: string; dialog: string } }`; `interface Game { readonly stack: StateStack; readonly input: Input; readonly font: Font; readonly audio: AudioManager; readonly sprites: SpriteCache; readonly rng: Rng; readonly maps: Record<string, GameMap>; readonly dialogs: Record<string, DialogScript>; readonly songs: Record<string, Song>; readonly story: StoryConfig; player: PlayerState; debug: { noEncounters: boolean }; debugOpen?: () => void }`; `createGame(deps: Omit<Game, 'player' | 'debug' | 'debugOpen'> & { player: PlayerState }): Game`. Story registries are injected here from `main.ts` (`maps: MAPS, dialogs: DIALOGS, songs: SONGS, story: STORY`); nothing under `src/game/` imports them.
  - `transitionAlpha(t: number, frames: number): number` = `min(1, t / frames)` for the fade-out half when `t < frames`, `max(0, 2 - t / frames)` for the fade-in half (`t` in `0..2*frames`); `class TransitionState implements State { constructor(stack: StateStack, opts: { frames?: number /* 12 */; onMid: () => void }) }` pushed on the stack: renders a black rect with `globalAlpha = transitionAlpha(t, frames)` each frame; at `t === frames` calls `onMid` exactly once and then, because `onMid` may have `reset` the stack, ensures it is on top again (`stack.remove(this); stack.push(this)`); at `t === 2*frames` calls `stack.remove(this)` (never `pop`). `update` consumes input (nothing underneath moves).
  - `ExploreState`: `constructor(game: Game, mapId: string, entry: string)` (no DOM access; throws if `game.maps[mapId]` or the entry is missing); `get hero(): HeroState`; `get map(): GameMap`; `get mapId(): string`; `readonly npcs: NpcState[]`; `warpTo(mapId: string, entry: string): void` (plays `door` SFX, pushes a `TransitionState` whose `onMid` loads the new map, places the hero at the entry, rebuilds `npcs`, calls `game.audio.playSong(game.songs[map.music]!)`, and sets a private `enteredMap = true`; the constructor also sets `enteredMap = true`). `update`: `canEnter(x, y)` = `isWalkable` and no NPC at `(x, y)`; `onArrive` = if `warpAt(map, x, y)` → `warpTo` and return `true`; NPC `canEnter` additionally excludes the hero's tile, door tiles, every `entry` tile, and every warp tile. Render: tiles, then NPCs and hero sorted by `y` (hero last on ties), via `game.sprites`. The `hero` field is private with a getter. (`enteredMap` is consumed in Task 10.)
  - `main.ts`: builds `createGame({ …, maps: MAPS, dialogs: DIALOGS, songs: SONGS, story: STORY, player: createPlayer(STORY.defaultHeroName), rng: createRng(Date.now()) })`; `BootState.onStart` → `stack.reset(new ExploreState(game, STORY.newGame.map, STORY.newGame.entry))` and the Explore plays its map's song (interim until Task 12 adds the title flow; `main.ts` is wiring and may import data).

- [x] **Step 1: Write failing tests**
  - `test/transition.test.ts`: `transitionAlpha(0, 12) === 0`, `(6,12) === 0.5`, `(12,12) === 1`, `(18,12) === 0.5`, `(24,12) === 0`; on a real `StateStack` with a fake input, a `TransitionState({ frames: 12 })` calls `onMid` exactly once across 30 updates and is gone from `stack.states` by update 24; when `onMid` calls `stack.reset(fakeC)`, after the transition finishes `stack.states` is exactly `[fakeC]` and `fakeC.enter` was called once.
  - `test/state.test.ts`: `reset(c)` on `[a, b]` calls `b.exit` then `a.exit`, then `c.enter`, and `states` is `[c]`; `remove(b)` on `[a, b, c]` leaves `[a, c]` with `c` still `top` and `b.exit` called; a `TransitionState` with a fake state pushed on top of it (`[a, T, b]`): driving `T.update(input)` directly until it finishes leaves `[a, b]` (the owner's case: a transition under a pushed state removes only itself).

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/transition.test.ts test/state.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** the new modules and the Explore refactor; wire `main.ts`.

- [x] **Step 4: Run tests, typecheck, build**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 5: List owner checks** (do not perform): the game now starts inside Maren's house (interim, per `STORY.newGame`); walk out and into each of the four doors, fade to black, arrive inside facing up, walk back out through the door and arrive outside it; the door sound plays on each warp; Pip and two villagers wander near their homes and never walk through you or onto a door; Bram, Tobin, Maren, Hesta, Garrik, Odo stand still; the town theme does not restart when entering a building; no console errors.

- [x] **Step 6: Commit**
```bash
git add src/game/game.ts src/engine/spriteCache.ts src/game/transition.ts src/data/songs/index.ts src/game/explore.ts src/game/map.ts src/main.ts src/engine/state.ts test/transition.test.ts test/state.test.ts
git commit -m "feat: game context, transitions, door warps, NPCs on the map"
```

---

### Task 10: Dialog state, talking, and the opening scene

**Files:**
- Create: `src/game/dialog/dialogState.ts`
- Modify: `src/game/explore.ts`, `test/state.test.ts`

**Interfaces:**
- Consumes: `ScriptRunner`, `DialogModel`, `game.dialogs` (never `DIALOGS` directly), `drawWindow`, `Font`, `Game`, `setFlag`, `hasFlag`, `addItem`, `facingTile`, `opposite`, `heroIdle`. The env's `give(item)` returns false if `item` is not a known item id (check `ITEMS` via the inventory helpers' own validation; `addItem` must throw or return `ok:false` for an unknown id — add that guard to `addItem` here if it is missing).
- Produces:
  - `class DialogState implements State { constructor(game: Game, script: DialogScript, opts?: { onDone?: () => void }) }` (no DOM access in the constructor) — builds a `ScriptEnv` over `game.player` (`has/set` via flags, `give` via `addItem` writing back `game.player`, `gold` adds, `heal` sets hp/mp to max, `sfx` → `game.audio.playSfx`, `name` = player name) and a `DialogModel`. `update`: `tick()` each frame; when it returns true and the revealed character index is even, play `blip`; `confirm` → `model.confirm()` (play `menuConfirm` when submitting a choice); on a choice page, up/down/left/right move the cursor (`menuMove`); when `model.done`, pop and call `onDone`. `render`: `drawWindow(ctx, 8, 176, 240, 56)`; lines at `x = 16`, `y = 184 + 10 * i`; when revealed and `hasMore`, draw `▼` at `(232, 220)` blinking on `floor(frame / 16) % 2 === 0`; a choice page draws the two options at `(32, 194)` and `(32, 204)` with `▶` at `x = 24` on the cursor row.
  - `ExploreState` additions: on `pressed('confirm')` while `heroIdle`, find an NPC on `facingTile(hero)`; if found set `npc.facing = opposite(hero.facing)` and push `new DialogState(game, game.dialogs[npc.def.dialog]!)` (throw a clear error if the dialog id is unknown). **Auto triggers:** at the start of `update()` (which only runs while Explore is the top state, so after any transition has removed itself), if `enteredMap` is set: clear it, and for the first `auto` trigger whose flag is unset push `DialogState` with `onDone` setting that flag (`game.player = setFlag(...)`), then return for this tick. Never from the constructor or an `onMid`.

- [x] **Step 1: Write the failing test** in `test/state.test.ts` ("an auto trigger fires once, after the Transition is gone"): build a `Game` in node (`createGame` with `font: {} as Font`, `new AudioManager(null)`, a lazy `SpriteCache`, `createRng(1)`, `maps: MAPS, dialogs: DIALOGS, songs: SONGS, story: STORY`, `createPlayer(STORY.defaultHeroName)`, a real `StateStack`, a fake `Input` whose `pressed('confirm')` is true only while `stack.top instanceof DialogState` and everything else false); push `new TransitionState(stack, { frames: 2, onMid: () => stack.reset(new ExploreState(game, STORY.newGame.map, STORY.newGame.entry)) })`; drive `stack.update(input)`: while the transition is still in `stack.states`, assert no `DialogState` is in `stack.states`; once it is gone, assert the very next update makes `stack.top` a `DialogState`; keep updating (bounded, 2000 ticks) until `stack.top` is the `ExploreState` again; assert `hasFlag(game.player, 'intro_done')`, `hasFlag(game.player, 'shield_received')`, and the inventory contains `aldric_shield`; 100 more updates push no new `DialogState`.

- [x] **Step 2: Run the test to verify it fails**
Run: `npx vitest run test/state.test.ts`
Expected: FAIL (DialogState missing).

- [x] **Step 3: Implement** `DialogState` and the Explore additions.

- [x] **Step 4: Run tests, typecheck, build**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 5: List owner checks** (do not perform): face an NPC and press confirm, they turn to you, text types out letter by letter with a blip, confirm skips to the end of the page, confirm again advances, `▼` blinks when there is more; walk into Maren's house for the first time and the opening scene runs by itself after the fade-in completes, ending with Aldric's Shield in your items (check in Task 11's menu); talking to Maren again gives her normal line; every villager has a line; Tobin's line is different from the others' tone; no console errors.

- [x] **Step 6: Commit**
```bash
git add src/game/dialog/dialogState.ts src/game/explore.ts test/state.test.ts
git commit -m "feat: dialog state, talking to NPCs, Maren's opening scene"
```

---

### Task 11: Menu: Status, Items, Equip

**Files:**
- Create: `src/game/menu/menuState.ts`, `src/game/menu/statusState.ts`, `src/game/menu/itemsState.ts`, `src/game/menu/equipState.ts`, `test/menuLines.test.ts`
- Modify: `src/game/stats.ts`, `src/game/inventory.ts`, `src/game/explore.ts`, `src/game/dialog/dialogState.ts` (adds `opts.onChoice`)

**Interfaces:**
- Consumes: `MenuList`, `drawWindow`, `drawMenu`, `Input.repeat`, `Game`, `equip`, `unequip`, `DialogState`.
- Produces:
  - `statusLines(p: PlayerState): string[]` = `['NAME ' + name, 'LV   ' + level, 'HP   ' + hp + '/' + maxHp, 'MP   ' + mp + '/' + maxMp, 'GOLD ' + gold, 'XP   ' + xp, 'STR  ' + str, 'AGI  ' + agi, 'ATK  ' + attackOf, 'DEF  ' + defenseOf]`.
  - `itemLines(p): string[]` = one per inventory slot `"{name} x{count}"` for consumables, `"{name}"` otherwise; `['Nothing']` when empty. `equipLines(p): { slots: string[]; candidates: ItemId[] }` — slots `['WEAPON: ' + (name|'none'), 'ARMOR:  …', 'SHIELD: …']`, candidates = inventory items of equipment kind.
  - `MenuState(game)`: window at `(8, 8, 72, 40)` listing `Status`, `Items`, `Equip`; `repeat('up'|'down')` moves (`menuMove`); confirm pushes the chosen sub-state (`menuConfirm`); cancel pops (`menuCancel`). `StatusState(game)`: window `(8, 8, 112, 112)` with `statusLines`; cancel pops. `ItemsState(game)`: window `(88, 8, 160, 100)` listing `itemLines`; confirm on a consumable → `error` SFX and a one-line `DialogState` "You cannot use that now."; confirm on equipment → `DialogState` with a `choice` `['Yes', 'No']` "Equip it?" whose `yes` branch equips (via a small inline script env effect: implement as the state calling `equip` in `onDone` when the player chose yes — track the answer by giving `DialogState` an `opts.onChoice?: (answer: boolean) => void` callback). `EquipState(game)`: window `(88, 8, 160, 100)` listing slot lines then candidates; confirm on a slot with an item unequips; confirm on a candidate equips (`menuConfirm`, or `error` if it fails).
  - `ExploreState`: on `pressed('cancel')` while `heroIdle` and no dialog, push `MenuState` (`menuConfirm`).

- [x] **Step 1: Write failing tests** in `test/menuLines.test.ts`: `statusLines(createPlayer('Wren'))[0] === 'NAME Wren'`, `[2] === 'HP   15/15'`, `[9] === 'DEF  2'`; after equipping the shield `[9] === 'DEF  6'`; `itemLines` for the starting player → `['Herb x1']`; empty inventory → `['Nothing']`; `equipLines` slots show `none` and candidates list the shield when it is in the inventory and not once it is equipped.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/menuLines.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** the pure line builders, the four states, the `onChoice` option on `DialogState`, and the Explore hook.

- [x] **Step 4: Run tests, typecheck, build**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 5: List owner checks** (do not perform): press X in town to open the menu with a sound; Status shows the hero's numbers; Items lists the Herb and, after the opening scene, Aldric's Shield; Equip shows three slots; equipping the shield raises DEF from 2 to 6 in Status; trying to use the Herb says you cannot use it now; cancel backs out with a sound at each level; the menu cannot open while the hero is between tiles.

- [x] **Step 6: Commit**
```bash
git add src/game/menu src/game/stats.ts src/game/inventory.ts src/game/explore.ts src/game/dialog/dialogState.ts test/menuLines.test.ts
git commit -m "feat: menu with status, items, equip"
```

---

### Task 12: Title screen, name entry, title theme, new-game flow

**Files:**
- Create: `src/data/songs/title.ts`, `src/game/title.ts`, `src/game/nameEntry.ts`, `test/nameEntry.test.ts`
- Modify: `src/data/songs/index.ts`, `src/main.ts`, `test/songs.test.ts`

**Interfaces:**
- Consumes: `Song`, `validateSong`, `Font.drawText(scale)`, `MenuList`, `TransitionState`, `ExploreState`, `createPlayer`, `Game`.
- Produces:
  - `SongId` gains `'title'`; `TITLE_SONG` in `SONGS.title`. Character (spec §12.3): slow, stately, the "draws you in" piece; minor key resolving upward. Pin: tempo 84, 4/4 (16 rows per bar), 16 bars, D minor moving to its relative major F in the last four bars, loop from 0; `p1` long sustained melody (half and whole notes, one ornament per phrase) duty 0.5 vol 11; `p2` a slow counter-line in sixths duty 0.25 vol 7; `tri` a drone on D2 for 12 bars then F2/C3; no noise.
  - `NAME_MAX = 8`; `NAME_GRID: string[]` = `['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', 'abcdefghijklm', 'nopqrstuvwxyz', "0123456789 '-", 'BACK END']` (the last row has two special cells: `BACK` and `END`); `class NameEntryModel { constructor(defaultName: string); name: string; cx: number; cy: number; move(dx, dy): void (wrapping); confirm(): 'char' | 'back' | 'end' | 'full'; cancel(): void (deletes last char); get done(): boolean; get finalName(): string }` — `confirm` on a letter appends if `name.length < NAME_MAX` else returns `'full'`; `BACK` deletes; `END` sets `done` (an empty name becomes `defaultName`). Story-free: the default comes from `game.story.defaultHeroName`; the test passes `'Wren'` explicitly.
  - `TitleState(game)`: on `enter` plays `game.songs['title']!` (the id `'title'` is a generic song role, allowed); renders `game.story.title` at scale 2 centered at y = 64, `New Game` with a `▶` cursor at `(104, 150)`; confirm (`menuConfirm`) → push `NameEntryState`.
  - `NameEntryState(game)`: window `(16, 32, 224, 176)`; shows `NAME: ` plus the name padded with `_` to 8 at y = 48; the grid rows at y = 72 + 12 per row with 16 px per cell; cursor `▶`; moves use `repeat`; confirm/cancel per the model with `menuMove`/`menuConfirm`/`error` (on `'full'`); on done: `game.player = createPlayer(finalName)`, then push a `TransitionState` whose `onMid` calls `stack.reset(new ExploreState(game, game.story.newGame.map, game.story.newGame.entry))` (the Explore plays its map's song; Title and NameEntry are cleared; the transition re-pushes itself for the fade-in; Explore's first `update` then runs the opening auto trigger).
  - `main.ts`: `BootState.onStart` → `stack.reset(new TitleState(game))`; no song at boot.

- [x] **Step 1: Write failing tests**
  - `test/nameEntry.test.ts`: cursor starts at (0,0) and `confirm()` appends `A`; `move(-1, 0)` from column 0 wraps to the row's last column; moving down from the last row wraps to row 0; on the `BACK END` row, the cells resolve to the two actions; 8 letters then `confirm()` returns `'full'` and the name stays 8 chars; `cancel()` deletes; `END` with empty name → `finalName === 'Wren'`, `done`.
  - `test/songs.test.ts`: `SONGS.title` validates, has 256 rows per track (16 bars × 16), tempo 84, tracks p1, p2, tri and no noise.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/nameEntry.test.ts test/songs.test.ts`
Expected: FAIL.

- [x] **Step 3: Compose the title theme, implement the model and both states, wire main.**

- [x] **Step 4: Run tests, typecheck, build**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 5: List owner checks** (do not perform): after PRESS ANY KEY the title shows with its own theme; New Game opens the name grid; type a name, END, fade to black, wake in Maren's house facing her and the opening scene runs with your name in it; the town theme plays inside; walk out the door into Hollowmere.

- [x] **Step 6: Commit**
```bash
git add src/data/songs/title.ts src/data/songs/index.ts src/game/title.ts src/game/nameEntry.ts src/main.ts test/nameEntry.test.ts test/songs.test.ts
git commit -m "feat: title screen, name entry, title theme, new-game flow"
```

---

### Task 13: Dev-only debug overlay

**Files:**
- Create: `src/game/debug.ts`
- Modify: `src/main.ts`, `src/game/explore.ts`

**Interfaces:**
- Consumes: `Game`, `MenuList`, `drawWindow`, `drawMenu`, `applyLevel`, `MAPS`, `ExploreState`.
- Produces:
  - `installDebug(game: Game): void` sets `game.debugOpen = () => game.stack.push(new DebugState(game))`.
  - `DebugState(game)`: window `(8, 8, 176, 120)` with items `Level +1`, `Level -1`, `Gold +100`, `Gold +1000`, `Encounters: ON` / `Encounters: OFF` (toggles `game.debug.noEncounters`), `Full heal`, then one `Warp: <id>` per key of `game.maps` (story-free: built from the registry, no literals), `Close`. Level changes use `applyLevel` clamped 1–10. Warp uses `stack.reset(new ExploreState(game, id, defaultEntry(map)))` where `defaultEntry(map) = 'start' in map.entry ? 'start' : Object.keys(map.entry)[0]` (clearing the debug state and the old Explore). Cancel closes.
  - `ExploreState`: on `pressed('debug')` call `game.debugOpen?.()`; render the text `ENC OFF` at `(192, 8)` when `game.debug.noEncounters`.
  - `main.ts`: `if (import.meta.env.DEV) { void import('./game/debug').then((m) => m.installDebug(game)); }`.

- [x] **Step 1: Implement** the three changes.

- [x] **Step 2: Verify the production build excludes it**
Run: `npm test && npx tsc --noEmit && npm run build && grep -L "Gold +1000" dist/assets/*.js | wc -l && grep -l "Gold +1000" dist/assets/*.js | wc -l`
Expected: tests green; the first count ≥ 1 and the second count is `0` (no production chunk contains the debug strings).

- [x] **Step 3: List the Phase 2 owner play-test (spec §14)** verbatim, unperformed:
  - Start a new game, name the hero, receive the shield.
  - Talk to every villager.
  - Open the menu, equip the shield.
  - Enter and exit every building.
  - Open the debug overlay with the backquote key and set your level; see `ENC OFF` after toggling encounters.
  - Confirm `npm run build` output contains no debug code (the grep above; the owner may repeat it).
  - Plus the checks listed in Tasks 9–12.

- [x] **Step 4: Commit**
```bash
git add src/game/debug.ts src/main.ts src/game/explore.ts
git commit -m "feat: dev-only debug overlay"
```

---

### Task 14: Story-free cleanup of Tasks 1–4 and Phase 1 code

**Files:**
- Modify: `src/game/player.ts`, `src/game/inventory.ts`, `src/game/stats.ts`, `src/engine/audio/audio.ts`, `src/main.ts`, their tests, and the exclusion list in `test/interiors.test.ts`'s story-free guard

**Interfaces:**
- Produces: item ids in `src/game/` are `string`; `inventory.ts` and `stats.ts` take an injected `items: Record<string, ItemDef>` (or read it from `Game`) instead of importing `ITEMS`; `MUTE_KEY` becomes a constructor option on `AudioManager` supplied by `main.ts`; the story-free guard test has an empty exclusion list.

- [x] **Step 1:** Remove each violation listed under "Story-free engine rule" in `docs/superpowers/notes/2026-11-11-phase-2-carry-forward.md`, keeping every existing test green (update signatures in tests as needed).
- [x] **Step 2:** Empty the guard test's exclusion list; run `npm test && npx tsc --noEmit && npm run build`.
- [x] **Step 3: Commit** `refactor: story-free engine — remove story ids from src/game and src/engine`.

- [x] **Step 4: Stop.** Phase 2 is complete. Report the owner checks and wait for feedback before Phase 3.
