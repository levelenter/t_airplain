# public/scripts/vendor/

CDN（cdn.jsdelivr.net 等）を使わず、外部ライブラリをこのディレクトリにダウンロードしてリポジトリから直接配信する。
`index.html` / `src/utils/loadArjs.ts` からは `${BASE_URL}scripts/vendor/...`（本番は `/ar/scripts/vendor/...`）で参照する。

## 収録パッケージ

| ディレクトリ | パッケージ / バージョン | 用途 |
| --- | --- | --- |
| `@8thwall/engine-binary@1.0.0/` | `@8thwall/engine-binary@1.0.0`（`dist/xr.js` 他） | 8th Wall Engine（XR8）。ワールドトラッキング本体 |
| `@8thwall/landing-page@1.0.0/` | `@8thwall/landing-page@1.0.0`（`dist/landing-page.js`） | 8th Wall のランディング／許可UI（OSS, MIT） |
| `@8thwall/xrextras@1.0.0/` | `@8thwall/xrextras@1.0.0`（`dist/xrextras.js`） | 8th Wall のローディング／カメラ許可UIコンポーネント群 |
| `@ar-js-org/ar.js@3.4.8/` | `@ar-js-org/ar.js@3.4.8`（`aframe/build/aframe-ar.js` + `data/camera_para.dat`） | AR.js の A-Frame 版マーカートラッキング（MarkerArView 用） |
| `aframe-fonts/` | A-Frame 標準フォント `Roboto-msdf`（`cdn.aframe.io/fonts/` から取得） | `<a-text>` の既定フォント（`font` 未指定時に CDN から取得されるため） |

`@8thwall/*` は各パッケージの `dist/` 配下を丸ごと配置している（`xr.js` が `dist/resources/*.tflite` や
`xr-slam.js` / `xr-face.js` などを自身のスクリプトタグの相対パスから動的ロードするため。`document.currentScript`
で自分の URL を割り出して `resources/...` を解決しているので、配置ディレクトリ構成を崩さない限りどのパスに置いても動作する）。

`@ar-js-org/ar.js` はパッケージ全体（NFT版・location-only版・three.js版を含め 16MB 超）ではなく、
実際に使っている A-Frame の標準マーカービルド `aframe/build/aframe-ar.js`（+ 同梱の `.LICENSE.txt`）だけを取り出している。

`@ar-js-org/ar.js@3.4.8/data/camera_para.dat` は npm パッケージには含まれていない
（GitHub Pages 上の `https://ar-js-org.github.io/AR.js/data/data/camera_para.dat` としてのみ配布されている、
既定のカメラキャリブレーションファイル）。AR.js の `arjs` コンポーネントは `cameraParametersUrl` を
明示しないとこの URL に直接フェッチしに行くため、`src/pages/MarkerArView.vue` で
`cameraParametersUrl: ${BASE_URL}scripts/vendor/@ar-js-org/ar.js@3.4.8/data/camera_para.dat;` を明示し、
ここに同じファイルをダウンロードして置いている（176 バイトの小さなバイナリファイル）。

`aframe-fonts/Roboto-msdf.json` / `Roboto-msdf.png` は 8frame（A-Frame）の `<a-text>` が
`font` 属性を指定しなかった場合に既定で取得しに行く `https://cdn.aframe.io/fonts/Roboto-msdf.{json,png}`
を同じファイル名のままダウンロードしたもの（`.json` の `pages` フィールドが相対ファイル名
`"Roboto-msdf.png"` を参照しているため、同じディレクトリに並べて置く必要がある）。
`src/components/ArContent.vue` の `<a-text>` に `:font="LABEL_FONT"` で明示的に指定している。

各ディレクトリには npm から取得した `LICENSE` と `package.json` をそのまま同梱している
（`aframe-fonts/` と `camera_para.dat` は npm パッケージ外の単体ファイル配布のため LICENSE 同梱なし。
Roboto-msdf フォントは A-Frame 本体と同じ Apache License 2.0、camera_para.dat は AR.js/ARToolKit 系
プロジェクトで広く再配布されている標準キャリブレーションデータ）。

## 再取得手順

```sh
cd /tmp && mkdir vendor_dl && cd vendor_dl
npm pack @8thwall/engine-binary@1.0.0 @8thwall/landing-page@1.0.0 @8thwall/xrextras@1.0.0 @ar-js-org/ar.js@3.4.8
for f in *.tgz; do tar -xzf "$f" -C "${f%.tgz}" --strip-components=0; done
```

展開後、各パッケージの `package/dist/` を対応する `public/scripts/vendor/<パッケージ名>@<version>/dist/` にコピーする
（`@ar-js-org/ar.js` のみ `package/aframe/build/aframe-ar.js` と `aframe-ar.js.LICENSE.txt` だけをコピーする）。
バージョンを上げる場合はディレクトリ名（`@1.0.0` などのサフィックス）ごと新しいバージョンに変更し、
`index.html` / `src/utils/loadArjs.ts` / `src/pages/MarkerArView.vue` / `src/components/ArContent.vue` の
参照パスを合わせて更新すること。

