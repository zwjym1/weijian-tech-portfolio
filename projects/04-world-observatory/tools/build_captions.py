"""timings.json（逐词时间戳）+ keywords.json → captions.json（一句一条字幕 + 重点词区间）。
拆句：按 ，。？！；： 拆；超过 14 字的句子在词边界处再拆。句末标点不显示。"""
import json, re
from pathlib import Path
APP = Path(__file__).resolve().parents[1]
T = json.load(open(APP / 'src/data/timings.json', encoding='utf-8'))
NUM = json.load(open(APP / 'src/data/display_numbers.json', encoding='utf-8'))['map']
K = json.load(open(APP / 'src/data/keywords.json', encoding='utf-8'))
SH = {s['id']: s for s in json.load(open(APP.parent / 'episodes/E001-membership/shotlist.json', encoding='utf-8'))['shots']}
MAX = 14; PUNCT = '，。？！；：'; SKIP = set(PUNCT + '“”"、 ')
out = {'_说明': '自动生成，勿手改；改重点词请改 keywords.json', 'shots': {}}
for t in T['shots']:
    text = SH[t['id']]['narration']; words = t['words']
    # 每个可发音字符 → 所属词的时间
    ct, wi, pos = [], 0, 0
    for w in words:
        idx = text.find(w['text'], pos)
        if idx < 0: raise SystemExit(f"{t['id']} 对不上: {w['text']}")
        for k, ch in enumerate(w['text']): ct.append((idx + k, w['start'], w['end'], wi))
        pos = idx + len(w['text']); wi += 1
    cmap = {c[0]: c for c in ct}
    # 先按标点拆
    clauses, cur = [], ''
    for i, ch in enumerate(text):
        cur += ch
        if ch in PUNCT: clauses.append((i - len(cur) + 1, cur)); cur = ''
    if cur: clauses.append((len(text) - len(cur), cur))
    # 长句按词边界再拆
    pieces = []
    for st, cl in clauses:
        body = cl.rstrip(PUNCT)
        if len(body) <= MAX: pieces.append((st, body)); continue
        q = body.find('“')
        if 0 < q and len(body) - q <= MAX and q <= MAX: pieces += [(st, body[:q]), (st + q, body[q:])]; continue
        n = -(-len(body) // MAX); target = len(body) / n
        cuts = sorted({c[0] - st for c in ct if st < c[0] < st + len(body) and cmap.get(c[0] - 1, (0, 0, 0, -1))[3] != c[3]})
        chosen, last = [], 0
        for _ in range(n - 1):
            best = min((c for c in cuts if c > last), key=lambda c: abs(c - (last + target)))
            chosen.append(best); last = best
        b = [0] + chosen + [len(body)]
        for a, z in zip(b, b[1:]): pieces.append((st + a, body[a:z]))
    lines = []
    for st, body in pieces:
        spoken = [cmap[i] for i in range(st, st + len(body)) if i in cmap]
        start = spoken[0][1]; end = spoken[-1][2]
        body2 = body.strip('，。？！；：')
        # 原文→显示文本，同时记录显示文本每段对应的原文区间，便于按真实语音时间点亮重点词
        disp, i = '', 0
        spans = []  # (disp_start, disp_end, orig_start, orig_end)
        while i < len(body2):
            for a, b in NUM:
                if body2.startswith(a, i):
                    spans.append((len(disp), len(disp) + len(b), i, i + len(a))); disp += b; i += len(a); break
            else:
                spans.append((len(disp), len(disp) + 1, i, i + 1)); disp += body2[i]; i += 1
        def otime(o0, o1):
            ts = [cmap[st + k] for k in range(o0, o1) if st + k in cmap]
            return (ts[0][1], ts[-1][2]) if ts else (start, end)
        kws = []
        for kw in K.get(t['id'], []):
            j = body2.find(kw['w'])
            if j < 0: continue
            dj0 = next(sp[0] for sp in spans if sp[2] <= j < sp[3]); dj1 = next(sp[1] for sp in spans if sp[2] < j + len(kw['w']) <= sp[3])
            ks, ke = otime(j, j + len(kw['w']))
            kws.append({'w': disp[dj0:dj1], 'i': dj0, 'c': kw.get('c', 'amber'), 't': round(ks, 3), 'te': round(ke, 3)})
        lines.append({'text': disp, 'start': round(start, 3), 'end': round(end, 3), 'keywords': kws})
    for a, b in zip(lines, lines[1:]): a['hold'] = round(b['start'], 3)   # 显示到下一句开始
    lines[-1]['hold'] = t['audioSec']
    out['shots'][t['id']] = lines
    for l in lines: assert len(l['text']) <= MAX, l
    missing = [k['w'] for k in K.get(t['id'], []) if not any(k['w'] in SH[t['id']]['narration'] for _ in [0])]
    if missing: print('WARN 未命中', t['id'], missing)
json.dump(out, open(APP / 'src/data/captions.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for k, v in out['shots'].items(): print(k, ' | '.join(f"{l['text']}[{l['start']}-{l['end']}]{'/'.join(x['w'] for x in l['keywords'])}" for l in v))
