# Motion & visual system — Sample 1 v3

## Visual anchor system
- **Hierarchy (3 layers):** top-left section chip (MOVE n · NAME) = where you are; centre anchor (one big element per beat) = what matters; bottom caption = what is said. Supporting items are dimmed to ~35 % while a focus item is active.
- **Recurring motif:** the red "BIG TASK" block → cracks → explodes into white tiles → tiles drop into the week → a slipping tile cracks again. Colours are fixed per move: SMASH coral #FF5D5D, SLOT yellow #FFC93C, CHECK mint #2BD99F, reading blue #5B8CFF.
- **Contrast:** dark navy field (#0E1220) with white tiles and saturated accents — tiles and kinetic words are the brightest things on screen. Captions on 86 % black pill, keywords (Smash/Slot/Check, numbers, Friday/Saturday, empty/buffer) highlighted yellow.
- **Attention devices:** kinetic slams (scale-down spring + glow), camera impact shake on hits, shockwave rings, spotlight vignette (radial mask) for open-loop payoff and day-by-day checking, full-screen colour wipes as section interrupts, number roll with confetti.
- **Safe margins:** all key text inside 90 px left/right and 52 px bottom (captions); progress dots bottom-right above captions.

## Open-source code integrated
| Library | License | Code path / use |
|---|---|---|
| lemo-opuscar `core/lib.js` | MIT | `remotion/src/vendor/lemo-lib.js` (vendored). `mulberry` RNG for bursts, `vnoise` camera drift, `back` overshoot pops, `eo`/`seg` easing. |
| hyperframes shader-transitions | Apache-2.0 | `remotion/src/fx.tsx`: `NQ` FBM noise → new **dark, sharp** shader background (low-contrast noise + vignette + film grain, replacing the muddy pastel v2 field); `light-leak` shader ported as alpha overlay at each scene handoff. |
| claude-motion-design | MIT | Rules: spring settles fastest-first, no frozen frame (drift + background always moving), exits ≈1.5× faster than entries, next scene enters moving in the exit's direction (whip-pan with blur). |
| opus-video-prompts | no LICENSE | not used |

## v2 → v3
- Soft title open → 3-slam cold open in the first 3 s.
- Even explainer pacing → 43 beats / 81 sentence cues with interrupts every ~4–12 s.
- Light pastel BG (readability issue) → dark sharp shader BG.
- Calendar: 3 rows (AM/PM/EVE) filling 250–700 px, legend band + payoff text fill the lower area (no empty bottom).
- Captions: one cue per sentence (was multi-sentence).
- BGM added (CC BY 4.0), ducked under VO.
