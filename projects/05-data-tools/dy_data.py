#!/workspace/.venv-watch/bin/python
"""dy_data.py — 免登录抖音账号数据（只用未登录可见的公开页面/接口；不破解签名、不带任何账号 cookie）
  comments <链接|ID> [-n 200] [--replies] [--csv f.csv] [--json f.json]   评论：文本/赞/时间/IP属地/回复数，可带二级回复
  video    <链接|ID> [--json f]        单条作品：赞/评/藏/转/下载、发布时间、时长、话题、BGM、作者、视频页相关搜索
  suggest  <关键词> [--rel]             搜索下拉联想词；--rel 额外取 so.douyin 结果页“大家还在搜”
  related  <链接|ID> [-n 30]            视频页“相关推荐”（无头浏览器读页面自己的请求）
  user     <主页链接|sec_uid|作品链接>   博主：粉丝/获赞/作品数/关注/IP属地/简介（作品列表需登录，见说明）
  hot      [--log]                      热搜榜：词、热度值、上榜时间、相关视频数；--log 追加快照到 /workspace/data/dy_hot.csv 积累趋势
数据来源：so.douyin.com（抖音官方 H5 搜索）的 comment/list、aweme/detail；www.douyin.com 的 search/sug、hot/search/list；
         www.iesdouyin.com 公开 user/info；需浏览器的项用无头 Chrome 打开公开页面，只读页面自己发出的请求的响应。
"""
import argparse, csv, datetime as dt, json, os, re, sys, time, urllib.parse as up
import requests
TZ = dt.timezone(dt.timedelta(hours=8))
UA_M = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
UA_PC = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
BASE = {"aid": "581610", "channel": "channel_pc_web", "platform": "PC", "device_platform": "webapp"}
S = requests.Session()
def T(sec): return dt.datetime.fromtimestamp(int(sec), TZ).strftime("%Y-%m-%d %H:%M") if sec else ""
def log(*a): print("[dy_data]", *a, file=sys.stderr, flush=True)

def get_json(url, params, ref="https://so.douyin.com/", ua=UA_M, tries=3):
    for k in range(tries):
        try:
            r = S.get(url, params=params, headers={"User-Agent": ua, "Referer": ref}, timeout=20)
            if r.text.strip().startswith("{"): return r.json()
            log(f"非JSON响应 {r.status_code} {len(r.text)}B：{url.split('?')[0]}")
        except Exception as e: log("请求失败", e)
        time.sleep(1.5 * (k + 1))
    return {}

def vid_of(s):
    s = s.strip(); m = re.search(r"https?://\S+", s); u = m.group(0) if m else s
    m = re.search(r"(?:video/|modal_id=|note/|aweme_id=)(\d{15,21})", u) or re.fullmatch(r"(\d{15,21})", u)
    if m: return m.group(1)
    if "v.douyin.com" in u or "iesdouyin.com" in u:
        r = S.get(u, headers={"User-Agent": UA_M}, allow_redirects=False, timeout=15)
        loc = r.headers.get("location", "")
        m = re.search(r"/(?:video|note)/(\d{15,21})", loc)
        if m: return m.group(1)
    raise SystemExit(f"未识别到作品ID：{s}")

def secuid_of(s):
    s = s.strip(); m = re.search(r"https?://\S+", s); u = m.group(0) if m else s
    m = re.search(r"(MS4wLjAB[\w\-]+)", u)
    if m: return m.group(1)
    if "v.douyin.com" in u:
        loc = S.get(u, headers={"User-Agent": UA_M}, allow_redirects=False, timeout=15).headers.get("location", "")
        m = re.search(r"(MS4wLjAB[\w\-]+)", loc)
        if m: return m.group(1)
    v = video(vid_of(u)); return v["author_sec_uid"]

# ---------- 评论 ----------
def _c(c, parent=""):
    u = c.get("user") or {}
    return {"cid": c.get("cid"), "parent": parent, "user": u.get("nickname"), "like": c.get("digg_count", 0), "text": c.get("text", ""),
            "time": T(c.get("create_time")), "ip": c.get("ip_label", ""), "replies": c.get("reply_comment_total", 0),
            "reply_to": (c.get("reply_to_username") or "")}

