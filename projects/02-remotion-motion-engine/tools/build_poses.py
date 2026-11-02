# 扫描 assets/G6/poses/<角色>/，复制到 public/g6/poses/<id>/，生成 src/g6/poses/<id>.json；缺图用 G3/G4 整身图占位
import json,os,shutil
from PIL import Image
A='../../assets'
NAMES=['stand_neutral','stand_blink','talk_open','walk_1','walk_2','walk_3','walk_4','point','surprised','happy','confused','sigh_sad','push_cart','hold_bag']
PH={'xl':{'stand_neutral':'public/g4/xl_stand.png','point':'public/g4/xl_point.png','surprised':'public/g4/xl_surprised.png','happy':'public/g4/xl_happy.png','confused':'public/g4/xl_confused.png','sigh_sad':'public/g4/xl_neutral.png'},
    'mm':{'stand_neutral':'public/g4/mm_stand.png','point':'public/g4/mm_point.png','surprised':'public/g4/mm_surprised.png','happy':'public/g4/mm_happy.png','confused':'public/g4/mm_confused.png','sigh_sad':'public/g4/mm_neutral.png'},
    'tzs':{'stand_neutral':f'{A}/G5/tzs_v3/poses/pose_stand.png','point':f'{A}/G5/tzs_v3/poses/pose_point.png','unroll':f'{A}/G5/tzs_v3/poses/pose_unroll.png'}}
SRC={'xl':'xiaolin','mm':'lin_mama','tzs':None}
def info(path,codex):
  im=Image.open(path);b=im.getbbox();w,h=im.size
  pj=os.path.join(os.path.dirname(path),'poses.json');n=os.path.basename(path)[:-4]
  if codex and os.path.exists(pj):
    pp=json.load(open(pj))['poses'].get(n,{})
    if 'foot_xy' in pp: return w,h,pp['foot_xy'],pp['foot_xy'][1]-b[1]
  if codex and h==2048: foot=[512,1980]  # poses.json foot_center；push_cart 画布 1536 宽，人物脚仍在 x=512
  else:
    import numpy as np
    a=np.array(im.convert('RGBA'))[...,3];y0=int(b[3]-(b[3]-b[1])*0.08);ys,xs=np.where(a[y0:b[3]]>128)
    foot=[float(xs.mean()),b[3]]
  return w,h,foot,foot[1]-b[1]
for cid,dn in SRC.items():
  out=f'public/g6/poses/{cid}';os.makedirs(out,exist_ok=True);poses={};ph=[]
  d=f'{A}/G6/poses/{dn}' if dn else None
  for n in NAMES+['unroll']:
    p=f'{d}/{n}.png' if d else None; codex=bool(p and os.path.exists(p))
    if not codex:
      p=PH[cid].get(n)
      if not p: continue
      im=Image.open(p)
      if im.height<600: continue  # 半身表情徽章不能当整身姿态
      ph.append(n)
    fn=f'{n}.png';shutil.copy(p,f'{out}/{fn}');w,h,foot,fh=info(p,codex)
    poses[n]={'file':f'g6/poses/{cid}/{fn}','w':w,'h':h,'foot':foot,'figH':fh}
  json.dump({'id':cid,'figH':poses['stand_neutral']['figH'],'poses':poses,'placeholder':ph},open(f'src/g6/poses/{cid}.json','w'),ensure_ascii=False,indent=1)
  print(cid,'codex:',[k for k in poses if k not in ph],'占位:',ph)
