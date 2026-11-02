"""用 faster-whisper（本地开源，small 模型，CPU）把每镜配音转写，和原稿按拼音（不计声调）对比；同时比对 Fish 字级时间戳与 whisper 词级时间戳的偏差。
输出 src/data/asr_check.json"""
import json, re, difflib, subprocess
import numpy as np
def load(p): return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','s16le','-ac','1','-ar','16000','-']),np.int16).astype(np.float32)/32768
from pathlib import Path
from faster_whisper import WhisperModel
from pypinyin import lazy_pinyin
APP = Path(__file__).resolve().parents[1]
T = json.load(open(APP / 'src/data/timings.json', encoding='utf-8'))
SH = {s['id']: s['narration'] for s in json.load(open(APP.parent / 'episodes/E001-membership/shotlist.json', encoding='utf-8'))['shots']}
D='零一二三四五六七八九'
def n2c(n):
    n=int(n)
    if n<10: return D[n]
    out='';units=[(1000,'千'),(100,'百'),(10,'十')];zero=False
    for u,c in units:
        q=n//u; n%=u
        if q: out+=('两' if q==2 and u>=100 else D[q])+c if not(u==10 and q==1 and not out) else c; zero=False
        elif out: zero=True
    if n: out+=('零' if zero else '')+D[n]
    return out
def norm(s):
    s=re.sub(r'(\d+)%',lambda m:'百分之'+n2c(m.group(1)),s)
    s=re.sub(r'\d+',lambda m:n2c(m.group(0)),s)
    return re.sub(r'[^\w]','',s.lower()).replace('儿','')
m = WhisperModel('small', device='cpu', compute_type='int8')
rep, tot_err, tot_len, drift = [], 0, 0, []
for s in T['shots']:
    segs, _ = m.transcribe(load(APP / 'public' / s['audio']), language='zh', word_timestamps=True, initial_prompt='以下是普通话解说，讲会员卡、年费、Costco。')
    segs = list(segs); hyp = ''.join(x.text for x in segs); ref = SH[s['id']]
    a, b = lazy_pinyin(norm(ref)), lazy_pinyin(norm(hyp))
    ops = [(op, ''.join(a[i1:i2]), ''.join(b[j1:j2])) for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes() if op != 'equal']
    err = sum(max(len(a[0:0]) + 1, 1) for _ in ops)
    e = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes() if op != 'equal')
    tot_err += e; tot_len += len(a)
    # 时间戳偏差：whisper 每个词首字 vs fish 同一字
    fw = s['words']; fi = 0
    for seg in segs:
        for w in (seg.words or []):
            t = w.word.strip()
            if not t: continue
            for j in range(fi, min(fi + 6, len(fw))):
                if fw[j]['text'] and fw[j]['text'][0] == t[0]: drift.append(abs(fw[j]['start'] - w.start)); fi = j + 1; break
    rep.append({'id': s['id'], 'ref': ref, 'asr': hyp, 'pinyin_diffs': ops, 'err_syllables': e})
    print(s['id'], e, hyp)
drift.sort()
res = {'model': 'faster-whisper small int8', 'pinyin_err_rate_toneless': round(tot_err / tot_len, 4), 'syllables': tot_len,
       'fish_vs_whisper_onset_diff_sec': {'n': len(drift), 'median': round(drift[len(drift) // 2], 3), 'p90': round(drift[int(len(drift) * .9)], 3)}, 'shots': rep}
json.dump(res, open(APP / 'src/data/asr_check.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print({k: v for k, v in res.items() if k != 'shots'})
