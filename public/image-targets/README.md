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

- `model-target.json` — 8th Wall 公式サンプル（クラゲのフライヤー）の動作確認用ターゲット。
  `model-target_original.jpg` を別の画面に表示（または印刷）してカメラをかざすと認識されます。
  実運用時は記念館のマーカー画像に差し替えてください。
- `marker2.json` 〜 `marker5.json` は未生成です。上記の手順で生成して追加してください。