def comments(vid, n=200, replies=False, reply_n=20):
    out, seen, cur = [], set(), 0
    total = None
    while len([x for x in out if not x["parent"]]) < n:
        j = get_json("https://so.douyin.com/aweme/v1/web/comment/list/", {**BASE, "aweme_id": vid, "cursor": cur, "count": 20})
        if j.get("status_code") not in (0, None) or not j: log("评论接口返回异常", j.get("status_code"), j.get("status_msg")); break
        total = j.get("total", total)
        for c in j.get("comments") or []:
            if c["cid"] in seen: continue
            seen.add(c["cid"]); out.append(_c(c))
            if replies and c.get("reply_comment_total"):
                rc, rcur = 0, 0
                while rc < min(reply_n, c["reply_comment_total"]):
                    rj = get_json("https://so.douyin.com/aweme/v1/web/comment/list/reply/", {**BASE, "item_id": vid, "comment_id": c["cid"], "cursor": rcur, "count": 20})
                    for r in rj.get("comments") or []:
                        if r["cid"] not in seen and rc < reply_n: seen.add(r["cid"]); out.append(_c(r, c["cid"])); rc += 1
                    if not rj.get("has_more"): break
                    rcur = rj.get("cursor"); time.sleep(0.6)
        if not j.get("has_more"): break
        cur = j.get("cursor"); time.sleep(0.8)
    tops = [x for x in out if not x["parent"]][:n]; keep = {x["cid"] for x in tops}
    out = [x for x in out if (x["cid"] in keep) or (x["parent"] in keep)]
    log(f"评论：平台显示共 {total} 条，取到一级 {len(tops)} 条、二级 {len(out) - len(tops)} 条")
    return out

# ---------- 单条作品 ----------
def video(vid):
    j = get_json("https://so.douyin.com/aweme/v1/web/aweme/detail/", {**BASE, "aweme_id": vid})
    a = j.get("aweme_detail")
    if not a: raise SystemExit(f"取不到作品详情（可能已删除/私密/仅国内可见）：{vid} {j.get('status_msg', '')}")
    st, au, mu, vv = a.get("statistics") or {}, a.get("author") or {}, a.get("music") or {}, a.get("video") or {}
    sw = [w["word"] for s in ((a.get("suggest_words") or {}).get("suggest_words") or []) for w in s.get("words", [])]
    return {"id": vid, "url": f"https://www.douyin.com/video/{vid}", "desc": a.get("desc", ""), "published": T(a.get("create_time")),
            "duration_s": round((a.get("duration") or vv.get("duration") or 0) / 1000, 1), "width": vv.get("width"), "height": vv.get("height"),
            "likes": st.get("digg_count"), "comments": st.get("comment_count"), "collects": st.get("collect_count"),
            "shares": st.get("share_count"), "downloads": st.get("download_count"), "plays": st.get("play_count") or None,
            "hashtags": [t["hashtag_name"] for t in a.get("text_extra") or [] if t.get("hashtag_name")],
            "bgm": {"title": mu.get("title"), "author": mu.get("author"), "id": str(mu.get("id_str") or mu.get("id") or ""), "original": "原声" in (mu.get("title") or "")},
            "author": au.get("nickname"), "author_sec_uid": au.get("sec_uid"), "author_uid": au.get("uid"),
            "is_image_post": bool(a.get("images")), "related_search": list(dict.fromkeys(sw)), "fetched_at": T(time.time())}

# ---------- 联想词 ----------
def suggest(kw, rel=False):
    j = get_json("https://www.douyin.com/aweme/v1/web/search/sug/", {**BASE, "aid": "6383", "keyword": kw}, ref="https://www.douyin.com/", ua=UA_PC)
    res = {"sug": [x.get("content") for x in j.get("sug_list") or []]}
    if rel:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            b = p.chromium.launch(channel="chrome", headless=True); ctx = b.new_context(**p.devices["iPhone 13"], locale="zh-CN"); pg = ctx.new_page()
            pg.goto("https://so.douyin.com/s?keyword=" + up.quote(kw), wait_until="domcontentloaded", timeout=45000); pg.wait_for_timeout(6000)
            txt = pg.inner_text("body"); b.close()
        lines = [l.strip() for l in txt.split("\n")]; rel = []
        for i, l in enumerate(lines):
            if l in ("大家还在搜", "相关搜索", "猜你想搜"):
                for w in lines[i + 1:i + 16]:
                    if not w: continue
                    if w in ("更多搜索结果", "抖音搜索", "收藏", "分享") or re.fullmatch(r"[\d.w万:：\-年月日天前 ]+", w) or len(w) > 30: break
                    rel.append(w)
        res["rel"] = list(dict.fromkeys(rel))
    return res

