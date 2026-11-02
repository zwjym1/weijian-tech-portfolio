"""E001 一键重配音（拿到 Fish 音色 ID 后运行；不改音色就不要跑）。
用法：
  FISH_API_KEY=... python3 tools/regen_vo.py <VOICE_ID> [台词json，默认 episodes/E001/script/lines.json] [--gap 0.4] [--dry]
做什么：
  1) 逐句调 Fish（模型 s2.1-pro-free，$0）→ episodes/E001/audio/vo_<ID前8位>/L00..Lnn.mp3 + 字级时间戳
  2) 句间留 gap 秒、首句 0.3s 起 → 拼 E001_vo_full.wav（48k），写 vo_full.json（同旧格式：lines[shot,text,file,sec,start,segs]）
  3) 按新时长重写 timeline.json 的 start/end（其他字段保留）
  4) 同步到工程：public/g6/audio/E001_vo_full.wav、public/g6/vo/Lnn.mp3、public/g4/vo0-2.mp3+vo.json、src/g6/data/{vo_full,timeline}.json
  5) 旧文件先备份到 audio/_backup_<时间>/
  --dry 只打印计划不调 API。之后：npx remotion render G7-E001 ... 即可（G4 片头 V 帧位来自 public/g4/vo.json，见 G7_REPORT）。
"""
import json, os, shutil, subprocess, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
APP = Path(__file__).resolve().parents[1]; ROOT = APP.parents[1]; EP = ROOT / 'episodes/E001'
_a = sys.argv[1:]; args = [a for i, a in enumerate(_a) if not a.startswith('--') and not (i and _a[i-1] == '--gap')]
CFG = json.load(open(Path(__file__).parent / 'voice_config.json'))
if args and not args[0].endswith('.json'): VID = args.pop(0)
else: VID = CFG['voice_id']  # 默认音色（tools/voice_config.json）
LINES = Path(args[0]) if args else EP / 'script/lines.json'
GAP = float(sys.argv[sys.argv.index('--gap') + 1]) if '--gap' in sys.argv else 0.4
DRY = '--dry' in sys.argv
lines = json.load(open(LINES, encoding='utf-8'))
out = EP / f'audio/vo_{VID[:8]}'; out.mkdir(parents=True, exist_ok=True)
print(f'音色 {VID}，{len(lines)} 句，句间 {GAP}s，输出 {out}')
if DRY: [print(i, s, t) for i, (s, t) in enumerate(lines)]; sys.exit()
from fish_tts import synth, dur
res, t = [], 0.3
for i, (shot, text) in enumerate(lines):
    mp3 = out / f'L{i:02d}.mp3'
    for a in range(3):
        try: segs = synth(text, mp3, VID); break
        except Exception as e: print('retry', i, e); time.sleep(3)
    else: raise SystemExit(f'L{i:02d} 失败')
    d = dur(mp3); res.append({'shot': shot, 'text': text, 'file': f'audio/L{i:02d}.mp3', 'sec': round(d, 3), 'start': round(t, 3), 'segs': segs}); print(f'L{i:02d} {d:.2f}s'); t += d + GAP
total = round(t - GAP + 0.5, 2)
# 拼整轨
flt = ''.join(f'[{i}]adelay={int(r["start"]*1000)}|{int(r["start"]*1000)}[a{i}];' for i, r in enumerate(res)) + ''.join(f'[a{i}]' for i in range(len(res))) + f'amix={len(res)}:normalize=0,apad,atrim=0:{total}[o]'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *sum([['-i', str(out / f'L{i:02d}.mp3')] for i in range(len(res))], []), '-filter_complex', flt, '-map', '[o]', '-ar', '48000', '-ac', '2', str(out / 'E001_vo_full.wav')], check=True)
vo = {'fps': 30, 'totalSec': total, 'voice': VID, 'lines': res}; json.dump(vo, open(out / 'vo_full.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
tl = json.load(open(EP / 'storyboard/timeline.json', encoding='utf-8')); tl['totalSec'] = total
for it, r in zip(tl['items'], res): it['start'] = r['start']; it['end'] = round(r['start'] + r['sec'], 3); it['voice'] = r['text']
# 备份 + 同步
bk = EP / f'audio/_backup_{time.strftime("%Y%m%d_%H%M")}'; bk.mkdir()
for p in [EP / 'audio/E001_vo_full.wav', EP / 'audio/vo_full.json', EP / 'storyboard/timeline.json']: shutil.copy(p, bk)
json.dump(tl, open(EP / 'storyboard/timeline.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
shutil.copy(out / 'E001_vo_full.wav', EP / 'audio/E001_vo_full.wav'); shutil.copy(out / 'vo_full.json', EP / 'audio/vo_full.json')
shutil.copy(out / 'E001_vo_full.wav', APP / 'public/g6/audio/E001_vo_full.wav')
for i in range(len(res)): shutil.copy(out / f'L{i:02d}.mp3', APP / f'public/g6/vo/L{i:02d}.mp3')
for i in range(3): shutil.copy(out / f'L{i:02d}.mp3', APP / f'public/g4/vo{i}.mp3')
json.dump([{'text': r['text'], 'file': f'vo{i}.mp3', 'sec': r['sec'], 'start': r['start'], 'segs': r['segs']} for i, r in enumerate(res[:3])], open(APP / 'public/g4/vo.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
shutil.copy(EP / 'audio/vo_full.json', APP / 'src/g6/data/vo_full.json'); shutil.copy(EP / 'storyboard/timeline.json', APP / 'src/g6/data/timeline.json')
print('完成，总长', total, 's；备份在', bk)
