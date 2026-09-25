/**
 * AR空間に浮かべる「解説パネル」のテクスチャ生成。
 *
 * A-Frame(8th Wall) のテキストは日本語グリフに対応していないため、
 * 日本語を含む解説文は canvas に描画した画像をテクスチャとして a-plane に貼る。
 * フォントは実機ブラウザの日本語対応フォントに委ねる（事前生成PNGだとビルド時の
 * フォント差異・文字化けのリスクがあるため、実行時 canvas 描画を採用している）。
 */

export interface PanelTextureOptions {
  /** 上部の太字タイトル */
  title: string
  /** タイトル下のサブ見出し */
  subtitle: string
  /** 区切り線の下に流し込む本文。幅に合わせて自動折り返しする */
  body: string
  /** テクスチャの横幅（px）。日本語が綺麗に読めるよう 1024〜2048 目安 */
  width?: number
}

export interface PanelSize {
  width: number
  height: number
}

const DEFAULT_WIDTH = 1536
const FONT_STACK = '"Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif'

/** 半角(ASCII)の連続はひとかたまりのトークンに、それ以外(主に日本語)は1文字ずつのトークンにする */
function tokenizeForWrap(text: string): string[] {
  const tokens: string[] = []
  let asciiRun = ''

  for (const char of text) {
    const isAscii = char.charCodeAt(0) <= 0x7f
    if (isAscii) {
      asciiRun += char
      continue
    }
    if (asciiRun !== '') {
      tokens.push(asciiRun)
      asciiRun = ''
    }
    tokens.push(char)
  }
  if (asciiRun !== '') tokens.push(asciiRun)

  return tokens
}

/**
 * 1 行の文字列を maxWidth(px) に収まるよう折り返す。
 * 日本語は分かち書きされていないため文字単位で貪欲に詰め、
 * 半角の連続（英数字・記号）だけは単語境界を尊重して途中で割らない。
 */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []

  for (const paragraph of text.split('\n')) {
    if (paragraph.length === 0) {
      lines.push('')
      continue
    }

    const tokens = tokenizeForWrap(paragraph)

    let current = ''
    for (const token of tokens) {
      const candidate = current + token
      if (current !== '' && ctx.measureText(candidate).width > maxWidth) {
        lines.push(current)
        current = token.trimStart()
      } else {
        current = candidate
      }
    }
    if (current !== '') lines.push(current)
  }

  return lines
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * 縦方向のレイアウトを計算する。幅だけに依存する絶対px値を積み上げるため、
 * 本文の行数（＝内容量）に応じてパネルの高さが自然に決まる。
 */
function layoutPanel(ctx: CanvasRenderingContext2D, width: number, opts: PanelTextureOptions) {
  const margin = width * 0.02
  const panelW = width - margin * 2
  const textLeft = margin + panelW * 0.07
  const textWidth = panelW * 0.86

  const titleFontPx = Math.round(width * 0.052)
  const subtitleFontPx = Math.round(width * 0.032)
  const bodyFontPx = Math.round(width * 0.0275)
  const bodyLineHeight = bodyFontPx * 1.55

  ctx.font = `${bodyFontPx}px ${FONT_STACK}`
  const bodyLines = wrapText(ctx, opts.body, textWidth)

  const topPad = width * 0.055
  const titleToSubtitle = width * 0.06
  const subtitleToDivider = width * 0.032
  const dividerToBody = width * 0.05
  const bottomPad = width * 0.05

  const titleBaselineY = margin + topPad + titleFontPx
  const subtitleBaselineY = titleBaselineY + titleToSubtitle
  const dividerY = subtitleBaselineY + subtitleToDivider
  const bodyStartY = dividerY + dividerToBody + bodyFontPx * 0.9
  const bodyEndY = bodyStartY + Math.max(bodyLines.length - 1, 0) * bodyLineHeight

  const height = bodyEndY + bottomPad

  return {
    margin,
    panelW,
    textLeft,
    textWidth,
    titleFontPx,
    subtitleFontPx,
    bodyFontPx,
    bodyLineHeight,
    bodyLines,
    titleBaselineY,
    subtitleBaselineY,
    dividerY,
    bodyStartY,
    height,
  }
}

