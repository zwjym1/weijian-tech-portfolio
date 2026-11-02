#!/usr/bin/env python3
"""新建一卷：python3 scripts/new_volume.py [--title 标题] [--column 商业卷|历史卷|人性卷|底层逻辑卷] [--root 测试根目录]
生成 episodes/ARC-YYYYMMDD-NN/{state.json,STATE.md,01_topic.yaml,02_facts.md,03_script.md,04_vo,05_shots.yaml,06_assets,07_render,08_publish,09_data,review}"""
import argparse, json, datetime, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import stateutil as su
a = argparse.ArgumentParser(); a.add_argument("--title", default=""); a.add_argument("--column", default=None)
a.add_argument("--root", default=str(su.ROOT)); o = a.parse_args()
root = pathlib.Path(o.root); eps = root / "episodes"; eps.mkdir(parents=True, exist_ok=True)
day = datetime.datetime.now(su.TZ).strftime("%Y%m%d"); n = 1
while (eps / f"ARC-{day}-{n:02d}").exists(): n += 1
ep = eps / f"ARC-{day}-{n:02d}"
for d in ["04_vo", "06_assets", "07_render", "08_publish", "09_data", "review"]: (ep / d).mkdir(parents=True, exist_ok=True)
(ep / "01_topic.yaml").write_text("# 选题卡（从 topics/cards 复制或引用）\ncard: null\n", encoding="utf-8")
(ep / "02_facts.md").write_text("# 事实表\n\n| # | 事实（带出处） | 观点（谁说的） | 推测（标推测） |\n|---|---|---|---|\n", encoding="utf-8")
(ep / "03_script.md").write_text("# 稿子（四幕，模板见 templates/script_4act.md）\n", encoding="utf-8")
(ep / "05_shots.yaml").write_text("# 分镜：每句对应一个镜头语法（G01–G10，见 docs/shot_grammar.md）\nshots: []\n", encoding="utf-8")
(ep / "06_assets/SOURCES.md").write_text("# 素材来源（他人素材只记来源；AI 生成标「AI 生成」）\n\n| 素材 | 作者 / 来源 | 链接 | 用途 | AI 生成 |\n|---|---|---|---|---|\n", encoding="utf-8")
(ep / "review/changes.md").write_text("# 修改记录（意见→镜头→改了什么→新版本文件→旧版本位置）\n", encoding="utf-8")
s = json.loads((su.ROOT / "state/template/state.json").read_text(encoding="utf-8"))
s.update(id=ep.name, title=o.title, column=o.column, created_at=su.now())
s["log"].append(f"{su.now()} 建卷"); su.save(ep, s); print(ep)
