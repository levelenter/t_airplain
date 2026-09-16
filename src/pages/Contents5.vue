<script setup lang="ts">
// Marker5: V-44の前後逆回転ローター（機体側）と、ローター下へ渦を巻いて降りる光の下降気流（加算合成グロー）。
// 前ローター＝青、後ローター＝ターコイズの色分けは流線側の頂点カラーで表現している。
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()
const airframeUrl = `${import.meta.env.BASE_URL}3dmodels/model5_v44_airflow.glb`
const downwashUrl = `${import.meta.env.BASE_URL}3dmodels/model5_v44_airflow_glow.glb`
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="V-44 / TANDEM ROTORS">
    <a-entity
      :gltf-model="`url(${airframeUrl})`"
      :gltf-animation="`clip: V44_CounterRotation_Loop_4s; enabled: ${active}`"
    ></a-entity>
    <a-entity
      :gltf-model="`url(${downwashUrl})`"
      :gltf-animation="`clip: V44_Downwash_Glow_Loop_4s; enabled: ${active}`"
      additive-glow
    ></a-entity>
  </ArContent>
</template>
