# Phase 1: Walking Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Vite + TypeScript canvas app where the hero walks around Hollowmere's exterior with collision, at crisp integer scale, with the original town theme playing on an NES-style synth after the first keypress.

**Architecture:** Pure, unit-tested modules (loop math, input edges, pixel compiler, map parser, hero movement, camera, note math, sequencer) sit under thin browser shells (canvas screen, Web Audio APU, DOM listeners). A minimal state stack hosts `Boot` (press any key, unlocks audio) and `Explore` (map + hero). All art and music are TypeScript data compiled at boot.

**Tech Stack:** TypeScript 5, Vite 6, Vitest 3 (node environment), Canvas 2D, Web Audio API. No runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-11-11-the-dimming-vertical-slice-design.md` (sections 4, 5.3, 6, 12, 13, 14 Phase 1)

## Global Constraints

- No runtime dependencies. Dev deps only: `vite`, `typescript`, `vitest`.
- Logical resolution 256×240; tile size 16; viewport 16×15 tiles; hero drawn at viewport tile column 7, row 7.
- Integer scaling only, `image-rendering: pixelated`, `imageSmoothingEnabled = false`, black letterbox.
- Fixed timestep 60 Hz; a global frame counter drives all animation.
- Keys: move = Arrow keys + WASD; confirm = Z, Enter, Space; cancel = X, Escape; mute = M.
- All names, art, and music original. Nothing traced or sampled from any existing game.
- No placeholder audio: the `hollowmere` song is part of this phase's deliverable.
- Every commit message ends with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- **Owner checks:** the manual checks in Tasks 6, 9 and 12 are the owner's. Implementers do not perform or report them as passed; they confirm the build runs without console errors and list the owner checks verbatim in their report. The orchestrator collects them for the owner at the Phase 1 stop.
- **Art skill:** Tasks 5, 7 and 8 (font, tiles, hero) are done with the `pixel-art-sprites` skill in `.claude/skills/pixel-art-sprites/SKILL.md` loaded. Where the skill and this plan disagree, the plan wins.
- **Audio unlock:** the `AudioContext` is created and resumed synchronously inside the first `keydown`/`pointerdown` event handler (Safari requires a user-gesture call stack), never from the game loop.
- Phase ends when the automated suite passes and the owner checks are listed; stop for owner feedback before Phase 2.

## Review Focus

1. **Window loses focus while an arrow key is held**: the hero must stop, not walk forever. Pinned by Task 3 (`blur` clears held keys).
2. **Tab hidden for a minute, then shown**: the loop must not run hundreds of catch-up updates. Pinned by Task 2 (step cap drops excess time).
3. **Browser window smaller than 256×240**: the game must still render at scale 1, not vanish at scale 0. Pinned by Task 6 (`computeScale` floor of 1).
4. **Text containing a character the font lacks** (later: hero names): draw `?`, never throw or draw nothing. Pinned by Task 5 (`glyphIndex` fallback).
5. **Hero at the map edge, viewport showing beyond the map**: tile lookups outside the map are not walkable and render black, no exceptions. Pinned by Task 7 (`isWalkable` out of bounds) and Task 9 (renderer clears to black and skips out-of-range tiles).

---

## File Structure

```
CLAUDE.md                        project rules for agents (Task 0)
package.json, tsconfig.json, vite.config.ts, index.html, .gitignore
src/main.ts                      bootstrap: Screen, Input, AudioManager, StateStack, loop
src/engine/constants.ts          LOGICAL_W/H, TILE, VIEW_COLS/ROWS, Dir, Action types
src/engine/loop.ts               advance() accumulator math + startLoop()
src/engine/input.ts              Input: key map, held/pressed edges, attach/blur
src/engine/pixels.ts             PixelArt type, compilePixelArt() → RGBA (pure)
src/engine/canvasImage.ts        rgbaToCanvas() (browser only)
src/engine/font.ts               glyphIndex(), Font.drawText(), buildFontSheet()
src/engine/screen.ts             Screen: offscreen 256×240, integer scale, present()
src/engine/state.ts              State interface, StateStack
src/engine/audio/notes.ts        noteToMidi(), midiToFreq() (pure)
src/engine/audio/apu.ts          ApuLike interface, Apu (Web Audio)
src/engine/audio/sequencer.ts    Song/Track types, Sequencer (pure, drives ApuLike)
src/engine/audio/audio.ts        AudioManager: unlock, playSong, mute, persistence
src/data/palette.ts              PALETTE
src/data/fontGlyphs.ts           FONT_GLYPHS 8×8 bitmaps
src/data/tiles.ts                TILE_IDS, TILES catalog with art
src/data/sprites/hero.ts         HERO_SPRITES (4 dirs × 2 frames)
src/data/maps/hollowmere.ts      HOLLOWMERE map (ASCII)
src/data/songs/hollowmere.ts     HOLLOWMERE_SONG
src/game/map.ts                  GameMap type, parseAsciiMap(), tileAt(), isWalkable()
src/game/hero.ts                 HeroState, createHero(), updateHero(), heroPixelOffset()
src/game/camera.ts               cameraOrigin()
src/game/boot.ts                 BootState ("PRESS ANY KEY")
src/game/explore.ts              ExploreState (tiles, hero, animation)
test/*.test.ts                   one test file per pure module
```

---

### Task 0: CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write `CLAUDE.md`** under 40 lines containing only: a one-line project description; the design doc and current plan paths as the source of truth; no runtime dependencies; the originality rule (nothing from Dragon Warrior or any published game); gated phases, stop after each for the owner's play-test; tests pass before a task is done; one commit per task with the attribution line. No design details.

- [ ] **Step 2: Commit**
```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md project rules"
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.ts`, `src/engine/constants.ts`, `test/constants.test.ts`

**Interfaces:**
- Produces: `src/engine/constants.ts` exporting `LOGICAL_W = 256`, `LOGICAL_H = 240`, `TILE = 16`, `VIEW_COLS = 16`, `VIEW_ROWS = 15`, `CENTER_COL = 7`, `CENTER_ROW = 7`, `type Dir = 'up'|'down'|'left'|'right'`, `type Action = Dir | 'confirm'|'cancel'|'mute'`, `DIR_VECTORS: Record<Dir, {dx: number; dy: number}>`.

- [ ] **Step 1: Create `package.json`** with name `the-dimming`, `"type": "module"`, `private: true`, scripts `dev: vite`, `build: tsc --noEmit && vite build`, `preview: vite preview`, `test: vitest run`, `test:watch: vitest`. Dev deps: `vite ^6.0.0`, `typescript ^5.6.0`, `vitest ^3.0.0`. No `dependencies` field.

- [ ] **Step 2: Create `tsconfig.json`**: `target ES2022`, `module ESNext`, `moduleResolution bundler`, `strict true`, `noUncheckedIndexedAccess true`, `lib ["ES2022","DOM"]`, `types ["vite/client"]`, `include ["src","test"]`.

- [ ] **Step 3: Create `vite.config.ts`** with `base: './'` (relative paths so GitHub Pages works under any repo name) and a `test` block `{ environment: 'node' }`. Create `index.html` with a `<div id="game">`, body margin 0, background `#000`, `#game` as a flex container filling the viewport and centering its child, and `<script type="module" src="/src/main.ts">`.

- [ ] **Step 4: Create `.gitignore`** with `node_modules`, `dist`, `.vite`.

- [ ] **Step 5: Write `test/constants.test.ts`** asserting `VIEW_COLS * TILE === LOGICAL_W`, `VIEW_ROWS * TILE === LOGICAL_H`, and `DIR_VECTORS.up` equals `{dx: 0, dy: -1}`.

- [ ] **Step 6: Create `src/engine/constants.ts`** per the Interfaces block, and `src/main.ts` containing only `console.log('The Dimming')` for now.

- [ ] **Step 7: Install and verify**
Run: `npm install && npm test && npm run build`
Expected: 1 test file passes; `dist/index.html` exists.

- [ ] **Step 8: Commit**
```bash
git add -A
git commit -m "chore: scaffold Vite + TypeScript + Vitest project"
```

---

### Task 2: Fixed-timestep loop

**Files:**
- Create: `src/engine/loop.ts`, `test/loop.test.ts`

**Interfaces:**
- Produces: `STEP_MS = 1000 / 60`, `MAX_STEPS_PER_FRAME = 5`, `advance(accumulatorMs: number, elapsedMs: number): { steps: number; remainderMs: number }`, `startLoop(update: () => void, render: () => void): () => void` (returns a stop function).

- [ ] **Step 1: Write failing tests** in `test/loop.test.ts`:
  - `advance(0, STEP_MS)` → `{ steps: 1, remainderMs: 0 }` (use `toBeCloseTo` for remainder).
  - `advance(0, STEP_MS * 2.5)` → steps 2, remainder ≈ `STEP_MS * 0.5`.
  - `advance(STEP_MS * 0.5, STEP_MS * 0.5)` → steps 1.
  - `advance(0, 60000)` → steps `MAX_STEPS_PER_FRAME`, remainder 0 (excess time is dropped, not carried).

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/loop.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `advance` and `startLoop`** in `src/engine/loop.ts`. `startLoop` uses `requestAnimationFrame`, tracks `lastTime`, calls `advance`, runs `update()` `steps` times, then `render()` once per frame.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run test/loop.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**
```bash
git add src/engine/loop.ts test/loop.test.ts
git commit -m "feat: fixed-timestep game loop with capped catch-up"
```

---

### Task 3: Input

**Files:**
- Create: `src/engine/input.ts`, `test/input.test.ts`

**Interfaces:**
- Consumes: `Action` from constants.
- Produces: `KEY_MAP: Record<string, Action>` keyed by `KeyboardEvent.code`; `class Input` with `keyDown(code: string): void`, `keyUp(code: string): void`, `clear(): void`, `update(): void` (call once per tick; computes edges), `held(a: Action): boolean`, `pressed(a: Action): boolean`, `anyPressed(): boolean` (true on the tick any mapped *or unmapped* key went down), `attach(target: Window): () => void` (adds keydown/keyup/blur listeners, `preventDefault` on mapped keys, `blur` → `clear()`; returns detach).

- [ ] **Step 1: Write failing tests** in `test/input.test.ts`:
  - `keyDown('KeyW'); update()` → `held('up')` true and `pressed('up')` true; a second `update()` → `pressed('up')` false, `held('up')` still true.
  - `keyDown('ArrowLeft'); update(); keyUp('ArrowLeft'); update()` → `held('left')` false.
  - `keyDown('KeyZ'); update()` → `pressed('confirm')`; same for `Enter` and `Space`. `KeyX` and `Escape` → `cancel`. `KeyM` → `mute`.
  - `keyDown('KeyQ'); update()` → `anyPressed()` true, no action held.
  - `keyDown('KeyW'); update(); clear(); update()` → `held('up')` false.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/input.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `Input`** in `src/engine/input.ts`. Keep two sets (`down`, `prevDown`) of actions plus an `anyDownThisTick` flag consumed by `update()`.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run test/input.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/engine/input.ts test/input.test.ts
git commit -m "feat: keyboard input with held/pressed edges and blur reset"
```

---

### Task 4: Palette and pixel-art compiler

**Files:**
- Create: `src/data/palette.ts`, `src/engine/pixels.ts`, `src/engine/canvasImage.ts`, `test/pixels.test.ts`

**Interfaces:**
- Produces: `PALETTE: readonly string[]` (hex `#RRGGBB`, index 0 is `#000000`, index 1 is `#FCFCFC`); `interface PixelArt { w: number; h: number; colors: Record<string, number>; rows: string[] }` where each row is `w` characters, `.` is transparent and any other character must appear in `colors` (palette index); `interface Rgba { w: number; h: number; data: Uint8ClampedArray }`; `compilePixelArt(art: PixelArt, palette: readonly string[]): Rgba`; `hexToRgb(hex: string): [number, number, number]`; `rgbaToCanvas(img: Rgba): HTMLCanvasElement` (browser only, builds `ImageData` and `putImageData`).

- [ ] **Step 1: Create `src/data/palette.ts`** with exactly this table (NES-flavored, original):
```ts
export const PALETTE: readonly string[] = [
  '#000000', '#FCFCFC', '#7C7C7C', '#BCBCBC', // 0-3 black, white, gray, light gray
  '#0000FC', '#3CBCFC', '#00A800', '#58D854', // 4-7 blue, sky, green, light green
  '#B8F818', '#503000', '#AC7C00', '#FCE0A8', // 8-11 lime, brown, ochre, sand
  '#A80020', '#F83800', '#F87858', '#FCA044', // 12-15 dark red, red, salmon, orange
  '#F8D878', '#6844FC', '#B8B8F8', '#004058', // 16-19 yellow, violet, lavender, deep teal
  '#008888', '#005800', '#D8F878', '#940084', // 20-23 teal, dark green, pale lime, purple
];
```

- [ ] **Step 2: Write failing tests** in `test/pixels.test.ts`:
  - `hexToRgb('#FCE0A8')` → `[252, 224, 168]`.
  - Compiling a 2×2 art `{ colors: { k: 0, w: 1 }, rows: ['k.', '.w'] }` yields `data.length === 16`, pixel (0,0) = `[0,0,0,255]`, pixel (1,0) alpha 0, pixel (1,1) = `[252,252,252,255]`.
  - A row of the wrong length throws an error whose message contains the row index.
  - An unknown character throws an error whose message contains that character.

- [ ] **Step 3: Run tests to verify they fail**
Run: `npx vitest run test/pixels.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement `src/engine/pixels.ts` and `src/engine/canvasImage.ts`** per Interfaces.

- [ ] **Step 5: Run tests to verify they pass**
Run: `npx vitest run test/pixels.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add src/data/palette.ts src/engine/pixels.ts src/engine/canvasImage.ts test/pixels.test.ts
git commit -m "feat: palette and pixel-art compiler"
```

---

### Task 5: Bitmap font

**Files:**
- Create: `src/data/fontGlyphs.ts`, `src/engine/font.ts`, `test/font.test.ts`

**Interfaces:**
- Consumes: `PixelArt`, `compilePixelArt`, `rgbaToCanvas`, `PALETTE`.
- Produces: `GLYPH_W = 8`, `GLYPH_H = 8`; `FONT_CHARS: string` = every ASCII character from space (32) through tilde (126) in order, followed by `▼▶♥`; `FONT_GLYPHS: Record<string, string[]>` mapping each char in `FONT_CHARS` to 8 rows of 8 chars using `X` for lit and `.` for off; `glyphIndex(ch: string): number` (index in `FONT_CHARS`, or the index of `?` for anything else); `buildFontSheet(palette: readonly string[]): HTMLCanvasElement` (one row of glyphs, white on transparent); `class Font { constructor(sheet: HTMLCanvasElement); drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void; measure(text: string): number }` (width = `text.length * GLYPH_W`).

- [ ] **Step 1: Write failing tests** in `test/font.test.ts`:
  - `FONT_CHARS.length === 95 + 3` and `FONT_CHARS[0] === ' '` and `FONT_CHARS.endsWith('▼▶♥')`.
  - Every char in `FONT_CHARS` has an entry in `FONT_GLYPHS` with exactly 8 rows, each exactly 8 chars of only `X` and `.`.
  - `glyphIndex('A') === FONT_CHARS.indexOf('A')`; `glyphIndex('é') === FONT_CHARS.indexOf('?')`; `glyphIndex('▼') === 95`.
  - The glyph for space is all `.`; the glyph for `I` has at least one `X`.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/font.test.ts`
Expected: FAIL.

- [ ] **Step 3: Draw the glyphs in `src/data/fontGlyphs.ts`.** Original design: uppercase 7 pixels tall with a 1-pixel baseline gap, lowercase with descenders in row 8, digits matching uppercase height, chunky strokes (2 px vertical stems are fine), no serifs. Do not copy any existing game font.

- [ ] **Step 4: Implement `src/engine/font.ts`** per Interfaces. `buildFontSheet` composes one `PixelArt` of width `FONT_CHARS.length * 8` with `colors: { X: 1 }` and compiles it once. `drawText` uses `drawImage` with a source rect per glyph.

- [ ] **Step 5: Run tests to verify they pass**
Run: `npx vitest run test/font.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add src/data/fontGlyphs.ts src/engine/font.ts test/font.test.ts
git commit -m "feat: original 8x8 bitmap font"
```

---

### Task 6: Screen, state stack, and "PRESS ANY KEY"

**Files:**
- Create: `src/engine/screen.ts`, `src/engine/state.ts`, `src/game/boot.ts`, `test/screen.test.ts`, `test/state.test.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: constants, `Input`, `Font`, `buildFontSheet`, `startLoop`.
- Produces:
  - `computeScale(availW: number, availH: number): number` = `max(1, floor(min(availW / LOGICAL_W, availH / LOGICAL_H)))`; `class Screen { readonly ctx: CanvasRenderingContext2D; constructor(container: HTMLElement); resize(): void; present(): void }` where `ctx` is the offscreen logical canvas (image smoothing off) and `present()` blits it to the visible canvas sized `LOGICAL_W * scale` × `LOGICAL_H * scale` with smoothing off and CSS `image-rendering: pixelated`.
  - `interface State { enter?(): void; exit?(): void; update(input: Input): void; render(ctx: CanvasRenderingContext2D): void }`; `class StateStack { push(s: State): void; pop(): void; replace(s: State): void; update(input: Input): void; render(ctx): void; get top(): State | undefined }` where `update` goes only to the top and `render` runs bottom to top. `push`/`replace` call `enter`, `pop`/`replace` call `exit`.
  - `class BootState implements State { constructor(deps: { font: Font; onStart: () => void }) }` renders black with `PRESS ANY KEY` centered horizontally at y = 120, blinking (visible 30 frames, hidden 30 frames, using its own frame counter). On `input.anyPressed()` calls `onStart()` once.
  - `src/main.ts` builds `Screen`, `Input` (attached to `window`), `Font`, `StateStack` with a `BootState` whose `onStart` currently does nothing, and starts the loop with `update = () => { input.update(); stack.update(input) }` and `render = () => { stack.render(screen.ctx); screen.present() }`. Listens to `resize` → `screen.resize()`.

- [ ] **Step 1: Write failing tests**: `test/screen.test.ts` — `computeScale(1920, 1080) === 4`, `computeScale(512, 480) === 2`, `computeScale(300, 200) === 1`, `computeScale(100, 100) === 1`. `test/state.test.ts` — with two fake states recording calls: `push(a); push(b); update(input)` calls only `b.update`; `render` calls `a.render` then `b.render`; `replace(c)` calls `b.exit` then `c.enter` and `top === c`; `pop` on empty does not throw.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/screen.test.ts test/state.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `screen.ts`, `state.ts`, `boot.ts`, and wire `main.ts`** per Interfaces.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run`
Expected: PASS, all files.

- [ ] **Step 5: Build check, then list owner checks**
Run: `npm run build`. Expected: succeeds. Then list these for the owner (do not perform or report as passed): black page with crisp blinking `PRESS ANY KEY`; resizing the window changes scale in integer jumps with no blur; no console errors.

- [ ] **Step 6: Commit**
```bash
git add src/engine/screen.ts src/engine/state.ts src/game/boot.ts src/main.ts test/screen.test.ts test/state.test.ts
git commit -m "feat: integer-scaled screen, state stack, boot screen"
```

---

### Task 7: Tile catalog, map parser, Hollowmere map

**Files:**
- Create: `src/data/tiles.ts`, `src/game/map.ts`, `src/data/maps/hollowmere.ts`, `test/map.test.ts`, `test/tiles.test.ts`

**Interfaces:**
- Consumes: `PixelArt`, `Dir`, `TILE`.
- Produces:
  - `TILE_IDS = { grass: 0, road: 1, water: 2, tree: 3, wall: 4, floor: 5, door: 6, well: 7, sign: 8, roof: 9 } as const`; `interface TileDef { id: number; name: string; walkable: boolean; encounterRate: number; frames: PixelArt[] }` (1 frame, or 2 for `water`); `TILES: readonly TileDef[]` indexed by id; `ANIM_FRAME_LEN = 32` (ticks per animation frame). Walkable: grass, road, floor, door. Not walkable: water, tree, wall, well, sign, roof. `encounterRate`: grass 1, road 0.5, others 0.
  - `type SongId = 'hollowmere'`; `interface GameMap { id: string; width: number; height: number; tiles: number[]; music: SongId; dark?: boolean; entry: Record<string, { x: number; y: number; facing: Dir }> }`; `parseAsciiMap(rows: string[], legend: Record<string, number>): { width: number; height: number; tiles: number[] }` (throws on ragged rows or unknown chars, message includes row/column); `tileAt(map: GameMap, x: number, y: number): TileDef | undefined` (undefined outside bounds); `isWalkable(map: GameMap, x: number, y: number): boolean` (false outside bounds).
  - `HOLLOWMERE: GameMap` with `id: 'hollowmere'`, 24×20, `music: 'hollowmere'`, `entry.start` on a walkable tile in the town square facing `down`. Legend: `g` grass, `.` road, `~` water, `t` tree, `#` wall, `_` floor, `D` door, `W` well, `s` sign, `^` roof.

- [ ] **Step 1: Write failing tests**:
  - `test/tiles.test.ts`: `TILES.length === 10`; `TILES[i].id === i` for all; every frame is 16×16 with rows all of length 16; `TILES[TILE_IDS.water].frames.length === 2`; grass walkable, wall not.
  - `test/map.test.ts`: `parseAsciiMap(['ab', 'ba'], { a: 0, b: 1 })` → `{ width: 2, height: 2, tiles: [0,1,1,0] }`; ragged rows throw; unknown char throws; `isWalkable(HOLLOWMERE, -1, 0) === false`; `isWalkable(HOLLOWMERE, 24, 0) === false`; `tileAt(HOLLOWMERE, 0, 20) === undefined`; `isWalkable(HOLLOWMERE, HOLLOWMERE.entry.start.x, HOLLOWMERE.entry.start.y) === true`; `HOLLOWMERE.width === 24 && HOLLOWMERE.height === 20`; the map contains at least 4 door tiles and exactly 1 well.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/tiles.test.ts test/map.test.ts`
Expected: FAIL.

- [ ] **Step 3: Draw the ten tiles in `src/data/tiles.ts`** (original art, 3–4 palette colors each, chunky and high-contrast): grass with a few lighter flecks, road as packed earth, water two frames with shifted highlights, tree with dark canopy and trunk, stone town wall, cobbled floor, wooden door with a dark frame, stone well, wooden signpost, clay-tile roof.

- [ ] **Step 4: Implement `src/game/map.ts`** per Interfaces.

- [ ] **Step 5: Lay out Hollowmere in `src/data/maps/hollowmere.ts`.** Requirements: walled on all sides with a 2-tile gap in the south wall (the gate); four buildings drawn as roof rows over a wall row with a door in the bottom wall row (Elder's house north, inn east, forge west, shop south-west); the well in a central square of road; trees in corners; a sign beside the gate; a small pond. Everything inside the wall reachable on foot from `entry.start`. The exact layout is the implementer's, within these constraints.

- [ ] **Step 6: Run tests to verify they pass**
Run: `npx vitest run test/tiles.test.ts test/map.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**
```bash
git add src/data/tiles.ts src/game/map.ts src/data/maps/hollowmere.ts test/tiles.test.ts test/map.test.ts
git commit -m "feat: tile catalog, ASCII map parser, Hollowmere exterior"
```

---

### Task 8: Hero sprite and grid movement

**Files:**
- Create: `src/data/sprites/hero.ts`, `src/game/hero.ts`, `test/hero.test.ts`

**Interfaces:**
- Consumes: `Dir`, `DIR_VECTORS`, `TILE`, `GameMap`, `isWalkable`, `PixelArt`.
- Produces:
  - `HERO_SPRITES: Record<Dir, [PixelArt, PixelArt]>` — 16×16, two walk frames per direction, original design (a young traveler in a short cloak; no helmet, no sword yet).
  - `STEP_FRAMES = 8`; `interface HeroState { x: number; y: number; facing: Dir; stepFrame: number; walkFrame: 0 | 1 }` where `x, y` are the tile the hero is on or moving *into*, `stepFrame` counts down from `STEP_FRAMES` to 0 during a step (0 = idle); `createHero(x: number, y: number, facing: Dir): HeroState`; `updateHero(h: HeroState, held: (a: Dir) => boolean, map: GameMap): HeroState` (pure, returns a new state); `heroPixelOffset(h: HeroState): { dx: number; dy: number }` = negative of the facing vector times `stepFrame / STEP_FRAMES * TILE`, so the sprite slides from the previous tile into `x, y`.
  - Rules: if `stepFrame > 0`, decrement it; if it is still above 0, return. When `stepFrame` is 0 (idle, or just reached 0 this tick), read directions in priority order up, down, left, right; the first held becomes `facing`. If the target tile `isWalkable`, set `x, y` to the target, `stepFrame = STEP_FRAMES`, and toggle `walkFrame`. If blocked, only `facing` changes. So a held key chains steps with no idle tick and no duplicate rendered frame per tile.

- [ ] **Step 1: Write failing tests** in `test/hero.test.ts`, using a 3×3 all-grass map with a wall at (1,0) built via `parseAsciiMap`:
  - Idle hero at (1,1) with nothing held stays put, `stepFrame === 0`.
  - Holding `right` from (0,1): after one update `x === 1`, `stepFrame === STEP_FRAMES`, `facing === 'right'`, `walkFrame === 1`; `heroPixelOffset` → `{ dx: -16, dy: 0 }`.
  - Step then release: hold `right` from (0,1) for one update, then 8 updates with nothing held → `x === 1`, `stepFrame === 0`, offset `{ dx: 0, dy: 0 }`; `stepFrame` after update 5 is 4 (counts down one per tick).
  - Walk continuity: hold `right` from (0,1) for 9 updates → `x === 2` and `stepFrame === STEP_FRAMES` (the next step began in the tick the previous one ended; no tick with `stepFrame === 0`). 8 more updates → `x === 2`, `stepFrame === 0` (edge at x=3 blocks).
  - Holding `up` from (1,1) (wall above): `facing === 'up'`, `x === 1 && y === 1`, `stepFrame === 0`.
  - Holding `left` from (0,1) (map edge): no movement.
  - Holding `up` and `right` together from (1,1): `facing === 'up'` (priority), no movement due to the wall.
  - Every `HERO_SPRITES` frame is 16×16.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/hero.test.ts`
Expected: FAIL.

- [ ] **Step 3: Draw the hero** in `src/data/sprites/hero.ts` and **implement `src/game/hero.ts`** per Interfaces.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run test/hero.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/data/sprites/hero.ts src/game/hero.ts test/hero.test.ts
git commit -m "feat: hero sprite and grid-locked movement with collision"
```

---

### Task 9: Camera and Explore state

**Files:**
- Create: `src/game/camera.ts`, `src/game/explore.ts`, `test/camera.test.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: constants, `GameMap`, `tileAt`, `TILES`, `ANIM_FRAME_LEN`, `HeroState`, `updateHero`, `heroPixelOffset`, `HERO_SPRITES`, `rgbaToCanvas`, `compilePixelArt`, `PALETTE`, `State`, `Input`.
- Produces:
  - `cameraOrigin(map: GameMap, heroPxX: number, heroPxY: number): { ox: number; oy: number }` — the map-pixel coordinate drawn at the viewport's top-left. If `map.width * TILE > LOGICAL_W`: `ox = heroPxX - CENTER_COL * TILE`, else `ox = -floor((LOGICAL_W - map.width * TILE) / 2)`; same for `oy` with rows/height. (`heroPx = tile * TILE + offset`.)
  - `class ExploreState implements State { constructor(deps: { map: GameMap; hero: HeroState }); readonly hero: HeroState; frame: number }` — `update` increments `frame`, runs `updateHero` with `held` bound to `input.held`. `render` fills black, computes the origin, draws every tile whose screen rect intersects the viewport (skipping coordinates outside the map), choosing frame `floor(frame / ANIM_FRAME_LEN) % frames.length` for animated tiles, then draws the hero sprite `HERO_SPRITES[facing][walkFrame]` at `(heroPx - origin)`. Tile and sprite canvases are compiled once in the constructor and cached in a `Map<PixelArt, HTMLCanvasElement>`.
  - `main.ts`: `BootState.onStart` now does `stack.replace(new ExploreState({ map: HOLLOWMERE, hero: createHero(start.x, start.y, start.facing) }))`.

- [ ] **Step 1: Write failing tests** in `test/camera.test.ts`:
  - For `HOLLOWMERE` (24×20, larger than the viewport) with hero at pixel (160, 160): `{ ox: 48, oy: 48 }`.
  - For a 10×8 map with hero anywhere: `{ ox: -48, oy: -56 }`.
  - For a 20×10 map (wide, short) with hero at (160,160): `ox: 48`, `oy: -40`.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/camera.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `camera.ts`, `explore.ts`, wire `main.ts`** per Interfaces.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run`
Expected: PASS, all files.

- [ ] **Step 5: Build check, then list owner checks**
Run: `npm run build`. Expected: succeeds. List for the owner (do not perform or report as passed): press a key and see Hollowmere; walk with arrows and WASD; bump walls and the well; water animates; the map scrolls with the hero centered; black beyond the walls; walking continuously shows no stutter at tile boundaries; hold a key and alt-tab away, the hero stops; no console errors.

- [ ] **Step 6: Commit**
```bash
git add src/game/camera.ts src/game/explore.ts src/main.ts test/camera.test.ts
git commit -m "feat: scrolling camera and Explore state with animated tiles"
```

---

### Task 10: Note math and the APU synth

**Files:**
- Create: `src/engine/audio/notes.ts`, `src/engine/audio/apu.ts`, `test/notes.test.ts`

**Interfaces:**
- Produces:
  - `noteToMidi(name: string): number` accepting a letter A–G, an optional `#` or `b`, and an octave digit 0–9 (`C4` = 60, `A4` = 69, `C0` = 12); throws on anything else. `midiToFreq(midi: number): number` = `440 * 2 ** ((midi - 69) / 12)`.
  - `type Channel = 'p1' | 'p2' | 'tri' | 'noise'`; `type Duty = 0.125 | 0.25 | 0.5`; `type NoisePreset = 'k' | 's' | 'h'`; `interface ApuLike { noteOn(ch: Exclude<Channel,'noise'>, freq: number, time: number, opts: { duty?: Duty; vol: number }): void; noteOff(ch: Exclude<Channel,'noise'>, time: number): void; noiseHit(preset: NoisePreset, time: number, vol: number): void; stopAll(time: number): void }` (`vol` is 0–15).
  - `class Apu implements ApuLike { constructor(ctx: AudioContext, destination: AudioNode) }`. Pulse channels use `OscillatorNode` with a `PeriodicWave` per duty, built from the Fourier series of a pulse of width `d` (period 1): `real[n] = sin(2πnd) / (nπ)`, `imag[n] = (1 − cos(2πnd)) / (nπ)` for n = 1..64, `real[0] = imag[0] = 0`, `disableNormalization: false`. Triangle uses `type = 'triangle'`. Each pitched channel is one long-running oscillator into a `GainNode` (0 when off, `vol / 15 * 0.12` when on). Every gain change is a short linear ramp to avoid clicks: `gain.setValueAtTime(gain.value-at-that-time, time); gain.linearRampToValueAtTime(target, time + RAMP_SEC)` with `RAMP_SEC = 0.003` (3 ms; 2–5 ms acceptable). `noteOn` sets frequency with `setValueAtTime` at `time` and ramps gain up; `noteOff` ramps gain to 0. Noise is a looping 1-second white-noise `AudioBufferSourceNode` through a `BiquadFilterNode` and `GainNode`; `noiseHit` schedules a gain spike at `time` decaying exponentially (`k`: lowpass 180 Hz, 60 ms; `s`: bandpass 1800 Hz, 120 ms; `h`: highpass 7000 Hz, 35 ms). `stopAll` ramps every gain to 0 at `time` with the same ramp.

- [ ] **Step 1: Write failing tests** in `test/notes.test.ts`: `noteToMidi('A4') === 69`, `noteToMidi('C4') === 60`, `noteToMidi('C#4') === 61`, `noteToMidi('Db4') === 61`, `noteToMidi('C0') === 12`, `noteToMidi('G9') === 127`; `midiToFreq(69) === 440`; `midiToFreq(57)` ≈ 220; `noteToMidi('H4')` throws; `noteToMidi('C')` throws; `noteToMidi('C-1')` throws.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/notes.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `notes.ts` and `apu.ts`** per Interfaces. `apu.ts` is browser-only and has no unit tests; keep every scheduling call parameterized by `time` so the sequencer can run ahead.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run test/notes.test.ts && npx tsc --noEmit`
Expected: PASS; no type errors.

- [ ] **Step 5: Commit**
```bash
git add src/engine/audio/notes.ts src/engine/audio/apu.ts test/notes.test.ts
git commit -m "feat: note math and NES-style Web Audio synth"
```

---

### Task 11: Sequencer and AudioManager

**Files:**
- Create: `src/engine/audio/sequencer.ts`, `src/engine/audio/audio.ts`, `test/sequencer.test.ts`, `test/audio.test.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `ApuLike`, `Channel`, `Duty`, `NoisePreset`, `noteToMidi`, `midiToFreq`, `Apu`, `Input`.
- Produces:
  - `interface Track { channel: Channel; duty?: Duty; vol?: number; rows: (string | null)[] }`; `interface Song { id: string; tempo: number; loopFrom?: number; tracks: Track[] }`; `ROWS_PER_BEAT = 4`; `rowDurationSec(tempo: number): number` = `60 / tempo / ROWS_PER_BEAT`; `validateSong(song: Song): void` (throws unless every track has the same non-zero row count, every pitched row is `null`, `'off'`, or a valid note name, and every noise row is `null` or a `NoisePreset`; `loopFrom` within range).
  - Row semantics: a note name → `noteOn` at that row's time with the track's `duty` (default `0.5`) and `vol` (default 12); `'off'` → `noteOff`; `null` → hold (nothing scheduled). Noise rows: preset → `noiseHit` with the track's `vol`.
  - `class Sequencer { constructor(apu: ApuLike); play(song: Song, startTime: number): void; stop(atTime: number): void; schedule(untilTime: number): void; get playing(): boolean }`. `play` validates, calls `apu.stopAll(startTime)`, and resets the row cursor to 0 at `startTime`. `schedule(untilTime)` emits every row whose time is `< untilTime` and advances the cursor; after the last row the cursor jumps to `loopFrom ?? 0` with time continuing seamlessly. `stop` calls `apu.stopAll(atTime)` and clears the song.
  - `MUTE_KEY = 'dimming.mute'`; `readMutePref(storage: Pick<Storage, 'getItem'> | null): boolean` (true only if `getItem(MUTE_KEY) === '1'`; any exception → false); `class AudioManager { constructor(storage: Storage | null); get unlocked(): boolean; get muted(): boolean; unlock(): void; installUnlockListener(target: Window): void; playSong(song: Song): void; stopSong(): void; toggleMute(): boolean }`. `unlock` is synchronous: it creates the `AudioContext` and calls `ctx.resume()` (the returned promise is not awaited), a master `GainNode` (gain 0 if muted, else 1), the `Apu`, the `Sequencer`, and starts a `setInterval` every 25 ms calling `sequencer.schedule(ctx.currentTime + 0.1)`; it also listens to `visibilitychange` and calls `ctx.resume()` when the page becomes visible. Calling `unlock` twice is a no-op. `installUnlockListener` adds `keydown` and `pointerdown` listeners (`{ once: true }` each, and each removes the other) that call `unlock()` **synchronously inside the event handler**, because Safari only honors `resume()` on a user-gesture call stack. `playSong` before `unlock` stores the song as pending and plays it on unlock. `toggleMute` flips the pref, writes `'1'`/`'0'` to storage (exceptions ignored), sets master gain, works before unlock.
  - `main.ts`: construct `AudioManager(localStorage-or-null)` and call `audio.installUnlockListener(window)` at startup, before the loop. In the update function, if `input.pressed('mute')` call `audio.toggleMute()`. `BootState.onStart` only performs the state transition; it does not touch audio.

- [ ] **Step 1: Write failing tests**:
  - `test/sequencer.test.ts` with a `FakeApu` that records each call as `{ kind, ch, freq, time, vol, duty }`:
    - A one-track song `tempo 120`, `rows: ['C4', null, 'off', 'E4']`, `play(song, 10)` then `schedule(10.4)` → calls: `stopAll@10`, `noteOn p1 261.63@10.0`, `noteOff@10.25`, `noteOn 329.63@10.375` (`toBeCloseTo`, 2 places), and nothing for the hold.
    - Looping: a 2-row song `['C4','D4']` at tempo 240 (`rowDurationSec = 0.0625`), `play(song, 10)` then `schedule(10.2)` → exactly 4 noteOns at 10, 10.0625, 10.125, 10.1875 alternating C4/D4 (loop from 0).
    - `loopFrom: 1` on the same song → after the first pass, only `D4` repeats.
    - Noise track `['k', null, 's']` → `noiseHit('k', t0, vol)` and `noiseHit('s', t0 + 2 rows)`.
    - `validateSong` throws on tracks of unequal length, on `'X9'`, and on `loopFrom` ≥ row count.
    - `schedule` called twice with the same `untilTime` emits nothing new.
  - `test/audio.test.ts`: `readMutePref({ getItem: () => '1' }) === true`; `() => '0'` → false; `() => null` → false; a `getItem` that throws → false; `readMutePref(null) === false`. With a fake `Window` (`addEventListener`/`removeEventListener` recorded) and a stubbed `AudioContext` global: `installUnlockListener` registers `keydown` and `pointerdown`; invoking the recorded `keydown` handler makes `unlocked === true` synchronously (no `await`), and invoking it again does not construct a second context.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/sequencer.test.ts test/audio.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `sequencer.ts`, `audio.ts`, wire `main.ts`** per Interfaces.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS; no type errors.

- [ ] **Step 5: Commit**
```bash
git add src/engine/audio/sequencer.ts src/engine/audio/audio.ts src/main.ts test/sequencer.test.ts test/audio.test.ts
git commit -m "feat: song sequencer and audio manager with unlock and mute"
```

---

### Task 12: The Hollowmere theme

**Files:**
- Create: `src/data/songs/hollowmere.ts`, `test/songs.test.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `Song`, `validateSong`, `AudioManager.playSong`.
- Produces: `HOLLOWMERE_SONG: Song` with `id: 'hollowmere'`; `main.ts` calls `audio.playSong(HOLLOWMERE_SONG)` when entering Explore.

- [ ] **Step 1: Write failing tests** in `test/songs.test.ts`: `validateSong(HOLLOWMERE_SONG)` does not throw; every track's row count is the same, is a multiple of 12 (3/4 time at 4 rows per beat), and is at least 192 (16 bars); there is exactly one `p1`, one `p2`, one `tri` track and at most one `noise` track; `loopFrom` is undefined or 0; `tempo` is between 100 and 150.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run test/songs.test.ts`
Expected: FAIL.

- [ ] **Step 3: Compose the song** in `src/data/songs/hollowmere.ts`. Character from the spec: warm, lilting 3/4, safe, "coming home." Constraints: original melody; a major key (F or G suggested); 16 or 24 bars with an A–A–B–A phrase shape; `p1` carries the melody at duty 0.5 vol 12 with mostly stepwise motion and a clear cadence on the final bar so the loop lands cleanly; `p2` plays thirds or sixths under the melody at duty 0.25 vol 8, resting where the melody breathes; `tri` plays a bass line of roots and fifths on beats 1 and 3 (rows 0 and 8 of each bar) vol 15; noise optional, at most a soft `h` on beat 2. Use `'off'` before repeated notes so they re-articulate.

- [ ] **Step 4: Wire `main.ts`** to play the song on entering Explore (spec: hard-cut song changes; nothing to cut yet).

- [ ] **Step 5: Run the full suite and build**
Run: `npm test && npm run build`
Expected: all tests pass; build succeeds with no warnings about missing modules.

- [ ] **Step 6: List the Phase 1 owner play-test (spec §14)**
Do not perform these; list them verbatim in the task report for the owner:
  - Walk around town, bump walls, the well, trees, and the pond.
  - The town theme starts on the first keypress and loops without a gap or click.
  - M mutes and unmutes; reload the page muted and it stays muted; M before pressing any key still works after unlock.
  - Resize the window: stays crisp, integer scale, black bars.
  - Alt-tab away for 30 seconds while holding a key, come back: hero stopped, no catch-up burst, music still playing.
  - Walking continuously shows no stutter at tile boundaries.
  - Console has no errors.
  - Safari (if available): audio starts on the first keypress.

- [ ] **Step 7: Commit**
```bash
git add src/data/songs/hollowmere.ts src/main.ts test/songs.test.ts
git commit -m "feat: Hollowmere town theme"
```

- [ ] **Step 8: Stop.** Phase 1 is complete. Report the play-test results to the owner and wait for feedback before starting Phase 2 (gated cadence, spec §14).
