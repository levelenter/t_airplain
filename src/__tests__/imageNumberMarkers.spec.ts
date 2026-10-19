import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useArStore } from '../stores/ar'
import { IMAGE_NUMBER_MARKERS } from '../utils/imageNumberMarkers'
import { AR_MARKERS } from '../utils/markers'
import { MARKER_AR_MARKERS } from '../utils/markerAr'

/** 8th Wall の画像番号マーカー（number_01〜06）の定義と、ストアでの解決を確認する */
describe('IMAGE_NUMBER_MARKERS', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('resolves number_05 to contentId 5 once set as the marker source', () => {
    const ar = useArStore()
    ar.setMarkerSource(IMAGE_NUMBER_MARKERS)
    ar.onImageFound('number_05')
    expect(ar.activeMarker?.contentId).toBe(5)
  })

  it('does not collide with other marker name spaces', () => {
    const others = new Set([...AR_MARKERS, ...MARKER_AR_MARKERS].map((m) => m.name))
    for (const marker of IMAGE_NUMBER_MARKERS) expect(others.has(marker.name)).toBe(false)
  })
})
