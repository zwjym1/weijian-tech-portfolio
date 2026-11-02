#!/bin/bash
# T02 终混：raw.mp4（口播+音效，无 BGM）→ 响度 -16 LUFS / TP<=-1.5（两遍 loudnorm，线性）→ 无BGM版；另做一版叠加 BGM（仅试听参考）
set -e; R=/workspace/tongzhengshi/renders/T02; RAW=$1; OUT=$R/${2:-t02_draft}
APP=/workspace/tongzhengshi/project/app
norm() { # in out_audio_wav
  local J=$(ffmpeg -hide_banner -nostats -i "$1" -af loudnorm=I=-16:TP=-1.7:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  local mi=$(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'])"); local mt=$(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_tp'])")
  local ml=$(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_lra'])"); local mh=$(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_thresh'])"); local mo=$(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['target_offset'])")
  echo "$mi|$mt|$ml|$mh|$mo" >&2
  echo "loudnorm=I=-16:TP=-1.7:LRA=11:measured_I=$mi:measured_TP=$mt:measured_LRA=$ml:measured_thresh=$mh:offset=$mo:linear=true"
}
# 无 BGM 版
F=$(norm $RAW); ffmpeg -y -v error -i $RAW -c:v copy -af "$F" -ar 48000 -c:a aac -b:a 192k ${OUT}_noBGM.mp4
# BGM 版
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $RAW)
ffmpeg -y -v error -i $RAW -stream_loop -1 -i $APP/public/g6/audio/bgm_investigations.mp3 -filter_complex "[1:a]volume=0.085,afade=t=in:d=0.4,afade=t=out:st=$(python3 -c "print(max(0,$D-1.2))"):d=1.2,atrim=0:$D,asetpts=PTS-STARTPTS[b];[0:a][b]amix=inputs=2:normalize=0:duration=first[m]" -map 0:v -map "[m]" -c:v copy -c:a pcm_s16le /tmp/t02_bgmmix.mkv
F2=$(norm /tmp/t02_bgmmix.mkv); ffmpeg -y -v error -i /tmp/t02_bgmmix.mkv -c:v copy -af "$F2" -ar 48000 -c:a aac -b:a 192k ${OUT}_BGM.mp4
for f in ${OUT}_noBGM.mp4 ${OUT}_BGM.mp4; do echo "== $f"; ffprobe -v error -show_entries format=duration -of csv=p=0 $f; ffmpeg -hide_banner -nostats -i $f -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|LRA:|Peak:" | tail -3; done
