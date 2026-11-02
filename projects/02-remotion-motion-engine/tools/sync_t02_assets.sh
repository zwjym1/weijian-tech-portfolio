#!/bin/bash
# T02：把 codex 插画（assets/T02/draw/d*.png）同步到 public/t02/d/，并生成 src/t02/data/draw_present.json（组件据此决定用真图还是占位）
# 同步 poses_t02.json。qoder 的真实素材已由其自行同步到 public/t02/{real,poses,props}。
set -e; A=/workspace/tongzhengshi/assets/T02; APP=$(cd $(dirname $0)/.. && pwd)
mkdir -p $APP/public/t02/d $APP/src/t02/data

cp -f $A/poses/poses_t02.json $APP/src/t02/data/poses_t02.json
python3 - <<PY
import json,glob,os
from PIL import Image
d={}
# 缩到长边<=1000px（渲染更快，画质足够；原图留在 assets/T02/draw）
for f in sorted(glob.glob('$A/draw/d*.png')):
    im=Image.open(f).convert('RGBA'); im.thumbnail((1000,1000),Image.LANCZOS); o='$APP/public/t02/d/'+os.path.basename(f); im.save(o,optimize=True); d[os.path.basename(f)[:-4]]=list(im.size)
json.dump(d,open('$APP/src/t02/data/draw_present.json','w'),indent=1)
print(len(d),'draw assets:',' '.join(d))
PY
