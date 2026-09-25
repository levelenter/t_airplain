import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useArStore } from '../stores/ar'
import { MARKER_AR_MARKERS } from '../utils/markerAr'

/**
 * 不具合2（1つのマーカーで反応した後、同じ画面のまま別のマーカーをかざしても反応しない）の
 * 再現・回帰確認用テスト。
 *
 * MarkerArView / CameraView はどちらも `onImageFound`/`onImageLost` を
 * AR.js の markerFound/markerLost（8th Wall なら xrimagefound/xrimagelost）イベントから
 * そのまま呼ぶだけで、シナリオの分岐ロジックは持たない。したがって「別マーカーに
 * 切り替わったときに pendingMarker/activeMarker が正しく更新されるか」は
 * useArStore 側の責務であり、ここで検証する。
 *
 * これらのテストは現状の実装でも成功する（= ストア自体のロジックは正しい）ことを確認済み。
 * 実機で「反応しない」場合は、AR.js から markerFound/markerLost イベントが
 * そもそも発火していない／発火が別のマーカー名になっている等、DOM イベント層の問題である
 * 可能性が高い。MarkerArView.vue の debugEvents（ArViewportDebugOverlay の
 * marker found/lost ログ）で実機のイベント発火有無を確認できるようにしてある。
 */
describe('useArStore marker switching (bug2 scenarios)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('marker_01 found -> activate -> marker_01 lost -> marker_03 found で pendingMarker が marker_03 になる', () => {
    const ar = useArStore()
    ar.setMarkerSource(MARKER_AR_MARKERS)

    ar.onImageFound('marker_01')
    expect(ar.pendingMarker?.name).toBe('marker_01')

    ar.activate('marker_01')
    expect(ar.pendingMarker).toBeNull()
    expect(ar.isActivated('marker_01')).toBe(true)

    ar.onImageLost('marker_01')
    expect(ar.activeMarker?.name).toBe('marker_01') // lastFoundName にフォールバックして残る
    expect(ar.visibleMarkerNames.has('marker_01')).toBe(false)

    ar.onImageFound('marker_03')
    expect(ar.activeMarker?.name).toBe('marker_03')
    expect(ar.pendingMarker?.name).toBe('marker_03')
    expect(ar.isActivated('marker_03')).toBe(false)
  })

  it('marker_01 表示中（活性化済み）に marker_03 が found になっても pendingMarker が marker_03 になる（marker_01 をまだ見失っていない場合）', () => {
    const ar = useArStore()
    ar.setMarkerSource(MARKER_AR_MARKERS)

    ar.onImageFound('marker_01')
    ar.activate('marker_01')
    expect(ar.pendingMarker).toBeNull()

    // marker_01 を lost しないまま marker_03 が found になるケース（一瞬両方映る等）
    ar.onImageFound('marker_03')
    expect(ar.visibleMarkerNames.has('marker_01')).toBe(true)
    expect(ar.visibleMarkerNames.has('marker_03')).toBe(true)
    expect(ar.pendingMarker?.name).toBe('marker_03')
  })

  it('3枚以上を連続で切り替えても pendingMarker/activeMarker が都度正しいマーカーを指す', () => {
    const ar = useArStore()
    ar.setMarkerSource(MARKER_AR_MARKERS)

    ar.onImageFound('marker_01')
    ar.activate('marker_01')
    ar.onImageLost('marker_01')

    ar.onImageFound('marker_02')
    expect(ar.pendingMarker?.name).toBe('marker_02')
    ar.activate('marker_02')
    ar.onImageLost('marker_02')

    ar.onImageFound('marker_03')
    expect(ar.pendingMarker?.name).toBe('marker_03')
    expect(ar.isActivated('marker_01')).toBe(true)
    expect(ar.isActivated('marker_02')).toBe(true)
    expect(ar.isActivated('marker_03')).toBe(false)
  })

  it('reset() 後は visibleMarkerNames/activatedMarkerNames/lastFoundName がすべてクリアされる（メニューへ戻ったときの挙動）', () => {
    const ar = useArStore()
    ar.setMarkerSource(MARKER_AR_MARKERS)
    ar.onImageFound('marker_01')
    ar.activate('marker_01')

    ar.reset()

    expect(ar.visibleMarkerNames.size).toBe(0)
    expect(ar.activatedMarkerNames.size).toBe(0)
    expect(ar.activeMarker).toBeNull()
    expect(ar.pendingMarker).toBeNull()
  })
})
