# archive-studio（秘书丞档案 · 新工作流）

依据：/workspace/science-studio/reports/workflow_rebuild_plan_20261022.md v0.2（2026-10-22 用户批全案推荐）。旧系统 /workspace/science-studio 只读。

- 品牌与参数：`config/brand_config.yaml`（唯一来源）→ `scripts/sync_brand.py` 同步到 `remotion/src/brand.ts`
- 规则：`config/rules.md`（18 条）｜流水线：`config/pipeline.yaml`（10 阶段、4 闸口）｜写手切换：`config/writers.yaml`｜A/B：`config/ab_plan.yaml`
- 新建一卷：`python3 scripts/new_volume.py --title … --column 商业卷` → `episodes/ARC-YYYYMMDD-NN/`；状态：`python3 scripts/state.py latest|show|stage|set|log|approve`
- 配音：`python3 lib/voice/vo.py episodes/<ARC>/`（Fish，声线读 brand_config）
- 字幕：`scripts/subs/oneline.py` → `remotion/src/common/OneLineSubtitles.tsx`
- 实地采集：`lib/field` → /workspace/skill_pkg/douyin-field-collect（venv /workspace/.venv-dy）
- 数据闭环：`scripts/` 下 ingest_* / diagnose / insights / feedback / due_checkpoints / harvest_comments / mark_published / weekly_report（db：`db/studio.db`，旧库复制件）
- Remotion：`remotion/`（node_modules 软链到旧样片工程，只读复用）
- `projects` 是 `episodes` 的软链，供旧数据脚本兼容。

## 进度
- [x] ① 目录 + 配置 + 状态模板 + 复用模块接入（2026-10-22 23:50 UTC+8）
- [x] ② 资产库（2026-10-23 00:00 前后 UTC+8；角色卡、BGM 仍为候选，等用户定）
- [ ] ③ Remotion 组件库 + 四幕模板
- [ ] ④ 选题系统改造 + 首批选题卡
- [ ] ⑤ 新总入口 skill 草稿 + 旧 skill 停用说明
- [ ] ⑥ 试跑第 1 卷
