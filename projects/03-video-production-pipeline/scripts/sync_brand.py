#!/usr/bin/env python3
"""把 config/brand_config.yaml 同步成 remotion/src/brand.ts（规则 18：品牌项只从 brand_config 读）。"""
import json, pathlib, yaml
R = pathlib.Path(__file__).resolve().parent.parent
cfg = yaml.safe_load((R / "config/brand_config.yaml").read_text(encoding="utf-8"))
keep = {k: cfg[k] for k in ["account_name", "series_title", "columns", "ip", "style", "format", "bgm", "seal", "catchphrase"]}
(R / "remotion/src/brand.ts").write_text("// 由 scripts/sync_brand.py 从 config/brand_config.yaml 生成，勿手改。\nexport const BRAND = "
    + json.dumps(keep, ensure_ascii=False, indent=2) + " as const;\n", encoding="utf-8")
print("brand.ts ok")
