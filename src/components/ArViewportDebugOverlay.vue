<script setup lang="ts">
/**
 * `/marker-ar?debug=true` のときだけ表示する、実機診断用のオーバーレイ。
 *
 * 実機（iPhone Safari）でしか再現しない「画面左側が黒帯のまま」不具合を、
 * デスクトップの fake camera 環境では再現できずに調査するための道具。
 * ユーザーにこのオーバーレイごとスクリーンショットを送ってもらい、
 * 数値から原因を特定する。
 *
 * 表示内容:
 * - window.innerWidth/innerHeight, visualViewport, devicePixelRatio, screen.orientation
 * - video#arjs-video の videoWidth/videoHeight, getBoundingClientRect, style 属性全文
 * - a-scene の canvas.a-canvas の width/height 属性, getBoundingClientRect, style 属性全文
 * - body/html/#app の rect と computed background
 * - AR.js の arToolkitSource/arToolkitContext のパラメータ（取得できる範囲で）
 * - カメラの projectionMatrix
 * - marker found/lost イベントログ（不具合2の実機診断用）
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

export interface MarkerEventLogEntry {
  time: string
  type: 'markerFound' | 'markerLost'
  marker: string
}

const props = defineProps<{ events: MarkerEventLogEntry[] }>()

const text = ref('計測中…')
let timer: number | null = null

function rectSummary(el: Element | null): string {
  if (!el) return '(要素なし)'
  const r = el.getBoundingClientRect()
  return `x=${r.x.toFixed(1)} y=${r.y.toFixed(1)} w=${r.width.toFixed(1)} h=${r.height.toFixed(1)}`
}

function styleSummary(el: Element | null): string {
  if (!el) return '(要素なし)'
  const attr = el.getAttribute('style')
  return attr && attr.length > 0 ? attr : '(style属性なし)'
}

function safeBg(el: Element | null): string {
  if (!el) return '(要素なし)'
  try {
    return getComputedStyle(el).backgroundColor
  } catch {
    return '(取得不可)'
  }
}

/** AR.js の内部プロパティ名はビルドごとに変わりうるため、取得できる範囲でベストエフォートに読む */
function collectArjsInfo(): string[] {
  const lines: string[] = []
  try {
    const sceneEl = document.querySelector('a-scene') as (Element & Record<string, unknown>) | null
    const systems = (sceneEl as unknown as { systems?: Record<string, unknown> })?.systems
    const arjsSystem = systems?.arjs as Record<string, unknown> | undefined
    if (!arjsSystem) {
      lines.push('arjs system: (未取得)')
      return lines
    }
    const session = arjsSystem._arSession as Record<string, unknown> | undefined
    const arSource = session?.arSource as Record<string, unknown> | undefined
    const arContext = session?.arContext as Record<string, unknown> | undefined
    const sourceParams = (arSource?.parameters ?? {}) as Record<string, unknown>
    const contextParams = (arContext?.parameters ?? {}) as Record<string, unknown>
    lines.push(
      `sourceWidth/Height: ${String(sourceParams.sourceWidth)} x ${String(sourceParams.sourceHeight)}`,
    )
    lines.push(
      `displayWidth/Height: ${String(sourceParams.displayWidth)} x ${String(sourceParams.displayHeight)}`,
    )
    lines.push(`detectionMode: ${String(contextParams.detectionMode)}`)
    lines.push(`trackingBackend: ${String(contextParams.trackingBackend)}`)
  } catch (e) {
    lines.push(`arjs 情報取得エラー: ${e instanceof Error ? e.message : String(e)}`)
  }
  return lines
}

function collectCameraProjection(): string {
  try {
    const sceneEl = document.querySelector('a-scene') as (Element & Record<string, unknown>) | null
    const camera = (sceneEl as unknown as { camera?: { projectionMatrix?: { elements?: number[] } } })
      ?.camera
    const elements = camera?.projectionMatrix?.elements
    if (!elements) return '(未取得)'
    return Array.from(elements)
      .map((n) => n.toFixed(3))
      .join(', ')
  } catch (e) {
    return `取得エラー: ${e instanceof Error ? e.message : String(e)}`
  }
}

