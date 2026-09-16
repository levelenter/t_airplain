<script setup lang="ts">
// Marker6: H-19のメインローター反作用とテールローターの横押し。
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()
const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model6_h19_antitorque.glb`
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="H-19 / ANTI-TORQUE">
    <a-entity
      :gltf-model="`url(${modelUrl})`"
      :gltf-animation="`clip: H19_AntiTorque_Loop_4s; enabled: ${active}`"
    ></a-entity>
  </ArContent>
</template>
