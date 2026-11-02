# Asset list & AI usage log — Sample 1
Checked 2026-11-02 (UTC+8). No stock footage, no music, no third-party images, no logos/trademarks, no real people.

| Asset | Source / author | License | Commercial use | Date |
|---|---|---|---|---|
| All graphics, icons, layouts, animation | Self-made (code in `remotion/src/Video.tsx`) | Own work | Yes | 2026-11-02 |
| Font: Inter | Rasmus Andersson, system-installed | SIL OFL 1.1 | Yes | — |
| Voice-over | Kokoro-82M TTS model (hexgrad), voice `af_heart`, run locally via `kokoro-onnx` 0.6.1 (thewh1teagle, MIT) | Model weights Apache-2.0 | Yes (Apache-2.0) | 2026-11-02 |
| Render framework | Remotion 4.0.538 | Remotion License: free for individuals | Yes for an individual | — |
| Motion utilities | lemo-opuscar core/lib.js (LemoLab), vendored at `remotion/src/vendor/lemo-lib.js` | MIT | Yes (keep notice) | 2026-11-02 |
| Shader noise + light-leak transition | hyperframes shader-transitions (HeyGen), adapted in `remotion/src/fx.tsx` | Apache-2.0 | Yes (keep LICENSE, note changes) | 2026-11-02 |
| Motion principles | claude-motion-design (Howseen AI) — rules only | MIT | Yes | 2026-11-02 |

## AI usage
| Use | Tool | What it did | Human check |
|---|---|---|---|
| Voice-over | Kokoro-82M (local TTS) | Read the English script, 50 lines | Full ASR comparison (faster-whisper base.en): 545/547 words match; the 2 diffs are "ten→10", "okay→ok" (number/spelling format only) |
| Script drafting / code | AI assistant (Grok Bot) | Helped draft script and animation code | Script reviewed line by line with Chinese gloss; no learning-science or health claims |
| Images / video generation | Not used | — | — |

Rejected: Fish Audio free tier — its terms limit free-plan output to personal, non-commercial use, so it was not used for this public sample. No voice or face cloning.
