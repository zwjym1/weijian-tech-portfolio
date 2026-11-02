"""parse_sites.py — 通过公开在线解析站（它们自己的服务器）拿抖音 / YouTube 直链。
只调用网站页面本身的公开表单 / 公开接口：不登录、不破解签名、不用 cookie/key。
返回 dict: {site, url(直链或 None), video_only_url, audio_url, title, quality, note}
"""
import re, json, time, html, subprocess, urllib.parse, os
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
PW_PY = "/workspace/.venv-watch/bin/python"
PW_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "parse_sites_pw.py")

def _curl(args, timeout=40):
    r = subprocess.run(["curl", "-sS", "-m", str(timeout), "-A", UA] + args, capture_output=True, text=True)
    if r.returncode: raise RuntimeError(f"curl rc={r.returncode} {r.stderr.strip()[:120]}")
    return r.stdout

# ---------- 抖音 ----------
def dy_dlpanda(url):
    """dlpanda.com：网页表单 POST（CSRF token 来自同一页面，站点自己的会话 cookie 只在本次请求内使用）。"""
    jar = f"/tmp/dlpanda_{os.getpid()}.jar"
    try:
        page = _curl(["-c", jar, "-b", jar, "https://dlpanda.com/zh-CN"])
        t = re.search(r'name="_token" value="([^"]+)"', page); t0 = re.search(r'name="t0ken"[^>]*value="([^"]+)"', page)
        if not t: raise RuntimeError("表单 token 未找到（页面改版？）")
        res = _curl(["-c", jar, "-b", jar, "-e", "https://dlpanda.com/zh-CN", "-X", "POST", "https://dlpanda.com/zh-CN",
                     "--data-urlencode", f"_token={t.group(1)}", "--data-urlencode", f"url={url}",
                     "--data-urlencode", f"t0ken={t0.group(1) if t0 else ''}"], 60)
    finally:
        if os.path.exists(jar): os.remove(jar)
    m = re.search(r'["\'](?:https?:)?(//[^"\'<\s]*(?:zjcdn\.com|douyinvod\.com|amemv\.com|bytecdn\.cn)[^"\'<\s]*)', res)
    if not m: raise RuntimeError("结果页无视频直链")
    tm = re.search(r'<h2 class="mt-2[^"]*">([^<]+)', res)
    return {"site": "dlpanda.com", "url": "https:" + html.unescape(m.group(1)), "title": tm and html.unescape(tm.group(1)).strip(), "quality": "原站默认档（实测 1080p）"}

def via_browser(site, url, timeout=150):
    """kukutool / snapany：用无头 Chrome 正常操作网页（粘贴链接→点解析→读取页面上的下载链接）。"""
    r = subprocess.run([PW_PY, PW_SCRIPT, site, url], capture_output=True, text=True, timeout=timeout)
    try: j = json.loads(r.stdout.strip().splitlines()[-1])
    except Exception: raise RuntimeError(f"{site} 无头浏览器失败: {(r.stderr or r.stdout).strip()[-200:]}")
    if not (j.get("url") or j.get("video_only_url")): raise RuntimeError(f"{site}: {j.get('note') or '未拿到直链'}")
    return j

def douyin(url):
    errs = []
    for name, fn in [("dlpanda.com", dy_dlpanda), ("snapany.com", lambda u: via_browser("snapany", u))]:   # kukutool 实测连用后弹“高频用户”框不再解析，未放入自动链
        t0 = time.time()
        try:
            r = fn(url); r["seconds"] = round(time.time() - t0, 1); r["tried"] = errs; return r
        except Exception as e: errs.append(f"{name}: {str(e)[:160]}")
    return {"url": None, "tried": errs}

# ---------- YouTube ----------
def yt_loader_to(url, fmt="720"):
    """loader.to：网站下载按钮所用的 ajax 接口（提交→轮询进度→拿下载地址）。fmt: 360/480/720/1080。"""
    j = json.loads(_curl([f"https://loader.to/ajax/download.php?format={fmt}&url={urllib.parse.quote(url, safe='')}"]))
    if not j.get("success") or not j.get("progress_url"): raise RuntimeError(f"提交失败: {str(j)[:120]}")
    for _ in range(60):
        p = json.loads(_curl([j["progress_url"]], 20))
        if p.get("download_url", "").startswith("http"):
            return {"site": "loader.to", "url": p["download_url"], "title": j.get("title"), "quality": f"{fmt}p（含音轨）"}
        if p.get("success") == 0 and p.get("progress", 0) < 0: raise RuntimeError(p.get("text"))
        time.sleep(4)
    raise RuntimeError("轮询超时（4 分钟）")

INV = ["invidious.f5.si"]
def yt_invidious(url):
    """Invidious 公共实例的公开 API（/api/v1/videos），取 itag 18（360p 含音轨）直链。"""
    vid = re.search(r"(?:v=|youtu\.be/|shorts/|embed/)([\w-]{11})", url).group(1); last = None
    for h in INV:
        try:
            d = json.loads(_curl([f"https://{h}/api/v1/videos/{vid}?fields=title,author,lengthSeconds,viewCount,likeCount,published,formatStreams"], 30))
            fs = d.get("formatStreams") or []
            if fs:
                f = sorted(fs, key=lambda x: int(re.sub(r"\D", "", x.get("qualityLabel") or "0") or 0))[-1]
                return {"site": h, "url": f["url"], "title": d.get("title"), "quality": f"{f.get('qualityLabel')}（含音轨）",
                        "extra": {"author": d.get("author"), "duration": d.get("lengthSeconds"), "views": d.get("viewCount"), "likes": d.get("likeCount"), "published": d.get("published")}}
            last = f"{h}: 无 formatStreams"
        except Exception as e: last = f"{h}: {str(e)[:100]}"
    raise RuntimeError(last)

def youtube(url, hd=False):
    errs = []
    for name, fn in [("loader.to", lambda u: yt_loader_to(u, "1080" if hd else "720")), ("invidious", yt_invidious), ("snapany.com", lambda u: via_browser("snapany_yt", u))]:
        t0 = time.time()
        try:
            r = fn(url); r["seconds"] = round(time.time() - t0, 1); r["tried"] = errs; return r
        except Exception as e: errs.append(f"{name}: {str(e)[:160]}")
    return {"url": None, "tried": errs}
