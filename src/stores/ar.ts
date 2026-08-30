import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { findMarkerByName, type MarkerDefinition } from '@/utils/markers'

/** AR セッションの状態（認識中マーカーなど）を保持するストア */
export const useArStore = defineStore('ar', () => {
  /** 現在カメラ内で認識されているマーカー名の集合 */
  const visibleMarkerNames = ref<Set<string>>(new Set())
  /** 最後に認識されたマーカー名（ロスト後も保持） */
  const lastFoundName = ref<string | null>(null)
  /** XR8 に登録できたマーカー名 */
  const loadedMarkerNames = ref<string[]>([])
  /** タップ済みでコンテンツを表示してよいマーカー名 */
  const activatedMarkerNames = ref<Set<string>>(new Set())

  const activeMarker = computed<MarkerDefinition | null>(() => {
    const name = [...visibleMarkerNames.value][0] ?? lastFoundName.value
    return name ? (findMarkerByName(name) ?? null) : null
  })

  /**
   * 認識中だがまだタップされていないマーカー。
   * これが非 null の間は、コンテンツを出さずタップを促す表示を行う。
   */
  const pendingMarker = computed<MarkerDefinition | null>(() => {
    for (const name of visibleMarkerNames.value) {
      if (!activatedMarkerNames.value.has(name)) {
        return findMarkerByName(name) ?? null
      }
    }
    return null
  })

  /** そのマーカーのコンテンツを表示してよいか（= 一度タップされたか） */
  function isActivated(name: string): boolean {
    return activatedMarkerNames.value.has(name)
  }

  /** タップされたマーカーのコンテンツ表示を許可する */
  function activate(name: string) {
    activatedMarkerNames.value = new Set(activatedMarkerNames.value).add(name)
  }

  function onImageFound(name: string) {
    visibleMarkerNames.value = new Set(visibleMarkerNames.value).add(name)
    lastFoundName.value = name
  }

  function onImageLost(name: string) {
    const next = new Set(visibleMarkerNames.value)
    next.delete(name)
    visibleMarkerNames.value = next
  }

  function reset() {
    visibleMarkerNames.value = new Set()
    lastFoundName.value = null
    activatedMarkerNames.value = new Set()
  }

  return {
    visibleMarkerNames,
    lastFoundName,
    loadedMarkerNames,
    activatedMarkerNames,
    activeMarker,
    pendingMarker,
    isActivated,
    activate,
    onImageFound,
    onImageLost,
    reset,
  }
})
