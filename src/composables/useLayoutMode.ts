import { ref, type Ref } from 'vue'

/** AR 画面のレイアウトモード。landscape は端末を横に持つ前提、portrait は縦に持つ前提 */
export type LayoutMode = 'landscape' | 'portrait'

export const DEFAULT_LAYOUT_MODE: LayoutMode = 'landscape'
export const LAYOUT_MODE_STORAGE_KEY = 't_airplain.layoutMode'

function isLayoutMode(value: unknown): value is LayoutMode {
  return value === 'landscape' || value === 'portrait'
}

/** localStorage から復元する。使えない・不正値のときは既定値 */
function loadLayoutMode(): LayoutMode {
  try {
    const stored = window.localStorage.getItem(LAYOUT_MODE_STORAGE_KEY)
    return isLayoutMode(stored) ? stored : DEFAULT_LAYOUT_MODE
  } catch {
    return DEFAULT_LAYOUT_MODE
  }
}

/** 全画面で共有するモジュールスコープの状態 */
const layoutMode = ref<LayoutMode>(loadLayoutMode())

/** localStorage から読み直して状態へ反映する（主にテスト用） */
export function reloadLayoutMode(): void {
  layoutMode.value = loadLayoutMode()
}

function setLayoutMode(mode: LayoutMode): void {
  layoutMode.value = mode
  try {
    window.localStorage.setItem(LAYOUT_MODE_STORAGE_KEY, mode)
  } catch {
    // 保存できなくてもモード自体は切り替える
  }
}

export function useLayoutMode(): { layoutMode: Ref<LayoutMode>; setLayoutMode: (mode: LayoutMode) => void } {
  return { layoutMode, setLayoutMode }
}
