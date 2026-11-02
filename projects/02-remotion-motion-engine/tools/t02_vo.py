"""T02 配音：4 个语义块（每块 3–5 句），每块只合成一次（失败才重试网络错误，不挑选）。
Fish s2.1-pro-free，voice 读 voice_config.json，key 只读环境变量。
输出 episodes/_topics/T02_waimai/ep/audio/{B0n.mp3, vo_full.wav, vo_full.json}，同步 public/t02/vo_full.wav 与 src/t02/data/vo_full.json
vo_full.json 格式与 mixue 一致：lines[i] = {shot,text(读音文本),disp(屏上原文),start,sec,segs(相对句首)}，另有 blocks"""
import json, re, shutil, subprocess, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from fish_tts import synth, dur
APP = Path(__file__).resolve().parents[1]
EP = APP.parent.parent / 'episodes/_topics/T02_waimai/ep'; OUT = EP / 'audio'; OUT.mkdir(parents=True, exist_ok=True)
VID = json.load(open(Path(__file__).parent / 'voice_config.json'))['voice_id']
# (屏上原文, 读音文本)
LINES = [
 ('美团一年少赚了近六百亿，你猜这笔钱，去哪了？', '美团一年少赚了近六百亿，你猜这笔钱，去哪了？'),
 ('2024年，核心业务赚五百二十四亿；2025年，亏六十九亿。', '二零二四年，核心业务赚五百二十四亿；二零二五年，亏六十九亿。'),
 ('年报里写了：补贴和推广，花多了。说人话，就是你手机里的零元购、满减红包——我的还没用完。', '年报里写了：补贴和推广，花多了。说人话，就是你手机里的零元购、满减红包，我的还没用完。'),
 ('更扎心：2024年，每收一百块，花七十九；2025年，每收一百块，花一百零三。', '更扎心：二零二四年，每收一百块，花七十九；二零二五年，每收一百块，花一百零三。'),
 ('就像饭局上抢着买单的人：不是钱多，是想把你变成熟客。', '就像饭局上抢着买单的人：不是钱多，是想把你变成熟客。'),
 ('那差价是平台自己掏的吗？今年六月，监管部门调查后说：不全是，有平台裹挟商家一起参加补贴。', '那差价是平台自己掏的吗？今年六月，监管部门调查后说：不全是，有平台裹挟商家一起参加补贴。'),
 ('你可能不知道：商家用平台配送，配送费也要出一份。', '你可能不知道：商家用平台配送，配送费也要出一份。'),
 ('所以这笔账，一部分商家扛，一部分股东扛：2025年，美团净亏二百三十四亿。', '所以这笔账，一部分商家扛，一部分股东扛：二零二五年，美团净亏二百三十四亿。'),
 ('今年补贴一收，二季度核心业务赚回五十七亿，利润率七点九。', '今年补贴一收，二季度核心业务赚回五十七亿，利润率七点九。'),
 ('可2024年是二十点九。美团自己说，行业补贴仍高于2024年。', '可二零二四年是二十点九。美团自己说，行业补贴仍高于二零二四年。'),
 ('所以，红包不会白发。下次领红包，先想想：这笔账，最后记在谁头上。', '所以，红包不会白发。下次领红包，先想想：这笔账，最后记在谁头上。'),
]
BLOCKS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10]]
GAP = 0.45; PRE = 0.3
P = re.compile(r'[，。；：！？、,.;:!?\s—]')
strip = lambda s: P.sub('', s)
t = PRE; lines = [None] * len(LINES); blocks = []
for b, idxs in enumerate(BLOCKS):
    text = ''.join(LINES[i][1] for i in idxs); mp3 = OUT / f'B{b+1:02d}.mp3'
    if '--reuse' in sys.argv and mp3.exists():
        segs = json.load(open(OUT / f'B{b+1:02d}.segs.json'))
    else:
        for a in range(3):
            try: segs = synth(text, mp3, VID, temp=0.6); break
            except Exception as e: print('网络重试', b, e); time.sleep(3)
        else: raise SystemExit(f'B{b+1} 失败')
        json.dump(segs, open(OUT / f'B{b+1:02d}.segs.json', 'w'), ensure_ascii=False)
    d = dur(mp3)
    # 逐字对齐（去标点后按序号）
    chars = [(c, s['start'], s['end']) for s in segs for c in strip(s['text'])]
    want = strip(text); got = ''.join(c for c, _, _ in chars)
    if want != got: print('!! 对齐文本不一致', b, want[:20], got[:20], len(want), len(got))
    k = 0
    for i in idxs:
        n = len(strip(LINES[i][1])); seg = chars[k:k + n]; k += n
        s0, s1 = seg[0][1], seg[-1][2]
        # 句内标点：在 segs 里用 punct 占位字，保证 tokens() 能按字符序列对齐（text 与 segs 同序）
        lines[i] = {'shot': f'L{i+1:02d}', 'text': LINES[i][1], 'disp': LINES[i][0], 'block': b + 1, 'start': round(t + s0, 3), 'sec': round(s1 - s0, 3),
                    'segs': [{'text': c, 'start': round(s - s0, 3), 'end': round(e - s0, 3)} for c, s, e in seg]}
    blocks.append({'block': b + 1, 'file': f'B{b+1:02d}.mp3', 'sec': round(d, 3), 'start': round(t, 3), 'lines': idxs}); print(f'B{b+1} {d:.2f}s @ {t:.2f}')
    t += d + GAP
total = round(t - GAP + 0.8, 2)
flt = ''.join(f'[{i}]adelay={int(bl["start"]*1000)}|{int(bl["start"]*1000)}[a{i}];' for i, bl in enumerate(blocks)) + ''.join(f'[a{i}]' for i in range(len(blocks))) + f'amix={len(blocks)}:normalize=0,apad,atrim=0:{total}[o]'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *sum([['-i', str(OUT / bl['file'])] for bl in blocks], []), '-filter_complex', flt, '-map', '[o]', '-ar', '48000', '-ac', '2', str(OUT / 'vo_full.wav')], check=True)
vo = {'fps': 30, 'totalSec': total, 'voice': VID, 'model': 's2.1-pro-free', 'blocks': blocks, 'lines': lines}
json.dump(vo, open(OUT / 'vo_full.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
(APP / 'public/t02').mkdir(parents=True, exist_ok=True); (APP / 'src/t02/data').mkdir(parents=True, exist_ok=True)
shutil.copy(OUT / 'vo_full.wav', APP / 'public/t02/vo_full.wav'); shutil.copy(OUT / 'vo_full.json', APP / 'src/t02/data/vo_full.json')
print('总长', total)