# ---------- 无头浏览器：读页面自己的请求 ----------
def _browse(url, want, wait=9000, mobile=False):
    from playwright.sync_api import sync_playwright
    got = {}
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", headless=True)
        ctx = b.new_context(**(p.devices["iPhone 13"] if mobile else {"viewport": {"width": 1366, "height": 900}, "user_agent": UA_PC}), locale="zh-CN")
        pg = ctx.new_page()
        def on(r):
            for k in want:
                if k in r.url and r.request.resource_type in ("xhr", "fetch"):
                    try: got.setdefault(k, []).append((r.status, r.json()))
                    except Exception: got.setdefault(k, []).append((r.status, None))
        pg.on("response", on)
        pg.goto(url, wait_until="domcontentloaded", timeout=45000); pg.wait_for_timeout(wait)
        b.close()
    return got

def related(vid, n=30):
    g = _browse(f"https://www.douyin.com/jingxuan?modal_id={vid}", ["/aweme/related/"])
    rows = []
    for st, j in g.get("/aweme/related/", []):
        for a in (j or {}).get("aweme_list") or []:
            s = a.get("statistics") or {}
            rows.append({"url": f"https://www.douyin.com/video/{a['aweme_id']}", "desc": (a.get("desc") or "")[:60], "author": (a.get("author") or {}).get("nickname"),
                         "likes": s.get("digg_count"), "published": T(a.get("create_time"))})
    return list({r["url"]: r for r in rows}.values())[:n]

def user(sec):
    res = {"sec_uid": sec, "url": f"https://www.douyin.com/user/{sec}"}
    try:
        g = _browse(res["url"], ["/user/profile/other/", "/aweme/post/"])
        for st, j in g.get("/user/profile/other/", []):
            u = (j or {}).get("user")
            if u: res.update(nickname=u.get("nickname"), unique_id=u.get("unique_id"), followers=u.get("follower_count"), following=u.get("following_count"),
                             total_likes=u.get("total_favorited"), works=u.get("aweme_count"), ip=u.get("ip_location"), signature=u.get("signature"),
                             verify=u.get("custom_verify") or u.get("enterprise_verify_reason"), source="www.douyin.com 主页（无头浏览器，精确值）")
        res["works_list"] = "需登录（未登录时作品列表接口返回 %s）" % ",".join(str(s) for s, _ in g.get("/aweme/post/", [])) if g.get("/aweme/post/") else "需登录（未登录不加载）"
    except Exception as e: log("主页浏览器方式失败", e)
    if not res.get("nickname"):
        j = get_json("https://www.iesdouyin.com/web/api/v2/user/info/", {"sec_uid": sec}, ref="https://www.iesdouyin.com/")
        u = j.get("user_info") or {}
        if u: res.update(nickname=u.get("nickname"), unique_id=u.get("unique_id"), followers=u.get("mplatform_followers_count"), following=u.get("following_count"),
                         total_likes=u.get("total_favorited"), works=u.get("aweme_count"), signature=u.get("signature"), source="iesdouyin 公开接口（粉丝数为取整值）")
    return res

def user_works_via_search(res, pages=8):
    """作品列表需登录；退而求其次：用博主昵称在 so.douyin 搜，按 sec_uid 过滤出其作品（不完整，只是搜得到的那部分）"""
    import asyncio; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import dy_search
    got = asyncio.run(dy_search.src_so(res.get("nickname") or "", pages))
    rows = [{"url": f"https://www.douyin.com/video/{i}", "desc": v.get("desc", "")[:60], "likes": v.get("likes"), "published": T(v.get("ts") or (int(i) >> 32))}
            for i, v in got.items() if v.get("sec_uid") == res["sec_uid"]]
    return sorted(rows, key=lambda r: r["published"], reverse=True)

