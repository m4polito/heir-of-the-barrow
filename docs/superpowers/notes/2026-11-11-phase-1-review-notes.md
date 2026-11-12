# Phase 1 review notes (for Phase 2 planning)

Carried over from the SDD ledger on 2026-11-11. Deferred minors, controller rulings, and the final reviewer's structural recommendations.

## Rulings
- Ruling: repo had zero commits; initial commit on master holds CLAUDE.md, docs, .claude/skills, skills-lock.json; Tasks 1-12 on branch `phase-1` in place (no separate worktree) — owner play-tests in this checkout and there is no other work to isolate from — costs nothing if wrong beyond a branch rename.
- Ruling: Task 0 (CLAUDE.md) written by the controller, not a subagent — content was dictated by the owner and is not product code — cost if wrong: a 30-line doc edit.
- Ruling: `skills-lock.json` (pre-existing, owner's skill installer) committed with the initial commit rather than left untracked — cost if wrong: one file to untrack.
- Ruling: BootState starts on `anyPressed()`, so pressing M on the boot screen both toggles mute and starts the game — accepted; spec says "Press any key" — cost if wrong: one-line exclusion later.
- Ruling: Task 1 `skipLibCheck: true` accepted — avoids adding @types/node solely for vitest's own type files — cost if wrong: one tsconfig line.
- Ruling: run npm/vite commands from the uppercase path `C:/Projects/VSCode/WarriorsQuest` — Vite html-proxy failed once from `c:/` — cost if wrong: none.
- Ruling: Task 3 sub-tick tap (key down and up within one 16 ms tick is never seen) accepted — physical keypresses last far longer — cost if wrong: latch pressed-from-keyDown later, small change.
- Ruling: Task 3 tracks held key codes rather than actions (releasing W keeps 'up' held while ArrowUp is down) — better than the brief's two-action-set wording; brief's observable tests unchanged — cost if wrong: none.
- Ruling: (3) overturn single shared noise chain — use a per-hit AudioBufferSourceNode (shared buffer) → own BiquadFilter → own Gain, start(time)/stop(time+decay+0.01); fixes (2) and (3) together — cost if wrong: a few extra nodes per hit, negligible.
- Ruling: (4) allow cancelScheduledValues(time) inside stopAll only (gain + frequency of pitched channels), then anchor setValueAtTime(lastGain, time) and ramp to 0; reset lastGain=0 and rampEnd=time. Ban stays everywhere else — cost if wrong: a small step at song change, inaudible under the new song.
- Ruling: (1) track rampEnd[ch]; each ramp starts at max(time, rampEnd[ch]); schedule frequency at the same start — cost if wrong: ≤3 ms note-start latency.
- Ruling: mitigate the stale-anchor click in Task 11 by routing Apu → songGain → master and fading songGain to 0 over 20 ms before stopAll on song change, back up at the new song's start — cost if wrong: one extra GainNode.
- Ruling: fix wave includes Important 1–4 plus cheap minors (modifier-chord passthrough in Input, mute ramp via setTargetAtTime, compile-all-art test asserting frames.length ≥ 1). Everything else in the final review stays deferred to the Phase 2 plan (updateHero `arrived` slot, shared art cache, SFX path, key-repeat, SongId registry, hero colour count, `hero` getter) — cost if wrong: one more small fix commit.
- Ruling: hero walkFrame stays per-step (idle hero does not animate); spec §4.3's "walk cycle driven by global counter" is deferred to the owner's art sign-off — cost if wrong: a 3-line change in explore.ts.
- Final fix wave implemented 42141e9 (96 tests). Ruling: computeLayout takes CSS px and applies dpr internally (the brief's examples, not its resize() snippet, are authoritative) — cost if wrong: none.

## Deferred minors
- Task 1: minor (deferred): vite.config.ts not type-checked by build (include is src,test per plan); overflow:hidden on html/body (harmless extra)
- Task 2: minor (deferred): stop() called from inside update/render does not stop the loop (handle re-requested after cancel); startLoop untested; negative elapsed unguarded
- Task 3: minor (deferred): attach/blur-via-event/preventDefault scope untested; clear() leaves anyDownFlag set; keyup also calls preventDefault
- Task 4: minor (deferred): w/h not validated; hexToRgb per pixel (perf irrelevant); out-of-range test asserts only toThrow; no non-square or lowercase-hex test
- Task 5: minor (deferred): % and @ glyphs rough; no test for uppercase row-7-blank / descender-row-7; distinct test catches only exact duplicates; unchecked cast font.ts:164
- Task 6: minor (deferred): BootState untested (blink/single-fire); present() blits every frame
- Task 7: minor (deferred): well/sign exceed 3-4 colors; no tests for perimeter/door-below-walkable/pond/sign; encounterRate & ANIM_FRAME_LEN untested
- Task 8: minor (deferred): no test that walkFrame toggles across chained steps; mirror untested; `+ 0` needs a comment
- Task 9: minor (deferred): `!` on frames[] (no empty-frames guard); main.ts indentation; ExploreState render untested
- Task 10: minor (deferred): stopAll anchor stale under look-ahead (click/blip at song change); stopAll does not stop queued noise hits (≤120 ms); every noise hit starts at buffer offset 0 (identical sample); setPeriodicWave not time-scheduled
- Task 11: minor (deferred): no catch-up policy for past-dated rows after a stall; loopFrom not integer-checked; duplicate channel tracks not rejected; NOISE_PRESETS duplicated across files; setValueAtTime(1, now) jump if playSong/stopSong called within a running fade; unlock has no try/catch; mute toggle sets gain instantly; playSong restarts the same song; fade sequence untested
- Task 11: minor (deferred): src.stop(time) may extend a hit ~20 ms (inaudible, gain already 0); no test that unlock listeners persist when ctx not running; no test for liveNoise in stopAll; double stopAll on song change (harmless); report line 5 stale
- Task 12: minor (deferred): Array.from(.., hat) passes (undefined, index); p2 bar 16 beat 3 silent (deliberate)

## Final reviewer recommendations for Phase 2
- updateHero finishes a step and starts the next in the same call, so there is no 'after the step completes' slot for door warps or encounter checks: return { hero, arrived } or split it; take canEnter(x, y) instead of map for NPC collision.
- ExploreState's art cache is private and per-instance; NPC and UI sprites need a shared cache.
- SFX path: a second Apu → sfxGain → master, with songGain at about 0.5.
- Add key-repeat to Input for menus.
- SongId → Song registry next to the songs; SongId currently lives in game/map.ts.
- Hero uses 6 palette colours (well 6, sign 5) against spec §13's 3–4; raise at art sign-off.
- DPR change without a window resize is not detected; a matchMedia resolution listener would cover it.
- Owner to decide at art sign-off: idle hero does not animate (walkFrame toggles per step); spec §4.3 implies a global-counter walk cycle.
