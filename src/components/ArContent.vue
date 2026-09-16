<script setup lang="ts">
/**
 * 各コンテンツ共通の入れ物。
 *
 * 階層は次の通り。自動回転をユーザー指定の向きと別の階層に分けることで、
 * rotation を指定したまま回転させても互いに干渉しない。
 *
 *   named-image-target        マーカー追従（開発用プレビュー時は素の a-entity）
 *     └ visible               タップされるまで隠す
 *         ├ position/rotation/scale   ← 調整パネルの対象
 *         │   └ auto-spin             ← Y 軸の自動回転
 *         │       └ slot（モデル本体）
 *         └ a-text                    ラベル（倍率の影響を受けないよう外に置く）
 */
import { computed, inject } from 'vue'
import { AR_PREVIEW_KEY } from '@/utils/arPreview'
import { type ContentTransform, toScaleAttr, toVec3Attr } from '@/utils/contentTransform'

const props = defineProps<{
  markerName: string
  /** タップ済みで表示してよいか */
  active: boolean
  transform: ContentTransform
  /** モデル上に出す英字ラベル（A-Frame のフォントは日本語グリフ非対応） */
  label: string
}>()

/**
 * 開発用プレビュー（PreviewView）では XR8 が動いていないため、
 * マーカー追従の要素を素の a-entity に差し替えて原点に固定表示する。
 */
const isPreview = inject(AR_PREVIEW_KEY, false)
const rootTag = computed(() => (isPreview ? 'a-entity' : 'xrextras-named-image-target'))

const positionAttr = computed(() => toVec3Attr(props.transform.position))
const rotationAttr = computed(() => toVec3Attr(props.transform.rotation))
const scaleAttr = computed(() => toScaleAttr(props.transform.scale))
const autoSpinAttr = computed(() => `enabled: ${props.transform.autoRotate}; speed: 30`)
</script>

<template>
  <component :is="rootTag" :name="isPreview ? undefined : markerName">
    <a-entity :visible="active ? 'true' : 'false'">
      <a-entity :position="positionAttr" :rotation="rotationAttr" :scale="scaleAttr">
        <a-entity :auto-spin="autoSpinAttr">
          <slot />
        </a-entity>
      </a-entity>

      <a-text
        v-if="label"
        :value="label"
        position="0 0.7 0"
        align="center"
        color="#ffffff"
        width="2.4"
      ></a-text>
    </a-entity>
  </component>
</template>
