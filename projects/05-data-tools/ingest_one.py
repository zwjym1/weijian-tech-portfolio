#!/workspace/.venv-dy/bin/python
"""ingest_one.py <BV|douyin_url> <short_id>
B站: 公开接口 qn16 mp4；抖音: 调 watch.py --no-asr 取视频。
处理: ≤180s 全片；>180s 前180s + 结尾45s。ASR(faster-whisper small, numpy 输入, t2s)、拼图、切点、qoder(Qwen3.8-Flash)。"""
import sys, os, re, json, subprocess, time, shutil
sys.path.insert(0, "/workspace/tools")
import numpy as np
OUT = "/workspace/watch"; B = "/workspace/research/creator_library/batch_20261019"
def run(c, **k): return subprocess.run(c, capture_output=True, text=True, **k)
def log(*a): print("[ingest]", *a, file=sys.stderr, flush=True)

def dl_bili(bvid):
    import bili_view as b
    od = f"{OUT}/bilibili_{bvid}"; os.makedirs(od, exist_ok=True); v = f"{od}/video.mp4"
    via, d = b.view(bvid); data = d["data"]; json.dump(data, open(f"{od}/view.json", "w"), ensure_ascii=False)
    meta = {"platform": "bilibili", "id": bvid, "title": data["title"], "author": data["owner"]["name"], "duration": data["duration"],
            "pubdate": time.strftime("%Y-%m-%d", time.localtime(data["pubdate"])), "view": data["stat"]["view"], "like": data["stat"]["like"],
            "url": f"https://www.bilibili.com/video/{bvid}"}
    if not (os.path.exists(v) and os.path.getsize(v) > 100000):
        ck = {"Cookie": b.buvid()}; key = b.wbi_key()
        s, t = b.get("https://api.bilibili.com/x/player/wbi/playurl?" + b.sign({"bvid": bvid, "cid": data["cid"], "qn": 16, "fnval": 1, "platform": "html5"}, key), ck)
        durl = (json.loads(t).get("data") or {}).get("durl") or []
        if not durl: raise SystemExit("playurl无流 " + t[:200])
        size = durl[0].get("size") or 0; ok = False
        for attempt in range(6):
            for u in [durl[0]["url"]] + (durl[0].get("backup_url") or []):
                r = run(["curl", "-sSL", "--fail", "-C", "-", "--speed-limit", "30000", "--speed-time", "25", "-m", "900", "-o", v, "-H", "Referer: https://www.bilibili.com/", "-A", b.UA, u])
                got = os.path.getsize(v) if os.path.exists(v) else 0
                if (r.returncode == 0 and got > 100000) or (size and got >= size): ok = True; break
                log("curl", r.returncode, got, "/", size)
            if ok: break
        if not ok: raise SystemExit("下载失败 " + r.stderr[-200:])
    return od, v, meta

def dl_douyin(url):
    vid = re.search(r"video/(\d+)", url).group(1); od = f"{OUT}/douyin_{vid}"; v = f"{od}/video.mp4"
    if not (os.path.exists(v) and os.path.getsize(v) > 100000):
        r = run(["/workspace/tools/watch.py", url, "--no-asr", "--comments", "0", "--frames", "16"], timeout=900)
        log(r.stdout[-300:], r.stderr[-300:])
    if not (os.path.exists(v) and os.path.getsize(v) > 100000): raise SystemExit("抖音下载失败: " + (r.stdout + r.stderr)[-300:])
    m = json.load(open(f"{od}/meta.json"))
    meta = {"platform": "douyin", "id": vid, "title": m.get("title"), "author": m.get("author"), "duration": m.get("duration"),
            "pubdate": (m.get("published") or "")[:10], "like": (m.get("stats") or {}).get("点赞"), "url": url, "bgm": m.get("bgm")}
    return od, v, meta

def probe(v):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", v]); return float(r.stdout.strip())

