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

  const activeMarker = computed<MarkerDefinition | null>(() => {
    const name = [...visibleMarkerNames.value][0] ?? lastFoundName.value
    return name ? (findMarkerByName(name) ?? null) : null
  })

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
  }

  return {
    visibleMarkerNames,
    lastFoundName,
    loadedMarkerNames,
    activeMarker,
    onImageFound,
    onImageLost,
    reset,
  }
})
