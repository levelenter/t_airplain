<script setup lang="ts">
// コンテンツ2: アンリ・ファルマン機 — 回転するリングと球体のディスプレイ
defineProps<{ markerName: string }>()
</script>

<template>
  <xrextras-named-image-target :name="markerName">
    <a-entity position="0 0.3 0">
      <a-sphere radius="0.18" color="#2e6da4" metalness="0.3" roughness="0.4"></a-sphere>
      <a-torus
        radius="0.32"
        radius-tubular="0.015"
        color="#ffd54f"
        rotation="90 0 0"
        animation="property: rotation; to: 90 360 0; dur: 4000; easing: linear; loop: true"
      ></a-torus>
      <a-text
        value="Henri Farman"
        position="0 0.45 0"
        align="center"
        color="#ffffff"
        width="2.4"
      ></a-text>
    </a-entity>
  </xrextras-named-image-target>
</template>
