import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useArStore } from '../stores/ar'

/**
 * 不具合2（1つのマーカーで反応した後、同じ画面のまま別のマーカーをかざしても反応しない）の
 * 再現・回帰確認用テスト。
 *
 * CameraView は `onImageFound`/`onImageLost` を 8th Wall の xrimagefound/xrimagelost イベントから
 * そのまま呼ぶだけで、シナリオの分岐ロジックは持たない。したがって「別マーカーに
 * 切り替わったときに pendingMarker/activeMarker が正しく更新されるか」は
 * useArStore 側の責務であり、ここで検証する。
 */
describe('useArStore marker switching (bug2 scenarios)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('number_01 found -> activate -> number_01 lost -> number_03 found で pendingMarker が number_03 になる', () => {
    const ar = useArStore()
    ar.onImageFound('number_01')
    expect(ar.pendingMarker?.name).toBe('number_01')

    ar.activate('number_01')
    expect(ar.pendingMarker).toBeNull()
    expect(ar.isActivated('number_01')).toBe(true)

    ar.onImageLost('number_01')
    expect(ar.activeMarker?.name).toBe('number_01') // lastFoundName にフォールバックして残る
    expect(ar.visibleMarkerNames.has('number_01')).toBe(false)

    ar.onImageFound('number_03')
    expect(ar.activeMarker?.name).toBe('number_03')
    expect(ar.pendingMarker?.name).toBe('number_03')
    expect(ar.isActivated('number_03')).toBe(false)
  })

  it('number_01 表示中（活性化済み）に number_03 が found になっても pendingMarker が number_03 になる（number_01 をまだ見失っていない場合）', () => {
    const ar = useArStore()
    ar.onImageFound('number_01')
    ar.activate('number_01')
    expect(ar.pendingMarker).toBeNull()

    // number_01 を lost しないまま number_03 が found になるケース（一瞬両方映る等）
    ar.onImageFound('number_03')
    expect(ar.visibleMarkerNames.has('number_01')).toBe(true)
    expect(ar.visibleMarkerNames.has('number_03')).toBe(true)
    expect(ar.pendingMarker?.name).toBe('number_03')
  })

  it('3枚以上を連続で切り替えても pendingMarker/activeMarker が都度正しいマーカーを指す', () => {
    const ar = useArStore()
    ar.onImageFound('number_01')
    ar.activate('number_01')
    ar.onImageLost('number_01')

    ar.onImageFound('number_02')
    expect(ar.pendingMarker?.name).toBe('number_02')
    ar.activate('number_02')
    ar.onImageLost('number_02')

    ar.onImageFound('number_03')
    expect(ar.pendingMarker?.name).toBe('number_03')
    expect(ar.isActivated('number_01')).toBe(true)
    expect(ar.isActivated('number_02')).toBe(true)
    expect(ar.isActivated('number_03')).toBe(false)
  })

  it('reset() 後は visibleMarkerNames/activatedMarkerNames/lastFoundName がすべてクリアされる（メニューへ戻ったときの挙動）', () => {
    const ar = useArStore()
    ar.onImageFound('number_01')
    ar.activate('number_01')

    ar.reset()

    expect(ar.visibleMarkerNames.size).toBe(0)
    expect(ar.activatedMarkerNames.size).toBe(0)
    expect(ar.activeMarker).toBeNull()
    expect(ar.pendingMarker).toBeNull()
  })
})
