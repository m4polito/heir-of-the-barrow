# Phase 4: Growing Stronger — Implementation Plan

> **Commit hashes in this file predate the history rewrite of 2026-11-13 and no longer exist.** The commits are the same, with new hashes; find one by its subject line (`git log --grep="<subject>"`). See "Online" in `docs/superpowers/notes/2026-11-13-phase-6-carry-forward.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Victories now level the hero up; Heal and Ember are learned and cast; an Herb can be used in a fight; Heal and the Herb work from the field menu; the early fights are rebalanced so an unarmed level 1 hero can walk the road and a level 3 hero with Heal can enter the marsh; every named villager says their own name.

**Architecture:** Levelling is a pure function on `PlayerState` (`gainXp`), called when a battle is settled. Spells and usable items share one generic `Effect` type; the spell table is story data injected through `Game`, like items and monsters. `Battle` gains spell and item commands and a small monster-action chooser (`MonsterBrain`), and still returns ordered beats; `BattleState` only adds two sub-lists and appends level-up beats. Balance is pinned by a simulation helper that plays the real `Battle` with a scripted policy.

**Tech Stack:** TypeScript 5, Vite 6, Vitest 3 (node), Canvas 2D, Web Audio. No runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-11-11-the-dimming-vertical-slice-design.md` (§8, §9.2, §9.7, §9.8, §9.10, §10.1–10.5, §12.3–12.4, §14 Phase 4, §15). Carry-forward: `docs/superpowers/notes/2026-11-12-phase-3-carry-forward.md` (the balance requirements at its top are mandatory here).

## Execution status (updated 2026-11-12, phase stop)

- **All 10 tasks complete and reviewed; the whole-branch review and its one fix wave are done (head `4ea93f9` plus this docs commit). Stopped for the owner's play-test; not merged.** Measured balance numbers, rulings, questions for the owner, deferred minors and the play-test list are in `docs/superpowers/notes/2026-11-12-phase-4-carry-forward.md`.
- Where the delivered code differs from the task text below: the heal sound is E6 C6 G5 C6 at duty 0.25, not the rising figure in Task 5; the "Herb in a lost fight" tests use a monster with agility 0 (Task 6); the battle confirm blip plays unless the first resulting message has its own sound (Task 6); the battle windows are `(8, 120, 72, 52)` and `(84, 120, 164, 52)` with menus at y 128 (Task 6); Spells and Items share `src/game/menu/fieldResult.ts` (Task 7); the "Tuned" note sits under the design doc's §10.5 table only (Task 8); Tobin's narration is "He keeps his eyes on his cup." (Task 9); Task 10's code and docs are two commits.

## Execution

- Branch `phase-4` from `master` (`aafdd4a`). Subagent-driven, as in Phase 3: Sonnet 5.5 implements and reviews ordinary tasks; Opus reviews audio (Task 5), integration (Tasks 6, 7) and the whole branch; the orchestrator (Fable) reviews the balance numbers (Task 8), the level-up jingle's written harmony (Task 5) and the dialog copy (Task 9).
- Before Task 1, the orchestrator commits this plan on the branch and points `CLAUDE.md`'s "Current plan" line at it.
- Gated: stop after Task 10 for the owner's play-test. Do not start Phase 5.
- Folded in from the Phase 3 play-test: the balance pass (Task 8). Hesta's free rest stays until Phase 5's inn. The parked sequencer test was already fixed before the Phase 3 merge.

## Decisions made in this plan (owner approved all sixteen on 2026-11-12, with one change to Task 9's copy)

Balance (measured with a scratch simulation of the current formulas, 20000 fights per case; Task 8 re-measures with the real code):

1. **Road Mireling: HP 6 → 4, DEF 3 → 1.** ATK, AGI, XP, gold and dodge unchanged. Unarmed level 1 hero with the shield: about 3.1 rounds and 2.3 HP lost per fight (today 6.3 rounds and 5.3 HP). With the Wooden Club: 2.2 rounds, 1.4 HP.
2. **Bog Mireling: DEF 8 → 6.** Nothing else changes. Level 3 hero, shield only, full HP and MP: wins about 83% using Heal, about 29% without it (today 29% and 6%). A level 1 hero still never wins there, and level 2 almost never; the marsh stays a place you grow into. The hero table (§10.1) is not touched.
3. **"A level 3 hero with Heal survives marsh fights more often than not" is tested as:** level 3, Aldric's Shield only (no shop exists yet), starting each fight at full HP and MP, fighting to the end, casting Heal at 8 HP or less; the win rate must be above 60%.
4. **The Warden win-rate test lands now, and the Warden's starting numbers move to meet the unchanged targets.** Phase 4 builds everything the test needs (spells, items, monster actions). With the spec's starting numbers the simulation gives 0% / 16% / 54% / 80% at levels 4 / 5 / 6 / 7; the targets are near 0 / under 50 / over 70 / over 90. **Warden ATK 22 → 20 and Rot Breath 8–14 → 7–12** gives 0% / 30% / 75% / 95%. HP, DEF, AGI, Mend, weights, the targets and the intended gear are unchanged. The Warden lives in a test fixture until Phase 6. If you veto this, the Warden test and numbers wait for Phase 6.
5. The design doc is updated to match decisions 1, 2 and 4 (§10.5 and §9.8), since it is the source of truth.

Levelling and spells:

