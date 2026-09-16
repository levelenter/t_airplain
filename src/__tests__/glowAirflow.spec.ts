import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readGltfJson(file: string) {
  const blob = readFileSync(resolve('public/3dmodels', file))
  return JSON.parse(blob.toString('utf8', 20, 20 + blob.readUInt32LE(12)))
}

function nodeNames(model: { nodes: { name?: string }[] }): string[] {
  return model.nodes.map((node) => node.name ?? '')
}

/** 加算合成グロー用 GLB の共通条件（blender-orbit-glow スキルの finalize_glb.py が保証するもの） */
function expectUnlitGlow(model: ReturnType<typeof readGltfJson>, clip: string, meshCount: number) {
  expect(model.animations.map((item: { name: string }) => item.name)).toEqual([clip])
  expect(model.images).toBeUndefined()
  expect(model.meshes).toHaveLength(meshCount)
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
}

describe('Marker5 V-44 downwash glow', () => {
  it('keeps rotors and torque arrows in the airframe but drops the old arrows', () => {
    const model = readGltfJson('model5_v44_airflow.glb')
    expect(model.animations.map((clip: { name: string }) => clip.name)).toEqual(['V44_CounterRotation_Loop_4s'])
    const names = nodeNames(model)
    expect(names).toContain('Front rotor CCW')
    expect(names).toContain('Rear rotor CW')
    expect(names).toContain('Torque cancel right')
    expect(names.some((name) => /Dense helical|swirl arrow|outflow/i.test(name))).toBe(false)
  })

  it('ships four spinning glow columns, two per rotor', () => {
    const model = readGltfJson('model5_v44_airflow_glow.glb')
    expectUnlitGlow(model, 'V44_Downwash_Glow_Loop_4s', 32)
    const roots = nodeNames(model).filter((name) => name.startsWith('V44_Downwash_Root_'))
    expect(roots).toHaveLength(4)
    expect(model.animations[0].channels).toHaveLength(4)
  })
})

describe('Marker6 H-19 airflow glow', () => {
  it('keeps rotors, torque arc and tail force arrow in the airframe but drops the old ribbons', () => {
    const model = readGltfJson('model6_h19_antitorque.glb')
    expect(model.animations.map((clip: { name: string }) => clip.name)).toEqual(['H19_AntiTorque_Loop_4s'])
    const names = nodeNames(model)
    expect(names).toContain('H19 main rotor')
    expect(names).toContain('H19 tail rotor')
    expect(names).toContain('Tail reaction force +Y')
    expect(names.some((name) => /ribbon/i.test(name))).toBe(false)
  })

  it('ships blue main downwash and red tail airflow as two spinning groups', () => {
    const model = readGltfJson('model6_h19_airflow_glow.glb')
    expectUnlitGlow(model, 'H19_Airflow_Glow_Loop_4s', 46)
    const names = nodeNames(model)
    expect(names).toContain('H19_Main_Downwash_Root')
    expect(names).toContain('H19_Tail_Airflow_Root')
    expect(names.filter((name) => name.startsWith('H19_Downwash_Trail_'))).toHaveLength(26)
    expect(names.filter((name) => name.startsWith('H19_Tail_Trail_'))).toHaveLength(20)
    expect(model.animations[0].channels).toHaveLength(2)
  })
})
