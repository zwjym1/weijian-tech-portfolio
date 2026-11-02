"""Caption-vs-VO check: transcribe the final mix with faster-whisper base.en and diff against the cue text."""
import json,sys,subprocess,re,difflib,numpy as np
from faster_whisper import WhisperModel
v,tlp=sys.argv[1],sys.argv[2]
raw=subprocess.run(['ffmpeg','-loglevel','error','-i',v,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout
a=np.frombuffer(raw,dtype=np.float32)
segs,_=WhisperModel('base.en',device='cpu',compute_type='int8').transcribe(a,beam_size=5)
hyp=' '.join(s.text for s in segs)
ref=' '.join(c['text'] for c in json.load(open(tlp))['cues'])
n=lambda s:re.sub(r"[^a-z0-9' ]",' ',s.lower().replace('-',' ')).split()
r,h=n(ref),n(hyp); sm=difflib.SequenceMatcher(None,r,h)
print('word match %.1f%%'%(100*sum(b.size for b in sm.get_matching_blocks())/len(r)))
for op,a1,a2,b1,b2 in sm.get_opcodes():
    if op!='equal': print(op,' '.join(r[a1:a2]),'->',' '.join(h[b1:b2]))
