"""Step driver: real xdotool input into Shotcut on :7; logs epoch times per step and click."""
import json,os,subprocess as sp,sys,time
os.environ['DISPLAY']=':7'
VO=json.load(open('../audio/vo/lines.json'))
LOG='steps.jsonl'
clicks=[]
def x(*a): sp.run(['xdotool',*map(str,a)],check=True)
def move(X,Y,dur=0.45):
    # smooth human-like mouse glide
    o=sp.run(['xdotool','getmouselocation','--shell'],capture_output=True,text=True).stdout
    d=dict(l.split('=') for l in o.split())
    x0,y0=int(d['X']),int(d['Y']); n=max(8,int(dur*60))
    for i in range(1,n+1):
        t=i/n; e=t*t*(3-2*t)
        x('mousemove',int(x0+(X-x0)*e),int(y0+(Y-y0)*e)); time.sleep(dur/n)
def click(X,Y,after=0.6):
    move(X,Y); time.sleep(0.15); clicks.append([time.time(),X,Y]); x('click',1); time.sleep(after)
def typ(s,after=0.4): x('type','--delay',55,s); time.sleep(after)
def key(*k,after=0.3): x('key',*k); time.sleep(after)
def tc(t): click(581,784,0.3); key('ctrl+a'); typ(t,0.1); key('Return',after=0.6)
def vo(step): return sum(m['dur'] for m in VO if m['scene']==step)+0.35*(sum(1 for m in VO if m['scene']==step)-1)

def s01():
    click(37,79,1.2); typ('study_tip_clip.mp4',0.5); key('Return',after=1.5)
    key('space',after=3.0); key('space',after=0.5)
def s02(): click(216,874,1.5)
def s03(): click(1082,79,1.5)
def s04():
    click(441,150,1.2); key('ctrl+a'); typ('English captions',0.6)
    click(984,540,0.6); typ('English',0.3); key('Return',after=0.6); click(975,570,1.2)
def s05():
    tc('00:00:00.450'); click(96,671,0.8); click(262,750,0.4); typ('Take the biggest task.',0.8)
def s06(): tc('00:00:02.000'); click(199,671,1.0)
def s07():
    for a,b,t in [('00:00:02.280','00:00:03.600','Write the essay.'),('00:00:04.230','00:00:06.300',"You can't finish that in one sitting.")]:
        tc(a); click(96,671,0.6); click(262,750,0.3); typ(t,0.5); tc(b); click(199,671,0.8)
def s08(): click(270,671,2.0)
def s09():
    click(170,907,0.5); key('space',after=7.0); key('space',after=0.5)
def s10():
    click(305,907,0.8); click(112,219,0.8); click(165,671,1.2)
def s11(): click(84,817,0.8); click(40,915,1.0); click(75,197,1.2)
def s12():
    click(250,566,0.3); key('ctrl+a'); typ('720',0.2); key('Tab',after=1.5)
    click(246,482,0.3); key('ctrl+a'); typ('6',0.2); key('Tab',after=1.5)
def s13(): click(984,79,1.2); click(66,231,1.0); click(283,791,1.5)
def s14():
    typ('study_tip_captioned.mp4',0.5); key('Return',after=1.0)
    while not os.path.exists('/tmp/demohome/Videos/study_tip_captioned.mp4'): time.sleep(0.5)
    time.sleep(14)
def s15():
    click(37,79,1.2); typ('study_tip_captioned.mp4',0.5); key('Return',after=1.5)
    click(964,782,6.5); click(964,782,0.5)

if __name__=='__main__':
    st=sys.argv[1]; t0=time.time(); time.sleep(1.0)  # let narration begin first
    globals()[st]()
    need=vo(st)+0.8; el=time.time()-t0
    if el<need: time.sleep(need-el)
    t1=time.time()
    open(LOG,'a').write(json.dumps({'step':st,'t0':t0,'t1':t1,'vo':round(vo(st),2),'clicks':clicks})+'\n')
    print(st,round(t1-t0,2),'vo',round(vo(st),2))
