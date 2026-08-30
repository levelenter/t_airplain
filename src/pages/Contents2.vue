<script setup lang="ts">
// コンテンツ2: セスナ — /3dmodels/model2_cessna.glb を表示
// モデル実寸は全幅約 1430 単位。マーカー空間（約1単位）へ収める倍率は transform 側で持つ
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()

const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model2_cessna.glb`
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="Cessna">
    <a-entity :gltf-model="`url(${modelUrl})`"></a-entity>
  </ArContent>
</template>
