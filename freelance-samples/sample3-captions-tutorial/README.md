# Sample 3 — How to Add Captions to a Video (screen tutorial)

**Personal sample project** (not client work). Every UI step is a real, unedited screen recording of Shotcut on my own Linux desktop.

| Item | Value |
|---|---|
| Category | Software screen tutorial / how-to |
| Duration | 2:37 |
| Format | 1920×1080, 16:9, 30 fps, MP4 (H.264 + AAC 48 kHz), −16.4 LUFS |
| Role | Script, screen recording, edit (zoom/pan, click highlights, chapters), motion graphics, captions, voice/music mix, render |
| Final video | `captions_tutorial_1080p_v1.mp4` (release `sample3-v1`) |
| Cover | `cover_1920x1080.jpg` |
| Captions | Burned in, one cue per sentence (29), plus `captions_en.srt` |
| Software taught | Shotcut 26.9.27 (free, open source, GPL-3.0), official release build |
| Editable projects | `project/captions_tutorial.mlt` (the Shotcut project made on screen), `remotion/` (final edit), `script.json`, `build_timeline.py`, `recording/drv.py` + `steps.jsonl` (step/click log) |
| Music | "Inspired" by Kevin MacLeod (incompetech.com), CC BY 4.0, ducked under VO |

## Description (EN, 84 words)
Personal sample project. A 2½-minute screen tutorial showing how to add captions to a video in Shotcut, a free, open-source editor. It walks through five chapters: import a clip, add caption lines, check timing against the audio, reposition and restyle them with the Subtitle Burn In filter, and export an MP4. I recorded every step live, then edited it with smooth zooms to each click, click highlights, step labels, a chapter progress bar, and one caption per sentence. Voice: Kokoro TTS. Music: Kevin MacLeod (CC BY 4.0).

## 中文说明
个人自主制作样片（非客户项目）。2 分 37 秒的软件录屏教程：用免费开源剪辑软件 Shotcut 给视频加字幕。分五章：导入片段、添加字幕、对照声音检查时间、用"字幕烧录"滤镜调整位置和样式、导出 MP4。所有操作都是真实录屏；后期加入跟随点击的平滑放大、点击高亮、步骤标签、章节进度条和一句一字幕。配音为 Kokoro TTS（Apache-2.0），音乐为 Kevin MacLeod《Inspired》（CC BY 4.0，已署名）。

## Structure / attention
| Time | Part | Visual anchor |
|---|---|---|
| 0:00–0:19 | Hook + promise: "SOUND OFF" mini-player whose caption types itself; 5 chapter chips pop in as they're named | Typing caption, chips |
| 0:19–2:24 | 15 recorded steps in 5 chapters | Camera eases to each click (1.6×), yellow click ring, STEP n label, chapter bar; slow parts at 2× with a badge |
| 2:24–2:37 | Recap: five chapter chips get checkmarks; credits | Checks |

## How it was made
1. `script.json` → Kokoro TTS, one wav per sentence (`../tools/make_vo.py`).
2. Shotcut launched with a clean, throw-away profile (no account, no notifications); window 1920×1080.
3. `recording/drv.py` drives real mouse/keyboard input (xdotool) one step at a time while ffmpeg `x11grab` records the screen; each step's start/end and every click are logged to `steps.jsonl`. Two steps (10, 11) failed on the first try and were redone; the edit uses the successful take, so all shown actions are real.
4. `build_timeline.py` lays out VO per step, maps the logged clicks to edit time, mixes VO + ducked BGM, loudness-normalises to −16 LUFS.
5. `remotion/src/Tutorial.tsx` composes intro, recording (auto-zoom camera from the click log), labels, captions and outro.

## Assets & AI log
| Asset | Source | License | Commercial |
|---|---|---|---|
| Screen recording | Recorded by me (ffmpeg x11grab) | Own work | Yes |
| Shotcut UI shown | Shotcut 26.9.27, shown as a tutorial subject only | GPL-3.0 app | Yes (editorial use of UI) |
| Demo clip in the tutorial | Frames from my Sample 1 (no captions) | Own work | Yes |
| Graphics / animation | Self-made (`remotion/src/Tutorial.tsx`) | Own work | Yes |
| Motion utilities | lemo-opuscar lib.js (vendored) | MIT | Yes |
| Shader noise / light-leak | hyperframes shader-transitions (adapted in `fx.tsx`) | Apache-2.0 | Yes |
| Voice | Kokoro-82M via kokoro-onnx 0.6.1, voice af_heart, local | Apache-2.0 / MIT | Yes |
| Music | "Inspired" Kevin MacLeod, incompetech.com, downloaded 2026-11-02 | CC BY 4.0 | Yes, credited |
| Font | Inter | OFL 1.1 | Yes |

AI use: TTS voice only, plus an AI assistant that helped draft the script and code (reviewed by hand). No AI images or video, and no voice or face cloning.

Music credit: "Inspired" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0 License, http://creativecommons.org/licenses/by/4.0/

## Tool versions
Shotcut 26.9.27 · ffmpeg 7.1.5 · Remotion 4.0.538 (Node 20.19.2) · kokoro-onnx 0.6.1 + Kokoro-82M v1.0 · faster-whisper (base.en) for the caption check · xdotool / wmctrl for input. All free; no paid features, plugins, stock or credits used. Nothing was paywalled.

## QC (2026-11-02, UTC+8)
| Check | Result |
|---|---|
| Format | H.264 1920×1080 30 fps + AAC ✅ |
| Duration 2–4 min | 2:37 ✅ |
| Black frames / watermark | none ✅ |
| Loudness | −16.4 LUFS, true peak −1.2 dBFS ✅ |
| One subtitle per sentence | 29 cues = 29 sentences ✅ |
| Captions vs VO (ASR on final mix) | 99.4 %; only diff "H.264 MP4" → "264mp4" ✅ |
| Shotcut export really contains burned captions | checked frames of `project/shotcut_export_study_tip_captioned.mp4` at 1 s / 2.8 s / 5 s ✅ |
| On-screen privacy | clean profile in a throw-away home folder; no notifications, accounts or personal paths beyond `/tmp/demohome` ✅ |
| Secrets | none ✅ |

Time spent ≈ 1 h 45 min (install and dry-run of Shotcut ≈ 40 min, recording ≈ 25 min, edit/render/QC ≈ 40 min).

Weaknesses / limits: synthetic voice; the Shotcut UI text is small at 1080p, so the zoom does the reading work; only three caption lines are typed on screen (the full clip has 12 sentences); no audio from the app itself is recorded (none needed).
