---
name: blender-orbit-glow
description: Blenderで「発光する軌道リングの光跡エフェクト」（傾いた多数のリングが回転しながら光る、エネルギー球・原子軌道風）をGLBとして生成し、A-Frame/three.jsのARで加算合成表示するまでの手順。「光の軌跡」「グロー」「オービット」「風・エネルギーのエフェクトを3Dモデルで」「Marker7のようなエフェクト」と言われたら使う。色・大きさ・本数・ループ秒・クリップ名を変えて別マーカー用にも流用できる。
---

# Blender オービット・グローエフェクト生成

## 成果物の構造（なぜこの作りか）

- 各リングは **細く明るい芯 + 広く淡いハロー** の多層リボン。断面を「+」字（面内リボンと面外リボン）にして、どの角度からも見える。
- 色と透明度は **頂点カラー（RGBA）** のみで決まる。明るさの脈動（ガウス山）がリング上に置かれ、リングが回転することで光が流れて見える。
- ARにはブルームがないので、**Unlit + 加算合成（Additive Blending）** でグローを再現する。glTFに加算合成の仕様はないため、three.js側でマテリアルを書き換える（`references/aframeAdditiveGlow.ts`）。
- ループはリングの自転（整数回転）と全体の歳差（整数回転）で継ぎ目なし。

## 手順

Blender本体: `/Applications/Blender.app/Contents/MacOS/Blender`（5.x で動作確認）。

1. 生成（`--` の後がスクリプト引数）
   ```bash
   /Applications/Blender.app/Contents/MacOS/Blender -b --python .claude/skills/blender-orbit-glow/scripts/create_orbit_glow.py -- \
     --out __dev/output/<name>/<model>.glb --color 0.22,1.0,0.45 --radius 1.8 --seconds 4 --preview
   ```
   主な引数: `--color/--core/--deep`(R,G,B 0..1) `--radius` `--center-z` `--main/--faint/--streak`(本数) `--seconds` `--fps` `--seed` `--precession`。
   `.blend` も同じ場所に保存される。`preview.png` はライティング付きでチューブ状に見える。**参考程度**で、判断には使わない。
2. 後処理（必須）: アニメーションを1クリップに統合、`KHR_materials_unlit` 化、検証、配信先へコピー
   ```bash
   python3 .claude/skills/blender-orbit-glow/scripts/finalize_glb.py __dev/output/<name>/<model>.glb --clip <ClipName> --copy-to public/3dmodels/
   ```
3. AR相当プレビュー（three.js + 加算合成、インストール済みChromeを使用）
   ```bash
   node .claude/skills/blender-orbit-glow/scripts/shot_preview.mjs . public/3dmodels/<model>.glb __dev/output/<name> <center-z> 0.5 2.0
   ```
   `ar_preview_t*.png` をユーザーに見せて判断してもらう。
4. 組み込み（このプロジェクトの場合）
   - `src/utils/aframeAdditiveGlow.ts` の `registerAdditiveGlow()` を `CameraView.vue` で `registerGltfAnimation()` の直後に呼ぶ（既に実装済みなら不要）。
   - `Contents<N>.vue` の `a-entity` に `:gltf-animation="`clip: <ClipName>; enabled: ${active}`"` と `additive-glow` を付ける。
   - 配置は `src/config/content-transforms.json`。半径1.8で直径約4ユニットなので scale 0.25 で約1m。
   - テスト（`src/__tests__/marker<N>.spec.ts`）でメッシュ数・クリップ名・`KHR_materials_unlit` を検証する。

## 落とし穴（再発防止）

- glTFエクスポーターは **Emissionシェーダ→頂点カラー** のパターンを認識せず COLOR_0 が全白になる。必ず Principled の Base Color / Alpha に頂点カラーを繋ぎ、Unlit化は `finalize_glb.py` で行う。
- three.js は頂点カラーを emissive に掛けない。Principled のまま出すと白く光る。Unlit化が必須。
- `export_all_vertex_colors=False` を付けないと COLOR_1 が付いて容量が倍増する。
- 加算合成は明るい背景（白い机など）で薄く見える。その場合は `create_orbit_glow.py` の各レイヤーの opacity（`layers` の2番目の値）を上げて再生成する。
- Playwright 同梱の headless shell ではWebGLが動かない。`channel:'chrome'` を使う。
- 動きが速すぎるときは `add_ring` の `turns`（自転回数）の候補から 2 を外す。

## 調整の目安

| 見た目の要望 | 変更箇所 |
|---|---|
| 色を変える | `--color`（芯は `--core`、外側ハローは `--deep`） |
| 大きく／小さく | `--radius`（リボン幅も連動）または content-transforms の scale |
| もっと密に／すっきり | `--main` `--faint` `--streak` |
| 光の脈動を増やす | `add_ring` 内の `random.randint(2,3)` |
| ループ長 | `--seconds`（`--precession` は整数のまま） |
