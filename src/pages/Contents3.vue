<script setup lang="ts">
// コンテンツ3: ジェットエンジンの断面（機体側）と、吸気口へ吸い込まれる光の流線・アフターバーナーの青白い炎（加算合成グロー）。
// 吸気は風エフェクト用スキル（blender-orbit-glow）の手法、炎は専用スキル（blender-afterburner）で生成した別 GLB。
// 加算合成を機体にまで掛けると白飛びするため、光の entity にだけ additive-glow を付ける。
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()

const engineUrl = `${import.meta.env.BASE_URL}3dmodels/model3_jet_airflow.glb`
const intakeUrl = `${import.meta.env.BASE_URL}3dmodels/model3_jet_intake_glow.glb`
const afterburnerUrl = `${import.meta.env.BASE_URL}3dmodels/model3_jet_afterburner_glow.glb`
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="Jet Engine">
    <a-entity
      :gltf-model="`url(${engineUrl})`"
      :gltf-animation="`clip: Jet_Airflow_Loop_4s; enabled: ${active}`"
    ></a-entity>
    <a-entity
      :gltf-model="`url(${intakeUrl})`"
      :gltf-animation="`clip: Jet_Intake_Glow_Loop_4s; enabled: ${active}`"
      additive-glow
    ></a-entity>
    <a-entity
      :gltf-model="`url(${afterburnerUrl})`"
      :gltf-animation="`clip: Jet_Afterburner_Glow_Loop_2s; enabled: ${active}`"
      additive-glow
    ></a-entity>
  </ArContent>
</template>
