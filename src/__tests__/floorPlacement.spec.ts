import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import router from '../router'
import StartView from '../pages/StartView.vue'
import ArHudHeader from '../components/ArHudHeader.vue'
import { installMemoryLocalStorage } from './memoryStorage'
import { reloadLayoutMode } from '../composables/useLayoutMode'
import { intersectFloor, sideViewYaw } from '../utils/floorPlacement'

describe('intersectFloor', () => {
  const camera = { x: 0, y: 2, z: 2 }

  it('真下を向くとカメラの真下が交点になる', () => {
    const hit = intersectFloor(camera, { x: 0, y: -1, z: 0 }, 10)
    expect(hit).toMatchObject({ x: 0, z: 2, clamped: false })
    expect(hit!.distance).toBeCloseTo(0)
  })

  it('斜め下向き（前方 -Z・45度）では高さ分だけ前方に交点ができる', () => {
    const hit = intersectFloor(camera, { x: 0, y: -1, z: -1 }, 10)
    expect(hit!.x).toBeCloseTo(0)
    expect(hit!.z).toBeCloseTo(0)
    expect(hit!.distance).toBeCloseTo(2)
    expect(hit!.clamped).toBe(false)
  })

  it('方向ベクトルは正規化されていなくてもよい', () => {
    const hit = intersectFloor(camera, { x: 0, y: -5, z: -5 }, 10)
    expect(hit!.z).toBeCloseTo(0)
  })

  it('水平・上向きの視線では交点がない', () => {
    expect(intersectFloor(camera, { x: 0, y: 0, z: -1 }, 10)).toBeNull()
    expect(intersectFloor(camera, { x: 0, y: 1, z: -1 }, 10)).toBeNull()
  })

  it('カメラが床より下、または方向が零ベクトルなら交点がない', () => {
    expect(intersectFloor({ x: 0, y: -1, z: 0 }, { x: 0, y: -1, z: 0 }, 10)).toBeNull()
    expect(intersectFloor(camera, { x: 0, y: 0, z: 0 }, 10)).toBeNull()
  })

  it('遠すぎる交点は最大距離にクランプされ、方位は保たれる', () => {
    // ほぼ水平: 交点は 2/0.05 = 40 先
    const hit = intersectFloor({ x: 1, y: 2, z: 1 }, { x: 0, y: -0.05, z: -1 }, 8)
    expect(hit!.clamped).toBe(true)
    expect(hit!.distance).toBeGreaterThan(8)
    expect(hit!.x).toBeCloseTo(1)
    expect(hit!.z).toBeCloseTo(1 - 8, 5)
  })
})

describe('sideViewYaw', () => {
  it('カメラが -Z を向く配置では 0（機首 +X がそのまま右）', () => {
    expect(sideViewYaw({ x: 0, z: 2 }, { x: 0, z: 0 })).toBeCloseTo(0)
  })

  it('機首（+X を yaw 回転した向き）が、カメラから見て右を向く', () => {
    const cases = [
      { cam: { x: 0, z: 0 }, target: { x: 3, z: 0 } }, // +X 方向を見る → 右は +Z
      { cam: { x: 0, z: 0 }, target: { x: 0, z: 3 } }, // +Z 方向を見る → 右は -X
      { cam: { x: 1, z: 1 }, target: { x: -2, z: -3 } },
    ]
    for (const { cam, target } of cases) {
      const yaw = sideViewYaw(cam, target)
      const nose = { x: Math.cos(yaw), z: -Math.sin(yaw) }
      const dx = target.x - cam.x
      const dz = target.z - cam.z
      const len = Math.hypot(dx, dz)
      const right = { x: -dz / len, z: dx / len }
      expect(nose.x).toBeCloseTo(right.x)
      expect(nose.z).toBeCloseTo(right.z)
    }
  })

  it('カメラと同位置なら 0', () => {
    expect(sideViewYaw({ x: 1, z: 1 }, { x: 1, z: 1 })).toBe(0)
  })
})

describe('床面配置 AR の導線', () => {
  beforeEach(() => {
    installMemoryLocalStorage()
    window.localStorage.clear()
    reloadLayoutMode()
  })

  it('floor-ar ルートが登録されている', () => {
    const route = router.getRoutes().find((r) => r.name === 'floor-ar')
    expect(route?.path).toBe('/floor-ar')
  })

  it('StartView のボタンで floor-ar へ遷移する（debug クエリを引き継ぐ）', async () => {
    const push = vi.spyOn(router, 'push').mockResolvedValue(undefined)
    await router.replace('/?debug=true')
    await router.isReady()
    const wrapper = mount(StartView, { global: { plugins: [createPinia(), router] } })
    const button = wrapper.findAll('button').find((b) => b.text().includes('C-1輸送機を床に置く'))
    expect(button).toBeTruthy()
    await button!.trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'floor-ar', query: { debug: 'true' } })
    push.mockRestore()
  })
})

describe('ArHudHeader の showEffectsToggle', () => {
  const props = { activeTitle: null, hintText: 'h', isDebug: false, panelOpen: false, effectsOnly: false }

  it('既定ではトグルを描画する', () => {
    expect(mount(ArHudHeader, { props }).text()).toContain('エフェクトのみ')
  })

  it('false ならトグルを描画しない', () => {
    expect(mount(ArHudHeader, { props: { ...props, showEffectsToggle: false } }).text()).not.toContain(
      'エフェクトのみ',
    )
  })
})
