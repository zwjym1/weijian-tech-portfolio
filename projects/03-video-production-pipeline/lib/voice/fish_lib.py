"""Fish TTS（带逐字时间戳）。源自 science-studio EP-20261021-03/vo/fish_lib.py 的 synth()；密钥只走环境变量 FISH_API_KEY。"""
import base64,json,os,sys
from pathlib import Path
import requests
def synth(text,path,ref,speed=1.0,temp=.7,top_p=None,latency='normal',chunk_length=None,model='s2.1-pro-free'):
    s=requests.Session();s.trust_env=False
    body={'text':text,'format':'mp3','temperature':temp,'prosody':{'speed':speed,'volume':0},'latency':latency,'reference_id':ref}
    if top_p is not None: body['top_p']=top_p
    if chunk_length is not None: body['chunk_length']=chunk_length
    r=s.post('https://api.fish.audio/v1/tts/stream/with-timestamp',headers={'Authorization':'Bearer '+os.environ['FISH_API_KEY'],'model':model,'Content-Type':'application/json'},json=body,timeout=180)
    if not r.ok:raise RuntimeError(f'HTTP {r.status_code}: {r.text[:200]}')
    chunks=[];snaps={}
    for line in r.content.decode('utf-8').splitlines():
        if not line.startswith('data: '):continue
        ev=json.loads(line[6:])
        if ev.get('audio_base64'):chunks.append(base64.b64decode(ev['audio_base64']))
        if ev.get('alignment'):snaps[ev.get('chunk_seq',0)]=ev
    Path(path).write_bytes(b''.join(chunks))
    b=[]
    for k in sorted(snaps):
        ev=snaps[k];off=ev.get('chunk_audio_offset_sec',0)
        for sg in ev['alignment']['segments']:b.append({'text':sg['text'],'offset':off+sg['start'],'duration':sg['end']-sg['start']})
    Path(str(path)+'.json').write_text(json.dumps(b,ensure_ascii=False),encoding='utf-8')
