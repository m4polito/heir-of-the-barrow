# Heir of the Barrow: The Dimming — Vertical Slice Design

**Project:** Warrior's Quest (repo name) / *Heir of the Barrow* (game title), subtitle *The Dimming* (Act 1)
**Date:** 2026-11-11
**Status:** Approved 2026-11-11 with owner changes (password deferred, debug mode added, starting gold 40). Build runs on Fable orchestration with Sonnet 5.5 implementation subagents, gated per phase.

---

## 1. Intent

A browser-based JRPG in the style of the 8-bit NES *Dragon Warrior*: a lone hero on a tile map, one-on-one menu-driven battles, a town that feels safe and an outside that doesn't. Everything — characters, names, art, music, story — is original. Only the *mechanics and feel* mirror the classic.

**Why this exists.** The owner wants the thing the original gave them: music that pulls you in from the title screen, a town that feels like home, battle sounds that keep you on edge, and villagers you remember. Nostalgia comes from the 8-bit presentation and the audio. The gameplay should carry the classic's rhythm without its chores.

**What ships first.** A vertical slice: one town (Hollowmere), one overworld (the Marsh), one dungeon (the Sunken Barrow), one regular monster (Mireling), one boss (the Barrow Warden). Playable in a browser from a shareable link. Built in six phases, each ending in something the owner can load and play.

---

## 2. Goals, Non-Goals, Anti-Goals

### Goals
- A playable, shareable slice that feels like a complete opening chapter and ends on a hook.
- Original chiptune music and sound effects, present from phase 1, synthesized in the browser in the timbre of the NES sound chip.
- NPCs whose single lines of dialog are about the player and the world, not just directions.
- Core systems built to extend into a full game: tile maps, state machine, dialog, combat, stats and leveling, shops, save/load.
- Keyboard-driven, crisp integer-scaled pixel art at NES resolution.

### Non-Goals (for the slice)
- Mobile or touch support. Desktop keyboard only. Gamepad is a later nicety.
- Multiple party members, multiple enemies per battle, or status effects beyond what the boss needs.
- Multiple towns, more than one overworld region, or more than one dungeon.
- Cutscenes, animated title sequences, or voice.
- A level editor or external asset pipeline. Art and music are data in TypeScript.

### Anti-Goals (would make it a failure even if it technically works)
- Any character, place name, sprite, tune, or line of text recognizable as borrowed from *Dragon Warrior* or any other published game. Mechanics may mirror; content may not.
- "Nostalgic friction": commands like Stairs, Door, Search-to-see-a-chest, or menu-hopping to walk through a door. Interaction must be one button.
- Placeholder audio in any play-test build. If a phase adds a screen, it ships with its music.
- A game framework dependency. See §4.

---

## 3. Constraints

- **Stack:** TypeScript, Vite, HTML5 Canvas 2D, Web Audio API. No runtime dependencies. Dev dependencies (Vite, TypeScript, a test runner) are fine.
- **Framework:** none (owner accepted the recommendation; reasoning in §4).
- **Art and music authored by the AI builder** as code/data, in a style the owner can later replace with hand-drawn sheets or tracked music without touching game logic.
- **Playable in the browser** as a static build; deployable to GitHub Pages or Netlify.
- **Phased delivery.** Each phase ends in a loadable, play-testable build (§14).
- **Design-first.** No product code until this document is approved.

---

## 4. Technical Foundations

### 4.1 Why no framework
A tile-based 8-bit game at 256×240 is a tile blitter, a sprite blitter, a bitmap font, and a loop. Phaser or PixiJS would add bundle weight and an abstraction layer that fights integer scaling, pixel-perfect text, and a hand-rolled APU-style synth. Plain canvas keeps the whole engine readable in a few files.

### 4.2 Display
- Logical resolution **256×240**, 16×16 tiles, so the viewport is 16×15 tiles. The hero is drawn at the center tile; maps scroll.
- Rendered to an offscreen canvas at logical size, then drawn to the visible canvas at the largest integer scale that fits the window (`image-rendering: pixelated`, `imageSmoothingEnabled = false`). Letterboxed with black.
- Palette: a fixed ~54-color NES-like palette defined once. All art references palette indices. Builder's call on exact values.

