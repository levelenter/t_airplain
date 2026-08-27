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
  pages/
    StartView.vue
    CameraView.vue
    Contents1.vue （会式一号機） プリミティブなオブジェクトを配置して飛行機を作成
    Contents2.vue /public/3dmodels/plane.glb を読み込んで飛行機を作成
    Contents3.vue /public/3dmodels/jet_engine.glb を読み込んで飛行機を作成
    Contents4.vue /public/3dmodels/douglas_dc_3.glb を読み込んで飛行機を作成
    Contents5.vue /public/3dmodels/chopper.glb を読み込んでヘリコプターを作成
  router/
  store/
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

- 動作確認: メニュー →「スタート」→ カメラ許可 → `public/image-targets/model-target_original.jpg`
  を別画面に表示してかざすと Contents1（会式一号機）が表示される
- 実機（スマホ）確認はカメラ利用のため HTTPS が必須。`npm run dev -- --host` で LAN 公開した上で
  ngrok 等でトンネルするのが簡単: `ngrok http 5173`
- 画像マーカーの追加方法は `public/image-targets/README.md` を参照
  （`npx @8thwall/image-target-cli@latest` で生成 → `src/utils/markers.ts` に登録）