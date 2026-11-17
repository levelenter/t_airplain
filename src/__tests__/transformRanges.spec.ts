import { describe, expect, it } from 'vitest'
import {
  DEFAULT_POSITION_RANGE,
  DEFAULT_SCALE_RANGE,
  pickPositionRange,
  pickScaleRange,
  positionStep,
  widenPositionRange,
  widenScaleRange,
} from '../utils/transformRanges'

describe('transformRanges', () => {
  it('位置: 値を含む最小の範囲を選ぶ（境界は含む）', () => {
    expect(pickPositionRange([0, 0.15, 0])).toBe(1)
    expect(pickPositionRange([1, -1, 0])).toBe(1)
    expect(pickPositionRange([1.0001, 0, 0])).toBe(5)
    expect(pickPositionRange([0, -5, 0])).toBe(5)
    expect(pickPositionRange([0, 0, 5.1])).toBe(20)
    expect(pickPositionRange([0, -20, 0])).toBe(20)
  })

  it('位置: 最大範囲も超える値は最大範囲を返す', () => {
    expect(pickPositionRange([0, 100, 0])).toBe(20)
  })

  it('位置: step は範囲に比例する', () => {
    expect(positionStep(1)).toBeCloseTo(0.005)
    expect(positionStep(5)).toBeCloseTo(0.025)
    expect(positionStep(20)).toBeCloseTo(0.1)
  })

  it('位置: 広げるだけで自動では狭めない', () => {
    expect(widenPositionRange(1, [-10, 0, 0])).toBe(20)
    expect(widenPositionRange(20, [0.1, 0, 0])).toBe(20)
    expect(widenPositionRange(DEFAULT_POSITION_RANGE, [0.5, 0, 0])).toBe(1)
  })

  it('倍率: 値を含む最小の範囲を選ぶ（境界は含む）', () => {
    expect(pickScaleRange(0.3)).toBe(DEFAULT_SCALE_RANGE)
    expect(pickScaleRange(0.0001)).toBe(DEFAULT_SCALE_RANGE)
    expect(pickScaleRange(10)).toBe(DEFAULT_SCALE_RANGE)
    expect(pickScaleRange(10.5).max).toBe(3)
    expect(pickScaleRange(0.005)).toBe(DEFAULT_SCALE_RANGE)
    expect(pickScaleRange(1000).max).toBe(3)
  })

  it('倍率: 最大範囲を超える値は最大範囲、下限未満は最小範囲', () => {
    expect(pickScaleRange(5000).max).toBe(3)
    expect(pickScaleRange(0.00001)).toBe(DEFAULT_SCALE_RANGE)
  })

  it('倍率: 広げるだけで自動では狭めない', () => {
    const wide = pickScaleRange(30)
    expect(wide.max).toBe(3)
    expect(widenScaleRange(DEFAULT_SCALE_RANGE, 30)).toBe(wide)
    expect(widenScaleRange(wide, 0.3)).toBe(wide)
  })
})
