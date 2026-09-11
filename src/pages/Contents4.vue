<script setup lang="ts">
// コンテンツ4: C-1輸送機 — /3dmodels/model4_C1_set.glb を表示
// モデル実寸は約 29 単位（全長方向）。マーカー空間へ収める倍率は transform 側で持つ
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()

const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model4_C1_set.glb`
</script>

<template>
  <ArContent
    :marker-name="markerName"
    :active="active"
    :transform="transform"
    label="Kawasaki C-1"
  >
    <a-entity :gltf-model="`url(${modelUrl})`"></a-entity>
  </ArContent>
</template>