6. **On a level-up, current HP and MP rise by the amount the maximum rose.** No full restore.
7. **Several levels from one reward are announced once**, with the final level and the summed gains.
8. **Known spells follow from the level** (the §10.1 table). Nothing extra is stored on the player.
9. **A heal at full HP is refused everywhere** ("You are not hurt."): nothing is spent and no turn is lost. The same for a spell you cannot afford ("Not enough MP.").
10. **Heal and Ember never miss**, and Ember ignores dodge as well as defence.
11. **Homeward works in the field now** (warps to Hollowmere's gate), though only the debug overlay can reach level 8 in the slice. Otherwise a debug-levelled hero would hold a spell that does nothing.
12. **The monster action engine is built and tested now, but no Phase 4 monster uses it.** Mirelings only attack. The Warden fixture in the balance test exercises it.

Screens:

13. **The battle command window grows to four rows** (Fight / Spell / Item / Run) and moves up to make room; Spell and Item open a second window beside it. Cancel closes that window.
14. **The field menu becomes Status / Items / Spells / Equip**, and Status gains a `NEXT` line (XP to the next level).
15. **The debug overlay gains a `Give: <item>` row for every item.** The hero has one Herb and no shop until Phase 5, so the play-test needs a way to get more.

Dialog:

16. **The name lines are the copy in Task 9.** `maren_fallen` and the two unnamed villagers are unchanged. No name tags.

## Global Constraints

- No runtime dependencies. All art, text and music are TypeScript data; everything original. No battle or level-up text from Dragon Warrior: never "draws near", "thou", "thee", "Excellent move", "terrific blow", "Thy", "hath". Use the copy pinned in Tasks 2, 4 and 6.
- 256×240 logical, 16 px tiles, 8×8 font. Message window 4 lines × 28 characters at `(8, 176, 240, 56)`.
- Keys unchanged. Interactions stay one-button.
- **Story-free engine:** nothing under `src/engine/`, `src/game/`, `src/ui/` names a story character, place, monster, item, spell or flag, or imports `data/items`, `data/maps`, `data/dialog`, `data/songs`, `data/story`, `data/monsters`, `data/spells`. Story tables reach game code through `Game`. `LEVELS`, `TILES`, sprite registries and `SFX` may be imported. Song role ids `'title'`, `'battle'`, `'victory'`, `'fallen'`, `'levelup'` and effect kinds `'heal'`, `'damage'`, `'warp'` are generic and allowed.
- **Stack discipline** (unchanged from Phase 3): `TransitionState` removes itself by identity; a change of map from a menu uses `stack.reset`; state constructors never touch the DOM.
- **Audio must not click.** Master level stays 0.25. A beat that starts a song never starts while a one-shot song is still playing.
- Owner checks (look and listen in the browser) are the owner's. Implementers list them verbatim and never report them as passed.
- A task is done when `npm test`, `npx tsc --noEmit` and `npm run build` are green. One commit per task. Every commit message ends with a `Co-Authored-By:` trailer naming **the model that wrote the commit**: a Sonnet 5.5 implementer writes `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; a commit the orchestrator writes carries `Claude Fable 5.2`. Run npm from `C:/Projects/VSCode/WarriorsQuest` (uppercase drive).
- Tests that build a `Game` follow `test/state.test.ts`. Exact-value tests use `seqRng` from `test/helpers/seqRng.ts`; a `seqRng` that runs out throws, which is how "no extra draw" is proved.

## Review Focus

1. **Casting or using what you cannot**: too little MP, a heal at full HP, an item you no longer hold, a battle-only spell in the field. Nothing is spent, no turn is lost, MP and counts never go below 0. Pinned in Tasks 2, 4, 6 and 7.
2. **Level-up edges**: several levels from one reward; XP at the 65535 cap; level 10; a debug-raised level whose XP is below its threshold (the level never drops). Pinned in Task 1.
3. **The level-up jingle arriving during the victory fanfare**: the fanfare plays to its end, then the jingle; each starts exactly once; confirm cannot skip either. Pinned in Task 6.
4. **An Herb or MP spent in a fight that is then lost or fled**: it stays spent. Death restores HP and MP, not items. Pinned in Tasks 1 and 6.
5. **Bad monster action tables**: a zero weight, `min > max`, or every action conditional fails a test instead of stalling a fight; a Mend never raises a monster above its maximum. Pinned in Tasks 3 and 4.

---

## File Structure

```
src/game/player.ts               + spellsKnown, gainXp, LevelUp, xpToNext; settleBattle takes mp and used items
src/game/effects.ts              Effect, SpellDef, SpellTable, rollEffect, usableIn
src/game/fieldUse.ts             castInField, useItemInField (pure)
src/game/items.ts                + ItemDef.use
src/game/game.ts                 + Game.spells, StoryConfig.home
src/game/battle/ai.ts            MonsterAction, MonsterBrain, validateActions
src/game/battle/monster.ts       + MonsterDef.actions
src/game/battle/kit.ts           BattleKit, battleKit
src/game/battle/battle.ts        + spell and item commands, monster actions, refusal, note
src/game/battle/beats.ts         + Beat.heroMp, BeatPlayer.next
src/game/battle/levelBeats.ts    levelUpBeats
src/game/battle/battleState.ts   + four commands, sub-lists, level-up beats, song gate
src/game/menu/menuState.ts       + Spells row
src/game/menu/spellsState.ts     SpellsState, spellLines
src/game/menu/itemsState.ts      + use a consumable
src/game/menu/statusState.ts     taller window
src/game/stats.ts                + NEXT line
src/game/debug.ts                + Give rows
src/data/spells.ts               SPELLS
src/data/items.ts                + herb use
src/data/monsters.ts             balance numbers
src/data/sfx.ts                  + spell, heal
src/data/songs/levelup.ts        LEVELUP_SONG
src/data/story.ts                + home
src/data/dialog/hollowmere.ts    name lines
test/helpers/simulate.ts         heroAt, simulate, policies
test/helpers/warden.ts           WARDEN fixture (spec §9.8)
test/balance.test.ts             early curve and Warden bands
```

---

### Task 1: Levelling (pure)

**Files:**
- Modify: `src/game/player.ts`, `src/game/battle/battleState.ts` (call site only), `test/player.test.ts`

**Interfaces:**
- Consumes: `LEVELS`, `levelForXp`, `removeItem`, `XP_MAX`, `GOLD_MAX`.
- Produces, all in `player.ts`:
  - `spellsKnown(level: number): string[]` — the `learns` ids of every `LEVELS` row at or below `level`, in table order.
  - `interface LevelUp { from: number; to: number; str: number; agi: number; maxHp: number; maxMp: number; learned: string[] }` — the four numbers are gains.
  - `gainXp(p: PlayerState, xp: number): { player: PlayerState; levelUp: LevelUp | null }` — XP is capped at `XP_MAX`. The new level is `max(p.level, levelForXp(newXp))`. If it rose: `str`, `agi`, `maxHp`, `maxMp` come from the new row; `hp` and `mp` each rise by the gain in their maximum (decision 6); `learned` lists the `learns` of every row above `from` up to `to`. Otherwise only `xp` changes and `levelUp` is `null`. The input is not mutated.
  - `xpToNext(p: PlayerState): number | null` — `max(0, nextRow.xp − p.xp)`, or `null` at the table's last level.
  - `settleBattle(p, end: { hp: number; mp: number; itemsUsed: readonly string[] }, reward: { xp: number; gold: number } | null): PlayerState` — in this order: `hp` clamped to `0..maxHp` and `mp` to `0..maxMp`; one `removeItem` per entry of `itemsUsed`, throwing `Error('Used item not held: <id>')` if one fails; then, if there is a reward, gold added with its cap and `gainXp(…).player`.
  - `BattleState` passes `{ hp: battle.heroHp, mp: game.player.mp, itemsUsed: [] }` for now (Task 6 replaces it).

- [x] **Step 1: Write failing tests** in `test/player.test.ts` (and rewrite the existing `settleBattle` cases to the new second argument):
  - `spellsKnown(1)` → `[]`; `(3)` → `['heal']`; `(5)` → `['heal', 'ember']`; `(10)` → `['heal', 'ember', 'homeward']`.
  - `LEVELS` never decreases in `xp`, `str`, `agi`, `maxHp` or `maxMp` from one row to the next.
  - Level 1 hero with `xp 5`, `hp 9`: `gainXp(p, 2)` → level 2, `str 5`, `maxHp 22`, `hp 16`, `xp 7`; `levelUp` equals `{ from: 1, to: 2, str: 1, agi: 0, maxHp: 7, maxMp: 0, learned: [] }`; `p` itself unchanged.
  - `gainXp(level 1 at xp 0, 1)` → `levelUp` null; only `xp` differs.
  - Several levels (Review Focus 2): `gainXp(level 1 at xp 0, hp 15, 47)` → level 4; `levelUp` equals `{ from: 1, to: 4, str: 3, agi: 4, maxHp: 16, maxMp: 16, learned: ['heal'] }`; `hp 31`, `mp 16`.
  - Level 10 at `xp 2000`: `gainXp(p, 500)` → `levelUp` null, level 10, `xp 2500`. `xp 65530 + 18` → `65535`.
  - A player built directly at level 5 with `xp 0` (a level above what its XP earns): `gainXp(p, 1)` → level stays 5, `levelUp` null.
  - `xpToNext` for a new player → `7`; at `xp 5` → `2`; at level 10 → `null`.
  - `settleBattle(p, { hp: 9, mp: 1, itemsUsed: ['herb'] }, null)` on a player holding one Herb with `maxMp 5` → hp 9, mp 1, inventory empty. `itemsUsed: ['herb', 'herb']` with one held → throws `Used item not held: herb` (Review Focus 4).
  - A level 1 player at full HP: `settleBattle(p, { hp: 9, mp: 0, itemsUsed: [] }, { xp: 7, gold: 4 })` → level 2, hp 16, gold +4.
  - The existing clamp and cap cases still hold with the new argument shape.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/player.test.ts`
Expected: FAIL (exports missing).

- [x] **Step 3: Implement** per Interfaces; update the one call in `battleState.ts`.

- [x] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit`
Expected: PASS; clean.

- [x] **Step 5: Commit**
```bash
git add src/game/player.ts src/game/battle/battleState.ts test/player.test.ts
git commit -m "feat: levelling from experience, known spells, battle settlement with mp and items"
```

---

### Task 2: Effects, the spell table, and field use (pure)

**Files:**
- Create: `src/game/effects.ts`, `src/game/fieldUse.ts`, `src/data/spells.ts`, `test/effects.test.ts`, `test/fieldUse.test.ts`
- Modify: `src/game/items.ts`, `src/data/items.ts`, `src/game/game.ts`, `src/main.ts`, `test/interiors.test.ts` (story-free guard), every test that calls `createGame(` (add `spells`)

**Interfaces:**
- Consumes: `Rng`, `PlayerState`, `spellsKnown`, `removeItem`, `ItemTable`, `SfxId` (the ids `'spell'` and `'heal'` land in Task 5; add them to the `SfxId` union and give each a one-step placeholder entry in `SFX` here so the types hold).
- Produces:
  - `effects.ts`:
    - `type Effect = { kind: 'heal'; min: number; max: number } | { kind: 'damage'; min: number; max: number } | { kind: 'warp' }`
    - `type UseWhere = 'battle' | 'field' | 'both'`; `usableIn(where: UseWhere, ctx: 'battle' | 'field'): boolean`
    - `interface SpellDef { id: string; name: string; mp: number; where: UseWhere; effect: Effect }`; `type SpellTable = Record<string, SpellDef>`
    - `rollEffect(rng: Rng, e: Effect): number` — `rng.int(min, max)` for heal and damage; `0` with no draw for warp.
  - `ItemDef` gains `use?: { where: UseWhere; effect: Effect }`. In `ITEMS`, `herb` gets `use: { where: 'both', effect: { kind: 'heal', min: 20, max: 30 } }`. The Torch gets none until Phase 6.
  - `SPELLS` in `src/data/spells.ts`, `satisfies Record<SpellId, SpellDef>` (spec §10.2):

    | id | name | mp | where | effect |
    |---|---|---|---|---|
    | `heal` | Heal | 4 | both | heal 10–17 |
    | `ember` | Ember | 2 | battle | damage 5–12 |
    | `homeward` | Homeward | 8 | field | warp |

  - `Game` gains `readonly spells: SpellTable`; `main.ts` passes `SPELLS`.
  - `fieldUse.ts`:
    - `type FieldResult = { ok: true; player: PlayerState; text: string; sfx: SfxId; warp?: true } | { ok: false; text: string }`
    - `castInField(rng, spells: SpellTable, p: PlayerState, spellId: string): FieldResult`
    - `useItemInField(rng, items: ItemTable, p: PlayerState, itemId: string): FieldResult`
    - Both throw on a programming error: a spell id missing from the table or not in `spellsKnown(p.level)`; an item the player does not hold.
    - Checks in this order, each returning `ok: false` with no draw and no change: not usable in the field, or (for an item) no `use`, or a damage effect → `You cannot use that now.`; (spells) `p.mp < mp` → `Not enough MP.`; heal with `p.hp === p.maxHp` → `You are not hurt.`
    - Success: heal restores `n = min(roll, maxHp − hp)`, text `You recover {n} HP.`, sfx `'heal'`; warp gives text `You are carried home.`, sfx `'spell'`, `warp: true`. A spell's MP is deducted; an item is removed (one).
  - Story-free guard in `test/interiors.test.ts`: the forbidden-import group becomes `(items|maps|dialog|songs|story|monsters|spells)`; the banned strings gain `"'ember'"`, `"'homeward'"` and `"'herb'"`.

- [x] **Step 1: Write failing tests**
  - `test/effects.test.ts`: `rollEffect(seqRng([0]), heal 10–17)` → 10, with `[0.99]` → 17; warp with `seqRng([])` → 0. `usableIn('both', 'field')`, `('battle', 'battle')` true; `('battle', 'field')`, `('field', 'battle')` false. Every row of the table above matches `SPELLS`; every `learns` in `LEVELS` is a key of `SPELLS`; `SPELLS[id].id === id`. `ITEMS.herb.use` equals the value above; `ITEMS.torch.use` is undefined.
  - `test/fieldUse.test.ts`, with a level 3 player (`gainXp(createPlayer('Wren', [{ item: 'herb', count: 2 }]), 23).player`) and the real `SPELLS` and `ITEMS`:
    - hp 5: `castInField(seqRng([0]), …, 'heal')` → ok, hp 15, mp 1, text `You recover 10 HP.`, sfx `'heal'`.
    - hp 20 of 24, roll `[0.99]` → hp 24, text `You recover 4 HP.`
    - Review Focus 1, each with `seqRng([])` and the player returned untouched: full HP → `You are not hurt.`; mp 3 → `Not enough MP.`; a level 5 player casting `ember` → `You cannot use that now.`
    - A level 8 player with mp 29 casting `homeward` → ok, mp 21, `warp: true`, text `You are carried home.`
    - `castInField(…, 'ember')` at level 3 throws; `castInField(…, 'nope')` throws.
    - `useItemInField(seqRng([0]), …, 'herb')` at hp 1 → hp 21, one Herb left, `You recover 20 HP.`; at full HP → `You are not hurt.` and two Herbs left; `'torch'` held → `You cannot use that now.`; an item not held throws.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/effects.test.ts test/fieldUse.test.ts test/interiors.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** per Interfaces; add `spells: SPELLS` wherever a test builds a `Game`.

- [x] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 5: Commit**
```bash
git add src/game/effects.ts src/game/fieldUse.ts src/game/items.ts src/game/game.ts src/data/spells.ts src/data/items.ts src/data/sfx.ts src/main.ts test
git commit -m "feat: effects, the spell table, field use of spells and items"
```

---

### Task 3: Monster action engine (pure)

**Files:**
- Create: `src/game/battle/ai.ts`, `test/ai.test.ts`
- Modify: `src/game/battle/monster.ts`, `test/monsters.test.ts`

**Interfaces:**
- Consumes: `Rng`.
- Produces:
  - `type MonsterAction = { weight: number; if?: 'hpBelowHalf'; cooldown?: number } & ({ do: 'attack' } | { do: 'blast'; name: string; min: number; max: number } | { do: 'mend'; name: string; min: number; max: number })`
  - `ATTACK: MonsterAction = { do: 'attack', weight: 1 }`
  - `class MonsterBrain { constructor(actions?: readonly MonsterAction[]); choose(rng: Rng, state: { hp: number; maxHp: number }): MonsterAction }`
    - An action is eligible when its condition holds (`hpBelowHalf` means `hp * 2 < maxHp`) and it is not cooling down.
    - No actions, or none eligible → `ATTACK`, no draw. Exactly one eligible → that one, no draw. Otherwise `r = rng.next() * totalWeight` and the first eligible action whose running weight exceeds `r`.
    - After choosing: every cooling counter drops by 1; then, if the chosen action has a `cooldown`, its counter is set to that value. So `cooldown: 2` keeps it out of the monster's next two turns.
  - `validateActions(actions: readonly MonsterAction[]): void` — throws if a weight is not a finite number above 0, if `min > max` or `min < 0`, if a cooldown is negative, or if no action is free of both `if` and `cooldown`.
  - `MonsterDef` gains `actions?: MonsterAction[]`.

- [x] **Step 1: Write failing tests** in `test/ai.test.ts`, with `A = [{ do: 'attack', weight: 6 }, { do: 'blast', name: 'Rot Breath', min: 8, max: 14, weight: 3 }, { do: 'mend', name: 'Mend', min: 15, max: 25, weight: 2, if: 'hpBelowHalf', cooldown: 2 }]`:
  - `new MonsterBrain().choose(seqRng([]), { hp: 6, maxHp: 6 })` is `ATTACK`; a brain with one action also draws nothing.
  - At 70 of 70: `seqRng([0])` → attack; `seqRng([0.7])` → blast (0.7 × 9 = 6.3). At 35 of 70 the mend is not eligible (`seqRng([0.99])` → blast).
  - At 34 of 70 one brain, four calls: `[0.9]` → mend; `[0.99]` → blast; `[0.99]` → blast; `[0.99]` → mend.
  - `validateActions(A)` passes. It throws for: a weight of 0; a weight of `NaN`; `min: 9, max: 8`; `cooldown: -1`; a list holding only the mend above (Review Focus 5).
  - `test/monsters.test.ts`: every monster in `MONSTERS` either has no `actions` or passes `validateActions`.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/ai.test.ts test/monsters.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** per Interfaces.

- [x] **Step 4: Run tests to verify they pass**
Run: `npx vitest run test/ai.test.ts test/monsters.test.ts && npx tsc --noEmit`
Expected: PASS; clean.

- [x] **Step 5: Commit**
```bash
git add src/game/battle/ai.ts src/game/battle/monster.ts test/ai.test.ts test/monsters.test.ts
git commit -m "feat: weighted monster actions with conditions and cooldowns"
```

---

### Task 4: Spells, items and monster actions in the battle resolver (pure)

**Files:**
- Create: `src/game/battle/kit.ts`, `src/game/battle/levelBeats.ts`, `test/battleKit.test.ts`, `test/levelBeats.test.ts`
- Modify: `src/game/battle/battle.ts`, `src/game/battle/beats.ts`, `src/game/battle/battleState.ts` (hero stats call site only), `test/battle.test.ts`, `test/beats.test.ts`

**Interfaces:**
- Consumes: `SpellDef`, `SpellTable`, `Effect`, `usableIn`, `rollEffect`, `MonsterBrain`, `spellsKnown`, `LevelUp`, `ItemTable`.
- Produces:
  - `Beat` gains `heroMp: number` (the MP to display from this beat on). Existing tests that compare whole beats add it.
  - `BeatPlayer` gains `get next(): Beat | null` — the beat after the current one, or `null`.
  - `kit.ts`: `interface BattleKit { spells: SpellDef[]; items: { id: string; name: string; count: number; effect: Effect }[] }`; `battleKit(p: PlayerState, spells: SpellTable, items: ItemTable): BattleKit` — the known spells usable in battle, in learning order (throws `Unknown spell: <id>` if the table lacks one); the held items whose `use` is usable in battle, one entry per item id in order of first appearance, `count` summed across slots.
  - `battle.ts`:
    - `type BattleCommand = 'fight' | 'run' | { spell: string } | { item: string }`
    - `HeroStats` gains `maxHp: number; mp: number`.
    - `new Battle(rng, hero, monster, kit: BattleKit = { spells: [], items: [] })`; `readonly kit`; `get heroMp()`; `get itemsUsed(): readonly string[]`; `itemCount(id: string): number` (what is left).
    - `refusal(cmd: BattleCommand): string | null` — `Not enough MP.` for a spell costing more than `heroMp`; `You are not hurt.` for a heal effect (spell or item) at full HP; else `null`.
    - `note(text: string): Beat[]` — one beat with that text, sfx `'error'` and the current HP and MP. It changes nothing.
    - `act` throws `Error('battle is over')` as before, and `Error('cannot act: <reason>')` for a spell not in the kit, an item with none left, or any command `refusal` rejects.
    - **Round order.** `fight`, a spell and an item all draw `monsterFirst` first and then resolve both sides in that order; `run` is unchanged. A spell deducts its MP on the cast beat. An item is consumed on its use beat and its id appended to `itemsUsed`.
    - **Monster turn.** `brain.choose(rng, { hp: monsterHp, maxHp: monster.hp })`, then by kind. A monster without `actions` therefore draws exactly as today.
    - **Exact copy** (`{m}` monster name, `{s}` spell name, `{i}` item name, `{a}` action name, `{n}` amount):

      | Event | Beats, in order |
      |---|---|
      | hero casts a heal | `You cast {s}.` (sfx `spell`) then `You recover {n} HP.` (sfx `heal`), `n = min(roll, maxHp − hp)` |
      | hero casts damage | `You cast {s}.` (sfx `spell`) then `The {m} takes {n} damage.` (sfx `monsterHit`, fx `flash`); no miss, dodge or crit draw; then the defeat beats if it fell |
      | hero uses a heal item | `You use the {i}.` then `You recover {n} HP.` (sfx `heal`) |
      | monster blast | `The {m} uses {a}!` then `You take {n} damage.` (sfx `heroHit`, fx `shake`), `n = rng.int(min, max)`, ignoring defence; then `You have fallen.` if it killed |
      | monster mend | `The {m} uses {a}!` then `The {m} recovers {n} HP.` (sfx `heal`), `n = min(roll, monster.hp − monsterHp)` |

  - `levelBeats.ts`: `levelUpBeats(up: LevelUp, spellName: (id: string) => string, shown: { heroHp: number; heroMp: number; monsterHp: number }): Beat[]` — every beat carries `heroHp: shown.heroHp + up.maxHp`, `heroMp: shown.heroMp + up.maxMp`, `monsterHp: shown.monsterHp`. In order:
    1. `You reach level {to}.` with `song: 'levelup'`
    2. `Strength +{str}. Agility +{agi}.` — a zero part is left out; the beat is left out if both are zero
    3. `Max HP +{maxHp}. Max MP +{maxMp}.` — same rule
    4. one `You learned {name}!` per entry of `learned`
  - `BattleState` passes `maxHp: p.maxHp, mp: p.mp` in the hero stats (the kit arrives in Task 6).

- [x] **Step 1: Write failing tests**
  - `test/battle.test.ts`, reusing its fixture `M` (hp 6, atk 5, def 3, agi 3, no actions) and these: `HEAL = { id: 'heal', name: 'Heal', mp: 4, where: 'both', effect: { kind: 'heal', min: 10, max: 17 } }`, `EMBER = { id: 'ember', name: 'Ember', mp: 2, where: 'battle', effect: { kind: 'damage', min: 5, max: 12 } }`, `HERB = { id: 'herb', name: 'Herb', count: 1, effect: { kind: 'heal', min: 20, max: 30 } }`. Hero base `{ atk: 4, def: 6, agi: 4 }` plus what each case states.
    - Every existing case still passes with `heroMp` added where whole beats are compared and `maxHp`, `mp` added to the hero.
    - **Heal:** hero hp 5, maxHp 24, mp 5; `seqRng([0, 0.99, 0, 0.5, 0])`; `act({ spell: 'heal' })` texts are `['You cast Heal.', 'You recover 10 HP.', 'The Mireling attacks!', 'You take 1 damage.']`; beat 0 has `sfx: 'spell'`, `heroHp: 5`, `heroMp: 1`; beat 1 has `sfx: 'heal'`, `heroHp: 15`; afterwards `heroHp 14`, `heroMp 1`.
    - **Heal clamps:** hp 20 of 24, the roll `0.99` → `You recover 4 HP.`, hp 24 before the monster strikes.
    - **Ember:** mp 20, `seqRng([0, 0.99, 0.99, 0.99])` (exactly four draws) → `['You cast Ember.', 'The Mireling takes 12 damage.', 'The Mireling is defeated.', 'You gain 2 experience and 4 gold.']`; `heroMp 18`; `outcome 'won'`.
    - **Herb:** hp 3 of 15, `seqRng([0, 0.99, 0, 0.5, 0])` → `['You use the Herb.', 'You recover 12 HP.', 'The Mireling attacks!', 'You take 1 damage.']`; `itemsUsed` equals `['herb']`; `itemCount('herb') === 0`; a second `act({ item: 'herb' })` throws `cannot act`.
    - **Refusals (Review Focus 1):** mp 3 → `refusal({ spell: 'heal' })` is `Not enough MP.` and `act` throws; hp at max → `You are not hurt.` for the spell and for the Herb; `refusal('fight')` and `refusal('run')` are null; `act({ spell: 'nope' })` throws; after any refused `act`, `heroMp`, `heroHp` and `itemCount` are unchanged. `note('x')` → one beat `{ text: 'x', sfx: 'error', … }` and no state change.
    - **Blast:** `M` with `actions: [{ do: 'blast', name: 'Rot Breath', min: 8, max: 14, weight: 1 }]`, `seqRng([0.99, 0, 0, 0.5, 0.5, 0.5, 0])`, `act('fight')` texts start `['The Mireling uses Rot Breath!', 'You take 8 damage.']`; beat 1 has `sfx: 'heroHit'`, `fx: 'shake'`. With hero hp 5 the texts end `'You have fallen.'` and `outcome === 'lost'`.
    - **Mend never overheals (Review Focus 5):** `M` with `actions: [{ do: 'mend', name: 'Mend', min: 15, max: 25, weight: 1 }]`, `seqRng([0, 0.99, 0.5, 0.5, 0.5, 0, 0])` → texts `['You attack!', 'The Mireling takes 1 damage.', 'The Mireling uses Mend!', 'The Mireling recovers 1 HP.']`; `monsterHp === 6`.
    - With `createRng(3)`, 500 battles against a monster using the three-action list from Task 3, choosing `fight` every round, each end within 300 rounds with `monsterHp` never above its maximum.
  - `test/beats.test.ts`: with two beats loaded, `next` is the second while the first is current and `null` on the last and after `done`.
  - `test/battleKit.test.ts` (real `SPELLS`, `ITEMS`): level 1 with one Herb → no spells, items `[{ id: 'herb', name: 'Herb', count: 1, … }]`; level 5 → spells `heal`, `ember` in that order; level 8 → still two (Homeward is field-only); Herbs split across two slots (6 and 2) → one entry with `count 8`; a held Torch is not listed; a table missing `heal` at level 3 throws `Unknown spell: heal`.
  - `test/levelBeats.test.ts`: for `{ from: 1, to: 2, str: 1, agi: 0, maxHp: 7, maxMp: 0, learned: [] }` and `shown { heroHp: 9, heroMp: 0, monsterHp: 0 }` → texts `['You reach level 2.', 'Strength +1.', 'Max HP +7.']`, the first with `song: 'levelup'`, all with `heroHp: 16`. For `{ from: 2, to: 3, str: 2, agi: 2, maxHp: 2, maxMp: 5, learned: ['heal'] }` → `['You reach level 3.', 'Strength +2. Agility +2.', 'Max HP +2. Max MP +5.', 'You learned Heal!']`. Every text wraps to at most 2 lines at 28 columns.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/battle.test.ts test/beats.test.ts test/battleKit.test.ts test/levelBeats.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** per Interfaces.

- [x] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit`
Expected: PASS; clean.

- [x] **Step 5: Commit**
```bash
git add src/game/battle test/battle.test.ts test/beats.test.ts test/battleKit.test.ts test/levelBeats.test.ts
git commit -m "feat: spells, items and monster actions in the battle resolver; level-up beats"
```

---

### Task 5: Spell and heal sounds, level-up jingle

**Files:**
- Create: `src/data/songs/levelup.ts`
- Modify: `src/data/sfx.ts`, `src/data/songs/index.ts`, `test/sfx.test.ts`, `test/songs.test.ts`

**Interfaces:**
- Consumes: `Song`, `Track`, `validateSong`; the helper style of `src/data/songs/victory.ts`.
- Produces:
  - `SFX.spell` (replacing Task 2's placeholder), 12 frames, a quick glittering rise: `p1` duty 0.125 vol 9: `A4` 2f, `E5` 2f, `A5` 2f, `C#6` 2f, `E6` 4f.
  - `SFX.heal`, 14 frames, soft and settling: `p1` duty 0.5 vol 7: `G5` 4f, `C6` 4f, `E6` 6f.
  - `SONGS.levelup`: tempo 150, 10 rows (1.0 s), `loop: false`, D major. `p1` duty 0.5 vol 11; `p2` duty 0.25 vol 8; `tri` vol 14; no noise. A quick rising run that lands on a held D major chord. It must not reuse the victory fanfare's figure (G C E G) transposed. The file opens with a comment giving the key and the chord per row group, and the notes must sound as the comment says. Every pitched track's last non-null row is `'off'`, at or before row 9.

- [x] **Step 1: Write failing tests**
  - `test/sfx.test.ts`: `spell` totals 12 frames and `heal` 14; the existing "every id has steps and every note parses" loop covers both.
  - `test/songs.test.ts`, `describe('levelup')`: `validateSong` passes; 10 rows; tempo 150; `loop === false`; channels `p1`, `p2`, `tri` with the duties and volumes above; each track's last non-null row is `'off'`; the `p1` notes in order are not the victory `p1` notes shifted by one constant interval.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/sfx.test.ts test/songs.test.ts`
Expected: FAIL.

- [x] **Step 3: Compose the jingle**, write the two effects, register the song.

- [x] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 5: List owner checks** (do not perform): first heard in Task 6; listed there.

- [x] **Step 6: Commit**
```bash
git add src/data/sfx.ts src/data/songs test/sfx.test.ts test/songs.test.ts
git commit -m "feat: spell and heal sounds, level-up jingle"
```

---

### Task 6: Battle screen: Spell and Item commands, level-ups

**Files:**
- Modify: `src/game/battle/battleState.ts`, `test/battleState.test.ts`, `test/encounterFlow.test.ts`
- Create: `src/game/menu/spellsState.ts` (only the pure `spellLines` here; the state arrives in Task 7)

**Interfaces:**
- Consumes: `battleKit`, `Battle.refusal`, `Battle.note`, `Battle.kit`, `Battle.itemCount`, `gainXp`, `levelUpBeats`, `BeatPlayer.next`, `settleBattle` (Task 1 signature), `game.spells`.
- Produces:
  - `spellLines(spells: readonly SpellDef[]): string[]` in `spellsState.ts` — `name.padEnd(10) + String(mp).padStart(2)` per spell; `['Nothing']` when empty.
  - `battleStatLines(name, hp, mp)` unchanged; the MP shown now comes from the current beat's `heroMp`.
  - `BattleState`:
    - `get phase(): 'beats' | 'command' | 'spell' | 'item' | 'ending'`.
    - The constructor builds the kit with `battleKit(game.player, game.spells, game.items)` and passes it to `Battle`.
    - Command list `Fight`, `Spell`, `Item`, `Run`, in window `(8, 116, 72, 56)` with `drawMenu` at `(16, 124)`. The cursor keeps its place between rounds.
    - `Spell`: with no spells in the kit, load `battle.note('You know no spells.')` (no turn is used; the existing flow returns to `command`). Otherwise phase `spell`: a second window `(84, 116, 164, 56)` listing `spellLines(kit.spells)` at `(92, 124)`.
    - `Item`: the rows are the kit items with `itemCount(id) > 0`, as `` `${name} x${count}` ``. With none, `battle.note('You carry nothing to use.')`. Otherwise phase `item`, same window.
    - In `spell` and `item`: up/down move with `menuMove`; cancel plays `menuCancel` and returns to `command`; confirm asks `battle.refusal(cmd)`: a refusal loads `battle.note(refusal)` (no turn used); otherwise `menuConfirm`, `battle.act(cmd)`, back to `beats`.
    - **Level-up.** When an `act` ends the battle as `won`: `const up = gainXp(game.player, battle.reward.xp).levelUp`; if not null, append `levelUpBeats(up, (id) => game.spells[id]?.name ?? id, { heroHp: battle.heroHp, heroMp: battle.heroMp, monsterHp: 0 })` before loading. The last beat of the whole list waits for confirm.
    - **Song gate (Review Focus 3).** While `songHold > 0`, the current beat is fully revealed and `beats.next?.song` is set, do not tick the beat player. A one-shot song started by a beat sets `songHold` as today, so the last beat's confirm stays held until the jingle ends.
    - Settlement: `settleBattle(game.player, { hp: battle.heroHp, mp: battle.heroMp, itemsUsed: battle.itemsUsed }, battle.reward)`.

- [x] **Step 1: Write failing tests**
  - `test/battleState.test.ts` (same harness as the existing cases; the game has the real `SPELLS`, `ITEMS` and `SONGS`):
    - Existing cases adjusted: Run is now the fourth row.
    - `spellLines([HEAL, EMBER])` → `['Heal       4', 'Ember      2']`; `spellLines([])` → `['Nothing']`.
    - **No spells:** level 1 hero; in `command`, down then confirm → `playSfx('error')` was called, the shown text is `You know no spells.`, and after it finishes the phase is `command` with `battle.monsterHp` unchanged.
    - **Cast Heal:** level 3 hero at hp 5, mp 5; choose Spell, confirm on Heal → `playSfx('spell')` and `playSfx('heal')` were called; when the battle ends (monster hp 1 after a later Fight, bounded mashing) `game.player.mp === 1`.
    - **Refused, no turn (Review Focus 1):** the same hero at full HP: Spell → Heal → the text is `You are not hurt.`, phase returns to `command`, `battle.heroMp === 5`, monster HP unchanged. With mp 3 → `Not enough MP.`
    - **Cancel:** in phase `spell`, cancel → `command`, `playSfx('menuCancel')`, no `act`.
    - **Herb in a won fight:** hero hp 3 with one Herb; Item → Herb, then Fight until won → inventory has no Herb.
    - **Herb in a lost fight (Review Focus 4):** hero hp 3 with one Herb against a monster with atk 100, agi 99; Item → Herb; mash until `onEnd('lost')` → at that call the inventory has no Herb.
    - **Item with nothing usable:** a hero holding only a Torch → `You carry nothing to use.`, phase `command`.
    - **Level-up, fanfare then jingle (Review Focus 3):** level 1 hero at `xp 5`, hp 9; monster hp 1, `xp 2`, `gold: [3, 3]`; pressing confirm on every tick (bounded at 3000) until `onEnd('won')`: `playSong` was called with the victory song exactly once and with the level-up song exactly once; the tick on which the level-up song started is at least 144 ticks (2.4 s) after the tick the victory song started; the texts shown, in order, include `You reach level 2.`, `Strength +1.`, `Max HP +7.`; afterwards `game.player.level === 2`, `hp === 16`, `xp === 7`.
    - **Learning:** a hero at level 2 with `xp 22` beating a monster worth 2 XP sees `You learned Heal!` and ends at level 3 with mp 5.
  - `test/encounterFlow.test.ts`: in the existing **Lost** case give the player one Herb, use it in the fight before dying, and assert after the respawn that hp and mp are at max and the inventory has no Herb.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/battleState.test.ts test/encounterFlow.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** per Interfaces.

- [x] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 5: List owner checks** (do not perform):
  - The battle menu shows Fight / Spell / Item / Run and does not cover the monster or the message window.
  - At level 1, Spell says "You know no spells." and the Mireling does not get a free hit.
  - Item → Herb: "You use the Herb.", a soft rising sound, HP climbs in the top-left window, then the Mireling takes its turn. The Herb is gone from Items afterwards.
  - Win enough fights to reach level 2: the fanfare plays to its end, then a short bright jingle with "You reach level 2." and the stat lines; confirm does nothing until the jingle is over; Status shows the new numbers.
  - At level 3: "You learned Heal!"; in the next fight Spell → Heal shows its cost, plays a glittering sound, restores HP and lowers MP in the top-left window.
  - Heal at full HP says "You are not hurt." and costs nothing.
  - At level 5 (debug Level +1 is fine): Ember hurts the Mireling and never misses.
  - Listen: the spell, heal and level-up sounds are distinct from each other and from the victory fanfare; no clicks.

- [x] **Step 6: Commit**
```bash
git add src/game/battle/battleState.ts src/game/menu/spellsState.ts test/battleState.test.ts test/encounterFlow.test.ts
git commit -m "feat: Spell and Item in battle, level-ups after a win"
```

---

### Task 7: Field menu: Spells, using an Herb, Status

**Files:**
- Modify: `src/game/menu/menuState.ts`, `src/game/menu/spellsState.ts`, `src/game/menu/itemsState.ts`, `src/game/menu/statusState.ts`, `src/game/stats.ts`, `src/game/game.ts`, `src/data/story.ts`, `test/menuState.test.ts`, `test/menuLines.test.ts`, `test/interiors.test.ts`

**Interfaces:**
- Consumes: `castInField`, `useItemInField`, `spellsKnown`, `spellLines`, `xpToNext`, `DialogState`, `TransitionState`, `ExploreState`.
- Produces:
  - `StoryConfig` gains `home: { map: string; entry: string }`; `STORY.home = { map: 'hollowmere', entry: 'gate' }`.
  - `statusLines` gains a last line `'NEXT ' + (xpToNext(p) ?? '-')`; `StatusState`'s window becomes `(8, 8, 128, 122)`.
  - `MenuState`: rows `Status`, `Items`, `Spells`, `Equip`; window `(8, 8, 72, 50)`.
  - `class SpellsState implements State { constructor(game: Game) }` — window `(88, 8, 160, 100)`; a header line `` `MP ${mp}/${maxMp}` `` at `(94, 16)`, then `drawMenu` of `spellLines` over the hero's known spells (all of them, battle-only ones included) at `(94, 28)`. Confirm on a spell calls `castInField(game.rng, game.spells, game.player, id)`:
    - `ok`: `game.player = result.player`, `playSfx(result.sfx)`, push `DialogState([result.text])`. If `result.warp`, the dialog's `onDone` pushes `new TransitionState(stack, { frames: 12, onMid: () => stack.reset(new ExploreState(game, story.home.map, story.home.entry)) })`.
    - not `ok`: `playSfx('error')`, push `DialogState([result.text])`.
    - Confirm on `Nothing` plays `error`. Cancel pops with `menuCancel`.
  - `ItemsState`: confirm on a consumable calls `useItemInField` and handles the result the same way (the existing "You cannot use that now." path is now that function's answer). Equipment is unchanged. The list is rebuilt after use, as today.

- [x] **Step 1: Write failing tests**
  - `test/menuLines.test.ts`: `statusLines` has 11 lines; the last is `NEXT 7` for a new player and `NEXT -` at level 10.
  - `test/menuState.test.ts`:
    - The menu rows are `Status`, `Items`, `Spells`, `Equip`; confirm on row 2 pushes a `SpellsState`, on row 3 an `EquipState`.
    - Replace "a consumable cannot be used now": a hurt hero (hp 1) confirms on `Herb x1` → hp is 15 (the Herb restores at least 20 and the maximum is 15), the inventory is empty, the list shows `Nothing`, a `DialogState` is on top, `playSfx('heal')` was called. At full HP → `playSfx('error')`, the Herb is still held. A held Torch → `error` and still held (Review Focus 1).
    - Using the last of two stacks leaves the cursor on a valid row.
    - `SpellsState` at level 1 lists `Nothing`. At level 3 with hp 5: confirm on Heal → hp between 15 and 22, mp 1, `playSfx('heal')`. At mp 3 → `error`, mp still 3. At level 5, confirm on Ember → `error`, mp unchanged.
    - Homeward: a level 8 hero on the `marsh` map with mp 29; open the menu, Spells, confirm on Homeward, dismiss the dialog, run 30 updates → the stack is exactly one `ExploreState` on `STORY.home.map` at the `STORY.home.entry` point; mp 21.
  - `test/interiors.test.ts`: `MAPS[STORY.home.map].entry[STORY.home.entry]` exists.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/menuState.test.ts test/menuLines.test.ts test/interiors.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** per Interfaces.

- [x] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 5: List owner checks** (do not perform):
  - The menu reads Status / Items / Spells / Equip; Status shows NEXT and nothing is cut off at the bottom of its window.
  - Hurt, outside battle: Items → Herb restores HP with the heal sound and the Herb count drops; at full HP it says "You are not hurt." and the Herb stays.
  - At level 3 or above: Spells shows MP and Heal with its cost; casting it restores HP and lowers MP.
  - At level 5: choosing Ember in the field says "You cannot use that now."
  - With the debug overlay at level 8, out on the marsh: Homeward fades you to Hollowmere's gate with the town theme.

- [x] **Step 6: Commit**
```bash
git add src/game/menu src/game/stats.ts src/game/game.ts src/data/story.ts test/menuState.test.ts test/menuLines.test.ts test/interiors.test.ts
git commit -m "feat: Spells in the field menu, usable Herb, XP to next level"
```

---

### Task 8: Balance pass and its simulation tests

**Files:**
- Create: `test/helpers/simulate.ts`, `test/helpers/warden.ts`, `test/balance.test.ts`
- Modify: `src/data/monsters.ts`, `test/monsters.test.ts`, `docs/superpowers/specs/2026-11-11-the-dimming-vertical-slice-design.md`

**Interfaces:**
- Consumes: `Battle`, `battleKit`, `createPlayer`, `gainXp`, `addItem`, `equip`, `attackOf`, `defenseOf`, `LEVELS`, `ITEMS`, `SPELLS`, `MONSTERS`, `createRng`, `validateActions`.
- Produces:
  - `MONSTERS.mireling`: `hp 4`, `def 1`. `MONSTERS.bog_mireling`: `def 6`. Every other field unchanged.
  - `test/helpers/warden.ts`: `WARDEN: MonsterDef` — id `barrow_warden`, name `Barrow Warden`, hp 70, **atk 20**, def 14, agi 12, xp 300, gold `[0, 0]`, dodge 1/32, `runFactor: Infinity`, `boss: true`, any `intro`, `sprite` and `palette`; `actions: [{ do: 'attack', weight: 6 }, { do: 'blast', name: 'Rot Breath', min: 7, max: 12, weight: 3 }, { do: 'mend', name: 'Mend', min: 15, max: 25, weight: 2, if: 'hpBelowHalf', cooldown: 2 }]`.
  - `test/helpers/simulate.ts`:
    - `heroAt(level: number, gear: string[], herbs: number): PlayerState` — `createPlayer('Wren', [])`, `gainXp` by that level's threshold, each gear item added and equipped, then the Herbs added; full HP and MP.
    - `type Policy = (b: Battle) => BattleCommand`; `fightOnly: Policy`.
    - `healer(healAt: number, damageReserve: number | null): Policy` — if `heroHp ≤ healAt`: the kit's first heal spell if `refusal` allows it, else the kit's first heal item with any left; otherwise, if `damageReserve` is not null and the kit has a damage spell and `heroMp ≥ its cost + damageReserve`, that spell; otherwise `'fight'`.
    - `simulate(rng: Rng, p: PlayerState, monster: MonsterDef, policy: Policy, n: number): { winRate: number; meanRounds: number; meanHpLost: number }` — `n` fresh battles from `p`; a battle still running after 300 rounds counts as a loss; the two means are over wins.
  - Design doc: §10.5 Mireling row `HP 4`, `DEF 1`; Bog Mireling row `DEF 6`; Barrow Warden row `ATK 20`. §9.8: `ATK 20`, `Rot Breath 7–12`, and "takes about 5 per round". Add one line under each table: "Tuned 2026-11-12 after the Phase 3 play-test; pinned by `test/balance.test.ts`."

- [x] **Step 1: Write failing tests** in `test/balance.test.ts`, each with its own `createRng(seed)` and `n = 4000`:
  - **Road, unarmed (owner requirement 1):** `heroAt(1, ['aldric_shield'], 0)` against `MONSTERS.mireling`, `fightOnly` → `winRate ≥ 0.99`, `meanHpLost ≤ 3.0`, `meanRounds ≤ 4`.
  - **Marsh at level 3 with Heal (owner requirement 2):** `heroAt(3, ['aldric_shield'], 0)` against `MONSTERS.bog_mireling`, `healer(8, null)` → `winRate > 0.6`. The same hero with `fightOnly` wins at least 0.2 less often (Heal is what makes the difference).
  - **Marsh at level 1 stays deadly:** `heroAt(1, ['aldric_shield'], 0)` against `bog_mireling`, `fightOnly` → `winRate < 0.05`.
  - **Warden bands (owner requirement 3, spec §9.8):** `validateActions(WARDEN.actions)` passes. `heroAt(L, ['bronze_sword', 'leather_armor', 'aldric_shield'], 3)` against `WARDEN`, `healer(18, 8)`: level 4 `< 0.03`; level 5 `< 0.5`; level 6 `> 0.7`; level 7 `> 0.9`. Also assert the level 6 hero's `attackOf` is 26 and `defenseOf` is 13, as the spec states.
  - `test/monsters.test.ts`: the "matches the spec" rows use the new numbers. The existing club-and-shield pacing test must still pass unchanged.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/balance.test.ts test/monsters.test.ts`
Expected: FAIL (helpers missing; then the road and marsh cases fail on the old numbers).

- [x] **Step 3: Write the helpers and the fixture, change the three monster numbers, update the design doc.**

- [x] **Step 4: Run the balance tests and report the measured numbers**
Run: `npx vitest run test/balance.test.ts test/monsters.test.ts`
Expected: PASS. Report every measured `winRate`, `meanRounds` and `meanHpLost` in the task report. Expected from the planning simulation: road 2.3 HP and 3.1 rounds; marsh 0.83 with Heal and 0.29 without; Warden 0.00 / 0.30 / 0.75 / 0.95.
**If any assertion fails, stop and report the numbers. Do not change monster numbers, thresholds, seeds or the policy to make it pass; retuning is the orchestrator's decision.**

- [x] **Step 5: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 6: List owner checks** (do not perform):
  - At level 1 with only the shield, road fights take about three rounds and cost two or three HP; several can be won before a rest at Hesta's.
  - At level 1 or 2 the marsh still kills you.
  - At level 3, with Heal, a marsh fight is hard but usually won; without casting Heal it is usually lost.

- [x] **Step 7: Commit**
```bash
git add src/data/monsters.ts test/helpers test/balance.test.ts test/monsters.test.ts docs/superpowers/specs
git commit -m "feat: early-game balance pass with simulation tests; Warden win-rate bands"
```

---

### Task 9: Villagers say their own names

**Files:**
- Modify: `src/data/dialog/hollowmere.ts`, `test/dialogContent.test.ts`

**Interfaces:**
- Produces: the lines below replace the first line of each script or branch; every line not shown stays as it is. No name tags (spec §8.1): the name is part of what the villager says.

  | Script, branch | New first line(s) |
  |---|---|
  | `maren_intro` | `You are awake early, {name}. Old Maren was up before you, as ever.` then a new second line `Today you are grown.` |
  | `maren`, before the Warden | `Sit by old Maren's fire a moment. The Dimming is worse at night.` |
  | `maren`, after | `You went down there. And you came back to Maren's door.` |
  | `hesta`, before | `As sure as my name is Hesta, you look more like him every day.` |
  | `hesta`, after | `You came back. Sit. I told myself: Hesta, that one will want feeding.` |
  | `garrik` | `Aldric was a fool. I am Garrik the smith, and I say so to anyone.` then a new second line `He left a wife and a child for a hole in the ground.` |
  | `odo` | `Odo's Goods, and Odo himself. Herbs and torches, that is all I carry.` |
  | `pip` | `I'm Pip! My mum says Aldric is a bedtime story.` |
  | `bram` | `Thirty years they have shouted "Bram, open up!" at this gate. I walked your father to it.` |
  | `tobin`, before | `Let Tobin drink. Tobin has nothing to say to you.` (replacing `...`) |
  | `tobin`, after | `You came back from there. Only Tobin ever did that before.` |

  `maren_fallen`, `villager_a` and `villager_b` are unchanged. Only Maren and Tobin speak of themselves in the third person (owner, 2026-11-12); Hesta, Garrik and Bram name themselves in the first person or through someone else's words.

- [x] **Step 1: Write failing tests** in `test/dialogContent.test.ts`:
  - For each of `['maren', 'Maren']`, `['hesta', 'Hesta']`, `['garrik', 'Garrik']`, `['odo', 'Odo']`, `['pip', 'Pip']`, `['bram', 'Bram']`, `['tobin', 'Tobin']`, and for both flag sets (`[]` and `['warden_defeated']`): the first text step contains the name.
  - `maren_intro`'s first text step contains `Maren` and `Wren`.
  - No string in any script matches `/^[A-Z][a-z]+: /` (no name tags).
  - The existing checks (terminates, at most 8 wrapped lines, banned words, Hesta's one rest, changes after the Warden) still pass.

- [x] **Step 2: Run the test to verify it fails**
Run: `npx vitest run test/dialogContent.test.ts`
Expected: FAIL.

- [x] **Step 3: Replace the lines** exactly as in the table.

- [x] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 5: List owner checks** (do not perform): start a new game and talk to all seven; each says their own name in their first line and it sounds like something that person would say; no line carries a "Name:" tag; Tobin still will not meet your eyes.

- [x] **Step 6: Commit**
```bash
git add src/data/dialog/hollowmere.ts test/dialogContent.test.ts
git commit -m "feat: each named villager says their own name"
```

---

### Task 10: Debug give rows, phase notes, stop

**Files:**
- Create: `docs/superpowers/notes/<date written>-phase-4-carry-forward.md`
- Modify: `src/game/debug.ts`, `test/debugState.test.ts`, this plan (tick the boxes, add an "Execution status" section)

**Interfaces:**
- Consumes: `addItem`, `game.items`.
- Produces: `DebugState` lists one `Give: <id>` row per key of `game.items`, after the `Fight:` rows and before `Close`. Activating one adds one of that item with `addItem`; if it does not fit, `playSfx('error')` and nothing changes. The overlay stays open.

- [x] **Step 1: Write the failing test** in `test/debugState.test.ts`: the labels contain `Give: herb` between the last `Fight:` row and `Close`; activating it twice on a new player gives `Herb x3`; with eight full slots it plays `error` and the inventory is unchanged; "every row, including the last, is reachable" still passes.

- [x] **Step 2: Run the test to verify it fails**
Run: `npx vitest run test/debugState.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** the rows.

- [x] **Step 4: Verify the suite and that production excludes debug code**
Run: `npm test && npx tsc --noEmit && npm run build && grep -l "Give: " dist/assets/*.js | wc -l`
Expected: all green; the count is `0`.

- [x] **Step 5: Write the carry-forward note**: where execution stands (branch, head, suite counts); the measured balance numbers from Task 8; every ruling made while executing, each with its cost if wrong; deferred minors from the reviews; questions for the owner; and the play-test list below, marked as not performed by anyone.

  **Owner play-test for Phase 4** (spec §14): grind from 1 to 5; learn Heal and Ember; use both; use an Herb mid-fight. Then the look-and-listen checks listed in Tasks 6, 7, 8 and 9, plus: use `Give: herb` in the debug overlay when you run out; say whether road fights now feel fair unarmed, whether the marsh at level 3 feels hard but possible, and whether the climb from 3 to 5 without a weapon is too slow (Garrik opens in Phase 5; `Give: wooden_club` is there to compare).

- [x] **Step 6: Commit**
```bash
git add src/game/debug.ts test/debugState.test.ts docs/superpowers
git commit -m "feat: debug give rows; docs: Phase 4 complete, owner play-test list"
```

- [x] **Step 7: Stop.** Phase 4 is complete. Report the owner checks and wait for feedback before Phase 5.
