#!/usr/bin/env python3
"""给 Gemini 导出一期的「数据包」（一个 Markdown 文件）。只读：读 state.json、采集目录、db/studio.db、选题卡片，不写库、不采集。
用法：
  python3 scripts/export_gemini_pack.py <EP> [--topic 31] [--all-candidates] [--q 关键词 ...] [--out 路径]
默认：state.topic.chosen 有值就只导出该题，否则导出 state.topic.candidate_ids 全部（选题轮）。
输出：projects/<EP>/handoff/gemini_pack_<EP>_<YYYYMMDD-HHMM>.md
内容：
  1 本期状态
  2 搜索词（带来源）
  3 竞品（真实赞数和日期）
  4 评论真实疑问
  5 竞品开头 ASR（未校对）
  6 资产库检索 + 需求复活雷达
  7 已批经验 + 长期偏好 + 待批建议（标「待批」）
  8 选题卡片
  9 字段状态与限制
所有数字照抄采集文件原值，不估算；缺的写「未采到」。"""
import sys, json, re, pathlib, argparse, subprocess, datetime, sqlite3
sys.path.insert(0, str(pathlib.Path(__file__).parent)); import db

ROOT = db.ROOT
ap = argparse.ArgumentParser(); ap.add_argument("ep"); ap.add_argument("--topic", type=int, action="append")
ap.add_argument("--all-candidates", action="store_true"); ap.add_argument("--q", nargs="*", default=None)
ap.add_argument("--out"); ap.add_argument("--max-videos", type=int, default=15); ap.add_argument("--max-q", type=int, default=25)
a = ap.parse_args()
EP = ROOT / "projects" / a.ep
st = json.loads((EP / "state.json").read_text(encoding="utf-8"))
c = sqlite3.connect(f"file:{db.DB}?mode=ro", uri=True); c.row_factory = sqlite3.Row  # 只读打开
QUESTION_CATS = ("真实疑问", "理解障碍", "科学错误质疑", "新选题需求")

def topic_ids():
    if a.topic: return a.topic
    ch = (st.get("topic") or {}).get("chosen")
    if ch and not a.all_candidates: return [ch]
    return (st.get("topic") or {}).get("candidate_ids") or ([ch] if ch else [])

def parse_src(sp):
    """topics.source_path 形如 '<dir>（+ search/r1,r2；sug/s1,s2）' → (dir, [r..], [s..])"""
    sp = sp or ""; d = re.split(r"[（(]", sp)[0].strip()
    rs = re.search(r"search/([r\d,]+)", sp); ss = re.search(r"sug/([s\d,]+)", sp)
    return pathlib.Path(d) if d else None, (rs.group(1).split(",") if rs else []), (ss.group(1).split(",") if ss else [])

def card_for(tid):
    idx = ROOT / "topics" / "cards" / "INDEX.md"
    if not idx.exists(): return None
    for line in idx.read_text(encoding="utf-8").splitlines():
        m = re.match(r"\|\s*(\d+)\s*\|.*\]\(([^)]+)\)", line)
        if m and int(m.group(1)) == tid: return idx.parent / m.group(2)
    return None

def run(*args):
    try: return subprocess.run([sys.executable, str(ROOT / "scripts" / "search.py"), *args], capture_output=True, text=True, timeout=60).stdout.strip()
    except Exception as e: return f"（检索失败：{e}）"

def jl(p):
    try: return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))
    except Exception: return None

def fmt_n(x): return "未采到" if x is None else f"{x:,}" if isinstance(x, int) else str(x)

out = []; W = out.append
now = datetime.datetime.now(db.TZ).strftime("%Y-%m-%d %H:%M")
W(f"# 数据包 · {a.ep}《{st.get('title') or '（未定题）'}》")
W(f"导出时间：{now}（UTC+8）｜脚本：scripts/export_gemini_pack.py（只读）｜档位：{st.get('tier')}｜阶段：{st.get('stage')} / {st.get('stage_status')}")
W("\n> 给 Gemini：本包里的抖音数字都来自采集文件原值，可以引用；包里没有的数字，你也拿不到真实值，就写「未采到」，不要估算。ASR 开头是机器转写，未人工校对。\n")

