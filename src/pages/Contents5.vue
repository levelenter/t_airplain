<script setup lang="ts">
// コンテンツ5: ヘリコプター — /3dmodels/model5_helico.glb を表示
// モデル実寸は約 1260 単位。マーカー空間へ収める倍率は transform 側で持つ
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()

const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model5_helico.glb`
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="Helicopter">
    <a-entity :gltf-model="`url(${modelUrl})`"></a-entity>
  </ArContent>
</template>
