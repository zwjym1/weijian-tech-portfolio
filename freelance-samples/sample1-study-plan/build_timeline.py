import json,numpy as np,soundfile as sf
L=json.load(open('audio/lines.json')); sr=24000; FPS=30
t=1.0; prev=None; out=[]
for m in L:
  if prev and m['scene']!=prev: t+=1.0
  out.append({**m,'start':round(t,3),'end':round(t+m['dur'],3)}); t+=m['dur']+0.55; prev=m['scene']
total=t+5.0
buf=np.zeros(int(total*sr),dtype=np.float32)
for m in out:
  a,_=sf.read('audio/'+m['file'],dtype='float32'); s=int(m['start']*sr); buf[s:s+len(a)]+=a
pk=np.abs(buf).max(); buf*=0.89/pk
sf.write('remotion/public/vo.wav',buf,sr)
json.dump({'fps':FPS,'duration':round(total,3),'lines':out},open('remotion/src/timeline.json','w'),ensure_ascii=False,indent=1)
print('duration',total)
