#!/usr/bin/env python3
"""把 Gemini（Spark 浏览）交回的实地采集 JSON（格式 gemini_field_v1，见 docs/gemini_handoff/字段格式.md）
转成 ingest_field.py 认得的文件，并做「不估算」校验；另带 diff，用于和 douyin-field-collect 的结果逐条对照。
本脚本只做格式转换和比对，不采集、不联网、不写库。入库仍由用户指令后执行：
  python3 scripts/ingest_field.py <输出目录> --topic "选题名" --label gemini-spark
用法：
  python3 scripts/gemini_field_convert.py check   <gemini_field.json>
  python3 scripts/gemini_field_convert.py convert <gemini_field.json> --out projects/<EP>/research/field_gemini/<批次>
  python3 scripts/gemini_field_convert.py diff    <gemini_field.json> <douyin-field-collect 目录(含 search/ sug/ douyin_*)>
"""
import sys, json, re, pathlib, argparse

NUM = ("likes", "comments", "shares", "collects")
OK_STATUS = {"available", "partial", "observed_empty", "blocked", "not_collected", "login_required"}
VID = re.compile(r"^\d{15,20}$")

def load(p): return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))

def check(d):
    """返回 (错误, 警告)。错误=不能入库；警告=可入库但要人工看。"""
    E, W = [], []
    if d.get("schema") != "gemini_field_v1": E.append("schema 不是 gemini_field_v1")
    if not d.get("collected_at"): E.append("缺 collected_at")
    if (d.get("login") or "").lower() not in ("none", "无", "游客"): E.append(f"login 必须是 none（实际：{d.get('login')}）——不接受登录态或绕过验证采到的数据")
    def chk_v(v, where):
        vid = str(v.get("id") or v.get("video_id") or "")
        if not VID.match(vid): E.append(f"{where}: 视频 id 不是纯数字（{vid}）")
        if not (v.get("url") or "").startswith("https://www.douyin.com/"): E.append(f"{where}: 缺抖音原始链接")
        for k in NUM:
            x = v.get(k)
            if x is None: continue
            if not isinstance(x, int): E.append(f"{where}.{k}={x!r}：必须是整数或 null；页面显示「9.6万」这类近似值时 {k}=null，原样写进 {k}_display")
        for k in list(v):
            if k.endswith("_display") and v[k] and v.get(k[:-8]) is not None and re.search(r"[万wW亿+]", str(v[k])):
                E.append(f"{where}.{k}：页面是近似值「{v[k]}」，但 {k[:-8]} 却填了精确数，属于估算")
    for i, kw in enumerate(d.get("keywords") or []):
        if not kw.get("keyword"): E.append(f"keywords[{i}] 缺 keyword")
        for blk in ("search_sug", "search_page_related"):
            b = kw.get(blk) or {}
            if b.get("status") not in OK_STATUS: E.append(f"keywords[{i}].{blk}.status 非法：{b.get('status')}")
            if b.get("status") == "available" and not b.get("words"): W.append(f"keywords[{i}].{blk} 标 available 但没有词")
        for j, v in enumerate(kw.get("videos") or []): chk_v(v, f"keywords[{i}].videos[{j}]")
    for i, vd in enumerate(d.get("video_details") or []):
        det = vd.get("detail") or {}
        chk_v({**det, "id": det.get("id") or vd.get("video_id"), "url": det.get("url") or vd.get("url")}, f"video_details[{i}].detail")
        cm = vd.get("comments") or {}
        if cm.get("status") not in OK_STATUS: E.append(f"video_details[{i}].comments.status 非法：{cm.get('status')}")
        for j, c in enumerate(cm.get("items") or []):
            if not c.get("text"): E.append(f"video_details[{i}].comments[{j}] 缺 text")
            if c.get("like") is not None and not isinstance(c.get("like"), int): E.append(f"video_details[{i}].comments[{j}].like 必须是整数或 null")
        if cm.get("status") == "available" and cm.get("platform_total") and len(cm.get("items") or []) < cm["platform_total"]:
            W.append(f"video_details[{i}] 评论没采全却标 available，应为 partial")
    if not d.get("missing"): W.append("missing 为空：确认真的没有缺失字段")
    return E, W

def convert(d, out):
    out = pathlib.Path(out); (out / "sug").mkdir(parents=True, exist_ok=True); (out / "search").mkdir(exist_ok=True)
    src = f"Gemini Spark 浏览（{d.get('collector') or 'gemini'}，游客态）"
    for i, kw in enumerate(d.get("keywords") or [], 1):
        k = kw["keyword"]
        sug = {b: {"status": (kw.get(b) or {}).get("status", "not_collected"), "keyword": k, "source": f"{src}·{b}", "words": (kw.get(b) or {}).get("words") or []}
               for b in ("search_sug", "search_page_related")}
        (out / "sug" / f"g{i}.json").write_text(json.dumps(sug, ensure_ascii=False, indent=1), encoding="utf-8")
        vs = [{**v, "id": str(v.get("id")), "src": "gemini"} for v in kw.get("videos") or []]
        (out / "search" / f"g{i}.json").write_text(json.dumps({"keyword": k, "sources": {"gemini": {"status": "available" if vs else "observed_empty", "count": len(vs)}}, "videos": vs}, ensure_ascii=False, indent=1), encoding="utf-8")
    for vd in d.get("video_details") or []:
        det = dict(vd.get("detail") or {}); vid = str(det.get("id") or vd.get("video_id"))
        det.setdefault("status", "available"); det["id"] = vid; det.setdefault("url", vd.get("url") or f"https://www.douyin.com/video/{vid}")
        dd = out / f"douyin_{vid}"; dd.mkdir(exist_ok=True)
        cm = vd.get("comments") or {}; items = cm.get("items") or []
        rel = vd.get("related_searches") or {}
        collect = {"platform": "douyin", "video_id": vid, "collected_at": d.get("collected_at"), "login": "none（Gemini Spark 游客浏览）", "detail": det,
                   "comments": {"status": cm.get("status"), "collected_unique": len(items), "platform_total": cm.get("platform_total"), "file": "comments.json"},
                   "recommendations": {"detail_suggest_words": {"status": rel.get("status", "not_collected"), "words": rel.get("words") or []}},
                   "subtitle": vd.get("opening") or {"status": "not_collected"}}
        (dd / "collect.json").write_text(json.dumps(collect, ensure_ascii=False, indent=1), encoding="utf-8")
        (dd / "comments.json").write_text(json.dumps([{"cid": c.get("cid") or f"g{vid}_{n}", "parent": c.get("parent") or "", "like": c.get("like"), "text": c["text"], "time": c.get("time"), "ip": c.get("ip")} for n, c in enumerate(items)], ensure_ascii=False, indent=1), encoding="utf-8")
    (out / "gemini_missing.json").write_text(json.dumps(d.get("missing") or [], ensure_ascii=False, indent=1), encoding="utf-8")
    return out

