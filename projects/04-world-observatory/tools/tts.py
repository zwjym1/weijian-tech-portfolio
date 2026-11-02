"""edge-tts 免费配音：逐镜生成 mp3 + 逐词 boundary，输出 src/data/timings.json。
用法：python3 tools/tts.py [voice]   （默认 zh-CN-YunyangNeural）"""
import asyncio, json, math, subprocess, sys
from pathlib import Path
import edge_tts
APP = Path(__file__).resolve().parents[1]
SHOTS = json.load(open(APP.parent / 'episodes/E001-membership/shotlist.json', encoding='utf-8'))['shots']
VOICE = sys.argv[1] if len(sys.argv) > 1 else 'zh-CN-YunyangNeural'
RATE, TAIL, FPS = '+0%', 0.35, 30
dur = lambda p: float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)], text=True))
async def main():
    out, t = [], 0.0
    for s in SHOTS:
        raw = APP / f'public/audio/{s["id"]}_raw.mp3'; meta = APP / f'public/audio/{s["id"]}.jsonl'; mp3 = APP / f'public/audio/{s["id"]}.mp3'
        await edge_tts.Communicate(s['narration'], VOICE, rate=RATE, boundary='WordBoundary').save(str(raw), str(meta))
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-af', f'apad=pad_dur={TAIL}', '-ar', '48000', '-b:a', '160k', str(mp3)], check=True)
        raw.unlink()
        words = [{'text': j['text'], 'start': j['offset'] / 1e7, 'end': (j['offset'] + j['duration']) / 1e7}
                 for j in map(json.loads, meta.read_text(encoding='utf-8').splitlines()) if j.get('type') == 'WordBoundary']
        meta.unlink()
        d = dur(mp3); frames = math.ceil(d * FPS)
        out.append({'id': s['id'], 'audio': f'audio/{s["id"]}.mp3', 'audioSec': round(d, 3), 'frames': frames, 'fromSec': round(t, 3), 'words': words})
        t += frames / FPS
        print(s['id'], round(d, 2), len(words))
    (APP / 'src/data').mkdir(exist_ok=True)
    json.dump({'voice': VOICE, 'rate': RATE, 'tailSec': TAIL, 'totalSec': round(t, 3), 'shots': out}, open(APP / 'src/data/timings.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('total', round(t, 2))
asyncio.run(main())
