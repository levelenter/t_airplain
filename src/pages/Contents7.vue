<script setup lang="ts">
// Marker7: 緑色に発光する軌道（オービット）の光跡エフェクト。加算合成で光らせる。
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()
const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model7_wind_study.glb`
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="">
    <a-entity
      :gltf-model="`url(${modelUrl})`"
      :gltf-animation="`clip: Wind_Study_Loop_4s; enabled: ${active}`"
      additive-glow
    ></a-entity>
  </ArContent>
</template>
