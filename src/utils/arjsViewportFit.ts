/**
 * AR.js（@ar-js-org/ar.js 3.4.8 の aframe ビルド）は、カメラ映像用の `<video id="arjs-video">`
 * を `document.body` 直下に追加し、`arToolkitSource.onResizeElement()` で
 * `videoWidth/videoHeight` から計算した「cover 風」の width/height/margin を割り当てる。
 * 一方で a-scene の `<canvas class="a-canvas">` は 8-Frame（A-Frame）標準の CSS
 * （`.a-canvas { width:100%; height:100% }`）で常にビューポート全体にフィットする。
 *
 * この2つは別々の計算式でサイズが決まるため、
 * - iOS Safari では `window.innerWidth/innerHeight` を読むタイミング（SPA 遷移直後の
 *   初回や、アドレスバーの表示/非表示に伴うビューポート変化の最中）によって video 側の計算が
 *   実際のビューポートに追従しきれず、video が画面の一部しか覆わない（覆われない部分は
 *   背後の `.marker-ar` の黒背景がそのまま見える）ことがある。
 * - 仮に video が正しく画面を覆えたとしても、video と canvas のサイズ・位置が一致しなければ、
 *   ARToolKit のカメラ投影（video の実ピクセルを基準に計算される）と canvas の描画範囲がずれ、
 *   3D がマーカーの実際の位置から浮いて見える。
 *
 * これを避けるため、video の実サイズ（videoWidth/videoHeight）から「画面を確実に覆い切る
 * cover」矩形を自前で計算し、video と canvas の両方に同一の position/width/height/left/top を
 * 強制する。
 *
 * 注意: AR.js は `window` の resize イベントや video の準備完了時に、自前の（今回のバグの原因になった）
 * 計算式で video 側の style（特に marginLeft）を こちらの適用より後に書き換えることがある
 * （こちらは `style.left` で位置決めしつつ `margin` を 0 にしているのに、AR.js が `marginLeft` だけを
 * 独自の値で上書きし、結果 left と marginLeft が二重に効いて video がさらに大きくずれる、という
 * 事象を実機確認で検出した）。タイミングに依存せず必ずこちらの計算を勝たせるため、
 * video/canvas の `style` 属性を MutationObserver で監視し、期待値と異なれば即座に上書きし直す。
 */

interface Teardown {
  (): void
}

const VIDEO_ID = 'arjs-video'

interface Rect {
  width: number
  height: number
  left: number
  top: number
}

function computeCoverRect(vw: number, vh: number, viewportW: number, viewportH: number): Rect | null {
  if (!vw || !vh || !viewportW || !viewportH) return null
  // 画面の縦横どちらも確実に覆い切るスケール（CSS の background-size:cover と同じ考え方）。
  const scale = Math.max(viewportW / vw, viewportH / vh)
  const width = vw * scale
  const height = vh * scale
  return {
    width,
    height,
    left: (viewportW - width) / 2,
    top: (viewportH - height) / 2,
  }
}

function px(n: number): string {
  return `${n}px`
}

/** el のインラインスタイルが rect と既に一致していれば true（MutationObserver の無限ループ防止用） */
function matchesRect(el: HTMLElement, rect: Rect): boolean {
  return (
    el.style.position === 'fixed' &&
    el.style.width === px(rect.width) &&
    el.style.height === px(rect.height) &&
    el.style.left === px(rect.left) &&
    el.style.top === px(rect.top) &&
    el.style.marginLeft === '0px' &&
    el.style.marginTop === '0px' &&
    el.style.marginRight === '0px' &&
    el.style.marginBottom === '0px'
  )
}

function applyRect(el: HTMLElement, rect: Rect) {
  if (matchesRect(el, rect)) return
  el.style.position = 'fixed'
  el.style.width = px(rect.width)
  el.style.height = px(rect.height)
  el.style.left = px(rect.left)
  el.style.top = px(rect.top)
  el.style.right = 'auto'
  el.style.bottom = 'auto'
  // margin は longhand で個別に 0 固定する（AR.js が marginLeft だけを独自に書き換えても
  // 次の MutationObserver 発火で即座に打ち消せるようにするため）。
  el.style.marginLeft = '0px'
  el.style.marginTop = '0px'
  el.style.marginRight = '0px'
  el.style.marginBottom = '0px'
}

/**
 * MarkerArView のマウント中、video/canvas のサイズを継続的に強制する。
 * 戻り値の関数を呼ぶとイベント購読を止める（マーカー画面のアンマウント時に呼ぶこと）。
 */
export function setupArjsViewportFit(sceneEl: HTMLElement): Teardown {
  let video: HTMLVideoElement | null = null
  let canvas: HTMLCanvasElement | null = null
  let rafId: number | null = null

  function getCanvas(): HTMLCanvasElement | null {
    return sceneEl.querySelector<HTMLCanvasElement>('canvas.a-canvas')
  }

  function apply() {
    if (!video || !video.videoWidth || !video.videoHeight) return
    canvas = canvas ?? getCanvas()
    if (!canvas) return
    const rect = computeCoverRect(video.videoWidth, video.videoHeight, window.innerWidth, window.innerHeight)
    if (!rect) return
    // applyRect は既に目標値と一致していれば書き込まない（matchesRect）ため、
    // ここで書いた分が MutationObserver を再度起こしても、次の apply() は no-op で収束する
    // （AR.js 側が別の値に書き換えない限り、無限ループにはならない）。
    applyRect(video, rect)
    applyRect(canvas, rect)
  }

  function scheduleApply() {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      apply()
    })
  }

  // AR.js（や A-Frame の a-canvas CSS）が video/canvas の style を書き換えるたびに検知し、
  // こちらの計算値で即座に上書きし直す。タイミングに依存しない「必ず最後に勝つ」対策。
  const styleObserver = new MutationObserver(() => {
    scheduleApply()
  })

  function observe(el: Element | null) {
    if (!el) return
    styleObserver.observe(el, { attributes: true, attributeFilter: ['style'] })
  }

  function onVideoLoaded(event: Event) {
    const detail = (event as CustomEvent<{ component?: HTMLVideoElement }>).detail
    video = detail?.component ?? (document.getElementById(VIDEO_ID) as HTMLVideoElement | null)
    if (!video) return
    observe(video)
    canvas = getCanvas()
    observe(canvas)
    if (video.readyState >= 1) {
      scheduleApply()
    } else {
      video.addEventListener('loadedmetadata', scheduleApply, { once: true })
    }
    // iOS Safari はアドレスバーの表示/非表示等でビューポートが遅れて確定することがあるため、
    // 初回はしばらく追従させる（MutationObserver に加えた保険）。
    for (const delay of [50, 150, 300, 600, 1000, 1600]) {
      setTimeout(scheduleApply, delay)
    }
  }

  function onResize() {
    scheduleApply()
  }

  window.addEventListener('arjs-video-loaded', onVideoLoaded)
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)

  // 既に video-loaded が発火済みでこの後にマウントされた場合（前回表示分の使い回し）のフォールバック
  const existingVideo = document.getElementById(VIDEO_ID) as HTMLVideoElement | null
  if (existingVideo) {
    video = existingVideo
    observe(video)
    canvas = getCanvas()
    observe(canvas)
    scheduleApply()
  }

  return function teardown() {
    window.removeEventListener('arjs-video-loaded', onVideoLoaded)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
    styleObserver.disconnect()
    if (rafId !== null) cancelAnimationFrame(rafId)
  }
}
