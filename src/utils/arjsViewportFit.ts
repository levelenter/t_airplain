/**
 * AR.js（@ar-js-org/ar.js@3.4.8 の aframe ビルド）で iOS Safari 実機に出ていた
 * 「画面の左側が黒帯のまま」の対策。
 *
 * 根拠（CDN から取得した aframe-ar.js 3.4.8 の実コードを読んで特定した）:
 *
 * 1. `ArToolkitSource.prototype.copyElementSizeTo` は、縦持ち（window.innerWidth <=
 *    window.innerHeight）のとき、コピー先要素の style.width を
 *    `4 * parseInt(style.height) / 3` という「4:3 決め打ち」の値にし、
 *    style.marginLeft を `(window.innerWidth - width) / 2` にする。
 * 2. AR.js の "arjs" システムは `renderstart` 内で
 *    `window.addEventListener('resize', () => arSource.copyElementSizeTo(document.body))`
 *    を登録している。つまり **video 要素ではなく `document.body` 自身の width/marginLeft を
 *    window の resize のたびに書き換えている**。
 * 3. 縦持ちの iPhone では video の高さ（≒ innerHeight 相当、数百〜千px）に対して
 *    4/3 倍した width が innerWidth を大きく超えるため、marginLeft は大きな負値になる。
 *    body の実体幅は innerWidth よりずっと広くなり、marginLeft 分だけ左にずれるため、
 *    body の中身（#app 以下、.marker-ar 全体）も一緒に左へシフトする。
 *    100vw/100dvh は「viewport 基準」なので大きさ自体は変わらないが、開始位置（left）が
 *    body の実際の描画開始位置に引きずられるため、画面の一部（多くは左側）に
 *    body の外側の背景がはみ出して見える＝黒帯、という現象になる。
 * 4. さらに `ArToolkitSource.prototype.onResizeElement` は video 自身の
 *    style.width/height/marginLeft/marginTop を、window の resize やソース準備完了ごとに
 *    書き換え続ける。video は object-fit を指定していないため、初期値の `fill`
 *    （縦横比を無視して引き伸ばし）になる。
 *
 * 前回（MutationObserver で video/canvas の style を都度上書きし返す実装）は、
 * この (2) の「body 自体が動かされる」経路にまったく対応していなかった。
 * そのため実機の黒帯が直らなかったと考えられる。
 *
 * 対策方針:
 * - JS 側のタイミング競争（MutationObserver での上書き合戦）はやめる。
 *   CSS の `!important` は常に通常の inline style に勝つため、AR.js が
 *   何度 body/video に inline style を書き込んでも、スタイルシートで固定した
 *   値が最終結果になる。これなら実行タイミングに依存しない。
 * - body/html を 100% 固定し、AR.js の `copyElementSizeTo(document.body)` による
 *   width/marginLeft の書き換えを無効化する。
 * - video は `position:fixed; inset:0` と `object-fit:cover` で強制的に画面全体を覆う。
 *   object-fit:cover はブラウザが実際の videoWidth/videoHeight を見て計算するため、
 *   AR.js 自身の（4:3 決め打ちのような）計算が誤っていても影響を受けない。
 * - a-scene の canvas は AR.js 側では触られない
 *   （A-Frame が canvas に `dataset.aframeCanvas = true` を立てており、
 *   copyElementSizeTo 系の呼び出しはこのフラグを見て canvas をスキップする実装になっている）。
 *   したがって canvas 側は MarkerArView.vue の scoped CSS（`.marker-ar :deep(a-scene)`が
 *   position:absolute; inset:0; width/height:100% にしている）のままで問題ない。
 *   video の可視範囲と canvas の投影が一致する条件（video が常にビューポート全体を覆う）は
 *   この対策で満たされる。
 */

const STYLE_ID = 'arjs-viewport-fit-style'

const CSS = `
html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
}
/* 映像（z-index:-2）より手前に描かれる body は透明にし、映像の外側だけ html の黒を見せる */
html {
  background: #000 !important;
}
body {
  background: transparent !important;
}
#arjs-video {
  position: fixed !important;
  inset: 0 !important;
  left: 0 !important;
  top: 0 !important;
  right: auto !important;
  bottom: auto !important;
  width: 100vw !important;
  height: 100vh !important;
  height: 100dvh !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  object-fit: cover !important;
  object-position: center !important;
}
`

/**
 * MarkerArView のマウント中、body/#arjs-video の全画面フィットを CSS で強制する。
 * 戻り値の関数を呼ぶとスタイルを取り除く（マーカー画面のアンマウント時に呼ぶこと）。
 */
export function setupArjsViewportFit(_sceneEl: HTMLElement): () => void {
  const existing = document.getElementById(STYLE_ID)
  if (existing) {
    // 既に別インスタンスが挿入済み（前回表示分の後始末漏れなど）。そのまま使う。
    return () => {}
  }

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)

  return function teardown() {
    document.getElementById(STYLE_ID)?.remove()
  }
}
