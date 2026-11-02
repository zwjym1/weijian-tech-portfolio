#!/usr/bin/env python3
"""按意思段配音（规则 6：只出一条、按意思段生成、生成即发）。
用法：python3 lib/voice/vo.py episodes/<ARC>/  [--segments 04_vo/segments.json] [--only 0,2]
segments.json：[{"id":0,"text":"一段 3–5 句的口播"}, ...]（由终稿切分）。
输出：04_vo/seg_XX.mp3 + seg_XX.mp3.json（逐字时间戳）；声线和模型读 config/brand_config.yaml 的 voice。"""
import argparse, json, pathlib, sys, yaml
from concurrent.futures import ThreadPoolExecutor
HERE = pathlib.Path(__file__).resolve().parent; R = HERE.parent.parent
sys.path.insert(0, str(HERE)); from fish_lib import synth
a = argparse.ArgumentParser(); a.add_argument("ep"); a.add_argument("--segments", default="04_vo/segments.json"); a.add_argument("--only", default=None)
o = a.parse_args(); ep = pathlib.Path(o.ep)
v = yaml.safe_load((R / "config/brand_config.yaml").read_text(encoding="utf-8"))["voice"]
S = json.loads((ep / o.segments).read_text(encoding="utf-8"))
ids = [int(x) for x in o.only.split(",")] if o.only else [s["id"] for s in S]
def job(s):
    p = ep / "04_vo" / f"seg_{s['id']:02d}.mp3"; err = ""
    for _ in range(3):
        try: synth(s["text"], p, v["voice_id"], speed=s.get("speed", 1.0), model=v["model"]); return f"{s['id']} ok {p}"
        except Exception as e: err = str(e)
    return f"{s['id']} FAIL {err}"
with ThreadPoolExecutor(4) as ex:
    for r in ex.map(job, [s for s in S if s["id"] in ids]): print(r, flush=True)
