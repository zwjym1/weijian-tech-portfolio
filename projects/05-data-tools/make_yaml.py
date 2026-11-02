#!/workspace/.venv-dy/bin/python
"""make_yaml.py <sid> <author_name> <yaml_id> <followers> <homepage>"""
import sys, json, re, os, yaml
B = "/workspace/research/creator_library/batch_20261019"; V = "/workspace/research/creator_library/videos"
sid, author, yid, fans, home = sys.argv[1:6]
m = json.load(open(f"{B}/{sid}.result.json")); od = m["od"]
q = open(f"{od}/qoder_b.md").read() if os.path.exists(f"{od}/qoder_b.md") else ""
def sec(name):
    mm = re.search(rf"##\s*{name}\s*\n(.*?)(?=\n##\s|\Z)", q, re.S); return (mm.group(1).strip() if mm else "")
def items(txt):
    out = [re.sub(r"^\s*(?:[-*]|\d+[.、)])\s*", "", l).strip() for l in txt.splitlines() if re.match(r"^\s*(?:[-*]|\d+[.、)])\s+", l)]
    return [re.sub(r"\*\*", "", x) for x in out if x] or ([txt] if txt else [])
clean = lambda s: re.sub(r"\*\*", "", s)
segs = m["segs"]; vo = "".join(s["text"] for s in segs if s["start"] < 4.0)
dur = m["file_duration"]; c = m["cuts_main"]
c3 = len([x for x in c if x < 3]); c10 = len([x for x in c if x < 10])
measured = (f"本地实测（{m['scope']}）：scene>0.3 切点 {m['n_cuts_main']} 个，均 {m['avg_shot_main']}s/镜；前3s {c3} 刀、前10s {c10} 刀；"
            f"音频中位 {m['audio'].get('median_db')} dBFS、P10 {m['audio'].get('p10_db')}、<-40dB 的半秒占比 {m['audio'].get('silent_halfsec_pct')}%。")
bgm = m.get("bgm")
bgm_line = (f"抖音元数据 BGM：《{bgm.get('title')}》/ {bgm.get('author')}（original={bgm.get('original')}）。" if bgm else "BGM 名未取到（B站无音乐元数据），以下为听感判断。")
fmt = lambda s: f"[{int(s['start']//60):02d}:{s['start']%60:05.2f}] {s['text']}"
tx = "\n".join(map(fmt, segs)) + (("\n--- 结尾段 ---\n" + "\n".join(map(fmt, m["segs_end"]))) if m.get("segs_end") else "")
primary_failed = os.path.exists(f"{B}/{sid}.primary_failed")
d = {
 "id": yid, "zone": "vertical", "collected_at": "2026-10-19",
 "account": {"name": author, "platform": m["platform"], "followers": fans, "homepage": home},
 "video": {"title": m["title"], "url": m["url"], "duration_s": round(dur), "likes": str(m.get("like") or ""),
           "plays": str(m.get("view") or "未取到"), "published": m.get("pubdate", "")},
 "first_3s": {"visuals": clean(sec("first_3s_visuals")), "voiceover": vo},
 "info_structure": clean(sec("info_structure")),
 "av_sync": clean(sec("av_sync")),
 "sfx_bgm": bgm_line + "\n" + clean(sec("sfx_bgm")),
 "learn": items(sec("learn")), "avoid": items(sec("avoid")),
 "measured": measured,
 "transcript_raw": tx,
 "source_report": "sources/vertical/补采结果_20261019.md",
 "notes": (f"素材 {od}/（{'B站 qn16' if m['platform']=='bilibili' else '抖音 watch.py 解析'}）；处理范围：{m['scope']}。"
           f"逐字稿为 faster-whisper medium 原始输出（已繁转简，未人工校对，可能有错字）；画面/声音字段来自 qoderclicn Qwen3.8-Flash 看 clip.mp4+拼图+逐字稿，并附本地实测。"
           + ("主推/第二条原链接下载失败，已换本博主备选。" if primary_failed else "")),
}
class L(str): pass
yaml.add_representer(L, lambda du, s: du.represent_scalar("tag:yaml.org,2002:str", s, style="|"))
for k in ["info_structure", "av_sync", "sfx_bgm", "transcript_raw"]: d[k] = L(d[k])
d["first_3s"]["visuals"] = L(d["first_3s"]["visuals"])
out = f"{V}/{yid}.yaml"
if os.path.exists(out): out = out.replace(".yaml", "_r2.yaml")
open(out, "w").write(yaml.dump(d, allow_unicode=True, sort_keys=False, width=1000))
print(out, "qoder_len", len(q), "learn", len(d["learn"]))
