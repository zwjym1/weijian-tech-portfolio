# Motion & design notes — Sample 1 v2

## Open-source libraries actually integrated
| Library | License | How it is used (code path) |
|---|---|---|
| **lemo-opuscar** `core/lib.js` (LemoLab) | MIT | Vendored unchanged as `remotion/src/vendor/lemo-lib.js` (+ LICENSE). Used for: deterministic RNG `mulberry` (confetti/spark bursts), `vnoise` (camera micro-drift so no frame is frozen), `back` overshoot (check badges, Quiz block), `eo`/`seg` (bar chart growth, title underline, counter pulse). |
| **hyperframes** `packages/shader-transitions` (HeyGen) | Apache-2.0 | GLSL noise block `NQ` (quintic value noise + rotated FBM) copied into `remotion/src/fx.tsx` → animated domain-warped WebGL background (`ShaderBg`). The `light-leak` transition shader ported to an alpha-only overlay (`LightLeak`) that fires at every scene handoff. LICENSE included; modifications noted in source comments. |
| **claude-motion-design** (Howseen AI) | MIT | Motion rules applied: fast-first spring settles, no frozen frames (camera drift + background always moving), exits ~1.5× faster than entries, next scene enters already moving in the exit direction (whip-pan handoff with motion blur). |
| awesome-opus5-5-videos, xilo-opus-video | MIT | Reviewed as references (prompt/case collections); no code needed. |
| opus-video-prompts | no LICENSE | **Not used.** |

## What changed vs v1
- Background: static CSS blobs → live WebGL FBM watercolor field, tinted per scene (coral → blue → amber → green → violet).
- Scene handoffs: fade/slide → directional whip-pan (spring in from right with blur, faster geometric exit to left with blur) + light-leak flash.
- Camera: slow push-in (1.0 → 1.035) + noise drift on every scene.
- Title: per-word spring stagger with rotation + gradient underline draw.
- Step cards: shockwave ring pulse on entry.
- Checklists: light sweep across each new row; self-drawing check strokes (stroke-dashoffset) with overshoot pop and spark burst.
- Counter "3 → 10 small steps": number roll + elastic pulse + confetti burst.
- Calendar: blocks drop with spring and burst on landing; Quiz block overshoot pop; new animated "Planned minutes per day (example)" bar chart; review check-offs draw themselves with bursts; late step arcs into the free slot.