def grab_sheet(v, times, out, cols, width=320):
    from PIL import Image, ImageDraw
    ims = []
    for i, t in enumerate(times):
        p = f"/tmp/_g{i}.jpg"; run(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.2f}", "-i", v, "-frames:v", "1", "-vf", f"scale={width}:-2", p])
        if os.path.exists(p): ims.append((Image.open(p).copy(), t)); os.remove(p)
    if not ims: return
    w, h = ims[0][0].size; rows = (len(ims) + cols - 1) // cols; S = Image.new("RGB", (w * cols, h * rows)); d = ImageDraw.Draw(S)
    for k, (im, t) in enumerate(ims):
        x, y = (k % cols) * w, (k // cols) * h; S.paste(im.resize((w, h)), (x, y)); lb = f"{t:.1f}s"
        d.rectangle([x, y, x + 60, y + 16], fill="black"); d.text((x + 3, y + 2), lb, fill="yellow")
    S.save(out, quality=82)

def wav_np(v, ss, dur):
    r = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(ss), "-t", str(dur), "-i", v, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True)
    return np.frombuffer(r.stdout, np.int16).astype(np.float32) / 32768.0

_M = None
def asr(a, off):
    global _M
    from faster_whisper import WhisperModel
    from opencc import OpenCC
    if _M is None: _M = WhisperModel("medium", device="cpu", compute_type="int8", cpu_threads=8)
    cc = OpenCC("t2s"); segs, _ = _M.transcribe(a, language="zh", vad_filter=True, vad_parameters=dict(threshold=0.15, min_silence_duration_ms=300, speech_pad_ms=300), condition_on_previous_text=False, no_repeat_ngram_size=3, beam_size=3, initial_prompt="以下是普通话的句子，使用简体中文和标点。")
    return [{"start": round(s.start + off, 2), "end": round(s.end + off, 2), "text": cc.convert(s.text.strip())} for s in segs]