### 4.3 Game loop
- Fixed timestep at 60 updates/second with an accumulator; render once per animation frame. Input is sampled per update.
- A global `frame` counter drives all animation (hero walk cycle, water tiles, text blink) so timing is deterministic.

### 4.4 Input
| Action | Keys |
|---|---|
| Move | Arrow keys, WASD |
| Confirm / Interact | Z, Enter, Space |
| Cancel / Open menu | X, Escape |
| Mute toggle | M |

Input module exposes `pressed(action)` (edge) and `held(action)` (level). Key repeat for menus: initial delay then auto-repeat, builder's values.

### 4.5 Audio start
Browsers block audio until a user gesture. The title screen shows "Press any key" and the AudioContext is created/resumed on that first keypress; the title theme starts immediately after. Mute state persists in localStorage.

### 4.6 Debug mode (dev builds only)
A developer overlay for play-testing, added in Phase 2 and compiled out of production builds (guarded by Vite's `import.meta.env.DEV` so the code is tree-shaken from `npm run build`). Opened with the backquote key from `Explore`. Commands:
- **Set level** (applies the stat table, keeps current HP/MP ratios)
- **Give gold** (+100, +1000)
- **Toggle encounters** (off/on, shown as a small "ENC OFF" tag in the corner while off)
- **Warp to map** (pick map, lands on its default entry point)
- **Full heal** and **Give item** are cheap additions the builder may include.

The overlay reuses the game's window and font so it needs no separate UI code. Nothing it does is saved differently from normal play, so a debug-assisted save is a normal save.

### 4.7 Project layout (suggested, builder may adjust)
```
src/
  main.ts            bootstrap, canvas, loop
  engine/            input, renderer, font, audio synth, rng, state machine
  data/              palette, tiles, sprites, maps, monsters, items, spells, levels, songs, sfx, dialog
  game/              states (title, explore, dialog, menu, shop, inn, battle), save/load, combat rules
  ui/                window drawing, text box, menu cursor
test/                unit tests for combat math, leveling, save round-trip, password codec
```

---

## 5. Story and World

### 5.1 Premise
Twenty years ago the kingdom's champion, **Aldric**, went into the **Sunken Barrow** to end whatever was poisoning the land, and never came back. The poison didn't stop; it slowed. Crops come up thin, the river runs cold, and the **Mirelings** that once kept to the marsh now wander the roads at dusk. The people of **Hollowmere** have stopped talking about it, the way you stop talking about an illness that isn't getting better. They call it *the Dimming*.

The player is Aldric's child. The game opens on their coming-of-age morning. The town elder, **Maren**, gives them the only thing that came back from the Barrow: Aldric's dented shield, carried out by a terrified squire who never spoke of what he saw. Nobody asks the hero to go. Everyone knows they will.

**Tone:** quiet, a little melancholy, warm inside the town and cold outside it. Not grimdark. Hopeful under the sadness.

### 5.2 Hero
- Name chosen at New Game, up to 8 characters, default **Wren**. The hero's gender is never stated; NPC lines are written to work either way.
- One sprite, four facing directions, two-frame walk.
- Starts level 1, unarmed, with 40 gold and one Herb. (Owner raised this from 20 so the first stop can be Garrik's for a Wooden Club; unarmed at level 1 the hero and a Mireling trade 1 damage a turn, which is a dull first fight.) Receives **Aldric's Shield** from Maren in the opening scene: the first key moment and the first piece of equipment.

### 5.3 Hollowmere (town)
A walled village of roughly 24×20 tiles. Buildings are entered by walking through doors; interiors are small sub-maps. Contents:

| Place | Who | Role |
|---|---|---|
| Elder's house | **Maren** | Opening scene, save point, respawn after death, lore |
| The Low Lantern (inn) | **Hesta**, innkeeper | Rest for gold; loved Aldric |
| Garrik's Forge | **Garrik**, smith | Weapon & armor shop; thinks Aldric was a fool |
| Odo's Goods | **Odo**, merchant | Item shop (Herbs, Torches) |
| Town square well | **Pip**, child | Believes Aldric is a bedtime legend |
| Gate | **Bram**, guard | Warns about the marsh at dusk; points toward the Barrow |
| Behind the inn | **Tobin**, the squire | Drunk; won't meet your eyes; new line after you beat the Warden |
| Wandering | 2–3 villagers | Flavor; each line about the Dimming or Aldric |

Every NPC has **one line by default** and most have **a second line gated on a story flag** (shield received, Warden defeated). Dialog is in §8.

### 5.4 The Marsh (overworld)
Roughly 48×40 tiles, scrolling. Hollowmere sits near the center-west; the Barrow entrance is north-east across the marsh. Terrain: grass, marsh (higher encounter rate), water (impassable), trees (impassable), hills (passable, higher encounter rate), a dirt road from the gate toward the Barrow with a lower encounter rate. One chest with gold in a dead-end copse rewards exploring. Nothing else to find in the slice.

### 5.5 The Sunken Barrow (dungeon)
Two floors, roughly 24×24 each. Dark: the player sees a 1-tile radius by default; a **Torch** (consumable) raises it to 3 tiles for a fixed step count. Floor 1 has two chests (gold; a Torch) and the stairs down. Floor 2 has a chest with a **Bronze Sword** behind narrow corridors, and the Warden's chamber at the end. Stairs trigger on step. No locked doors in the slice; the tile format supports a `locked` door for later but none are placed.

### 5.6 Monsters
**Mireling** — the only random encounter. A pale, slumped, marsh-wet thing, vaguely humanoid, two eyes like wet stones. Three stat tiers share the one sprite with palette swaps: *Mireling* (road/grass), *Bog Mireling* (marsh/hills), *Barrow Mireling* (dungeon). This honors "one monster" as one design while giving the slice a difficulty curve. The builder may collapse to a single tier if three reads as a cheat.

**Barrow Warden** — the boss. Large 32×32 sprite. A long-dead thing wearing the remains of armor that is *not* Aldric's. The player should wonder, and the journal page should not answer. Scripted fight (§9.8).

### 5.7 Slice ending
Defeating the Warden drops **Aldric's Journal, Page 1**. Reading it from the item menu triggers a dialog in Aldric's voice: the Warden was only a guard, and he went deeper. A door behind the Warden's chamber is sealed with a message: *"The way down is shut. For now."* The game continues (the player can return to town; Tobin and Maren have new lines) but that is the end of the slice.

---

## 6. Tile Maps

### 6.1 Data format
Maps are TypeScript modules exporting:
```ts
interface GameMap {
  id: string;
  width: number; height: number;
  tiles: number[];              // row-major tile ids, length = width*height
  music: SongId;
  dark?: boolean;               // dungeon lighting
  encounters?: EncounterTable;  // absent = no random battles (town, interiors)
  npcs: NpcPlacement[];
  triggers: Trigger[];          // warps, chests, stairs, scripted tiles
  entry: Record<string, { x: number; y: number; facing: Dir }>; // named spawn points
}
```
Tile ids index a tile catalog with properties: `walkable`, `encounterRate` (multiplier), `animated` (frame list), `isDoor`, `isStairs`. Visual art is a separate pixel-data table keyed by the same id.

Maps are authored as ASCII strings with a legend (e.g. `#` wall, `.` floor, `~` water) and parsed to `tiles` at module load; this keeps them editable by hand and diffable.

### 6.2 Movement
- Grid-locked, 16px per tile, 8 frames per step (builder may tune 6–10).
- Collision against tile `walkable`, NPC positions, and map edges.
- Holding a direction chains steps. Facing changes immediately even if blocked.
- Walking onto a trigger tile fires it *after* the step completes (stairs, warps, encounter check).

### 6.3 Camera
Centered on the hero. Maps larger than the viewport scroll freely. Interiors smaller than the viewport are drawn centered with black around them.

### 6.4 Rendering layers
1. Tiles (with animated water/torch frames)
2. Darkness mask (dungeons): everything outside the visibility radius is black
3. NPCs and hero sprites (y-sorted; hero drawn last on ties)
4. UI windows

---

## 7. Game State Machine

A **stack** of states. The top state receives input and updates; states below may still render (e.g. Explore under Menu). Each state implements `enter`, `exit`, `update(input)`, `render(ctx)`.

| State | Enters from | Notes |
|---|---|---|
| `Boot` | start | creates canvas, waits for first key to unlock audio |
| `Title` | Boot | New Game / Continue; title theme; shows the title at scale 2 (wrapped to the screen width) with the subtitle at scale 1 beneath |
| `NameEntry` | Title | 8-char grid entry |
| `Explore` | many | the walking state; owns map, hero, NPC wander |
| `Dialog` | Explore, Shop, Inn, Battle | pushed over whatever is talking |
| `Menu` | Explore | Status / Items / Spells / Equip |
| `Shop` | Explore (talk to shopkeeper) | Buy / Sell flow; uses Dialog for speech |
| `Inn` | Explore | Yes/No, fade, restore, morning line |
| `Battle` | Explore (encounter or boss trigger) | replaces Explore rendering with battle screen |
| `Transition` | any | fade/wipe between maps and into battle; pops itself |
| `Dead` | Battle | death message, half gold, warp to Maren, pops to Explore |

Map changes happen inside `Explore` via `Transition`, not as separate states.

**Story flags** live in a single `flags: Set<string>` on the save: `shield_received`, `warden_defeated`, `journal_read`, chest ids opened, etc. NPC dialog and triggers test flags.

---

## 8. Dialog

### 8.1 Presentation
- Classic-style window: black fill, white double-line border, 8×8 bitmap font, white text.
- Dialog window spans the bottom of the screen, 4 lines of up to 28 characters.
- Text prints **one character per frame** (builder may tune to 1 char per 1–2 frames) with a short "blip" on each non-space character. Confirm skips to end of page; confirm again advances. A blinking ▼ marks "more".
- **Cancel ends the dialog immediately** (owner's decision, 2026-11-12). The rest of the script still runs silently: remaining text is skipped, effects (give, set, gold, heal) still apply, and every choice resolves as No. The only sound is the menu-cancel blip.
- No speaker name tags; the speaker is whoever you're facing. Lines are written to the hero in second person: *"You have your father's eyes, Wren."*

### 8.2 Script format
```ts
type Line = string;   // auto-wrapped, {name} substituted
type DialogScript =
  | Line[]
  | { if: FlagExpr; then: DialogScript; else?: DialogScript }
  | { choice: [string, string]; ask?: string; yes: DialogScript; no: DialogScript }
  | { set: string }                    // set a flag mid-conversation
  | { give: ItemId } | { gold: number } | { heal: true }
  | { pay: number; then: DialogScript; else?: DialogScript }   // take gold if the hero has it
  | { rest: SongId }                   // full HP/MP, then the sleep screen with that jingle
  | { save: true; ok: DialogScript; fail: DialogScript }
  | { shop: ShopId };                  // open that shop; the script goes on when it closes
```
Scripts are plain data arrays; a tiny interpreter runs them. A choice with `ask` shows the question and its two answers in one window: the question types out, then Yes and No appear side by side under it (a question is at most three lines). Shops, the inn and saving are opened from inside a villager's script by the `shop`, `pay`, `rest` and `save` steps, so a keeper's greeting and farewell are ordinary lines around the step. While a script is being skipped by cancel, a shop does not open, a rest restores HP and MP without the sleep screen, and every choice answers No.

### 8.3 Voice guidelines for writing NPCs
- One idea per line; no line explains the whole world.
- Each villager's line says something about *them* and *Aldric* or *the Dimming*, not just directions.
- Directions exist (Bram at the gate) but are earned by the character: *"I walked your father to this gate. North-east, past the dead willow. I'll not walk you."*
- The post-Warden lines shift: Tobin finally speaks; Maren is quietly afraid.

Final text is the builder's to write within these guidelines; this document's examples are tone samples, not canon.

---

## 9. Combat

One hero vs one monster, turn-based, menu-driven. Battle screen: monster sprite centered on a black field above a backdrop strip tinted by map (green for grass, murk for marsh, black for Barrow), hero stats window top-left, command window, message window at bottom.

### 9.1 Encounter trigger
Each completed step on a map with an `encounters` table: roll `rand() < baseRate * tile.encounterRate`. Suggested base 1/16 per step; road tiles ×0.5, marsh/hills ×1.5. No encounters within 3 steps of exiting a battle. Monster picked from the zone's weighted table.

### 9.2 Commands
`Fight` · `Spell` · `Item` · `Run`

### 9.3 Derived stats
- `ATK = STR + weapon.atk`
- `DEF = floor(AGI / 2) + armor.def + shield.def`

### 9.4 Turn order
Each round: hero acts first unless `monster.AGI * rand(0,255) > hero.AGI * rand(0,255)`. A boss script may force first strike on round 1.

### 9.5 Damage
- Hero attack: `base = ATK − floor(DEF_m / 2)`. If `base ≤ 0`, damage is 0 or 1 (50/50). Else damage = `randInt(ceil(base/4), floor(base/2))`, min 1.
- Critical ("A crushing blow!"): 1/32 chance, damage = `randInt(ceil(ATK/2), ATK)`, ignores defense. Never against bosses.
- Miss ("You missed!"): the hero's attack misses with a flat 1/16 chance, *plus* the monster's `dodge` field is its chance to evade the hero's attack ("The Mireling dodges!"). Monster attacks miss with a flat 1/16 chance.
- Monster attack uses the same formula with monster ATK vs hero DEF.
- Screen shakes 4 frames and plays the hit SFX when the hero takes damage; the monster sprite flashes when hit.

### 9.6 Run
`hero.AGI * rand(0,255) > monster.AGI * rand(0,255) * monster.runFactor` succeeds. `runFactor` is 1 for Mirelings and infinite for the Warden ("The Warden blocks the way!"). Failed run forfeits the turn.

### 9.7 Monster AI
A weighted action list evaluated each turn, with optional conditions:
```ts
actions: [
  { do: 'attack', weight: 6 },
  { do: 'spell', spell: 'mend', weight: 3, if: 'hpBelowHalf' },
  { do: 'breath', weight: 2 },
]
```

### 9.8 Boss: Barrow Warden
- HP 52, ATK 26, DEF 16, AGI 12 (starting values; tune in play-test).
- Actions: attack (6), **Rot Breath** 7–12 fixed damage ignoring defense (3), **Mend** heals 10–16 when below half HP (2, 4-turn wait).
- Cannot be run from. Victory plays the fanfare, awards ~300 XP and 0 gold, sets `warden_defeated`, drops the journal page into inventory.
- Intended win condition: level 6–7 with the Bronze Sword and Leather Armor, two or three Herbs, Heal spell. Beatable at 5 with luck; not at 4. **The intent governs the numbers**: with the §9.5 formulas and §10 tables, a level 6 hero (ATK 27, DEF 14) has a long fight: about 14 rounds at level 6 in simulation, healing turns included. A unit test simulates the fight at levels 4, 5, 6 and 7 with the intended gear and asserts the win rates are near 0%, under 50%, over 70%, and over 90% respectively; if tuning moves the tables, the test moves with them.

### 9.9 Death
"You have fallen." Fade to black. Respawn in Maren's house facing her at full HP/MP, gold halved (floor), XP and items kept. Maren speaks a death-specific line. No game over screen.

### 9.10 Victory
Message sequence: "The Mireling is defeated." → "You gain N experience and N gold." → level-up fanfare and stat-gain lines if applicable → "You learned Heal!" if applicable. Then return to Explore.

---

## 10. Stats, Leveling, Items, Spells

### 10.1 Hero stat table (levels 1–10; slice targets reaching ~7)
| Lv | XP to reach | STR | AGI | MaxHP | MaxMP | Learns |
|---|---|---|---|---|---|---|
| 1 | 0 | 4 | 5 | 16 | 0 | — |
| 2 | 8 | 5 | 5 | 19 | 4 | Heal |
| 3 | 22 | 7 | 7 | 25 | 6 | — |
| 4 | 50 | 9 | 9 | 29 | 12 | — |
| 5 | 105 | 13 | 11 | 33 | 17 | — |
| 6 | 210 | 17 | 12 | 36 | 23 | Ember |
| 7 | 420 | 19 | 15 | 41 | 27 | — |
| 8 | 780 | 23 | 19 | 45 | 31 | — |
| 9 | 1250 | 28 | 23 | 50 | 35 | Homeward |
| 10 | 1900 | 34 | 28 | 55 | 40 | — |

Gains are the delta between rows. Numbers are original to this game; tune in play-test.

### 10.2 Spells
| Spell | MP | Effect | In slice? |
|---|---|---|---|
| Heal | 4 | Restore 10–17 HP. Usable in and out of battle. | Yes |
| Ember | 2 | 5–12 damage ignoring defense. Battle only. | Yes |
| Homeward | 8 | Warp to Hollowmere. Field only. | Learned at 9; defined now, reachable later |

### 10.3 Equipment
| Item | Slot | Stat | Price | Where |
|---|---|---|---|---|
| Aldric's Shield | shield | DEF +4 | — | Maren, opening |
| Wooden Club | weapon | ATK +2 | 30 | Garrik |
| Iron Knife | weapon | ATK +4 | 60 | Garrik |
| Bronze Sword | weapon | ATK +10 | 180 | Garrik, and Barrow F2 chest |
| Cloth Tunic | armor | DEF +2 | 20 | Garrik |
| Leather Armor | armor | DEF +4 | 70 | Garrik |
| Plank Shield | shield | DEF +2 | 25 | Garrik (worse than Aldric's; exists so the shop stocks a shield) |

Garrik stocks the Bronze Sword so a grinding player can buy it, *and* the chest holds one so a bold player gets it free. Selling returns half price.

### 10.4 Consumables
| Item | Effect | Price |
|---|---|---|
| Herb | Restore 20–30 HP | 10 |
| Torch | Dungeon visibility radius 3 for 200 steps | 8 |

Inventory: 8 slots; consumables stack up to 6 per slot; unequipped equipment occupies a slot. "You cannot carry more." refusals. Aldric's Journal is a key item in its own slot-free list.

### 10.5 Monster stats
| Monster | HP | ATK | DEF | AGI | XP | Gold | Dodge | Zone |
|---|---|---|---|---|---|---|---|---|
| Mireling | 4 | 5 | 1 | 3 | 2 | 2–4 | 1/32 | road, grass |
| Bog Mireling | 14 | 11 | 6 | 6 | 7 | 6–10 | 1/16 | marsh, hills |
| Barrow Mireling | 22 | 16 | 12 | 10 | 18 | 12–18 | 1/16 | Barrow |
| Barrow Warden | 52 | 26 | 16 | 12 | 300 | 0 | 1/32 | boss |

Tuned 2026-11-12 after the Phase 3 play-test; pinned by `test/balance.test.ts`. Level table replaced 2026-11-12 with an original curve.

---

## 11. Shops, Inn, Save/Load

### 11.1 Shops
Talking to Garrik or Odo runs his script: greeting lines, then `Shop` (Buy / Sell / Leave, with the hero's gold shown under the menu), then farewell lines when the shop closes. Buy lists items with prices; selecting shows "The Iron Knife? That will be 60 gold." Yes/No. On buying equipment: "Will you equip it now?" Yes/No; old gear goes to the pack. Refusals: "You do not have enough gold.", "You cannot carry more.", and "You already carry one." for equipment the hero has in the pack or is wearing. With a full pack, equipment can still be bought if it is worn at once: the piece it replaces is traded in for its sale price, and the purchase is refused if that piece cannot be sold. Sell lists the pack at half price, rounded down; either shop buys anything except Aldric's Shield and key items ("I cannot buy that."); worn gear is not listed. The shop's own wording is the same for both keepers; each keeper's greeting and farewell are his own.

### 11.2 Inn
Hesta speaks two lines, then asks: "A bed is 6 gold, if you need one. Stay?" (after the Warden: "A bed is still 6 gold, and I will not hear otherwise. Stay?"). Yes with 6 gold → fade out, the three-second sleep jingle, fade in, full HP/MP, the town theme from its start, then "Morning. You slept like a stone. He never could." (after the Warden: "Morning. Eat before you go. I mean it."). Yes without 6 gold → "That is not 6 gold. Come back when you have it." No → a farewell line. Keys do nothing while the hero sleeps. Fixed price in the slice.

### 11.3 Save/Load
- Saving happens **only by talking to Maren**: "Shall I remember your journey?" Yes → write save, "It is written." The trip home is part of the game's rhythm.
- Save = JSON in `localStorage` under a versioned key, containing: `version`, hero name, level, XP, HP, MP, gold, equipment, inventory, flags, map id, position, facing, torch steps remaining (written as 0 until Phase 6). The mute preference keeps its own storage entry, because it must apply before Continue is chosen. Strength, agility and the HP and MP maximums are not stored; they are rebuilt from the level, and stored HP and MP are held to those maximums on load. A save that cannot be read (damaged, another version, an unknown item or map) is ignored, not deleted: Continue is not offered. Maren asks straight after her first line; a successful save plays its own sound with "It is written."; if the browser refuses to store the save she says "The page will not take the ink. Nothing was written." Nothing saves automatically, so reloading the page returns to the last save.
- **Title → Continue** loads it. One slot in the slice.
- **Password system: deferred past the slice** (owner's decision). A later phase adds a classic text password as a portable save: the save struct bit-packed with a checksum, a 32-character unambiguous alphabet, under 40 characters, offered by Maren after saving and entered from the title screen. The save struct should be designed so every field has a small fixed range (e.g. gold capped at 65535, flags as an indexed list) so that bit-packing later is a codec change, not a schema change.

---

## 12. Audio

### 12.1 Synth
A software approximation of the NES APU on the Web Audio API:
- **Pulse 1, Pulse 2:** square waves with selectable duty (12.5 / 25 / 50%), volume envelope, optional vibrato and pitch slide.
- **Triangle:** fixed-volume triangle, used for bass.
- **Noise:** noise with short/long mode and envelope, for drums and hits.
Built from `OscillatorNode`/`PeriodicWave` or an `AudioWorklet`; builder's call, worklet preferred if timing jitter is audible.

### 12.2 Song format
```ts
interface Song {
  id: SongId; tempo: number; loopFrom?: number;   // row index for loop point
  tracks: { channel: 'p1'|'p2'|'tri'|'noise'; duty?: Duty; rows: (Note|null)[] }[];
}
```
Rows are a fixed subdivision (16th notes). A sequencer schedules notes ahead of the audio clock. Songs hard-cut on change, classic style, except a short fade into battle after the encounter sting.

### 12.3 Song list (all original compositions)
| Id | Where | Character |
|---|---|---|
| `title` | Title screen | Slow, stately, the "draws you in" piece; minor key resolving upward |
| `hollowmere` | Town & interiors | Warm, lilting 3/4, safe |
| `marsh` | Overworld | Walking pace, wide intervals, a little lonely |
| `barrow` | Dungeon | Sparse, low triangle drone, irregular noise ticks |
| `battle` | Random encounters | Fast, driving, tense; the "edge of your seat" piece |
| `warden` | Boss | Battle theme's motif, slower and heavier |
| `victory` | After a win | 2-second fanfare, non-looping |
| `levelup` | Level gain | 1-second jingle |
| `inn` | Sleeping | Soft 3-second lullaby |
| `fallen` | Death | Short descending phrase |

### 12.4 Sound effects
Menu move, menu confirm, menu cancel, text blip, door open, stairs, chest open, bump (blocked), encounter sting (precedes battle wipe), hero hit, monster hit, miss, critical, spell cast, heal, run success, run fail, buy, save, error/refusal.

### 12.5 Mixing
Master gain with mute. Music about 6 dB under SFX. SFX play on separate voices so they never steal music channels.

---

## 13. Art

- All art is pixel data in code: a palette table plus per-sprite string grids (one character per pixel mapped to a palette index, `.` for transparent). Compiled to `ImageData` at boot and cached as offscreen canvases.
- **Font:** 8×8, uppercase, lowercase, digits, punctuation, and ▼ ▶ ♥ glyphs.
- **Tiles (16×16):** grass, road, marsh, water (2-frame), tree, hill, town wall, town floor, wood floor, counter, bed, door, stairs down/up, chest closed/open, barrow wall, barrow floor, well, sign, table, torch sconce (2-frame).
- **Sprites:** hero (4 directions × 2 frames), 6 villager types (4 directions × 2 frames; NPCs turn to face the hero when spoken to), Maren, Mireling (one sprite, three palettes), Barrow Warden (32×32).
- **Battle backdrops:** a horizon strip per map type.
- Style: chunky, high-contrast, 3–4 colors per sprite, black outlines. Nothing traced or sampled from any existing game.

---

## 14. Phases and Play-Test Checklists

Each phase ends with a `npm run dev` build the owner can play. Deployment happens at phase 6, or earlier if trivial.

**Cadence (owner's decision):** phases are gated. The builder stops after each phase, the owner play-tests, and the next phase starts only after feedback. Tuning tasks from that feedback are folded into the start of the following phase. Phase 1's play-test is also the sign-off on art style and synth sound before more content is authored in that style.

### Phase 1 — Walking skeleton
Build: Vite + TS project, canvas with integer scaling, game loop, input, palette, font, tile catalog, Hollowmere exterior map, hero sprite and grid movement with collision, audio synth, `hollowmere` song playing after first keypress, mute key.
**Play-test:** walk around town, bump walls, hear the town theme loop cleanly, resize the window and see it stay crisp.

### Phase 2 — A town that talks
Build: state stack, Dialog state and script interpreter, text blip, NPCs with placement and idle wander, interiors with door warps, Maren's opening scene granting the shield, Menu state with Status/Items/Equip, flag system, title screen with New Game and name entry, `title` song, dev-only debug overlay (§4.6).
**Play-test:** start a new game, name the hero, receive the shield, talk to every villager, open the menu, equip the shield, enter and exit every building, open the debug overlay and set your level, confirm `npm run build` output contains no debug code.

### Phase 3 — Out the gate
Build: Marsh map, map transitions with fade, encounter tables, Battle state with Fight and Run only, Mireling (all tiers), `marsh`, `battle`, `victory` and `fallen` songs, encounter sting, hit/miss SFX, screen shake, death and respawn at Maren's.
**Play-test:** leave town, get into fights, win some, run from some, die once and wake up at Maren's with half your gold.

### Phase 4 — Growing stronger
Build: XP and level table, stat gains, Heal and Ember, Spell and Item commands in battle, Herb, field use of Heal and Herb from the menu, victory and level-up jingles, monster AI script engine.
**Play-test:** grind from 1 to 5, learn Heal and Ember, use both, use an Herb mid-fight.

### Phase 5 — Commerce and rest
Build: Shop state (Garrik, Odo), Inn state with the `inn` jingle, full equipment table affecting ATK/DEF, sell flow, save via Maren, Continue on title, save round-trip tests.
**Play-test:** buy and equip a weapon, feel the damage difference, sleep at the inn, save, reload the page, Continue and find yourself where you saved.

### Phase 6 — The Barrow
Build: Barrow floors 1 and 2, darkness mask and Torch, chests, stairs, Warden trigger and fight with its script, `barrow` and `warden` songs, journal page item and reading dialog, post-Warden NPC lines, sealed door, GitHub Pages deploy.
**Play-test:** full run from New Game to journal page on a shared URL. Owner notes which fights felt too easy or too hard for tuning.

---

## 15. Testing

- Unit tests (Vitest) for: damage formula edge cases, level-up thresholds and stat gains, run-chance bounds, inventory limits, save→load round-trip, dialog script interpreter branching, map ASCII parser.
- An early-game pacing test: a level 1 hero with the Wooden Club and Aldric's Shield beats a road Mireling in 4 rounds or fewer on average and loses under 20% of max HP doing it.
- A balance simulation test for the Warden fight (§9.8) that plays a simple scripted hero strategy many times per level and asserts the intended win-rate bands. It exists so a tuning change that breaks the win condition fails loudly.
- Everything visual and audible is verified by play-test, not automated.

---

## 16. Left to the Builder

- Exact palette values, sprite pixels, map layouts (within the sizes and contents above), and all final dialog text within §8.3's guidelines.
- All melodies, harmonies, and SFX parameters within §12's character notes.
- Synth implementation choice (oscillators vs. AudioWorklet).
- Walk speed, text speed, key-repeat timing, encounter base rate within the suggested ranges.
- Module boundaries and file names within the suggested layout.
- Deployment specifics (GitHub Actions to Pages vs. Netlify drop).

## 17. Decisions Made by the Designer (not stated by the owner)

Flagged so the owner can veto any while reading:

1. ~~Game title *The Dimming*~~ Superseded by the owner on 2026-11-12: the title is *Heir of the Barrow* and *The Dimming* is the subtitle (Act 1). Repo stays Warrior's Quest.
2. No framework; plain canvas and Web Audio.
3. Music synthesized in-browser from note data rather than audio files.
4. Art as pixel strings in code rather than image files.
5. Mireling has three stat tiers sharing one sprite (one monster design, three palettes).
6. Save only via Maren; death returns you to Maren with half gold and no game over.
7. ~~Password system included alongside localStorage saves.~~ Owner moved the password system to a later phase; the slice saves to localStorage only.
8. Hero starts with Aldric's Shield from the opening scene rather than buying first gear.
9. Interactions are one-button and walk-into (owner chose "no friction"; the specifics are mine).
10. Slice ends on a sealed door and a journal page, not a credits screen.
