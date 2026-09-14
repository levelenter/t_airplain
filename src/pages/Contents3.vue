<script setup lang="ts">
// コンテンツ3: ジェットエンジンの吸気・排気（説明用模式表現）
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()

const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model3_jet_airflow.glb`
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="Jet Engine">
    <a-entity
      :gltf-model="`url(${modelUrl})`"
      :gltf-animation="`clip: Jet_Airflow_Loop_4s; enabled: ${active}`"
    ></a-entity>
  </ArContent>
</template>
