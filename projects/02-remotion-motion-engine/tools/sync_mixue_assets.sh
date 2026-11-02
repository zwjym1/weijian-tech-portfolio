#!/bin/bash
# 渲染前重新读取 codex 素材（会被同名返修覆盖）
set -e; S=/workspace/tongzhengshi/assets/mixue; D=$(dirname $0)/../public/mixue/a; mkdir -p $D
for f in $S/[01]*/*.png; do cp -f "$f" $D/; done; ls $D | wc -l
