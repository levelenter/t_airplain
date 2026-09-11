import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerGltfAnimation } from '../utils/aframeGltfAnimation'

afterEach(() => vi.unstubAllGlobals())

function setup(preloaded = true) {
  const clip = { name: 'Airflow_Loop_4s' }
  const model = { visible: true, animations: [clip] }
  const parent = { visible: true }
  let loaded = preloaded
  const el = Object.assign(document.createElement('div'), {
    object3D: { visible: true, parent },
    getObject3D: () => loaded ? model : undefined,
  })
  const play = vi.fn()
  const mixer = { clipAction: vi.fn(() => ({ play })), update: vi.fn(), stopAllAction: vi.fn(), uncacheRoot: vi.fn() }
  let definition: Record<string, (...args: unknown[]) => unknown> = {}
  const components: Record<string, unknown> = {}
  const registerComponent = vi.fn((name, value) => { definition = value; components[name] = value })
  vi.stubGlobal('AFRAME', { components, registerComponent, THREE: { AnimationMixer: class { constructor() { return mixer } } } })
  registerGltfAnimation()
  const component = { el, data: { enabled: true, clip: clip.name } }
  const run = (name: string, ...args: unknown[]) => definition[name]!.apply(component, args)
  run('init')
  return { run, component, mixer, model, parent, play, registerComponent, load: () => { loaded = true; el.dispatchEvent(new Event('model-loaded')) } }
}

describe('AR2 GLB animation lifecycle', () => {
  it('starts after an asynchronous load and updates in seconds only while visible and active', () => {
    const s = setup(false)
    s.run('tick', 0, 16)
    expect(s.mixer.update).not.toHaveBeenCalled()
    s.load()
    expect(s.play).toHaveBeenCalledOnce()
    s.run('tick', 100, 25)
    expect(s.mixer.update).toHaveBeenLastCalledWith(.025)
    s.component.data.enabled = false
    s.run('tick', 200, 25)
    s.component.data.enabled = true
    s.parent.visible = false
    s.run('tick', 300, 25)
    expect(s.mixer.update).toHaveBeenCalledTimes(1)
    s.parent.visible = true
    s.run('tick', 400, 25)
    expect(s.mixer.update).toHaveBeenCalledTimes(2)
  })

  it('handles a preloaded model, releases replaced models, and removes its listener on teardown', () => {
    const s = setup()
    expect(s.play).toHaveBeenCalledOnce()
    s.load()
    expect(s.mixer.stopAllAction).toHaveBeenCalledOnce()
    expect(s.mixer.uncacheRoot).toHaveBeenCalledWith(s.model)
    s.run('remove')
    expect(s.mixer.stopAllAction).toHaveBeenCalledTimes(2)
    s.load()
    expect(s.play).toHaveBeenCalledTimes(2)
  })

  it('does not register twice when the camera is reopened', () => {
    const s = setup()
    registerGltfAnimation()
    expect(s.registerComponent).toHaveBeenCalledOnce()
  })
})
