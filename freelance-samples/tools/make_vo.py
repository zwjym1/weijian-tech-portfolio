"""Kokoro TTS (Apache-2.0), one wav per SENTENCE (one subtitle cue per sentence)."""
import json,sys,re,soundfile as sf
from kokoro_onnx import Kokoro
k=Kokoro('/workspace/freelance-samples/tts/kokoro-v1.0.onnx','/workspace/freelance-samples/tts/voices-v1.0.bin')
d=json.load(open(sys.argv[1])); out=sys.argv[2]; voice=sys.argv[3] if len(sys.argv)>3 else 'af_heart'
meta=[]; li=0; n=0
for s in d['scenes']:
  for en,zh in s['lines']:
    for si,sent in enumerate(re.split(r'(?<=[.?!])\s+',en.strip())):
      a,sr=k.create(sent,voice=voice,speed=0.92,lang='en-us'); f=f's{n:03d}.wav'; sf.write(f'{out}/{f}',a,sr)
      meta.append({'n':n,'line':li,'sent':si,'scene':s['id'],'text':sent,'zh':zh if si==0 else '','line_text':en,'file':f,'dur':round(len(a)/sr,3)}); n+=1
    li+=1
json.dump(meta,open(f'{out}/lines.json','w'),ensure_ascii=False,indent=1)
print('sentences',n,'lines',li,'total',round(sum(m['dur'] for m in meta),1))
