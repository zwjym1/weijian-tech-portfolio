# 用法: python3 tools/norm_rig.py ../../assets/G6/xiaolin xl  → 复制散件到 public/g6/<id>/ 并生成 src/g6/rigs/<id>.json
import json,sys,shutil,os
src,rid=sys.argv[1],sys.argv[2]
r=json.load(open(f'{src}/pivots.json'));os.makedirs(f'public/g6/{rid}',exist_ok=True)
par={'arm_L_lower':'arm_L_upper','arm_R_lower':'arm_R_upper','hand_R_point':'arm_R_lower'}
parts={}
for k,v in r['parts'].items():
  shutil.copy(f"{src}/{v['file']}",f'public/g6/{rid}/')
  name,pv=[(n,x) for n,x in v['pivot'].items() if isinstance(x,list)][0]
  d={'file':v['file'],'pivot':name,'pivot_xy':pv}
  if k in par: d['parent']=par[k]
  if k.startswith('face_'): d['parent']='head'; d['face']=k[5:]
  if k=='hand_R_point': d['optional']=True
  parts[k]=d
order=[k for k in r['draw_order'] if k in parts and not k.startswith('face_')]
order=[k for k in order if k in('leg_L','leg_R','torso','head')]+[k for k in parts if k.startswith('face_')]+[k for k in order if k.startswith('arm')]+[k for k in parts if k.startswith('hand')]
out={'id':rid,'dir':f'g6/{rid}','canvas':r['canvas'],'source':src,'draw_order':order,'parts':parts}
if 'hand_R_point' in parts: out['exclusive']={'hand_R_point':{'hides':'arm_R_lower','clipBelowY':1105}}
json.dump(out,open(f'src/g6/rigs/{rid}.json','w'),ensure_ascii=False,indent=1)
