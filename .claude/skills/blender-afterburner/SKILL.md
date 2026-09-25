---
name: blender-afterburner
description: Blenderでジェットエンジンの「アフターバーナーの炎」をGLBとして生成し、A-Frame/three.jsのARで加算合成表示するまでの手順（確定版 2026-09-17）。青白い炎だけで構成し、回転するらせんの束が蝋燭の炎のように一点へ収束する高温コア、同じ円錐に沿って走る光条、外周で揺らめく陽炎からなり、静止した形状は無く 0.5 秒ループで全開の勢い。「アフターバーナー」「排気炎」「ジェットの噴射」「マッハディスク／ショックダイヤ」「エンジンの後ろの青い炎」と言われたら使う。風・気流の光跡（blender-orbit-glow）とは別物で、ノズル位置・軸・出口半径を指定すれば別のエンジンにもそのまま流用できる。
---

# Blender アフターバーナー炎エフェクト生成（確定版）

## 確定した見た目（既定値で出るもの）

Marker3 で調整を重ねて **2026-09-17 に確定**した形。`create_afterburner.py` の既定値がこの仕様そのものなので、
**エンジン座標（`--axis` `--exit` `--center` `--exit-radius`）だけ指定すれば同じ炎が出る**。
見た目を変える指示がない限り、他の引数は触らない。

- **静止した形状は 1 つもない**。全メッシュが動く（静止リボンはどんなに柔らかくしても「止まった線」に見える）。
- **ループ 0.5 秒・60fps（31 フレーム）**。全開の勢い。落ち着かせるなら `--seconds 2 --fps 30`。
- **青白い炎だけ**。琥珀色のノズル発光は無し（`--nozzle-glow 0`）。強度 `--intensity 1.7`、リボン幅 `--scale-widths 1.2`。
- **中心（らせんコア）**: 細く明るいリボン 54 本（主 24・淡 16・極細 14）が軸まわりに 4 回転／ループで回り、
  ねじの錯視で下流へ流れて見える。根元の半径は出口半径の約 0.86（`--core-radius 1.1`）で光条の筒に接し、
  先端へ向かって**蝋燭の炎のように一点へ収束**する（`--core-taper candle`）。長さは全長 11.5 の 2/3（`--core-length 0.667`）。
  出口付近は白熱、下流ほど青く薄くなる。衝撃波ダイヤ 5 つは軸位置固定の明るい脈動で、流れが動いても動かない。
- **光条**: 短い明るい光条 44 本（`--streak-count`）が出口半径の 0.9 倍の筒（`--tail-radius 0.9`）の中を出口の内側から下流へ
  **実際に移動**し、両端でスケール 0 にフェードして周期ループ。走行域は全長の 1.25 倍（`--tail-length 1.25`）にわたる
  らせんと同じ炎型の円錐で、外側の光条ほど円錐が細くなる手前で消える。
- **陽炎**: ほぼ無色に近い淡い波状リボン 16 本（`--shimmer-count`）が光条の筒のすぐ外側を逆向き 2 群で 1 回転／ループし、
  輪郭が揺らめく。収束させず直線。長さは光条と同じ 1.25 倍。屈折は再現できないので、輪郭が揺れる見え方で代替する。
- 外へ広がる乱流の雲、静止した外側プルーム、琥珀色のリングは**付けない**（`--style straight|helix` / `--nozzle-glow 1` で旧挙動）。

共通の仕組み:

- 各リボンは「細く明るい芯＋広く淡いハロー」の多層構造で、断面を「+」字にしてどの角度からも見える。
- 色と透明度は**頂点カラー（RGBA）**のみ。ARにはブルームがないので **Unlit＋加算合成** で発光を再現する。
  glTFに加算合成の仕様はないため three.js 側でマテリアルを書き換える（`references/aframeAdditiveGlow.ts`）。
- らせんの動きは**ねじの錯視**: 見かけの進行方向 = −(回転の向き)×(巻きの向き)。スクリプトは「角度 = a0 + k·t、群の回転 = −turns」で
  下流（軸の正方向）へ流れるよう固定してある。ループは整数回転なので継ぎ目なし。
- 光条は毎フレームの位置・拡縮キーで動く。`finalize_glb.py` は回転以外のチャンネルも受け付ける（ループ端の一致だけ検証）。
- **機体（ノズル本体）とは別 GLB にする**。加算合成を機体にまで掛けると白飛びするため、炎の entity にだけ `additive-glow` を付ける。

## 手順

Blender本体: `/Applications/Blender.app/Contents/MacOS/Blender`（5.x で動作確認）。

1. エンジン側の座標を確認する: 排気軸（X/Y/Z）、出口面の軸座標、軸の他 2 座標、出口の内半径。
   例: `__dev/output/jet_ar3/create_model.py` の「Open exhaust nozzle」プロファイル（軸 +X、出口 x=7.7、半径 1.22、z=2.0）。
2. 生成（`--` の後がスクリプト引数）。**エンジン座標以外は既定値のまま**。
   ```bash
   /Applications/Blender.app/Contents/MacOS/Blender -b --python .claude/skills/blender-afterburner/scripts/create_afterburner.py -- \
     --out __dev/output/<name>/<model>.glb --axis X --exit 7.7 --center 0,2 --exit-radius 1.22
   ```
   `.blend` も同じ場所に保存される。引数の一覧はスクリプト冒頭の docstring を参照。