tids = topic_ids()
W("## 1 本期状态与选题")
for d in st.get("approved_decisions") or []: W(f"- 用户决定（{d['at']}）：{d['what']}")
W(f"- 本包涵盖选题：{', '.join('#'+str(t) for t in tids) or '无'}")

field_dirs = []
for tid in tids:
    t = c.execute("select * from topics where id=?", (tid,)).fetchone()
    if not t: W(f"\n### 选题 #{tid}：库里没有这条"); continue
    gdir, rs, ss = parse_src(t["source_path"])
    base = gdir.parent if gdir else EP / "research" / "field"
    field_dirs.append(str(gdir))
    W(f"\n---\n\n# 选题 #{tid}：{t['title']}（状态：{t['status']}）")
    if t["core_question"]: W(f"- 核心问题：{t['core_question']}")
    if t["angle"]: W(f"- 角度：{t['angle']}")
    W(f"- 采集目录：`{t['source_path']}`")

    W("\n## 2 搜索词（带来源）")
    for s in ss:
        d = jl(base / "sug" / f"{s}.json")
        if not d: W(f"- {s}：文件缺失"); continue
        for k in ("search_sug", "search_page_related"):
            b = d.get(k) or {}
            if b.get("status") == "available":
                W(f"- 「{b.get('keyword')}」· {b.get('source') or k}：{' / '.join(b.get('words') or [])}")
            else: W(f"- 「{(b or {}).get('keyword', s)}」· {k}：{b.get('status', '未采到')}")
    summ = jl(gdir / "summary.json") if gdir else None
    if summ and summ.get("recs"):
        W("- 视频详情页推荐词（场景｜词×出现次数）：")
        for scene, words in summ["recs"].items():
            W(f"  - {scene}：" + " / ".join(f"{w}×{n}" for w, n in words[:12]))

    W("\n## 3 竞品视频（真实数据，采集时公开值）")
    if summ and summ.get("videos"):
        W("深采（详情+评论）：\n\n| 作者 | 发布 | 时长s | 赞 | 评 | 转 | 藏 | 文案 | 链接 |\n|---|---|---|---|---|---|---|---|---|")
        for v in summ["videos"]:
            W(f"| {v.get('author')} | {v.get('published')} | {v.get('duration_s') or '图文/未知'} | {fmt_n(v.get('likes'))} | {fmt_n(v.get('comments'))} | {fmt_n(v.get('shares'))} | {fmt_n(v.get('collects'))} | {(v.get('desc') or '')[:40].replace('|','/')} | https://www.douyin.com/video/{v.get('id')} |")
    for r in rs:
        d = jl(base / "search" / f"{r}.json")
        if not d: continue
        srcs = "，".join(f"{k}:{v.get('status')}/{v.get('count')}" for k, v in (d.get("sources") or {}).items())
        vs = sorted(d.get("videos") or [], key=lambda v: -(v.get("likes") or 0))[:a.max_videos]
        W(f"\n搜索「{d.get('keyword')}」（来源 {srcs}；按赞排序前 {len(vs)}）：\n\n| 赞 | 评 | 日期 | 时长s | 作者 | 文案 | 链接 |\n|---|---|---|---|---|---|---|")
        for v in vs:
            W(f"| {fmt_n(v.get('likes'))} | {fmt_n(v.get('comments'))} | {v.get('date')} | {v.get('dur_s')} | {v.get('author')} | {(v.get('desc') or '')[:40].replace('|','/')} | {v.get('url')} |")

    W("\n## 4 评论里的真实疑问")
    if summ:
        W(f"- 评论：原始 {summ.get('n_comments_raw')} 条，去重 {summ.get('n_comments_unique')} 条；分类计数：" + "，".join(f"{k} {n}" for k, n in summ.get("cats") or []))
        qs = []
        for bucket, b in (summ.get("buckets") or {}).items():
            for cat, likes, text, author in b.get("top") or []:
                if cat in QUESTION_CATS: qs.append((likes, cat, bucket, text, author))
        # 再从各视频 comments.json 补全真实疑问
        seen = {q[3] for q in qs}
        for cj in sorted(gdir.glob("douyin_*/comments.json")):
            for cm in jl(cj) or []:
                t_ = cm.get("text") or ""
                if t_ not in seen and db.is_question(t_) and not cm.get("parent"):
                    seen.add(t_); qs.append((cm.get("like") or 0, "疑问（脚本规则判定）", "—", t_, cj.parent.name))
        qs.sort(key=lambda x: -(x[0] or 0))
        W(f"\n| 赞 | 类别 | 主题桶 | 评论原文 | 所在视频/作者 |\n|---|---|---|---|---|")
        for likes, cat, bucket, text, author in qs[:a.max_q]:
            W(f"| {likes} | {cat} | {bucket} | {text.replace('|','/')[:80]} | {author} |")
        W("\n注：「真实疑问」等类别来自采集后的模型归类；「疑问（脚本规则判定）」是 db.is_question 规则判定，可能有误判。热评 ≠ 全部观众需求。")
    else: W("- 未采到评论汇总（summary.json 缺失）")

    W("\n## 5 竞品开头（ASR 机器转写，未校对）")
    for rp in sorted(gdir.glob("douyin_*/report.md")) if gdir else []:
        txt = rp.read_text(encoding="utf-8"); au = re.search(r"作者：(\S+)", txt)
        sec = txt.split("## 口播/字幕", 1)[1].split("\n## ", 1)[0] if "## 口播/字幕" in txt else ""
        lines = [l.strip() for l in sec.splitlines() if re.match(r"\s*\[\d\d:\d\d", l)][:4]
        if lines: W(f"- {au.group(1) if au else rp.parent.name}（{rp.parent.name.split('_')[-1]}）：" + " ".join(lines)[:160])

    card = card_for(tid)
    W("\n## 8 选题卡片")
    W(card.read_text(encoding="utf-8") if card and card.exists() else "（无卡片）")

