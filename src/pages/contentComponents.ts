import type { ContentId } from '@/utils/contentTransform'
import Contents1 from './Contents1.vue'
import Contents2 from './Contents2.vue'
import Contents3 from './Contents3.vue'
import Contents4 from './Contents4.vue'
import Contents5 from './Contents5.vue'
import Contents6 from './Contents6.vue'
import Contents7 from './Contents7.vue'

/**
 * コンテンツ番号 → コンポーネントの対応表。
 * 実機の CameraView と PC 用の PreviewView の両方から同じものを使う。
 */
export const CONTENT_COMPONENTS = {
  1: Contents1,
  2: Contents2,
  3: Contents3,
  4: Contents4,
  5: Contents5,
  6: Contents6,
  7: Contents7,
} as const satisfies Record<ContentId, unknown>
