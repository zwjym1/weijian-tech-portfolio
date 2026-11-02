#!/usr/bin/env python3
"""Fetch public Bilibili video metadata. Tries /x/web-interface/view, falls back to WBI-signed /wbi/view.
Usage: bili_view.py BVID [BVID...]   (no login, anonymous buvid only)"""
import sys, json, time, hashlib, urllib.parse, urllib.request, http.cookiejar
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
H = {"User-Agent": UA, "Referer": "https://www.bilibili.com/", "Origin": "https://www.bilibili.com", "Accept": "application/json"}
cj = http.cookiejar.CookieJar(); op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
def get(url, extra=None):
    h = dict(H); h.update(extra or {})
    try:
        with op.open(urllib.request.Request(url, headers=h), timeout=15) as r: return r.status, r.read().decode()
    except urllib.error.HTTPError as e: return e.code, ""
MIX = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52]
def wbi_key():
    _, t = get("https://api.bilibili.com/x/web-interface/nav"); w = json.loads(t)["data"]["wbi_img"]
    raw = w["img_url"].rsplit("/",1)[1].split(".")[0] + w["sub_url"].rsplit("/",1)[1].split(".")[0]
    return "".join(raw[i] for i in MIX)[:32]
def sign(params, key):
    params = dict(params, wts=int(time.time()))
    q = urllib.parse.urlencode({k: "".join(c for c in str(v) if c not in "!'()*") for k, v in sorted(params.items())})
    return q + "&w_rid=" + hashlib.md5((q + key).encode()).hexdigest()
def buvid():
    s, t = get("https://api.bilibili.com/x/frontend/finger/spi")
    d = json.loads(t)["data"]; return f"buvid3={d['b_3']}; buvid4={d['b_4']}"
def view(bvid):
    ck = {"Cookie": buvid()}
    s, t = get(f"https://api.bilibili.com/x/web-interface/view?bvid={bvid}", ck); via = "view"; s0 = s
    if s != 200:
        s, t = get("https://api.bilibili.com/x/web-interface/wbi/view?" + sign({"bvid": bvid}, wbi_key()), ck); via = f"wbi/view (plain view HTTP {s0})"
    d = json.loads(t) if t else {"code": s}
    return via, d
if __name__ == "__main__":
    for b in sys.argv[1:]:
        via, d = view(b); v = d.get("data") or {}
        print(json.dumps({"bvid": b, "via": via, "code": d.get("code"), "msg": d.get("message"), "title": v.get("title"),
              "up": (v.get("owner") or {}).get("name"), "view": (v.get("stat") or {}).get("view"), "like": (v.get("stat") or {}).get("like"),
              "pubdate": v.get("pubdate")}, ensure_ascii=False))
