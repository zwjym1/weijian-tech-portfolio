# Internal QC — Sample 1 v3 (2026-11-02 22:30, UTC+8)
File: `study_plan_1080p_v3.mp4` (69 MB)

| Check | Result |
|---|---|
| Container / codec | MP4, H.264 1920×1080 30 fps, AAC 48 kHz ✅ |
| Duration 3–5 min | 3:07.2 ✅ |
| Black frames (blackdetect d≥0.3 s, pix_th 0.05) | none ✅ |
| Watermark | none ✅ |
| Loudness | −16.2 LUFS integrated, peak −1.4 dBFS ✅ |
| BGM | ✅ CC BY 4.0 track, ducked under VO; in gaps music ≈ −24 dB RMS vs VO ≈ −19 dB |
| **One subtitle per sentence** | ✅ 81 cues = 81 sentences; 0 cues with more than one sentence (automatic check) |
| Captions vs VO | ✅ caption text is the exact TTS input sentence. ASR (whisper base.en) on VO only: 98.9 % word match (diffs: "ten/10", "weeknights/week nights", "deadlines" heard as "read lines"). On final mix: 97.3 % — extra diffs are ASR mistakes on short words under music ("Three", "Quick", "Monday") |
| Attention beats | ✅ cold open ≤3 s, open loop 0:32 → payoff 1:56, section wipes 0:38 / 1:23 / 2:08, interrupts ≈ every 4–12 s — see ATTENTION_CURVE.md and keyframes/attention_strip_v3.jpg |
| Educational accuracy | ✅ no statistics or guaranteed results; "EXAMPLE WEEK" label; "Your week will look different" |
| Personal-sample label | ✅ end card + docs |
| Secrets | none ✅ |

## Known weaknesses
- Kokoro TTS: "Deadlines go first" may sound slightly like "read lines"; a human read would fix it.
- Short one-word sentences ("Done.", "Classes.") stay on screen for less than 1 s. That is intentional for rhythm, but fast for non-native readers.
- Checked with 16 keyframes and 34 sampled stills, not frame by frame.
- Background music is a well-known free track (Kevin MacLeod), so it may sound familiar on YouTube.
