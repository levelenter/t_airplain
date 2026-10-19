#!/usr/bin/env node
/**
 * 8th Wall の Image Target 用に、数字マーカー画像 6 枚（01〜06）を生成するスクリプト。
 * 出力: public/marker/ar_image_number/01.png 〜 06.png（1200x1600 の 3:4 縦、RGB、白背景）
 * （public/marker/01.png などは AR.js 用なので触らない）
 *
 * デザイン:
 *  - 3:4 縦なので 8th Wall CLI の既定クロップ（3:4 中央領域）で黒枠が切れない。
 *  - 外周に太い黒枠（4 辺とも 100px）。内側領域は 1000x1400。
 *  - 枠の内側に、黒い多角形・三角形・矩形・線分・円・円弧を非反復・非対称に敷き詰め、
 *    特徴点（コーナー）を画像全体に分散させる（8th Wall の追跡安定性のため）。
 *  - 中央に極太の黒い数字。白い縁取りを付けて、装飾と重なっても可読性を保つ。
 *  - 乱数は seed 付き mulberry32 なので、再実行しても同じ画像が出る。
 *    seed は数字ごとに異なり、装飾も毎枚異なる。
 *
 * 実行にはブラウザの Canvas 2D が必要なため、Playwright で Chromium を起動する
 * （generate-ar-patterns.mjs と同じ方式。devDependencies の @playwright/test を使う）。
 *
 * 使い方: `node scripts/generate-image-number-markers.mjs`
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'marker', 'ar_image_number')
const NAMES = ['01', '02', '03', '04', '05', '06']
const SEEDS = [0x1a2b3c, 0x9e3779, 0x51ed27, 0xc0ffee, 0x7f4a7c, 0xbadf00]

// ブラウザ内で実行される描画関数
function draw({ label, seed }) {
  const W = 1200
  const H = 1600
  const FRAME = 100
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  const rnd = mulberry32(seed)
  const R = (a, b) => a + rnd() * (b - a)

  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  g.fillStyle = '#fff'
  g.fillRect(0, 0, W, H)

  // 装飾位置: 最小距離を保つ棄却サンプリングで全体に分散させる（格子状にはならない）
  const pts = []
  let tries = 0
  while (pts.length < 130 && tries++ < 20000) {
    const p = [R(FRAME - 20, W - FRAME + 20), R(FRAME - 20, H - FRAME + 20)]
    // 数字の領域は避ける（カウンター内のノイズで可読性が落ちるため）
    if (Math.abs(p[0] - W / 2) < 380 && Math.abs(p[1] - H / 2) < 260) continue
    const minD = 62 + rnd() * 20
    if (pts.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > minD)) pts.push(p)
  }
  g.lineCap = rnd() < 0.5 ? 'butt' : 'round'
  for (const [x, y] of pts) {
    const kind = Math.floor(rnd() * 8)
    const sz = R(14, 62)
    const ang = R(0, Math.PI * 2)
    const gray = rnd() < 0.12
    const col = gray ? `hsl(0 0% ${Math.floor(R(35, 60))}%)` : '#000'
    g.fillStyle = col
    g.strokeStyle = col
    g.save()
    g.translate(x, y)
    g.rotate(ang)
    if (kind === 0 || kind === 1) {
      // 三角形（不規則）
      g.beginPath()
      g.moveTo(R(-sz, 0), R(-sz, 0))
      g.lineTo(R(0, sz * 1.3), R(-sz * 0.5, sz * 0.5))
      g.lineTo(R(-sz * 0.5, sz * 0.5), R(0, sz * 1.2))
      g.closePath()
      g.fill()
    } else if (kind === 2) {
      // 多角形（4〜7 頂点、半径ばらつき）
      const n = 4 + Math.floor(rnd() * 4)
      g.beginPath()
      const off = R(0, 6.28)
      for (let i = 0; i < n; i++) {
        const a = off + (i / n) * Math.PI * 2 + R(-0.25, 0.25)
        const r = sz * R(0.55, 1.05)
        if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        else g.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      g.closePath()
      g.fill()
    } else if (kind === 3) {
      // 矩形（縦横比ばらつき）
      g.fillRect(-sz / 2, -R(5, sz / 1.5) / 2, sz * R(0.4, 1.3), R(8, sz))
    } else if (kind === 4 || kind === 5) {
      // 太さの異なる線分（短い）
      g.lineWidth = R(3, 14)
      g.beginPath()
      g.moveTo(-sz, 0)
      g.lineTo(sz * R(0.5, 1.4), R(-sz * 0.3, sz * 0.3))
      g.stroke()
    } else if (kind === 6) {
      // 円（塗り or リング）
      g.beginPath()
      g.arc(0, 0, sz * 0.5, 0, Math.PI * 2)
      if (rnd() < 0.5) g.fill()
      else { g.lineWidth = R(4, 12); g.stroke() }
    } else {
      // 円弧
      g.lineWidth = R(4, 13)
      g.beginPath()
      const a0 = R(0, 6.28)
      g.arc(0, 0, sz * 0.7, a0, a0 + R(1.2, 4.2))
      g.stroke()
    }
    g.restore()
  }

  // 数字: 白縁取り + 極太黒。中心をわずかにずらして非対称にする
  g.font = '900 560px "Helvetica Neue", Arial, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'alphabetic'
  const m = g.measureText(label)
  const asc = m.actualBoundingBoxAscent
  const desc = m.actualBoundingBoxDescent
  const cx = W / 2 + R(-14, 14)
  const cy = H / 2 + (asc - desc) / 2 + R(-14, 14)
  g.lineJoin = 'round'
  g.strokeStyle = '#fff'
  g.lineWidth = 56
  g.strokeText(label, cx, cy)
  g.fillStyle = '#000'
  g.fillText(label, cx, cy)
  g.strokeStyle = '#000'
  g.lineWidth = 8
  g.strokeText(label, cx, cy)

  // 外周の黒枠（直角）
  g.fillStyle = '#000'
  g.fillRect(0, 0, W, FRAME)
  g.fillRect(0, H - FRAME, W, FRAME)
  g.fillRect(0, 0, FRAME, H)
  g.fillRect(W - FRAME, 0, FRAME, H)

  return c.toDataURL('image/png')
}

mkdirSync(OUT_DIR, { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (let i = 0; i < NAMES.length; i++) {
    const url = await page.evaluate(draw, { label: NAMES[i], seed: SEEDS[i] })
    const buf = Buffer.from(url.split(',')[1], 'base64')
    writeFileSync(join(OUT_DIR, `${NAMES[i]}.png`), buf)
    console.log(`wrote ${NAMES[i]}.png`)
  }
} finally {
  await browser.close()
}
