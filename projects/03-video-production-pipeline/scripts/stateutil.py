"""archive-studio 共用：读写 state.json、刷新 STATE.md、维护 episodes/INDEX.md。"""
import json, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
TZ = datetime.timezone(datetime.timedelta(hours=8))
STAGE_CN = {"S01_topic": "1 选题", "S02_facts": "2 事实表", "S03_script": "3 稿子", "S04_approve": "4 批稿", "S05_vo": "5 配音",
            "S06_shots": "6 分镜", "S07_assets": "7 素材", "S08_render": "8 渲染", "S09_publish": "9 发布包", "S10_data": "10 数据回收"}
def now(): return datetime.datetime.now(TZ).strftime("%Y-%m-%d %H:%M (UTC+8)")
def load(ep_dir):
    return json.loads((pathlib.Path(ep_dir) / "state.json").read_text(encoding="utf-8"))
def save(ep_dir, s):
    ep_dir = pathlib.Path(ep_dir); s["updated_at"] = now()
    (ep_dir / "state.json").write_text(json.dumps(s, ensure_ascii=False, indent=2), encoding="utf-8")
    (ep_dir / "STATE.md").write_text(render_md(s), encoding="utf-8")
    update_index(ep_dir.parent)
def render_md(s):
    L = [f"# {s['id']} · {s.get('title') or '（未定题）'}", "",
         f"- 栏目：{s.get('column') or '未定'}　卷号：{s.get('series_no') or '未定'}　更新：{s['updated_at']}",
         f"- **当前阶段：{STAGE_CN.get(s['stage'], s['stage'])}（{s['stage_status']}）**",
         f"- **下一步：{s['next_action']}**", "", "## 阶段", ""]
    L += [f"- {STAGE_CN.get(k, k)}：{v}" for k, v in s["stages"].items()]
    L += ["", "## 闸口", ""] + [f"- {k}：{v or '未过'}" for k, v in s["gates"].items()]
    def sec(t, items):
        L.extend(["", f"## {t}", ""]); L.extend([f"- {i}" for i in items] or ["- （无）"])
    sec("已批准决策", [f"{d.get('at','')} {d.get('what','')}" if isinstance(d, dict) else str(d) for d in s["approved_decisions"]])
    sec("稿件与配音", [f"稿：{s['script']['latest']}（写手 {s['script']['writer']}；通过 {s['script']['approved']}；锁定段 {s['script']['locked_paragraphs']}）",
                     f"配音：{s['vo']['latest']}（发出 {s['vo']['sent_at']}；听审通过 {s['vo']['listen_approved']}）"])
    sec("角色 / BGM / A-B", [f"主理人形象 {s['cast']['host_look']}；客串 {s['cast']['guest_id']}", f"BGM {s['bgm']['track']}", f"A/B {s['ab']}"])
    sec("渲染", [str(r) for r in s["renders"]]); sec("发布", [f"{k}: {v}" for k, v in s["publish"].items()])
    sec("失败与恢复", [str(f) for f in s["failures"]]); sec("未解决问题", [str(i) for i in s["open_issues"]])
    sec("日志（最近 15 条）", s["log"][-15:])
    return "\n".join(L) + "\n"
def update_index(ep_root):
    ep_root = pathlib.Path(ep_root); rows = []
    for p in sorted(ep_root.glob("ARC-*/state.json")):
        s = json.loads(p.read_text(encoding="utf-8"))
        rows.append(f"| {s['id']} | {s.get('title') or ''} | {s.get('column') or ''} | {STAGE_CN.get(s['stage'], s['stage'])} | {s['updated_at']} |")
    (ep_root / "INDEX.md").write_text("# 卷索引（脚本自动生成，勿手改）\n\n| 编号 | 标题 | 栏目 | 阶段 | 更新 |\n|---|---|---|---|---|\n" + "\n".join(rows) + "\n", encoding="utf-8")
