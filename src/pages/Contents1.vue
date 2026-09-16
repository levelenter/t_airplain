<script setup lang="ts">
// Marker1: T-1Bのノーズ断面（静的）と、吸気口へ流れ込む光の流線（加算合成グロー）。
// 加算合成を機体にまで掛けると白飛びするため、機体と流線は別 GLB・別 entity に分けている。
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()
const noseUrl = `${import.meta.env.BASE_URL}3dmodels/model1_t1b_intake.glb`
const airflowUrl = `${import.meta.env.BASE_URL}3dmodels/model1_t1b_airflow_glow.glb`
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="T-1B / AIR INTAKE">
    <a-entity :gltf-model="`url(${noseUrl})`"></a-entity>
    <a-entity
      :gltf-model="`url(${airflowUrl})`"
      :gltf-animation="`clip: Intake_Glow_Loop_4s; enabled: ${active}`"
      additive-glow
    ></a-entity>
  </ArContent>
</template>
