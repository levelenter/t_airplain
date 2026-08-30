<script setup lang="ts">
// コンテンツ5: ヘリコプター — /3dmodels/model5_helico.glb を表示
// モデル実寸は約 1260 単位。原点がやや下寄りのため少し持ち上げる
// active はタップ後に true になる。モデルは先に読み込んでおき visible だけ切り替える
defineProps<{ markerName: string; active: boolean }>()

const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model5_helico.glb`
</script>

<template>
  <xrextras-named-image-target :name="markerName">
    <a-entity :visible="active ? 'true' : 'false'">
      <a-entity
        :gltf-model="`url(${modelUrl})`"
        scale="0.0008 0.0008 0.0008"
        position="0 0.15 0"
        animation="property: rotation; to: 0 360 0; dur: 12000; easing: linear; loop: true"
      ></a-entity>
      <a-text
        value="Helicopter"
        position="0 0.7 0"
        align="center"
        color="#ffffff"
        width="2.4"
      ></a-text>
    </a-entity>
  </xrextras-named-image-target>
</template>
