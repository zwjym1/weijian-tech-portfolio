# 粗分层（技术验证用）：GrabCut 抠出人物/钱堆，cv2.inpaint 补出干净地面作背景。
# 用法：.venv/bin/python tools/split_sh06.py
import cv2, numpy as np
src=cv2.imread('../renders/G3/SH06.png'); H,W=src.shape[:2]; k=W/461
boxes={'chr_xiaolin_a':(10,350,134,594),'prp_stack_small':(142,488,200,592),
       'chr_xiaolin_b':(278,378,372,590),'prp_stack_big':(352,276,461,602)}
HINTS={'chr_xiaolin_a':[(60,372,98,418),(55,425,100,480)],'chr_xiaolin_b':[(305,392,335,425)]}
allm=np.zeros((H,W),np.uint8)
for n,b in boxes.items():
    X0,Y0,X1,Y1=[int(v*k) for v in b]
    m=np.zeros((H,W),np.uint8); bg=np.zeros((1,65),np.float64); fg=np.zeros((1,65),np.float64)
    cv2.grabCut(src,m,(X0,Y0,X1-X0,Y1-Y0),bg,fg,6,cv2.GC_INIT_WITH_RECT)
    if n in HINTS:
        for hx0,hy0,hx1,hy1 in HINTS[n]: m[int(hy0*k):int(hy1*k),int(hx0*k):int(hx1*k)]=cv2.GC_FGD
        cv2.grabCut(src,m,None,bg,fg,4,cv2.GC_EVAL)
    mm=np.where((m==1)|(m==3),255,0).astype(np.uint8)
    mm=cv2.morphologyEx(mm,cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
    # 保留最大连通块
    nlab,lab,st,_=cv2.connectedComponentsWithStats(mm)
    if nlab>1: mm=np.where(lab==1+np.argmax(st[1:,4]),255,0).astype(np.uint8)
    # 填内部空洞（脸等被误判为背景的区域）
    ff=mm.copy(); h2,w2=ff.shape; fm=np.zeros((h2+2,w2+2),np.uint8); cv2.floodFill(ff,fm,(0,0),255)
    mm=mm|cv2.bitwise_not(ff)
    allm|=mm
    a=cv2.GaussianBlur(mm,(3,3),0)
    rgba=np.dstack([src,a])[Y0:Y1,X0:X1]
    cv2.imwrite(f'public/layers/{n}_v01.png',rgba); print(n,X0,Y0,X1,Y1)
dil=cv2.dilate(allm,np.ones((25,25),np.uint8))
clean=cv2.inpaint(src,dil,9,cv2.INPAINT_TELEA)
# 把地面纹理细节（高频）从上方同列搬过来，减少修补处的糊块
f=src.astype(np.float32); det=f-cv2.GaussianBlur(f,(0,0),6)
sh=np.roll(det,int(330*k),axis=0); sh2=np.roll(det,-int(330*k),axis=0)
ys=np.arange(H)[:,None,None]; srcdet=np.where(ys>=int(330*k),sh,sh2)
w=(cv2.GaussianBlur(dil,(0,0),8)/255.0)[...,None]
out=cv2.GaussianBlur(clean.astype(np.float32),(0,0),6)*w+clean*(1-w)+srcdet*w
cv2.imwrite('public/layers/bg_sh06_floor_v01.png',np.clip(out,0,255).astype(np.uint8))
