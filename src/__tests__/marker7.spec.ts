import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { MARKERS } from '../utils/markers'
import { CONTENT_IDS, loadTransforms } from '../utils/contentTransform'
import { useArStore } from '../stores/ar'
import { useContentTransformStore } from '../stores/contentTransform'

it('registers the independent wind study, target resources and adjustable placement', () => {
  setActivePinia(createPinia())
  expect(MARKERS.map((marker) => marker.contentId)).toEqual([...CONTENT_IDS])
  const target = JSON.parse(readFileSync(resolve('public/image-targets/marker_7.json'), 'utf8'))
  expect(target.name).toBe('marker_7')
  expect(existsSync(resolve('public', target.imagePath))).toBe(true)
  for (const resource of Object.values(target.resources)) {
    expect(existsSync(resolve('public/image-targets', String(resource)))).toBe(true)
  }
  const ar = useArStore()
  ar.onImageFound('marker_7')
  expect(ar.pendingMarker?.contentId).toBe(7)
  ar.activate('marker_7')
  expect(ar.pendingMarker).toBeNull()
  expect(ar.isActivated('marker_6')).toBe(false)
  const transforms = useContentTransformStore()
  transforms.update(7, { scale: 0.3 })
  expect(JSON.parse(transforms.json)['7'].scale).toBe(0.3)
  expect(loadTransforms()[7].autoRotate).toBe(false)
})

it('ships a self-contained translucent wind asset with a four-second animation', () => {
  const blob = readFileSync(resolve('public/3dmodels/model7_wind_study.glb'))
  const model = JSON.parse(blob.toString('utf8', 20, 20 + blob.readUInt32LE(12)))
  expect(model.animations.map((clip: { name: string }) => clip.name)).toEqual(['Wind_Study_Loop_4s'])
  expect(model.images).toBeUndefined()
  expect(model.meshes).toHaveLength(20)
  expect(model.extensionsUsed).toContain('KHR_materials_unlit')
  for (const material of model.materials) {
    expect(material.alphaMode).toBe('BLEND')
    expect(material.doubleSided).toBe(true)
    expect(material.extensions?.KHR_materials_unlit).toBeDefined()
  }
})
