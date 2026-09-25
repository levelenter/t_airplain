import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useArStore } from '../stores/ar'
import { AR_MARKERS } from '../utils/markers'
import { MARKER_AR_MARKERS } from '../utils/markerAr'

/**
 * useArStore は 8th Wall（CameraView）と AR.js（MarkerArView）の両画面で共有する。
 * 既定のマーカー一覧は 8th Wall の AR_MARKERS だが、setMarkerSource で
 * AR.js 側の番号マーカー一覧（MARKER_AR_MARKERS）に差し替えられることを確認する。
 */
describe('useArStore marker source', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('resolves against AR_MARKERS by default', () => {
    const ar = useArStore()
    ar.onImageFound('marker_5')
    expect(ar.activeMarker?.contentId).toBe(5)
    expect(ar.pendingMarker?.name).toBe('marker_5')
  })

  it('resolves against MARKER_AR_MARKERS once switched, and no longer matches 8th Wall names', () => {
    const ar = useArStore()
    ar.setMarkerSource(MARKER_AR_MARKERS)

    ar.onImageFound('marker_05')
    expect(ar.activeMarker?.contentId).toBe(5)
    expect(ar.activeMarker?.name).toBe('marker_05')

    ar.onImageLost('marker_05')
    ar.onImageFound('marker_5')
    expect(ar.activeMarker).toBeNull()
  })

  it('keeps pending/activated flow working the same way regardless of source', () => {
    const ar = useArStore()
    ar.setMarkerSource(MARKER_AR_MARKERS)

    ar.onImageFound('marker_06')
    expect(ar.pendingMarker?.contentId).toBe(6)
    ar.activate('marker_06')
    expect(ar.pendingMarker).toBeNull()
    expect(ar.isActivated('marker_06')).toBe(true)
  })

  it('AR_MARKERS and MARKER_AR_MARKERS never share a marker name', () => {
    const arjsNames = new Set(MARKER_AR_MARKERS.map((m) => m.name))
    for (const marker of AR_MARKERS) {
      expect(arjsNames.has(marker.name)).toBe(false)
    }
  })
})