def audio_stats(a):
    if len(a) == 0: return {}
    fr = a[: len(a) // 8000 * 8000].reshape(-1, 8000); rms = np.sqrt((fr ** 2).mean(1)) + 1e-9; db = 20 * np.log10(rms)
    return {"median_db": round(float(np.median(db)), 1), "p10_db": round(float(np.percentile(db, 10)), 1), "silent_halfsec_pct": round(float((db < -40).mean() * 100), 1)}

def cuts(v, ss, dur):
    r = run(["ffmpeg", "-hide_banner", "-ss", str(ss), "-t", str(dur), "-i", v, "-vf", "select='gt(scene,0.3)',showinfo", "-an", "-f", "null", "-"], timeout=900)
    return [round(float(x) + ss, 2) for x in re.findall(r"pts_time:([\d.]+)", r.stderr)]

PROMPT = """你是短视频科普剪辑拆解员。附件：clip.mp4（{scope}）、关键帧拼图、逐字稿(含时间戳)。请只基于你实际看到/听到的内容回答，不确定写"未确认"，不要编造。简体中文，严格按以下小标题输出：
## first_3s_visuals
逐秒描述 0-3 秒画面（构图/字幕/动效）
## info_structure
钩子→机制→验证→带走，每层带 mm:ss
## av_sync
5-8 条「口播原句片段 ↔ 画面/演示」对应，带时间
## sfx_bgm
BGM 风格/情绪/是否全程/是否给人声闪避；音效类型+时间+卡在什么（切镜/字幕/数字/反转）；是否像可商用曲库同款，给替代建议（风格+关键词）
## learn
3 条可直接抄到 30-90s 竖屏科普的做法
## avoid
2 条不该学的点
附：本地切点(scene>0.3)：{cuts}；音频统计：{astat}"""

def main():
    src, sid = sys.argv[1], sys.argv[2]
    try:
        od, v, meta = dl_bili(src) if src.startswith("BV") else dl_douyin(src)
    except SystemExit as e:
        json.dump({"ok": False, "error": str(e)}, open(f"{B}/{sid}.result.json", "w"), ensure_ascii=False); print("FAIL", e); return
    D = probe(v); meta["file_duration"] = round(D, 1); long = D > 185
    s1 = min(D, 180.0); end_ss = max(s1, D - 45) if long else None
    grab_sheet(v, [0.05, 0.5, 1, 1.5, 2, 2.5, 3.0], f"{od}/hook_3s.jpg", 7, 240)
    grab_sheet(v, [(i + .5) * s1 / 24 for i in range(24)], f"{od}/contact_sheet.jpg", 6)
    if long: grab_sheet(v, [end_ss + (i + .5) * (D - end_ss) / 8 for i in range(8)], f"{od}/contact_end.jpg", 4)
    a1 = wav_np(v, 0, s1); segs = asr(a1, 0); st = audio_stats(a1)
    segs_end = asr(wav_np(v, end_ss, D - end_ss), end_ss) if long else []
    c = cuts(v, 0, s1); ce = cuts(v, end_ss, D - end_ss) if long else []
    fmt = lambda s: f"[{int(s['start']//60):02d}:{s['start']%60:05.2f}] {s['text']}"
    tx = "\n".join(map(fmt, segs)) + (("\n--- 结尾段 ---\n" + "\n".join(map(fmt, segs_end))) if long else "")
    open(f"{od}/transcript_b.txt", "w").write(tx)
    meta.update(scope=("全片" if not long else f"前180s+结尾{int(D-end_ss)}s"), cuts_main=c, cuts_end=ce, n_cuts_main=len(c),
                avg_shot_main=round(s1 / (len(c) + 1), 2), audio=st, segs=segs, segs_end=segs_end, od=od)
    # qoder clip
    clip = f"{od}/clip.mp4"; vf = "scale='if(gt(iw,ih),640,-2)':'if(gt(iw,ih),-2,640)'"
    if long:
        run(["ffmpeg", "-y", "-v", "error", "-i", v, "-filter_complex",
             f"[0:v]trim=0:{s1},setpts=PTS-STARTPTS,{vf}[a];[0:a]atrim=0:{s1},asetpts=PTS-STARTPTS[aa];[0:v]trim={end_ss}:{D},setpts=PTS-STARTPTS,{vf}[b];[0:a]atrim={end_ss}:{D},asetpts=PTS-STARTPTS[bb];[a][aa][b][bb]concat=n=2:v=1:a=1[v][au]",
             "-map", "[v]", "-map", "[au]", "-r", "20", "-c:v", "libx264", "-crf", "32", "-preset", "veryfast", "-c:a", "aac", "-b:a", "48k", clip])
    else:
        run(["ffmpeg", "-y", "-v", "error", "-i", v, "-vf", vf, "-r", "20", "-c:v", "libx264", "-crf", "32", "-preset", "veryfast", "-c:a", "aac", "-b:a", "48k", clip])
    scope = "全片" if not long else f"原片前3分钟 + 拼接的结尾{int(D-end_ss)}秒（拼接点在 03:00）"
    P = PROMPT.format(scope=scope, cuts=c[:80], astat=st)
    atts = ["--attachment", clip, "--attachment", f"{od}/contact_sheet.jpg", "--attachment", f"{od}/transcript_b.txt"] + (["--attachment", f"{od}/contact_end.jpg"] if long else [])
    json.dump({"P": P, "atts": atts}, open(f"{od}/qoder_job.json", "w"), ensure_ascii=False)
    if os.environ.get("NO_QODER"):
        meta["ok"] = True; json.dump(meta, open(f"{B}/{sid}.result.json", "w"), ensure_ascii=False, indent=1); print("OK(noqoder)", sid, meta["scope"], len(c)); return
    t0 = time.time()
    r = run(["timeout", "420", "qoderclicn", "-p", "-m", "Qwen3.8-Flash", "--permission-mode", "bypass_permissions", *atts, P], cwd=od)
    open(f"{od}/qoder_b.md", "w").write(r.stdout); meta["qoder_rc"] = r.returncode; meta["qoder_sec"] = round(time.time() - t0)
    if r.returncode != 0 or len(r.stdout) < 200: open(f"{od}/qoder_b.err", "w").write(r.stderr[-3000:])
    meta["ok"] = True; json.dump(meta, open(f"{B}/{sid}.result.json", "w"), ensure_ascii=False, indent=1)
    print("OK", sid, meta["scope"], "cuts", len(c), "qoder", r.returncode, len(r.stdout))
main()
