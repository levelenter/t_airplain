<script setup lang="ts">
// コンテンツ2: T-6Gの翼断面・気流・揚力・上反角（説明用模式図）
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()

const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model2_t6g_wing_ar.glb`
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="T-6G">
    <a-entity
      :gltf-model="`url(${modelUrl})`"
      :gltf-animation="`clip: Airflow_Loop_4s; enabled: ${active}`"
    ></a-entity>
  </ArContent>
</template>
