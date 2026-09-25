import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { AR_MARKERS, type MarkerDefinition } from '@/utils/markers'

/**
 * AR セッションの状態（認識中マーカーなど）を保持するストア。
 *
 * 8th Wall 版（CameraView / 画像マーカー）と AR.js 版（MarkerArView / 番号マーカー）は
 * 認識エンジンこそ違うが「見えているマーカー」「タップ済みか」の状態管理は共通のため、
 * このストアを両画面で共有する。マーカーの定義一覧（名前→タイトル/contentId）だけが
 * 画面ごとに異なるので、setMarkerSource で差し替える（既定は 8th Wall の AR_MARKERS）。
 */
export const useArStore = defineStore('ar', () => {
  /** 現在カメラ内で認識されているマーカー名の集合 */
  const visibleMarkerNames = ref<Set<string>>(new Set())
  /** 最後に認識されたマーカー名（ロスト後も保持） */
  const lastFoundName = ref<string | null>(null)
  /** エンジン側に登録できたマーカー名（8th Wall のみ使用） */
  const loadedMarkerNames = ref<string[]>([])
  /** タップ済みでコンテンツを表示してよいマーカー名 */
  const activatedMarkerNames = ref<Set<string>>(new Set())
  /** 現在の画面が使うマーカー定義一覧。既定は 8th Wall の画像マーカー */
  const markerSource = ref<MarkerDefinition[]>(AR_MARKERS)

  /** 画面ごとのマーカー定義一覧に差し替える（AR.js 画面は MARKER_AR_MARKERS を渡す） */
  function setMarkerSource(markers: MarkerDefinition[]) {
    markerSource.value = markers
  }

  function resolve(name: string | null): MarkerDefinition | null {
    if (!name) return null
    return markerSource.value.find((m) => m.name === name) ?? null
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
    markerSource,
    setMarkerSource,
    activeMarker,
    pendingMarker,
    isActivated,
    activate,
    onImageFound,
    onImageLost,
    reset,
  }
})
