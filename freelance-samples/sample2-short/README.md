# Sample 2 — One task. Three smaller steps. (vertical short)

**Personal sample project** (not client work). Adapted from Sample 1 as a standalone mini-story, not a clip of it.

| Item | Value |
|---|---|
| Category | Short-form educational video (Shorts / Reels / TikTok) |
| Duration | 0:43.9 |
| Format | 1080×1920, 9:16, 30 fps, MP4 (H.264 + AAC 48 kHz), −14.5 LUFS (mobile) |
| Role | Adaptation script, vertical layout, motion design, captions, music/voice mix, render |
| Final video | `short_1080x1920_v1.mp4` (release `sample2-v1`) |
| Cover | `cover_1080x1920.jpg` |
| Captions | Burned in, one cue per sentence (20), plus `captions_en.srt` |
| Music | "Inspired" by Kevin MacLeod (incompetech.com), CC BY 4.0, ducked under VO |
| Editable project | `remotion/` (Remotion 4.0.538), `script.json`, `build_timeline.py` |

## Description (EN, 78 words)
Personal sample project. A 44-second vertical short adapted from my longer study-plan explainer. It opens on a relatable problem, an essay that has sat on the list for a week, then smashes the task into three smaller, timed steps and lands on one clear action for tonight. I wrote the adaptation, rebuilt the layout for 9:16 with safe margins for social UI, animated it, and timed one caption per sentence. Voice: Kokoro TTS (Apache-2.0). Music: "Inspired" by Kevin MacLeod (CC BY 4.0).

## 中文说明
个人自主制作样片（非客户项目）。从样片 1 的长视频改编的 44 秒竖屏短视频，是一个独立完整的小故事：开头抛出"论文在清单上躺了一周还没开始"的问题，中间把任务拆成三个有时间估计的小步骤，结尾落到"今晚只做第一步"。我负责改编脚本、9:16 重新排版（为社交平台按钮留出安全边距）、动画和一句一字幕。配音为 Kokoro TTS（Apache-2.0），音乐为 Kevin MacLeod《Inspired》（CC BY 4.0，已署名）。

## Beat map (attention)
| Time | Beat | Eye goes to |
|---|---|---|
| 0:00–0:03 | **Hook:** red "WRITE THE ESSAY" block drops in; "DAY 1 → DAY 7 · NOT STARTED" counter | Block + counter |
| 0:05–0:09 | Reframe: "It's not you." / "TOO BIG." slam | Slam word |
| 0:09–0:12 | SMASH IT: block cracks and explodes into 3 tiles, with camera hit | Explosion |
| 0:12–0:25 | Step 1/2/3: focus tile scaled, others dimmed; time chip pops on each | Focus tile |
| 0:25–0:29 | Rule: verbs underline, "VERB + ONE SITTING" | Underlines |
| 0:29–0:35 | Payoff: "Write an essay tonight" is struck out; "TONIGHT: JUST THIS" appears; step 1 gets a check and a burst | Step 1 |
| 0:35–0:40 | Recap slams "ONE TASK. THREE SMALLER STEPS." | Slam |
| 0:40–0:44 | End card: Personal sample + credits | Title |

Safe area: all text inside x 90–930 px (150 px kept free on the right for like/share buttons), y 250–1670. Captions sit at y ≈ 1480, above the bottom UI band.

## Assets & AI log
| Asset | Source | License | Commercial |
|---|---|---|---|
| Graphics / animation | Self-made (`remotion/src/Short.tsx`) | Own work | Yes |
| Motion utilities | lemo-opuscar lib.js (vendored) | MIT | Yes |
| Shader noise / light-leak | hyperframes shader-transitions (adapted in `fx.tsx`) | Apache-2.0 | Yes |
| Voice | Kokoro-82M via kokoro-onnx 0.6.1, voice af_heart, run locally | Apache-2.0 / MIT | Yes |
| Music | "Inspired" Kevin MacLeod, incompetech.com, downloaded 2026-11-02 | CC BY 4.0 | Yes, credit on end card and in description |
| Font | Inter | OFL 1.1 | Yes |
AI use: TTS voice only, plus AI assistant help drafting the script and code (reviewed by hand). No AI images or video, and no voice or face cloning.

Music credit: "Inspired" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0 License, http://creativecommons.org/licenses/by/4.0/

## QC (2026-11-02, UTC+8)
| Check | Result |
|---|---|
| Format | H.264 1080×1920 30 fps + AAC ✅ |
| Duration 30–60 s | 43.9 s ✅ |
| Black frames / watermark | none ✅ |
| Loudness | −14.5 LUFS, peak −1.5 dBFS ✅ |
| One subtitle per sentence | 20 cues = 20 sentences ✅ |
| Captions vs VO (ASR, final mix) | 97.9 %; only diffs are "twenty/20" and "thirty/30" ✅ |
| Hook in first 3 s | block plus "not started" counter on screen from 0.3 s ✅ |
| Safe margins | checked on 15 sampled stills ✅ |
| Secrets | none ✅ |
Time spent ≈ 25 min (reusing Sample 1 components). All tools free; nothing paywalled.

Weaknesses: synthetic voice; not tested in a real app's UI overlay; the lower third under the tiles is a little empty during steps.
