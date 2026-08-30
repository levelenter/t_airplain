import { computed, type ComputedRef } from 'vue'
import { useRoute, type LocationQueryRaw } from 'vue-router'

/**
 * `?debug=true` が付いているかどうか。
 * 画面遷移でも維持したいので、遷移時は debugQuery() をそのまま query に渡す。
 */
export function useDebugMode(): ComputedRef<boolean> {
  const route = useRoute()
  return computed(() => route.query.debug === 'true')
}

/** 遷移先へ引き継ぐクエリ（デバッグ中でなければ空） */
export function useDebugQuery(): ComputedRef<LocationQueryRaw> {
  const isDebug = useDebugMode()
  return computed(() => (isDebug.value ? { debug: 'true' } : {}))
}
