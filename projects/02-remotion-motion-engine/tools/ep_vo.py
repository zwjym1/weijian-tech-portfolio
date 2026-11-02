"""通用整集配音：python3 tools/ep_vo.py <EP目录> <public子目录名> [--gap 0.35]
读 <EP>/script/lines.json → Fish（voice_config.json 音色，key 只读环境变量）→ <EP>/audio/Lnn.mp3 + vo_full.wav + vo_full.json + storyboard/timeline.json；同步 public/<sub>/ 与 src/<sub>/data/vo_full.json"""
import json, shutil, subprocess, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from fish_tts import synth, dur
APP = Path(__file__).resolve().parents[1]
EP = Path(sys.argv[1]); SUB = sys.argv[2]; GAP = float(sys.argv[sys.argv.index('--gap') + 1]) if '--gap' in sys.argv else 0.35
VID = json.load(open(Path(__file__).parent / 'voice_config.json'))['voice_id']
lines = json.load(open(EP / 'script/lines.json', encoding='utf-8')); out = EP / 'audio'; out.mkdir(exist_ok=True)
only = [int(x) for x in sys.argv[sys.argv.index('--only') + 1].split(',')] if '--only' in sys.argv else None
old = json.load(open(out / 'vo_full.json')) if only and (out / 'vo_full.json').exists() else None
res, t = [], 0.3
for i, (shot, text) in enumerate(lines):
    mp3 = out / f'L{i:02d}.mp3'
    if old and i not in only and i < len(old['lines']) and old['lines'][i]['text'] == text: segs = old['lines'][i]['segs']
    else:
        for a in range(3):
            try: segs = synth(text, mp3, VID); break
            except Exception as e: print('retry', i, e); time.sleep(3)
        else: raise SystemExit(f'L{i:02d} 失败')
    d = dur(mp3); res.append({'shot': shot, 'text': text, 'file': f'L{i:02d}.mp3', 'sec': round(d, 3), 'start': round(t, 3), 'segs': segs}); print(f'L{i:02d} {d:.2f}s'); t += d + GAP
total = round(t - GAP + 0.8, 2)
flt = ''.join(f'[{i}]adelay={int(r["start"]*1000)}|{int(r["start"]*1000)}[a{i}];' for i, r in enumerate(res)) + ''.join(f'[a{i}]' for i in range(len(res))) + f'amix={len(res)}:normalize=0,apad,atrim=0:{total}[o]'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *sum([['-i', str(out / f'L{i:02d}.mp3')] for i in range(len(res))], []), '-filter_complex', flt, '-map', '[o]', '-ar', '48000', '-ac', '2', str(out / 'vo_full.wav')], check=True)
vo = {'fps': 30, 'totalSec': total, 'voice': VID, 'lines': res}
json.dump(vo, open(out / 'vo_full.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
(EP / 'storyboard').mkdir(exist_ok=True)
json.dump({'totalSec': total, 'items': [{'shot': r['shot'], 'start': r['start'], 'end': round(r['start'] + r['sec'], 3), 'voice': r['text']} for r in res]}, open(EP / 'storyboard/timeline.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
(APP / f'public/{SUB}').mkdir(parents=True, exist_ok=True); (APP / f'src/{SUB}/data').mkdir(parents=True, exist_ok=True)
shutil.copy(out / 'vo_full.wav', APP / f'public/{SUB}/vo_full.wav'); shutil.copy(out / 'vo_full.json', APP / f'src/{SUB}/data/vo_full.json')
print('总长', total)
