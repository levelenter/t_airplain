---
name: blender-afterburner
description: Blenderでジェットエンジンの「アフターバーナーの炎」（ノズル内の琥珀色の輝き、青白い高温コアと静止した衝撃波ダイヤ、拡散する青いプルーム）をGLBとして生成し、A-Frame/three.jsのARで加算合成表示するまでの手順。「アフターバーナー」「排気炎」「ジェットの噴射」「マッハディスク／ショックダイヤ」「エンジンの後ろの青い炎」と言われたら使う。風・気流の光跡（blender-orbit-glow）とは別物で、ノズル位置・軸・出口半径・長さ・色を変えれば別のエンジンにも流用できる。
---

# Blender アフターバーナー炎エフェクト生成

## 成果物の構造（なぜこの作りか）

参考写真（夜間のアフターバーナー）の見え方を 3 つの群に分解している。

- **ノズル内の琥珀色の輝き**: ノズル内壁のすぐ内側に沿う閉じた光のリング 4 本と、出口リップに明るいリング 2 本、
  出口から巻き出す細い光 6 本。1 回転／ループで回し、脈動が内壁を巡る。
- **青白い高温コアと衝撃波ダイヤ**: 出口から伸びる細く明るいリボンの束（既定 16＋12＋10 本）。
  出口付近は白、下流ほど青く薄くなる（`core_modulate`）。衝撃波ダイヤ（マッハディスク）は
  **軸方向の位置が固定された明るい脈動**で、流れが動いてもダイヤは動かない（実物と同じ）。
- **拡散する青いプルーム**: 幅広で淡いリボンが広がりながら減衰。出口付近 15% は減衰なし。
- **動きの付け方（`--style`）**
  - `cylinder`（既定・Marker3 で採用）: helix の明るいらせんコアを**出口半径の円筒に閉じ込めた**もの（広がらない）。
    中心の光量が最も強い。円筒内を走る光条（`--streak-count`）と、円筒のすぐ外側で逆向きに回る陽炎（`--shimmer-count`）を重ねる。
    静止形状は持たない。乱流の雲や外側プルームは付けない（広がって円筒から外れるため）。
  - `straight`（既定）: `--body none`（既定）では**静止した形状を一切持たない**。白熱の塊は `--core-puffs`（既定 28）の
    幅広く柔らかい光の塊が軸沿いを 1 ループ 2 回の速さで通過し続けることで作る。静止リボンはどんなに柔らかくしても
    「止まった線」として目に付くため、これが最終的に採用した形。`--body soft`（静止ハローの塊）と `--body lines`（静止芯線、
    衝撃波ダイヤ付き）は旧挙動として残してある。動きは以下で付ける。
    1. 短い明るい光条（`--streak-count`、既定 44）が出口の内側から下流へ**実際に移動**し、両端でスケール 0 にフェードして周期ループ（毎フレームの位置・拡縮キー）
    2. **乱流の雲**（`--turb-count`、既定 22）: 幅広で柔らかい波打つリボンが広がりながら移動（1 ループで 1 周または 2 周）。重なって雲状に揺れ動く
    3. **陽炎**（`--shimmer-count`、既定 14）: ほぼ無色の淡い波状リボンを軸まわりに逆向き 2 群で 1 回転／ループさせ、輪郭を揺らめかせる
    2 と 3 は省かない。実物のジェット噴流に近い、直線的で揺らめく見え方になる。
  - `helix`: らせんを軸まわりに回す**ねじの錯視**で流す。渦を巻く乱流的な見え方。らせんが目立って違和感が出る場合は straight にする。

共通の仕組み:

- 各リボンは「細く明るい芯＋広く淡いハロー」の多層構造で、断面を「+」字にしてどの角度からも見える。
- 色と透明度は**頂点カラー（RGBA）**のみ。ARにはブルームがないので **Unlit＋加算合成** で発光を再現する。
  glTFに加算合成の仕様はないため three.js 側でマテリアルを書き換える（`references/aframeAdditiveGlow.ts`）。
