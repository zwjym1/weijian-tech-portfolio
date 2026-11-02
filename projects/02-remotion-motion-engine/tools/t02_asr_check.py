"""ASR 对齐核对：faster-whisper small（本地）转写每个语义块，和 Fish 字级时间戳比较，输出 ep/audio/asr_check.json
只用来核对重音词落点偏差，不改配音。"""
import json, re, subprocess, sys
import numpy as np
from pathlib import Path
from faster_whisper import WhisperModel
APP = Path(__file__).resolve().parents[1]; OUT = APP.parent.parent / 'episodes/_topics/T02_waimai/ep/audio'
vo = json.load(open(OUT / 'vo_full.json')); m = WhisperModel('small', device='cpu', compute_type='int8')
load = lambda p: np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','s16le','-ac','1','-ar','16000','-']),np.int16).astype(np.float32)/32768
res = []
for b in vo['blocks']:
    segs, _ = m.transcribe(load(OUT / b['file']), language='zh', word_timestamps=True, initial_prompt='以下是普通话财经解说，讲美团、年报、补贴。')
    words = [(w.word, w.start, w.end) for s in segs for w in s.words]
    res.append({'block': b['block'], 'asr_text': ''.join(w[0] for w in words), 'words': words})
    print('B', b['block'], ''.join(w[0] for w in words))
json.dump(res, open(OUT / 'asr_check.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