# ---------- 热搜 ----------
def hot(do_log=False):
    j = get_json("https://www.douyin.com/aweme/v1/web/hot/search/list/", {**BASE, "aid": "6383", "detail_list": "1"}, ref="https://www.douyin.com/", ua=UA_PC)
    d = j.get("data") or {}; now = T(time.time())
    rows = [{"rank": w.get("position"), "word": w.get("word"), "hot": w.get("hot_value"), "on_board": T(w.get("event_time")), "videos": w.get("video_count"),
             "label": {1: "新", 3: "热", 5: "首发", 8: "独家", 16: "辟谣"}.get(w.get("label"), ""), "sentence_id": w.get("sentence_id"), "snapshot": now}
            for w in d.get("word_list") or []]
    if do_log and rows:
        os.makedirs("/workspace/data", exist_ok=True); f = "/workspace/data/dy_hot.csv"; new = not os.path.exists(f)
        with open(f, "a", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=list(rows[0])); new and w.writeheader(); w.writerows(rows)
        log(f"已追加 {len(rows)} 行到 {f}")
    return {"words": rows, "trending": [x.get("word") for x in d.get("trending_list") or []]}

def trend(word):
    f = "/workspace/data/dy_hot.csv"
    if not os.path.exists(f): raise SystemExit("还没有快照，先多次运行 dy_data.py hot --log")
    return [r for r in csv.DictReader(open(f)) if word in r["word"]]

def dump(obj, a):
    if getattr(a, "json", None): json.dump(obj, open(a.json, "w"), ensure_ascii=False, indent=1); log("已写", a.json)
    if getattr(a, "csv", None) and isinstance(obj, list) and obj:
        with open(a.csv, "w", newline="", encoding="utf-8-sig") as fh:
            w = csv.DictWriter(fh, fieldnames=list(obj[0])); w.writeheader(); w.writerows(obj)
        log("已写", a.csv)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sp = ap.add_subparsers(dest="cmd", required=True)
    for c in ["comments", "video", "suggest", "related", "user", "hot", "trend"]:
        x = sp.add_parser(c); x.add_argument("--json"); x.add_argument("--csv")
        if c not in ("hot",): x.add_argument("target")
        if c in ("comments", "related"): x.add_argument("-n", type=int, default=200 if c == "comments" else 30)
        if c == "comments": x.add_argument("--replies", action="store_true"); x.add_argument("--reply-n", type=int, default=20)
        if c == "suggest": x.add_argument("--rel", action="store_true")
        if c == "hot": x.add_argument("--log", action="store_true")
        if c == "user": x.add_argument("--works", action="store_true", help="用昵称搜索拼凑部分作品（不完整）")
    a = ap.parse_args()
    if a.cmd == "comments":
        r = comments(vid_of(a.target), a.n, a.replies, a.reply_n); dump(r, a)
        if not (a.json or a.csv):
            for c in r: print(("    ↳ " if c["parent"] else "") + f"[{c['like']}赞|{c['time']}|{c['ip']}|回复{c['replies']}] {c['user']}：{c['text'][:80]}")
    elif a.cmd == "video": r = video(vid_of(a.target)); dump(r, a); print(json.dumps(r, ensure_ascii=False, indent=1))
    elif a.cmd == "suggest": r = suggest(a.target, a.rel); dump(r, a); print(json.dumps(r, ensure_ascii=False, indent=1))
    elif a.cmd == "related":
        r = related(vid_of(a.target), a.n); dump(r, a)
        for x in r: print(f"{x['published'][:10]} 赞{x['likes']} {x['url']} {x['author']}｜{x['desc'][:40]}")
    elif a.cmd == "user":
        r = user(secuid_of(a.target))
        if a.works: r["works_from_search"] = user_works_via_search(r)
        dump(r, a); print(json.dumps(r, ensure_ascii=False, indent=1))
    elif a.cmd == "hot":
        r = hot(a.log); dump(r["words"], a)
        for w in r["words"]: print(f"{w['rank']:>2}. {w['word']}  热度{w['hot']}  {w['label']}  上榜{w['on_board']}  视频{w['videos']}")
        print("上升/实时：", "、".join(r["trending"][:10]))
    elif a.cmd == "trend":
        for r in trend(a.target): print(r["snapshot"], r["rank"], r["hot"], r["word"])
if __name__ == "__main__": main()
