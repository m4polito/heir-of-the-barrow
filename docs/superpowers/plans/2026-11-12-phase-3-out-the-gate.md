# Phase 3: Out the Gate — Implementation Plan

> **Commit hashes in this file predate the history rewrite of 2026-11-13 and no longer exist.** The commits are the same, with new hashes; find one by its subject line (`git log --grep="<subject>"`). See "Online" in `docs/superpowers/notes/2026-11-13-phase-6-carry-forward.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Walk out of Hollowmere's gate onto the Marsh overworld, meet Mirelings in random one-on-one battles with Fight and Run, win gold and experience, and on death wake in Maren's house with half your gold; with the marsh, battle, victory and fallen music, an encounter sting, and hit/miss sounds.

**Architecture:** Combat is three pure layers under one thin state: `rules.ts` (formulas from spec §9), `Battle` (a round resolver that returns an ordered list of message "beats", each carrying its sound, effect and the HP to show), and `BeatPlayer` (typewriter and pacing). `BattleState` only presents beats and a two-item command menu. Encounters are a pure roll keyed by tile name; `ExploreState` calls it on each completed step, launches the battle through a `TransitionState`, and handles the outcome (resume the map song, or respawn). Monsters, encounter tables, the respawn point and the death dialog are story data injected through `Game`.

**Tech Stack:** TypeScript 5, Vite 6, Vitest 3 (node), Canvas 2D, Web Audio. No runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-11-11-the-dimming-vertical-slice-design.md` (§5.4, §5.6, §6.1–6.3, §7, §9.1–9.6, §9.9–9.10, §10.5, §12.2–12.4, §13, §14 Phase 3, §15). Carry-forward notes: `docs/superpowers/notes/2026-11-11-phase-2-carry-forward.md` (standing instructions, rulings, deferred items).

## Execution status (updated 2026-11-12, phase stop)

- **All 10 tasks complete and reviewed; the whole-branch review and its one fix wave are done (head `33c6f73` plus this docs commit). Stopped for the owner's play-test; not merged.** Rulings, questions for the owner, deferred minors and the play-test list are in `docs/superpowers/notes/2026-11-12-phase-3-carry-forward.md`.
- Where the delivered code differs from the task text below: battle backdrops put the ground at row 8 of the strip (Task 3); `Beat` is declared in `beats.ts` (Tasks 2, 4); the battle and marsh melodies had one creative fix round (Task 5); Task 9's "won" test was replaced in Task 10 by one that walks into the battle, plus a "fled" test; after the final review, confirm is held until a one-shot song has finished, battle text is wrapped once before it types, Run plays no confirm blip, the monster flashes on the killing blow, `startBattle` validates the backdrop, and `validateSong` requires non-looping pitched tracks to end with `off`.

## Execution

