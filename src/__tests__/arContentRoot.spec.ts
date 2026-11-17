import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import ArContent from '../components/ArContent.vue'
import { AR_PREVIEW_KEY } from '../utils/arPreview'
import { defaultTransform } from '../utils/contentTransform'

/**
 * ArContent のルート要素は、AR 画面では 8th Wall の xrextras-named-image-target
 * （name にターゲット名）、開発用プレビューでは素の a-entity になることを確認する。
 */
describe('ArContent root element', () => {
  const mountWith = (provide: Record<symbol, unknown>) =>
    mount(ArContent, {
      props: { markerName: 'number_01', active: true, transform: defaultTransform(1), label: '' },
      slots: { default: () => h('a-entity', { class: 'model-stub' }) },
      global: { provide },
    })

  it('follows the 8th Wall image target named after the marker on the AR screen', () => {
    const wrapper = mountWith({})
    expect(wrapper.element.tagName.toLowerCase()).toBe('xrextras-named-image-target')
    expect(wrapper.attributes('name')).toBe('number_01')
  })

  it('falls back to a plain entity without a target name in the developer preview', () => {
    const wrapper = mountWith({ [AR_PREVIEW_KEY]: true })
    expect(wrapper.element.tagName.toLowerCase()).toBe('a-entity')
    expect(wrapper.attributes('name')).toBeUndefined()
  })
})
