# このプロジェクトについて
所沢航空発祥記念館のWebARコンテンツプロジェクトです。

画像マーカーによる6DoFのARコンテンツとする。


# 技術要件
vuejs
typescript 
a-frame
three.js
Open Source 8thwall

# 画面構成
メニュー画面でスタートするとカメラビューに遷移する
カメラビューで画像マーカーを認識すると、マーカーに対応するそれぞれのコンテンツを見ることができる。

# プロジェクトの構成
src/
  assets/
  components/
    ArContent.vue       マーカー追従・表示切替・配置適用をまとめた共通の入れ物
    TransformPanel.vue  ?debug=true のときに出る配置調整パネル
  composables/
    useDebugMode.ts     ?debug=true の判定と引き継ぎ
  config/
    content-transforms.json  各コンテンツの配置設定（調整結果の置き場所）
  pages/
    StartView.vue
    CameraView.vue
    Contents1.vue /public/3dmodels/model1_t1b_intake.glb（T-1B ノーズ・吸気）
    Contents2.vue /public/3dmodels/model2_t6g_wing_ar.glb（T-6G 主翼のひみつ：翼断面・気流・揚力・上反角）
    Contents3.vue /public/3dmodels/model3_jet.glb（ジェットエンジン）
    Contents4.vue /public/3dmodels/model4_C1_set.glb（C-1輸送機）
    Contents5.vue /public/3dmodels/model5_v44_airflow.glb（V-44 バートル・逆回転ローターと渦）
    Contents6.vue /public/3dmodels/model6_h19_antitorque.glb（H-19 シコルスキー・反トルク）
  router/
  stores/
  utils/
  App.vue
  main.ts