/** 本文の長さから、この解説パネルに必要な幅×高さ(px)を求める（a-plane のアスペクト比合わせに使う） */
export function measurePanelSize(opts: PanelTextureOptions): PanelSize | undefined {
  if (typeof document === 'undefined') return undefined
  const width = opts.width ?? DEFAULT_WIDTH
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return undefined
  return { width, height: layoutPanel(ctx, width, opts).height }
}

/** SF HUD 風の半透明ガラスパネルを canvas に描画する */
export function drawExplanationPanel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: PanelTextureOptions,
): void {
  ctx.clearRect(0, 0, width, height)

  const layout = layoutPanel(ctx, width, opts)
  const { margin, panelW, textLeft, textWidth } = layout
  const panelX = margin
  const panelY = margin
  const panelH = height - margin * 2
  const radius = width * 0.02

  // ガラス調の濃紺〜グレーの背景
  const bg = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH)
  bg.addColorStop(0, 'rgba(10, 22, 38, 0.86)')
  bg.addColorStop(1, 'rgba(28, 34, 44, 0.80)')
  roundRectPath(ctx, panelX, panelY, panelW, panelH, radius)
  ctx.fillStyle = bg
  ctx.fill()

  // シアンの発光ボーダー（外側のぼかしと内側のシャープな線を重ねる）
  roundRectPath(ctx, panelX, panelY, panelW, panelH, radius)
  ctx.save()
  ctx.shadowColor = 'rgba(90, 225, 255, 0.9)'
  ctx.shadowBlur = width * 0.02
  ctx.strokeStyle = 'rgba(140, 235, 255, 0.9)'
  ctx.lineWidth = width * 0.003
  ctx.stroke()
  ctx.restore()
  ctx.save()
  ctx.strokeStyle = 'rgba(200, 245, 255, 0.95)'
  ctx.lineWidth = width * 0.0014
  ctx.stroke()
  ctx.restore()

  // HUD らしいコーナーの切り欠きアクセント
  const notch = width * 0.045
  ctx.save()
  ctx.strokeStyle = 'rgba(150, 235, 255, 0.85)'
  ctx.lineWidth = width * 0.0022
  for (const [cx, cy, dx, dy] of [
    [panelX, panelY, 1, 1],
    [panelX + panelW, panelY, -1, 1],
    [panelX, panelY + panelH, 1, -1],
    [panelX + panelW, panelY + panelH, -1, -1],
  ] as const) {
    ctx.beginPath()
    ctx.moveTo(cx + notch * dx, cy)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx, cy + notch * dy)
    ctx.stroke()
  }
  ctx.restore()

  // タイトル
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#eafeff'
  ctx.font = `bold ${layout.titleFontPx}px ${FONT_STACK}`
  ctx.fillText(opts.title, textLeft, layout.titleBaselineY, textWidth)

  // サブ見出し
  ctx.fillStyle = '#7fe3ff'
  ctx.font = `bold ${layout.subtitleFontPx}px ${FONT_STACK}`
  ctx.fillText(opts.subtitle, textLeft, layout.subtitleBaselineY, textWidth)

  // 区切り線
  ctx.save()
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.55)'
  ctx.lineWidth = width * 0.0016
  ctx.beginPath()
  ctx.moveTo(textLeft, layout.dividerY)
  ctx.lineTo(textLeft + textWidth, layout.dividerY)
  ctx.stroke()
  ctx.restore()

  // 本文（自動折り返し済み）
  ctx.fillStyle = '#f2f9fb'
  ctx.font = `${layout.bodyFontPx}px ${FONT_STACK}`
  let cursorY = layout.bodyStartY
  for (const line of layout.bodyLines) {
    ctx.fillText(line, textLeft, cursorY)
    cursorY += layout.bodyLineHeight
  }
}

/**
 * 解説パネルの PNG データURLを生成する。高さは本文量から自動計算する。
 * SSR/テスト環境(jsdom等)で 2D コンテキストが取得できない場合は undefined を返す。
 */
export function createExplanationPanelDataUrl(opts: PanelTextureOptions): string | undefined {
  if (typeof document === 'undefined') return undefined

  const width = opts.width ?? DEFAULT_WIDTH
  const measureCanvas = document.createElement('canvas')
  const measureCtx = measureCanvas.getContext('2d')
  if (!measureCtx) return undefined
  const { height } = layoutPanel(measureCtx, width, opts)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return undefined

  drawExplanationPanel(ctx, width, height, opts)
  return canvas.toDataURL('image/png')
}
