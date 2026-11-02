"""Sample 3 timeline: intro card -> real Shotcut recording segments (one per step) -> outro.
One caption cue per sentence; VO (Kokoro) + BGM (CC BY 4.0) ducked with sidechain compression."""
import json,subprocess,numpy as np,soundfile as sf
V=json.load(open('audio/vo/lines.json')); sr=24000; FPS=30
R=float(open('recording/rec_start.txt').read())
steps={}
for l in open('recording/steps.jsonl'):
    d=json.loads(l); steps[d['step']]=d          # last take of each step wins
LABEL={'s01':'Import the clip','s02':'Add it to the timeline','s03':'Open Subtitles','s04':'Create a caption track',
 's05':'Add the first caption','s06':'Set the end','s07':'Repeat for each line','s08':'Burn in on output',
 's09':'Check the timing','s10':'Fix a start time','s11':'Open the burn-in filter','s12':'Reposition + restyle',
 's13':'Export','s14':'Render','s15':'Check the result'}
CHAP={'s01':1,'s02':1,'s03':2,'s04':2,'s05':2,'s06':2,'s07':2,'s08':2,'s09':3,'s10':3,'s11':4,'s12':4,'s13':5,'s14':5,'s15':5}
RATE={'s07':2.0,'s14':2.0}
GAP_SENT,GAP_LINE=0.35,0.7
t=0.6; cues=[]; segs=[]; scenes=[]
def put(ms,start):
    tt=start
    for i,m in enumerate(ms):
        if i: tt+= GAP_LINE if m['line']!=ms[i-1]['line'] else GAP_SENT
        cues.append({**m,'start':round(tt,3),'end':round(tt+m['dur'],3)}); tt+=m['dur']
    return tt
# intro card
intro=[m for m in V if m['scene']=='intro']; e=put(intro,1.2); scenes.append({'id':'intro','start':0,'end':round(e+0.9,3)}); t=e+0.9
for sid in [f's{i:02d}' for i in range(1,16)]:
    d=steps[sid]; rate=RATE.get(sid,1.0); rs=d['t0']-R; re_=d['t1']-R; dur=(re_-rs)/rate
    ms=[m for m in V if m['scene']==sid]; ve=put(ms,t+0.35)
    dur=max(dur,ve-t+0.4)
    segs.append({'id':sid,'label':LABEL[sid],'chap':CHAP[sid],'start':round(t,3),'dur':round(dur,3),'recStart':round(rs,3),'rate':rate,
                 'clicks':[{'t':round(t+(c[0]-d['t0'])/rate,3),'x':c[1],'y':c[2]} for c in d['clicks']]})
    t+=dur
outro=[m for m in V if m['scene']=='outro']; os_=t; e=put(outro,t+0.6); scenes.append({'id':'outro','start':round(os_,3),'end':round(e+4.0,3)})
total=round(e+4.0,3)
buf=np.zeros(int(total*sr)+sr,dtype=np.float32)
for m in cues:
    a,_=sf.read('audio/vo/'+m['file'],dtype='float32'); s=int(m['start']*sr); buf[s:s+len(a)]+=a
buf*=0.89/np.abs(buf).max(); sf.write('/tmp/s3_vo.wav',buf[:int(total*sr)],sr)
fo=total-4
# BGM: "Inspired" Kevin MacLeod (incompetech.com), CC BY 4.0. Looped (aloop) to cover the runtime, ducked under VO.
subprocess.run(['ffmpeg','-loglevel','error','-y','-i','/tmp/s3_vo.wav','-stream_loop','-1','-i','bgm/Inspired.mp3','-filter_complex',
 f"[1:a]atrim=0:{total},asetpts=N/SR/TB,aresample=48000,volume=0.11,afade=t=in:d=1.5,afade=t=out:st={fo}:d=4[m];"
 "[0:a]aresample=48000,asplit=2[v][sc];"
 "[m][sc]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=400[md];"
 "[v][md]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11[out]",'-map','[out]','-ar','48000','remotion/public/mix.wav'],check=True)
json.dump({'fps':FPS,'duration':total,'cues':cues,'segs':segs,'scenes':scenes},open('remotion/src/timeline.json','w'),ensure_ascii=False,indent=1)
print('duration',total)
for s in segs: print(s['id'],s['start'],s['dur'],s['rate'],len(s['clicks']))
