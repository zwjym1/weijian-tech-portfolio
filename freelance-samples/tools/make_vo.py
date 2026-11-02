import json,sys,soundfile as sf
from kokoro_onnx import Kokoro
k=Kokoro('/workspace/freelance-samples/tts/kokoro-v1.0.onnx','/workspace/freelance-samples/tts/voices-v1.0.bin')
d=json.load(open(sys.argv[1])); out=sys.argv[2]; voice=sys.argv[3] if len(sys.argv)>3 else 'af_heart'
meta=[]; i=0
for s in d['scenes']:
  for en,zh in s['lines']:
    a,sr=k.create(en,voice=voice,speed=0.95,lang='en-us'); f=f'{out}/l{i:02d}.wav'; sf.write(f,a,sr)
    meta.append({'i':i,'scene':s['id'],'text':en,'zh':zh,'file':f'l{i:02d}.wav','dur':round(len(a)/sr,3)}); i+=1; print(i,meta[-1]['dur'],flush=True)
json.dump(meta,open(f'{out}/lines.json','w'),ensure_ascii=False,indent=1)
print('total',sum(m['dur'] for m in meta))
