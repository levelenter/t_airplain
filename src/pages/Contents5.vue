<script setup lang="ts">
// Marker5: V-44の前後逆回転ローターと下向きの渦（説明用模式図）。
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()
const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model5_v44_airflow.glb`
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="V-44 / TANDEM ROTORS">
    <a-entity
      :gltf-model="`url(${modelUrl})`"
      :gltf-animation="`clip: V44_CounterRotation_Loop_4s; enabled: ${active}`"
    ></a-entity>
  </ArContent>
</template>
