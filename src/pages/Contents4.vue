<script setup lang="ts">
// コンテンツ4: ダグラス DC-3 — /3dmodels/douglas_dc_3.glb を表示
// モデル実寸は約 29 単位（全長方向）。胴体下端が沈まないよう少し持ち上げる
defineProps<{ markerName: string }>()
</script>

<template>
  <xrextras-named-image-target :name="markerName">
    <a-entity
      gltf-model="url(/3dmodels/douglas_dc_3.glb)"
      scale="0.03 0.03 0.03"
      position="0 0.15 0"
      animation="property: rotation; to: 0 360 0; dur: 12000; easing: linear; loop: true"
    ></a-entity>
    <a-text
      value="Douglas DC-3"
      position="0 0.7 0"
      align="center"
      color="#ffffff"
      width="2.4"
    ></a-text>
  </xrextras-named-image-target>
</template>
