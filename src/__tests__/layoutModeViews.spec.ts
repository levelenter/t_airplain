import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import router from '../router'
import StartView from '../pages/StartView.vue'
import RotateDevicePrompt from '../components/RotateDevicePrompt.vue'
import { installMemoryLocalStorage } from './memoryStorage'
import { reloadLayoutMode, useLayoutMode } from '../composables/useLayoutMode'

/** 端末の向きを差し替えられる matchMedia のスタブ */
function stubOrientation(portrait: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>()
  const mql = {
    matches: portrait,
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
  }
  vi.stubGlobal('matchMedia', () => mql)
  window.matchMedia = (() => mql) as unknown as typeof window.matchMedia
  return {
    rotate(nextPortrait: boolean) {
      mql.matches = nextPortrait
      listeners.forEach((cb) => cb({ matches: nextPortrait } as MediaQueryListEvent))
    },
    listenerCount: () => listeners.size,
  }
}

beforeEach(() => {
  installMemoryLocalStorage()
  window.localStorage.clear()
  reloadLayoutMode()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('StartView の画面の向き切り替え', () => {
  async function mountStart() {
    router.push('/')
    await router.isReady()
    return mount(StartView, { global: { plugins: [createPinia(), router] } })
  }

  it('初期選択は横向き', async () => {
    const wrapper = await mountStart()
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios).toHaveLength(2)
    expect(radios[0]!.text()).toContain('横向き')
    expect(radios[0]!.attributes('aria-checked')).toBe('true')
    expect(radios[1]!.attributes('aria-checked')).toBe('false')
  })

  it('縦向きを選ぶとモードが変わる', async () => {
    const wrapper = await mountStart()
    await wrapper.findAll('[role="radio"]')[1]!.trigger('click')
    expect(useLayoutMode().layoutMode.value).toBe('portrait')
    expect(wrapper.findAll('[role="radio"]')[1]!.attributes('aria-checked')).toBe('true')
  })
})

describe('RotateDevicePrompt', () => {
  it('横向きモード×縦持ちで表示される', async () => {
    stubOrientation(true)
    const wrapper = mount(RotateDevicePrompt)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('端末を横向きにしてください')
  })

  it('端末が横向きになると消え、アンマウントで購読を解除する', async () => {
    const stub = stubOrientation(true)
    const wrapper = mount(RotateDevicePrompt)
    stub.rotate(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('端末を横向きにしてください')
    wrapper.unmount()
    expect(stub.listenerCount()).toBe(0)
  })

  it('端末が横向きなら表示されない', () => {
    stubOrientation(false)
    expect(mount(RotateDevicePrompt).text()).toBe('')
  })

  it('縦向きモードでは表示されない', () => {
    stubOrientation(true)
    useLayoutMode().setLayoutMode('portrait')
    expect(mount(RotateDevicePrompt).text()).toBe('')
  })

  it('「縦向きのまま使う」でモードが portrait になり消える', async () => {
    stubOrientation(true)
    const wrapper = mount(RotateDevicePrompt)
    await wrapper.vm.$nextTick()
    await wrapper.find('button').trigger('click')
    expect(useLayoutMode().layoutMode.value).toBe('portrait')
    expect(wrapper.text()).toBe('')
  })
})