function collect(): string {
  const lines: string[] = []

  lines.push('=== viewport ===')
  lines.push(`innerWidth x innerHeight: ${window.innerWidth} x ${window.innerHeight}`)
  const vv = window.visualViewport
  lines.push(
    vv
      ? `visualViewport: ${vv.width.toFixed(1)} x ${vv.height.toFixed(1)} offset(${vv.offsetLeft.toFixed(1)}, ${vv.offsetTop.toFixed(1)}) scale=${vv.scale}`
      : 'visualViewport: (非対応)',
  )
  lines.push(`devicePixelRatio: ${window.devicePixelRatio}`)
  const orientation = (screen as Screen & { orientation?: ScreenOrientation }).orientation
  lines.push(orientation ? `screen.orientation: ${orientation.type} ${orientation.angle}deg` : 'screen.orientation: (非対応)')

  lines.push('')
  lines.push('=== video#arjs-video ===')
  const video = document.getElementById('arjs-video') as HTMLVideoElement | null
  if (video) {
    lines.push(`videoWidth x videoHeight: ${video.videoWidth} x ${video.videoHeight}`)
    lines.push(`rect: ${rectSummary(video)}`)
    lines.push(`style: ${styleSummary(video)}`)
  } else {
    lines.push('(video#arjs-video が見つかりません)')
  }

  lines.push('')
  lines.push('=== canvas.a-canvas ===')
  const canvas = document.querySelector('a-scene canvas.a-canvas') as HTMLCanvasElement | null
  if (canvas) {
    lines.push(`width/height 属性: ${canvas.width} x ${canvas.height}`)
    lines.push(`rect: ${rectSummary(canvas)}`)
    lines.push(`style: ${styleSummary(canvas)}`)
  } else {
    lines.push('(canvas.a-canvas が見つかりません)')
  }

  lines.push('')
  lines.push('=== body / html / #app ===')
  lines.push(`html: rect=${rectSummary(document.documentElement)}`)
  lines.push(`html: style=${styleSummary(document.documentElement)}`)
  lines.push(`html: computed background=${safeBg(document.documentElement)}`)
  lines.push(`body: rect=${rectSummary(document.body)}`)
  lines.push(`body: style=${styleSummary(document.body)}`)
  lines.push(`body: computed background=${safeBg(document.body)}`)
  const app = document.getElementById('app')
  lines.push(`#app: rect=${rectSummary(app)}`)
  lines.push(`#app: computed background=${safeBg(app)}`)

  lines.push('')
  lines.push('=== AR.js arToolkitSource/arToolkitContext ===')
  lines.push(...collectArjsInfo())

  lines.push('')
  lines.push('=== camera projectionMatrix ===')
  lines.push(collectCameraProjection())

  lines.push('')
  lines.push(`=== marker found/lost ログ（直近${props.events.length}件） ===`)
  if (props.events.length === 0) {
    lines.push('(まだイベントなし)')
  } else {
    for (const e of props.events) {
      lines.push(`${e.time}  ${e.type}  ${e.marker}`)
    }
  }

  return lines.join('\n')
}

function tick() {
  text.value = collect()
}

onMounted(() => {
  tick()
  timer = window.setInterval(tick, 500)
})

onBeforeUnmount(() => {
  if (timer !== null) window.clearInterval(timer)
})
</script>

<template>
  <pre class="ar-viewport-debug-overlay">{{ text }}</pre>
</template>

<style scoped>
.ar-viewport-debug-overlay {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 999;
  width: 100vw;
  max-height: 62dvh;
  margin: 0;
  padding: 8px 10px;
  overflow: auto;
  overscroll-behavior: contain;
  background: rgb(0 0 0 / 88%);
  color: #7dffb0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-all;
  pointer-events: auto;
}
</style>
