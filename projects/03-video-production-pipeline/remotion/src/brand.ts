// 由 scripts/sync_brand.py 从 config/brand_config.yaml 生成，勿手改。
export const BRAND = {
  "account_name": "秘书丞",
  "series_title": "{account_name}档案·第{no:03d}卷｜{column}",
  "columns": [
    "商业卷",
    "历史卷",
    "人性卷",
    "底层逻辑卷"
  ],
  "ip": {
    "form": "host_plus_guest",
    "host": {
      "id": "mishucheng",
      "name": "秘书丞",
      "persona": "揭穿真相的档案官：古代掌管文书的官，冷静可信、略带调侃；每期调出一份卷宗，拆一个局",
      "identity_core": [
        "乌纱帽两侧长翅剪影",
        "朱红官袍",
        "文书官身份（卷宗/朱笔）"
      ],
      "look_candidates": {
        "S1": {
          "name": "纸偶剪纸版",
          "card": "assets/cast/host_mishucheng/S1_paper_puppet/card_v1.jpg",
          "status": "selected"
        },
        "S2": {
          "name": "半写实插画版",
          "card": "assets/cast/host_mishucheng/S2_illustrated/card_v1.jpg",
          "status": "not_selected"
        },
        "S3": {
          "name": "极简符号版",
          "card": "assets/cast/host_mishucheng/S3_symbol/card_v1.jpg",
          "status": "not_selected"
        }
      },
      "look_current": "S1",
      "parts_dir": "assets/cast/host_mishucheng/S1_paper_puppet/parts",
      "expressions": [
        "calm",
        "smirk",
        "expose"
      ],
      "rejected": [
        {
          "id": "H1_faceless_archivist",
          "date": "2026-10-22"
        },
        {
          "id": "H2_paper_puppet",
          "date": "2026-10-22"
        },
        {
          "id": "A_drawer_curator",
          "date": "2026-10-23",
          "dir": "assets/cast/_rejected/host_v2/A_drawer_curator"
        },
        {
          "id": "B_lamp_bearer",
          "date": "2026-10-23",
          "dir": "assets/cast/_rejected/host_v2/B_lamp_bearer"
        },
        {
          "id": "C_paper_crane",
          "date": "2026-10-23",
          "dir": "assets/cast/_rejected/host_v2/C_paper_crane"
        }
      ]
    },
    "guests": {
      "enabled": true,
      "pool_dir": "assets/cast/guests",
      "promote_rule": "每 10 条复盘一次，评论点名多的客串才升常驻"
    }
  },
  "style": {
    "id": "dark_archive_codeviz",
    "palette": {
      "bg": "warm_black",
      "accent": "vermilion",
      "contrast": "cool_blue"
    },
    "subtitle_font": "serif_cn"
  },
  "format": {
    "aspect": {
      "main": "16:9",
      "cut": "9:16"
    },
    "duration_s": {
      "main_default": [
        120,
        180
      ],
      "main_ab_alt": [
        60,
        90
      ],
      "cut": [
        50,
        70
      ]
    },
    "dual_publish": true
  },
  "bgm": {
    "mode": "per_episode",
    "allow_none": true,
    "library_dir": "assets/bgm"
  },
  "seal": {
    "optional": true,
    "asset": "assets/seal/seal_t.png"
  },
  "catchphrase": {
    "open": "调档。",
    "close": "此卷，结案。"
  }
} as const;
