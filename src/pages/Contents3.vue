<script setup lang="ts">
// コンテンツ3: ジェットエンジン — /3dmodels/model3_jet.glb を表示
// モデル実寸は約 13 単位（幅方向）。マーカー空間へ収める倍率は transform 側で持つ
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()

const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model3_jet.glb`
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="Jet Engine">
    <a-entity :gltf-model="`url(${modelUrl})`"></a-entity>
  </ArContent>
</template>
