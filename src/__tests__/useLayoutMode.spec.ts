import { beforeEach, describe, expect, it } from 'vitest'
import { installMemoryLocalStorage } from './memoryStorage'
import {
  LAYOUT_MODE_STORAGE_KEY,
  reloadLayoutMode,
  useLayoutMode,
} from '../composables/useLayoutMode'

describe('useLayoutMode', () => {
  beforeEach(() => {
    installMemoryLocalStorage()
    window.localStorage.clear()
    reloadLayoutMode()
  })

  it('既定値は landscape', () => {
    expect(useLayoutMode().layoutMode.value).toBe('landscape')
  })

  it('切り替えると localStorage に保存される', () => {
    const { layoutMode, setLayoutMode } = useLayoutMode()
    setLayoutMode('portrait')
    expect(layoutMode.value).toBe('portrait')
    expect(window.localStorage.getItem(LAYOUT_MODE_STORAGE_KEY)).toBe('portrait')
  })

  it('保存済みの値を復元する', () => {
    window.localStorage.setItem(LAYOUT_MODE_STORAGE_KEY, 'portrait')
    reloadLayoutMode()
    expect(useLayoutMode().layoutMode.value).toBe('portrait')
  })

  it('不正値は既定値にフォールバックする', () => {
    window.localStorage.setItem(LAYOUT_MODE_STORAGE_KEY, 'diagonal')
    reloadLayoutMode()
    expect(useLayoutMode().layoutMode.value).toBe('landscape')
  })
})