`camera_para.dat` と `aframe-fonts/*` は npm に含まれないため個別に取得する。

```sh
curl -fsSL https://ar-js-org.github.io/AR.js/data/data/camera_para.dat \
  -o public/scripts/vendor/@ar-js-org/ar.js@3.4.8/data/camera_para.dat

curl -fsSL https://cdn.aframe.io/fonts/Roboto-msdf.json \
  -o public/scripts/vendor/aframe-fonts/Roboto-msdf.json
curl -fsSL https://cdn.aframe.io/fonts/Roboto-msdf.png \
  -o public/scripts/vendor/aframe-fonts/Roboto-msdf.png
```

## 確認済みの外部 URL 参照（コードの起動条件つき／今回のアプリでは到達しない）

各ファイルを `https?://` で grep したところ、以下の外部参照が minify 済みコード中の文字列として残っている。
いずれも 8th Wall / AR.js の「特定の追加機能を使ったときだけ」到達するコードパスで、
本アプリの実際の利用範囲（画像ターゲットによるワールドトラッキング、DRACO 非圧縮の `.glb` 表示、
WebXR コントローラ非使用、VPS/屋外位置合わせ未使用）では発火しないことを確認済み。
配布バイナリ（`xr.js` 等）は圧縮・難読化された 8th Wall 提供のコンパイル済み成果物であり、
安全に無害化するパッチを当てるのは現実的ではないため、ソースは変更せず、
Playwright によるネットワークキャプチャで実際に到達していないことを検証する方針とした。

- `@8thwall/engine-binary` (`xr.js` / `xr-slam.js` / `xr-face.js` / `resources/*-worker.js`)
  - `https://cdn.8thwall.com/web/resources/draco-worker-*.js` / `draco_wasm_wrapper-*.js`
    … DRACO 圧縮された glTF を読み込んだ場合のみ取得される。本リポジトリの `public/3dmodels/*.glb` は
    いずれも `KHR_draco_mesh_compression` を含まないため未使用。
  - `https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/...`
    … WebXR のハンドコントローラーモデルを表示する場合のみ取得される。本アプリはスマホカメラの
    ハンドヘルド AR のみで WebXR コントローラーを使用しないため未使用。
  - `https://vps-coverage-api.nianticspatial.com/api/json/v1`
    … 屋外 VPS（位置ベースのワールドトラッキング）のカバレッジ確認 API。本アプリは画像ターゲット
    トラッキングのみを使用し VPS 機能を呼び出していないため未使用。
- `@8thwall/landing-page` (`landing-page.js`)
  - `https://cdn.jsdelivr.net/gh/mrdoob/three.js@r131` / `.../supermedium/three.js@super-r113/...`
    … ランディングページのプレビュー機能（8th Wall Studio のデスクトッププレビュー用）内の未使用コードパス。
  - `https://8th.io/`、YouTube/Facebook 共有リンク
    … ランディングページ UI 内のリンク文字列（静的なテキスト/href であり、それ自体が外部リソースの読み込みではない）。
- `@8thwall/xrextras` (`xrextras.js`)
  - `https://8th.io/qr?...` … QRコード生成機能（本アプリの導線では使用していない）。
- `@ar-js-org/ar.js` (`aframe-ar.js`)
  - `https://webxr.io/...` … ソースコード中のコメント／エラーメッセージに含まれるドキュメントリンクの
    文字列であり、実行時に fetch されるものではない。
  - `https://ar-js-org.github.io/AR.js/data/data/camera_para.dat` … `cameraParametersUrl` を指定しない場合の
    既定カメラキャリブレーションファイルの取得先。これは実際に発火する（Playwright で検証済み）ため、
    上記のとおり `data/camera_para.dat` をダウンロードして同梱し、`MarkerArView.vue` で
    `cameraParametersUrl` を明示してローカル参照に切り替えた。
- 8frame（A-Frame 1.5.0 本体, `public/scripts/8frame-1.5.0.min.js`）
  - `https://cdn.aframe.io/fonts/Roboto-msdf.json` / `.png` … `<a-text>` に `font` 属性を指定しない場合の
    既定フォント取得先。これも実際に発火する（Playwright で検証済み）ため、上記のとおり
    `aframe-fonts/` にダウンロードして同梱し、`ArContent.vue` の `<a-text>` に `font` を明示した。
  - `AFRAME_CDN_ROOT`（既定 `https://cdn.aframe.io/`）はハンドコントローラー用 glb モデル
    （`controllers/hands/*.glb` 等、VR コントローラー使用時のみ）にも使われているが、本アプリは
    スマホカメラのハンドヘルド AR のみで VR コントローラーを使用しないため、これらは未使用
    （`AFRAME_CDN_ROOT` 自体は上書きせず、`<a-text>` 側にだけ `font` を明示する最小限の対処とした）。

いずれも Playwright でのネットワークキャプチャ（`/ar/`, `/ar/marker-ar`, `/ar/camera` を実際に開いた際の
全リクエスト）で `cdn.jsdelivr.net` / `cdn.aframe.io` / `ar-js-org.github.io` 等、外部ホストへの
リクエストが 0 件であることを確認している。