3. 後処理（必須）: アニメーションを1クリップに統合、`KHR_materials_unlit` 化、検証、配信先へコピー
   ```bash
   python3 .claude/skills/blender-afterburner/scripts/finalize_glb.py __dev/output/<name>/<model>.glb --clip <ClipName> --copy-to public/3dmodels/
   ```
   クリップ名はループ秒を含める（例 `Jet_Afterburner_Glow_Loop_05s`）。
4. AR相当プレビュー（three.js＋加算合成、インストール済みChromeを使用）。側面と、ノズルを覗き込む後方の 2 視点を撮る。
   ```bash
   node .claude/skills/blender-afterburner/scripts/shot_preview.mjs . public/3dmodels/<model>.glb __dev/output/<name> 13,0,2 16 0.05 0.25
   ```
   `ar_preview_side_t*.png` / `ar_preview_rear_t*.png` をユーザーに見せて判断してもらう。
   機体と重ねた見え方はアプリの `/preview`（メニューの「開発用プレビュー」）で、側面と斜めの 2 視点＋時間差で撮って動きも確認する。
5. 組み込み（このプロジェクトの場合）
   - `registerAdditiveGlow()` は `CameraView.vue` と `PreviewView.vue` で登録済み。
   - 機体 GLB から旧排気（ストリーク・流線・半透明の筒）を除いて再生成し、`Contents<N>.vue` で炎の entity に
     `:gltf-animation="`clip: <ClipName>; enabled: ${active}`"` と `additive-glow` を付ける。機体側は通常描画。
   - テスト（`src/__tests__/glowAirflow.spec.ts`）でクリップ名・メッシュ数（114）・`KHR_materials_unlit`・
     root（`AB_Core_Root` / `AB_Streak_Root` / `AB_Shimmer_Root_A|B`）と「メッシュを持つ全ノードが動く」ことを検証する。

## 落とし穴（再発防止）

- glTFエクスポーターは **Emissionシェーダ→頂点カラー** を認識せず COLOR_0 が全白になる。Principled の Base Color / Alpha に頂点カラーを繋ぎ、Unlit化は `finalize_glb.py` で行う。
- `finalize_glb.py` は**全メッシュで最小アルファ = 0、最大アルファ > 0.08** を要求する（全透明の壊れた出力を弾くため）。
  陽炎のような極めて淡いリボンは opacity を 0.05 未満にしない。遠方減衰（`modulate`）も出口付近では 1 にしておく。
- 移動する要素（光条など）の位置キーは**親 root からの相対座標**（`place(along,0,0)`）で打つ。絶対座標 `root_location()` を入れると
  root の位置ぶん二重にずれて、光条だけ軸から外れて見える（過去の不具合）。
- 平らに切れた円筒は「切断面」に見える。らせんと光条の終端は必ず一点に絞る（`--core-taper candle`）。
- スクリプト内の変数名 `taper` はノズル壁の勾配。炎型の関数は `flame_taper` で、名前を衝突させない（過去の不具合）。
- 外へ広がる要素（乱流の雲、外側プルーム）は円筒から外れて「離れた塊」に見える。標準では付けない。
- 出口半径が小さいエンジンではコアが密になりすぎて白い塊になる。`--scale-widths` を下げるか `--core-count` を減らす。
  逆に AR の倍率（content-transforms の scale）が小さいと細く見える。`--scale-widths` を上げ、本数を増やす。
- 1 秒未満のループは `--fps 60` を併用してフレーム数（30 前後）を保つ。
- `export_all_vertex_colors=False` を付けないと COLOR_1 が付いて容量が倍増する。分割数（`ribbon(...,110)` など）を上げると容量が線形に増える。
- Playwright 同梱の headless shell ではWebGLが動かない。`channel:'chrome'` を使う。
- 軸の向きを変えるときは `--axis` だけ変える。巻き方向と回転の符号はスクリプト内で対応済みで、手で反転させない。

## 調整の目安（確定版から変える場合のみ）

| 見た目の要望 | 変更箇所 |
|---|---|
| 速く／遅く | `--seconds --fps`（0.5/60 が標準。2/30 で落ち着いた噴流）。らせんの回転数は `--turns`（4） |
| 火力を強く／弱く | `--intensity`（1.7 が標準。1 で控えめ）、`--core-count`（24,16,14） |
| 炎を長く／短く | `--length`（11.5）。らせんだけ: `--core-length`（0.667）、光条と陽炎だけ: `--tail-length`（1.25） |
| 太く／細く | `--scale-widths`（1.2、リボン幅）、`--core-radius`（1.1、らせんの根元）、`--tail-radius`（0.9、光条と陽炎の筒）、生成時の `--exit-radius` |
| 先端を尖らせる／平らな筒にする | `--core-taper candle`（既定、らせんと光条が収束）/ `none` |
| もっと白く／青く | `--core-hot`（白側）`--core`（青側）、`core_modulate` の `1-t*2.8/I`（白が続く長さ） |
| 陽炎を強く／弱く | `--shimmer-count`（16）、`SHIMMER` の opacity |
| 光条の量 | `--streak-count`（44） |
| ダイヤの数・間隔 | `--diamonds`（5）`--diamond-gap`（1.2） |
| 琥珀色のノズル発光が欲しい | `--nozzle-glow 1` |
| 広がる乱流や渦が欲しい | `--style straight`（乱流の雲）/ `--style helix`（広がるらせん） |
| 容量を減らす | `--core-count` `--streak-count` を減らす、`ribbon(...)` の分割数を下げる |
