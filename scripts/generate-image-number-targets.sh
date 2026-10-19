#!/usr/bin/env bash
# 画像番号マーカー（public/marker/ar_image_number/01.png〜06.png）から、
# 8th Wall の Image Target 一式を生成して public/image-targets/ に出力するスクリプト。
# ターゲット名は number_01〜number_06（AR.js 版の marker_01 などと衝突させない）。
#
# 使い方:
#   1. 先に `node scripts/generate-image-number-markers.mjs` でマーカー画像を生成しておく
#   2. `bash scripts/generate-image-number-targets.sh`
#
# @8thwall/image-target-cli は対話式なので、標準入力に回答を流し込んで非対話で実行する。
# 回答順: 画像パス / 画像タイプ(1=flat) / 既定クロップを使うか(y) / 出力フォルダ / ターゲット名
# 既存ファイルは OVERWRITE_FILES=true で上書きする。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT/public/marker/ar_image_number"
OUT_DIR="$ROOT/public/image-targets"

for n in 01 02 03 04 05 06; do
  echo "== number_$n =="
  printf '%s\n' "$SRC_DIR/$n.png" 1 y "$OUT_DIR" "number_$n" \
    | OVERWRITE_FILES=true npx -y @8thwall/image-target-cli@1.0.0
done
