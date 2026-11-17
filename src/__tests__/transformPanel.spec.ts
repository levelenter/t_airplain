import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TransformPanel from '../components/TransformPanel.vue'
import { useContentTransformStore } from '../stores/contentTransform'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useContentTransformStore()
  const wrapper = mount(TransformPanel, {
    props: { contentId: 1, title: 'テスト' },
    global: { plugins: [pinia] },
  })
  return { store, wrapper }
}

describe('TransformPanel', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('位置に -10 を入力するとストアが -10 になり、範囲チップが ±20 に切り替わる', async () => {
    const { store, wrapper } = setup()
    const field = wrapper.get('input[aria-label="位置 X の値"]')
    await field.trigger('focus')
    await field.setValue('-')
    await field.setValue('-10')

    expect(store.get(1).position[0]).toBe(-10)
    const pressed = wrapper.findAll('[aria-label="位置スライダーの範囲"] button[aria-pressed="true"]')
    expect(pressed.map((b) => b.text())).toEqual(['±20'])
    const slider = wrapper.get('input[type="range"][aria-label="位置 X"]').element as HTMLInputElement
    expect(slider.max).toBe('20')
  })

  it('＋ボタンで位置が 0.005 増える', async () => {
    const { store, wrapper } = setup()
    const before = store.get(1).position[0]
    await wrapper.get('button[aria-label="X を増やす"]').trigger('click')
    expect(store.get(1).position[0]).toBeCloseTo(before + 0.005, 6)
  })

  it('倍率に 30 を入力するとストアが 30 になり、範囲が 0.01〜1000 に切り替わる', async () => {
    const { store, wrapper } = setup()
    const field = wrapper.get('input[aria-label="倍率の値"]')
    await field.trigger('focus')
    await field.setValue('30')

    expect(store.get(1).scale).toBe(30)
    const pressed = wrapper.findAll('[aria-label="倍率スライダーの範囲"] button[aria-pressed="true"]')
    expect(pressed.map((b) => b.text())).toEqual(['0.01〜1000'])
  })
})
