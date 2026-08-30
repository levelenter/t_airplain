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

## 現在のファイル

`public/marker/` 配下の以下の画像から生成した `marker_1.json` 〜 `marker_5.json`
（および crop / luminance / thumbnail 画像）を登録済みです。

- `marker1_dbouble.jpeg` → `marker_1`
- `marker2_cessna.jpg` → `marker_2`
- `marker3_jet.jpg` → `marker_3`
- `marker4_douglas.jpg` → `marker_4`
- `marker5_helico.jpg` → `marker_5`

元画像を差し替えた場合は、上記 CLI で再生成してこのディレクトリを更新してください。