def diff(d, ref):
    ref = pathlib.Path(ref); R = {}
    for f in list((ref / "search").glob("*.json")) if (ref / "search").exists() else []:
        try: x = load(f); R.setdefault(x["keyword"], {"videos": {}, "sug": set(), "rel": set()})["videos"].update({str(v["id"]): v for v in x.get("videos") or []})
        except Exception: pass
    for f in list((ref / "sug").glob("*.json")) if (ref / "sug").exists() else []:
        try:
            x = load(f); k = x["search_sug"]["keyword"]; r = R.setdefault(k, {"videos": {}, "sug": set(), "rel": set()})
            r["sug"] |= set(x["search_sug"].get("words") or []); r["rel"] |= set((x.get("search_page_related") or {}).get("words") or [])
        except Exception: pass
    det = {}
    for f in ref.rglob("douyin_*/collect.json"):
        x = load(f); det[str(x.get("video_id"))] = x.get("detail") or {}
    L = ["# Gemini vs douyin-field-collect 对照", f"- Gemini 采集时间：{d.get('collected_at')}；参照目录：{ref}", ""]
    for kw in d.get("keywords") or []:
        k = kw["keyword"]; r = R.get(k)
        L.append(f"## 「{k}」")
        if not r: L.append("- 参照目录里没有这个关键词，无法比对"); continue
        gs = set((kw.get("search_sug") or {}).get("words") or []); gr = set((kw.get("search_page_related") or {}).get("words") or [])
        for name, g, rr in (("联想 sug", gs, r["sug"]), ("大家还在搜", gr, r["rel"])):
            L.append(f"- {name}：Gemini {len(g)}，脚本 {len(rr)}，重合 {len(g & rr)}；只在 Gemini：{' / '.join(sorted(g - rr)) or '无'}；只在脚本：{' / '.join(sorted(rr - g)) or '无'}")
        gv = {str(v["id"]): v for v in kw.get("videos") or []}
        L.append(f"- 视频：Gemini {len(gv)}，脚本 {len(r['videos'])}，同 id {len(set(gv) & set(r['videos']))}；只在 Gemini 的 id：{', '.join(sorted(set(gv) - set(r['videos']))) or '无'}")
        L.append("\n| id | 字段 | Gemini | 脚本 | 一致 |\n|---|---|---|---|---|")
        for vid in sorted(set(gv) & set(r["videos"])):
            for f_ in NUM[:2]:
                a_, b_ = gv[vid].get(f_), r["videos"][vid].get(f_)
                L.append(f"| {vid} | {f_} | {a_ if a_ is not None else gv[vid].get(f_ + '_display', 'null')} | {b_} | {'✓' if a_ == b_ else ('—(Gemini 为 null)' if a_ is None else '✗')} |")
    L.append("\n## 详情页（同 id）")
    for vd in d.get("video_details") or []:
        gd = vd.get("detail") or {}; vid = str(gd.get("id") or vd.get("video_id"))
        if vid not in det: L.append(f"- {vid}：参照里没有"); continue
        for f_ in NUM + ("published", "author"):
            a_, b_ = gd.get(f_), det[vid].get(f_)
            if a_ is None and b_ is None: continue
            L.append(f"- {vid} {f_}：Gemini {a_!r} / 脚本 {b_!r} {'✓' if str(a_)[:16] == str(b_)[:16] else '✗'}")
    L.append("\n注：采集时间不同，赞数小幅增长属正常；id 不在对方结果里≠错误（排序与分页不同）。判定标准见部署方案「验证清单」。")
    return "\n".join(L)

ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest="cmd", required=True)
p = sp.add_parser("check"); p.add_argument("json")
p = sp.add_parser("convert"); p.add_argument("json"); p.add_argument("--out", required=True); p.add_argument("--force", action="store_true")
p = sp.add_parser("diff"); p.add_argument("json"); p.add_argument("ref"); p.add_argument("--out")
a = ap.parse_args(); d = load(a.json)
E, W = check(d)
if a.cmd == "check" or E:
    for e in E: print("错误:", e)
    for w in W: print("警告:", w)
    print(f"校验：{len(E)} 错误，{len(W)} 警告")
    if E and a.cmd == "convert" and not a.force: sys.exit(2)
if a.cmd == "convert": print("已转换 →", convert(d, a.out), "；下一步（用户指令后）：python3 scripts/ingest_field.py", a.out, "--topic \"<选题>\" --label gemini-spark")
if a.cmd == "diff":
    t = diff(d, a.ref); (pathlib.Path(a.out).write_text(t, encoding="utf-8") if a.out else print(t))
