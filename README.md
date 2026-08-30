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
    Contents1.vue （複葉機）プリミティブなオブジェクトを配置して飛行機を作成
    Contents2.vue /public/3dmodels/model2_cessna.glb（セスナ）
    Contents3.vue /public/3dmodels/model3_jet.glb（ジェットエンジン）
    Contents4.vue /public/3dmodels/model4_douglas.glb（ダグラス DC-3）
    Contents5.vue /public/3dmodels/model5_helico.glb（ヘリコプター）
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