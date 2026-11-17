import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NumberField from '../components/NumberField.vue'

/**
 * jsdom は type=number の値を setValue 時に正規化し、「-」や「1.」を空にしてしまう。
 * 実ブラウザでは欄の表示文字列はそのまま残るため、欄の見た目の検証では type を text にして再現する。
 */
function asTextInput(el: HTMLInputElement) {
  el.type = 'text'
}

function setup(props: Record<string, unknown> = {}) {
  const wrapper = mount(NumberField, { props: { modelValue: 0.5, ...props } })
  const input = wrapper.get('input')
  const el = input.element as HTMLInputElement
  const emitted = () => (wrapper.emitted('update:modelValue') ?? []).map((e) => e[0])
  return { wrapper, input, el, emitted }
}

describe('NumberField', () => {
  it('-, -1, -10 と打っても欄が書き換わらず、-10 が通知される', async () => {
    const { wrapper, input, el, emitted } = setup()
    await input.trigger('focus')

    await input.setValue('-')
    // 「-」の時点では通知されず、欄も書き換わらない
    expect(emitted()).toEqual([])
    await input.setValue('-1')
    await wrapper.setProps({ modelValue: -1 })
    expect(el.value).toBe('-1')
    await input.setValue('-10')
    await wrapper.setProps({ modelValue: -10 })

    expect(emitted()).toEqual([-1, -10])
    expect(el.value).toBe('-10')
  })

  it('「1.」の途中状態では通知せず欄が保たれる', async () => {
    const { wrapper, input, el, emitted } = setup()
    asTextInput(el)
    await input.trigger('focus')
    await input.setValue('1.')
    await wrapper.setProps({ modelValue: 0.5 })
    expect(emitted()).toEqual([])
    expect(el.value).toBe('1.')
  })

  it('blur で不正な下書きが元の値に戻る', async () => {
    const { input, el } = setup({ modelValue: 0.25 })
    asTextInput(el)
    await input.trigger('focus')
    await input.setValue('-')
    await input.trigger('blur')
    expect(el.value).toBe('0.25')
  })

  it('min 指定時は 0 や負の数を通知しない', async () => {
    const { input, emitted } = setup({ modelValue: 0.3, min: 0 })
    await input.trigger('focus')
    await input.setValue('0')
    await input.setValue('-2')
    expect(emitted()).toEqual([])
    await input.setValue('30')
    expect(emitted()).toEqual([30])
  })

  it('フォーカス外では外部の値に追従する', async () => {
    const { wrapper, el } = setup({ modelValue: 0.5 })
    expect(el.value).toBe('0.5')
    await wrapper.setProps({ modelValue: 2 })
    expect(el.value).toBe('2')
  })

  it('フォーカス中は外部の値で上書きしない', async () => {
    const { wrapper, input, el } = setup({ modelValue: 0.5 })
    asTextInput(el)
    await input.trigger('focus')
    await input.setValue('-')
    await wrapper.setProps({ modelValue: 7 })
    expect(el.value).toBe('-')
  })

  it('表示は不要な桁を出さない', () => {
    expect(setup({ modelValue: 0.123456, digits: 4 }).el.value).toBe('0.1235')
    expect(setup({ modelValue: 0.1, digits: 4 }).el.value).toBe('0.1')
    expect(setup({ modelValue: 0.0008, significant: 4 }).el.value).toBe('0.0008')
  })
})
