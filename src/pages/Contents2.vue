<script setup lang="ts">
// コンテンツ2: セスナ — /3dmodels/model2_cessna.glb を表示
// モデル実寸は全幅約 1430 単位のため、マーカー空間（約1単位）に収まるよう scale で縮小する
// active はタップ後に true になる。モデルは先に読み込んでおき visible だけ切り替える
defineProps<{ markerName: string; active: boolean }>()

const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model2_cessna.glb`
</script>

<template>
  <xrextras-named-image-target :name="markerName">
    <a-entity :visible="active ? 'true' : 'false'">
      <a-entity
        :gltf-model="`url(${modelUrl})`"
        scale="0.0008 0.0008 0.0008"
        position="0 0.1 0"
        animation="property: rotation; to: 0 360 0; dur: 12000; easing: linear; loop: true"
      ></a-entity>
      <a-text
        value="Cessna"
        position="0 0.7 0"
        align="center"
        color="#ffffff"
        width="2.4"
      ></a-text>
    </a-entity>
  </xrextras-named-image-target>
</template>
