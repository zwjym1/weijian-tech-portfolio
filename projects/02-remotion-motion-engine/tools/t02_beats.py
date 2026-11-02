"""实测节拍表：Fish 字级对齐 + faster-whisper 交叉核对 → episodes/_topics/T02_waimai/BEAT_TABLE_measured.md + beats.json"""
import json, re
from pathlib import Path
A = Path(__file__).resolve().parents[3] / 'episodes/_topics/T02_waimai'; OUT = A / 'ep/audio'
vo = json.load(open(OUT / 'vo_full.json')); asr = json.load(open(OUT / 'asr_check.json'))
# 逐句：重音词（读音文本中的词，屏上显示）
HITS = {0: [('近六百亿', '近600亿'), ('去哪了', '去哪了')], 1: [('五百二十四亿', '524亿'), ('六十九亿', '69亿')], 2: [('说人话', '说人话'), ('红包', '红包'), ('没用完', '没用完')],
        3: [('七十九', '79'), ('一百零三', '103')], 4: [('买单', '买单'), ('熟客', '熟客')], 5: [('不全是', '不全是'), ('裹挟商家', '裹挟商家')], 6: [('不知道', '不知道'), ('也要出一份', '也要出一份')],
        7: [('商家扛', '商家扛'), ('股东扛', '股东扛'), ('二百三十四亿', '234亿')], 8: [('五十七亿', '57亿'), ('七点九', '7.9%')], 9: [('二十点九', '20.9%'), ('仍高于', '仍高于')], 10: [('不会白发', '不会白发'), ('谁头上', '谁头上')]}
def pos(l, w):
    tx = ''.join(s['text'] for s in l['segs']); p = tx.index(w); q = p + len(w) - 1
    return l['start'] + l['segs'][p]['start'], l['start'] + l['segs'][q]['end']
# ASR 字级时间（块内时间 + 块起点 → 全片）
asr_chars = []
for b, a in zip(vo['blocks'], asr):
    for w, s, e in a['words']:
        n = max(1, len(w)); 
        for k, c in enumerate(w): asr_chars.append((c, b['start'] + s + (e - s) * k / n))
atxt = ''.join(c for c, _ in asr_chars)
rows = []; devs = []
for i, l in enumerate(vo['lines']):
    for w, disp in HITS[i]:
        s, e = pos(l, w); asr_t = None
        # ASR 里用句内附近窗口匹配词的首字
        lo = max(0, int(len(atxt) * 0)); cands = [k for k in range(len(atxt) - len(w) + 1) if atxt[k:k + len(w)] == w and abs(asr_chars[k][1] - s) < 2.0]
        if cands: asr_t = asr_chars[cands[0]][1]; devs.append(abs(asr_t - s))
        rows.append((i, disp, s, e, asr_t))
beats = {'total': vo['totalSec'], 'lines': [{'shot': l['shot'], 'start': l['start'], 'end': round(l['start'] + l['sec'], 3), 'text': l['disp']} for l in vo['lines']],
         'hits': [{'line': f'L{i+1:02d}', 'word': d, 'start': round(s, 2), 'end': round(e, 2), 'asr_start': None if a is None else round(a, 2)} for i, d, s, e, a in rows]}
json.dump(beats, open(A / 'ep/beats.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
md = ['# T02 实测节拍表（Fish 字级对齐，faster-whisper small 交叉核对）', f'全片配音总长 {vo["totalSec"]}s（4 个语义块，各合成一次）；块：' + '；'.join(f'B{b["block"]} {b["start"]}s 起 {b["sec"]}s（L{b["lines"][0]+1:02d}–L{b["lines"][-1]+1:02d}）' for b in vo['blocks']), '',
      '| 句 | 起拍 → 句末 (s) | 口播（屏上显示） | 重音落点：词 @ 开始→结束 (s) [ASR 起点] |', '|---|---|---|---|']
for i, l in enumerate(vo['lines']):
    hs = '；'.join(f'{d} @ {s:.2f}→{e:.2f}' + (f' [{a:.2f}]' if a is not None else '') for j, d, s, e, a in rows if j == i)
    md.append(f'| L{i+1:02d} | {l["start"]:.2f} → {l["start"]+l["sec"]:.2f} | {l["disp"]} | {hs} |')
if devs: md += ['', f'ASR 核对：{len(devs)}/{len(rows)} 个重音词能在 ASR 转写里定位，起点偏差 平均 {sum(devs)/len(devs):.2f}s、最大 {max(devs):.2f}s（ASR 是机器转写，数字常转成阿拉伯数字导致个别词无法匹配，画面卡点以 Fish 对齐为准）。']
(A / 'BEAT_TABLE_measured.md').write_text('\n'.join(md), encoding='utf-8'); print('\n'.join(md))
