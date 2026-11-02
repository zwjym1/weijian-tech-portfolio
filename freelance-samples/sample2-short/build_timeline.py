"""Sentence-level timeline (one caption cue per sentence) + VO mix + BGM ducked under VO."""
import json,subprocess,numpy as np,soundfile as sf
S=json.load(open('audio/lines.json')); sr=24000; FPS=30
GAP_SENT,GAP_LINE,GAP_SCENE=0.3,0.6,0.9
t=0.15; prev=None; out=[]
for m in S:
  if prev:
    t+= GAP_SCENE if m['scene']!=prev['scene'] else GAP_LINE if m['line']!=prev['line'] else GAP_SENT
  out.append({**m,'start':round(t,3),'end':round(t+m['dur'],3)}); t+=m['dur']; prev=m
total=round(t+3.5,3)
buf=np.zeros(int(total*sr),dtype=np.float32)
for m in out:
  a,_=sf.read('audio/'+m['file'],dtype='float32'); s=int(m['start']*sr); buf[s:s+len(a)]+=a
buf*=0.89/np.abs(buf).max(); sf.write('/tmp/vo_only.wav',buf,sr)
# BGM: "Inspired" Kevin MacLeod (incompetech.com), CC BY 4.0. -> duck with sidechain compression, fade out at end
fo=total-3.5
subprocess.run(['ffmpeg','-loglevel','error','-y','-i','/tmp/vo_only.wav','-i','bgm/Inspired.mp3','-filter_complex',
 f"[1:a]atrim=12:{total+12},asetpts=N/SR/TB,aresample=48000,volume=0.14,afade=t=in:d=0.4,afade=t=out:st={fo}:d=3.5[m];"
 "[0:a]aresample=48000,asplit=2[v][sc];"
 "[m][sc]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350[md];"
 "[v][md]amix=inputs=2:normalize=0:duration=first[out]",'-map','[out]','-ar','48000','remotion/public/mix.wav'],check=True)
lines={}
for m in out: lines.setdefault(m['line'],m['start'])
json.dump({'fps':FPS,'duration':total,'cues':out,'lineStart':[lines[i] for i in sorted(lines)]},open('remotion/src/timeline.json','w'),ensure_ascii=False,indent=1)
print('duration',total,'cues',len(out))
for i in sorted(lines): print(i, lines[i], next(m['line_text'] for m in out if m['line']==i)[:50])