- helix スタイルの動きは**ねじの錯視**: 排気軸まわりに巻いたらせんを軸まわりに剛体回転させると、軸方向へ流れて見える。
  見かけの進行方向 = −(回転の向き)×(巻きの向き)。スクリプトは「角度 = a0 + k·t、群の回転 = −turns」で
  下流（軸の正方向）へ流れるよう固定してある。ループは整数回転なので継ぎ目なし。
- straight スタイルの光条は位置・拡縮キーで動くため、`finalize_glb.py` は回転以外のチャンネルも受け付ける
  （ループ端で値が一致することだけを検証）。
- **機体（ノズル本体）とは別 GLB にする**。加算合成を機体にまで掛けると白飛びするため、
  炎の entity にだけ `additive-glow` を付ける。

## 手順

Blender本体: `/Applications/Blender.app/Contents/MacOS/Blender`（5.x で動作確認）。

1. エンジン側の座標を確認する: 排気軸（X/Y/Z）、出口面の軸座標、軸の他 2 座標、出口の内半径。
   例: `__dev/output/jet_ar3/create_model.py` の「Open exhaust nozzle」プロファイル（軸 +X、出口 x=7.7、半径 1.22、z=2.0）。
2. 生成（`--` の後がスクリプト引数）
   ```bash
   /Applications/Blender.app/Contents/MacOS/Blender -b --python .claude/skills/blender-afterburner/scripts/create_afterburner.py -- \
     --out __dev/output/<name>/<model>.glb --axis X --exit 7.7 --center 0,2 --exit-radius 1.22 --length 9.5
   ```
   主な引数: `--core/--core-hot/--core-deep` `--amber/…` `--haze/…`（R,G,B 0..1）`--diamonds` `--diamond-gap`
   `--core-count 16,12,10` `--haze-count` `--turns` `--scale-widths` `--seconds` `--seed`。`.blend` も同じ場所に保存される。
   **青白い炎だけ**にするなら `--nozzle-glow 0`、**火力を強く**見せるなら `--intensity 1.5〜2`（不透明度・白熱区間・ダイヤの強さが伸びる）に
   `--core-count 24,16,14 --streak-count 44 --shimmer-count 16 --turns 4 --scale-widths 1.2 --length 11.5 --core-length 0.75` を組み合わせる（Marker3 の設定、`--style cylinder`）。
   らせん状に流したいときだけ `--style helix --turns 4`。
3. 後処理（必須）: アニメーションを1クリップに統合、`KHR_materials_unlit` 化、検証、配信先へコピー
   ```bash
   python3 .claude/skills/blender-afterburner/scripts/finalize_glb.py __dev/output/<name>/<model>.glb --clip <ClipName> --copy-to public/3dmodels/
   ```
4. AR相当プレビュー（three.js＋加算合成、インストール済みChromeを使用）。側面と、ノズルを覗き込む後方の 2 視点を撮る。
   ```bash
   node .claude/skills/blender-afterburner/scripts/shot_preview.mjs . public/3dmodels/<model>.glb __dev/output/<name> 12,0,2 14 0.5 2.0
   ```
   `ar_preview_side_t*.png` / `ar_preview_rear_t*.png` をユーザーに見せて判断してもらう。
   機体と重ねた見え方はアプリの `/preview`（メニューの「PCでプレビュー」）で確認する。
5. 組み込み（このプロジェクトの場合）
   - `registerAdditiveGlow()` は `CameraView.vue` と `PreviewView.vue` で登録済み。
   - 機体 GLB から旧排気（ストリーク・流線・半透明の筒）を除いて再生成し、`Contents<N>.vue` を 2 entity にする:
     機体側は通常描画、炎側に `:gltf-animation="`clip: <ClipName>; enabled: ${active}`"` と `additive-glow`。
   - テスト（`src/__tests__/glowAirflow.spec.ts` など）でクリップ名・メッシュ数・`KHR_materials_unlit`・
     root（`AB_Core_Root` / `AB_Streak_Root` / `AB_Haze_Root`、nozzle-glow 有効時は `AB_Nozzle_Glow_Root`）を検証する。

