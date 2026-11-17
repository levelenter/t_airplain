import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { MARKERS, type MarkerDefinition } from '@/utils/markers'

/**
 * AR セッションの状態（認識中マーカーなど）を保持するストア。
 *
 * マーカー名は src/utils/markers.ts の MARKERS（画像ARマーカー number_01〜06）で解決する。
 */
export const useArStore = defineStore('ar', () => {
  /** 現在カメラ内で認識されているマーカー名の集合 */
  const visibleMarkerNames = ref<Set<string>>(new Set())
  /** 最後に認識されたマーカー名（ロスト後も保持） */
  const lastFoundName = ref<string | null>(null)
  /** エンジン側に登録できたマーカー名 */
  const loadedMarkerNames = ref<string[]>([])
  /** タップ済みでコンテンツを表示してよいマーカー名 */
  const activatedMarkerNames = ref<Set<string>>(new Set())
  /** エフェクトのみ表示（機体・エンジンなど物体 entity を隠す）。画面をまたいで保持する */
  const effectsOnly = ref(false)
  function resolve(name: string | null): MarkerDefinition | null {
    if (!name) return null
    return MARKERS.find((m) => m.name === name) ?? null
  }

  const activeMarker = computed<MarkerDefinition | null>(() => {
    const name = [...visibleMarkerNames.value][0] ?? lastFoundName.value
    return resolve(name)
  })

  /**
   * 認識中だがまだタップされていないマーカー。
   * これが非 null の間は、コンテンツを出さずタップを促す表示を行う。
   */
  const pendingMarker = computed<MarkerDefinition | null>(() => {
    for (const name of visibleMarkerNames.value) {
      if (!activatedMarkerNames.value.has(name)) {
        return resolve(name)
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

  /** エフェクトのみ表示を反転する */
  function toggleEffectsOnly() {
    effectsOnly.value = !effectsOnly.value
  }

  /** エフェクトのみ表示を明示的に設定する */
  function setEffectsOnly(value: boolean) {
    effectsOnly.value = value
  }

  // reset() では effectsOnly をリセットしない（表示設定は画面をまたいで保持）
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
    effectsOnly,
    toggleEffectsOnly,
    setEffectsOnly,
    activeMarker,
    pendingMarker,
    isActivated,
    activate,
    onImageFound,
    onImageLost,
    reset,
  }
})
