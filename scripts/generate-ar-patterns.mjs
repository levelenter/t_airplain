#!/usr/bin/env node
/**
 * public/marker/01.png〜06.png（1240x1653、上部1240x1240が黒枠込みのマーカー本体）から、
 * AR.js の pattern マーカー用 `.patt` を再生成するスクリプト。
 *
 * AR.js 公式の生成ツールのアルゴリズム（three.js/examples/marker-training/threex-arpatternfile.js
 * の `THREEx.ArPatternFile.encodeImage`）をそのまま移植している（下記 encodeImage 関数）。
 * 実行にはブラウザの Canvas 2D が必要なため、Playwright で Chromium を起動して実行する
 * （このリポジトリは devDependencies に @playwright/test を持つため追加インストール不要）。
 *
 * 使い方: `node scripts/generate-ar-patterns.mjs`
 *
 * クロップ範囲（黒枠を除いた内側の模様、504x504 をオフセット (368,368) から切り出す）は、
 * `public/marker/0N.png` の黒枠を実測して求めた値（本体 1008x1008、枠太さ 252px = 25%、
 * patternRatio 0.5 と一致）。ARToolKit/AR.js の `patternRatio` 既定値と一致させているので、
 * a-marker 側で patternRatio を明示的に指定する必要はない（ArContent.vue 参照）。
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MARKER_DIR = join(__dirname, '..', 'public', 'marker')
const OUT_DIR = join(__dirname, '..', 'public', 'ar-patterns')

const NAMES = ['01', '02', '03', '04', '05', '06']
// 黒枠を除いた内側の模様の切り出し範囲（1240x1240 のマーカー本体内、実測値）
const CROP_OFFSET = 368
const CROP_SIZE = 504

const PAGE_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>
// AR.js 公式アルゴリズムの移植（three.js/examples/marker-training/threex-arpatternfile.js の
// THREEx.ArPatternFile.encodeImage を Canvas 要素を直接受け取れるようそのまま使う）
window.encodeImage = function (image) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = 16
  canvas.height = 16

  let patternFileString = ''
  for (let orientation = 0; orientation > -2 * Math.PI; orientation -= Math.PI / 2) {
    context.save()
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.translate(canvas.width / 2, canvas.height / 2)
    context.rotate(orientation)
    context.drawImage(image, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
    context.restore()

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    if (orientation !== 0) patternFileString += '\\n'
    // NOTE bgr order and not rgb!!!
    for (let channelOffset = 2; channelOffset >= 0; channelOffset--) {
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          if (x !== 0) patternFileString += ' '
          const offset = y * imageData.width * 4 + x * 4 + channelOffset
          const value = imageData.data[offset]
          patternFileString += String(value).padStart(3)
        }
        patternFileString += '\\n'
      }
    }
  }
  return patternFileString
}

window.encodeMarker = async function (dataUrl, offset, size) {
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = dataUrl
  })
  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = size
  cropCanvas.height = size
  cropCanvas.getContext('2d').drawImage(img, offset, offset, size, size, 0, 0, size, size)
  return window.encodeImage(cropCanvas)
}
</script>
</body></html>`

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setContent(PAGE_HTML)

  for (const name of NAMES) {
    const srcPath = join(MARKER_DIR, `${name}.png`)
    const buf = readFileSync(srcPath)
    const dataUrl = `data:image/png;base64,${buf.toString('base64')}`
    const pattStr = await page.evaluate(
      ({ dataUrl, offset, size }) => window.encodeMarker(dataUrl, offset, size),
      { dataUrl, offset: CROP_OFFSET, size: CROP_SIZE },
    )
    const outPath = join(OUT_DIR, `marker_${name}.patt`)
    writeFileSync(outPath, pattStr)
    console.log(`wrote ${outPath}`)
  }

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
