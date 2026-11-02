# Sample 1 — How to Build a Simple Study Plan

**Personal sample project** (not client work). Landscape educational explainer.

| Item | Value |
|---|---|
| Category | Educational explainer / motion graphics with captions |
| Duration | 3:07 (187.2 s) |
| Format | 1920×1080, 16:9, 30 fps, MP4 (H.264 + AAC 48 kHz), −16 LUFS |
| Role | Script, storyboard, all motion design & animation code, captions, audio mix, render (one person + tools listed below) |
| Final video | `study_plan_1080p_v3.mp4` (not in git — see Releases / delivered separately) |
| Cover | `cover_1920x1080.jpg` |
| Captions | Burned-in, one cue per sentence (81) + `captions_en.srt` |
| Music | "Inspired" by Kevin MacLeod (incompetech.com), CC BY 4.0, ducked under VO |
| Version | v3 "attention-engine" cut — see docs/ATTENTION_CURVE.md, docs/keyframes/attention_strip_v3.jpg |
| Motion libraries | lemo-opuscar (MIT), hyperframes shader code (Apache-2.0), claude-motion-design rules (MIT) — see docs/MOTION_NOTES.md |
| Editable project | `remotion/` (React/TypeScript, Remotion 4.0.538), `script.json`, `build_timeline.py` |

## Description (EN, 83 words)
Personal sample project. I created this three-minute educational video to demonstrate clear editing, captions, and simple visual explanations. It opens cold on a relatable problem, then teaches three moves: smash big tasks into small pieces, slot them into the time you really have, and check and adjust each night. My work included the script, storyboard, all animation (checklists, calendar, icons), one-sentence-per-cue captions, music and voice mix and final render. Voice-over is AI text-to-speech (Kokoro, Apache-2.0); music is "Inspired" by Kevin MacLeod (CC BY 4.0); all visuals are self-made, with open-source motion utilities (MIT / Apache-2.0).

## 中文说明
个人自主制作样片（非客户项目）。这条约 3 分钟的教育解说视频用于展示清晰的剪辑、字幕和简单图示讲解能力。内容演示一种实用的一周学习计划方法：把大任务拆成小步骤，按自己真实可用的时间排进日历，然后复盘调整。我负责脚本、分镜、全部动画（清单、日历、图标）、字幕时间轴、音频处理和最终渲染。配音为 AI 文本转语音（Kokoro，Apache-2.0 许可），背景音乐为 Kevin MacLeod《Inspired》（CC BY 4.0，已署名），画面自制，动效使用开源库（MIT / Apache-2.0）。

## Structure
See docs/ATTENTION_CURVE.md for the beat-by-beat attention curve (cold open → promise → open loop → 3 moves with section wipes → loop payoff → recap → end card).

See `docs/SCRIPT_EN_ZH.md` (full script with Chinese gloss and timings), `docs/SHOTLIST.md`, `docs/ASSETS_AND_AI_LOG.md`, `docs/QC_REPORT.md`.

## Rebuild
```bash
# 1) voice-over (Kokoro TTS, local, free)  -> audio/l*.wav + audio/lines.json
python make_vo.py script.json audio af_heart        # see ../tools/make_vo.py
# 2) timeline + VO + BGM mix (download bgm/Inspired.mp3 from incompetech first)
python build_timeline.py                              # -> remotion/src/timeline.json, remotion/public/vo.wav
# 3) render
cd remotion && npm install && npx remotion render StudyPlanV3 out/study_plan_1080p_v3.mp4 --codec=h264 --crf=18
ffmpeg -i out/study_plan_1080p.mp4 -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k ../study_plan_1080p_v3.mp4
```
