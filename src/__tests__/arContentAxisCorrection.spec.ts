import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import ArContent from '../components/ArContent.vue'
import { AR_MARKER_AR_KEY } from '../utils/arPreview'
import { defaultTransform } from '../utils/contentTransform'

/**
 * ArContent はコンテンツを rootTag > visible > axis-correction > position/rotation/scale
 * の階層で包む。axis-correction は AR.js 画面（isMarkerAr）でだけ rotation="-90 0 0" になり、
 * それ以外（8th Wall / プレビュー）では無回転のまま挙動が変わらないことを確認する。
 *
 * rotation="-90 0 0" は、コンテンツの +Y（画像マーカー版の「画像の上」）を
 * マーカー座標の -Z（壁に貼ったマーカー画像の上方向）へ、コンテンツの +Z（画像から外向き）を
 * マーカー座標の +Y（マーカーから外向き＝壁の手前）へ写すための軸合わせ。
 */
describe('ArContent axis correction', () => {
  it('wraps content with no extra rotation for the 8th Wall / preview screens', () => {
    const wrapper = mount(ArContent, {
      props: {
        markerName: 'marker_1',
        active: true,
        transform: defaultTransform(1),
        label: '',
      },
      slots: { default: () => h('a-entity', { class: 'model-stub' }) },
    })

    // findAll('a-entity')[0] は「visible」用のラップ entity、[1] が axis-correction entity
    const axisCorrection = wrapper.findAll('a-entity')[1]
    expect(axisCorrection?.attributes('rotation')).toBe('0 0 0')
  })

  it('wraps content with rotation="-90 0 0" for the AR.js pattern marker screen', () => {
    const wrapper = mount(ArContent, {
      props: {
        markerName: 'marker_01',
        active: true,
        transform: defaultTransform(1),
        label: '',
      },
      slots: { default: () => h('a-entity', { class: 'model-stub' }) },
      global: {
        provide: { [AR_MARKER_AR_KEY]: true },
      },
    })

    expect(wrapper.element.tagName.toLowerCase()).toBe('a-marker')

    const axisCorrection = wrapper.findAll('a-entity')[1]
    expect(axisCorrection?.attributes('rotation')).toBe('-90 0 0')
  })
})
