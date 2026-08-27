import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import router from '../router'
import App from '../App.vue'
import StartView from '../pages/StartView.vue'

describe('App', () => {
  it('mounts and renders the start view', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    expect(wrapper.findComponent(StartView).exists()).toBe(true)
    expect(wrapper.text()).toContain('WebAR 体験')
  })
})
