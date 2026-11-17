# 画像ターゲット（マーカー）の置き場所

このディレクトリには 8th Wall の Image Target メタデータ（`<name>.json` と関連画像）を置きます。
`src/utils/markers.ts` の `MARKERS` に登録された `name` と同名の JSON がアプリ起動時に読み込まれ、
`XR8.XrController.configure({ imageTargetData: [...] })` でエンジンに登録されます。

## マーカーの生成方法

マーカーにしたい画像（印刷物・展示パネルなど）を用意し、8th Wall OSS の CLI で変換します:

```bash
npx @8thwall/image-target-cli@latest
```

対話形式で画像を指定すると、`<name>.json` / `<name>_luminance.jpg` などが生成されるので、
一式をこのディレクトリにコピーしてください。JSON 内の `imagePath` は
`image-targets/<name>_luminance.jpg`（サイトルート相対）になっている必要があります。

GUI で作成したい場合は 8th Wall Desktop アプリ（https://8thwall.org/downloads）でも生成できます。

## 現在のファイル：画像ARマーカー（number_01〜number_06）

カメラ画面（`/camera`、定義は `src/utils/markers.ts`）で使う、番号入りの 3:4 縦マーカーです。
以前あった写真マーカー（`marker_1`〜`marker_7`）と AR.js の pattern マーカーは廃止しました。

- 生成元: `public/marker/ar_image_number/0N.png`（1200x1600。`node scripts/generate-image-number-markers.mjs` で生成）
- 変換: `bash scripts/generate-image-number-targets.sh`（CLI を非対話で実行し `number_0N.json` ほか一式を出力）
- 元画像を作り直した場合は、上記 2 つを順に再実行してください。

