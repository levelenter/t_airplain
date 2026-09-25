import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMarkerLostHysteresis } from '../utils/markerLostHysteresis'

describe('createMarkerLostHysteresis', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call onLost if markerFound arrives again within the grace period', () => {
    const onLost = vi.fn()
    const hysteresis = createMarkerLostHysteresis(onLost, 400)

    hysteresis.lost('marker_01')
    vi.advanceTimersByTime(200)
    hysteresis.found('marker_01')
    vi.advanceTimersByTime(1000)

    expect(onLost).not.toHaveBeenCalled()
  })

  it('calls onLost once the grace period elapses without a matching found', () => {
    const onLost = vi.fn()
    const hysteresis = createMarkerLostHysteresis(onLost, 400)

    hysteresis.lost('marker_01')
    vi.advanceTimersByTime(399)
    expect(onLost).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onLost).toHaveBeenCalledExactlyOnceWith('marker_01')
  })

  it('tracks each marker name independently', () => {
    const onLost = vi.fn()
    const hysteresis = createMarkerLostHysteresis(onLost, 400)

    hysteresis.lost('marker_01')
    hysteresis.lost('marker_02')
    hysteresis.found('marker_02')
    vi.advanceTimersByTime(400)

    expect(onLost).toHaveBeenCalledExactlyOnceWith('marker_01')
  })

  it('does not fire pending timers after dispose', () => {
    const onLost = vi.fn()
    const hysteresis = createMarkerLostHysteresis(onLost, 400)

    hysteresis.lost('marker_01')
    hysteresis.dispose()
    vi.advanceTimersByTime(1000)

    expect(onLost).not.toHaveBeenCalled()
  })
})