- Branch `phase-3` from `master`. Subagent-driven, as in Phase 2: Sonnet 5.5 implements and reviews ordinary tasks; Opus reviews audio (Tasks 4, 5), integration (Tasks 8, 9) and the whole branch; the orchestrator (Fable) reviews creative work itself (monster and tile art, the map layout, the four songs' written harmony, the death dialog).
- Gated: stop after Task 10 for the owner's play-test. Do not start Phase 4.
- Nothing from the Phase 2 play-test is folded in here: the owner's answers closed every item or deferred it (two-press "Equip it?" to Phase 5; late music rows undated).

## Decisions made in this plan (owner approved all eleven on 2026-11-12)

1. **Victories pay gold and experience now; levelling up waits for Phase 4.** XP is a number in Status until then. Phase 4 levels the hero from accumulated XP.
2. **No way to heal in Phase 3** except dying (full HP) or the debug overlay's Full heal. Herb and Heal are Phase 4; the inn is Phase 5.
3. **Mireling sprite is 24×24, drawn at 1×.** The spec sizes only the Warden (32×32).
4. **The Barrow mouth is on the map but shut** (not walkable) until Phase 6. The dead-end copse exists; its chest arrives with chests in Phase 6.
5. **Encounter grace (3 steps) also applies on entering a map**, not only after a battle, so the first step out of town is never a fight.
6. **Into battle is a half-second fade to black under the sting**, then a short fade in. No separate wipe effect.
7. **Battle text has no letter blip** and advances by itself 0.4 s after it finishes typing; confirm skips ahead. The last message of a battle waits for confirm.
8. **Monsters never land critical hits.** A failed run reads "The Mireling blocks the way!" for every monster.
9. **Barrow Mireling is defined now** but can only be met through a new debug row, `Fight: <monster>`.
10. **Hills use Bog Mirelings on the grass backdrop.** Zones are strict tiers as in spec §10.5 (no mixing).
11. **The overworld draws water past its edge** (a `border` tile on the map) instead of black.

## Global Constraints

- No runtime dependencies. All art, text and music are TypeScript data; everything original. **No battle text from Dragon Warrior**: never "draws near", "thou", "thee", "Excellent move", "terrific blow". Use the copy pinned in Task 2.
- 256×240 logical, 16 px tiles, 8×8 font. Message window 4 lines × 28 characters at `(8, 176, 240, 56)`.
- Keys unchanged. Interactions stay one-button and walk-into.
- **Story-free engine:** nothing under `src/engine/`, `src/game/`, `src/ui/` names a story character, place, monster, item or flag, or imports `data/items`, `data/maps`, `data/dialog`, `data/songs`, `data/story`, `data/monsters`. Story tables reach game code through `Game`. Presentation registries keyed by generic archetypes may be imported (`TILES`, sprite registries, `SFX`, `LEVELS`). Song role ids `'title'`, `'battle'`, `'victory'`, `'fallen'` and backdrop ids `'grass'`, `'murk'` are generic and allowed.
- **Stack discipline:** `TransitionState` removes itself by identity and re-pushes itself after an `onMid` that changes the stack. New-game, debug-warp and respawn use `stack.reset`. Auto triggers and pending dialogs fire only from Explore's first `update()` as the top state. State constructors never touch the DOM.
- **Audio must not click.** Master level stays 0.25. Songs hard-cut on change (spec §12.2).
- Owner checks (look/listen in the browser) are the owner's. Implementers list them verbatim and never report them as passed.
- Art tasks load `.claude/skills/pixel-art-sprites/SKILL.md`; this plan wins on conflicts. Palette indices refer to `src/data/palette.ts`.
- A task is done when `npm test`, `npx tsc --noEmit` and `npm run build` are green. One commit per task. Every commit message ends with `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. Run npm from `C:/Projects/VSCode/WarriorsQuest` (uppercase drive).
- Tests that build a `Game` follow `test/state.test.ts` (real `StateStack`, `new AudioManager(null)`, `{} as Font`, lazy `SpriteCache`, fake `Input`).

## Review Focus

1. **A step that lands on a warp, or a step taken while encounters are off or in the grace window**: the warp wins and no battle starts; no random numbers are drawn during grace. Pinned in Tasks 6 and 9.
2. **One confirm press during battle text**: it reveals the message or advances it, never both, and the press that dismisses the last message never also picks Fight. Pinned in Tasks 2 and 8.
3. **Dying with 1 gold, 0 gold or an odd amount**: gold halves rounding down, HP and MP are full, XP, items and flags are untouched, the death dialog plays exactly once and the opening scene does not replay. Pinned in Tasks 1 and 9.
4. **Damage at the edges**: attack far below defence gives 0 or 1, a base of exactly 1 gives 1 (not an empty range), HP never shows below 0, and nothing can act after the battle has ended. Pinned in Tasks 1 and 2.
5. **Bad or extreme table data**: a monster that cannot be run from (`runFactor: Infinity`) never lets you go even when its roll is 0; an encounter table that names an unknown monster or backdrop, or has no entries for a tile, fails a test rather than crashing in play. Pinned in Tasks 1, 6 and 7.

---

## File Structure

```
src/game/battle/monster.ts     MonsterDef, MonsterTable
src/game/battle/rules.ts       damage, strike, initiative, run formulas (pure)
src/game/battle/battle.ts      Battle: round resolver → Beat[] (pure)
src/game/battle/beats.ts       BeatPlayer: typewriter and pacing (pure)
src/game/battle/battleState.ts BattleState, battleStatLines
src/game/encounter.ts          rollEncounter, encounterStep (pure)
src/game/map.ts                + EncounterTable types, GameMap.encounters, GameMap.border
src/game/player.ts             + applyDeath, settleBattle, GOLD_MAX, XP_MAX
src/game/game.ts               + Game.monsters, StoryConfig.respawn
src/game/transition.ts         + inFrames (asymmetric fade)
src/game/explore.ts            + encounter step, startBattle, battle outcome, respawn, pending dialog, border tile
src/game/debug.ts              + Fight rows
src/engine/audio/sequencer.ts  + Song.loop (non-looping songs)
src/data/monsters.ts           MONSTERS (three Mireling tiers)
src/data/sprites/monsters.ts   MONSTER_SPRITES, monsterArt
src/data/sprites/backdrops.ts  BACKDROPS, backdropArt
src/data/sfx.ts                + seven battle effects
src/data/songs/{marsh,battle,victory,fallen}.ts
src/data/tiles.ts              + marsh, hill, town, barrowMouth, deadTree
src/data/maps/marsh.ts         MARSH, MARSH_POINTS
src/data/maps/hollowmere.ts    + gate warps and entry
src/data/dialog/hollowmere.ts  + maren_fallen
src/data/story.ts              + respawn
test/helpers/seqRng.ts         scripted Rng for exact-value tests
```

---

### Task 1: Combat rules and battle settlement (pure)

**Files:**
- Create: `src/game/battle/monster.ts`, `src/game/battle/rules.ts`, `test/helpers/seqRng.ts`, `test/battleRules.test.ts`
- Modify: `src/game/player.ts`, `test/player.test.ts`

**Interfaces:**
- Consumes: `Rng` (`next()` in [0,1), `int(min, max)` inclusive), `PlayerState`.
- Produces:
  - `interface MonsterDef { id: string; name: string; intro: string; sprite: string; palette: number; hp: number; atk: number; def: number; agi: number; xp: number; gold: [number, number]; dodge: number; runFactor: number; boss?: boolean }`; `type MonsterTable = Record<string, MonsterDef>`.
  - `MISS_CHANCE = 1 / 16`; `CRIT_CHANCE = 1 / 32`.
  - `damageRoll(rng, atk: number, def: number): number` — `base = atk − floor(def / 2)`. If `base ≤ 0`: `rng.next() < 0.5 ? 0 : 1`. Else `rng.int(lo, hi)` with `lo = ceil(base / 4)`, `hi = max(lo, floor(base / 2))`.
  - `interface Strike { kind: 'miss' | 'dodge' | 'hit' | 'crit'; damage: number }`.
  - `heroStrike(rng, atk: number, m: Pick<MonsterDef, 'def' | 'dodge' | 'boss'>): Strike` — draws in this order and stops at the first that applies: `next() < MISS_CHANCE` → miss; `next() < m.dodge` → dodge; unless `m.boss`, `next() < CRIT_CHANCE` → crit with damage `int(ceil(atk / 2), atk)`; otherwise hit with `damageRoll(rng, atk, m.def)`. For a boss the crit draw is not made.
  - `monsterStrike(rng, atk: number, heroDef: number): Strike` — `next() < MISS_CHANCE` → miss; otherwise hit with `damageRoll`. Never crit or dodge.
  - `monsterFirst(rng, heroAgi: number, monsterAgi: number): boolean` = `monsterAgi * rng.int(0, 255) > heroAgi * rng.int(0, 255)` (the monster's roll is drawn first).
  - `runSucceeds(rng, heroAgi: number, monsterAgi: number, runFactor: number): boolean` — `false` with no draws when `runFactor` is not finite; else `heroAgi * rng.int(0, 255) > monsterAgi * rng.int(0, 255) * runFactor` (the hero's roll is drawn first).
  - In `player.ts`: `GOLD_MAX = 65535`; `XP_MAX = 65535`; `applyDeath(p): PlayerState` (gold `floor(gold / 2)`, hp and mp to max, nothing else changes); `settleBattle(p, heroHp: number, reward: { xp: number; gold: number } | null): PlayerState` (hp clamped to `0..maxHp`; reward added with the two caps).
  - `seqRng(values: number[]): Rng` in `test/helpers/seqRng.ts` — `next()` returns the values in order and throws `'seqRng exhausted'` past the end; `int(min, max) = min + floor(next() * (max − min + 1))`.

- [x] **Step 1: Write failing tests**
  - `test/battleRules.test.ts`:
    - `damageRoll(seqRng([0]), 4, 3) === 1`; `damageRoll(seqRng([0]), 26, 14) === 5` and with `[0.99]` → `9`; base of exactly 1: `damageRoll(seqRng([0.99]), 5, 8) === 1`; base ≤ 0: `damageRoll(seqRng([0.4]), 4, 8) === 0`, with `[0.6]` → `1`, and `damageRoll(seqRng([0.6]), 1, 40) === 1`.
    - `heroStrike(seqRng([0.01]), 6, { def: 3, dodge: 1 / 32 })` → `{ kind: 'miss', damage: 0 }`; `seqRng([0.5, 0.01])` with `dodge: 1 / 16` → dodge, damage 0; `seqRng([0.5, 0.5, 0.01, 0.99])` atk 6 → `{ kind: 'crit', damage: 6 }`; `seqRng([0.5, 0.5, 0.5, 0])` atk 6 def 3 → `{ kind: 'hit', damage: 2 }`; boss: `heroStrike(seqRng([0.5, 0.5, 0]), 26, { def: 14, dodge: 1 / 32, boss: true })` → `{ kind: 'hit', damage: 5 }` (three draws only).
    - `monsterStrike(seqRng([0.01]), 11, 6)` → miss; `seqRng([0.5, 0])` → hit 2; `seqRng([0.5, 0.99])` → hit 4.
    - `monsterFirst(seqRng([0.99, 0]), 4, 3) === true`; `seqRng([0, 0.99])` → false; equal agility and equal rolls (`[0.5, 0.5]`, 4, 4) → false.
    - `runSucceeds(seqRng([0.99, 0]), 4, 3, 1) === true`; `seqRng([0, 0.99])` → false; `runSucceeds(seqRng([]), 4, 3, Infinity) === false` (Review Focus 5).
    - With `createRng(7)`, 10000 `heroStrike(rng, 6, { def: 3, dodge: 1 / 32 })`: miss fraction in `[0.05, 0.075]`, crit fraction in `[0.02, 0.037]`, no damage below 0.
  - `test/player.test.ts` additions: `applyDeath` with gold 41 → 20, 1 → 0, 0 → 0; a player at hp 0 / mp 0 with `maxHp 15`, `maxMp 5` → 15 and 5; `xp`, `inventory`, `equipment`, `flags`, `level` unchanged and the input not mutated (Review Focus 3). `settleBattle(p, 9, { xp: 2, gold: 4 })` adds both and sets hp 9; `settleBattle(p, -3, null)` → hp 0, gold and xp unchanged; gold 65530 + 18 → 65535; xp 65534 + 18 → 65535.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/battleRules.test.ts test/player.test.ts`
Expected: FAIL (modules and exports missing).

- [x] **Step 3: Implement** `monster.ts`, `rules.ts`, the helper, and the two `player.ts` functions per Interfaces. All pure.

- [x] **Step 4: Run tests to verify they pass**
Run: `npx vitest run test/battleRules.test.ts test/player.test.ts && npx tsc --noEmit`
Expected: PASS; clean.

- [x] **Step 5: Commit**
```bash
git add src/game/battle/monster.ts src/game/battle/rules.ts src/game/player.ts test/helpers/seqRng.ts test/battleRules.test.ts test/player.test.ts
git commit -m "feat: combat formulas, death penalty, battle settlement"
```

---

### Task 2: Battle round resolver and beat player (pure)

**Files:**
- Create: `src/game/battle/battle.ts`, `src/game/battle/beats.ts`, `test/battle.test.ts`, `test/beats.test.ts`

**Interfaces:**
- Consumes: Task 1's `MonsterDef`, `heroStrike`, `monsterStrike`, `monsterFirst`, `runSucceeds`; `SfxId` (the seven battle ids land in Task 4; until then type `Beat.sfx` as `string` and tighten it to `SfxId` in Task 4); `wrapText`.
- Produces:
  - `type BattleCommand = 'fight' | 'run'`; `type BattleOutcome = 'won' | 'lost' | 'fled'`.
  - `interface Beat { text: string; sfx?: string; fx?: 'shake' | 'flash'; song?: string; heroHp: number; monsterHp: number }` — `heroHp` and `monsterHp` are the values to display from this beat on.
  - `interface HeroStats { hp: number; atk: number; def: number; agi: number }`.
  - `class Battle { constructor(rng: Rng, hero: HeroStats, monster: MonsterDef); readonly monster: MonsterDef; get heroHp(): number; get monsterHp(): number; get outcome(): BattleOutcome | null; get reward(): { xp: number; gold: number } | null; intro(): Beat[]; act(cmd: BattleCommand): Beat[] }` — `act` throws `Error('battle is over')` once `outcome` is set.
  - **Round order.** `fight`: draw `monsterFirst`; the first side strikes; if the battle has not ended the other side strikes. `run`: draw `runSucceeds` (no initiative draw); success ends the battle as `fled`; failure costs the turn and the monster strikes. When the monster's HP reaches 0 the gold reward `rng.int(gold[0], gold[1])` is drawn at once and `reward` is set. HP is clamped at 0.
  - **Exact copy** (`{m}` = `monster.name`, `{n}` = damage):

    | Event | Beats, in order |
    |---|---|
    | intro | `monster.intro` |
    | hero strikes | `You attack!` then one of: miss `You missed!` (sfx `miss`) · dodge `The {m} dodges!` (sfx `miss`) · hit n ≥ 1 `The {m} takes {n} damage.` (sfx `monsterHit`, fx `flash`) · hit 0 `The {m} shrugs it off.` (sfx `miss`) · crit `A crushing blow!` (sfx `critical`) then `The {m} takes {n} damage.` (fx `flash`) |
    | monster strikes | `The {m} attacks!` then one of: miss `It misses you.` (sfx `miss`) · hit n ≥ 1 `You take {n} damage.` (sfx `heroHit`, fx `shake`) · hit 0 `The blow glances off.` (sfx `miss`) |
    | run succeeds | `You got away.` (sfx `runOk`) |
    | run fails | `The {m} blocks the way!` (sfx `runFail`), then the monster strikes |
    | monster at 0 HP | `The {m} is defeated.` (song `victory`) then `You gain {xp} experience and {gold} gold.` |
    | hero at 0 HP | `You have fallen.` (song `fallen`) |

  - `BEAT_HOLD = 24`; `class BeatPlayer { constructor(cols = 28); load(beats: Beat[], waitOnLast: boolean): void; get current(): Beat | null; get lines(): string[]; get revealed(): boolean; get waiting(): boolean; get done(): boolean; tick(confirm: boolean): Beat | null }`.
    - `tick` returns a beat on the tick that beat starts (so the caller fires its sound and effect once), else `null`. The starting tick shows 0 characters; each later tick shows one more until `revealed`; then `BEAT_HOLD` ticks pass; the next tick starts the following beat, or sets `done` if there is none.
    - `confirm` while typing reveals the whole message and does nothing else. `confirm` while holding starts the next beat (or sets `done`) on that tick.
    - With `waitOnLast`, the last beat never times out: `waiting` is true once it is revealed and only `confirm` finishes it.
    - `current` stays on the last beat after `done` until the next `load`. `lines` is the revealed text wrapped to `cols`. `load([])` is `done` at once.

- [x] **Step 1: Write failing tests**
  - `test/battle.test.ts` with fixture `M = { id: 'm', name: 'Mireling', intro: 'A Mireling slumps out of the reeds.', sprite: 's', palette: 0, hp: 6, atk: 5, def: 3, agi: 3, xp: 2, gold: [2, 4], dodge: 1 / 32, runFactor: 1 }` and `HERO = { hp: 15, atk: 4, def: 6, agi: 4 }`:
    - `intro()` → `[{ text: M.intro, heroHp: 15, monsterHp: 6 }]`.
    - Hero first, both hit: `seqRng([0, 0.99, 0.5, 0.5, 0.5, 0, 0.5, 0])`, `act('fight')` texts are `['You attack!', 'The Mireling takes 1 damage.', 'The Mireling attacks!', 'You take 1 damage.']`; beat 1 is `{ sfx: 'monsterHit', fx: 'flash', heroHp: 15, monsterHp: 5 }` (plus text); beat 3 is `{ sfx: 'heroHit', fx: 'shake', heroHp: 14, monsterHp: 5 }`; `outcome` is null.
    - Monster first: `seqRng([0.99, 0, 0.5, 0, 0.5, 0.5, 0.5, 0])` → the first text is `'The Mireling attacks!'`.
    - Kill (monster hp 1): `seqRng([0, 0.99, 0.5, 0.5, 0.5, 0, 0.99])` → texts end `'The Mireling is defeated.'`, `'You gain 2 experience and 4 gold.'`; the defeated beat has `song: 'victory'` and `monsterHp: 0`; no `'attacks!'` beat; `outcome === 'won'`; `reward` equals `{ xp: 2, gold: 4 }`; a second `act` throws (Review Focus 4).
    - Loss (hero hp 1): `seqRng([0.99, 0, 0.5, 0])` → last beat `{ text: 'You have fallen.', song: 'fallen', heroHp: 0 }`; no `'You attack!'`; `outcome === 'lost'`; `reward` null.
    - Overkill (monster atk 100, hero hp 3) → `heroHp` is 0 in the beat and on the battle, never negative.
    - Crit: `seqRng([0, 0.99, 0.5, 0.5, 0.01, 0, 0.5, 0])` → texts start `['You attack!', 'A crushing blow!', 'The Mireling takes 2 damage.']`; beat 1 has `sfx: 'critical'`.
    - Miss and dodge beats: hero miss → `'You missed!'`; dodge → `'The Mireling dodges!'`; monster miss → `'It misses you.'`; hero atk 1 against def 40 with the 0 branch → `'The Mireling shrugs it off.'`; monster atk 1 against hero def 40 with the 0 branch → `'The blow glances off.'`.
    - Run: `seqRng([0.99, 0])` → `[{ text: 'You got away.', sfx: 'runOk', … }]`, `outcome === 'fled'`; `seqRng([0, 0.99, 0.5, 0])` → `['The Mireling blocks the way!', 'The Mireling attacks!', 'You take 1 damage.']`; with `runFactor: Infinity`, `seqRng([0.01])` → `['The Mireling blocks the way!', 'The Mireling attacks!', 'It misses you.']`.
    - With `createRng(3)`, 500 battles choosing `fight` every round each end as `won` or `lost` within 200 rounds.
  - `test/beats.test.ts` with two beats `'Hi'` and `'Yo'`, `waitOnLast: false`, ticking with `false`: `tick` returns non-null on ticks 1 and 28 only; `lines` is `['']` after tick 1, `['H']` after 2, `['Hi']` and `revealed` after 3; `done` becomes true on tick 55. `confirm` while typing a 20-character first beat: `revealed` is true, `current` is still the first beat, and the return was `null`; the next `tick(true)` returns the second beat (Review Focus 2). `waitOnLast: true`: after the last beat is revealed, 100 `tick(false)` leave `done` false and `waiting` true; one `tick(true)` sets `done`. A 40-character text gives two `lines`, none longer than 28. `load([], false)` → `done` true.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/battle.test.ts test/beats.test.ts`
Expected: FAIL (modules missing).

- [x] **Step 3: Implement** `battle.ts` and `beats.ts` per Interfaces.

- [x] **Step 4: Run tests to verify they pass**
Run: `npx vitest run test/battle.test.ts test/beats.test.ts && npx tsc --noEmit`
Expected: PASS; clean.

- [x] **Step 5: Commit**
```bash
git add src/game/battle/battle.ts src/game/battle/beats.ts test/battle.test.ts test/beats.test.ts
git commit -m "feat: battle round resolver and message beat player"
```

---

### Task 3: Monster data, Mireling sprite, battle backdrops

**Files:**
- Create: `src/data/monsters.ts`, `src/data/sprites/monsters.ts`, `src/data/sprites/backdrops.ts`, `test/monsters.test.ts`
- Modify: `src/game/game.ts`, `src/main.ts`, `test/art.test.ts`, `test/interiors.test.ts` (story-free guard), every test that calls `createGame(` (add `monsters`)

**Interfaces:**
- Consumes: `MonsterDef`, `MonsterTable`, `Battle`, `PixelArt`, `ITEMS`, `createPlayer`, `equip`/`addItem`, `attackOf`, `defenseOf`.
- Produces:
  - `MONSTERS` in `src/data/monsters.ts`, `satisfies Record<string, MonsterDef>`, numbers exactly from spec §10.5:

    | id | name | palette | hp | atk | def | agi | xp | gold | dodge | intro |
    |---|---|---|---|---|---|---|---|---|---|---|
    | `mireling` | Mireling | 0 | 6 | 5 | 3 | 3 | 2 | [2, 4] | 1/32 | `A Mireling slumps out of the reeds.` |
    | `bog_mireling` | Bog Mireling | 1 | 14 | 11 | 8 | 6 | 7 | [6, 10] | 1/16 | `A Bog Mireling drags itself from the mud.` |
    | `barrow_mireling` | Barrow Mireling | 2 | 24 | 20 | 14 | 10 | 18 | [12, 18] | 1/16 | `A Barrow Mireling unfolds from the dark.` |

    All three: `sprite: 'mireling'`, `runFactor: 1`, no `boss`. (The Warden is Phase 6.)
  - `monsterArt(sprite: string, palette: number): PixelArt` in `src/data/sprites/monsters.ts` — throws on an unknown sprite, falls back to palette 0 for an unknown palette index, and returns the same object for the same arguments (`SpriteCache` keys by identity). One 24×24 Mireling drawing (spec §5.6: pale, slumped, marsh-wet, vaguely humanoid, two eyes like wet stones) with colour keys `b` body, `s` shade, `h` highlight, `e` eye, `g` eye glint. Palettes: 0 pale `{ b: 3, s: 2, h: 1, e: 0, g: 1 }`; 1 bog `{ b: 20, s: 19, h: 22, e: 0, g: 1 }`; 2 barrow `{ b: 17, s: 23, h: 18, e: 0, g: 1 }`. No black outline (the field is black).
  - `BACKDROPS: Record<string, PixelArt>` and `backdropArt(id: string): PixelArt` (throws on unknown) in `src/data/sprites/backdrops.ts` — two 16×24 strips that tile sideways: `grass` (a low horizon line, greens 6/7/21) and `murk` (flat water and reed stubs, 19/20/21).
  - `Game` gains `readonly monsters: MonsterTable`; `main.ts` passes `MONSTERS`.
  - Story-free guard in `test/interiors.test.ts`: the forbidden-import group becomes `(items|maps|dialog|songs|story|monsters)`; the banned strings gain `"'mireling"` and `"'marsh'"`.

- [x] **Step 1: Write failing tests** in `test/monsters.test.ts` (and the `art.test.ts` additions):
  - Each row above matches `MONSTERS` exactly (`toMatchObject` on every listed field); `MONSTERS[id].id === id`.
  - `monsterArt` for each monster compiles against `PALETTE` at 24×24; the three palettes give three different `colors` maps over the same `rows`; two calls with the same arguments return the same object; `monsterArt('nope', 0)` throws.
  - Both backdrops compile at 16×24; `backdropArt('nope')` throws.
  - Text: every `intro`, and `` `The ${name} takes 99 damage.` ``, wraps to at most 2 lines at 28 columns; no `intro` matches `/draws near|thou|thee|slime|dragon/i`.
  - **Early-game pacing (spec §15):** build a level 1 hero from `createPlayer('Wren', [])` with `wooden_club` and `aldric_shield` added and equipped (real `ITEMS`); stats from `attackOf`/`defenseOf` (6 and 6). With `createRng(11)`, 2000 battles against `MONSTERS.mireling` choosing `fight` every round: mean rounds ≤ 4, mean HP lost < 3 (20% of 15), win rate ≥ 0.99.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/monsters.test.ts test/art.test.ts test/interiors.test.ts`
Expected: FAIL.

- [x] **Step 3: Draw the Mireling and the two backdrops** (pixel-art skill loaded; original; the Mireling must read as a slumped figure at 1× and be told apart from every NPC body).

- [x] **Step 4: Implement** the data, the `Game` field and the wiring; add `monsters: MONSTERS` wherever a test builds a `Game`.

- [x] **Step 5: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 6: List owner checks** (do not perform): none visible yet; the sprite and backdrops are first seen in Task 8.

- [x] **Step 7: Commit**
```bash
git add src/data/monsters.ts src/data/sprites/monsters.ts src/data/sprites/backdrops.ts src/game/game.ts src/main.ts test
git commit -m "feat: Mireling tiers, monster sprite, battle backdrops"
```

---

### Task 4: Battle sound effects and non-looping songs

**Files:**
- Modify: `src/data/sfx.ts`, `src/engine/audio/sequencer.ts`, `src/game/battle/battle.ts` (tighten `Beat.sfx` to `SfxId`), `test/sfx.test.ts`, `test/sequencer.test.ts`

**Interfaces:**
- Produces:
  - `SfxId` gains `'encounter' | 'heroHit' | 'monsterHit' | 'miss' | 'critical' | 'runOk' | 'runFail'`. Steps (`f` = frames; a step without `duty` on `p1` inherits none, so give every `p1` step the duty shown):
    - `encounter` (32 f, tritone alarm): `p1` duty 0.125 vol 10: `C4` 3f, `F#4` 3f, `C5` 3f, `F#5` 3f, `C4` 3f, `F#4` 3f, `C5` 3f, `F#5` 3f, `C6` 8f.
    - `heroHit`: noise `s` 1f vol 12; `tri` `A2` 4f vol 12; `tri` `E2` 5f vol 12.
    - `monsterHit`: noise `h` 1f vol 10; `p1` duty 0.125 `A5` 2f vol 9; `p1` duty 0.125 `E5` 2f vol 9.
    - `miss`: `p1` duty 0.125 `B4` 2f vol 6; rest 1f; `p1` duty 0.125 `F#4` 3f vol 5.
    - `critical`: noise `s` 1f vol 13; `p1` duty 0.25 vol 11: `C6` 2f, `G5` 2f, `C6` 2f, `G6` 5f.
    - `runOk`: `p1` duty 0.5 vol 8: `C5` 2f, `E5` 2f, `G5` 2f, `C6` 2f, `E6` 3f.
    - `runFail`: `p1` duty 0.125 vol 9: `E4` 3f, `C4` 3f, `G#3` 6f.
  - `Song` gains `loop?: boolean` (default looping). When `loop === false` the sequencer, after emitting the last row, clears its song **without** calling `apu.stopAll`, so the last notes ring until their own `off` rows; `playing` is then false. `validateSong` throws if `loop === false` and `loopFrom` is set.

- [x] **Step 1: Write failing tests**
  - `test/sfx.test.ts`: every id in `SFX` (iterate `Object.keys`) has at least one step and every `note` parses; `encounter` totals 32 frames and every other new effect totals ≤ 16; with the existing `FakeApu`, `play(SFX.heroHit, 10)` → `noiseHit s @10 vol 12`, `noteOn tri ≈110.0 @10.0167`, `noteOn tri ≈82.41 @10.0833`, `noteOff tri @10.1667`.
  - `test/sequencer.test.ts`: a 4-row song with `loop: false` scheduled far past its end emits each row exactly once, `playing` becomes false, and `stopAll` was called once (by `play`) and not again; the same song without `loop` emits row 0 a second time; `validateSong({ …, loop: false, loopFrom: 0 })` throws.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/sfx.test.ts test/sequencer.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** per Interfaces.

- [x] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit`
Expected: PASS; clean.

- [x] **Step 5: Commit**
```bash
git add src/data/sfx.ts src/engine/audio/sequencer.ts src/game/battle/battle.ts test/sfx.test.ts test/sequencer.test.ts
git commit -m "feat: battle sound effects and non-looping songs"
```

---

### Task 5: Four songs: marsh, battle, victory, fallen

**Files:**
- Create: `src/data/songs/marsh.ts`, `src/data/songs/battle.ts`, `src/data/songs/victory.ts`, `src/data/songs/fallen.ts`
- Modify: `src/data/songs/index.ts`, `test/songs.test.ts`

**Interfaces:**
- Consumes: `Song`, `Track`, `validateSong`, `Song.loop` (Task 4). Follow the `bar()` helper style of `src/data/songs/title.ts`; each file opens with a comment giving the key and the chord per bar, and the notes must sound as that comment says (the Phase 2 title theme failed review on exactly this).
- Produces: `SONGS` gains `marsh`, `battle`, `victory`, `fallen`. All original; nothing may resemble a published game's overworld, battle or fanfare tune. 16 rows per 4/4 bar.

  | Song | Pin | Character (spec §12.3) |
  |---|---|---|
  | `marsh` | tempo 96, 16 bars (256 rows), E minor, `loopFrom: 0`. `p1` duty 0.25 vol 10; `p2` duty 0.125 vol 6; `tri` vol 14; noise vol 4. | Walking pace, wide intervals, a little lonely. `p1`: a melody of leaps (fifths, sixths, octaves) whose phrases end on long notes followed by rests. `p2`: sparse; echoes the tail of each `p1` phrase a beat later, silent otherwise. `tri`: steady quarter notes, root and fifth (the walking). Noise: a soft `h` on beats 2 and 4. |
  | `battle` | tempo 152, 12 bars (192 rows), `loopFrom: 32` (a 2-bar intro, then a 10-bar loop), A minor coloured with Bb and G#. `p1` duty 0.25 vol 11; `p2` duty 0.125 vol 7; `tri` vol 14; noise vol 7. Also export `BATTLE_MOTIF: string[]` (4 to 6 note names). | Fast, driving, tense. Intro: two bars of rising alarm. `p1` states `BATTLE_MOTIF` at row 32 and develops it. `p2`: an ostinato of repeated eighths on chord tones. `tri`: pumping eighths, root and octave. Noise: `k` on beats 1 and 3, `s` on 2 and 4, `h` on the off-eighths. Phase 6's boss theme will quote the motif slower. |
  | `victory` | tempo 150, 24 rows (2.4 s), `loop: false`, C major. `p1` duty 0.5 vol 11; `p2` duty 0.25 vol 8; `tri` vol 14; no noise. | A 2-second fanfare: a rising figure landing on a held C major chord; every pitched track has `off` at or before row 20. |
  | `fallen` | tempo 72, 12 rows (2.5 s), `loop: false`, A minor. `p1` duty 0.5 vol 10; `p2` duty 0.25 vol 6; `tri` vol 13; no noise. | A short descending phrase: `p1` steps down from A4 to E4, `p2` a third below, `tri` a low A2 under the last note; every pitched track ends with `off`. |

- [x] **Step 1: Write failing tests** in `test/songs.test.ts`, one `describe` per song: `validateSong` passes; row count, tempo, `loopFrom`/`loop` as pinned; the channel list and each track's duty and volume as pinned; for `victory` and `fallen`, each pitched track's last non-null row is `'off'` (and for `victory` its index is ≤ 20); for `battle`, `BATTLE_MOTIF.length` is 4 to 6 and the `p1` track's first sounded notes from row 32 on (skipping `null` and `'off'`) equal `BATTLE_MOTIF`; `marsh`'s `tri` track has a note on rows 0, 4, 8 and 12 of every bar.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/songs.test.ts`
Expected: FAIL.

- [x] **Step 3: Compose the four songs** and register them.

- [x] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 5: List owner checks** (do not perform): the songs are first heard in Tasks 8 and 9; listed there.

- [x] **Step 6: Commit**
```bash
git add src/data/songs test/songs.test.ts
git commit -m "feat: marsh, battle, victory and fallen music"
```

---

### Task 6: Encounter tables and the encounter roll (pure)

**Files:**
- Create: `src/game/encounter.ts`, `test/encounter.test.ts`
- Modify: `src/game/map.ts`

**Interfaces:**
- Consumes: `Rng`, `TileDef`.
- Produces:
  - In `map.ts`: `interface EncounterEntry { monster: string; weight: number }`; `interface EncounterZone { backdrop: string; monsters: EncounterEntry[] }`; `interface EncounterTable { baseRate: number; zones: Record<string, EncounterZone> }` (zones keyed by `TileDef.name`); `GameMap` gains `encounters?: EncounterTable` and `border?: number` (a tile id drawn outside the map's bounds).
  - `ENCOUNTER_GRACE = 3`; `interface EncounterHit { monster: string; backdrop: string }`.
  - `rollEncounter(rng, table: EncounterTable, tile: Pick<TileDef, 'name' | 'encounterRate'>): EncounterHit | null` — returns `null` with **no draw** when the tile has no zone, the zone has no monsters, the total weight is ≤ 0, or `tile.encounterRate ≤ 0`. Otherwise: `rng.next() < table.baseRate * tile.encounterRate`, else `null`; then `r = rng.next() * totalWeight` and the first entry whose running weight exceeds `r`.
  - `encounterStep(rng, table, tile, grace: number): { grace: number; hit: EncounterHit | null }` — `grace > 0` → `{ grace: grace − 1, hit: null }` with no draw; else `{ grace: 0, hit: rollEncounter(…) }`.

- [x] **Step 1: Write failing tests** in `test/encounter.test.ts` with `T = { baseRate: 1 / 16, zones: { grass: { backdrop: 'grass', monsters: [{ monster: 'a', weight: 3 }, { monster: 'b', weight: 1 }] }, marsh: { backdrop: 'murk', monsters: [{ monster: 'c', weight: 1 }] }, empty: { backdrop: 'grass', monsters: [] } } }`:
  - `rollEncounter(seqRng([0.01, 0]), T, { name: 'grass', encounterRate: 1 })` → `{ monster: 'a', backdrop: 'grass' }`; `seqRng([0.01, 0.8])` → monster `'b'`; `seqRng([0.07])` → `null` (0.07 ≥ 1/16).
  - Rate multiplier: `seqRng([0.07, 0])` on `{ name: 'marsh', encounterRate: 1.5 }` → monster `'c'`.
  - No draw (`seqRng([])` must not throw): a tile named `'floor'`; the `'empty'` zone; `encounterRate: 0`; a zone whose weights are all 0 (Review Focus 5).
  - `encounterStep(seqRng([]), T, grass, 3)` → `{ grace: 2, hit: null }`; with grace 0 and `seqRng([0.01, 0])` → a hit and `grace: 0` (Review Focus 1).
  - With `createRng(5)`, 16000 rolls: grass hits in `[850, 1150]`; a `road`-named zone at rate 0.5 in `[400, 600]`; marsh at 1.5 in `[1350, 1650]`; over the grass hits, `'a'` is between 70% and 80%.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/encounter.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** per Interfaces.

- [x] **Step 4: Run tests to verify they pass**
Run: `npx vitest run test/encounter.test.ts && npx tsc --noEmit`
Expected: PASS; clean.

- [x] **Step 5: Commit**
```bash
git add src/game/encounter.ts src/game/map.ts test/encounter.test.ts
git commit -m "feat: encounter tables and the per-step encounter roll"
```

---

### Task 7: The Marsh map, overworld tiles, and the town gate

**Files:**
- Create: `src/data/maps/marsh.ts`, `test/marsh.test.ts`
- Modify: `src/data/tiles.ts`, `src/data/maps/index.ts`, `src/data/maps/hollowmere.ts`, `test/tiles.test.ts`, `test/interiors.test.ts`

**Interfaces:**
- Consumes: `parseAsciiMap`, `GameMap`, `EncounterTable`, `MONSTERS`, `BACKDROPS`, `SONGS`.
- Produces:
  - `TILE_IDS` gains `marsh: 14, hill: 15, town: 16, barrowMouth: 17, deadTree: 18`:

    | name | walkable | encounterRate | Look (16×16, 3–4 colours) |
    |---|---|---|---|
    | `marsh` | yes | 1.5 | dark standing water (19) with reed tufts (21, 22) |
    | `hill` | yes | 1.5 | a rounded mound on grass (6, 7, 21) |
    | `town` | yes | 0 | a tiny walled cluster of red roofs on grass, read as "village" at a glance |
    | `barrowMouth` | no | 0 | a grassy mound with grey stones (2, 3) round a black opening |
    | `deadTree` | no | 0 | a bare, leaning willow, brown and grey, on grass |

  - `MARSH: GameMap` — id `'marsh'`, **48×40**, authored as ASCII with legend `g` grass, `.` road, `~` water, `t` tree, `m` marsh, `h` hill, `H` town, `B` barrow mouth, `w` dead tree. `music: 'marsh'`, `border: TILE_IDS.water`, `npcs: []`. Layout rules (spec §5.4):
    - Every edge tile is water or tree.
    - The town tile is at **(12, 20)**; `entry.town = { x: 12, y: 21, facing: 'down' }`; a warp on (12, 20) to `hollowmere` entry `gate`.
    - The barrow mouth is at **(40, 6)**. An unbroken road runs from (12, 21) to a tile next to the barrow mouth, crossing the marsh; a dead tree stands beside that road about half-way (Bram: "North-east, past the dead willow").
    - No marsh or hill within 3 tiles of the town. Marsh fills the middle of the map on both sides of the road; hills in the north and east; ponds and tree lines break up the grass.
    - One dead-end copse far from the road, exported for Phase 6's chest: `MARSH_POINTS = { copse: { x, y }, barrow: { x: 40, y: 6 } }`.
    - `encounters: { baseRate: 1 / 16, zones: { grass: { backdrop: 'grass', monsters: [{ monster: 'mireling', weight: 1 }] }, road: (same as grass), marsh: { backdrop: 'murk', monsters: [{ monster: 'bog_mireling', weight: 1 }] }, hill: { backdrop: 'grass', monsters: [{ monster: 'bog_mireling', weight: 1 }] } } }`.
  - `MAPS.marsh`.
  - `HOLLOWMERE`: warps on **(11, 19)** and **(12, 19)** (the gap in the south wall) to `marsh` entry `town`; `entry.gate = { x: 11, y: 18, facing: 'up' }`.

- [x] **Step 1: Write failing tests**
  - `test/tiles.test.ts`: `TILES.length === 19`; the walkable and `encounterRate` columns above.
  - `test/marsh.test.ts`:
    - Size 48×40; `MAPS.marsh.id === 'marsh'`; `SONGS[MARSH.music]` exists; `border` is the water id.
    - Exactly one `town` tile, at (12, 20); exactly one `barrowMouth`, at (40, 6); at least one `deadTree`; every edge tile is non-walkable.
    - `entry.town` is a road tile; `warpAt(MARSH, 12, 20)` leads to `hollowmere` / `gate`, and that entry exists and is walkable.
    - A breadth-first search over **road tiles only** from (12, 21) reaches a tile orthogonally next to (40, 6). Some `deadTree` is orthogonally next to a road tile whose x is between 20 and 34.
    - A flood fill over walkable tiles from `entry.town` reaches every walkable tile.
    - No `marsh` or `hill` tile within Chebyshev distance 3 of (12, 20).
    - Counts away from the edge: marsh ≥ 150, hill ≥ 40, water ≥ 60, tree ≥ 80, road ≥ 50.
    - `MARSH_POINTS.copse` is walkable, has exactly one walkable orthogonal neighbour, at least two tree neighbours, and is at least 12 walking steps from the nearest road tile.
    - Encounters (Review Focus 5): the zone keys are exactly `grass`, `road`, `marsh`, `hill`, each the `name` of a tile in `TILES`; every `monster` is a key of `MONSTERS`; every `backdrop` is a key of `BACKDROPS`; every weight > 0; `baseRate === 1 / 16`.
    - Hollowmere: `warpAt(HOLLOWMERE, 11, 19)` and `(12, 19)` lead to `marsh` / `town`; `entry.gate` is `(11, 18, 'up')`, walkable, and no NPC stands on it.
  - `test/interiors.test.ts`: keep every existing assertion true for the four **door** warps; where a test counts or walks "every warp" on Hollowmere, restrict it to warps on door tiles and assert separately that Hollowmere has six warps.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/tiles.test.ts test/marsh.test.ts test/interiors.test.ts`
Expected: FAIL.

- [x] **Step 3: Draw the five tiles** (pixel-art skill loaded; original; `marsh` and `hill` must be told apart from `water`, `grass` and `tree` at 1×).

- [x] **Step 4: Lay out the Marsh** and add the registry entry and the Hollowmere gate.

- [x] **Step 5: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 6: List owner checks** (do not perform): walk down through Hollowmere's gate past Bram; fade; arrive on the overworld just below a small town icon with the marsh theme playing; the map scrolls with the hero centred; water, not black, shows past the map's edge; marsh, hill, town, barrow mound and dead willow each read clearly; follow the road north-east past the dead willow to the barrow mound (it cannot be entered yet); walk back onto the town icon and arrive inside the gate facing up with the town theme. (Fights begin in Task 9.)

- [x] **Step 7: Commit**
```bash
git add src/data/tiles.ts src/data/maps test/tiles.test.ts test/marsh.test.ts test/interiors.test.ts
git commit -m "feat: the Marsh overworld, its tiles, and the town gate"
```

---

### Task 8: Battle screen

**Files:**
- Create: `src/game/battle/battleState.ts`, `test/battleState.test.ts`
- Modify: `src/game/transition.ts`, `test/transition.test.ts`

**Interfaces:**
- Consumes: `Battle`, `BeatPlayer`, `MonsterDef`, `BattleOutcome`, `settleBattle`, `attackOf`, `defenseOf`, `MenuList`, `drawWindow`, `drawMenu`, `monsterArt`, `backdropArt`, `TransitionState`, `Game`.
- Produces:
  - `transitionAlpha(t: number, out: number, inn: number = out): number` — `t < out` → `min(1, t / out)`; else `max(0, 1 − (t − out) / inn)`. `TransitionState` options gain `inFrames?: number` (default `frames`); `onMid` fires at `t === frames`; the state removes itself at `t ≥ frames + inFrames`. Existing behaviour with equal halves is unchanged.
  - `battleStatLines(name: string, hp: number, mp: number): string[]` = `[name, 'HP ' + String(hp).padStart(3), 'MP ' + String(mp).padStart(3)]`.
  - `class BattleState implements State { constructor(game: Game, opts: { monster: MonsterDef; backdrop: string; onEnd: (outcome: BattleOutcome) => void }); get phase(): 'beats' | 'command' | 'ending'; get battle(): Battle }` — the constructor touches no DOM; it builds the `Battle` from `game.player` (`hp`, `attackOf`, `defenseOf`, `agi`) and `game.rng`, and loads `battle.intro()` with `waitOnLast: false`.
    - `enter()`: `game.audio.playSong(game.songs['battle']!)`.
    - `update`, phase `beats`: `tick(input.pressed('confirm'))`; a returned beat fires `playSfx(beat.sfx)`, `playSong(game.songs[beat.song])`, starts a 4-frame shake or an 8-frame flash, and becomes the source of the displayed HP. When the player is `done`: if `battle.outcome` is null, call `input.rearm()`, switch to `command` and return (that tick reads no command); otherwise switch to `ending`.
    - Phase `command`: `repeat('up' | 'down')` moves a two-item `MenuList` (`Fight`, `Run`) with `menuMove`; `confirm` plays `menuConfirm`, calls `battle.act`, loads the beats with `waitOnLast = battle.outcome !== null`, and returns to `beats`. Cancel does nothing.
    - Entering `ending` pushes `new TransitionState(stack, { frames: outcome === 'lost' ? 30 : 12, onMid })` once, where `onMid` does, in order: `stack.remove(this)`; `game.player = settleBattle(game.player, battle.heroHp, battle.reward)`; `opts.onEnd(outcome)`.
    - `render`: black over the whole screen; while shaking, the whole picture is offset 2 px left or right on alternate frames. Backdrop art tiled 16 times at y = 96. Monster centred horizontally with its bottom edge at y = 104 (so a 24-pixel sprite is at `(116, 80)`); hidden when the displayed monster HP is 0 and on alternate 2-frame intervals while flashing. Stats window `(8, 8, 80, 48)` with `battleStatLines` at `(16, 16 + 10 * i)`. In phase `command`, a window `(8, 132, 72, 36)` with `drawMenu` at `(16, 140)`. Message window `(8, 176, 240, 56)` with the beat's lines at `(16, 184 + 10 * i)` and a blinking `▼` at `(232, 220)` while `waiting`.

- [x] **Step 1: Write failing tests**
  - `test/transition.test.ts`: `transitionAlpha(15, 30, 10) === 0.5`, `(30, 30, 10) === 1`, `(35, 30, 10) === 0.5`, `(40, 30, 10) === 0`; the existing five two-argument cases still hold; a `TransitionState({ frames: 30, inFrames: 10 })` calls `onMid` once, on update 30, and is gone from the stack after update 40.
  - `test/battleState.test.ts` (real stack, a fake state underneath, a fake `Input` whose pressed actions the test sets per tick, `vi.spyOn(game.audio, 'playSong')` and `playSfx`):
    - `battleStatLines('Wren', 15, 0)` → `['Wren', 'HP  15', 'MP   0']`.
    - Pushing the state calls `playSong` with the battle song.
    - **One press, one thing (Review Focus 2):** tick without input until the intro is fully revealed; press confirm on one tick; tick 5 more times with no input → `phase === 'command'` and `battle.monsterHp` is still full.
    - **Won:** monster with 1 HP and `gold: [3, 3]`, `rng: createRng(1)`, hero attack 50; press confirm every third tick (bounded at 2000 ticks) → `onEnd` called exactly once with `'won'`; `playSong` was called with the victory song; `game.player.gold` rose by 3 and `xp` by the monster's `xp`; the stack ends as exactly the fake state.
    - **Lost:** player hp 1, monster atk 100 and agi 99 → `onEnd('lost')` exactly once; at that call `game.player.hp === 0`; `playSong` was called with the fallen song.
    - **Fled:** hero agi 99 against monster agi 1; press down then confirm in `command` → `onEnd('fled')`; gold and xp unchanged; `playSfx('runOk')` was called.
    - A hit on the hero calls `playSfx('heroHit')`; a hit on the monster calls `playSfx('monsterHit')`.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/transition.test.ts test/battleState.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** the transition change and `BattleState`.

- [x] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 5: List owner checks** (do not perform): none reachable until Task 9 wires encounters; the battle screen's checks are listed there.

- [x] **Step 6: Commit**
```bash
git add src/game/battle/battleState.ts src/game/transition.ts test/battleState.test.ts test/transition.test.ts
git commit -m "feat: battle screen with Fight and Run"
```

---

### Task 9: Encounters on the map, battle outcome, death and respawn

**Files:**
- Create: `test/encounterFlow.test.ts`
- Modify: `src/game/explore.ts`, `src/game/game.ts`, `src/data/story.ts`, `src/data/dialog/hollowmere.ts`, `test/dialogContent.test.ts`, `test/interiors.test.ts`

**Interfaces:**
- Consumes: `encounterStep`, `ENCOUNTER_GRACE`, `BattleState`, `BattleOutcome`, `applyDeath`, `TransitionState` (`inFrames`), `TILES`.
- Produces:
  - `StoryConfig` gains `respawn: { map: string; entry: string; dialog: string }`; `STORY.respawn = { map: 'elder_house', entry: 'start', dialog: 'maren_fallen' }`.
  - `DIALOGS.maren_fallen` (and `DialogId`): three lines in Maren's voice (spec §9.9, §8.3), second person, one idea each: you are home and safe; Bram found you and carried you home, and said nothing; half your gold is gone but you are not. **Location-neutral (owner, 2026-11-12):** no line may say where the hero fell (no road, marsh, gate or Barrow), because Phase 6 adds deaths in the Barrow. No game-over tone.
  - `ExploreState`:
    - `constructor(game, mapId, entry, opts?: { dialog?: string })` — throws if `opts.dialog` is not a key of `game.dialogs`. The dialog is shown once, from the first `update()` in which Explore is the top state and no auto trigger fired; if an auto trigger fires first, it waits for the next such update.
    - A private grace counter, set to `ENCOUNTER_GRACE` in the constructor, in `warpTo`'s `onMid`, and after a battle that was won or fled.
    - On arriving at a tile: a warp wins as today. Otherwise, if the map has `encounters` and `game.debug.noEncounters` is false, call `encounterStep` with the tile under the hero; store the new grace; on a hit call `startBattle` and stop the hero from chaining into another step.
    - `startBattle(monsterId: string, backdrop: string): void` (public) — throws `Unknown monster: <id>` if absent from `game.monsters`; calls `game.audio.stopSong()` and `playSfx('encounter')`; pushes `new TransitionState(stack, { frames: 30, inFrames: 10, onMid: () => stack.push(new BattleState(game, { monster, backdrop, onEnd })) })`.
    - `onEnd('won' | 'fled')`: reset grace and replay the map's song. `onEnd('lost')`: `game.player = applyDeath(game.player)`, then `stack.reset(new ExploreState(game, story.respawn.map, story.respawn.entry, { dialog: story.respawn.dialog }))`.
    - `render`: where a visible tile lies outside the map and `map.border` is set, draw `TILES[map.border]` (animated like any tile).

- [x] **Step 1: Write failing tests** in `test/encounterFlow.test.ts`. Build a `Game` on the real `MAPS`, `DIALOGS`, `SONGS`, `STORY`, `ITEMS` plus two test maps added to `maps`: `field` (8×3, all grass, `music: 'marsh'`, `entry.start = (0, 1, 'right')`, `encounters: { baseRate: 1, zones: { grass: { backdrop: 'grass', monsters: [{ monster: 'weak', weight: 1 }] } } }`, a warp on (4, 1) to `field2` / `start`) and `field2` (the same without the warp); and `monsters: { weak: { hp: 1, atk: 0, agi: 1, gold: [3, 3], xp: 2, … }, brute: { hp: 99, atk: 100, agi: 99, … } }`. The player has `intro_done` set. The fake `Input` holds or presses what each case says. A step takes 8 updates.
  - **Grace then battle:** on `field2`, hold right. After 3 completed steps no `TransitionState` or `BattleState` has been pushed; on the 4th a `TransitionState` is on top, `stopSong` and `playSfx('encounter')` were called once each; 30 updates later a `BattleState` is in the stack; the hero has not moved further.
  - **Encounters off:** with `game.debug.noEncounters = true`, 7 steps on `field2` push nothing.
  - **Warp wins (Review Focus 1):** on `field`, hold right; the 4th step lands on the warp; after the transition the map id is `field2` and no `BattleState` was ever in the stack; the next 3 steps on `field2` start no battle (grace was reset on entry).
  - **Won:** start the `weak` battle through `startBattle('weak', 'grass')` with a player of attack 50 (level raised with `applyLevel`), mash confirm until Explore is the top state (bounded) → gold +3, xp +2; the last `playSong` call was the field's song; holding right for 3 steps starts no battle and the 4th does.
  - **Lost (Review Focus 3):** player gold 41, hp 1; `startBattle('brute', 'grass')`; mash confirm, bounded → the stack is exactly one `ExploreState` whose `mapId` is `STORY.respawn.map` with the hero on the respawn entry; gold 20; hp and mp at max; xp, inventory and flags as before. The next update pushes a `DialogState`; dismissing it (confirm, bounded) returns to Explore; 100 more updates push no `DialogState`. Repeat with gold 1 → 0.
  - `startBattle('nope', 'grass')` throws `Unknown monster: nope`. `new ExploreState(game, 'field', 'start', { dialog: 'nope' })` throws.
  - `test/dialogContent.test.ts`: `maren_fallen` is in the id list and passes the existing per-script checks (terminates, ≤ 8 wrapped lines per text, banned words). `test/interiors.test.ts`: `MAPS[STORY.respawn.map].entry[STORY.respawn.entry]` exists and `DIALOGS[STORY.respawn.dialog]` exists.

- [x] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/encounterFlow.test.ts test/dialogContent.test.ts test/interiors.test.ts`
Expected: FAIL.

- [x] **Step 3: Write `maren_fallen`**, add `respawn` to the story config, and implement the Explore changes.

- [x] **Step 4: Run everything**
Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green.

- [x] **Step 5: List owner checks** (do not perform):
  - Walk the road outside town: after a few steps the music cuts, a sharp sting plays, the screen fades to black and the battle screen fades in as the battle theme starts. No fight ever starts on the first three steps out of the gate or right after a fight.
  - Battle screen: a pale Mireling stands on a grass strip; your name, HP and MP are top-left; the message types out, then Fight / Run appears. Messages move on by themselves; confirm hurries them.
  - Fight: the Mireling blinks and a hit sound plays when you strike it; the screen shakes and a thud plays when it strikes you; your HP drops as the message appears; a miss has its own soft sound.
  - Win: the fanfare plays, "The Mireling is defeated." then the experience and gold line; confirm fades back to the map; the marsh theme starts again; Status shows the new gold and XP.
  - Run: choose Run; either "You got away." with a quick rising sound and back to the map, or "The Mireling blocks the way!" with a falling sound and it attacks.
  - Walk into the marsh tiles: fights are more frequent, the Mireling is teal on a murky strip, and it hits much harder.
  - Die there: "You have fallen." with a short falling phrase; a slow fade; you wake in Maren's house facing her at full HP; she speaks; your gold is half what it was; the town theme plays. Talking to Maren again gives her normal lines.
  - Listen: the marsh theme (walking pace, lonely, loops cleanly), the battle theme (fast, tense, the intro is not repeated on the loop), no clicks at any music change.
  - With the debug overlay's encounters OFF, no fights happen.

- [x] **Step 6: Commit**
```bash
git add src/game/explore.ts src/game/game.ts src/data/story.ts src/data/dialog/hollowmere.ts test/encounterFlow.test.ts test/dialogContent.test.ts test/interiors.test.ts
git commit -m "feat: random encounters, battle outcomes, death and respawn"
```

---

### Task 10: Debug fight rows, phase notes, stop

**Files:**
- Create: `docs/superpowers/notes/2026-11-12-phase-3-carry-forward.md`
- Modify: `src/game/debug.ts`, `test/debugState.test.ts`, this plan (tick the boxes, add an "Execution status" section)

**Interfaces:**
- Consumes: `ExploreState.startBattle`, `game.monsters`.
- Produces: `DebugState` lists one `Fight: <id>` row per key of `game.monsters`, after the warp rows and before `Close`. Activating one pops the overlay and, if the new top state is an `ExploreState`, calls `startBattle(id, 'grass')`.

- [x] **Step 1: Write the failing test** in `test/debugState.test.ts`: the labels contain `Fight: mireling`, `Fight: bog_mireling`, `Fight: barrow_mireling` between the last `Warp:` row and `Close`; activating `Fight: barrow_mireling` over an `ExploreState` removes the `DebugState` and leaves a `TransitionState` on top; 30 updates later a `BattleState` whose `battle.monster.id` is `'barrow_mireling'` is in the stack.

- [x] **Step 2: Run the test to verify it fails**
Run: `npx vitest run test/debugState.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement** the rows.

- [x] **Step 4: Verify the suite and that production excludes debug code**
Run: `npm test && npx tsc --noEmit && npm run build && grep -l "Fight: " dist/assets/*.js | wc -l`
Expected: all green; the count is `0`.

- [x] **Step 5: Write the carry-forward note**: where execution stands (branch, head, suite counts); every ruling made while executing, each with its cost if wrong; deferred minors from the reviews; questions for the owner; and the owner play-test list below, marked as not performed by anyone.

  **Owner play-test for Phase 3** (spec §14): leave town; get into fights; win some; run from some; die once and wake up at Maren's with half your gold. Then the look-and-listen checks listed in Tasks 7 and 9, plus: open the debug overlay and use `Fight: barrow_mireling` to see the third colour; confirm the Mireling's three colours read as one creature in three places; say whether unarmed level 1 fights feel too slow before shops exist (the debug overlay's Level +1 and Full heal are there for this play-test).

- [x] **Step 6: Commit**
```bash
git add src/game/debug.ts test/debugState.test.ts docs/superpowers
git commit -m "feat: debug fight rows; docs: Phase 3 complete, owner play-test list"
```

- [x] **Step 7: Stop.** Phase 3 is complete. Report the owner checks and wait for feedback before Phase 4.
