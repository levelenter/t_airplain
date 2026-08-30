import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  type ContentId,
  type ContentTransform,
  type ContentTransformMap,
  defaultTransform,
  loadTransforms,
  toJson,
} from '@/utils/contentTransform'

/**
 * コンテンツの配置調整値を保持するストア。
 * 初期値は src/config/content-transforms.json、以降は調整パネルからの編集を反映する。
 */
export const useContentTransformStore = defineStore('contentTransform', () => {
  const transforms = ref<ContentTransformMap>(loadTransforms())

  /** 配布用 JSON（そのまま src/config/content-transforms.json に貼れる形） */
  const json = computed(() => toJson(transforms.value))

  function get(id: ContentId): ContentTransform {
    return transforms.value[id]
  }

  function update(id: ContentId, patch: Partial<ContentTransform>) {
    transforms.value = {
      ...transforms.value,
      [id]: { ...transforms.value[id], ...patch },
    }
  }

  /** 1 つの軸だけ書き換える（パネルのスライダー用） */
  function updateAxis(id: ContentId, key: 'position' | 'rotation', axis: 0 | 1 | 2, value: number) {
    const next = [...transforms.value[id][key]] as [number, number, number]
    next[axis] = value
    update(id, { [key]: next })
  }

  /** そのコンテンツをコード上の既定値に戻す */
  function reset(id: ContentId) {
    update(id, defaultTransform(id))
  }

  /** 全コンテンツを JSON 読み込み直後の状態に戻す */
  function resetAll() {
    transforms.value = loadTransforms()
  }

  return { transforms, json, get, update, updateAxis, reset, resetAll }
})
