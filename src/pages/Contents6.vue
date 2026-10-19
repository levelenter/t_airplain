<script setup lang="ts">
// Marker6: H-19の機体・ローター・トルク矢印（機体側）と、青い下降気流・赤いテールローター気流（加算合成グロー）。
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()
const airframeUrl = `${import.meta.env.BASE_URL}3dmodels/model6_h19_antitorque.glb`
const airflowUrl = `${import.meta.env.BASE_URL}3dmodels/model6_h19_airflow_glow.glb`
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="H-19 / ANTI-TORQUE">
    <template #default="{ airframeVisible }">
      <!-- 機体（additive-glow 無し）はエフェクトのみ表示の間隠す -->
      <a-entity
        :gltf-model="`url(${airframeUrl})`"
        :gltf-animation="`clip: H19_AntiTorque_Loop_4s; enabled: ${active}`"
        :visible="airframeVisible ? 'true' : 'false'"
      ></a-entity>
      <a-entity
        :gltf-model="`url(${airflowUrl})`"
        :gltf-animation="`clip: H19_Airflow_Glow_Loop_4s; enabled: ${active}`"
        additive-glow
      ></a-entity>
    </template>
  </ArContent>
</template>
