import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw
vid = sys.argv[1]; out = sys.argv[2]; times = [float(x) for x in sys.argv[3].split(',')]
d = Path(out).parent / '_frames'; d.mkdir(exist_ok=True)
ims = []
for i, t in enumerate(times):
    f = d / f'k{i:02d}.png'; subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', str(t), '-i', vid, '-frames:v', '1', str(f)], check=True)
    im = Image.open(f).convert('RGB'); im.thumbnail((324, 576)); ImageDraw.Draw(im).text((6, 6), f'{t:.2f}s', fill=(180, 40, 30)); ims.append(im)
cols = 6; rows = (len(ims) + cols - 1) // cols
W = Image.new('RGB', (cols * 324, rows * 576), (40, 40, 40))
for i, im in enumerate(ims): W.paste(im, ((i % cols) * 324, (i // cols) * 576))
W.save(out, quality=88)
