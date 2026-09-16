import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

function readGltfJson(file: string) {
  const blob = readFileSync(resolve('public/3dmodels', file))
  return JSON.parse(blob.toString('utf8', 20, 20 + blob.readUInt32LE(12)))
}

it('ships the T-1B nose as a static model without the old baked arrows', () => {
  const model = readGltfJson('model1_t1b_intake.glb')
  expect(model.animations).toBeUndefined()
  expect(model.images).toBeUndefined()
  const names = model.nodes.map((node: { name?: string }) => node.name ?? '')
  expect(names.some((name: string) => /Air arrow|intake path/i.test(name))).toBe(false)
})

it('ships the intake airflow as an unlit additive glow with a four-second loop', () => {
  const model = readGltfJson('model1_t1b_airflow_glow.glb')
  expect(model.animations.map((clip: { name: string }) => clip.name)).toEqual(['Intake_Glow_Loop_4s'])
  expect(model.images).toBeUndefined()
  expect(model.meshes).toHaveLength(17)
  expect(model.extensionsUsed).toContain('KHR_materials_unlit')
  for (const material of model.materials) {
    expect(material.alphaMode).toBe('BLEND')
    expect(material.doubleSided).toBe(true)
    expect(material.extensions?.KHR_materials_unlit).toBeDefined()
  }
  for (const mesh of model.meshes) {
    for (const primitive of mesh.primitives) {
      expect(primitive.attributes.COLOR_0).toBeDefined()
    }
  }
})
