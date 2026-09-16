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

describe('Marker3 jet intake and afterburner glow', () => {
  it('keeps only the engine and spinning blades in the airframe', () => {
    const model = readGltfJson('model3_jet_airflow.glb')
    expect(model.animations.map((clip: { name: string }) => clip.name)).toEqual(['Jet_Airflow_Loop_4s'])
    const names = nodeNames(model)
    expect(names.some((name) => /moving streak|Exhaust|Plume envelope/.test(name))).toBe(false)
    expect(model.animations[0].channels).toHaveLength(6)
  })

  it('ships the intake as converging glow trails made with the wind technique', () => {
    const model = readGltfJson('model3_jet_intake_glow.glb')
    expectUnlitGlow(model, 'Jet_Intake_Glow_Loop_4s', 22)
    const names = nodeNames(model)
    expect(names).toContain('Jet_Intake_Root')
    expect(names.filter((name) => name.startsWith('Jet_Intake_Trail_'))).toHaveLength(22)
  })

  it('ships the afterburner as a spinning helix core in a straight cylinder, with streaks and shimmer', () => {
    const model = readGltfJson('model3_jet_afterburner_glow.glb')
    expectUnlitGlow(model, 'Jet_Afterburner_Glow_Loop_05s', 114)
    const names = nodeNames(model)
    for (const root of ['AB_Core_Root', 'AB_Streak_Root', 'AB_Shimmer_Root_A', 'AB_Shimmer_Root_B']) {
      expect(names).toContain(root)
    }
    expect(names.some((name) => /^AB_(Nozzle|Puff|Turb|Haze_Trail)/.test(name))).toBe(false)
    expect(names.filter((name) => name.startsWith('AB_Core_Trail_'))).toHaveLength(54)
    expect(names.filter((name) => /^AB_Streak_\d/.test(name))).toHaveLength(44)
    expect(names.filter((name) => /^AB_Shimmer_[AB]_\d/.test(name))).toHaveLength(16)
    // the core and the two shimmer groups spin about the axis, the streaks travel; nothing is static
    const channels = model.animations[0].channels as { target: { node: number; path: string } }[]
    const paths = channels.map((c) => c.target.path)
    expect(paths.filter((p) => p === 'translation')).toHaveLength(44)
    expect(paths.filter((p) => p === 'scale')).toHaveLength(44)
    expect(paths.filter((p) => p === 'rotation').length).toBeGreaterThanOrEqual(3)
    const animatedNodes = new Set(channels.map((c) => c.target.node))
    const parentOf = new Map<number, number>()
    model.nodes.forEach((node: { children?: number[] }, index: number) => {
      for (const child of node.children ?? []) parentOf.set(child, index)
    })
    model.nodes.forEach((node: { mesh?: number }, index: number) => {
      if (node.mesh === undefined) return
      expect(animatedNodes.has(index) || animatedNodes.has(parentOf.get(index) ?? -1)).toBe(true)
    })
  })
})

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
