import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { MARKERS, findMarkerByName } from '../utils/markers'
import { CONTENT_IDS, loadTransforms, toJson } from '../utils/contentTransform'
import { useArStore } from '../stores/ar'
import { useContentTransformStore } from '../stores/contentTransform'

const asset = (path: string) => resolve(process.cwd(), 'public', path)

beforeEach(() => setActivePinia(createPinia()))

describe('new Marker6 integration', () => {
  it('registers a distinct image target with resolvable generated resources', () => {
    expect(MARKERS.length).toBeGreaterThanOrEqual(6)
    expect(new Set(MARKERS.map((m) => m.name)).size).toBe(MARKERS.length)
    const marker = findMarkerByName('marker_6')!
    expect(marker.contentId).toBe(6)
    const target = JSON.parse(readFileSync(asset('image-targets/marker_6.json'), 'utf8'))
    expect(target.name).toBe(marker.name)
    expect(target.type).toBe('PLANAR')
    expect(existsSync(asset(target.imagePath))).toBe(true)
    for (const resource of Object.values(target.resources)) {
      expect(existsSync(asset(`image-targets/${resource}`))).toBe(true)
    }
  })

  it('recognizes, activates and loses Marker6 without activating Marker5', () => {
    const ar = useArStore()
    ar.onImageFound('marker_6')
    expect(ar.pendingMarker?.contentId).toBe(6)
    expect(ar.isActivated('marker_6')).toBe(false)
    ar.activate('marker_6')
    expect(ar.pendingMarker).toBeNull()
    expect(ar.isActivated('marker_5')).toBe(false)
    ar.onImageLost('marker_6')
    expect(ar.visibleMarkerNames.has('marker_6')).toBe(false)
    ar.onImageFound('marker_6')
    expect(ar.isActivated('marker_6')).toBe(true)
  })

  it('adjusts and exports Marker6 independently and uses the shipped animation clip', () => {
    expect(CONTENT_IDS).toContain(6)
    const store = useContentTransformStore()
    const previous5 = { ...store.get(5) }
    store.update(6, { scale: 0.25 })
    expect(JSON.parse(store.json)['6'].scale).toBe(0.25)
    expect(store.get(5)).toEqual(previous5)
    store.reset(6)
    expect(store.get(6).autoRotate).toBe(false)
    expect(JSON.parse(toJson(loadTransforms()))['6'].scale).toBe(0.18)
    const glb = readFileSync(asset('3dmodels/model6_h19_antitorque.glb'))
    expect(glb.toString('ascii', 0, 4)).toBe('glTF')
    const jsonLength = glb.readUInt32LE(12)
    const model = JSON.parse(glb.toString('utf8', 20, 20 + jsonLength))
    expect(model.animations.map((clip: { name: string }) => clip.name)).toEqual(['H19_AntiTorque_Loop_4s'])
  })
})
