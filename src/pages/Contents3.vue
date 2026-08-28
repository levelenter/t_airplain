<script setup lang="ts">
// コンテンツ3: ジェットエンジン — /3dmodels/jet_engine.glb を表示
// モデル実寸は約 13 単位（幅方向）
defineProps<{ markerName: string }>()
</script>

<template>
  <xrextras-named-image-target :name="markerName">
    <a-entity
      gltf-model="url(/3dmodels/jet_engine.glb)"
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
  </xrextras-named-image-target>
</template>
