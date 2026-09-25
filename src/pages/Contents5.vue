<script setup lang="ts">
// Marker5: V-44の前後逆回転ローター（機体側）と、ローター下へ渦を巻いて降りる光の下降気流（加算合成グロー）。
// 前ローター＝青、後ローター＝ターコイズの色分けは流線側の頂点カラーで表現している。
import ArContent from '@/components/ArContent.vue'
import ExplanationPanel3D from '@/components/ExplanationPanel3D.vue'
import type { ContentTransform, Vec3 } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()
const airframeUrl = `${import.meta.env.BASE_URL}3dmodels/model5_v44_airflow.glb`
const downwashUrl = `${import.meta.env.BASE_URL}3dmodels/model5_v44_airflow_glow.glb`

/**
 * 解説パネル（ExplanationPanel3D）の配置。モデル・グローとは別 entity（ArContent の
 * hud スロット）に置かれるため、ここだけでヘリ機体に対する浮遊位置を調整できる。
 * ユーザー参考画像に合わせ、機体の右上に浮かぶ初期値にしている。
 */
const PANEL_POSITION: Vec3 = [0.45, 0.95, 0.35]
const PANEL_ROTATION: Vec3 = [0, -20, 0]
const PANEL_SCALE = 1
/** 幅のみ指定。高さは本文量から自動算出したアスペクト比で決まる */
const PANEL_WIDTH = 0.52

const PANEL_TITLE = 'V-44 バートル（タンデムローター）'
const PANEL_SUBTITLE = '2重反転風流＆トルク打ち消し'
const PANEL_BODY =
  '解説：前後のローターが互いに逆回転することで、それぞれのトルク（回転力）を打ち消します。\n' +
  'テールローターは不要です。2重反転による空気流は機体を安定させ、強力な揚力を生み出します。'
</script>

<template>
  <ArContent :marker-name="markerName" :active="active" :transform="transform" label="V-44 / TANDEM ROTORS" label-position="0 0.7 0.35">
    <a-entity
      :gltf-model="`url(${airframeUrl})`"
      :gltf-animation="`clip: V44_CounterRotation_Loop_4s; enabled: ${active}`"
    ></a-entity>
    <a-entity
      :gltf-model="`url(${downwashUrl})`"
      :gltf-animation="`clip: V44_Downwash_Glow_Loop_4s; enabled: ${active}`"
      additive-glow
    ></a-entity>

    <template #hud>
      <ExplanationPanel3D
        :title="PANEL_TITLE"
        :subtitle="PANEL_SUBTITLE"
        :body="PANEL_BODY"
        :position="PANEL_POSITION"
        :rotation="PANEL_ROTATION"
        :scale="PANEL_SCALE"
        :plane-width="PANEL_WIDTH"
      />
    </template>
  </ArContent>
</template>