## 落とし穴（再発防止）

- glTFエクスポーターは **Emissionシェーダ→頂点カラー** を認識せず COLOR_0 が全白になる。Principled の Base Color / Alpha に頂点カラーを繋ぎ、Unlit化は `finalize_glb.py` で行う。
- `finalize_glb.py` は**全メッシュで最小アルファ = 0、最大アルファ > 0.08** を要求する（全透明の壊れた出力を弾くため）。
  陽炎のような極めて淡いリボンは opacity を 0.05 未満にしない。遠方減衰（`modulate`）も出口付近では 1 にしておく。
- 琥珀色のリングはノズル内壁より**内側**（半径 −0.06）に置く。壁の外だと機体に隠れて見えない。
- 出口半径が小さいエンジンではコアが密になりすぎて白い塊になる。`--scale-widths` を下げるか `--core-count` を減らす。
- 逆に AR の倍率（content-transforms の scale）が小さいと細いコイルに見える。`--scale-widths` を上げ、本数を増やす。
- `export_all_vertex_colors=False` を付けないと COLOR_1 が付いて容量が倍増する。分割数（`ribbon(...,110)` など）を上げると容量が線形に増える。
- Playwright 同梱の headless shell ではWebGLが動かない。`channel:'chrome'` を使う。
- 軸の向きを変えるときは `--axis` だけ変える。巻き方向と回転の符号はスクリプト内で対応済みで、手で反転させない。
- 移動する要素（光条など）の位置キーは**親 root からの相対座標**（`place(along,0,0)`）で打つ。絶対座標 `root_location()` を入れると
  root の位置ぶん二重にずれて、光条だけ軸から外れて見える（過去の不具合）。

## 調整の目安

| 見た目の要望 | 変更箇所 |
|---|---|
| もっと白く／青く | `--core-hot`（白側）`--core`（青側）、`core_modulate` の `1-t*2.8`（白が続く長さ） |
| 炎を長く／短く | `--length`（プルームは 1.15 倍で追従）。らせんコアだけ短く: `--core-length 0.75` など |
| ダイヤの数・間隔 | `--diamonds` `--diamond-gap` |
| 太く／細く | `--scale-widths`、または content-transforms の scale |
| 流れを速く／遅く | straight: 光条は 1 ループで炎全長を走る（`--seconds` を短くすると速い）。helix: `--turns`（整数。3 が標準、4 で全開） |
| 光条の量 | `--streak-count`（既定 44）。外側に漂う光条 `--haze-streaks` は既定 0（離れた塊に見えやすい） |
| 周辺の動きが足りない／多すぎる | `--turb-count`（乱流の雲）`--shimmer-count`（陽炎）。陽炎の濃さは `SHIMMER` の opacity |
| 中心が固定の線に見える | `--style cylinder` か `--body none`。静止した塊が欲しければ `--style straight --body soft` |
| 中心の光量が足りない | `--style cylinder`（らせんコア）にして `--intensity` と `--core-count` を上げる |
| 炎が外へ広がってほしくない | `--style cylinder`（広がるのは helix / straight の乱流） |
| 白熱の塊の量 | `--core-puffs`（既定 28）。`PUFF` の opacity で濃さ |
| らせんが気になる／直線にしたい | `--style straight`（既定） |
| 火力を強く／弱く | `--intensity`（1 が標準。1.7 で全開の見た目、0.7 で控えめ） |
| 琥珀色の輝きを消す | `--nozzle-glow 0` |
| ノズル内の輝きが見えない | `--wall-depth` を浅く、または機体側ノズルにカットアウトを作る |
| 容量を減らす | `--core-count` `--haze-count` を減らす、`ribbon(...)` の分割数を下げる |
