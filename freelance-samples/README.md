# Freelance Personal Samples (Upwork / Workana)

All items are **personal sample projects**, made with free tools only.

| # | Sample | Format | Status |
|---|---|---|---|
| 1 | [How to Build a Simple Study Plan](sample1-study-plan) | 3:07, 16:9 1080p | v3 attention cut — internal QC passed, awaiting review |
| 2 | One task. Three smaller steps. (vertical) | 30–60 s, 9:16 | planned after sample 1 sign-off |
| 3 | How to Add Captions to a Video (screen tutorial) | 2–4 min, 16:9 | planned; software being verified |

Pipeline: script.json → Kokoro TTS (local, Apache-2.0) → build_timeline.py (VO mix + caption timings) → Remotion render → ffmpeg loudnorm → ASR caption check.
