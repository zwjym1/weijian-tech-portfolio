# Sample 1 — How to Build a Simple Study Plan

**Personal sample project** (not client work). Landscape educational explainer.

| Item | Value |
|---|---|
| Category | Educational explainer / motion graphics with captions |
| Duration | 3:22 (201.7 s) |
| Format | 1920×1080, 16:9, 30 fps, MP4 (H.264 + AAC 48 kHz), −16 LUFS |
| Role | Script, storyboard, all motion design & animation code, captions, audio mix, render (one person + tools listed below) |
| Final video | `study_plan_1080p_v2.mp4` (not in git — see Releases / delivered separately) |
| Cover | `cover_1920x1080.jpg` |
| Captions | Burned-in + `captions_en.srt` |
| Motion libraries | lemo-opuscar (MIT), hyperframes shader code (Apache-2.0), claude-motion-design rules (MIT) — see docs/MOTION_NOTES.md |
| Editable project | `remotion/` (React/TypeScript, Remotion 4.0.538), `script.json`, `build_timeline.py` |

## Description (EN, 83 words)
Personal sample project. I created this three-minute educational video to demonstrate clear editing, captions, and simple visual explanations. It walks through one practical way to plan a study week: break big tasks into small steps, place them on a calendar using the time you actually have, then review and adjust. My work included the script, storyboard, all animation (checklists, calendar, icons), caption timing, audio mix and final render. The voice-over is AI text-to-speech (Kokoro, Apache-2.0); all visuals are self-made, with open-source motion utilities (MIT / Apache-2.0).

## 中文说明
个人自主制作样片（非客户项目）。这条约 3 分钟的教育解说视频用于展示清晰的剪辑、字幕和简单图示讲解能力。内容演示一种实用的一周学习计划方法：把大任务拆成小步骤，按自己真实可用的时间排进日历，然后复盘调整。我负责脚本、分镜、全部动画（清单、日历、图标）、字幕时间轴、音频处理和最终渲染。配音为 AI 文本转语音（Kokoro，Apache-2.0 许可），画面自制，动效使用开源库（MIT / Apache-2.0）。

## Structure (vs brief)
| Brief | Actual |
|---|---|
| 0:00–0:15 problem + hook | 0:01–0:17 three urgent task cards pile up → "Where do you start?" |
| 0:15–0:45 what this video shows | 0:17–0:38 title + 3 step cards |
| 0:45–1:30 break down, checklist animation | 0:38–1:31 "Write the essay" splits into 6 steps; reading/quiz 4 steps; time estimates; 3 → 10 counter |
| 1:30–2:15 week calendar, demo time | 1:31–2:17 available blocks → steps drop in by deadline → one free slot (labelled "example only") |
| 2:15–3:00 review & adjust | 2:17–2:53 daily check-offs, late step moves to free slot, two weekly questions |
| 3:00–end recap + end card | 2:53–3:22 recap + end card |

See `docs/SCRIPT_EN_ZH.md` (full script with Chinese gloss and timings), `docs/SHOTLIST.md`, `docs/ASSETS_AND_AI_LOG.md`, `docs/QC_REPORT.md`.

## Rebuild
```bash
# 1) voice-over (Kokoro TTS, local, free)  -> audio/l*.wav + audio/lines.json
python make_vo.py script.json audio af_heart        # see ../tools/make_vo.py
# 2) timeline + mixed VO
python build_timeline.py                              # -> remotion/src/timeline.json, remotion/public/vo.wav
# 3) render
cd remotion && npm install && npx remotion render StudyPlan out/study_plan_1080p.mp4 --codec=h264 --crf=18
ffmpeg -i out/study_plan_1080p.mp4 -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k ../study_plan_1080p.mp4
```