W("\n---\n\n## 6 资产库检索与需求复活雷达（本地库，只读）")
qs = a.q if a.q is not None else [w for t in tids for w in re.findall(r"[\u4e00-\u9fffA-Za-z0-9]{3,}", (c.execute("select title from topics where id=?", (t,)).fetchone() or {"title": ""})["title"])][:3]
for q in qs: W(f"\n### search.py q「{q}」\n```\n{run('q', q, '-n', '10')}\n```")
W(f"\n### search.py radar\n```\n{run('radar', '-n', '15')}\n```")

W("\n## 7 经验库")
W("### 7.1 已批改进（用户批准，lessons.type=已批改进）")
for r in c.execute("select id,stage,text,source from lessons where type='已批改进' and coalesce(superseded,0)=0 order by id"):
    W(f"- L{r['id']}［{r['stage']}］{r['text']}")
W("### 7.2 长期偏好（用户定，lessons.type=长期偏好）")
for r in c.execute("select id,text,source from lessons where type='长期偏好' and coalesce(superseded,0)=0 order by id"):
    W(f"- L{r['id']} {r['text']}（{r['source']}）")
W("### 7.3 待批建议（**不是规则**，用户未批准，只作参考）")
for r in c.execute("select id,stage,text from suggestions where status='待批' order by id"):
    W(f"- 建议#{r['id']}［{r['stage']}］{r['text']}")
W("### 7.4 未验证推测（只当线索）")
for r in c.execute("select id,text from lessons where type='未验证推测' and coalesce(superseded,0)=0 order by id"):
    W(f"- L{r['id']} {r['text']}")

W("\n## 9 字段状态与限制")
W("- 采集方式：免登录游客态公开接口（douyin-field-collect），无 Cookie。评论多为「partial」（有上限），不是全部评论。")
W("- 没有的：搜索量、播放量（抖音不公开给游客）、竞品完播率。这些不能写进稿子，也不能估。")
W("- 后台数据（本账号创作者中心）只作低权重「参考」，不主导选题。")
W(f"- 采集目录：{'；'.join(field_dirs) or '无'}")

p = pathlib.Path(a.out) if a.out else EP / "handoff" / f"gemini_pack_{a.ep}_{datetime.datetime.now(db.TZ):%Y%m%d-%H%M}.md"
p.parent.mkdir(parents=True, exist_ok=True); p.write_text("\n".join(out) + "\n", encoding="utf-8"); print(p)