# 8th Wall（オープンソース版）について
8th Wall は 2026 年に OSS 化され、8thwall.com のホスティングは終了した（現 8thwall.org / GitHub: [8thwall/8thwall](https://github.com/8thwall/8thwall)）。本プロジェクトは以下の OSS 配布物を使用する。APIキーやアカウント登録は不要。

- `@8thwall/engine-binary` — エンジン本体（Distributed Engine Binary、SLAM入り・バイナリ限定ライセンス）。`data-preload-chunks="slam"` 付きで読み込むことで **6DoF ワールドトラッキング + Image Targets** が有効になる
- `@8thwall/xrextras` / `@8thwall/landing-page` — ヘルパー・非対応端末向けフォールバック（MIT）
- 8-Frame（`public/scripts/8frame-1.5.0.min.js`）— 8th Wall が調整した A-Frame 1.5.0（MIT）
- `@8thwall/image-target-cli` — 画像マーカーのメタデータをローカル生成する CLI

## 6DoF の仕組み
`CameraView.vue` の `<a-scene xrweb>` が SLAM によるワールドトラッキングを起動する
（`disableWorldTracking: true` を付けると 3DoF 相当になるため付けないこと）。
マーカー認識は `xrextras-named-image-target` コンポーネントが `xrimagefound / xrimagelost`
イベントに応じてコンテンツの表示とポーズ追従を行う。

# 開発手順

```bash
npm install
npm run dev          # http://localhost:5173
```

- 動作確認: メニュー →「スタート」→ カメラ許可 → `public/marker/` のマーカー画像
  （`marker1_dbouble.jpeg` 〜 `marker5_helico.jpg`）を別画面に表示（または印刷）してかざすと、
  マーカーを認識 → タップを促す表示 → タップでコンテンツが現れる
- 実機（スマホ）確認はカメラ利用のため HTTPS が必須。`npm run dev -- --host` で LAN 公開した上で
  ngrok 等でトンネルするのが簡単: `ngrok http 5173`
- 画像マーカーの追加方法は `public/image-targets/README.md` を参照
  （`npx @8thwall/image-target-cli@latest` で生成 → `src/utils/markers.ts` に登録）

> `public/` に置く静的ファイルは **ASCII のファイル名にすること**。
> macOS はファイル名を Unicode NFD で保存するため、濁点を含む日本語名（例: `〜など）.mp3`）は
> コード中の文字列と URL が一致せず 404 になる。

# PC でのローカルプレビュー（/preview）

スマホ実機やカメラを使わずに、マーカー上の AR コンテンツの見え方を PC のブラウザで確認できます。

1. `npm run dev` で開発サーバーを起動し、メニュー画面の「PCでプレビュー（カメラ不要）」を押す
   （URL 直接なら `http://localhost:5173/ar/preview`）
2. 上部のプルダウンで確認したいマーカーを選ぶ
3. マウスドラッグで視点を回転、ホイールで拡大縮小。「視点リセット」で初期視点に戻る
4. 右側の調整パネルで位置・回転・倍率・自動回転を変更できる。「JSON を送信」で
   `content-transforms.json` がダウンロードされるので、`src/config/` に置けば反映される

仕組み: 8th Wall（XR8）は起動せず、A-Frame（8frame）だけでシーンを描画します。
実機と同じ `Contents1〜7.vue` と同じ配置値を使い、マーカー画像（`public/image-targets/*_cropped.*`）を
原点に置いた板として表示します。座標系は 8th Wall の画像ターゲットに合わせ、
画像中心が原点・画像の上方向が +Y・画像の正面が +Z、画像の長辺が 1 単位です。
GLB 内アニメーションや加算合成（マーカー7）もそのまま動きます。

関連ファイル:

    src/pages/PreviewView.vue      プレビュー画面
    src/utils/aframeOrbitCamera.ts ドラッグ周回・ホイールズームのカメラ
    src/utils/arPreview.ts         マーカー JSON の読み込みと板の寸法計算
    src/components/ArContent.vue   プレビュー時はマーカー追従要素を素の a-entity に置き換える

# コンテンツの配置調整（?debug=true）

各コンテンツの表示位置・向き・大きさは `src/config/content-transforms.json` が持つ。
現地で実物を見ながら調整し、その結果を JSON で開発者へ送って反映する運用を想定している。

## 調整する（現地の担当者）

1. URL に `?debug=true` を付けて開く（例: `https://demo.blockvrock.com/ar/?debug=true`）
   - このクエリは「スタート」でカメラ画面へ移動しても引き継がれる
2. マーカーを認識させ、画面をタップしてコンテンツを表示する
3. 画面右上の「調整」ボタンで調整パネルを開く
4. 位置(XYZ) / 回転(XYZ) / 大きさ / 自動回転 を、実物を見ながら調整する
   - パネルは「▼」で折りたたむとモデル全体を確認できる
   - 調整対象は「いま認識しているマーカー」に自動で切り替わる
5. 「JSON を送信」を押す
   - スマホの共有シートからメールアプリを選ぶと、`content-transforms.json` を
     **添付したまま送信**できる（mailto: は添付を扱えないため Web Share API を使用）
   - 共有に対応していない環境では、同じ内容がファイルとして保存される

## 反映する（開発者）

受け取った `content-transforms.json` を所定の場所へ上書きし、ビルドして配信する。

```bash
cp ~/Downloads/content-transforms.json src/config/content-transforms.json
npm run build
```

JSON の項目が欠けていたり値が壊れている場合は、その項目だけ
`src/utils/contentTransform.ts` の既定値に自動でフォールバックするため、
一部だけ差し替えた JSON でも安全に読み込める。
### AR2：T-6G 主翼のひみつ

`marker_2`を認識してタップすると、翼断面と上反角の説明用GLBを表示します。
飛行機全体は含みません。青・赤の気流は内蔵クリップ `Airflow_Loop_4s` を4秒周期で再生します。
表示倍率は0.18、自動回転は無効です。`gltf-animation`はA-Frameの描画ループで更新し、
非表示中は更新を止め、コンポーネント削除時にはミキサーを解放します。
形状・角度・気流は説明用の模式表現です。実機では `?debug=true` の調整パネルで
マーカーに対する位置・向き・倍率を調整してください。

### AR3：ジェットエンジンの気流

`marker_3`（`public/marker/marker3_jet.jpg`）を認識してタップすると、
`public/3dmodels/model3_jet_airflow.glb`を表示します。写真を参考にした模式的な
円筒形エンジン・吸気ファン・断面と、青い吸気、紫〜水色の排気を含みます。
内蔵クリップ`Jet_Airflow_Loop_4s`でファンと気流を繰り返し再生し、非表示中は停止します。
模型への重ね合わせ用に自動回転は無効。位置・回転・倍率は`?debug=true`で現地調整してください。
模型の実測寸法やマーカーからの距離を反映したモデルではありません。

Blenderの編集用ファイル・再生成スクリプト・プレビューは`__dev/output/jet_ar3/`。
`create_model.py`をBlenderで実行後、`python3 __dev/output/jet_ar3/finalize_glb.py`で
アニメーションを1クリップに統合・検証し、配信用GLBへコピーします。
`__dev/integration/ar3-check.html`は、カメラを使わず表示・ロスト時の停止を確認する開発用ページです。

### AR1：T-1Bの「鼻」のひみつ

既存の `marker_1`（`public/marker/marker1_dbouble.jpeg`）を認識してタップすると、
白・オレンジのノーズ断面と、吸気口へ流れ込む水色の光の流線を表示します。ターゲット画像は従来のままです。

モデルは 2 つの GLB に分かれています。

- `model1_t1b_intake.glb` … ノーズ断面と模式的な J3 エンジン（静的、アニメーションなし）
- `model1_t1b_airflow_glow.glb` … 吸気の光の流線。`blender-orbit-glow` スキルの手法
  （多層リボン＋頂点カラー＋Unlit＋加算合成）で、吸気軸へ収束するらせん状のリボン 17 本を
  X 軸まわりに 1 回転／4 秒で回します。らせんはねじなので、回すと光の脈動が吸気口へ流れ込んで見えます。
  クリップ `Intake_Glow_Loop_4s`。`Contents1.vue` ではこの entity にだけ `additive-glow` を付け、
  機体側は通常描画のままにしています（機体まで加算合成にすると白飛びするため）。

画面下に要約と開閉できる詳細解説を表示します。

編集用 Blender ファイル・生成スクリプト・AR 相当プレビューは `__dev/output/t1b_glow/`。
再生成は次の通り（`__dev/output/t1b_ar1/` は旧版・矢印入りの生成物で、現在は使いません）。

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b --python __dev/output/t1b_glow/create_fuselage.py
cp __dev/output/t1b_glow/model1_t1b_intake.glb public/3dmodels/
/Applications/Blender.app/Contents/MacOS/Blender -b --python __dev/output/t1b_glow/create_intake_glow.py
python3 .claude/skills/blender-orbit-glow/scripts/finalize_glb.py __dev/output/t1b_glow/model1_t1b_airflow_glow.glb --clip Intake_Glow_Loop_4s --copy-to public/3dmodels/
node .claude/skills/blender-orbit-glow/scripts/shot_preview.mjs . public/3dmodels/model1_t1b_airflow_glow.glb __dev/output/t1b_glow 0 0 1 2
```

形状と流路は写真・原稿に基づく説明用模式図で、実測モデルや流体解析ではありません。
秒速約220mは提供原稿の参考値で、実機の特定運転条件を検証した値ではありません。
初期倍率0.3、自動回転なし。実機への重ね合わせは `?debug=true` またはメニューの「PCでプレビュー」で調整してください。

### Marker5：V-44 バートル・逆回転の渦とトルク打ち消し

既存の `marker_5`（`public/marker/marker5_helico.jpg`）を認識してタップすると、
V-44の説明用機体モデル、前後の逆回転ローター、下向きに進む青い渦の矢印を表示します。
原稿の「AR4」はコンテンツ名として扱い、指定どおりMarker5に配置しています。
機体側面の大きな左右の矢印でトルクの打ち消しを示します。上部の回転矢印はありません。
12本の太いらせんと24個の移動する矢印、下方へ広がる気流で渦を強調しています。
機体全体の自動回転は無効にしています。
内蔵クリップ `V44_CounterRotation_Loop_4s` は4秒周期。非表示中は再生を停止します。
画面下の解説は、トルクの相殺とテールローターが不要な仕組みを説明します。

Blender編集用ファイル・プレビュー・生成スクリプトは `__dev/output/v44_ar5/`。
再生成はBlenderで `create_model.py` を実行した後、
`python3 __dev/output/v44_ar5/finalize_glb.py` を実行します。
カメラなしの統合確認ページは `__dev/integration/ar5-check.html`。
初期倍率は0.2。実機の寸法や流体解析を再現したモデルではありません。
マーカーに対する位置・向き・倍率は `?debug=true` で現地調整してください。

### Marker6（新設）：H-19 シコルスキー・テールローターの横押し

`marker_6` は独立した新規マーカーです。添付されたH-19の参考画像を
`public/marker/marker6_h19.png` に保存し、8th Wall CLIで認識データを生成しています。
この画像を印刷または別画面に表示してかざしてください。参考画像は小さいため、CLIの最小寸法に
合わせて認識データ生成時のみ拡大しています。拡大によって画像の細部が増えるわけではありません。
実際の展示写真を認識画像にする場合は、その写真からターゲットを再生成してください。

H-19の模式的な機体、水平面内で回るメインローター、垂直面内で回るテールローターを表示します。
青い下降気流12本・赤い横向き気流10本を平たい半透明リボンで表現し、計44本の矢印付きリボンが流れます。
リボンは両面表示。帯の不透明度は最大40%、平たい矢印先端は最大60%、流路ガイドは最大12%です。
幅方向の頂点アルファで縁をぼかし、先端の三角形で流れる方向を示します。
上部の青い円弧はメインローターと逆向きの機体反作用トルクを表します。
尾部の大きな赤い矢印は機体が押される方向で、赤い気流と逆向きです。
Blender座標で尾部位置+X、気流-Y、尾部反力+Y、反力トルク+Zとし、
メインローター+Zによる機体反作用-Zを抑える関係です。

再生クリップは `H19_AntiTorque_Loop_4s`。初期倍率0.18、自動回転なし。
配置調整・JSON出力も6番に対応しています。力・流速・形状は実測や流体解析ではなく説明用です。
編集用ファイル・生成/検証スクリプト・プレビューは `__dev/output/h19_ar6/`。
Blenderで `create_model.py` を実行後、`python3 __dev/output/h19_ar6/finalize_glb.py` で配信用GLBを更新します。
カメラなしの確認ページは `__dev/integration/ar6-check.html`。

### Marker7（実験用）：緑に発光する軌道の光跡エフェクト

`marker_7` は新設の実験用ターゲットです。`public/marker/marker7_wind.png` を
印刷または別画面に表示して認識させてください。編集可能なSVGも同じ場所に保存しています。
共通の中心を囲む20本の傾いたリング（主軌道9本・淡い内側5本・細い外側6本）が
それぞれ別方向・別速度で回転し、全体もゆっくり歳差運動します。
各リングは「細く明るい芯＋広く淡いハロー」の多層リボンで、明るさの脈動が軌道上を流れます。
機体・説明パネル・3Dラベルは含みません。配置倍率0.25、自動回転なし。

配信用モデルは `public/3dmodels/model7_wind_study.glb`、クリップは `Wind_Study_Loop_4s`（4秒ループ）。
マテリアルは `KHR_materials_unlit` ＋頂点カラー（RGBA）。glTFに加算合成の仕様がないため、
`src/utils/aframeAdditiveGlow.ts` の `additive-glow` コンポーネントが読み込み後に
three.js マテリアルを加算合成・depthWrite無効へ切り替え、光の軌跡として表示します。
Blenderファイルと生成・検証スクリプトは `__dev/output/wind_ar7_v2/`（旧版の直線風は `wind_ar7/`）。
Blenderで `create_model.py` を実行してから `python3 __dev/output/wind_ar7_v2/finalize_glb.py` で更新します。
Blender側の `preview.png` はライティング付きで参考程度です。AR相当の見た目は
`node __dev/output/wind_ar7_v2/shot_preview.mjs <glbとpreview_page.htmlを置いたフォルダ>` で撮影した
`ar_preview_t*.png` を確認してください（インストール済みChromeを使用）。
プレビューの濃紺背景は確認用で、ARには含みません。
`__dev/integration/ar7-check.html` はカメラなしで表示・停止を確認する開発用ページです。
