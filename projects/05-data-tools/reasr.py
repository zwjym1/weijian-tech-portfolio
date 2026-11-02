#!/workspace/.venv-dy/bin/python
import sys, json, importlib.util
sys.argv_save = sys.argv[:]; sids = sys.argv[1:]
spec = importlib.util.spec_from_file_location("ing", "/workspace/tools/ingest_one.py")
src = open("/workspace/tools/ingest_one.py").read().replace("\nmain()\n", "\n")
ns = {}; exec(compile(src, "ingest_one", "exec"), ns)
B = ns["B"]
for sid in sids:
    m = json.load(open(f"{B}/{sid}.result.json")); v = m["od"] + "/video.mp4"; D = m["file_duration"]
    s1 = min(D, 180.0); long = D > 185; end_ss = max(s1, D - 45) if long else None
    m["segs"] = ns["asr"](ns["wav_np"](v, 0, s1), 0)
    m["segs_end"] = ns["asr"](ns["wav_np"](v, end_ss, D - end_ss), end_ss) if long else []
    json.dump(m, open(f"{B}/{sid}.result.json", "w"), ensure_ascii=False, indent=1); print("reasr", sid, len(m["segs"]), flush=True)
