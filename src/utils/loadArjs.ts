/**
 * AR.js（@ar-js-org/ar.js の aframe ビルド）を必要になった時だけ読み込むユーティリティ。
 *
 * 8th Wall（xr.js / xrextras）は index.html で常時読み込まれているが、AR.js は
 * MarkerArView でしか使わないため、他画面の読み込みに影響しないよう動的に <script> を挿入する。
 * A-Frame 本体（/scripts/8frame-1.5.0.min.js）はどのみち index.html で先に読み込まれており、
 * このスクリプトは UMD ビルドで window.AFRAME / window.THREE が既にあればそれを使う
 * （require('aframe') は素の <script> 読み込み時には評価されず、window.AFRAME にフォールバックする）。
 */

const ARJS_SRC =
  'https://cdn.jsdelivr.net/npm/@ar-js-org/ar.js@3.4.8/aframe/build/aframe-ar.js'
const ARJS_INTEGRITY = 'sha384-kMj13PP2WxCked2mWrDVWumIvqdYCYjifhPfsyYBF1av1wP+g7P/hp6kWVGtWrrD'

let loadPromise: Promise<void> | null = null

export function loadArjs(): Promise<void> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${ARJS_SRC}"]`)
    if (existing) {
      // 既に挿入済み（前回の MarkerArView 表示時など）。AFRAME に AR.js のコンポーネントが
      // 登録済みかどうかで判定する。
      if (window.AFRAME?.components?.['arjs']) {
        resolve()
      } else {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error('AR.js の読み込みに失敗しました')), {
          once: true,
        })
      }
      return
    }

    const script = document.createElement('script')
    script.src = ARJS_SRC
    script.crossOrigin = 'anonymous'
    script.integrity = ARJS_INTEGRITY
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('AR.js の読み込みに失敗しました')), { once: true })
    document.head.appendChild(script)
  })

  return loadPromise
}
