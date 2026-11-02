"""Fish Audio 配音（模型 s2.1-pro-free，$0；密钥只读环境变量 FISH_API_KEY 或 app/.env，不打印、不落盘）。
用法：
  fish_tts.py shots [reference_id]          全稿逐镜生成 → public/audio/SHxx.mp3 + src/data/timings.json
  fish_tts.py sample <out.mp3> <ref> <text> 单句试听
"""
import base64, json, math, os, subprocess, sys, time
from pathlib import Path
import requests
APP = Path(__file__).resolve().parents[1]
MODEL = 's2.1-pro-free'; MAIN_REF = 'b4bdf5dc66004241a21ff2df165bf442'; TAIL, FPS = 0.35, 30
def key():
    k = os.environ.get('FISH_API_KEY')
    if not k and (APP / '.env').exists():
        for l in (APP / '.env').read_text().splitlines():
            if l.startswith('FISH_API_KEY='): k = l.split('=', 1)[1].strip()
    if not k: raise SystemExit('缺少 FISH_API_KEY')
    return k
def synth(text, path, ref, speed=float(os.environ.get('FISH_SPEED', '0.95')), temp=0.7):
    s = requests.Session(); s.trust_env = False
    body = {'text': text, 'format': 'mp3', 'temperature': temp, 'prosody': {'speed': speed, 'volume': 0}, 'latency': 'normal', 'reference_id': ref}
    r = s.post('https://api.fish.audio/v1/tts/stream/with-timestamp', headers={'Authorization': 'Bearer ' + key(), 'model': MODEL, 'Content-Type': 'application/json'}, json=body, timeout=180)
    if not r.ok: raise RuntimeError(f'HTTP {r.status_code}: {r.text[:200]}')
    chunks, snaps = [], {}
    for line in r.content.decode('utf-8').splitlines():
        if not line.startswith('data: '): continue
        ev = json.loads(line[6:])
        if ev.get('audio_base64'): chunks.append(base64.b64decode(ev['audio_base64']))
        if ev.get('alignment'): snaps[ev.get('chunk_seq', 0)] = ev
    Path(path).write_bytes(b''.join(chunks))
    segs = []
    for k in sorted(snaps):
        ev = snaps[k]; off = ev.get('chunk_audio_offset_sec', 0)
        for sg in ev['alignment']['segments']: segs.append({'text': sg['text'], 'start': off + sg['start'], 'end': off + sg['end']})
    return segs
dur = lambda p: float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)], text=True))
if __name__ == '__main__':
    if sys.argv[1] == 'sample':
        segs = synth(sys.argv[4], sys.argv[2], sys.argv[3]); print('ok', round(dur(sys.argv[2]), 2), len(segs)); sys.exit()
    ref = sys.argv[2] if len(sys.argv) > 2 else MAIN_REF
    shots = json.load(open(APP.parent / 'episodes/E001-membership/shotlist.json', encoding='utf-8'))['shots']
    out, t = [], 0.0
    for s in shots:
        raw = APP / f'public/audio/{s["id"]}_raw.mp3'; mp3 = APP / f'public/audio/{s["id"]}.mp3'
        for a in range(3):
            try: segs = synth(s['narration'], raw, ref); break
            except Exception as e: print(s['id'], 'retry', e); time.sleep(3)
        else: raise SystemExit(s['id'] + ' 失败')
        # 去掉首尾静音外的多余部分不做；只补尾静音并统一采样率
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-af', f'apad=pad_dur={TAIL}', '-ar', '48000', '-b:a', '160k', str(mp3)], check=True); raw.unlink()
        d = dur(mp3); frames = math.ceil(d * FPS)
        out.append({'id': s['id'], 'audio': f'audio/{s["id"]}.mp3', 'audioSec': round(d, 3), 'frames': frames, 'fromSec': round(t, 3), 'words': segs})
        t += frames / FPS; print(s['id'], round(d, 2), len(segs), flush=True)
    json.dump({'engine': 'fish', 'model': MODEL, 'voice': ref, 'tailSec': TAIL, 'totalSec': round(t, 3), 'shots': out},
              open(APP / 'src/data/timings.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('total', round(t, 2))
