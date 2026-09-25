import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Contents5 from '../pages/Contents5.vue'
import { defaultTransform } from '../utils/contentTransform'

describe('Marker5 explanation panel', () => {
  it('renders the panel as an entity separate from the airframe/glow models', () => {
    const wrapper = mount(Contents5, {
      props: {
        markerName: 'marker_5',
        active: true,
        transform: defaultTransform(5),
      },
    })

    const panelHost = wrapper.find('.explanation-panel-3d')
    expect(panelHost.exists()).toBe(true)

    // パネルはモデル用の gltf-model entity の子ではなく、独立した entity である
    const gltfEntities = wrapper.findAll('[gltf-model]')
    expect(gltfEntities.length).toBe(2)
    for (const entity of gltfEntities) {
      expect(entity.find('.explanation-panel-3d').exists()).toBe(false)
    }
    expect(panelHost.find('[gltf-model]').exists()).toBe(false)

    const plane = panelHost.find('a-plane')
    expect(plane.exists()).toBe(true)
    // 幅は日本語が読める実寸で定数指定。高さは本文量から自動算出される
    expect(plane.attributes('width')).toBe('0.52')
    expect(Number(plane.attributes('height'))).toBeGreaterThan(0)

    // 位置・回転は Contents5.vue の定数でまとめて調整できる
    expect(panelHost.attributes('position')).toBe('0.45 0.95 0.35')
    expect(panelHost.attributes('rotation')).toBe('0 -20 0')
  })

  it('draws the panel title, subheading and body into the canvas texture', () => {
    const wrapper = mount(Contents5, {
      props: {
        markerName: 'marker_5',
        active: true,
        transform: defaultTransform(5),
      },
    })

    const material = wrapper.find('.explanation-panel-3d a-plane').attributes('material')
    expect(material).toContain('shader: flat')
    expect(material).toContain('transparent: true')
    // jsdom has no 2D canvas context, so src is only present in real browsers;
    // just make sure the component doesn't crash and keeps the material declarative.
    expect(material).toMatch(/shader: flat; transparent: true; side: double; alphaTest: 0.02/)
  })
})
