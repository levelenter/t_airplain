import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { h, ref } from 'vue'
import ArContent from '../components/ArContent.vue'
import Contents3 from '../pages/Contents3.vue'
import { useArStore } from '../stores/ar'
import { AR_EFFECTS_ONLY_KEY } from '../utils/arPreview'
import { defaultTransform } from '../utils/contentTransform'

describe('useArStore effectsOnly', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('初期値は false、toggle で反転し、reset() 後も保持される', () => {
    const store = useArStore()
    expect(store.effectsOnly).toBe(false)
    store.toggleEffectsOnly()
    expect(store.effectsOnly).toBe(true)
    store.reset()
    expect(store.effectsOnly).toBe(true)
    store.setEffectsOnly(false)
    expect(store.effectsOnly).toBe(false)
  })
})

describe('ArContent airframeVisible', () => {
  const mountWith = (provide: Record<symbol, unknown>) =>
    mount(ArContent, {
      props: { markerName: 'marker_1', active: true, transform: defaultTransform(1), label: '' },
      slots: {
        default: (props: { airframeVisible: boolean }) =>
          h('a-entity', { class: 'model-stub', visible: props.airframeVisible ? 'true' : 'false' }),
      },
      global: { provide },
    })

  it('エフェクトのみ表示中は airframeVisible=false が slot に渡る', () => {
    const wrapper = mountWith({ [AR_EFFECTS_ONLY_KEY]: ref(true) })
    expect(wrapper.find('.model-stub').attributes('visible')).toBe('false')
  })

  it('provide が無ければ airframeVisible=true', () => {
    const wrapper = mountWith({})
    expect(wrapper.find('.model-stub').attributes('visible')).toBe('true')
  })
})

describe('Contents3 エフェクトのみ表示', () => {
  it('エンジン entity だけ隠し、グロー entity には visible を付けない', () => {
    const wrapper = mount(Contents3, {
      props: { markerName: 'marker_3', active: true, transform: defaultTransform(3) },
      global: { provide: { [AR_EFFECTS_ONLY_KEY]: ref(true) } },
    })
    const models = wrapper.findAll('a-entity[gltf-model]')
    expect(models.length).toBe(3)
    const engine = models.filter((e) => !e.attributes('additive-glow') && e.attributes('additive-glow') === undefined)
    expect(engine.length).toBe(1)
    expect(engine[0]!.attributes('visible')).toBe('false')
    const glows = models.filter((e) => e.attributes('additive-glow') !== undefined)
    expect(glows.length).toBe(2)
    for (const g of glows) expect(g.attributes('visible')).toBeUndefined()
  })
})
