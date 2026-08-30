<script setup lang="ts">
// コンテンツ3: ジェットエンジン — /3dmodels/model3_jet.glb を表示
// モデル実寸は約 13 単位（幅方向）
// active はタップ後に true になる。モデルは先に読み込んでおき visible だけ切り替える
defineProps<{ markerName: string; active: boolean }>()

const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model3_jet.glb`
</script>

<template>
  <xrextras-named-image-target :name="markerName">
    <a-entity :visible="active ? 'true' : 'false'">
      <a-entity
        :gltf-model="`url(${modelUrl})`"
        scale="0.07 0.07 0.07"
        position="0 0.1 0"
        animation="property: rotation; to: 0 360 0; dur: 12000; easing: linear; loop: true"
      ></a-entity>
      <a-text
        value="Jet Engine"
        position="0 0.7 0"
        align="center"
        color="#ffffff"
        width="2.4"
      ></a-text>
    </a-entity>
  </xrextras-named-image-target>
</template>
