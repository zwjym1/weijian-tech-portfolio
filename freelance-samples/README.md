# Freelance Personal Samples (Upwork / Workana)

All items are **personal sample projects**, made with free tools only.

| # | Sample | Format | Status |
|---|---|---|---|
| 1 | [How to Build a Simple Study Plan](sample1-study-plan) | 3:07, 16:9 1080p | v3.1 (v3 + centred "WRITE THE ESSAY" title fix); v2 kept — awaiting review |
| 2 | [One task. Three smaller steps.](sample2-short) | 0:44, 9:16 1080×1920 | v1 — internal QC passed, awaiting review |
| 3 | [How to Add Captions to a Video](sample3-captions-tutorial) (Shotcut screen tutorial) | 2:37, 16:9 1080p | v1 — internal QC passed, awaiting review |

Pipeline: script.json → Kokoro TTS (local, Apache-2.0) → build_timeline.py (VO mix + caption timings) → Remotion render → ffmpeg loudnorm → ASR caption check.
